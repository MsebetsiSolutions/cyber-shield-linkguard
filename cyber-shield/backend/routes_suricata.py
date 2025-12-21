"""
Suricata alert ingestion and management endpoints.
Receives alerts from suricata_agent.py and stores them in the database.
"""
from flask import Blueprint, request, jsonify
import sqlite3
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

suricata_bp = Blueprint('suricata', __name__)

def init_suricata_db():
    """Initialize Suricata-related database tables"""
    try:
        dbpath = os.path.join(os.getcwd(), 'soc_dashboard.db')
        conn = sqlite3.connect(dbpath)
        cur = conn.cursor()
        
        # Create suricata_alerts table for raw Suricata events
        cur.execute('''
            CREATE TABLE IF NOT EXISTS suricata_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                flow_id TEXT,
                event_type TEXT NOT NULL,
                src_ip TEXT,
                src_port INTEGER,
                dest_ip TEXT,
                dest_port INTEGER,
                proto TEXT,
                alert JSON NOT NULL,
                metadata JSON,
                raw_event TEXT NOT NULL,
                processed BOOLEAN DEFAULT 0,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Create index for faster queries
        cur.execute('CREATE INDEX IF NOT EXISTS idx_suricata_timestamp ON suricata_alerts(timestamp)')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_suricata_src_ip ON suricata_alerts(src_ip)')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_suricata_dest_ip ON suricata_alerts(dest_ip)')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_suricata_event_type ON suricata_alerts(event_type)')
        
        conn.commit()
        conn.close()
        logger.info("Suricata database tables initialized")
    except Exception as e:
        logger.error(f"Error initializing Suricata database: {e}")

# Initialize database when module is imported
init_suricata_db()

def suricata_to_soc_alert(suricata_event):
    """Convert Suricata event to SOC alert format"""
    try:
        alert_data = suricata_event.get('alert', {})
        metadata = suricata_event.get('metadata', {})
        
        # Extract MITRE ATT&CK information
        mitre_ids = []
        if metadata:
            mitre_ids = metadata.get('cve', [])
            if isinstance(mitre_ids, str):
                mitre_ids = [mitre_ids]
        
        # Determine severity based on Suricata severity
        suricata_severity = alert_data.get('severity', 3)
        if suricata_severity == 1:
            severity = 'Critical'
        elif suricata_severity == 2:
            severity = 'High'
        elif suricata_severity == 3:
            severity = 'Medium'
        else:
            severity = 'Low'
        
        # Create artifacts
        artifacts = []
        src_ip = suricata_event.get('src_ip')
        dest_ip = suricata_event.get('dest_ip')
        if src_ip:
            artifacts.append({'type': 'ip', 'value': src_ip})
        if dest_ip:
            artifacts.append({'type': 'ip', 'value': dest_ip})
        
        # Create SOC alert
        soc_alert = {
            'title': alert_data.get('signature', 'Suricata Alert'),
            'severity': severity,
            'description': alert_data.get('signature', '') + ': ' + alert_data.get('category', ''),
            'source': 'suricata',
            'tags': json.dumps(['suricata', 'ids', 'network']),
            'mitre': json.dumps(mitre_ids),
            'artifacts': json.dumps(artifacts),
            'raw_data': json.dumps(suricata_event)
        }
        
        return soc_alert
    except Exception as e:
        logger.error(f"Error converting Suricata alert: {e}")
        return None

def store_suricata_alert(suricata_event):
    """Store Suricata alert in both suricata_alerts and alerts tables"""
    try:
        dbpath = os.path.join(os.getcwd(), 'soc_dashboard.db')
        conn = sqlite3.connect(dbpath)
        cur = conn.cursor()
        
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Extract event data
        timestamp = suricata_event.get('timestamp', now)
        flow_id = suricata_event.get('flow_id')
        event_type = suricata_event.get('event_type', 'alert')
        src_ip = suricata_event.get('src_ip')
        src_port = suricata_event.get('src_port')
        dest_ip = suricata_event.get('dest_ip')
        dest_port = suricata_event.get('dest_port')
        proto = suricata_event.get('proto')
        alert_data = suricata_event.get('alert', {})
        metadata = suricata_event.get('metadata', {})
        
        # Store raw event in suricata_alerts table
        cur.execute('''
            INSERT INTO suricata_alerts 
            (timestamp, flow_id, event_type, src_ip, src_port, dest_ip, dest_port, 
             proto, alert, metadata, raw_event, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, flow_id, event_type, src_ip, src_port, dest_ip, dest_port,
            proto, json.dumps(alert_data), json.dumps(metadata), 
            json.dumps(suricata_event), now
        ))
        
        # If it's an alert event, also store in main alerts table
        if event_type == 'alert':
            soc_alert = suricata_to_soc_alert(suricata_event)
            if soc_alert:
                cur.execute('''
                    INSERT INTO alerts 
                    (title, severity, status, owner, created_at, updated_at, 
                     tags, mitre, artifacts, source, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    soc_alert['title'],
                    soc_alert['severity'],
                    'New',
                    '',
                    now,
                    now,
                    soc_alert['tags'],
                    soc_alert['mitre'],
                    soc_alert['artifacts'],
                    soc_alert['source'],
                    soc_alert['description']
                ))
                
                # Mark as processed
                cur.execute('''
                    UPDATE suricata_alerts 
                    SET processed = 1 
                    WHERE id = last_insert_rowid()
                ''')
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored Suricata alert: {alert_data.get('signature', 'Unknown')}")
        return True
    except Exception as e:
        logger.error(f"Error storing Suricata alert: {e}")
        return False

@suricata_bp.route('/event', methods=['POST'])
def receive_suricata_event():
    """Receive Suricata events from suricata_agent.py"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Handle both single event and batch events
        events = data if isinstance(data, list) else [data]
        
        success_count = 0
        for event in events:
            if isinstance(event, dict) and 'event_type' in event:
                if store_suricata_alert(event):
                    success_count += 1
        
        return jsonify({
            'status': 'success',
            'message': f'Processed {success_count}/{len(events)} events',
            'processed': success_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing Suricata event: {e}")
        return jsonify({'error': str(e)}), 500

@suricata_bp.route('/alerts', methods=['GET'])
def get_suricata_alerts():
    """Get recent Suricata alerts"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        dbpath = os.path.join(os.getcwd(), 'soc_dashboard.db')
        conn = sqlite3.connect(dbpath)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        cur.execute('''
            SELECT * FROM suricata_alerts 
            WHERE event_type = 'alert'
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        alerts = [dict(row) for row in cur.fetchall()]
        
        # Parse JSON fields
        for alert in alerts:
            if alert.get('alert'):
                alert['alert'] = json.loads(alert['alert'])
            if alert.get('metadata'):
                alert['metadata'] = json.loads(alert['metadata'])
            if alert.get('raw_event'):
                alert['raw_event'] = json.loads(alert['raw_event'])
        
        cur.execute('SELECT COUNT(*) as total FROM suricata_alerts WHERE event_type = "alert"')
        total = cur.fetchone()['total']
        
        conn.close()
        
        return jsonify({
            'alerts': alerts,
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        logger.error(f"Error fetching Suricata alerts: {e}")
        return jsonify({'error': str(e)}), 500

@suricata_bp.route('/stats', methods=['GET'])
def get_suricata_stats():
    """Get Suricata statistics"""
    try:
        dbpath = os.path.join(os.getcwd(), 'soc_dashboard.db')
        conn = sqlite3.connect(dbpath)
        cur = conn.cursor()
        
        # Get total alerts count
        cur.execute('SELECT COUNT(*) FROM suricata_alerts WHERE event_type = "alert"')
        total_alerts = cur.fetchone()[0]
        
        # Get alerts by severity
        cur.execute('''
            SELECT 
                CASE 
                    WHEN json_extract(alert, '$.severity') = 1 THEN 'Critical'
                    WHEN json_extract(alert, '$.severity') = 2 THEN 'High'
                    WHEN json_extract(alert, '$.severity') = 3 THEN 'Medium'
                    ELSE 'Low'
                END as severity,
                COUNT(*) as count
            FROM suricata_alerts 
            WHERE event_type = 'alert'
            GROUP BY severity
        ''')
        severity_counts = dict(cur.fetchall())
        
        # Get top source IPs
        cur.execute('''
            SELECT src_ip, COUNT(*) as count
            FROM suricata_alerts 
            WHERE src_ip IS NOT NULL AND event_type = 'alert'
            GROUP BY src_ip
            ORDER BY count DESC
            LIMIT 10
        ''')
        top_sources = [{'ip': row[0], 'count': row[1]} for row in cur.fetchall()]
        
        # Get top destinations
        cur.execute('''
            SELECT dest_ip, COUNT(*) as count
            FROM suricata_alerts 
            WHERE dest_ip IS NOT NULL AND event_type = 'alert'
            GROUP BY dest_ip
            ORDER BY count DESC
            LIMIT 10
        ''')
        top_destinations = [{'ip': row[0], 'count': row[1]} for row in cur.fetchall()]
        
        # Get alerts by hour (last 24 hours)
        cur.execute('''
            SELECT strftime('%Y-%m-%d %H:00', timestamp) as hour,
                   COUNT(*) as count
            FROM suricata_alerts 
            WHERE event_type = 'alert' 
            AND timestamp >= datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour
        ''')
        hourly_alerts = [{'hour': row[0], 'count': row[1]} for row in cur.fetchall()]
        
        conn.close()
        
        return jsonify({
            'total_alerts': total_alerts,
            'severity_counts': severity_counts,
            'top_sources': top_sources,
            'top_destinations': top_destinations,
            'hourly_alerts': hourly_alerts,
            'status': 'running'
        })
        
    except Exception as e:
        logger.error(f"Error getting Suricata stats: {e}")
        return jsonify({'error': str(e)}), 500

@suricata_bp.route('/start', methods=['POST'])
def start_suricata():
    """Start Suricata monitoring"""
    try:
        # This endpoint would typically start Suricata process
        # For now, just acknowledge the request
        return jsonify({
            'status': 'success',
            'message': 'Suricata monitoring enabled. Ensure Suricata is running and suricata_agent.py is forwarding events.'
        }), 200
    except Exception as e:
        logger.error(f"Error starting Suricata: {e}")
        return jsonify({'error': str(e)}), 500

@suricata_bp.route('/stop', methods=['POST'])
def stop_suricata():
    """Stop Suricata monitoring"""
    try:
        # This endpoint would typically stop Suricata process
        return jsonify({
            'status': 'success',
            'message': 'Suricata monitoring disabled'
        }), 200
    except Exception as e:
        logger.error(f"Error stopping Suricata: {e}")
        return jsonify({'error': str(e)}), 500