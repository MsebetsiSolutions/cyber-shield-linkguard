<<<<<<< HEAD
# backend/routes_subdomains.py
from flask import Blueprint, request, jsonify
import requests

subdomains_bp = Blueprint("subdomains_bp", __name__)

@subdomains_bp.route("/api/subdomains", methods=["POST"])
def get_subdomains():
    data = request.get_json() or {}
    domain = data.get("domain", "").strip()

    if not domain:
        return jsonify({"success": False, "error": "No domain provided"}), 400

    try:
        url = f"https://crt.sh/?q=%25.{domain}&output=json"
        resp = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0"},   # prevents HTML response
            timeout=15
        )
        resp.raise_for_status()

        # crt.sh sometimes returns HTML when rate-limited
        try:
            results = resp.json()
        except Exception:
            return jsonify({
                "success": False,
                "error": "crt.sh returned non‑JSON (blocked or rate limited)"
            }), 500

        subdomains = set()
        for entry in results:
            name = entry.get("name_value")
            if name:
                for sub in name.split("\n"):
                    subdomains.add(sub.strip())

        return jsonify({
            "success": True,
            "subdomains": sorted(subdomains)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
=======
# backend/routes_subdomains.py
from flask import Blueprint, request, jsonify
import requests

subdomains_bp = Blueprint("subdomains_bp", __name__)

@subdomains_bp.route("/api/subdomains", methods=["POST"])
def get_subdomains():
    data = request.get_json() or {}
    domain = data.get("domain", "").strip()

    if not domain:
        return jsonify({"success": False, "error": "No domain provided"}), 400

    try:
        url = f"https://crt.sh/?q=%25.{domain}&output=json"
        resp = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0"},   # prevents HTML response
            timeout=15
        )
        resp.raise_for_status()

        # crt.sh sometimes returns HTML when rate-limited
        try:
            results = resp.json()
        except Exception:
            return jsonify({
                "success": False,
                "error": "crt.sh returned non‑JSON (blocked or rate limited)"
            }), 500

        subdomains = set()
        for entry in results:
            name = entry.get("name_value")
            if name:
                for sub in name.split("\n"):
                    subdomains.add(sub.strip())

        return jsonify({
            "success": True,
            "subdomains": sorted(subdomains)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
>>>>>>> deploy
