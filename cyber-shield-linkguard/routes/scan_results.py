# cyber-shield-linkguard/routes/scan_results.py
from flask import Blueprint, jsonify, request, session
import sqlite3
import datetime

scan_results_bp = Blueprint('scan_results', __name__, url_prefix='/api/scans')

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

@scan_results_bp.route('/save', methods=['POST'])
def save_scan():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        scan_type = data.get('scan_type')
        content = data.get('content')
        result = data.get('result') # it will be a JSON string of the scan output
        
        # Get the verdict band from the client-side JSON data, which is 'SAFE', 'WARN', 'DANGER'
        verdict_band = data.get('verdict_band') 
        
        user_id = session['user_id']
        # Retrieve plan_mode from the session
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
        threat_level = threat_level_mapping.get(verdict_band.upper(), 'clean') # Default to 'clean'

        # Validate threat_level against CHECK constraint (redundant if mapping is correct, but good for safety)
        valid_threat_levels = ['clean', 'suspicious', 'malicious']
        if threat_level not in valid_threat_levels:
            # This should ideally not happen if the mapping is exhaustive for expected bands
            print(f"Warning: Mapped threat_level '{threat_level}' is not in valid_threat_levels.")
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
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to save scan result'}), 500
    