# backend/routes_monitor.py
from __future__ import annotations

import re
import json
import urllib.parse
from typing import Optional, Dict, Any

import requests
from flask import Blueprint, request, Response, jsonify

# Optional: reuse your helper if you like (kept optional here)
try:
    from backend.monitoring import access_splunk_home as legacy_access
except Exception:
    legacy_access = None

monitor_bp = Blueprint("monitor", __name__)

# Silence urllib3 warnings if verify_ssl is false (optional)
try:
    from urllib3.exceptions import InsecureRequestWarning  # type: ignore
    requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)  # type: ignore
except Exception:
    pass


# ----------------------------- Helpers ------------------------------------ #

_SPLUNK_PORT_DEFAULT = 8089
_TIMEOUT = (10, 30)  # (connect, read) seconds


def _normalize_base(url: str) -> str:
    """
    Normalizes a Splunk management URL (no path). Adds scheme if missing.
    Accepts forms like:
      - splunk.internal
      - splunk.internal:8089
      - https://splunk.internal:8089
    Returns: "https://host:port"
    """
    u = (url or "").strip()
    if not u:
        raise ValueError("Missing Splunk URL.")

    # If scheme missing, add https://
    if not re.match(r"^https?://", u, flags=re.IGNORECASE):
        u = "https://" + u

    parsed = urllib.parse.urlparse(u)
    if not parsed.hostname:
        raise ValueError("Invalid Splunk URL.")

    port = parsed.port or _SPLUNK_PORT_DEFAULT
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        scheme = "https"

    return f"{scheme}://{parsed.hostname}:{port}"


def _auth_tuple(username: str, password: str):
    return (username or "", password or "")


def _json_error(msg: str, code: int = 400, detail: Optional[str] = None) -> Response:
    payload: Dict[str, Any] = {"error": msg}
    if detail:
        payload["detail"] = detail
    return jsonify(payload), code


# ------------------------------ Routes ------------------------------------ #

@monitor_bp.post("/api/monitor/splunk/ping")
def splunk_ping():
    """
    Quick connectivity check to Splunk's management API.
    Body:
      {
        "splunk_url": "splunk.mycorp.com:8089",
        "username": "admin",
        "password": "pass",
        "verify_ssl": true
      }
    Returns: plaintext or JSON (server info) from /services/server/info
    """
    data = request.get_json(silent=True) or {}
    try:
        base = _normalize_base(data.get("splunk_url", ""))
    except Exception as e:
        return _json_error("Invalid splunk_url", 400, str(e))

    username = data.get("username", "")
    password = data.get("password", "")
    verify_ssl = bool(data.get("verify_ssl", True))

    url = f"{base}/services/server/info"
    try:
        r = requests.get(url, auth=_auth_tuple(username, password), verify=verify_ssl, timeout=_TIMEOUT)
        text = r.text or ""
        # Return plain text for UI to render; include status header
        return Response(text, status=r.status_code, mimetype="text/plain")
    except requests.RequestException as e:
        return _json_error("Ping request error", 502, str(e))


@monitor_bp.post("/api/monitor/splunk")
def splunk_search():
    """
    Runs a Splunk search in blocking mode and returns the server's response.
    Body:
      {
        "splunk_url": "splunk.mycorp.com:8089",
        "username": "admin",
        "password": "pass",
        "verify_ssl": true,
        "search": "search index=_internal | head 10",
        "fetch_results": false,     # optional; if true, fetches /results JSON
        "output_mode": "json"       # optional, when fetch_results=true
      }
    """
    data = request.get_json(silent=True) or {}

    # Prefer the new implementation; fall back to your legacy helper if needed
    use_legacy = False

    try:
        base = _normalize_base(data.get("splunk_url", ""))
    except Exception as e:
        return _json_error("Invalid splunk_url", 400, str(e))

    username = data.get("username", "")
    password = data.get("password", "")
    verify_ssl = bool(data.get("verify_ssl", True))
    search = (data.get("search") or "search index=_internal | head 10").strip()
    fetch_results = bool(data.get("fetch_results", False))
    output_mode = (data.get("output_mode") or "json").lower()

    # If someone insists on the legacy path (e.g., to match your exact helper behavior)
    if use_legacy and legacy_access:
        try:
            text = legacy_access(base, username, password)
            return Response(text, status=201, mimetype="text/plain")
        except Exception as e:
            return _json_error("Legacy access_splunk_home failed", 502, str(e))

    search_url = f"{base}/services/search/jobs"

    # 1) Create job (blocking)
    payload = {
        "search": search,
        "exec_mode": "blocking",
    }
    try:
        resp = requests.post(
            search_url,
            auth=_auth_tuple(username, password),
            data=payload,
            verify=verify_ssl,
            timeout=_TIMEOUT,
        )
    except requests.RequestException as e:
        return _json_error("Failed to submit search", 502, str(e))

    # Forward raw text so the UI can show XML (with <sid>) if desired
    raw_text = resp.text or ""
    status = resp.status_code

    # If not OK/Created, return as-is (UI will show error/status)
    if status not in (200, 201):
        return Response(raw_text, status=status, mimetype="text/plain")

    if not fetch_results:
        # Return creation response (XML) so UI can parse SID if it wants
        return Response(raw_text, status=status, mimetype="text/plain")

    # 2) Optionally fetch results using the SID we just got
    # Try to extract <sid> from XML (basic regex; Splunk typically returns <sid>...</sid>)
    m = re.search(r"<sid>(.*?)</sid>", raw_text, flags=re.IGNORECASE | re.DOTALL)
    if not m:
        # If no SID visible (some configurations return JSON or direct result), just return what we have
        return Response(raw_text, status=status, mimetype="text/plain")

    sid = m.group(1).strip()
    results_url = f"{base}/services/search/jobs/{urllib.parse.quote(sid, safe='')}/results"
    params = {"output_mode": output_mode}
    try:
        r2 = requests.get(
            results_url,
            params=params,
            auth=_auth_tuple(username, password),
            verify=verify_ssl,
            timeout=_TIMEOUT,
        )
        # If the user asked for JSON, pass through JSON; else plaintext
        mt = "application/json" if output_mode == "json" else "text/plain"
        return Response(r2.text or "", status=r2.status_code, mimetype=mt)
    except requests.RequestException as e:
        # Fall back to the original creation response if results fetch fails
        fallback = f"// results fetch failed: {e}\n\n{raw_text}"
        return Response(fallback, status=207, mimetype="text/plain")  # 207 Multi-Status indicates partial

