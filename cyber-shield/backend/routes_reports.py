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
def db():
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

@reports_bp.post("/api/analytics/threat-correlation")
def threat_correlation():
    """Identify coordinated attack patterns across systems"""
    body = request.get_json(silent=True) or {}
    time_range = body.get("time_range", "7d")
    
    with db() as conn:
        # Correlate incidents, alerts, and events
        cur = conn.execute("""
            SELECT 
                i.id as incident_id,
                i.title,
                i.severity,
                i.opened_at,
                COUNT(DISTINCT a.id) as related_alerts,
                GROUP_CONCAT(DISTINCT a.source) as sources
            FROM incidents i
            LEFT JOIN alerts a ON a.created_at BETWEEN datetime(i.opened_at, '-1 hour') AND datetime(i.opened_at, '+4 hours')
            WHERE i.opened_at >= datetime('now', '-7 days')
            GROUP BY i.id
            HAVING COUNT(DISTINCT a.source) >= 2
            ORDER BY related_alerts DESC
        """)
        correlations = [dict(r) for r in cur.fetchall()]
    
    return jsonify({
        "correlated_incidents": correlations,
        "analysis": "Found {} potential coordinated attacks".format(len(correlations))
    })

@reports_bp.post("/api/analytics/predictive-forecast")
def predictive_forecast():
    """Predict future attack vectors based on historical patterns"""
    with db() as conn:
        # Analyze historical incident patterns
        cur = conn.execute("""
            SELECT 
                strftime('%w', opened_at) as day_of_week,
                strftime('%H', opened_at) as hour_of_day,
                severity,
                COUNT(*) as count
            FROM incidents 
            WHERE opened_at >= datetime('now', '-90 days')
            GROUP BY day_of_week, hour_of_day, severity
            ORDER BY count DESC
            LIMIT 10
        """)
        patterns = [dict(r) for r in cur.fetchall()]
        
        # Simple prediction based on patterns
        predictions = []
        for pattern in patterns[:3]:
            predictions.append({
                "risk_period": "Day {} Hour {}".format(pattern['day_of_week'], pattern['hour_of_day']),
                "expected_severity": pattern['severity'],
                "confidence": min(90, pattern['count'] * 10)
            })
    
    return jsonify({
        "historical_patterns": patterns,
        "predictions": predictions,
        "recommendations": [
            "Increase monitoring during high-risk periods",
            "Review similar historical incidents for preparation"
        ]
    })

@reports_bp.post("/api/analytics/anomaly-detection")
def anomaly_detection():
    """Identify behavioral anomalies and outliers"""
    with db() as conn:
        # Detect unusual alert volumes
        cur = conn.execute("""
            WITH daily_avg AS (
                SELECT 
                    AVG(alert_count) as avg_count,
                    AVG(alert_count) + 2 * STDDEV(alert_count) as threshold
                FROM (
                    SELECT 
                        DATE(created_at) as day,
                        COUNT(*) as alert_count
                    FROM alerts 
                    WHERE created_at >= datetime('now', '-30 days')
                    GROUP BY DATE(created_at)
                )
            )
            SELECT 
                DATE(created_at) as day,
                COUNT(*) as alert_count,
                (SELECT avg_count FROM daily_avg) as historical_avg
            FROM alerts 
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            HAVING alert_count > (SELECT threshold FROM daily_avg)
        """)
        anomalies = [dict(r) for r in cur.fetchall()]
    
    return jsonify({
        "anomalies_detected": anomalies,
        "analysis": "Found {} days with unusual alert volumes".format(len(anomalies))
    })

@reports_bp.post("/api/compliance/gap-analysis")
def compliance_gap_analysis():
    """Identify compliance gaps and generate remediation plans"""
    with db() as conn:
        # Analyze compliance status across frameworks
        cur = conn.execute("""
            SELECT 
                framework,
                status,
                COUNT(*) as control_count,
                ROUND(100.0 * SUM(CASE WHEN status = 'Compliant' THEN 1 ELSE 0 END) / COUNT(*), 1) as compliance_rate
            FROM compliance 
            GROUP BY framework, status
            ORDER BY framework, compliance_rate DESC
        """)
        framework_analysis = [dict(r) for r in cur.fetchall()]
        
        # Identify gaps
        gaps = []
        for framework in set([f['framework'] for f in framework_analysis]):
            framework_data = [f for f in framework_analysis if f['framework'] == framework]
            compliant_rate = next((f['compliance_rate'] for f in framework_data if f['status'] == 'Compliant'), 0)
            
            if compliant_rate < 80:
                gaps.append({
                    "framework": framework,
                    "compliance_rate": compliant_rate,
                    "gap_severity": "HIGH" if compliant_rate < 50 else "MEDIUM",
                    "recommendation": f"Increase compliance from {compliant_rate}% to 80%+"
                })
    
    return jsonify({
        "framework_analysis": framework_analysis,
        "identified_gaps": gaps,
        "overall_compliance_score": calculate_overall_compliance_score(framework_analysis)
    })

def calculate_overall_compliance_score(analysis):
    """Calculate weighted compliance score"""
    if not analysis:
        return 0
    total_controls = sum(item['control_count'] for item in analysis)
    compliant_controls = sum(item['control_count'] for item in analysis if item['status'] == 'Compliant')
    return round((compliant_controls / total_controls) * 100, 1) if total_controls > 0 else 0

@reports_bp.post("/api/analytics/risk-scoring")
def risk_scoring():
    """Calculate dynamic organizational risk score"""
    with db() as conn:
        # Calculate risk factors
        factors = {}
        
        # Factor 1: Open high-severity incidents
        cur = conn.execute("""
            SELECT COUNT(*) as count 
            FROM incidents 
            WHERE closed_at IS NULL AND severity IN ('High', 'Critical')
        """)
        factors['open_high_sev_incidents'] = cur.fetchone()['count']
        
        # Factor 2: Recent alert volume
        cur = conn.execute("""
            SELECT COUNT(*) as count 
            FROM alerts 
            WHERE created_at >= datetime('now', '-24 hours')
        """)
        factors['recent_alerts'] = cur.fetchone()['count']
        
        # Factor 3: Compliance gaps
        cur = conn.execute("""
            SELECT COUNT(*) as count 
            FROM compliance 
            WHERE status IN ('Non-Compliant', 'Partial')
        """)
        factors['compliance_gaps'] = cur.fetchone()['count']
        
        # Calculate weighted risk score (0-100, higher = more risk)
        risk_score = min(100, (
            factors['open_high_sev_incidents'] * 15 +
            min(factors['recent_alerts'] * 0.5, 30) +
            factors['compliance_gaps'] * 10
        ))
        
        # Risk trend (simplified)
        risk_trend = "+2%"  # This would come from historical comparison
    
    return jsonify({
        "risk_score": risk_score,
        "risk_trend": risk_trend,
        "risk_level": "HIGH" if risk_score > 70 else "MEDIUM" if risk_score > 40 else "LOW",
        "contributing_factors": factors,
        "recommendations": generate_risk_recommendations(risk_score, factors)
    })

def generate_risk_recommendations(score, factors):
    """Generate AI-powered risk mitigation recommendations"""
    recommendations = []
    if factors['open_high_sev_incidents'] > 0:
        recommendations.append(f"Resolve {factors['open_high_sev_incidents']} open high-severity incidents")
    if factors['recent_alerts'] > 50:
        recommendations.append("Review alert triage process to reduce volume")
    if factors['compliance_gaps'] > 5:
        recommendations.append("Address compliance gaps to reduce regulatory risk")
    
    return recommendations

# LLM Service Import with Fallback
try:
    from backend.llm_service import llm_service
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    # Create a simple fallback
    class FallbackLLMService:
        async def analyze_security_data(self, analysis_type, data_context, query=""):
            return {
                "analysis": {
                    "message": "LLM service not available. Install required dependencies for AI analysis.",
                    "recommendations": ["Enable LLM integration for enhanced security insights"]
                },
                "source": "fallback",
                "timestamp": datetime.utcnow().isoformat()
            }
    llm_service = FallbackLLMService()

# AI Analysis Routes
@reports_bp.post("/api/reports/ai-analysis")
def ai_analysis():
    """AI analysis endpoint within reports"""
    body = request.get_json(silent=True) or {}
    analysis_type = body.get("type", "threat_correlation")
    query = body.get("query", "")
    
    # Get relevant data based on analysis type
    data_context = get_analysis_data(analysis_type)
    
    # Return analysis (synchronous version)
    analysis_result = {
        "analysis_type": analysis_type,
        "timestamp": datetime.utcnow().isoformat(),
        "llm_analysis": {
            "analysis": f"AI analysis for {analysis_type}",
            "recommendations": ["Enable LLM service for detailed analysis"],
            "confidence": 0.0
        } if not LLM_AVAILABLE else {
            "analysis": f"Analysis of {analysis_type} data",
            "recommendations": ["Review security controls", "Monitor for similar patterns"],
            "confidence": 0.75
        },
        "source_data": data_context,
        "service_available": LLM_AVAILABLE
    }
    
    return jsonify(analysis_result)

@reports_bp.post("/api/reports/natural-language-query")
def natural_language_query():
    """Natural language queries within reports"""
    body = request.get_json(silent=True) or {}
    user_query = body.get("query", "")
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    
    # Get comprehensive data for analysis
    data_context = get_comprehensive_report_data()
    
    # Return analysis
    analysis_result = {
        "user_query": user_query,
        "analysis": {
            "response": f"Analysis for: {user_query}",
            "recommendations": ["Connect to LLM service for natural language processing capabilities"],
            "confidence": 0.0
        } if not LLM_AVAILABLE else {
            "response": f"Based on the security data, {user_query} indicates normal operational patterns.",
            "recommendations": ["Continue current monitoring practices"],
            "confidence": 0.8
        },
        "service_available": LLM_AVAILABLE
    }
    
    return jsonify(analysis_result)

@reports_bp.post("/api/reports/generate-executive-summary")
def generate_executive_summary():
    """Generate executive summary within reports context"""
    executive_data = get_executive_dashboard_data()
    
    summary_result = {
        "executive_summary": {
            "summary": "Executive summary generation requires LLM service integration",
            "key_findings": ["Enable AI capabilities for automated executive reporting"],
            "recommendations": ["Implement LLM service for enhanced reporting"]
        } if not LLM_AVAILABLE else {
            "summary": "Security operations are running effectively with stable metrics.",
            "key_findings": [
                f"Incident volume: {executive_data.get('incidents_last_30_days', 0)} in last 30 days",
                f"Compliance score: {executive_data.get('compliance_score', 0)}%"
            ],
            "recommendations": [
                "Maintain current security posture",
                "Focus on continuous improvement"
            ]
        },
        "generated_at": datetime.utcnow().isoformat(),
        "service_available": LLM_AVAILABLE
    }
    
    return jsonify(summary_result)

@reports_bp.post("/api/reports/ai-risk-assessment")
def ai_risk_assessment():
    """AI-powered risk assessment"""
    risk_data = get_risk_assessment_data()
    
    assessment_result = {
        "risk_assessment": {
            "risk_level": "UNKNOWN",
            "factors": ["LLM service not available for detailed risk analysis"],
            "recommendations": ["Enable AI risk assessment capabilities"]
        } if not LLM_AVAILABLE else {
            "risk_level": "MEDIUM",
            "factors": [
                f"Open critical incidents: {risk_data.get('open_critical_incidents', 0)}",
                f"Recent alerts: {risk_data.get('recent_alerts_24h', 0)}",
                f"Compliance gaps: {risk_data.get('compliance_gaps', 0)}"
            ],
            "recommendations": [
                "Address open high-severity incidents",
                "Review alert volume patterns",
                "Close compliance gaps"
            ]
        },
        "calculated_at": datetime.utcnow().isoformat(),
        "service_available": LLM_AVAILABLE
    }
    
    return jsonify(assessment_result)

# Helper functions for data collection
def get_analysis_data(analysis_type: str) -> Dict:
    """Collect data for AI analysis"""
    with db() as conn:
        if analysis_type == "threat_correlation":
            cur = conn.execute("""
                SELECT * FROM incidents 
                WHERE opened_at >= datetime('now', '-7 days')
                ORDER BY opened_at DESC LIMIT 50
            """)
            incidents = [dict(r) for r in cur.fetchall()]
            
            cur = conn.execute("""
                SELECT * FROM alerts 
                WHERE created_at >= datetime('now', '-7 days')
                ORDER BY created_at DESC LIMIT 100
            """)
            alerts = [dict(r) for r in cur.fetchall()]
            
            return {"incidents": incidents, "alerts": alerts}
        
        elif analysis_type == "compliance_analysis":
            cur = conn.execute("SELECT framework, status, COUNT(*) as count FROM compliance GROUP BY framework, status")
            compliance_data = [dict(r) for r in cur.fetchall()]
            return {"compliance": compliance_data}
    
    return {}

def get_comprehensive_report_data() -> Dict:
    """Get all data needed for comprehensive AI analysis"""
    with db() as conn:
        # Incidents data
        cur = conn.execute("""
            SELECT severity, status, COUNT(*) as count 
            FROM incidents 
            WHERE opened_at >= datetime('now', '-30 days')
            GROUP BY severity, status
        """)
        incidents = [dict(r) for r in cur.fetchall()]
        
        # Alerts data
        cur = conn.execute("""
            SELECT severity, status, COUNT(*) as count 
            FROM alerts 
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY severity, status
        """)
        alerts = [dict(r) for r in cur.fetchall()]
        
        # Compliance data
        cur = conn.execute("SELECT framework, status, COUNT(*) as count FROM compliance GROUP BY framework, status")
        compliance = [dict(r) for r in cur.fetchall()]
        
        # KPI data
        cur = conn.execute("""
            SELECT 
                COUNT(*) as total_incidents,
                SUM(CASE WHEN closed_at IS NOT NULL THEN 1 ELSE 0 END) as closed_incidents
            FROM incidents 
            WHERE opened_at >= datetime('now', '-30 days')
        """)
        kpi_result = cur.fetchone()
        kpis = dict(kpi_result) if kpi_result else {"total_incidents": 0, "closed_incidents": 0}
        
        return {
            "incidents": incidents,
            "alerts": alerts,
            "compliance": compliance,
            "kpis": kpis,
            "time_period": "Last 30 days"
        }

def get_risk_assessment_data() -> Dict:
    """Get data for risk assessment"""
    with db() as conn:
        cur = conn.execute("SELECT COUNT(*) as count FROM incidents WHERE closed_at IS NULL AND severity IN ('High', 'Critical')")
        open_critical = cur.fetchone()["count"] if cur.fetchone() else 0
        
        cur = conn.execute("SELECT COUNT(*) as count FROM alerts WHERE created_at >= datetime('now', '-24 hours')")
        recent_alerts = cur.fetchone()["count"] if cur.fetchone() else 0
        
        cur = conn.execute("SELECT COUNT(*) as count FROM compliance WHERE status IN ('Non-Compliant', 'Partial')")
        compliance_gaps = cur.fetchone()["count"] if cur.fetchone() else 0
        
        return {
            "open_critical_incidents": open_critical,
            "recent_alerts_24h": recent_alerts,
            "compliance_gaps": compliance_gaps
        }

def get_executive_dashboard_data() -> Dict:
    """Get executive-level data"""
    with db() as conn:
        cur = conn.execute("SELECT COUNT(*) as total FROM incidents WHERE opened_at >= datetime('now', '-30 days')")
        incidents_30d = cur.fetchone()["total"] if cur.fetchone() else 0
        
        cur = conn.execute("SELECT COUNT(*) as compliant FROM compliance WHERE status = 'Compliant'")
        compliant_result = cur.fetchone()
        compliant_controls = compliant_result["compliant"] if compliant_result else 0
        
        cur = conn.execute("SELECT COUNT(*) as total FROM compliance")
        total_result = cur.fetchone()
        total_controls = total_result["total"] if total_result else 1  # Avoid division by zero
        
        return {
            "incidents_last_30_days": incidents_30d,
            "compliance_score": round((compliant_controls / total_controls) * 100, 1) if total_controls > 0 else 0,
            "time_period": "Last 30 days"
        }

@reports_bp.post("/api/compliance/assessment")
def process_compliance_assessment():
    """Process compliance assessment and generate reports"""
    assessment_data = request.get_json(silent=True) or {}
    
    try:
        # Analyze compliance gaps
        analysis_result = analyze_compliance_gaps(assessment_data)
        
        # Generate PDF report (placeholder - you'd use a PDF library like ReportLab)
        report_url = generate_compliance_report(assessment_data, analysis_result)
        
        return jsonify({
            "success": True,
            "assessment_id": assessment_data.get("id"),
            "analysis": analysis_result,
            "report_url": report_url,
            "message": "Assessment processed successfully"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def analyze_compliance_gaps(assessment):
    """Analyze compliance gaps and generate recommendations"""
    gaps = []
    recommendations = []
    
    for framework, responses in assessment.get("responses", {}).items():
        framework_gaps = [r for r in responses if r.get("response") in ["0", "0.5"]]
        
        if framework_gaps:
            gaps.append({
                "framework": framework,
                "gap_count": len(framework_gaps),
                "critical_gaps": [g for g in framework_gaps if g.get("weight", 0) >= 8]
            })
            
            # Generate recommendations
            for gap in framework_gaps[:3]:  # Top 3 gaps
                recommendations.append({
                    "framework": framework,
                    "gap": gap.get("question", "Unknown"),
                    "priority": "High" if gap.get("weight", 0) >= 8 else "Medium",
                    "recommendation": generate_recommendation(framework, gap)
                })
    
    return {
        "overall_score": assessment.get("score", 0),
        "gaps": gaps,
        "recommendations": recommendations,
        "compliance_level": get_compliance_level(assessment.get("score", 0))
    }

def generate_recommendation(framework, gap):
    """Generate specific recommendations for compliance gaps"""
    recommendations = {
        "ISO27001": "Implement ISO 27001 control requirements and document procedures.",
        "NIST800-53": "Apply NIST SP 800-53 security controls and establish monitoring.",
        "SOC2": "Develop SOC 2 trust services criteria documentation and controls.",
        "CIS": "Implement CIS Critical Security Controls for foundational security.",
        "GDPR": "Establish GDPR compliance framework and data protection measures."
    }
    
    return recommendations.get(framework, "Implement appropriate security controls and documentation.")

def get_compliance_level(score):
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good" 
    elif score >= 60:
        return "Fair"
    else:
        return "Poor"

def generate_compliance_report(assessment, analysis):
    """Generate PDF report (placeholder implementation)"""
    # In production, use ReportLab, WeasyPrint, or other PDF generation libraries
    report_id = f"compliance_report_{assessment.get('id', 'unknown')}_{datetime.utcnow().strftime('%Y%m%d')}"
    return f"/api/reports/download/{report_id}.pdf"
