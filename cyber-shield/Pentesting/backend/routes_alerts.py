<<<<<<< HEAD
# backend/routes_alerts.py
from __future__ import annotations

import csv
import io
import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from flask import Blueprint, request, jsonify, Response, current_app

alerts_bp = Blueprint("alerts", __name__)

DB_PATH = "soc_dashboard.db"  # keep it at project root; change if needed


# --------------------------- DB Utilities ---------------------------------- #

@contextmanager
def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_schema() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                status TEXT NOT NULL,
                owner TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                tags TEXT DEFAULT '[]',           -- JSON array of strings
                mitre TEXT DEFAULT '[]',          -- JSON array of {tactic, technique, tid}
                artifacts TEXT DEFAULT '[]',      -- JSON array (ips, hashes, etc.)
                source TEXT DEFAULT 'detector',   -- SIEM rule, EDR, etc.
                description TEXT DEFAULT ''
            )
            """
        )

        # Simple index helpers
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_owner ON alerts(owner)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_sev ON alerts(severity)")

    seed_if_empty()


def seed_if_empty() -> None:
    with db() as conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM alerts")
        if (cur.fetchone()["c"] or 0) > 0:
            return

        now = datetime.utcnow()
        sample: List[Tuple] = []
        titles = [
            "Suspicious PowerShell",
            "Malware Detected",
            "Lateral Movement",
            "Exfil Attempt",
        ]
        sevs = ["Low", "Medium", "High", "Critical"]
        statuses = ["New", "In Progress", "Containment", "Resolved"]
        owners = ["Analyst A", "Analyst B", "Analyst C", ""]

        mitre_sets = [
            [{"tactic": "Execution", "technique": "PowerShell", "tid": "T1059.001"}],
            [{"tactic": "Defense Evasion", "technique": "Obfuscated/Compressed Files", "tid": "T1027"}],
            [{"tactic": "Lateral Movement", "technique": "Pass the Hash", "tid": "T1550.002"}],
            [{"tactic": "Exfiltration", "technique": "Exfiltration Over Web Service", "tid": "T1567"}],
        ]

        for i in range(18):
            created = (now - timedelta(hours=36 - i)).isoformat() + "Z"
            updated = created
            title = titles[i % 4]
            sev = sevs[i % 4]
            st = statuses[i % 4]
            owner = owners[i % 4]
            mitre = json.dumps(mitre_sets[i % 4])
            tags = json.dumps(["auto", "demo", sev.lower()])
            artifacts = json.dumps(
                [
                    {"type": "ip", "value": f"10.0.0.{i+10}"},
                    {"type": "hash", "value": "44d88612fea8a8f36de82e1278abb02f"},
                ]
            )
            sample.append(
                (
                    1000 + i,
                    title,
                    sev,
                    st,
                    owner,
                    created,
                    updated,
                    tags,
                    mitre,
                    artifacts,
                    "detector",
                    f"Auto-seeded alert {i}",
                )
            )

        conn.executemany(
            """
            INSERT OR IGNORE INTO alerts
              (id,title,severity,status,owner,created_at,updated_at,tags,mitre,artifacts,source,description)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            sample,
        )


# Initialize schema on import
init_schema()


# --------------------------- Models / Helpers ------------------------------ #

SEVERITIES = {"Low", "Medium", "High", "Critical"}
STATUSES = {"New", "In Progress", "Containment", "Resolved", "Suppressed"}

def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _row_to_obj(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "title": r["title"],
        "severity": r["severity"],
        "status": r["status"],
        "owner": r["owner"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "tags": json.loads(r["tags"] or "[]"),
        "mitre": json.loads(r["mitre"] or "[]"),
        "artifacts": json.loads(r["artifacts"] or "[]"),
        "source": r["source"],
        "description": r["description"] or "",
    }


def _apply_filters_sql(body: Dict[str, Any]) -> Tuple[str, List[Any]]:
    where = []
    params: List[Any] = []

    # text search
    q = (body.get("q") or "").strip()
    if q:
        where.append("(title LIKE ? OR description LIKE ?)")
        like = f"%{q}%"
        params += [like, like]

    # severity/status/owner filters
    if body.get("severity"):
        where.append("severity = ?")
        params.append(body["severity"])
    if body.get("status"):
        where.append("status = ?")
        params.append(body["status"])
    if body.get("owner"):
        where.append("owner = ?")
        params.append(body["owner"])

    # date range (ISO strings)
    if body.get("from"):
        where.append("created_at >= ?")
        params.append(body["from"])
    if body.get("to"):
        where.append("created_at <= ?")
        params.append(body["to"])

    sql = " WHERE " + " AND ".join(where) if where else ""
    return sql, params


# ------------------------------ Routes ------------------------------------ #

@alerts_bp.post("/api/alerts/list")
def list_alerts():
    """
    Body (all optional):
      {
        "q": "powershell",
        "severity": "High",
        "status": "New",
        "owner": "Analyst A",
        "from": "2025-01-01T00:00:00Z",
        "to":   "2025-01-31T23:59:59Z",
        "limit": 50,
        "offset": 0,
        "sort": "created_at",        # or severity,status,title
        "direction": "desc"          # asc|desc
      }
    """
    body = request.get_json(silent=True) or {}
    limit = int(body.get("limit", 100))
    offset = int(body.get("offset", 0))
    sort = body.get("sort", "created_at")
    direction = body.get("direction", "desc").lower()
    if sort not in {"created_at", "severity", "status", "title", "id"}:
        sort = "created_at"
    if direction not in {"asc", "desc"}:
        direction = "desc"

    where_sql, params = _apply_filters_sql(body)
    total = 0
    rows: List[sqlite3.Row] = []

    with db() as conn:
        # count
        cur = conn.execute(f"SELECT COUNT(*) AS c FROM alerts{where_sql}", params)
        total = int(cur.fetchone()["c"])

        # page
        cur = conn.execute(
            f"""
            SELECT * FROM alerts
            {where_sql}
            ORDER BY {sort} {direction}
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        )
        rows = cur.fetchall()

    return jsonify(
        {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [_row_to_obj(r) for r in rows],
        }
    )


@alerts_bp.post("/api/alerts/get")
def get_alert():
    body = request.get_json(silent=True) or {}
    aid = int(body.get("id", 0))
    if not aid:
        return jsonify({"error": "Missing id"}), 400
    with db() as conn:
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Not found"}), 404
        return jsonify(_row_to_obj(r))


@alerts_bp.post("/api/alerts/create")
def create_alert():
    """
    Create a new alert (useful for testing).
    Body:
      {
        "title": "New alert",
        "severity": "High",
        "status": "New",
        "owner": "Analyst A",
        "tags": ["edr","ransomware"],
        "mitre": [{"tactic":"Execution","technique":"PowerShell","tid":"T1059.001"}],
        "artifacts": [{"type":"ip","value":"1.2.3.4"}],
        "source": "edr",
        "description": "details here"
      }
    """
    b = request.get_json(silent=True) or {}
    title = (b.get("title") or "").strip() or "Alert"
    severity = b.get("severity", "Medium")
    status = b.get("status", "New")
    owner = b.get("owner", "")
    if severity not in SEVERITIES:
        return jsonify({"error": "Invalid severity"}), 400
    if status not in STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    now = _now_iso()
    with db() as conn:
        cur = conn.execute(
            """
            INSERT INTO alerts (title,severity,status,owner,created_at,updated_at,tags,mitre,artifacts,source,description)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                title,
                severity,
                status,
                owner,
                now,
                now,
                json.dumps(b.get("tags") or []),
                json.dumps(b.get("mitre") or []),
                json.dumps(b.get("artifacts") or []),
                b.get("source", "detector"),
                b.get("description", ""),
            ),
        )
        aid = cur.lastrowid

        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        return jsonify(_row_to_obj(r)), 201


@alerts_bp.post("/api/alerts/update")
def update_alert():
    """
    Update a single alert.
    Body:
      { "id": 1001, "status":"In Progress", "owner":"Analyst B", "severity":"High", "tags":[...], "mitre":[...], ... }
    """
    b = request.get_json(silent=True) or {}
    aid = int(b.get("id", 0))
    if not aid:
        return jsonify({"error": "Missing id"}), 400

    fields = []
    params: List[Any] = []

    def set_field(name: str, val: Any, allowed: Optional[set] = None, jsonify: bool = False):
        if val is None:
            return
        if allowed and val not in allowed:
            raise ValueError(f"Invalid {name}")
        fields.append(f"{name} = ?")
        params.append(json.dumps(val) if jsonify else val)

    try:
        set_field("title", b.get("title"))
        set_field("severity", b.get("severity"), SEVERITIES)
        set_field("status", b.get("status"), STATUSES)
        set_field("owner", b.get("owner"))
        set_field("tags", b.get("tags"), jsonify=True)
        set_field("mitre", b.get("mitre"), jsonify=True)
        set_field("artifacts", b.get("artifacts"), jsonify=True)
        set_field("source", b.get("source"))
        set_field("description", b.get("description"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not fields:
        return jsonify({"error": "No fields to update"}), 400

    fields.append("updated_at = ?")
    params.append(_now_iso())
    params.append(aid)

    with db() as conn:
        cur = conn.execute(f"UPDATE alerts SET {', '.join(fields)} WHERE id = ?", params)
        if cur.rowcount == 0:
            return jsonify({"error": "Not found"}), 404
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        return jsonify(_row_to_obj(r))


@alerts_bp.post("/api/alerts/bulk")
def bulk_actions():
    """
    Bulk mutator:
      Body:
        {
          "ids": [1001,1002],
          "action": "status",     # status|assign|severity|suppress|delete
          "value":  "In Progress" # or owner/severity; suppress sets status=Suppressed
        }
    """
    b = request.get_json(silent=True) or {}
    ids = b.get("ids") or []
    action = (b.get("action") or "").strip()
    value = b.get("value")

    if not ids or not isinstance(ids, list):
        return jsonify({"error": "ids required"}), 400

    with db() as conn:
        if action == "status":
            if value not in STATUSES:
                return jsonify({"error": "Invalid status"}), 400
            conn.execute(
                f"UPDATE alerts SET status=?, updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [value, _now_iso(), *ids],
            )
        elif action == "assign":
            conn.execute(
                f"UPDATE alerts SET owner=?, updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [value or "", _now_iso(), *ids],
            )
        elif action == "severity":
            if value not in SEVERITIES:
                return jsonify({"error": "Invalid severity"}), 400
            conn.execute(
                f"UPDATE alerts SET severity=?, updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [value, _now_iso(), *ids],
            )
        elif action == "suppress":
            conn.execute(
                f"UPDATE alerts SET status='Suppressed', updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [_now_iso(), *ids],
            )
        elif action == "delete":
            conn.execute(
                f"DELETE FROM alerts WHERE id IN ({','.join('?'*len(ids))})",
                ids,
            )
        else:
            return jsonify({"error": "Unknown action"}), 400

    return jsonify({"ok": True, "affected": len(ids)})


@alerts_bp.post("/api/alerts/export")
def export_alerts():
    """
    Exports filtered alerts to CSV (uses same filter keys as /list).
    """
    body = request.get_json(silent=True) or {}
    where_sql, params = _apply_filters_sql(body)

    with db() as conn:
        cur = conn.execute(f"SELECT * FROM alerts{where_sql} ORDER BY created_at DESC", params)
        rows = [ _row_to_obj(r) for r in cur.fetchall() ]

    # CSV
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id","title","severity","status","owner","created_at","updated_at","tags","mitre","artifacts","source","description"])
    for r in rows:
        writer.writerow([
            r["id"], r["title"], r["severity"], r["status"], r["owner"],
            r["created_at"], r["updated_at"],
            json.dumps(r["tags"]), json.dumps(r["mitre"]), json.dumps(r["artifacts"]),
            r["source"], r["description"]
        ])

    out = buf.getvalue().encode("utf-8")
    return Response(
        out,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts.csv"},
    )


@alerts_bp.post("/api/alerts/playbook")
def run_playbook():
    """
    Simulate launching a playbook for a given alert (hook your real SOAR here).
    Body: { "id": 1001, "playbook": "contain_host" }
    """
    b = request.get_json(silent=True) or {}
    aid = int(b.get("id", 0))
    pb = (b.get("playbook") or "contain_host").strip()

    # record quick note in description
    now = _now_iso()
    with db() as conn:
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Not found"}), 404

        desc = (r["description"] or "") + f"\n[{now}] Playbook launched: {pb}"
        conn.execute(
            "UPDATE alerts SET description=?, updated_at=? WHERE id=?",
            (desc, now, aid),
        )

    # pretend success
    return jsonify({"ok": True, "id": aid, "playbook": pb, "started_at": now})

=======
# backend/routes_alerts.py
from __future__ import annotations

import csv
import io
import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from flask import Blueprint, request, jsonify, Response, current_app

alerts_bp = Blueprint("alerts", __name__)

DB_PATH = "soc_dashboard.db"  # keep it at project root; change if needed


# --------------------------- DB Utilities ---------------------------------- #

@contextmanager
def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_schema() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                status TEXT NOT NULL,
                owner TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                tags TEXT DEFAULT '[]',           -- JSON array of strings
                mitre TEXT DEFAULT '[]',          -- JSON array of {tactic, technique, tid}
                artifacts TEXT DEFAULT '[]',      -- JSON array (ips, hashes, etc.)
                source TEXT DEFAULT 'detector',   -- SIEM rule, EDR, etc.
                description TEXT DEFAULT ''
            )
            """
        )

        # Simple index helpers
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_owner ON alerts(owner)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_sev ON alerts(severity)")

    seed_if_empty()


def seed_if_empty() -> None:
    with db() as conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM alerts")
        if (cur.fetchone()["c"] or 0) > 0:
            return

        now = datetime.utcnow()
        sample: List[Tuple] = []
        titles = [
            "Suspicious PowerShell",
            "Malware Detected",
            "Lateral Movement",
            "Exfil Attempt",
        ]
        sevs = ["Low", "Medium", "High", "Critical"]
        statuses = ["New", "In Progress", "Containment", "Resolved"]
        owners = ["Analyst A", "Analyst B", "Analyst C", ""]

        mitre_sets = [
            [{"tactic": "Execution", "technique": "PowerShell", "tid": "T1059.001"}],
            [{"tactic": "Defense Evasion", "technique": "Obfuscated/Compressed Files", "tid": "T1027"}],
            [{"tactic": "Lateral Movement", "technique": "Pass the Hash", "tid": "T1550.002"}],
            [{"tactic": "Exfiltration", "technique": "Exfiltration Over Web Service", "tid": "T1567"}],
        ]

        for i in range(18):
            created = (now - timedelta(hours=36 - i)).isoformat() + "Z"
            updated = created
            title = titles[i % 4]
            sev = sevs[i % 4]
            st = statuses[i % 4]
            owner = owners[i % 4]
            mitre = json.dumps(mitre_sets[i % 4])
            tags = json.dumps(["auto", "demo", sev.lower()])
            artifacts = json.dumps(
                [
                    {"type": "ip", "value": f"10.0.0.{i+10}"},
                    {"type": "hash", "value": "44d88612fea8a8f36de82e1278abb02f"},
                ]
            )
            sample.append(
                (
                    1000 + i,
                    title,
                    sev,
                    st,
                    owner,
                    created,
                    updated,
                    tags,
                    mitre,
                    artifacts,
                    "detector",
                    f"Auto-seeded alert {i}",
                )
            )

        conn.executemany(
            """
            INSERT OR IGNORE INTO alerts
              (id,title,severity,status,owner,created_at,updated_at,tags,mitre,artifacts,source,description)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            sample,
        )


# Initialize schema on import
init_schema()


# --------------------------- Models / Helpers ------------------------------ #

SEVERITIES = {"Low", "Medium", "High", "Critical"}
STATUSES = {"New", "In Progress", "Containment", "Resolved", "Suppressed"}

def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _row_to_obj(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "title": r["title"],
        "severity": r["severity"],
        "status": r["status"],
        "owner": r["owner"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "tags": json.loads(r["tags"] or "[]"),
        "mitre": json.loads(r["mitre"] or "[]"),
        "artifacts": json.loads(r["artifacts"] or "[]"),
        "source": r["source"],
        "description": r["description"] or "",
    }


def _apply_filters_sql(body: Dict[str, Any]) -> Tuple[str, List[Any]]:
    where = []
    params: List[Any] = []

    # text search
    q = (body.get("q") or "").strip()
    if q:
        where.append("(title LIKE ? OR description LIKE ?)")
        like = f"%{q}%"
        params += [like, like]

    # severity/status/owner filters
    if body.get("severity"):
        where.append("severity = ?")
        params.append(body["severity"])
    if body.get("status"):
        where.append("status = ?")
        params.append(body["status"])
    if body.get("owner"):
        where.append("owner = ?")
        params.append(body["owner"])

    # date range (ISO strings)
    if body.get("from"):
        where.append("created_at >= ?")
        params.append(body["from"])
    if body.get("to"):
        where.append("created_at <= ?")
        params.append(body["to"])

    sql = " WHERE " + " AND ".join(where) if where else ""
    return sql, params


# ------------------------------ Routes ------------------------------------ #

@alerts_bp.post("/api/alerts/list")
def list_alerts():
    """
    Body (all optional):
      {
        "q": "powershell",
        "severity": "High",
        "status": "New",
        "owner": "Analyst A",
        "from": "2025-01-01T00:00:00Z",
        "to":   "2025-01-31T23:59:59Z",
        "limit": 50,
        "offset": 0,
        "sort": "created_at",        # or severity,status,title
        "direction": "desc"          # asc|desc
      }
    """
    body = request.get_json(silent=True) or {}
    limit = int(body.get("limit", 100))
    offset = int(body.get("offset", 0))
    sort = body.get("sort", "created_at")
    direction = body.get("direction", "desc").lower()
    if sort not in {"created_at", "severity", "status", "title", "id"}:
        sort = "created_at"
    if direction not in {"asc", "desc"}:
        direction = "desc"

    where_sql, params = _apply_filters_sql(body)
    total = 0
    rows: List[sqlite3.Row] = []

    with db() as conn:
        # count
        cur = conn.execute(f"SELECT COUNT(*) AS c FROM alerts{where_sql}", params)
        total = int(cur.fetchone()["c"])

        # page
        cur = conn.execute(
            f"""
            SELECT * FROM alerts
            {where_sql}
            ORDER BY {sort} {direction}
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        )
        rows = cur.fetchall()

    return jsonify(
        {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [_row_to_obj(r) for r in rows],
        }
    )


@alerts_bp.post("/api/alerts/get")
def get_alert():
    body = request.get_json(silent=True) or {}
    aid = int(body.get("id", 0))
    if not aid:
        return jsonify({"error": "Missing id"}), 400
    with db() as conn:
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Not found"}), 404
        return jsonify(_row_to_obj(r))


@alerts_bp.post("/api/alerts/create")
def create_alert():
    """
    Create a new alert (useful for testing).
    Body:
      {
        "title": "New alert",
        "severity": "High",
        "status": "New",
        "owner": "Analyst A",
        "tags": ["edr","ransomware"],
        "mitre": [{"tactic":"Execution","technique":"PowerShell","tid":"T1059.001"}],
        "artifacts": [{"type":"ip","value":"1.2.3.4"}],
        "source": "edr",
        "description": "details here"
      }
    """
    b = request.get_json(silent=True) or {}
    title = (b.get("title") or "").strip() or "Alert"
    severity = b.get("severity", "Medium")
    status = b.get("status", "New")
    owner = b.get("owner", "")
    if severity not in SEVERITIES:
        return jsonify({"error": "Invalid severity"}), 400
    if status not in STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    now = _now_iso()
    with db() as conn:
        cur = conn.execute(
            """
            INSERT INTO alerts (title,severity,status,owner,created_at,updated_at,tags,mitre,artifacts,source,description)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                title,
                severity,
                status,
                owner,
                now,
                now,
                json.dumps(b.get("tags") or []),
                json.dumps(b.get("mitre") or []),
                json.dumps(b.get("artifacts") or []),
                b.get("source", "detector"),
                b.get("description", ""),
            ),
        )
        aid = cur.lastrowid

        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        return jsonify(_row_to_obj(r)), 201


@alerts_bp.post("/api/alerts/update")
def update_alert():
    """
    Update a single alert.
    Body:
      { "id": 1001, "status":"In Progress", "owner":"Analyst B", "severity":"High", "tags":[...], "mitre":[...], ... }
    """
    b = request.get_json(silent=True) or {}
    aid = int(b.get("id", 0))
    if not aid:
        return jsonify({"error": "Missing id"}), 400

    fields = []
    params: List[Any] = []

    def set_field(name: str, val: Any, allowed: Optional[set] = None, jsonify: bool = False):
        if val is None:
            return
        if allowed and val not in allowed:
            raise ValueError(f"Invalid {name}")
        fields.append(f"{name} = ?")
        params.append(json.dumps(val) if jsonify else val)

    try:
        set_field("title", b.get("title"))
        set_field("severity", b.get("severity"), SEVERITIES)
        set_field("status", b.get("status"), STATUSES)
        set_field("owner", b.get("owner"))
        set_field("tags", b.get("tags"), jsonify=True)
        set_field("mitre", b.get("mitre"), jsonify=True)
        set_field("artifacts", b.get("artifacts"), jsonify=True)
        set_field("source", b.get("source"))
        set_field("description", b.get("description"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not fields:
        return jsonify({"error": "No fields to update"}), 400

    fields.append("updated_at = ?")
    params.append(_now_iso())
    params.append(aid)

    with db() as conn:
        cur = conn.execute(f"UPDATE alerts SET {', '.join(fields)} WHERE id = ?", params)
        if cur.rowcount == 0:
            return jsonify({"error": "Not found"}), 404
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        return jsonify(_row_to_obj(r))


@alerts_bp.post("/api/alerts/bulk")
def bulk_actions():
    """
    Bulk mutator:
      Body:
        {
          "ids": [1001,1002],
          "action": "status",     # status|assign|severity|suppress|delete
          "value":  "In Progress" # or owner/severity; suppress sets status=Suppressed
        }
    """
    b = request.get_json(silent=True) or {}
    ids = b.get("ids") or []
    action = (b.get("action") or "").strip()
    value = b.get("value")

    if not ids or not isinstance(ids, list):
        return jsonify({"error": "ids required"}), 400

    with db() as conn:
        if action == "status":
            if value not in STATUSES:
                return jsonify({"error": "Invalid status"}), 400
            conn.execute(
                f"UPDATE alerts SET status=?, updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [value, _now_iso(), *ids],
            )
        elif action == "assign":
            conn.execute(
                f"UPDATE alerts SET owner=?, updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [value or "", _now_iso(), *ids],
            )
        elif action == "severity":
            if value not in SEVERITIES:
                return jsonify({"error": "Invalid severity"}), 400
            conn.execute(
                f"UPDATE alerts SET severity=?, updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [value, _now_iso(), *ids],
            )
        elif action == "suppress":
            conn.execute(
                f"UPDATE alerts SET status='Suppressed', updated_at=? WHERE id IN ({','.join('?'*len(ids))})",
                [_now_iso(), *ids],
            )
        elif action == "delete":
            conn.execute(
                f"DELETE FROM alerts WHERE id IN ({','.join('?'*len(ids))})",
                ids,
            )
        else:
            return jsonify({"error": "Unknown action"}), 400

    return jsonify({"ok": True, "affected": len(ids)})


@alerts_bp.post("/api/alerts/export")
def export_alerts():
    """
    Exports filtered alerts to CSV (uses same filter keys as /list).
    """
    body = request.get_json(silent=True) or {}
    where_sql, params = _apply_filters_sql(body)

    with db() as conn:
        cur = conn.execute(f"SELECT * FROM alerts{where_sql} ORDER BY created_at DESC", params)
        rows = [ _row_to_obj(r) for r in cur.fetchall() ]

    # CSV
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id","title","severity","status","owner","created_at","updated_at","tags","mitre","artifacts","source","description"])
    for r in rows:
        writer.writerow([
            r["id"], r["title"], r["severity"], r["status"], r["owner"],
            r["created_at"], r["updated_at"],
            json.dumps(r["tags"]), json.dumps(r["mitre"]), json.dumps(r["artifacts"]),
            r["source"], r["description"]
        ])

    out = buf.getvalue().encode("utf-8")
    return Response(
        out,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts.csv"},
    )


@alerts_bp.post("/api/alerts/playbook")
def run_playbook():
    """
    Simulate launching a playbook for a given alert (hook your real SOAR here).
    Body: { "id": 1001, "playbook": "contain_host" }
    """
    b = request.get_json(silent=True) or {}
    aid = int(b.get("id", 0))
    pb = (b.get("playbook") or "contain_host").strip()

    # record quick note in description
    now = _now_iso()
    with db() as conn:
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Not found"}), 404

        desc = (r["description"] or "") + f"\n[{now}] Playbook launched: {pb}"
        conn.execute(
            "UPDATE alerts SET description=?, updated_at=? WHERE id=?",
            (desc, now, aid),
        )

    # pretend success
    return jsonify({"ok": True, "id": aid, "playbook": pb, "started_at": now})

>>>>>>> deploy
