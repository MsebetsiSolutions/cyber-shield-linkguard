"""
Minimal agent that posts network interface counters to the server.
Usage:
  set env MONITOR_SERVER (e.g. http://localhost:5000)
  set env MONITOR_TOKEN (optional)
  python agent.py

This is a simple scaffold for testing. Persist `agent_id` to 'agent_id.txt' so the server can identify the agent across restarts.
"""
import time
import uuid
import json
import os
import sys
import tempfile
import socket

try:
    import psutil
    import requests
except Exception as e:
    print('Missing dependency:', e)
    print('Install requirements: pip install requests psutil')
    sys.exit(1)

# Auto-detect server URL based on environment
if os.environ.get('PRODUCTION', '').lower() == 'true':
    SERVER = 'https://www.linkguard.co.za'
    print("Running in PRODUCTION mode")
else:
    SERVER = os.environ.get('MONITOR_SERVER', 'http://127.0.0.1:5000')
    print("Running in DEVELOPMENT mode")

TOKEN = os.environ.get('MONITOR_TOKEN', '')
INTERVAL = int(os.environ.get('MONITOR_INTERVAL', '5'))
ID_FILE = os.path.join(os.path.dirname(__file__), 'agent_id.txt')

HEADERS = {'Content-Type': 'application/json'}
if TOKEN:
    HEADERS['Authorization'] = f'Bearer {TOKEN}'

print(f"Agent connecting to server: {SERVER}")


def load_or_create_agent_id():
    if os.path.exists(ID_FILE):
        try:
            with open(ID_FILE, 'r') as f:
                return f.read().strip()
        except Exception:
            pass
    aid = str(uuid.uuid4())
    try:
        with open(ID_FILE, 'w') as f:
            f.write(aid)
    except Exception:
        pass
    return aid


def register(agent_id):
    url = SERVER.rstrip('/') + '/api/monitoring/agent/register'
    payload = {
        'agent_id': agent_id,
        'hostname': socket.gethostname(),
        # advertise how often this agent reports metrics (seconds)
        'metrics_interval': INTERVAL
    }
    try:
        r = requests.post(url, json=payload, headers=HEADERS, timeout=10, verify=True)
        print('register ->', r.status_code, r.text)
        return r.ok
    except Exception as e:
        print('register error', e)
        return False


def read_counters():
    net = psutil.net_io_counters(pernic=False)
    return {'bytes_sent': net.bytes_sent, 'bytes_recv': net.bytes_recv}


def send_metrics(agent_id):
    url = SERVER.rstrip('/') + '/api/monitoring/agent/metrics'
    counters = read_counters()
    # include metrics_interval so the server/UI can learn our reporting cadence
    payload = {
        'agent_id': agent_id,
        'timestamp': time.time(),
        'counters': counters,
        'metrics_interval': INTERVAL
    }
    try:
        r = requests.post(url, json=payload, headers=HEADERS, timeout=10, verify=True)
        if not r.ok:
            print('metrics post failed:', r.status_code, r.text)
    except Exception as e:
        print('metrics error', e)


def capture_and_upload_pcap(duration=20, max_packets=None, iface=None, agent_id=None):
    """Capture a short pcap using scapy and upload it to the server `/api/monitoring/upload`.
    Returns True on success.
    """
    try:
        # import scapy lazily so agent can still run without it for metrics-only mode
        from scapy.all import sniff, wrpcap
    except Exception as e:
        print('scapy not available or cannot sniff:', e)
        return False

    try:
        pkts = sniff(timeout=duration, count=max_packets, iface=iface)
    except Exception as e:
        print('sniff error:', e)
        return False

    if not pkts:
        print('no packets captured')
        return False

    tmp = None
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pcap')
        tmp.close()
        wrpcap(tmp.name, pkts)
        url = SERVER.rstrip('/') + '/api/monitoring/upload'
        with open(tmp.name, 'rb') as fh:
            files = {'pcap': fh}
            # include agent_id as form field so server can associate the upload
            data = {'agent_id': agent_id} if agent_id else {}
            hdrs = {k: v for k, v in HEADERS.items() if k.lower() != 'content-type'}
            try:
                r = requests.post(url, files=files, data=data, headers=hdrs, timeout=30, verify=True)
                print('pcap upload ->', r.status_code, r.text)
                return r.ok
            except Exception as e:
                print('pcap upload error', e)
                return False
    finally:
        try:
            if tmp is not None and os.path.exists(tmp.name):
                os.unlink(tmp.name)
        except Exception:
            pass


def poll_commands(agent_id):
    """Poll server for commands and execute them. Currently supports 'capture' command."""
    try:
        url = SERVER.rstrip('/') + f"/api/monitoring/agent/commands?agent_id={agent_id}"
        r = requests.get(url, headers=HEADERS, timeout=10, verify=True)
        if not r.ok:
            return
        j = r.json()
        cmds = j.get('commands', [])
        for c in cmds:
            cmd = c.get('command')
            args = c.get('args', {}) or {}
            if cmd == 'capture':
                dur = int(args.get('duration', 20) or 20)
                iface = args.get('iface') or None
                print(f"Executing capture command: duration={dur} iface={iface}")
                capture_and_upload_pcap(duration=dur, iface=iface, agent_id=agent_id)
            else:
                print('unknown command from server:', cmd)
    except Exception as e:
        # ignore polling errors
        print('command poll error', e)


def main():
    agent_id = load_or_create_agent_id()
    print('Agent id:', agent_id)
    print('Server URL:', SERVER)
    ok = register(agent_id)
    if not ok:
        print('Register failed or server not reachable; will continue sending metrics.')
    # support a one-shot capture CLI: python agent.py --capture
    if '--capture' in sys.argv or '--capture-once' in sys.argv:
        success = capture_and_upload_pcap(duration=20, agent_id=agent_id)
        print('capture completed, success=', success)
        return

    # main loop: send metrics, poll for commands
    while True:
        send_metrics(agent_id)
        try:
            poll_commands(agent_id)
        except Exception:
            pass
        time.sleep(INTERVAL)


if __name__ == '__main__':
    main()