from flask import Blueprint, jsonify, request, session
import sqlite3
import datetime

#======================================================
# -------------- Scan Results Blueprint --------------
#======================================================

scan_results_bp = Blueprint('scan_results', __name__, url_prefix='/api/scans')


#======================================================
# -------------------- Helpers -----------------------
#======================================================

def get_db_connection():
    """Get database connection to the cyber-shield-linkguard database"""
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn


#======================================================
# ---------------------- API -------------------------
#======================================================

@scan_results_bp.route('/save', methods=['POST'])
def save_scan():
    """Save scan result to database"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        scan_type = data.get('scan_type')
        content = data.get('content')
        result = data.get('result')
        verdict_band = data.get('verdict_band')
        
        user_id = session['user_id']
        plan_mode = session.get('plan_mode', 0)
        scanned_at = datetime.datetime.now().isoformat()

        if not all([scan_type, content, result, verdict_band]):
            return jsonify({'error': 'Missing scan data fields'}), 400

        # Map client-side verdict_band to database threat_level
        threat_level_mapping = {
            'SAFE': 'clean',
            'WARN': 'suspicious',
            'DANGER': 'malicious'
        }
        threat_level = threat_level_mapping.get(verdict_band.upper(), 'clean')

        # Validate threat_level against CHECK constraint
        valid_threat_levels = ['clean', 'suspicious', 'malicious']
        if threat_level not in valid_threat_levels:
            return jsonify({'error': f"Invalid threat_level after mapping. Must be one of {', '.join(valid_threat_levels)}."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO scans (user_id, scan_type, plan_mode, content, result, threat_level, scanned_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, scan_type, plan_mode, content, result, threat_level, scanned_at))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Scan result saved successfully'}), 201

    except sqlite3.IntegrityError as e:
        print(f"Integrity error saving scan result: {e}")
        return jsonify({'error': 'Failed to save scan result due to data integrity issue. Check user_id or input values.'}), 400
    except Exception as e:
        print(f"Error saving scan result: {e}")
        return jsonify({'error': 'Failed to save scan result'}), 500


@scan_results_bp.route('/stats', methods=['GET'])
def get_scan_stats():
    """Get scan statistics for the authenticated user"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total scans count
        cursor.execute('SELECT COUNT(*) as total FROM scans WHERE user_id = ?', (user_id,))
        total_scans = cursor.fetchone()['total']
        
        # Get scans by type
        cursor.execute('''
            SELECT scan_type, COUNT(*) as count 
            FROM scans 
            WHERE user_id = ? 
            GROUP BY scan_type
        ''', (user_id,))
        scan_types = {row['scan_type']: row['count'] for row in cursor.fetchall()}
        
        # Get threat level distribution
        cursor.execute('''
            SELECT threat_level, COUNT(*) as count 
            FROM scans 
            WHERE user_id = ? AND threat_level IS NOT NULL
            GROUP BY threat_level
        ''', (user_id,))
        threat_levels = {row['threat_level']: row['count'] for row in cursor.fetchall()}
        
        # Get scans from the last 7 days for timeline
        cursor.execute('''
            SELECT DATE(scanned_at) as date, COUNT(*) as count 
            FROM scans 
            WHERE user_id = ? AND scanned_at >= DATE('now', '-7 days')
            GROUP BY DATE(scanned_at)
            ORDER BY date
        ''', (user_id,))
        
        timeline_data = []
        timeline_labels = []
        for row in cursor.fetchall():
            timeline_labels.append(row['date'])
            timeline_data.append(row['count'])
        
        # Get recent scans (last 10)
        cursor.execute('''
            SELECT scan_id, scan_type, content, threat_level, scanned_at
            FROM scans 
            WHERE user_id = ?
            ORDER BY scanned_at DESC
            LIMIT 10
        ''', (user_id,))
        
        recent_scans = []
        for row in cursor.fetchall():
            recent_scans.append({
                'scan_id': row['scan_id'],
                'scan_type': row['scan_type'],
                'content': row['content'],
                'threat_level': row['threat_level'],
                'scanned_at': row['scanned_at']
            })
        
        conn.close()
        
        return jsonify({
            'totalScans': total_scans,
            'scanTypes': scan_types,
            'threatLevels': threat_levels,
            'timeline': {
                'labels': timeline_labels,
                'data': timeline_data
            },
            'recentScans': recent_scans
        }), 200
        
    except Exception as e:
        print(f"Error fetching scan stats: {e}")
        return jsonify({'error': 'Failed to fetch scan statistics'}), 500


@scan_results_bp.route('/history', methods=['GET'])
def get_scan_history():
    """Get paginated scan history for the authenticated user"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        offset = (page - 1) * per_page
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) as total FROM scans WHERE user_id = ?', (user_id,))
        total_count = cursor.fetchone()['total']
        
        # Get paginated scans
        cursor.execute('''
            SELECT scan_id, scan_type, content, threat_level, scanned_at
            FROM scans 
            WHERE user_id = ?
            ORDER BY scanned_at DESC
            LIMIT ? OFFSET ?
        ''', (user_id, per_page, offset))
        
        scans = []
        for row in cursor.fetchall():
            scans.append({
                'scan_id': row['scan_id'],
                'scan_type': row['scan_type'],
                'content': row['content'],
                'threat_level': row['threat_level'],
                'scanned_at': row['scanned_at']
            })
        
        conn.close()
        
        return jsonify({
            'scans': scans,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching scan history: {e}")
        return jsonify({'error': 'Failed to fetch scan history'}), 500
    