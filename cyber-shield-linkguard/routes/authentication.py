import bcrypt
import sqlite3
import datetime
from flask import Blueprint, jsonify, request, session

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn





@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not full_name or not email or not password:
            return jsonify({'error': 'Full name, email and password required'}), 400

        if len(password) < 6 or len(password) > 12:
            return jsonify({'error': 'Password must be between 6 and 12 characters'}), 400

        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        hashed_pw_str = hashed_pw.decode('utf-8')

        print(f"Full Name: {full_name}")
        print(f"Email: {email}")
        print(f"Original Password Length: {len(password)}")
        print(f"Hashed Password: {hashed_pw}")
        print(f"Hashed Password (decoded): {hashed_pw_str}")
        print(f"Hashed Password Length: {len(hashed_pw_str)}")

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            if cursor.fetchone():
                conn.close()
                return jsonify({'error': 'Email already exists'}), 409

            cursor.execute('''
                INSERT INTO users (full_name, email, password) 
                VALUES (?, ?, ?)
            ''', (full_name, email, hashed_pw_str))

            conn.commit()
            user_id = cursor.lastrowid
            conn.close()

            print(f"User created successfully with ID: {user_id}")

        except sqlite3.IntegrityError as e:
            print(f"Database integrity error: {e}")
            return jsonify({'error': 'Email already exists or invalid data'}), 409
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500

        return jsonify({
            'message': 'Account created successfully',
            'full_name': full_name,
            'email': email,
            'user_id': user_id
        }), 201 
    
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'error': 'Signup failed'}), 500





@auth_bp.route('/guestSignup', methods=['POST'])
def guest_signup():
    try:
        data = request.get_json()
        guest_email = data.get('email')
        guest_password = data.get('password')

        hashpw = bcrypt.hashpw(guest_password.encode('utf-8'), bcrypt.gensalt())
        hashpw_str = hashpw.decode('utf-8')
        expiry = datetime.datetime.now() + datetime.timedelta(days=30)
        expiry_str = expiry.isoformat()

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('INSERT INTO users (email, password, account_type, is_guest, guest_expires_at) VALUES (?, ?, "guest", 1, ?)',
                          (guest_email, hashpw_str, expiry_str))
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
        except sqlite3.Error as e:
            return jsonify({'error': 'Database error occurred'}), 500
        
        return jsonify({
            'message': 'Guest account created successfully',
            'email': guest_email,
            'user_id': user_id,
            'account_type': 'guest',
            'expire_at': expiry_str,
            'expires_in_day': 30
        }), 201
    
    except Exception as e:
        return jsonify({'error': 'Guest account creation failed'}), 500
        








@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"Login attempt data: {data}")

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and Password required'}), 400

        if len(password) < 6 or len(password) > 12:
            return jsonify({'error': 'Password must be between 6 and 12 characters'}), 400

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT id, full_name, email, password FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()

            if not user:
                conn.close()
                print(f"User not found with email: {email}")
                return jsonify({'error': 'Invalid email or password'}), 401

            stored_pw = user['password']
            print(f"Stored password hash: {stored_pw}")
            print(f"Input password: {password}")

            if bcrypt.checkpw(password.encode('utf-8'), stored_pw.encode('utf-8')):
                session['user_id'] = user['id']
                session['user_full_name'] = user['full_name']
                session['user_email'] = user['email']
                session.permanent = True
                
                print(f"User {user['email']} logged in successfully. Session created.")
                conn.close()

                return jsonify({
                    'message': 'Login successful',
                    'full_name': user['full_name'],
                    'email': user['email'],
                    'user_id': user['id']
                }), 200
            else:
                print("Password does not match")
                conn.close()
                return jsonify({'error': 'Invalid email or password'}), 401

        except sqlite3.Error as e:
            print(f"Database error: {e}")
            if conn:
                conn.close()
            return jsonify({'error': 'Database error occurred'}), 500
    
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Login failed'}), 500





@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        print("User logged out. Session cleared.")
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500







# Get current user info from session - UPDATED ENDPOINT
@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    try:
        if 'user_id' in session and 'user_email' in session:
            return jsonify({
                'authenticated': True,
                'user_id': session['user_id'],
                'full_name': session['user_full_name'],
                'email': session['user_email']
            }), 200
        else:
            return jsonify({'authenticated': False}), 200
    except Exception as e:
        print(f"Get user info error: {e}")
        return jsonify({'error': 'Failed to get user information'}), 500
    