import sqlite3
import datetime
from flask import Blueprint, jsonify, request, session

subscription_bp = Blueprint('subscription', __name__, url_prefix='/api/subscription')
scans_bp = Blueprint('scans', __name__, url_prefix='/api/scans')

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

# Create subscription endpoint
@subscription_bp.route('/create', methods=['POST'])
def create_subscription():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        plan_id = data.get('plan_id')
        plan_name = data.get('plan_name')
        plan_code = data.get('plan_code')
        price = data.get('price')
        
        if not all([plan_id, plan_name, plan_code, price]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Map plan names to plan mode values
        plan_mode_map = {
            'free': 0,
            'pro': 1,
            'team': 2,
            'enterprise': 3
        }
        
        # Calculate expiry date (30 days from now)
        expiry_date = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
        
        user_id = session['user_id']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # First, update the user's plan mode
            plan_mode = plan_mode_map.get(plan_id, 0)
            cursor.execute(
                'UPDATE users SET Plan_Mode = ? WHERE id = ?',
                (plan_mode, user_id)
            )
            
            # Then create a new subscription record
            cursor.execute('''
                INSERT INTO subscriptions (user_id, sub_plan, plan_code, price, date_expiry, plan_active)
                VALUES (?, ?, ?, ?, ?, 1)
            ''', (user_id, plan_name, plan_code, price, expiry_date))
            
            conn.commit()
            subscription_id = cursor.lastrowid
            conn.close()
            
            # Update session with new plan mode
            session['plan_mode'] = plan_mode
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500
            
        return jsonify({
            'message': 'Subscription created successfully',
            'subscription_id': subscription_id,
            'plan_mode': plan_mode,
            'expiry_date': expiry_date
        }), 201
        
    except Exception as e:
        print(f"Subscription creation error: {e}")
        return jsonify({'error': 'Subscription creation failed'}), 500

# Get user's current subscription
@subscription_bp.route('/current', methods=['GET'])
def get_current_subscription():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get the most recent active subscription
            cursor.execute('''
                SELECT s.*, u.Plan_Mode 
                FROM subscriptions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.user_id = ? AND s.plan_active = 1 
                ORDER BY s.created_at DESC 
                LIMIT 1
            ''', (user_id,))
            
            subscription = cursor.fetchone()
            conn.close()
            
            if subscription:
                return jsonify({
                    'subscription': dict(subscription),
                    'plan_mode': subscription['Plan_Mode']
                }), 200
            else:
                # Return default free plan if no subscription found
                return jsonify({
                    'subscription': None,
                    'plan_mode': 0
                }), 200
                
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500
            
    except Exception as e:
        print(f"Get subscription error: {e}")
        return jsonify({'error': 'Failed to get subscription'}), 500

# Get scan statistics
@scans_bp.route('/stats', methods=['GET'])
def get_scan_stats():
    try:
        # Check if user is authenticated
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

# Save scan result
@scans_bp.route('/save', methods=['POST'])
def save_scan():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        scan_type = data.get('scan_type')
        content = data.get('content')
        result = data.get('result')
        threat_level = data.get('threat_level', 'clean')
        verdict_band = data.get('verdict_band', 'SAFE')
        
        if not all([scan_type, content, result]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        user_id = session['user_id']
        plan_mode = session.get('plan_mode', 0)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO scans (user_id, scan_type, plan_mode, content, result, threat_level, verdict_band)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, scan_type, plan_mode, content, result, threat_level, verdict_band))
        
        conn.commit()
        scan_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'message': 'Scan saved successfully',
            'scan_id': scan_id
        }), 201
        
    except Exception as e:
        print(f"Error saving scan: {e}")
        return jsonify({'error': 'Failed to save scan'}), 500
    