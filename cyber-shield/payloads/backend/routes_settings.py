# backend/routes_settings.py
from __future__ import annotations

import base64
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import requests
from flask import Blueprint, jsonify, request, Response

settings_bp = Blueprint("backend_settings", __name__)


DB_PATH = "soc_dashboard.db"
TIMEOUT = (8, 15)  # (connect, read) seconds
UA = "Msebetsi-SOC-Settings/1.0"


# --------------------------- DB Utilities & Schema ------------------------- #

@contextmanager
def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
        conn.commit()
    finally:
        conn.close()


def _iso_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def init_schema() -> None:
    with db() as conn:
        # Organization profile
        conn.execute("""
        CREATE TABLE IF NOT EXISTS org_settings (
            id INTEGER PRIMARY KEY CHECK (id=1),
            name TEXT NOT NULL DEFAULT 'Msebetsi Solutions',
            timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
            theme TEXT NOT NULL DEFAULT 'dark'
        )""")
        conn.execute("INSERT OR IGNORE INTO org_settings (id) VALUES (1)")

        # Secrets (key/value), value stored b64 (not crypto, but keeps raw out of sight)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS secrets (
            name TEXT PRIMARY KEY,
            value_b64 TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )""")

        # SIEM/Integrations (non-secret endpoints)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS siem_settings (
            id INTEGER PRIMARY KEY CHECK (id=1),
            elastic_url TEXT DEFAULT '',
            qradar_url TEXT DEFAULT ''
        )""")
        conn.execute("INSERT OR IGNORE INTO siem_settings (id) VALUES (1)")

        # Users
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            role TEXT NOT NULL DEFAULT 'Viewer',
            twofa INTEGER NOT NULL DEFAULT 1,  -- 1 enabled, 0 disabled
            status TEXT NOT NULL DEFAULT 'Active'
        )""")

        # Webhooks
        conn.execute("""
        CREATE TABLE IF NOT EXISTS webhooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL
        )""")

        # Audit log
        conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            user TEXT NOT NULL,
            action TEXT NOT NULL,
            detail TEXT DEFAULT ''
        )""")

    seed_defaults()


def seed_defaults() -> None:
    with db() as conn:
        # Seed an admin user if table is empty
        cur = conn.execute("SELECT COUNT(*) AS c FROM users")
        if (cur.fetchone()["c"] or 0) == 0:
            conn.execute(
                "INSERT INTO users (email, role, twofa, status) VALUES (?,?,?,?)",
                ("admin@msebetsi.local", "Admin", 1, "Active"),
            )


# Initialize on import
init_schema()


# --------------------------- Audit helper ---------------------------------- #

def _who() -> str:
    # In production, replace with authenticated user identity
    return request.headers.get("X-User", "system")


def audit(action: str, detail: str = "") -> None:
    try:
        with db() as conn:
            conn.execute(
                "INSERT INTO audit_log (ts,user,action,detail) VALUES (?,?,?,?)",
                (_iso_now(), _who(), action, detail[:2000]),
            )
    except Exception:
        pass


# --------------------------- Secrets helpers -------------------------------- #

def set_secret(name: str, value: str) -> None:
    with db() as conn:
        conn.execute(
            "INSERT INTO secrets (name,value_b64,updated_at) VALUES (?,?,?) "
            "ON CONFLICT(name) DO UPDATE SET value_b64=excluded.value_b64, updated_at=excluded.updated_at",
            (name, base64.b64encode((value or "").encode()).decode(), _iso_now()),
        )


def get_secret(name: str) -> Optional[str]:
    with db() as conn:
        cur = conn.execute("SELECT value_b64 FROM secrets WHERE name = ?", (name,))
        r = cur.fetchone()
        if not r:
            return None
        try:
            return base64.b64decode(r["value_b64"]).decode()
        except Exception:
            return None


# --------------------------- Org Settings ---------------------------------- #

@settings_bp.post("/api/settings/org/get")
def org_get():
    with db() as conn:
        cur = conn.execute("SELECT name, timezone, theme FROM org_settings WHERE id=1")
        r = cur.fetchone()
        return jsonify(dict(r) if r else {"name": "Msebetsi Solutions", "timezone": "Africa/Johannesburg", "theme": "dark"})


@settings_bp.post("/api/settings/org/save")
def org_save():
    b = request.get_json(silent=True) or {}
    name = (b.get("name") or "").strip() or "Msebetsi Solutions"
    tz = (b.get("timezone") or "Africa/Johannesburg").strip()
    theme = (b.get("theme") or "dark").strip()
    with db() as conn:
        conn.execute("UPDATE org_settings SET name=?, timezone=?, theme=? WHERE id=1", (name, tz, theme))
    audit("org.update", json.dumps({"name": name, "timezone": tz, "theme": theme}))
    return jsonify({"ok": True})


# --------------------------- Secrets (set/test) ---------------------------- #

@settings_bp.post("/api/settings/secret/set")
def secret_set():
    b = request.get_json(silent=True) or {}
    name = (b.get("name") or "").strip()
    value = b.get("value") or ""
    if not name:
        return jsonify({"error": "name required"}), 400
    set_secret(name, value)
    audit("secret.set", name)
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/secret/test")
def secret_test():
    """
    Body: { name: 'virustotal' | 'splunk_hec' | 'otx' | 'hybrid_analysis' | 'crowdstrike' | 'abuseipdb' }
    - For splunk_hec: requires secrets splunk_hec_url & splunk_hec_token; GET /services/collector/health
    - For virustotal/otx/abuseipdb/etc: just validates presence (and optional lightweight ping)
    """
    b = request.get_json(silent=True) or {}
    name = (b.get("name") or "").strip().lower()
    if not name:
        return jsonify({"error": "name required"}), 400

    # Splunk HEC health check
    if name == "splunk_hec":
        hec_url = (get_secret("splunk_hec_url") or "").rstrip("/")
        token = get_secret("splunk_hec_token")
        if not hec_url or not token:
            return jsonify({"error": "splunk_hec_url or splunk_hec_token missing"}), 400
        try:
            r = requests.get(
                hec_url + "/services/collector/health",
                headers={"Authorization": f"Splunk {token}", "User-Agent": UA},
                timeout=TIMEOUT,
                verify=True,
            )
            audit("secret.test", "splunk_hec")
            return Response(r.text or "OK", status=r.status_code, mimetype="text/plain")
        except requests.RequestException as e:
            return jsonify({"error": str(e)}), 502

    # Simple presence tests for API keys (we avoid hitting external APIs here)
    key_map = {
        "virustotal": "virustotal_api_key",
        "otx": "otx_api_key",
        "abuseipdb": "abuseipdb_api_key",
        "crowdstrike": "crowdstrike_api_key",
        "hybrid_analysis": "hybrid_analysis_api_key",
    }
    if name in key_map:
        present = bool(get_secret(key_map[name]))
        audit("secret.test", name)
        return jsonify({"ok": present, "detail": "present" if present else "missing"})
    return jsonify({"error": f"Unknown secret: {name}"}), 400


# --------------------------- SIEM settings --------------------------------- #

@settings_bp.post("/api/settings/siem/save")
def siem_save():
    b = request.get_json(silent=True) or {}
    elastic_url = (b.get("elastic_url") or "").strip()
    qradar_url = (b.get("qradar_url") or "").strip()
    with db() as conn:
        conn.execute("UPDATE siem_settings SET elastic_url=?, qradar_url=? WHERE id=1", (elastic_url, qradar_url))
    audit("siem.update", json.dumps({"elastic_url": elastic_url, "qradar_url": qradar_url}))
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/siem/test")
def siem_test():
    """
    Performs lightweight reachability checks (HEAD/GET) to configured endpoints if present.
    """
    with db() as conn:
        cur = conn.execute("SELECT elastic_url, qradar_url FROM siem_settings WHERE id=1")
        r = cur.fetchone()
    elastic_url = (r["elastic_url"] or "").strip() if r else ""
    qradar_url = (r["qradar_url"] or "").strip() if r else ""

    results: Dict[str, Any] = {}
    headers = {"User-Agent": UA}

    for name, url in [("elastic_url", elastic_url), ("qradar_url", qradar_url)]:
        if not url:
            results[name] = {"ok": False, "error": "not configured"}
            continue
        try:
            resp = requests.get(url, headers=headers, timeout=TIMEOUT, verify=True)
            results[name] = {"ok": 200 <= resp.status_code < 400, "status": resp.status_code}
        except requests.RequestException as e:
            results[name] = {"ok": False, "error": str(e)}

    audit("siem.test", json.dumps(results))
    return jsonify(results)


# --------------------------- Users & Roles --------------------------------- #

@settings_bp.post("/api/settings/users/list")
def users_list():
    with db() as conn:
        cur = conn.execute("SELECT email, role, twofa, status FROM users ORDER BY role DESC, email")
        rows = []
        for r in cur.fetchall():
            rows.append({
                "email": r["email"],
                "role": r["role"],
                "twofa": bool(r["twofa"]),
                "status": r["status"],
            })
    return jsonify({"users": rows})


@settings_bp.post("/api/settings/users/invite")
def users_invite():
    b = request.get_json(silent=True) or {}
    email = (b.get("email") or "").strip().lower()
    role = (b.get("role") or "Viewer").strip()
    require_2fa = bool(b.get("require_2fa", True))
    if not email:
        return jsonify({"error": "email required"}), 400
    with db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (email, role, twofa, status) VALUES (?,?,?,?)",
            (email, role, 1 if require_2fa else 0, "Active"),
        )
    audit("users.invite", json.dumps({"email": email, "role": role, "2fa": require_2fa}))
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/users/update")
def users_update():
    b = request.get_json(silent=True) or {}
    email = (b.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email required"}), 400

    fields = []
    params: List[Any] = []
    if "role" in b and b["role"]:
        fields.append("role = ?"); params.append(b["role"])
    if "twofa" in b:
        fields.append("twofa = ?"); params.append(1 if bool(b["twofa"]) else 0)
    if "status" in b and b["status"]:
        fields.append("status = ?"); params.append(b["status"])

    if not fields:
        return jsonify({"error": "no fields to update"}), 400

    with db() as conn:
        cur = conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE email = ?", params + [email])
        if cur.rowcount == 0:
            return jsonify({"error": "not found"}), 404

    audit("users.update", json.dumps({"email": email, **{k: b[k] for k in ('role','twofa','status') if k in b}}))
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/users/disable")
def users_disable():
    b = request.get_json(silent=True) or {}
    email = (b.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email required"}), 400
    with db() as conn:
        conn.execute("UPDATE users SET status='Disabled' WHERE email = ?", (email,))
    audit("users.disable", email)
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/users/reset-2fa")
def users_reset_2fa():
    b = request.get_json(silent=True) or {}
    email = (b.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email required"}), 400
    with db() as conn:
        conn.execute("UPDATE users SET twofa=0 WHERE email = ?", (email,))
    audit("users.reset2fa", email)
    return jsonify({"ok": True})


# --------------------------- Webhooks -------------------------------------- #

@settings_bp.post("/api/settings/webhooks/list")
def webhooks_list():
    with db() as conn:
        cur = conn.execute("SELECT id, name, url FROM webhooks ORDER BY id DESC")
        items = [dict(r) for r in cur.fetchall()]
    return jsonify({"webhooks": items})


@settings_bp.post("/api/settings/webhooks/add")
def webhooks_add():
    b = request.get_json(silent=True) or {}
    name = (b.get("name") or "").strip()
    url = (b.get("url") or "").strip()
    if not name or not url:
        return jsonify({"error": "name and url required"}), 400
    with db() as conn:
        conn.execute("INSERT INTO webhooks (name, url) VALUES (?,?)", (name, url))
    audit("webhooks.add", json.dumps({"name": name}))
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/webhooks/remove")
def webhooks_remove():
    b = request.get_json(silent=True) or {}
    wid = int(b.get("id", 0))
    if not wid:
        return jsonify({"error": "id required"}), 400
    with db() as conn:
        conn.execute("DELETE FROM webhooks WHERE id = ?", (wid,))
    audit("webhooks.remove", str(wid))
    return jsonify({"ok": True})


@settings_bp.post("/api/settings/webhooks/test")
def webhooks_test():
    """
    Sends a basic message to the newest webhook entry (or do nothing if none).
    You can also pass {url:"..."} to test a specific webhook without persisting it.
    """
    b = request.get_json(silent=True) or {}
    url = (b.get("url") or "").strip()
    if not url:
        with db() as conn:
            cur = conn.execute("SELECT url FROM webhooks ORDER BY id DESC LIMIT 1")
            r = cur.fetchone()
            if not r:
                return jsonify({"error": "no webhook configured"}), 400
            url = r["url"]

    payload = {"text": f"Msebetsi SOC test webhook • { _iso_now() }"}
    try:
        resp = requests.post(url, headers={"Content-Type": "application/json", "User-Agent": UA},
                             data=json.dumps(payload), timeout=TIMEOUT)
        audit("webhooks.test", url[:64])
        return Response(resp.text or "OK", status=resp.status_code, mimetype="text/plain")
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502


# --------------------------- Audit listing --------------------------------- #

@settings_bp.post("/api/settings/audit/list")
def audit_list():
    with db() as conn:
        cur = conn.execute("SELECT ts, user, action, detail FROM audit_log ORDER BY id DESC LIMIT 200")
        rows = [dict(r) for r in cur.fetchall()]
    return jsonify({"rows": rows})


# --------------------------- Config Export/Import -------------------------- #

@settings_bp.post("/api/settings/export")
def cfg_export():
    """
    Exports non-sensitive configuration (org, siem, users, webhooks) and secret names only (no values).
    """
    out: Dict[str, Any] = {}
    with db() as conn:
        out["org"] = dict(conn.execute("SELECT name, timezone, theme FROM org_settings WHERE id=1").fetchone())

        r = conn.execute("SELECT elastic_url, qradar_url FROM siem_settings WHERE id=1").fetchone()
        out["siem"] = dict(r) if r else {"elastic_url": "", "qradar_url": ""}

        out["users"] = [dict(r) for r in conn.execute("SELECT email, role, twofa, status FROM users").fetchall()]
        out["webhooks"] = [dict(r) for r in conn.execute("SELECT name, url FROM webhooks").fetchall()]

        # Only export secret names (no values)
        out["secrets"] = [r["name"] for r in conn.execute("SELECT name FROM secrets").fetchall()]

    audit("config.export")
    blob = json.dumps(out, indent=2).encode("utf-8")
    return Response(blob, mimetype="application/json", headers={"Content-Disposition": "attachment; filename=soc_settings.json"})


@settings_bp.post("/api/settings/import")
def cfg_import():
    """
    Imports config JSON. Accepts the structure produced by /api/settings/export.
    Optionally accepts {'secrets': {'name':'value', ...}} to set secrets on import.
    """
    try:
        body = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "invalid JSON"}), 400

    if not isinstance(body, dict):
        return jsonify({"error": "invalid payload"}), 400

    with db() as conn:
        if "org" in body and isinstance(body["org"], dict):
            conn.execute("UPDATE org_settings SET name=?, timezone=?, theme=? WHERE id=1",
                         (body["org"].get("name","Msebetsi Solutions"),
                          body["org"].get("timezone","Africa/Johannesburg"),
                          body["org"].get("theme","dark")))
        if "siem" in body and isinstance(body["siem"], dict):
            conn.execute("UPDATE siem_settings SET elastic_url=?, qradar_url=? WHERE id=1",
                         (body["siem"].get("elastic_url",""), body["siem"].get("qradar_url","")))
        if "users" in body and isinstance(body["users"], list):
            for u in body["users"]:
                if not isinstance(u, dict) or "email" not in u: 
                    continue
                conn.execute(
                    "INSERT INTO users (email, role, twofa, status) VALUES (?,?,?,?) "
                    "ON CONFLICT(email) DO UPDATE SET role=excluded.role, twofa=excluded.twofa, status=excluded.status",
                    (u["email"].lower(), u.get("role","Viewer"), 1 if u.get("twofa", True) else 0, u.get("status","Active")),
                )
        if "webhooks" in body and isinstance(body["webhooks"], list):
            # Simple reset & replace
            conn.execute("DELETE FROM webhooks")
            for w in body["webhooks"]:
                if isinstance(w, dict) and w.get("name") and w.get("url"):
                    conn.execute("INSERT INTO webhooks (name,url) VALUES (?,?)", (w["name"], w["url"]))

    # Optional secrets block: {"secrets": {"virustotal_api_key":"..."}}
    if isinstance(body.get("secrets"), dict):
        for k, v in body["secrets"].items():
            if isinstance(k, str):
                set_secret(k, str(v))

    audit("config.import")
    return jsonify({"ok": True})

