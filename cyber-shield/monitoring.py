from flask import request, Blueprint, jsonify, send_file
from scapy.all import rdpcap
import sqlite3
import json
import subprocess
import threading
import re
from datetime import datetime

# scapy functions used for optional packet parsing and sniffing
try:
    from scapy.all import IP, TCP, sr1, send, sniff
    _SCAPY_AVAILABLE = True
except Exception:
    IP = None; TCP = None; sr1 = None; send = None; sniff = None
    _SCAPY_AVAILABLE = False

import socket
import os
import uuid
import tempfile
import time
from collections import deque
import concurrent.futures
import threading
import sys

# Live sniffer globals
_SNIFFER_THREAD = None
_SNIFFER_RUNNING = False
_SNIFFER_LOCK = threading.Lock()
_SNIFFER_COUNTERS = {'sent': 0, 'recv': 0, 'other': 0}

# recent packet summaries captured by the live sniffer (newest first)
_SNIFFER_PACKETS = deque(maxlen=1000)
# simple incremental packet index for numbering
_SNIFFER_PKT_IDX = 0

# Agent id used for the local sniffer so the existing chart code can read from it
_LOCAL_SNIFFER_AGENT_ID = 'local_sniffer'
_LOCAL_ADDRS = set()

monitor_bp = Blueprint('monitor', __name__)


def _packet_summary(pkt, idx):
    try:
        ts = float(getattr(pkt, 'time', 0.0) or 0.0)
    except Exception:
        ts = 0.0

    src_ip = ''
    dst_ip = ''
    proto = 'Other'
    tcp = None
    udp = None

    try:
        if pkt.haslayer('IP'):
            ip = pkt.getlayer('IP')
            src_ip = getattr(ip, 'src', '')
            dst_ip = getattr(ip, 'dst', '')
        elif pkt.haslayer('IPv6'):
            ip = pkt.getlayer('IPv6')
            src_ip = getattr(ip, 'src', '')
            dst_ip = getattr(ip, 'dst', '')

        if pkt.haslayer('TCP'):
            proto = 'TCP'
            t = pkt.getlayer('TCP')
            tcp = {'src_port': getattr(t, 'sport', None), 'dst_port': getattr(t, 'dport', None), 'flags': str(getattr(t, 'flags', ''))}
        elif pkt.haslayer('UDP'):
            proto = 'UDP'
            u = pkt.getlayer('UDP')
            udp = {'src_port': getattr(u, 'sport', None), 'dst_port': getattr(u, 'dport', None)}
        elif pkt.haslayer('ICMP'):
            proto = 'ICMP'
    except Exception:
        pass

    length = len(bytes(pkt))
    info = f"{proto} packet"

    return {
        'no': idx + 1,
        'timestamp': ts,
        'src_ip': src_ip,
        'dst_ip': dst_ip,
        'protocol': proto,
        'length': length,
        'info': info,
        'tcp': tcp,
        'udp': udp
    }


def _analyze_packet_and_generate_alerts(pkt):
    """Analyze packet for suspicious patterns and generate alerts if needed.
    
    Detects:
    - Port scanning (multiple ports to same dst in short window)
    - Unusual protocols on standard ports
    - Suspicious TCP flags
    - Large packet payloads
    """
    try:
        alerts = []
        
        # Extract packet info
        src_ip = ''
        dst_ip = ''
        src_port = None
        dst_port = None
        proto = 'Other'
        flags = ''
        length = len(bytes(pkt))
        
        if pkt.haslayer('IP'):
            ip = pkt.getlayer('IP')
            src_ip = getattr(ip, 'src', '')
            dst_ip = getattr(ip, 'dst', '')
        
        if pkt.haslayer('TCP'):
            proto = 'TCP'
            t = pkt.getlayer('TCP')
            src_port = getattr(t, 'sport', None)
            dst_port = getattr(t, 'dport', None)
            flags = str(getattr(t, 'flags', ''))
        elif pkt.haslayer('UDP'):
            proto = 'UDP'
            u = pkt.getlayer('UDP')
            src_port = getattr(u, 'sport', None)
            dst_port = getattr(u, 'dport', None)
        
        # Rule 1: Suspicious TCP flags (SYN+FIN, SYN+RST, or FIN+RST)
        if proto == 'TCP' and flags:
            suspicious_flags = {'SF', 'SR', 'FR'}
            if any(f in flags for f in suspicious_flags):
                alerts.append({
                    'title': f'Suspicious TCP Flags: {flags}',
                    'severity': 'Medium',
                    'msg': f'{src_ip}:{src_port} -> {dst_ip}:{dst_port} with flags {flags}',
                    'src': src_ip,
                    'dst': dst_ip,
                    'proto': proto,
                    'risk': 55
                })
        
        # Rule 2: Common port scanning pattern (non-ephemeral src port to many dsts)
        if proto == 'TCP' and dst_port in [80, 443, 22, 21, 23, 3389, 25]:
            if src_port and src_port < 1024 and src_port not in [80, 443, 22, 21, 23, 25]:
                alerts.append({
                    'title': 'Possible Port Scan Activity',
                    'severity': 'Low',
                    'msg': f'{src_ip}:{src_port} -> {dst_ip}:{dst_port} (low src port to standard port)',
                    'src': src_ip,
                    'dst': dst_ip,
                    'proto': proto,
                    'risk': 25
                })
        
        # Rule 3: Large packet (potential exfiltration or attack)
        if length > 5000:
            alerts.append({
                'title': 'Large Packet Detected',
                'severity': 'Low',
                'msg': f'{src_ip}:{src_port} -> {dst_ip}:{dst_port} - {length} bytes',
                'src': src_ip,
                'dst': dst_ip,
                'proto': proto,
                'risk': 30
            })
        
        # Rule 4: Traffic to unusual ports (not common)
        if proto in ['TCP', 'UDP'] and dst_port:
            unusual_ports = [4444, 5555, 6666, 7777, 8888, 9999, 31337]
            if dst_port in unusual_ports:
                alerts.append({
                    'title': f'Traffic to Unusual Port: {dst_port}',
                    'severity': 'Medium',
                    'msg': f'{src_ip}:{src_port} -> {dst_ip}:{dst_port}',
                    'src': src_ip,
                    'dst': dst_ip,
                    'proto': proto,
                    'risk': 60
                })
        
        return alerts
    except Exception:
        return []


def _store_sniffer_alert_to_db(alert):
    """Store a packet-analysis alert to soc_dashboard.db alerts table."""
    try:
        dbpath = os.path.join(os.getcwd(), 'soc_dashboard.db')
        conn = sqlite3.connect(dbpath)
        cur = conn.cursor()
        now = datetime.utcnow().isoformat() + 'Z'
        title = alert.get('title', 'Sniffer Alert')
        severity = alert.get('severity', 'Low')
        description = alert.get('msg', '')
        tags = json.dumps(['sniffer', 'autogen'])
        mitre = json.dumps([])
        artifacts = json.dumps([
            {'type': 'ip', 'value': alert.get('src', '')},
            {'type': 'ip', 'value': alert.get('dst', '')}
        ])
        # allow caller to override source (e.g. quick_scan)
        source = alert.get('source', 'sniffer')
        # optional numeric risk score
        risk = alert.get('risk', None)
        status = 'New'
        cur.execute(
            """
            INSERT INTO alerts (title,severity,status,owner,created_at,updated_at,tags,mitre,artifacts,source,description,risk)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                title,
                severity,
                status,
                '',
                now,
                now,
                tags,
                mitre,
                artifacts,
                source,
                description,
                risk,
            ),
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def _sniffer_packet_callback(pkt):
    """Called by scapy for each sniffed packet; increment a local counter.

    We keep a simple total-bytes counter per-second. The sniffer loop will
    sample and push one aggregated sample per second into `_AGENT_METRICS` so
    the existing chart can render it.
    """
    try:
        b = len(bytes(pkt))
    except Exception:
        b = 0

    # extract src/dst addresses if available
    src = None
    dst = None
    try:
        if pkt.haslayer('IP'):
            ip = pkt.getlayer('IP')
            src = getattr(ip, 'src', None)
            dst = getattr(ip, 'dst', None)
        elif pkt.haslayer('IPv6'):
            ip6 = pkt.getlayer('IPv6')
            src = getattr(ip6, 'src', None)
            dst = getattr(ip6, 'dst', None)
    except Exception:
        src = None; dst = None

    with _SNIFFER_LOCK:
        try:
            # classify by local addresses
            if src and src.split('%')[0] in _LOCAL_ADDRS and (not dst or dst.split('%')[0] not in _LOCAL_ADDRS):
                _SNIFFER_COUNTERS['sent'] += b
            elif dst and dst.split('%')[0] in _LOCAL_ADDRS and (not src or src.split('%')[0] not in _LOCAL_ADDRS):
                _SNIFFER_COUNTERS['recv'] += b
            elif src and dst and src.split('%')[0] in _LOCAL_ADDRS and dst.split('%')[0] in _LOCAL_ADDRS:
                # local loopback/interface-local traffic: split evenly
                half = b // 2
                _SNIFFER_COUNTERS['sent'] += half
                _SNIFFER_COUNTERS['recv'] += (b - half)
            else:
                # unknown direction: count as other
                _SNIFFER_COUNTERS['other'] += b
        except Exception:
            _SNIFFER_COUNTERS['other'] += b
        # also store a summarized packet for the live UI (keep small)
        try:
            global _SNIFFER_PKT_IDX
            summary = _packet_summary(pkt, _SNIFFER_PKT_IDX)
            # include a truncated raw hex dump for the bytes pane
            try:
                raw = bytes(pkt).hex()
                # limit to first 4096 bytes (hex chars) to avoid huge payloads
                if len(raw) > 8192:
                    raw = raw[:8192]
                summary['raw_bytes'] = raw
            except Exception:
                summary['raw_bytes'] = ''
            _SNIFFER_PKT_IDX = (_SNIFFER_PKT_IDX + 1) % 1000000000
            # newest first for easy UI insertion
            _SNIFFER_PACKETS.appendleft(summary)
        except Exception:
            pass
    
    # Analyze packet for suspicious patterns and generate alerts
    try:
        generated_alerts = _analyze_packet_and_generate_alerts(pkt)
        for alert in generated_alerts:
            _store_sniffer_alert_to_db(alert)
    except Exception:
        pass


def _sniffer_loop():
    """Background thread: sniff packets in 1s windows and push metrics.

    Each second we take the accumulated bytes, build a sample structure
    compatible with the UI's expected metrics (`bytes_sent` and
    `bytes_recv`) and append it to the `_AGENT_METRICS` deque for
    `_LOCAL_SNIFFER_AGENT_ID`.
    """
    global _SNIFFER_RUNNING
    # ensure metrics structures exist
    _AGENT_REGISTRY.setdefault(_LOCAL_SNIFFER_AGENT_ID, {'hostname': 'local-sniffer', 'last_seen': time.time()})
    _AGENT_METRICS.setdefault(_LOCAL_SNIFFER_AGENT_ID, deque(maxlen=_MAX_METRIC_SAMPLES))

    while _SNIFFER_RUNNING:
        start = time.time()
        # sniff for 1 second (timeout); store=False to avoid building lists
        try:
            sniff(timeout=1, prn=_sniffer_packet_callback, store=False)
        except Exception:
            # sniff may fail if permissions or libs are missing; sleep then continue
            time.sleep(1)

        # sample and push metrics (use classified counters)
        with _SNIFFER_LOCK:
            sent_bytes = _SNIFFER_COUNTERS.get('sent', 0)
            recv_bytes = _SNIFFER_COUNTERS.get('recv', 0)
            other_bytes = _SNIFFER_COUNTERS.get('other', 0)
            # reset counters
            _SNIFFER_COUNTERS['sent'] = 0
            _SNIFFER_COUNTERS['recv'] = 0
            _SNIFFER_COUNTERS['other'] = 0

        # include 'other' in both directions proportionally (split)
        half_other = int(other_bytes // 2)
        sent = int(sent_bytes + half_other)
        recv = int(recv_bytes + (other_bytes - half_other))
        sample = {'ts': time.time(), 'bytes_sent': sent, 'bytes_recv': recv}
        dq = _AGENT_METRICS.setdefault(_LOCAL_SNIFFER_AGENT_ID, deque(maxlen=_MAX_METRIC_SAMPLES))
        dq.append(sample)
        # update registry last_seen
        _AGENT_REGISTRY.setdefault(_LOCAL_SNIFFER_AGENT_ID, {'hostname': 'local-sniffer', 'last_seen': time.time()})
        _AGENT_REGISTRY[_LOCAL_SNIFFER_AGENT_ID]['last_seen'] = time.time()


def start_sniffer():
    """Start the background sniffer thread. Returns True if started."""
    global _SNIFFER_THREAD, _SNIFFER_RUNNING
    global _LOCAL_ADDRS
    if not _SCAPY_AVAILABLE:
        return False, 'scapy not available'
    if _SNIFFER_RUNNING:
        return True, 'already running'
    # detect local interface addresses for direction classification
    addrs = set()
    try:
        try:
            import psutil
            for ifname, ifaddrs in psutil.net_if_addrs().items():
                for a in ifaddrs:
                    fam = getattr(a, 'family', None)
                    if fam and (fam == getattr(__import__('socket'), 'AF_INET') or fam == getattr(__import__('socket'), 'AF_INET6')):
                        addr = getattr(a, 'address', None)
                        if addr:
                            addrs.add(addr.split('%')[0])
        except Exception:
            # fallback to hostname resolution
            try:
                hn = socket.gethostname()
                res = socket.gethostbyname_ex(hn)
                for r in (res[2] if isinstance(res, tuple) and len(res) > 2 else []):
                    addrs.add(r)
            except Exception:
                pass
    except Exception:
        pass
    # always include loopback
    addrs.add('127.0.0.1')
    addrs.add('::1')
    _LOCAL_ADDRS = addrs
    _SNIFFER_RUNNING = True
    _SNIFFER_THREAD = threading.Thread(target=_sniffer_loop, daemon=True)
    _SNIFFER_THREAD.start()
    return True, 'started'


def stop_sniffer():
    """Stop the background sniffer thread. Returns True if stopped or not running."""
    global _SNIFFER_THREAD, _SNIFFER_RUNNING
    if not _SNIFFER_RUNNING:
        return True, 'not running'
    _SNIFFER_RUNNING = False
    # give it a moment to exit
    if _SNIFFER_THREAD is not None:
        _SNIFFER_THREAD.join(timeout=2)
    _SNIFFER_THREAD = None
    return True, 'stopped'


# Simple in-memory stores
_PCAP_SESSIONS = {}
_AGENT_REGISTRY = {}
_AGENT_METRICS = {}
_MAX_METRIC_SAMPLES = 600
_AGENT_COMMANDS = {}
_MAX_COMMAND_QUEUE = 50
_AGENT_PCAP_SESSIONS = {}
_MAX_PCAP_SESSIONS = 50

# --- Scapy IDS controller globals (Snort removed) ----------------------
_SCAPY_PROC = None
_SCAPY_THREAD = None
_SCAPY_LOCK = threading.Lock()
_SCAPY_LOGS = deque(maxlen=2000)



def _scapy_reader_loop(proc):
    """Read scapy_ids.py stdout/stderr and keep a small log for the UI."""
    try:
        for line in proc.stdout:
            try:
                _SCAPY_LOGS.appendleft(line.rstrip('\n'))
            except Exception:
                pass
    except Exception:
        return




def _start_scapy_process(python_path=None, script_path=None, iface=None, rules=None, dry_run=False, env=None):
    """Start the scapy_ids.py as a subprocess. Returns (ok, msg)."""
    global _SCAPY_PROC, _SCAPY_THREAD
    if _SCAPY_PROC is not None:
        return False, 'already running'
    if python_path is None:
        python_path = sys.executable or 'python'
    if script_path is None:
        script_path = os.path.join(os.path.dirname(__file__), 'scapy_ids.py')
    if not os.path.exists(script_path):
        return False, f'script not found: {script_path}'
    cmd = [python_path, script_path]
    if rules:
        cmd += ['--rules', rules]
    if iface:
        cmd += ['--iface', iface]
    if dry_run:
        cmd += ['--dry-run']
    try:
        # Merge env if provided
        proc_env = os.environ.copy()
        if isinstance(env, dict):
            proc_env.update(env)
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    except Exception as e:
        return False, str(e)
    _SCAPY_PROC = proc
    _SCAPY_THREAD = threading.Thread(target=_scapy_reader_loop, args=(proc,), daemon=True)
    _SCAPY_THREAD.start()
    return True, 'started'


def _stop_scapy_process():
    global _SCAPY_PROC, _SCAPY_THREAD
    if _SCAPY_PROC is None:
        return True, 'not running'
    try:
        _SCAPY_PROC.terminate()
        try:
            _SCAPY_PROC.wait(timeout=2)
        except Exception:
            _SCAPY_PROC.kill()
    except Exception as e:
        return False, str(e)
    finally:
        _SCAPY_PROC = None
        _SCAPY_THREAD = None
    return True, 'stopped'



@monitor_bp.route('/upload', methods=['POST'])
def upload_pcap():
    f = (request.files or {}).get('pcap')
    if not f:
        return jsonify({'error': 'no file provided (field "pcap" required)'}), 400

    tmp = None
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False)
        data = f.read()
        tmp.write(data)
        tmp.flush()
        tmp.close()

        pkts = rdpcap(tmp.name)
        summaries = []
        MAX = 2000
        for i, pkt in enumerate(pkts[:MAX]):
            summaries.append(_packet_summary(pkt, i))

        session_id = str(uuid.uuid4())
        agent_id = None
        try:
            agent_id = (request.form or {}).get('agent_id')
        except Exception:
            agent_id = None

        _PCAP_SESSIONS[session_id] = {'packets': summaries, 'raw': list(pkts), 'agent_id': agent_id, 'ts': time.time()}
        if agent_id:
            dq = _AGENT_PCAP_SESSIONS.setdefault(agent_id, deque(maxlen=_MAX_PCAP_SESSIONS))
            dq.appendleft({'session_id': session_id, 'ts': _PCAP_SESSIONS[session_id]['ts'], 'total': len(summaries)})

        return jsonify({'session_id': session_id, 'packets': summaries, 'total': len(summaries)})
    except Exception as e:
        return jsonify({'error': 'failed to parse pcap', 'detail': str(e)}), 500
    finally:
        try:
            if tmp is not None:
                os.unlink(tmp.name)
        except Exception:
            pass


@monitor_bp.route('/list', methods=['POST'])
def list_pcap():
    data = request.get_json(silent=True) or {}
    sid = data.get('session_id')
    if not sid or sid not in _PCAP_SESSIONS:
        return jsonify({'error': 'missing or unknown session_id'}), 400
    return jsonify({'session_id': sid, 'packets': _PCAP_SESSIONS[sid]['packets'], 'total': len(_PCAP_SESSIONS[sid]['packets'])})


@monitor_bp.route('/detail', methods=['POST'])
def detail_pcap():
    data = request.get_json(silent=True) or {}
    sid = data.get('session_id')
    try:
        idx = int(data.get('index', 0) or 0)
    except Exception:
        return jsonify({'error': 'invalid index'}), 400

    if not sid or sid not in _PCAP_SESSIONS:
        return jsonify({'error': 'missing or unknown session_id'}), 400

    raw_list = _PCAP_SESSIONS[sid]['raw']
    if idx < 0 or idx >= len(raw_list):
        return jsonify({'error': 'index out of range'}), 400

    pkt = raw_list[idx]
    try:
        raw_bytes = bytes(pkt).hex()
    except Exception:
        raw_bytes = ''

    summary = _packet_summary(pkt, idx)
    summary['raw_bytes'] = raw_bytes
    return jsonify({'packet': summary})


# --- Agent endpoints -------------------------------------------------
@monitor_bp.route('/agent/register', methods=['POST'])
def agent_register():
    data = request.get_json(silent=True) or {}
    aid = data.get('agent_id')
    hostname = data.get('hostname') or data.get('host') or None
    if not aid:
        return jsonify({'error': 'agent_id required'}), 400
    _AGENT_REGISTRY[aid] = {'hostname': hostname, 'last_seen': time.time()}
    _AGENT_METRICS.setdefault(aid, deque(maxlen=_MAX_METRIC_SAMPLES))
    return jsonify({'ok': True})


@monitor_bp.route('/agent/metrics', methods=['POST'])
def agent_metrics():
    data = request.get_json(silent=True) or {}
    aid = data.get('agent_id')
    if not aid:
        return jsonify({'error': 'agent_id required'}), 400
    counters = data.get('counters') or {}
    try:
        ts = float(data.get('timestamp') or time.time())
    except Exception:
        ts = time.time()

    if 'bytes_sent' not in counters or 'bytes_recv' not in counters:
        return jsonify({'error': 'counters.bytes_sent and counters.bytes_recv required'}), 400

    _AGENT_REGISTRY.setdefault(aid, {'hostname': None, 'last_seen': time.time()})
    _AGENT_REGISTRY[aid]['last_seen'] = time.time()

    dq = _AGENT_METRICS.setdefault(aid, deque(maxlen=_MAX_METRIC_SAMPLES))
    try:
        sample = {'ts': ts, 'bytes_sent': int(counters['bytes_sent']), 'bytes_recv': int(counters['bytes_recv'])}
    except Exception:
        return jsonify({'error': 'invalid counter values'}), 400
    dq.append(sample)
    return jsonify({'ok': True})


@monitor_bp.route('/agent/list', methods=['GET'])
def agent_list():
    out = []
    for aid, meta in _AGENT_REGISTRY.items():
        out.append({'agent_id': aid, 'hostname': meta.get('hostname'), 'last_seen': meta.get('last_seen')})
    return jsonify({'agents': out})


@monitor_bp.route('/host_stats', methods=['GET'])
def host_stats():
    aid = request.args.get('agent_id')
    try:
        window = float(request.args.get('window') or 60.0)
    except Exception:
        window = 60.0

    if not aid or aid not in _AGENT_METRICS:
        return jsonify({'error': 'unknown or missing agent_id'}), 400

    now = time.time()
    start_ts = now - window
    samples = list(_AGENT_METRICS.get(aid, []))
    samples = [s for s in samples if s['ts'] >= start_ts]
    if len(samples) < 2:
        return jsonify({'agent_id': aid, 'series': []})

    series = []
    prev = samples[0]
    for cur in samples[1:]:
        dt = cur['ts'] - prev['ts']
        if dt <= 0:
            prev = cur
            continue
        sent_bps = (cur['bytes_sent'] - prev['bytes_sent']) / dt
        recv_bps = (cur['bytes_recv'] - prev['bytes_recv']) / dt
        series.append({'ts': cur['ts'], 'sent_bps': sent_bps, 'recv_bps': recv_bps})
        prev = cur

    return jsonify({'agent_id': aid, 'series': series})


@monitor_bp.route('/sniffer/start', methods=['POST'])
def api_sniffer_start():
    """Start the local scapy sniffer that feeds the monitoring chart.

    Returns { ok: true, message: 'started' } on success or a helpful error.
    """
    ok, msg = start_sniffer()
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 500
    return jsonify({'ok': True, 'message': msg})


@monitor_bp.route('/sniffer/stop', methods=['POST'])
def api_sniffer_stop():
    ok, msg = stop_sniffer()
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 500
    return jsonify({'ok': True, 'message': msg})


@monitor_bp.route('/sniffer/status', methods=['GET'])
def api_sniffer_status():
    return jsonify({'running': bool(_SNIFFER_RUNNING), 'agent_id': _LOCAL_SNIFFER_AGENT_ID if _SNIFFER_RUNNING else None})


@monitor_bp.route('/sniffer/packets', methods=['GET'])
def api_sniffer_packets():
    """Return the most recent live-sniffer packet summaries (newest first).

    Query param: `count` optional, default 200.
    """
    try:
        count = int(request.args.get('count') or 200)
    except Exception:
        count = 200
    count = max(1, min(1000, count))
    pkts = list(_SNIFFER_PACKETS)[:count]
    return jsonify({'packets': pkts})


@monitor_bp.route('/quick_scan', methods=['POST'])
def quick_scan():
    data = request.get_json(silent=True) or {}
    target = data.get('target') or data.get('ip')
    if not target:
        return jsonify({'error': 'target IP required'}), 400
    start = 1
    end = 65535
    try:
        timeout = float(data.get('timeout', 0.3))
    except Exception:
        timeout = 0.3

    if start < 1 or end > 65535 or start > end:
        return jsonify({'error': 'port range must be 1-65535 and start <= end'}), 400

    ports = range(start, end + 1)
    results = []

    def _scan_port(p):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        try:
            s.connect((target, p))
            status = 'open'
        except ConnectionRefusedError:
            status = 'closed'
        except socket.timeout:
            status = 'filtered'
        except Exception:
            status = 'error'
        finally:
            try:
                s.close()
            except Exception:
                pass
        return {'port': p, 'status': status}

    total = end - start + 1
    max_workers = min(500, max(50, total // 50))
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as ex:
            futures = {ex.submit(_scan_port, p): p for p in ports}
            for fut in concurrent.futures.as_completed(futures):
                try:
                    r = fut.result()
                    results.append(r)
                except Exception:
                    pass
    except Exception as e:
        return jsonify({'error': 'scan failed', 'detail': str(e)}), 500

    COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5900, 8080]
    pm = {int(r['port']): r.get('status', 'unknown') for r in results}

    open_ports = []
    for p in sorted([k for k, v in pm.items() if v == 'open']):
        try:
            svc = socket.getservbyport(p, 'tcp')
        except Exception:
            svc = 'unknown'
        open_ports.append({'port': p, 'service': svc, 'status': pm[p]})

    common_ports_status = []
    for p in COMMON_PORTS:
        st = pm.get(p, 'closed')
        try:
            svc = socket.getservbyport(p, 'tcp')
        except Exception:
            svc = 'unknown'
        common_ports_status.append({'port': p, 'service': svc, 'status': st})

    # Create alerts for suspicious open ports (unusual ports and uncommon open ports)
    try:
        requester = request.remote_addr or '127.0.0.1'
    except Exception:
        requester = '127.0.0.1'

    unusual_ports = [4444, 5555, 6666, 7777, 8888, 9999, 31337]
    common_set = set(COMMON_PORTS)
    try:
        for op in open_ports:
            p = int(op.get('port'))
            if p in unusual_ports:
                alert = {
                    'title': f'Traffic to Unusual Port: {p}',
                    'severity': 'Medium',
                    'msg': f'Open unusual port {p} detected on {target} (scanned by {requester})',
                    'src': requester,
                    'dst': target,
                    'proto': 'TCP',
                    'risk': 60,
                }
                _store_sniffer_alert_to_db(alert)
            elif p not in common_set:
                # Open but uncommon port — flag as Low severity
                alert = {
                    'title': f'Open Uncommon Port: {p}',
                    'severity': 'Low',
                    'msg': f'Open uncommon port {p} detected on {target} (scanned by {requester})',
                    'src': requester,
                    'dst': target,
                    'proto': 'TCP',
                    'risk': 30,
                }
                _store_sniffer_alert_to_db(alert)
    except Exception:
        # don't let alert creation break the scan response
        pass

    return jsonify({'target': target, 'open_ports': open_ports, 'common_ports': common_ports_status})


    # The close-port / admin operations were intentionally removed.
    # No action is performed here.
    return jsonify({'error': 'close-port action removed'}), 410


# --- Agent command endpoints --------------------------------------------
@monitor_bp.route('/agent/command', methods=['POST'])
def agent_command():
    """Enqueue a command for an agent. Body: { agent_id, command: 'capture', args: {...} }
    This endpoint is intended for the UI or operator to request an agent to capture and upload a pcap.
    """
    data = request.get_json(silent=True) or {}
    aid = data.get('agent_id')
    cmd = data.get('command')
    args = data.get('args') or {}
    if not aid or not cmd:
        return jsonify({'error': 'agent_id and command required'}), 400

    from collections import deque
    dq = _AGENT_COMMANDS.setdefault(aid, deque(maxlen=_MAX_COMMAND_QUEUE))
    dq.append({'command': cmd, 'args': args, 'ts': time.time()})
    # update last_seen so operator knows agent was targeted recently
    _AGENT_REGISTRY.setdefault(aid, {'hostname': None, 'last_seen': time.time()})
    _AGENT_REGISTRY[aid]['last_seen'] = time.time()
    return jsonify({'ok': True})


@monitor_bp.route('/agent/commands', methods=['GET'])
def agent_commands_get():
    """Agent polling endpoint. Query param: agent_id
    Returns a JSON list of pending commands for the agent and clears the queue.
    """
    aid = request.args.get('agent_id')
    if not aid:
        return jsonify({'error': 'agent_id required'}), 400
    from collections import deque
    dq = _AGENT_COMMANDS.get(aid)
    if not dq:
        return jsonify({'commands': []})
    cmds = list(dq)
    # clear queue
    _AGENT_COMMANDS[aid] = deque(maxlen=_MAX_COMMAND_QUEUE)
    return jsonify({'commands': cmds})


@monitor_bp.route('/agent/sessions', methods=['GET'])
def agent_sessions_get():
    """Return recent pcap upload sessions for an agent. Query param: agent_id"""
    aid = request.args.get('agent_id')
    if not aid:
        return jsonify({'error': 'agent_id required'}), 400
    from collections import deque
    dq = _AGENT_PCAP_SESSIONS.get(aid)
    if not dq:
        return jsonify({'sessions': []})
    return jsonify({'sessions': list(dq)})



# Test alert injection endpoint
@monitor_bp.route('/alert/inject', methods=['POST'])
def api_alert_inject():
    """Inject a test alert directly into the database.
    Body: { title, severity, description }
    """
    data = request.get_json(silent=True) or {}
    title = data.get('title', 'Test Alert')
    severity = data.get('severity', 'Medium')
    description = data.get('description', '')
    
    try:
        dbpath = os.path.join(os.getcwd(), 'soc_dashboard.db')
        conn = sqlite3.connect(dbpath)
        cur = conn.cursor()
        now = datetime.utcnow().isoformat() + 'Z'
        
        cur.execute(
            """
            INSERT INTO alerts (title, severity, status, owner, created_at, updated_at, tags, mitre, artifacts, source, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                title,
                severity,
                'New',
                '',
                now,
                now,
                json.dumps(['test']),
                json.dumps([]),
                json.dumps([]),
                'manual',
                description,
            ),
        )
        conn.commit()
        conn.close()
        return jsonify({'ok': True, 'message': 'Alert injected'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ---------------- Scapy IDS control endpoints --------------------------
@monitor_bp.route('/scapy/start', methods=['POST'])
def api_scapy_start():
    """Start the bundled Scapy IDS. JSON body: { iface, rules, python_path, dry_run, monitor_server }

    `monitor_server` if provided will be set as `MONITOR_SERVER` in the child env.
    """
    data = request.get_json(silent=True) or {}
    iface = data.get('iface')
    rules = data.get('rules') or os.path.join(os.path.dirname(__file__), 'scapy_rules.txt')
    python_path = data.get('python_path')
    dry_run = bool(data.get('dry_run'))
    monitor_server = data.get('monitor_server')

    env = None
    if monitor_server:
        env = {'MONITOR_SERVER': monitor_server}

    ok, msg = _start_scapy_process(python_path=python_path, iface=iface, rules=rules, dry_run=dry_run, env=env)
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 500
    return jsonify({'ok': True, 'message': msg})


@monitor_bp.route('/scapy/stop', methods=['POST'])
def api_scapy_stop():
    ok, msg = _stop_scapy_process()
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 500
    return jsonify({'ok': True, 'message': msg})


@monitor_bp.route('/scapy/status', methods=['GET'])
def api_scapy_status():
    running = _SCAPY_PROC is not None
    pid = None
    try:
        if running and _SCAPY_PROC is not None:
            pid = getattr(_SCAPY_PROC, 'pid', None)
    except Exception:
        pid = None
    return jsonify({'running': bool(running), 'pid': pid})


@monitor_bp.route('/scapy/logs', methods=['GET'])
def api_scapy_logs():
    try:
        limit = int(request.args.get('limit') or 200)
    except Exception:
        limit = 200
    limit = max(1, min(2000, limit))
    with _SCAPY_LOCK:
        logs = list(_SCAPY_LOGS)[:limit]
    return jsonify({'logs': logs, 'total': len(logs)})

