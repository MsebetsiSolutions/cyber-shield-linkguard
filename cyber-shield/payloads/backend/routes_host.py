# routes_host.py
from flask import Blueprint, request, jsonify
import psutil, socket, concurrent.futures

host_bp = Blueprint("host", __name__)

@host_bp.post("/api/host/net-traffic")
def net_traffic():
    s = psutil.net_io_counters()
    return jsonify({"bytes_sent": s.bytes_sent, "bytes_recv": s.bytes_recv})

@host_bp.post("/api/host/open-ports")
def open_ports():
    data = request.get_json() or {}
    ip = data.get("target_ip", "127.0.0.1")
    start = int(data.get("start", 20))
    end = int(data.get("end", 1023))
    timeout = float(data.get("timeout", 0.3))
    max_workers = int(data.get("max_workers", 64))

    def check(p):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            ok = (sock.connect_ex((ip, p)) == 0)
            sock.close()
            return p if ok else None
        except Exception:
            return None

    open_ports = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as ex:
        for res in ex.map(check, range(start, end + 1)):
            if res is not None:
                open_ports.append(res)

    return jsonify({"target_ip": ip, "range": [start, end], "open_ports": open_ports})
