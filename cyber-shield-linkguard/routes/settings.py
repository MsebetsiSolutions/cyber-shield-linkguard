import sqlite3
from flask import Blueprint, jsonify, request
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

settings_bp = Blueprint('settings', __name__, url_prefix='/api/user')

# JWT Secret Key (should be in environment variables in production)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cyber-shield-secret-key")

def get_db_connection():
    # Get database connection to the cyber-shield-linkguard database
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

def verify_token_and_get_user_id(token):
    """
    Verify JWT token and return user ID
    """
    try:
        # Decode the JWT token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError:
        print("Invalid token")
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

@settings_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile information"""
    try:
        # Get authorization token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        
        user_id = verify_token_and_get_user_id(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user profile information
        cursor.execute('SELECT id, email, full_name, created_at FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
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
        # Get authorization token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token and get user ID
        user_id = verify_token_and_get_user_id(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        
        # Basic validation
        if not full_name:
            return jsonify({'error': 'Full name is required'}), 400
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
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
            SET full_name = ?, email = ?
            WHERE id = ?
        ''', (full_name, email, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user_id,
                'email': email,
                'full_name': full_name
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
        # Get authorization token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token and get user ID
        user_id = verify_token_and_get_user_id(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
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
        # Get authorization token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token and get user ID
        user_id = verify_token_and_get_user_id(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
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
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except sqlite3.Error as e:
        print(f"Database error in delete_account: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in delete_account: {e}")
        return jsonify({'error': 'Failed to delete account'}), 500
    