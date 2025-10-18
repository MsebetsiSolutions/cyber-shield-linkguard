
from routes.authentication import get_db_connection
from flask import Blueprint, session, jsonify
import sqlite3

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/api/user/profile/stats', methods=['GET'])
def get_user_profile_stats():
    """Get detailed profile statistics for the current user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        user_id = session['user_id']
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get total scan count
        cursor.execute('SELECT COUNT(*) as total_scans FROM scans WHERE user_id = ?', (user_id,))
        total_scans = cursor.fetchone()['total_scans']

        # Get scans by threat level
        cursor.execute('''
            SELECT threat_level, COUNT(*) as count 
            FROM scans 
            WHERE user_id = ? 
            GROUP BY threat_level
        ''', (user_id,))
        threat_counts = {row['threat_level']: row['count'] for row in cursor.fetchall()}

        # Get recent scans (last 7 days)
        cursor.execute('''
            SELECT COUNT(*) as weekly_scans 
            FROM scans 
            WHERE user_id = ? AND scanned_at >= datetime('now', '-7 days')
        ''', (user_id,))
        weekly_scans = cursor.fetchone()['weekly_scans']

        # Get recent scans (last 30 days)
        cursor.execute('''
            SELECT COUNT(*) as monthly_scans 
            FROM scans 
            WHERE user_id = ? AND scanned_at >= datetime('now', '-30 days')
        ''', (user_id,))
        monthly_scans = cursor.fetchone()['monthly_scans']

        # Get scans by scan type
        cursor.execute('''
            SELECT scan_type, COUNT(*) as count 
            FROM scans 
            WHERE user_id = ? 
            GROUP BY scan_type
        ''', (user_id,))
        scan_type_counts = {row['scan_type']: row['count'] for row in cursor.fetchall()}

        conn.close()

        return jsonify({
            'total_scans': total_scans,
            'weekly_scans': weekly_scans,
            'monthly_scans': monthly_scans,
            'threat_counts': {
                'clean': threat_counts.get('clean', 0),
                'suspicious': threat_counts.get('suspicious', 0),
                'malicious': threat_counts.get('malicious', 0)
            },
            'scan_type_counts': scan_type_counts
        }), 200

    except Exception as e:
        print(f"Error getting profile stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get profile statistics'}), 500
    