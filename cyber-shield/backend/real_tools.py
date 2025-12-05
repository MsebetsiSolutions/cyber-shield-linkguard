# backend/real_tools.py
from flask import Blueprint, request, jsonify
import subprocess
import shlex
import socket
import requests
import dns.resolver
from datetime import datetime

real_tools_bp = Blueprint('real_tools_bp', __name__)

# ======================================================
#                  SECURITY GUARD
# ======================================================
ALLOWED_IPS = {"127.0.0.1", "::1"}  # Adjust for production
INTERNAL_API_KEY = "msebetsi-2025-internal"

def is_trusted():
    ip = request.remote_addr
    return (
        ip in ALLOWED_IPS or
        request.headers.get("X-API-Key") == INTERNAL_API_KEY
    )

@real_tools_bp.before_request
def block_untrusted():
    if not is_trusted():
        return jsonify({"error": "Access denied"}), 403

# ======================================================
#                  SAFE SHELL EXECUTION
# ======================================================
def run_safe(cmd):
    try:
        result = subprocess.run(
            shlex.split(cmd),
            capture_output=True,
            text=True,
            timeout=90
        )
        return {
            "output": result.stdout.strip(),
            "error": result.stderr.strip(),
            "code": result.returncode
        }
    except Exception as e:
        return {"error": str(e)}

# ======================================================
#                        NMAP
# ======================================================
@real_tools_bp.post("/nmap")
def nmap_scan():
    target = request.json.get("target", "").strip()

    if not target or len(target) > 100:
        return jsonify({"error": "Invalid target"}), 400

    cmd = f"nmap -sV -T4 -Pn --open -oG - {shlex.quote(target)}"

    return jsonify({
        **run_safe(cmd),
        "target": target,
        "time": datetime.now().isoformat()
    })

# ======================================================
#                        WHOIS
# ======================================================
@real_tools_bp.post("/whois")
def whois_lookup():
    target = request.json.get("domain", "").strip()
    if not target:
        return jsonify({"error": "Missing domain"}), 400

    cmd = f"whois {shlex.quote(target)}"
    return jsonify({
        **run_safe(cmd),
        "target": target,
        "time": datetime.now().isoformat()
    })

# ======================================================
#                    SUBDOMAIN FINDER
# ======================================================
@real_tools_bp.post("/subdomains")
def subdomains():
    domain = request.json.get("domain", "").strip()

    if not domain:
        return jsonify({"error": "Missing domain"}), 400

    results = set()

    # ---------- 1. crt.sh passive scan ----------
    try:
        crt_url = f"https://crt.sh/?q=%25.{domain}&output=json"
        r = requests.get(crt_url, timeout=10)
        if r.status_code == 200:
            for entry in r.json():
                name = entry.get("name_value", "")
                for n in name.split("\n"):
                    if domain in n:
                        results.add(n.replace("*.", "").strip())
    except Exception:
        pass

    # ---------- 2. DNS brute force ----------
    common = [
        "www", "mail", "smtp", "vpn", "dev", "api", "cpanel", "test",
        "gov", "admin", "secure", "cloud", "app"
    ]

    resolver = dns.resolver.Resolver()
    resolver.timeout = 2
    resolver.lifetime = 2

    for sub in common:
        fqdn = f"{sub}.{domain}"
        try:
            resolver.resolve(fqdn)
            results.add(fqdn)
        except:
            continue

    return jsonify({
        "domain": domain,
        "count": len(results),
        "subdomains": sorted(results)
    })

# ======================================================
#                    HTTP HEADERS
# ======================================================
@real_tools_bp.post("/headers")
def http_headers():
    url = request.json.get("url", "").strip()

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        r = requests.get(url, timeout=10, verify=True, allow_redirects=True)
        return jsonify({
            "url": r.url,
            "status": r.status_code,
            "headers": dict(r.headers)
        })
    except Exception:
        return jsonify({"error": "Request failed"}), 500
