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

import os

WHITELIST_PATH = os.path.join(os.path.dirname(__file__), '..', 'sa_whitelist.json')

alerts_bp = Blueprint("alerts", __name__)

DB_PATH = "soc_dashboard.db"  # keep it at project root; change if needed
WHITELIST_PATH = "sa_whitelist.json"


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

        # incidents table for grouped alerts (simple prototype)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT,
                created_at TEXT NOT NULL,
                members TEXT DEFAULT '[]',    -- JSON array of alert ids
                meta TEXT DEFAULT '{}'         -- JSON object
            )
            """
        )

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


def load_whitelist() -> List[str]:
    try:
        p = os.path.abspath(WHITELIST_PATH)
        if not os.path.exists(p):
            return []
        with open(p, 'r', encoding='utf-8') as f:
            return json.load(f) or []
    except Exception:
        return []


def save_whitelist(items: List[str]) -> None:
    p = os.path.abspath(WHITELIST_PATH)
    try:
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2)
    except Exception:
        pass


def load_whitelist() -> List[str]:
    try:
        with open(WHITELIST_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except FileNotFoundError:
        return []
    except Exception:
        return []
    return []


def save_whitelist(items: List[str]) -> None:
    with open(WHITELIST_PATH, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)


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


@alerts_bp.post("/api/alerts/score")
def score_alerts():
    """
    Return alerts with a mock risk score (0-100) based on severity, tags, mitre, and recent repeats.
    Body uses same filters as /api/alerts/list
    """
    body = request.get_json(silent=True) or {}
    where_sql, params = _apply_filters_sql(body)

    with db() as conn:
        cur = conn.execute(f"SELECT * FROM alerts {where_sql} ORDER BY created_at DESC", params)
        rows = cur.fetchall()

        items: List[Dict[str, Any]] = []
        now = datetime.utcnow()
        cutoff = (now - timedelta(hours=24)).isoformat() + "Z"

        # base severity mapping
        base = {"Low": 20, "Medium": 50, "High": 75, "Critical": 90}

        for r in rows:
            obj = _row_to_obj(r)
            sev = obj.get("severity") or "Medium"
            score = int(base.get(sev, 50))

            # add for mitre techniques
            mitre_len = len(obj.get("mitre") or [])
            score += mitre_len * 5

            # tags weight
            tags_len = len(obj.get("tags") or [])
            score += tags_len * 3

            # repeated similar alerts in last 24 hours (same title)
            cur2 = conn.execute("SELECT COUNT(*) AS c FROM alerts WHERE title = ? AND created_at >= ?", (obj.get("title"), cutoff))
            repeats = int(cur2.fetchone()["c"] or 0)
            score += min(20, repeats * 4)

            # cap
            score = max(0, min(100, score))

            obj["risk"] = score
            obj["risk_reason"] = f"base={base.get(sev,50)} mitre={mitre_len} tags={tags_len} repeats={repeats}"
            items.append(obj)

    return jsonify({"total": len(items), "items": items})


@alerts_bp.post("/api/alerts/enrich")
def enrich_alert():
    """
    Return mock enrichment data for an alert id.
    Body: { "id": 1001 }
    Response: { id, artifacts: [...], enrichment: { ips: [...], hashes: [...], meta: {...} } }
    """
    b = request.get_json(silent=True) or {}
    aid = int(b.get("id") or 0)
    if not aid:
        return jsonify({"error": "Missing id"}), 400

    with db() as conn:
        cur = conn.execute("SELECT * FROM alerts WHERE id = ?", (aid,))
        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Not found"}), 404
        alert = _row_to_obj(r)

        # Build mock enrichment
        enrichment: Dict[str, Any] = {"ips": [], "hashes": [], "meta": {}}

        for art in alert.get("artifacts", []):
            if art.get("type") == "ip":
                ip = art.get("value")
                enrichment["ips"].append({
                    "ip": ip,
                    "geo": {"country": "ZA", "city": "Johannesburg"},
                    "isp": "MockISP Ltd",
                    "reputation_score": 78,
                    "threat_category": "scanning"
                })
            elif art.get("type") == "hash":
                h = art.get("value")
                enrichment["hashes"].append({
                    "hash": h,
                    "malware_verdict": "suspicious",
                    "vendors": [{"name": "MockAV", "verdict": "malicious"}],
                    "first_seen": (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"
                })

        # Add some meta enrichment (TI lookups, phishing detection hint)
        enrichment["meta"]["ti_sources_checked"] = ["mock-ti-feed"]
        enrichment["meta"]["phishing_likelihood"] = 12
        enrichment["meta"]["notes"] = "This is mock enrichment for demo purposes. Replace with real lookups."

        # SA phishing detection (simple keyword-based heuristic)
        sa_keywords = ["sars","fnb","absa","capitec","standard bank","nsfas","cipc","sassa","south african revenue","tax office"]
        text_blob = "\n".join([alert.get("title",""), alert.get("description","")]).lower()
        sa_hits = [k for k in sa_keywords if k in text_blob]
        # also scan artifacts (emails/domains)
        for art in alert.get("artifacts", []):
            v = (art.get("value") or "").lower()
            for k in sa_keywords:
                if k in v:
                    if k not in sa_hits:
                        sa_hits.append(k)

        # apply whitelist: remove any matches that are whitelisted
        wl = [x.lower() for x in load_whitelist()]
        filtered_hits = [h for h in sa_hits if h.lower() not in wl]
        enrichment["meta"]["sa_phishing"] = bool(filtered_hits)
        enrichment["meta"]["sa_phishing_matches"] = filtered_hits

    return jsonify({"id": aid, "artifacts": alert.get("artifacts"), "enrichment": enrichment})


@alerts_bp.post("/api/alerts/group")
def group_alerts():
    """
    Return simple grouping of alerts into candidate incidents.
    Body: same filters as /api/alerts/list plus optional "hours" window (default 48)
    """
    b = request.get_json(silent=True) or {}
    hours = int(b.get("hours", 48))
    where_sql, params = _apply_filters_sql(b)

    with db() as conn:
        cur = conn.execute(f"SELECT * FROM alerts {where_sql} ORDER BY created_at DESC", params)
        rows = cur.fetchall()

        groups: Dict[str, Dict[str, Any]] = {}
        sev_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}

        for r in rows:
            obj = _row_to_obj(r)
            # build grouping key: title + first ip artifact (if any)
            first_ip = None
            for art in obj.get("artifacts", []):
                if art.get("type") == "ip":
                    first_ip = art.get("value")
                    break
            key = f"{obj.get('title','')}//{first_ip or ''}"

            g = groups.get(key)
            if not g:
                g = {"title": obj.get("title"), "members": [], "count": 0, "severity": obj.get("severity"), "first_ip": first_ip, "created_at": obj.get("created_at")}
                groups[key] = g

            g["members"].append(obj["id"])
            g["count"] = len(g["members"])
            # pick highest severity
            if sev_rank.get(obj.get("severity"), 0) > sev_rank.get(g.get("severity"), 0):
                g["severity"] = obj.get("severity")

        results = []
        for idx, (k, v) in enumerate(groups.items(), start=1):
            results.append({"incident_id": idx, "title": v["title"], "severity": v["severity"], "count": v["count"], "members": v["members"], "first_ip": v.get("first_ip"), "created_at": v.get("created_at")})

    return jsonify({"total": len(results), "groups": results})


@alerts_bp.post("/api/alerts/merge")
def merge_alerts():
    """
    Create an incident from alert ids and tag/update alerts.
    Body: { "ids": [1000,1001], "title": "Optional title" }
    """
    b = request.get_json(silent=True) or {}
    ids = b.get("ids") or []
    if not ids or not isinstance(ids, list):
        return jsonify({"error": "ids required"}), 400

    title = (b.get("title") or "")
    now = _now_iso()

    with db() as conn:
        # compute severity as highest among members
        cur = conn.execute(f"SELECT * FROM alerts WHERE id IN ({','.join('?'*len(ids))})", ids)
        rows = [ _row_to_obj(r) for r in cur.fetchall() ]
        if not rows:
            return jsonify({"error": "No alerts found"}), 404

        sev_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        highest = "Medium"
        for r in rows:
            if sev_rank.get(r.get("severity"),0) > sev_rank.get(highest,0):
                highest = r.get("severity")

        if not title:
            title = f"Incident: {rows[0].get('title')} (group)"

        # create a lightweight incident id (timestamp-based) and tag alerts; do not assume incidents table schema
        incident_id = int(datetime.utcnow().timestamp())

        # update member alerts (set status to Containment and add incident tag)
        for aid in ids:
            cur = conn.execute("SELECT tags FROM alerts WHERE id = ?", (aid,))
            row = cur.fetchone()
            tags = json.loads(row["tags"] or "[]") if row else []
            tags.append(f"incident:{incident_id}")
            conn.execute("UPDATE alerts SET status = ?, tags = ?, updated_at = ? WHERE id = ?",
                         ("Containment", json.dumps(tags), now, aid))

    return jsonify({"ok": True, "incident_id": incident_id, "title": title, "members": ids})


@alerts_bp.post('/api/alerts/scan_sa_phishing')
def scan_sa_phishing():
    """
    Scan alerts for South African phishing indicators and tag them.
    Body: { "query":..., "severity":..., "limit": 500 }
    Response: { total_scanned, matched, matched_ids: [...] }
    """
    b = request.get_json(silent=True) or {}
    where_sql, params = _apply_filters_sql(b)
    limit = int(b.get('limit', 500))

    sa_keywords = ["sars","fnb","absa","capitec","standard bank","nsfas","cipc","sassa","south african revenue","tax office"]

    matched_ids: List[int] = []
    scanned = 0
    with db() as conn:
        cur = conn.execute(f"SELECT * FROM alerts {where_sql} ORDER BY created_at DESC LIMIT ?", params + [limit])
        rows = cur.fetchall()
        wl = [x.lower() for x in load_whitelist()]
        for r in rows:
            scanned += 1
            obj = _row_to_obj(r)
            text_blob = "\n".join([obj.get('title',''), obj.get('description','')]).lower()
            hits = [k for k in sa_keywords if k in text_blob]
            for art in obj.get('artifacts', []):
                v = (art.get('value') or '').lower()
                for k in sa_keywords:
                    if k in v and k not in hits:
                        hits.append(k)
            # apply whitelist: remove whitelisted keywords from hits
            filtered = [h for h in hits if h.lower() not in wl]
            if filtered:
                # tag alert (idempotent)
                cur2 = conn.execute("SELECT tags FROM alerts WHERE id = ?", (obj['id'],))
                row = cur2.fetchone()
                tags = json.loads(row['tags'] or '[]') if row else []
                if 'sa_phishing' not in tags:
                    tags.append('sa_phishing')
                conn.execute("UPDATE alerts SET tags = ?, updated_at = ? WHERE id = ?", (json.dumps(tags), _now_iso(), obj['id']))
                matched_ids.append(obj['id'])

    return jsonify({"total_scanned": scanned, "matched": len(matched_ids), "matched_ids": matched_ids})


@alerts_bp.route('/api/alerts/whitelist', methods=['GET', 'POST', 'DELETE'])
def manage_whitelist():
    """Get/Add/Delete whitelist entries.
    GET -> return list
    POST { "value": "string" } -> add
    DELETE { "value": "string" } -> remove
    """
    items = load_whitelist()
    if request.method == 'GET':
        return jsonify({"whitelist": items})

    b = request.get_json(silent=True) or {}
    val = (b.get('value') or '').strip()
    if not val:
        return jsonify({"error": "value required"}), 400

    if request.method == 'POST':
        if val not in items:
            items.append(val)
            save_whitelist(items)
        return jsonify({'ok': True, 'whitelist': items})

    if request.method == 'DELETE':
        if val in items:
            items = [x for x in items if x != val]
            save_whitelist(items)
        return jsonify({'ok': True, 'whitelist': items})


@alerts_bp.post('/api/alerts/mark_fp')
def mark_false_positive():
    """Mark an alert as false positive for SA phishing by removing the `sa_phishing` tag.
    Body: { "id": 1001 }
    """
    b = request.get_json(silent=True) or {}
    aid = int(b.get('id') or 0)
    if not aid:
        return jsonify({'error': 'Missing id'}), 400

    with db() as conn:
        cur = conn.execute('SELECT tags FROM alerts WHERE id = ?', (aid,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Not found'}), 404
        tags = json.loads(row['tags'] or '[]')
        new_tags = [t for t in tags if t != 'sa_phishing']
        conn.execute('UPDATE alerts SET tags = ?, updated_at = ? WHERE id = ?', (json.dumps(new_tags), _now_iso(), aid))

    return jsonify({'ok': True, 'id': aid, 'removed': 'sa_phishing' in tags})


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

