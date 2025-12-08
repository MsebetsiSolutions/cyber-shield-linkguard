# backend.py — Full Pentest Backend (Flask + Real Tools)
# Place this file in your project root, next to your 'public/' folder

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import socket
import requests
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow your frontend to talk to this backend

# === REAL TOOLS ===

def run_command(cmd):
    """Run system command safely and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
        return {"output": result.stdout, "error": result.stderr, "success": result.returncode == 0}
    except Exception as e:
        return {"output": "", "error": str(e), "success": False}

@app.route('/api/nmap', methods=['POST'])
def nmap_scan():
    target = request.json.get('target', '').strip()
    if not target:
        return jsonify({"error": "No target"}), 400
    
    # Real Nmap scan
    cmd = f"nmap -sV -T4 -Pn --open -oG - {target}"
    result = run_command(cmd)
    
    ports = []
    if result["success"]:
        for line in result["output"].split('\n'):
            if "open" in line:
                parts = line.split()
                if len(parts) >= 3:
                    port = parts[1]
                    service = parts[4] if len(parts) > 4 else "unknown"
                    ports.append({"port": port, "service": service})
    
    return jsonify({
        "target": target,
        "ports": ports,
        "raw": result["output"],
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/subdomains', methods=['POST'])
def subdomains():
    domain = request.json.get('domain', '').strip()
    if not domain:
        return jsonify({"error": "No domain"}), 400
    
    # Real subdomain enumeration using crt.sh + dns
    try:
        # 1. Certificate Transparency
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        res = requests.get(url, timeout=30)
        cert_data = res.json()
        subs_from_cert = list(set([entry['name_value'].strip().lower() for entry in cert_data]))
        
        # 2. DNS brute-force (light)
        common = ["www", "mail", "ftp", "admin", "test", "dev", "api", "staging", "beta"]
        found = []
        for sub in common:
            try:
                socket.gethostbyname(f"{sub}.{domain}")
                found.append(f"{sub}.{domain}")
            except:
                pass
        
        all_subs = list(set(subs_from_cert + found))
        return jsonify({
            "domain": domain,
            "subdomains": all_subs[:200],
            "total": len(all_subs),
            "source": "crt.sh + DNS"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/whois', methods=['POST'])
def whois():
    domain = request.json.get('domain', '').strip()
    if not domain:
        return jsonify({"error": "No domain"}), 400
    
    cmd = f"whois {domain}"
    result = run_command(cmd)
    
    return jsonify({
        "domain": domain,
        "data": result["output"],
        "success": result["success"]
    })

@app.route('/api/headers', methods=['POST'])
def headers():
    url = request.json.get('url', '').strip()
    if not url.startswith('http'):
        url = 'https://' + url
    
    try:
        res = requests.get(url, timeout=10, verify=False, allow_redirects=True)
        headers = dict(res.headers)
        return jsonify({
            "url": res.url,
            "status": res.status_code,
            "headers": headers
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/geoip', methods=['POST'])
def geoip():
    ip = request.json.get('ip', '').strip()
    try:
        res = requests.get(f"https://ipapi.co/{ip}/json/")
        return jsonify(res.json())
    except:
        return jsonify({"error": "GeoIP failed"}), 500

@app.route('/api/dns', methods=['POST'])
def dns_lookup():
    domain = request.json.get('domain', '').strip()
    try:
        res = requests.get(f"https://dns.google/resolve?name={domain}&type=ALL")
        return jsonify(res.json())
    except:
        return jsonify({"error": "DNS lookup failed"}), 500

# Health check
@app.route('/')
def home():
    return "CyberShield Pro Backend Running — Real Pentest Tools Active"

if __name__ == '__main__':
    print("CyberShield Pro Backend Started")
    print("Access your app at: http://localhost:5000")
    print("Frontend should connect to: http://localhost:5000/api/...")
    app.run(host='0.0.0.0', port=5000, debug=False)