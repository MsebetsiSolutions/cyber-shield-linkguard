# backend/routes_reports.py
from __future__ import annotations

import csv
import io
import json
import math
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from flask import Blueprint, request, jsonify, Response

reports_bp = Blueprint("reports", __name__)

DB_PATH = "soc_dashboard.db"  # same DB as alerts

# ------------------------------ DB Utils ---------------------------------- #

@contextmanager
def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
        conn.commit()
    finally:
        conn.close()


def _now_utc() -> datetime:
    return datetime.utcnow()


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat() + "Z"


def init_schema() -> None:
    with db() as conn:
        # Incidents (for KPIs / MTTR)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                opened_at TEXT NOT NULL,
                closed_at TEXT,                -- NULL until resolved
                owner TEXT DEFAULT '',
                tags TEXT DEFAULT '[]'
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inc_opened ON incidents(opened_at)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inc_closed ON incidents(closed_at)")

        # Compliance catalogue
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS compliance (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL,          -- Compliant|Partial|Non-Compliant|Exception
                framework TEXT NOT NULL,       -- ISO27001|NIST800-53|SOC2|CIS|GDPR|...
                owner TEXT DEFAULT '',
                last_audit TEXT,
                evidence TEXT                  -- URL or path
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cmp_fw ON compliance(framework)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cmp_status ON compliance(status)")

        # Schedules
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS report_schedules (
                id INTEGER PRIMARY KEY,
                type TEXT NOT NULL,            -- exec_summary|weekly_kpi|monthly_kpi|compliance_snapshot
                cadence TEXT NOT NULL,         -- Weekly|Monthly
                format TEXT NOT NULL,          -- PDF|CSV|JSON
                recipients TEXT NOT NULL,      -- JSON array of emails
                next_run TEXT NOT NULL,        -- ISO timestamp
                active INTEGER DEFAULT 1
            )
            """
        )

    seed_if_empty()


def seed_if_empty() -> None:
    with db() as conn:
        # Seed incidents if empty
        cur = conn.execute("SELECT COUNT(*) AS c FROM incidents")
        if (cur.fetchone()["c"] or 0) == 0:
            now = _now_utc()
            severities = ["Low", "Medium", "High", "Critical"]
            rows = []
            # 40 incidents over last 30 days
            for i in range(40):
                opened = now - timedelta(days=29 - (i % 30), hours=i % 12)
                # close ~70% of them within 1-48h
                if i % 10 == 0:
                    closed_at = None
                else:
                    closed_at = opened + timedelta(hours=(i % 48) + 1)
                rows.append(
                    (
                        f"Incident #{1000 + i}",
                        severities[i % 4],
                        _iso(opened),
                        _iso(closed_at) if closed_at else None,
                        ["Analyst A", "Analyst B", "Analyst C"][i % 3],
                        json.dumps(["seed"]),
                    )
                )
            conn.executemany(
                "INSERT INTO incidents (title,severity,opened_at,closed_at,owner,tags) VALUES (?,?,?,?,?,?)",
                rows,
            )

        # Seed compliance if empty
        cur = conn.execute("SELECT COUNT(*) AS c FROM compliance")
        if (cur.fetchone()["c"] or 0) == 0:
            sample = [
                (1, "Access Control Policy", "Compliant", "ISO27001", "SecOps", _iso(_now_utc() - timedelta(days=14)), ""),
                (2, "Vulnerability Mgmt", "Partial", "SOC2", "SecOps", _iso(_now_utc() - timedelta(days=21)), ""),
                (3, "Change Mgmt", "Non-Compliant", "NIST800-53", "IT", _iso(_now_utc() - timedelta(days=45)), ""),
                (4, "Incident Response", "Compliant", "CIS", "SecOps", _iso(_now_utc() - timedelta(days=7)), ""),
                (5, "Data Retention", "Exception", "GDPR", "Legal", _iso(_now_utc() - timedelta(days=30)), ""),
            ]
            conn.executemany(
                "INSERT OR IGNORE INTO compliance (id,name,status,framework,owner,last_audit,evidence) VALUES (?,?,?,?,?,?,?)",
                sample,
            )


# Initialize schema on import
init_schema()

# ------------------------------ KPI Helpers -------------------------------- #

def _parse_iso(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        # strip Z if present
        s2 = s.rstrip("Z")
        return datetime.fromisoformat(s2)
    except Exception:
        return None


def _mttr_hours(incidents: List[sqlite3.Row], window_days: int = 30) -> Tuple[str, str]:
    """
    Returns (avg_mttr, p95_mttr) as humanized strings (e.g., "3.2h")
    """
    cutoff = _now_utc() - timedelta(days=window_days)
    durations = []
    for r in incidents:
        opened = _parse_iso(r["opened_at"])
        closed = _parse_iso(r["closed_at"])
        if not opened or not closed:
            continue
        if closed < cutoff:
            continue
        d = (closed - opened).total_seconds() / 3600.0  # hours
        if d >= 0:
            durations.append(d)

    if not durations:
        return "--", "--"

    durations.sort()
    avg = sum(durations) / len(durations)
    p95 = durations[math.floor(0.95 * (len(durations) - 1))]
    def fmt(x: float) -> str:
        if x >= 24:
            return f"{x/24:.1f}d"
        return f"{x:.1f}h"
    return fmt(avg), fmt(p95)


def _trend_series() -> Dict[str, Any]:
    """
    Build simple 14-day trend series from incidents and alerts counts per day.
    Alerts table is optional (if routes_alerts loaded earlier it exists).
    """
    days = 14
    labels = []
    incidents_counts = []
    alerts_counts = []

    start = _now_utc().date() - timedelta(days=days - 1)
    with db() as conn:
        for i in range(days):
            day = start + timedelta(days=i)
            labels.append(day.isoformat())

            # incidents opened that day
            cur = conn.execute(
                "SELECT COUNT(*) AS c FROM incidents WHERE opened_at >= ? AND opened_at < ?",
                (_iso(datetime.combine(day, datetime.min.time())),
                 _iso(datetime.combine(day + timedelta(days=1), datetime.min.time()))),
            )
            incidents_counts.append(int(cur.fetchone()["c"]))

            # alerts created that day (if table exists)
            try:
                cur = conn.execute(
                    "SELECT COUNT(*) AS c FROM alerts WHERE created_at >= ? AND created_at < ?",
                    (_iso(datetime.combine(day, datetime.min.time())),
                     _iso(datetime.combine(day + timedelta(days=1), datetime.min.time()))),
                )
                alerts_counts.append(int(cur.fetchone()["c"]))
            except sqlite3.OperationalError:
                alerts_counts.append(0)

    return {"labels": labels, "incidents": incidents_counts, "alerts": alerts_counts}


# ------------------------------ Routes: KPIs -------------------------------- #

@reports_bp.post("/api/reports/kpis")
def kpis():
    """
    Returns KPI summary for dashboard/reports.
    Response:
      { incidents7, closed7, mttr, mttr_p95, trend:{labels,incidents,alerts} }
    """
    now = _now_utc()
    with db() as conn:
        cur = conn.execute(
            "SELECT * FROM incidents WHERE opened_at >= ?",
            (_iso(now - timedelta(days=7)),),
        )
        inc7_rows = cur.fetchall()

        cur = conn.execute(
            "SELECT * FROM incidents WHERE closed_at IS NOT NULL AND closed_at >= ?",
            (_iso(now - timedelta(days=7)),),
        )
        closed7 = int(cur.fetchone()["COUNT(*)"] if "COUNT(*)" in cur.description else len(cur.fetchall()))

        # safer closed count:
        cur = conn.execute(
            "SELECT COUNT(*) AS c FROM incidents WHERE closed_at IS NOT NULL AND closed_at >= ?",
            (_iso(now - timedelta(days=7)),),
        )
        closed7 = int(cur.fetchone()["c"])

        # compute MTTR & p95 over last 30 days
        cur = conn.execute(
            "SELECT * FROM incidents WHERE closed_at IS NOT NULL AND closed_at >= ?",
            (_iso(now - timedelta(days=30)),),
        )
        mttr, p95 = _mttr_hours(cur.fetchall(), 30)

    return jsonify({
        "incidents7": len(inc7_rows),
        "closed7": closed7,
        "mttr": mttr,
        "mttr_p95": p95,
        "trend": _trend_series()
    })


# ------------------------------ Routes: Export ------------------------------ #

def _daterange_from_to(body: Dict[str, Any], default_days: int) -> Tuple[str, str]:
    now = _now_utc()
    to_dt = _parse_iso(body.get("to")) or now
    from_dt = _parse_iso(body.get("from")) or (to_dt - timedelta(days=default_days))
    return _iso(from_dt), _iso(to_dt)


def _export_rows(dataset: str, dt_from: str, dt_to: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Returns (rows, headers) for the chosen dataset.
    """
    rows: List[Dict[str, Any]] = []
    headers: List[str] = []

    with db() as conn:
        if dataset == "events24h":
            # If you have a dedicated events table, swap this.
            # Here we use alerts as proxy for "events".
            cur = conn.execute(
                "SELECT id,title,severity,status,owner,created_at,source FROM alerts WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC",
                (dt_from, dt_to),
            )
            rows = [dict(r) for r in cur.fetchall()]
            headers = ["id","title","severity","status","owner","created_at","source"]

        elif dataset == "alerts7d":
            cur = conn.execute(
                "SELECT id,title,severity,status,owner,created_at,updated_at FROM alerts WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC",
                (dt_from, dt_to),
            )
            rows = [dict(r) for r in cur.fetchall()]
            headers = ["id","title","severity","status","owner","created_at","updated_at"]

        elif dataset == "incidents30d":
            cur = conn.execute(
                "SELECT id,title,severity,opened_at,closed_at,owner FROM incidents WHERE opened_at >= ? AND opened_at <= ? ORDER BY opened_at DESC",
                (dt_from, dt_to),
            )
            rows = [dict(r) for r in cur.fetchall()]
            headers = ["id","title","severity","opened_at","closed_at","owner"]

        elif dataset == "intel7d":
            # If you store intel, map from your table. Returning empty placeholder.
            rows = []
            headers = ["type","indicator","source","first_seen","last_seen","score"]

        elif dataset == "compliance":
            cur = conn.execute(
                "SELECT id,name,status,framework,owner,last_audit,evidence FROM compliance ORDER BY framework, name",
            )
            rows = [dict(r) for r in cur.fetchall()]
            headers = ["id","name","status","framework","owner","last_audit","evidence"]

        else:
            rows = []
            headers = []

    return rows, headers


@reports_bp.post("/api/reports/export")
def export():
    """
    Body:
      { dataset: 'events24h'|'alerts7d'|'incidents30d'|'intel7d'|'compliance',
        format: 'csv'|'json',
        from?: ISO, to?: ISO }
    """
    body = request.get_json(silent=True) or {}
    dataset = (body.get("dataset") or "events24h").strip()
    fmt = (body.get("format") or "csv").lower()

    # Default windows
    defaults = {
        "events24h": 1,
        "alerts7d": 7,
        "incidents30d": 30,
        "intel7d": 7,
        "compliance": 3650,
    }
    days = defaults.get(dataset, 7)
    dt_from, dt_to = _daterange_from_to(body, days)

    rows, headers = _export_rows(dataset, dt_from, dt_to)

    if fmt == "json":
        return jsonify({"dataset": dataset, "from": dt_from, "to": dt_to, "rows": rows})

    # CSV default
    buf = io.StringIO()
    w = csv.writer(buf)
    if headers:
        w.writerow(headers)
        for r in rows:
            w.writerow([r.get(h, "") for h in headers])
    out = buf.getvalue().encode("utf-8")
    return Response(
        out,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset}.csv"},
    )

# ------------------------------ Routes: Compliance ------------------------- #

@reports_bp.post("/api/compliance/list")
def compliance_list():
    """
    Body (optional filters): { framework?: str, status?: str }
    Returns { rows: [...] }
    """
    b = request.get_json(silent=True) or {}
    fw = b.get("framework")
    st = b.get("status")

    where = []
    params: List[Any] = []
    if fw:
        where.append("framework = ?"); params.append(fw)
    if st:
        where.append("status = ?"); params.append(st)

    sql = " WHERE " + " AND ".join(where) if where else ""
    with db() as conn:
        cur = conn.execute(
            f"SELECT id,name,status,framework,owner,last_audit,evidence FROM compliance{sql} ORDER BY framework,name",
            params,
        )
        rows = [dict(r) for r in cur.fetchall()]

    return jsonify({"rows": rows})


@reports_bp.post("/api/compliance/update")
def compliance_update():
    """
    Body: { id:int, status?:str, owner?:str, evidence?:str, name?:str, framework?:str, last_audit?:ISO }
    """
    b = request.get_json(silent=True) or {}
    cid = int(b.get("id", 0))
    if not cid:
        return jsonify({"error": "Missing id"}), 400

    fields = []
    params: List[Any] = []
    for key in ["status", "owner", "evidence", "name", "framework", "last_audit"]:
        if key in b and b[key] is not None:
            fields.append(f"{key} = ?")
            params.append(b[key])
    if not fields:
        return jsonify({"error": "No fields to update"}), 400

    params.append(cid)
    with db() as conn:
        cur = conn.execute(f"UPDATE compliance SET {', '.join(fields)} WHERE id = ?", params)
        if cur.rowcount == 0:
            return jsonify({"error": "Not found"}), 404
        cur = conn.execute("SELECT id,name,status,framework,owner,last_audit,evidence FROM compliance WHERE id = ?", (cid,))
        row = cur.fetchone()
        return jsonify(dict(row))


@reports_bp.post("/api/compliance/export")
def compliance_export():
    """
    Return the whole compliance table as CSV.
    """
    with db() as conn:
        cur = conn.execute("SELECT id,name,status,framework,owner,last_audit,evidence FROM compliance ORDER BY framework,name")
        rows = [dict(r) for r in cur.fetchall()]

    buf = io.StringIO()
    w = csv.writer(buf)
    headers = ["id","name","status","framework","owner","last_audit","evidence"]
    w.writerow(headers)
    for r in rows:
        w.writerow([r.get(h, "") for h in headers])
    out = buf.getvalue().encode("utf-8")
    return Response(out, mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=compliance.csv"})

# ------------------------------ Routes: Scheduler -------------------------- #

def _next_run_from_cadence(cadence: str) -> str:
    now = _now_utc()
    if (cadence or "").lower().startswith("week"):
        nxt = now + timedelta(days=7)
    else:
        # monthly, approximate 30d
        nxt = now + timedelta(days=30)
    return _iso(nxt)


@reports_bp.post("/api/reports/schedule")
def schedule_create():
    """
    Body:
      { type, cadence, recipients:[...], format }
    """
    b = request.get_json(silent=True) or {}
    rtype = (b.get("type") or "weekly_kpi").strip()
    cadence = (b.get("cadence") or "Weekly").strip()
    fmt = (b.get("format") or "PDF").strip()
    recipients = b.get("recipients") or []

    if not isinstance(recipients, list):
        return jsonify({"error": "recipients must be a list"}), 400

    next_run = _next_run_from_cadence(cadence)
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO report_schedules (type,cadence,format,recipients,next_run,active) VALUES (?,?,?,?,?,1)",
            (rtype, cadence, fmt, json.dumps(recipients), next_run),
        )
        sid = cur.lastrowid
        cur = conn.execute("SELECT * FROM report_schedules WHERE id = ?", (sid,))
        r = cur.fetchone()
        return jsonify({
            "id": sid,
            "type": r["type"],
            "cadence": r["cadence"],
            "format": r["format"],
            "recipients": json.loads(r["recipients"] or "[]"),
            "next_run": r["next_run"],
            "active": bool(r["active"]),
        }), 201


@reports_bp.post("/api/reports/schedules")
def schedule_list():
    """
    Returns { schedules:[...] }
    """
    with db() as conn:
        cur = conn.execute("SELECT * FROM report_schedules WHERE active=1 ORDER BY next_run ASC")
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append({
                "id": r["id"],
                "type": r["type"],
                "cadence": r["cadence"],
                "format": r["format"],
                "recipients": json.loads(r["recipients"] or "[]"),
                "next_run": r["next_run"],
                "active": bool(r["active"]),
            })
    return jsonify({"schedules": items})


@reports_bp.post("/api/reports/schedule/cancel")
def schedule_cancel():
    """
    Body: { id }
    """
    b = request.get_json(silent=True) or {}
    sid = int(b.get("id", 0))
    if not sid:
        return jsonify({"error": "Missing id"}), 400

    with db() as conn:
        cur = conn.execute("UPDATE report_schedules SET active=0 WHERE id = ?", (sid,))
    return jsonify({"ok": True})

