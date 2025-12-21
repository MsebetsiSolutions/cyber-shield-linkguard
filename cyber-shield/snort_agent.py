import subprocess
import time
import re
import requests
import json
import os
import sys
from datetime import datetime
import shutil

# Configuration (environment or defaults)
SERVER = os.environ.get('MONITOR_SERVER', 'http://127.0.0.1:5000')
API_KEY = os.environ.get('MONITOR_TOKEN', '')
SNORT_INTERFACE = os.environ.get('SNORT_INTERFACE', 'eth0')
# Default to a simple command name so users who installed snort system-wide work without changing this.
SNORT_PATH = os.environ.get('SNORT_PATH', 'snort')
# Default conf path (can be overridden via SNORT_CONF env var)
SNORT_CONF = os.environ.get('SNORT_CONF', '/etc/snort/snort.conf')

HEADERS = { 'Content-Type': 'application/json' }
if API_KEY:
    HEADERS['Authorization'] = f'Bearer {API_KEY}'

# Regex to parse Snort console alerts (multi-line blocks)
SNORT_REGEX = re.compile(
    r'\[\*\*\]\s+\[(?P<gid>\d+):(?P<sid>\d+):(?P<rev>\d+)\]\s+(?P<message>.*?)\s+\[\*\*\]\s*\n'
    r"\[Priority:\s+(?P<priority>\d+)\]\s+\{(?P<protocol>\w+)\}\s+(?P<src>[\d\.]+:[0-9]+)\s+->\s+(?P<dst>[\d\.]+:[0-9]+)",
    re.DOTALL
)


def send_to_soc(alert):
    url = SERVER.rstrip('/') + '/api/monitoring/snort/push'
    try:
        r = requests.post(url, headers=HEADERS, json=alert, timeout=5)
        if not r.ok:
            print('[WARN] push failed:', r.status_code, r.text)
            return False
        return True
    except Exception as e:
        print('[ERROR] could not push alert to SOC:', e)
        return False


def parse_snort_alert(block):
    m = SNORT_REGEX.search(block)
    if not m:
        return None
    now = datetime.utcnow().isoformat() + 'Z'
    return {
        'timestamp': now,
        'priority': m.group('priority'),
        'classification': f"{m.group('gid')}:{m.group('sid')}:{m.group('rev')}",
        'message': m.group('message').strip(),
        'source': m.group('src'),
        'destination': m.group('dst'),
        'protocol': m.group('protocol'),
        'gid': m.group('gid'),
        'sid': m.group('sid'),
        'rev': m.group('rev')
    }


def _resolve_snort_path():
    """Try to resolve the snort executable to an absolute path.

    Checks in order:
      - environment `SNORT_PATH` as literal path
      - `shutil.which(SNORT_PATH)` (works if SNORT_PATH is a command name)
      - `shutil.which('snort')`
    Returns the path or None if not found.
    """
    # If SNORT_PATH appears to be an absolute or relative path, check file existence
    try:
        p = SNORT_PATH
        if os.path.isabs(p) or os.path.sep in p:
            if os.path.exists(p):
                return p
        # otherwise try which on the provided name
        w = shutil.which(p)
        if w:
            return w
        # lastly try generic 'snort'
        w2 = shutil.which('snort')
        if w2:
            return w2
    except Exception:
        pass
    return None


def run_snort_live():
    print('[INFO] starting snort (live)')
    path = _resolve_snort_path()
    if not path:
        print('[ERROR] snort binary not found.')
        print(f"Tried SNORT_PATH='{SNORT_PATH}'.\nPlease install Snort or set the SNORT_PATH environment variable to the snort executable.\nOn Windows consider running Snort under WSL2 or a Linux VM.\nExample (PowerShell): $env:SNORT_PATH='C:\\\\Snort\\\\bin\\\\snort.exe' ; python snort_agent.py")
        return
    try:
        proc = subprocess.Popen([path, '-A', 'console', '-i', SNORT_INTERFACE, '-c', SNORT_CONF], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    except Exception as e:
        print('[ERROR] failed to start snort:', e)
        return

    buffer = ''
    try:
        for line in proc.stdout:
            buffer += line
            if line.strip() == '':
                alert = parse_snort_alert(buffer)
                if alert:
                    print('\n===== SNORT ALERT =====')
                    print(json.dumps(alert, indent=2))
                    send_to_soc(alert)
                buffer = ''
    except KeyboardInterrupt:
        print('[INFO] interrupted, stopping')
    except Exception as e:
        print('[ERROR] reading snort output failed:', e)
    finally:
        try:
            proc.terminate()
        except Exception:
            pass


def replay_pcap(pcap_path):
    print('[INFO] replaying pcap through snort:', pcap_path)
    path = _resolve_snort_path()
    if not path:
        print('[ERROR] snort binary not found. Cannot replay pcap.')
        return
    try:
        proc = subprocess.Popen([path, '-A', 'console', '-c', SNORT_CONF, '-r', pcap_path], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    except Exception as e:
        print('[ERROR] failed to start snort replay:', e)
        return

    buf = ''
    try:
        for line in proc.stdout:
            buf += line
            if line.strip() == '':
                a = parse_snort_alert(buf)
                if a:
                    print(json.dumps(a))
                    send_to_soc(a)
                buf = ''
    except Exception as e:
        print('[ERROR] reading replay output:', e)


if __name__ == '__main__':
    if '--replay' in sys.argv:
        idx = sys.argv.index('--replay')
        pcap = None
        if len(sys.argv) > idx + 1:
            pcap = sys.argv[idx + 1]
        if not pcap:
            print('Usage: snort_agent.py --replay <pcapfile>')
            sys.exit(2)
        replay_pcap(pcap)
        sys.exit(0)

    try:
        run_snort_live()
    except KeyboardInterrupt:
        print('\n[INFO] stopped by user')

