import sqlite3
from flask import Blueprint, request, jsonify, session
from datetime import datetime

module_bp = Blueprint('module', __name__, url_prefix='/api/modules')

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

@module_bp.route('/enroll', methods=['POST'])
def enroll_user():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'User not logged in'}), 401
        
        user_id = session['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        week = data.get('week', '').strip().lower() 
        
        if not week:
            return jsonify({'error': 'Week number is required'}), 400
        
        week_num = None
        if week.startswith('week'):
            if not week[4:].isdigit():
                return jsonify({'error': 'Invalid week format. Use format: week1, week2, etc.'}), 400
            week_num = int(week[4:])
            week = f"week{week_num}" 
        elif week.isdigit():
            week_num = int(week)
            week = f"week{week_num}"  
        else:
            return jsonify({'error': 'Invalid week format. Use format: week1, week2, etc.'}), 400
        
        if week_num < 1 or week_num > 12:
            return jsonify({'error': 'Week number must be between 1 and 12'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check for existing enrollment with normalized week format
        cursor.execute('''
            SELECT id FROM Modules_Enrolled 
            WHERE user_id = ? AND week = ?
        ''', (user_id, week))
        
        existing_enrollment = cursor.fetchone()
        
        if existing_enrollment:
            conn.close()
            return jsonify({
                'message': 'User already enrolled in this week',
                'enrolled': True,
                'week': week
            }), 200
        
        # Check previous week completion (wek 2-12)
        if week_num > 1:
            previous_week = f'week{week_num - 1}'
            cursor.execute('''
                SELECT id FROM Modules_Enrolled 
                WHERE user_id = ? AND week = ?
            ''', (user_id, previous_week))
            
            previous_enrollment = cursor.fetchone()
            if not previous_enrollment:
                conn.close()
                return jsonify({
                    'error': f'Please complete {previous_week} before enrolling in {week}'
                }), 400
        
        # Enroll user
        cursor.execute('''
            INSERT INTO Modules_Enrolled (user_id, week, enrolled_date)
            VALUES (?, ?, ?)
        ''', (user_id, week, datetime.now().isoformat()))
        
        conn.commit()
        enrollment_id = cursor.lastrowid
        conn.close()
        
        print(f"User {user_id} successfully enrolled in {week}")
        
        return jsonify({
            'message': 'Successfully enrolled in week',
            'enrolled': True,
            'week': week,
            'enrollment_id': enrollment_id
        }), 201
        
    except sqlite3.IntegrityError as e:
        print(f"Database integrity error in enroll_user: {e}")
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': 'Enrollment already exists'}), 409
    except Exception as e:
        print(f"Error in enroll_user: {e}")
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': 'Failed to enroll user'}), 500

@module_bp.route('/enrollment-status', methods=['GET'])
def get_enrollment_status():
    """Get user's enrollment status for all weeks"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'User not logged in'}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT week, enrolled_date 
            FROM Modules_Enrolled 
            WHERE user_id = ? 
            ORDER BY week
        ''', (user_id,))
        
        enrollments = cursor.fetchall()
        conn.close()
        
        enrolled_weeks = [dict(row) for row in enrollments]
        
        enrolled_week_set = {enrollment['week'] for enrollment in enrolled_weeks}
        
        all_weeks = [f'week{i}' for i in range(1, 13)]
        
        enrollment_status = {}
        for week in all_weeks:
            enrollment_status[week] = week in enrolled_week_set
        
        return jsonify({
            'enrolled_weeks': enrolled_weeks,
            'enrollment_status': enrollment_status,
            'total_enrolled': len(enrolled_weeks),
            'total_available': len(all_weeks)
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error in get_enrollment_status: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in get_enrollment_status: {e}")
        return jsonify({'error': 'Failed to get enrollment status'}), 500

@module_bp.route('/enrollment-status/<week>', methods=['GET'])
def get_week_enrollment_status(week):
    """Get user's enrollment status for a specific week"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'User not logged in'}), 401
        
        user_id = session['user_id']
        
        if not week.startswith('week') or not week[4:].isdigit():
            return jsonify({'error': 'Invalid week format'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, enrolled_date 
            FROM Modules_Enrolled 
            WHERE user_id = ? AND week = ?
        ''', (user_id, week))
        
        enrollment = cursor.fetchone()
        conn.close()
        
        is_enrolled = enrollment is not None
        enrollment_data = dict(enrollment) if enrollment else None
        
        return jsonify({
            'week': week,
            'enrolled': is_enrolled,
            'enrollment_data': enrollment_data
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error in get_week_enrollment_status: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in get_week_enrollment_status: {e}")
        return jsonify({'error': 'Failed to get enrollment status'}), 500

@module_bp.route('/progress', methods=['GET'])
def get_user_progress():
    """Get user's overall progress in the learning hub"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'User not logged in'}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) as enrolled_count 
            FROM Modules_Enrolled 
            WHERE user_id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        enrolled_count = result['enrolled_count'] if result else 0
        conn.close()
        
        total_weeks = 12  
        progress_percentage = (enrolled_count / total_weeks) * 100 if total_weeks > 0 else 0
        
        return jsonify({
            'enrolled_count': enrolled_count,
            'total_weeks': total_weeks,
            'progress_percentage': round(progress_percentage, 1),
            'remaining_weeks': total_weeks - enrolled_count
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error in get_user_progress: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in get_user_progress: {e}")
        return jsonify({'error': 'Failed to get user progress'}), 500
