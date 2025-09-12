import sqlite3
from flask import Blueprint, jsonify, request, session
import bcrypt
import re

settings_bp = Blueprint('settings', __name__, url_prefix='/api/user')

def get_db_connection():
    """Get database connection to the cyber-shield-linkguard database"""
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format (international format)"""
    if not phone:
        return True  # Phone is optional
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone) is not None

@settings_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile information"""
    try:
        # Check if user is authenticated via session
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user profile information including phone number
        cursor.execute('SELECT id, email, full_name, phone_number, created_at FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'phone_number': user['phone_number'] or '',
            'created_at': user['created_at']
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error in get_profile: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in get_profile: {e}")
        return jsonify({'error': 'Failed to retrieve profile'}), 500

@settings_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile information"""
    try:
        # Check if user is authenticated via session
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        phone_number = data.get('phone_number', '').strip()
        
        # Basic validation
        if not full_name:
            return jsonify({'error': 'Full name is required'}), 400
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if phone_number and not validate_phone(phone_number):
            return jsonify({'error': 'Invalid phone number format. Use international format (e.g., +1234567890)'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the email is already taken by another user
        cursor.execute('SELECT id, email FROM users WHERE email = ? AND id != ?', (email, user_id))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({'error': f'Email "{email}" is already registered with another account'}), 409
        
        # Update user profile
        cursor.execute('''
            UPDATE users 
            SET full_name = ?, email = ?, phone_number = ?
            WHERE id = ?
        ''', (full_name, email, phone_number, user_id))
        
        conn.commit()
        
        # Update session data
        session['user_full_name'] = full_name
        session['user_email'] = email
        
        conn.close()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user_id,
                'email': email,
                'full_name': full_name,
                'phone_number': phone_number
            }
        }), 200
        
    except sqlite3.IntegrityError as e:
        print(f"Database integrity error in update_profile: {e}")
        return jsonify({'error': 'Email already exists or invalid data'}), 409
    except sqlite3.Error as e:
        print(f"Database error in update_profile: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in update_profile: {e}")
        return jsonify({'error': 'Failed to update profile'}), 500

@settings_bp.route('/password', methods=['PUT'])
def update_password():
    """Update user password"""
    try:
        # Check if user is authenticated via session
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        # Basic validation
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Validate new password length
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        if len(new_password) > 12:
            return jsonify({'error': 'New password must not exceed 12 characters'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user password
        cursor.execute('SELECT password FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        stored_password = user['password']
        if not bcrypt.checkpw(current_password.encode('utf-8'), stored_password.encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Hash new password
        hashed_new_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        hashed_new_password_str = hashed_new_password.decode('utf-8')
        
        # Update password
        cursor.execute('UPDATE users SET password = ? WHERE id = ?', (hashed_new_password_str, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Password updated successfully'}), 200
        
    except sqlite3.Error as e:
        print(f"Database error in update_password: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in update_password: {e}")
        return jsonify({'error': 'Failed to update password'}), 500

@settings_bp.route('/account', methods=['DELETE'])
def delete_account():
    """Delete user account"""
    try:
        # Check if user is authenticated via session
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        password = data.get('password', '')
        
        if not password:
            return jsonify({'error': 'Password is required to confirm account deletion'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify password
        cursor.execute('SELECT password FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        stored_password = user['password']
        if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            conn.close()
            return jsonify({'error': 'Password is incorrect'}), 401
        
        # Delete user account
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()
        
        # Clear session
        session.clear()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except sqlite3.Error as e:
        print(f"Database error in delete_account: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error极 delete_account: {e}")
        return jsonify({'error': 'Failed to delete account'}), 500
    