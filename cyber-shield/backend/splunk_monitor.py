<<<<<<< HEAD
# backend/routes_monitoring.py
from flask import Blueprint, request, jsonify
from .monitoring import access_splunk_home

monitoring_bp = Blueprint("monitoring", __name__)

@monitoring_bp.post("/api/monitoring/splunk")
def api_access_splunk():
    """Access Splunk home and fetch logs"""
    data = request.get_json() or {}
    splunk_url = data.get("splunk_url", "")
    username = data.get("username", "")
    password = data.get("password", "")
    
    if not all([splunk_url, username, password]):
        return jsonify({"error": "Splunk URL, username, and password required"}), 400
    
    try:
        logs = access_splunk_home(splunk_url, username, password)
        return jsonify({
            "status": "success",
            "logs": logs,
            "message": "Splunk logs fetched successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@monitoring_bp.post("/api/monitoring/system")
def api_system_monitoring():
    """Get system monitoring data"""
    try:
        import psutil
        import platform
        from datetime import datetime
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Disk usage
        disk = psutil.disk_usage('/')
        
        # Network stats
        network = psutil.net_io_counters()
        
        # System info
        system_info = {
            "os": platform.system(),
            "os_version": platform.version(),
            "hostname": platform.node(),
            "processor": platform.processor(),
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify({
            "cpu": {
                "percent": cpu_percent,
                "cores": psutil.cpu_count(logical=False),
                "threads": psutil.cpu_count(logical=True)
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percent": memory.percent
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv
            },
            "system": system_info
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@monitoring_bp.post("/api/monitoring/processes")
def api_get_processes():
    """Get running processes"""
    try:
        import psutil
        
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        # Sort by CPU usage (descending)
        processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
        
        return jsonify({
            "processes": processes[:50],  # Return top 50 processes
            "total": len(processes)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
=======
# backend/routes_monitoring.py
from flask import Blueprint, request, jsonify
from .monitoring import access_splunk_home

monitoring_bp = Blueprint("monitoring", __name__)

@monitoring_bp.post("/api/monitoring/splunk")
def api_access_splunk():
    """Access Splunk home and fetch logs"""
    data = request.get_json() or {}
    splunk_url = data.get("splunk_url", "")
    username = data.get("username", "")
    password = data.get("password", "")
    
    if not all([splunk_url, username, password]):
        return jsonify({"error": "Splunk URL, username, and password required"}), 400
    
    try:
        logs = access_splunk_home(splunk_url, username, password)
        return jsonify({
            "status": "success",
            "logs": logs,
            "message": "Splunk logs fetched successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@monitoring_bp.post("/api/monitoring/system")
def api_system_monitoring():
    """Get system monitoring data"""
    try:
        import psutil
        import platform
        from datetime import datetime
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Disk usage
        disk = psutil.disk_usage('/')
        
        # Network stats
        network = psutil.net_io_counters()
        
        # System info
        system_info = {
            "os": platform.system(),
            "os_version": platform.version(),
            "hostname": platform.node(),
            "processor": platform.processor(),
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify({
            "cpu": {
                "percent": cpu_percent,
                "cores": psutil.cpu_count(logical=False),
                "threads": psutil.cpu_count(logical=True)
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percent": memory.percent
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv
            },
            "system": system_info
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@monitoring_bp.post("/api/monitoring/processes")
def api_get_processes():
    """Get running processes"""
    try:
        import psutil
        
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        # Sort by CPU usage (descending)
        processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
        
        return jsonify({
            "processes": processes[:50],  # Return top 50 processes
            "total": len(processes)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
>>>>>>> deploy
