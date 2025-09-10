import bcrypt
import sqlite3
import datetime
from flask import Blueprint, jsonify, request

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def get_db_connection():
    # Get database connection to the cyber-shield-linkguard database
    conn = sqlite3.connect('cyber-shield-linkguard.db')

    # return dictionary data structure from the columns of the database
    # e.g instead of column id data[2] use data['password']
    conn.row_factory = sqlite3.Row
    return conn

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        # Get JSON data
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Basic validation
        if not full_name or not email or not password:
            return jsonify({'error': 'Full name, email and password required'}), 400

        # Validate password length of the original password
        if len(password) < 6 or len(password) > 12:
            return jsonify({'error': 'Password must be between 6 and 12 characters'}), 400

        # Hash the password using bcrypt functions
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        hashed_pw_str = hashed_pw.decode('utf-8')

        # Print to console for debug purposes
        print(f"Full Name: {full_name}")
        print(f"Email: {email}")
        print(f"Original Password Length: {len(password)}")
        print(f"Hashed Password: {hashed_pw}")
        print(f"Hashed Password (decoded): {hashed_pw_str}")
        print(f"Hashed Password Length: {len(hashed_pw_str)}")

        # Trying to insert into database using the get_db_connection() defined above
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            if cursor.fetchone():
                conn.close()
                return jsonify({'error': 'Email already exists'}), 409

            # Insert new user to the users table in the database
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
    
    # Return success response
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'error': 'Signup failed'}), 500

@auth_bp.route('/guestSignup', methods=['POST'])
def guest_signup():
    try:

        data = request.get_json()

        guest_email = data.get('email')
        guest_password = data.get('password')


        hashpw = bcrypt.hashpw(guest_password.encode('ut-8'), bcrypt.gensalt())
        hashpw_str = hashpw.decode('utf-8')
        # expiration date (30 days) one month trial
        expiry = datetime.datetime.now() + datetime.timedelta(days=30)
        expiry_str = expiry.isoformat()


        try:
            conn = get_db_connection()
            cursor = conn.autocommit

            sql_query = 'INSERT INTO USER (email, password, account_type, is_guest, guest_expires_at) VALUES (?, ?, guest, ?, ?)'

            cursor.execute(sql_query, (guest_email, hashpw_str, expiry_str))

            conn.commit()
            user_id = cursor.lastrowid
            conn.close()

        except sqlite3.Error as e:
            return jsonify({'error': 'Database error occured'}), 500
        
        return jsonify(
            {
                'message': 'Guest account created successfully',
                'email': guest_email,
                'user_id': user_id,
                'account_type': 'guest',
                'expire_at': expiry_str,
                'expires_in_day': 30
            }
        ), 201
    
    except Exception as e:
        return jsonify({'error': 'Guest account creation failed'}), 500
        





# login function for registered users 
@auth_bp.route('/login', methods=['POST'])
def login():
    
    try:

        # gets data from the frontend
        data = request.get_json()

        # debug purposes 
        print(data)

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email and not password:
            return jsonify({'error': 'Email and Password required'})

        # Validate password length of the original password
        if len(password) < 6 or len(password) > 12:
            return jsonify({'error': 'Password must be between 6 and 12 characters'}), 400

        # Hash the password using bcrypt functions
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        hashed_pw_str = hashed_pw.decode('utf-8')

        try:

            conn = get_db_connection()
            cursor = conn.cursor()

            sql_query = 'SELECT id, full_name, email, password FROM users WHERE email = ?'

            cursor.execute(sql_query, (email,))
            user = cursor.fetchone()

            conn.close()

            if not user:
                return jsonify({'error': 'Invalid email or password'}), 401

            stored_pw = user['password']

            if bcrypt.checkpw(password.encode('utf-8'), stored_pw.encode('utf-8')):

                return jsonify({'message': 'Login successful',
                            'full_name': user['full_name'],
                            'email': user['email'],
                            'user_id': user['id']}), 200
            else:
                return jsonify({'error': 'Invalid email or password'}), 401

        except sqlite3.Error as e:
            return jsonify({'error': 'Database error occured'}), 500
    
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500