from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os
from datetime import datetime, timedelta
import json
import hashlib

admin_bp = Blueprint('admin', __name__)

# Database helper function
def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

# Initialize admin database
def init_admin_db():
    conn = get_db_connection()
    
    # Create admin_users table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            permissions TEXT DEFAULT 'all',
            is_active BOOLEAN DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert default admin user
    admin_username = "adminCyber"
    admin_password = "adminCyber246"
    admin_email = "admin@cybershield.com"
    admin_full_name = "Cyber Shield Administrator"
    
    # Check if admin user already exists
    existing_admin = conn.execute(
        'SELECT id FROM admin_users WHERE username = ?', (admin_username,)
    ).fetchone()
    
    if not existing_admin:
        # Hash the password
        password_hash = hashlib.sha256(admin_password.encode()).hexdigest()
        
        conn.execute('''
            INSERT INTO admin_users (username, email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (admin_username, admin_email, password_hash, admin_full_name, 'super_admin'))
        
        conn.commit()
        print("Default admin user created:")
        print(f"Username: {admin_username}")
        print(f"Password: {admin_password}")
    
    conn.close()

# Call this function to initialize the admin database
init_admin_db()

# Admin authentication required decorator
def admin_login_required(f):
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session or not session['admin_logged_in']:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Verify admin credentials
def verify_admin(username, password):
    conn = get_db_connection()
    admin = conn.execute(
        'SELECT * FROM admin_users WHERE username = ? AND is_active = 1',
        (username,)
    ).fetchone()
    conn.close()
    
    if admin and check_password_hash(admin['password_hash'], password):
        return admin
    return None

# Password hashing
def check_password_hash(password_hash, password):
    return password_hash == hashlib.sha256(password.encode()).hexdigest()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Admin routes
@admin_bp.route('/admin', methods=['GET'])
def admin_page():
    # Serve the combined admin page (login + dashboard)
    return render_template('admin/admin.html')

@admin_bp.route('/admin/login', methods=['POST'])
def admin_login_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    admin = verify_admin(username, password)
    if admin:
        session['admin_logged_in'] = True
        session['admin_id'] = admin['id']
        session['admin_username'] = admin['username']
        session['admin_role'] = admin['role']
        
        # Update last login
        conn = get_db_connection()
        conn.execute(
            'UPDATE admin_users SET last_login = ? WHERE id = ?',
            (datetime.now().isoformat(), admin['id'])
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'username': admin['username'],
                'role': admin['role']
            }
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Invalid credentials'
        }), 401

@admin_bp.route('/admin/logout')
def admin_logout():
    session.clear()
    return redirect('/admin')

# API endpoints for data
@admin_bp.route('/admin/api/users')
@admin_login_required
def api_users():
    conn = get_db_connection()
    users = conn.execute('''
        SELECT u.*, s.sub_plan, s.plan_active 
        FROM users u 
        LEFT JOIN subscriptions s ON u.id = s.user_id
        ORDER BY u.created_at DESC
    ''').fetchall()
    conn.close()
    
    users_list = [dict(user) for user in users]
    return jsonify(users_list)

@admin_bp.route('/admin/api/scans')
@admin_login_required
def api_scans():
    conn = get_db_connection()
    scans = conn.execute('''
        SELECT s.*, u.email, u.full_name 
        FROM scans s 
        JOIN users u ON s.user_id = u.id 
        ORDER BY s.scanned_at DESC
        LIMIT 1000
    ''').fetchall()
    conn.close()
    
    scans_list = [dict(scan) for scan in scans]
    return jsonify(scans_list)

@admin_bp.route('/admin/api/payments')
@admin_login_required
def api_payments():
    conn = get_db_connection()
    payments = conn.execute('''
        SELECT p.*, u.email, u.full_name, s.sub_plan 
        FROM payments p 
        JOIN users u ON p.user_id = u.id 
        LEFT JOIN subscriptions s ON p.subscription_id = s.sub_id 
        ORDER BY p.created_at DESC
    ''').fetchall()
    conn.close()
    
    payments_list = [dict(payment) for payment in payments]
    return jsonify(payments_list)

@admin_bp.route('/admin/api/teams')
@admin_login_required
def api_teams():
    conn = get_db_connection()
    teams = conn.execute('''
        SELECT t.*, u.email as creator_email, 
               COUNT(tm.user_id) as member_count
        FROM teams t 
        JOIN users u ON t.created_by = u.id 
        LEFT JOIN team_members tm ON t.id = tm.team_id 
        GROUP BY t.id 
        ORDER BY t.created_at DESC
    ''').fetchall()
    conn.close()
    
    teams_list = [dict(team) for team in teams]
    return jsonify(teams_list)

@admin_bp.route('/admin/api/audit-logs')
@admin_login_required
def api_audit_logs():
    conn = get_db_connection()
    logs = conn.execute('''
        SELECT a.*, u.email, u.full_name 
        FROM audit_logs a 
        LEFT JOIN users u ON a.user_id = u.id 
        ORDER BY a.created_at DESC 
        LIMIT 500
    ''').fetchall()
    conn.close()
    
    logs_list = [dict(log) for log in logs]
    return jsonify(logs_list)

@admin_bp.route('/admin/api/stats')
@admin_login_required
def api_stats():
    conn = get_db_connection()
    
    # Basic statistics
    total_users = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
    total_scans = conn.execute('SELECT COUNT(*) as count FROM scans').fetchone()['count']
    total_payments = conn.execute('SELECT COUNT(*) as count FROM payments').fetchone()['count']
    total_teams = conn.execute('SELECT COUNT(*) as count FROM teams').fetchone()['count']
    
    # Threat level statistics
    threat_stats = conn.execute('''
        SELECT threat_level, COUNT(*) as count 
        FROM scans 
        WHERE threat_level IS NOT NULL 
        GROUP BY threat_level
    ''').fetchall()
    
    # Payment statistics
    revenue_stats = conn.execute('''
        SELECT status, COUNT(*) as count, SUM(amount) as total 
        FROM payments 
        GROUP BY status
    ''').fetchall()
    
    # Daily signups (last 30 days)
    daily_signups = conn.execute('''
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM users 
        WHERE created_at >= date('now', '-30 days') 
        GROUP BY DATE(created_at) 
        ORDER BY date
    ''').fetchall()
    
    # Active users today
    active_today = conn.execute('''
        SELECT COUNT(DISTINCT user_id) as count 
        FROM scans 
        WHERE DATE(scanned_at) = DATE('now')
    ''').fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'total_users': total_users,
        'total_scans': total_scans,
        'total_payments': total_payments,
        'total_teams': total_teams,
        'active_today': active_today,
        'threat_stats': [dict(stat) for stat in threat_stats],
        'revenue_stats': [dict(stat) for stat in revenue_stats],
        'daily_signups': [dict(signup) for signup in daily_signups]
    })

@admin_bp.route('/admin/api/update-user', methods=['POST'])
@admin_login_required
def update_user():
    data = request.get_json()
    user_id = data.get('user_id')
    field = data.get('field')
    value = data.get('value')
    
    if not all([user_id, field, value]):
        return jsonify({'error': 'Missing parameters'}), 400
    
    allowed_fields = ['Plan_Mode', 'full_name', 'email']
    if field not in allowed_fields:
        return jsonify({'error': 'Invalid field'}), 400
    
    conn = get_db_connection()
    try:
        conn.execute(f'UPDATE users SET {field} = ? WHERE id = ?', (value, user_id))
        conn.commit()
        
        # Log the action
        conn.execute('''
            INSERT INTO audit_logs (user_id, action, description, ip_address) 
            VALUES (?, ?, ?, ?)
        ''', (session.get('admin_id'), 'admin_update', 
              f'Admin updated user {user_id} field {field} to {value}', 
              request.remote_addr))
        conn.commit()
        
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/api/delete-user', methods=['POST'])
@admin_login_required
def delete_user():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    
    conn = get_db_connection()
    try:
        # Log before deletion
        user_email = conn.execute('SELECT email FROM users WHERE id = ?', (user_id,)).fetchone()
        email = user_email['email'] if user_email else 'Unknown'
        
        conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        
        # Log the action
        conn.execute('''
            INSERT INTO audit_logs (user_id, action, description, ip_address) 
            VALUES (?, ?, ?, ?)
        ''', (session.get('admin_id'), 'admin_delete', 
              f'Admin deleted user {user_id} ({email})', 
              request.remote_addr))
        conn.commit()
        
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500
    
