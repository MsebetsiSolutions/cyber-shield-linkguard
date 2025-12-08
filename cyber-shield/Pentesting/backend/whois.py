# backend/whois.py
from flask import Blueprint, request, jsonify
import re
import socket
from ipwhois import IPWhois
import whois

whois_bp = Blueprint("whois_bp", __name__)

def query_whois_server(server, query):
    """ Low-level WHOIS TCP query (port 43) """
    try:
        # Explicit DNS resolution
        ip = socket.gethostbyname(server)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(8)
        s.connect((ip, 43))
        s.send((query + "\r\n").encode())

        response = b""
        while True:
            data = s.recv(4096)
            if not data:
                break
            response += data

        s.close()
        return response.decode(errors="ignore")

    except Exception as e:
        return f"WHOIS TCP failure ({server}): {e}"


@whois_bp.route('/api/whois', methods=['POST'])
def whois_lookup():
    data = request.get_json()
    target = data.get("target")

    if not target:
        return jsonify({"success": False, "error": "No target provided"}), 400

    # Detect if target is an IP address
    ip_regex = r"^\d{1,3}(\.\d{1,3}){3}$"
    is_ip = re.match(ip_regex, target)

    try:
        # ==========================================================
        # 1️⃣ IP WHOIS (RDAP) — GLOBAL
        # ==========================================================
        if is_ip:
            try:
                lookup = IPWhois(target)
                rdap_result = lookup.lookup_rdap(depth=1)
                return jsonify({
                    "success": True,
                    "type": "ip",
                    "result": rdap_result
                })
            except Exception as e:
                return jsonify({"success": False, "error": f"IP WHOIS failed: {e}"}), 500

        # ==========================================================
        # 2️⃣ ZA DOMAIN WHOIS
        # ==========================================================
        if target.endswith(".za"):
            try:
                # Use WHOIS library first (works for most ZA domains)
                result = whois.whois(target)
                return jsonify({
                    "success": True,
                    "type": "za-domain",
                    "result": str(result)
                })
            except Exception:
                # Fallback to TCP query if WHOIS library fails
                if target.endswith(".ac.za"):
                    server = "ac-whois.registry.net.za"
                elif target.endswith((".co.za", ".org.za", ".net.za", ".web.za")):
                    server = "coza-whois.registry.net.za"
                else:
                    server = "whois.za.net"  # generic fallback

                raw = query_whois_server(server, target)
                return jsonify({
                    "success": True,
                    "type": "za-domain-fallback",
                    "server": server,
                    "result": raw
                })

        # ==========================================================
        # 3️⃣ GLOBAL DOMAIN WHOIS — ALL OTHER TLDs
        # ==========================================================
        try:
            result = whois.whois(target)
            return jsonify({
                "success": True,
                "type": "domain",
                "result": str(result)
            })
        except Exception:
            # Fallback WHOIS servers
            fallback_servers = [
                "whois.verisign-grs.com",
                "whois.iana.org",
                "whois.pir.org",
                "whois.internic.net"
            ]

            for srv in fallback_servers:
                raw = query_whois_server(srv, target)
                if "Domain Name" in raw or "Registry" in raw:
                    return jsonify({
                        "success": True,
                        "type": "domain-fallback",
                        "server": srv,
                        "result": raw
                    })

            return jsonify({
                "success": False,
                "error": "WHOIS not found in any registry."
            }), 404

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
