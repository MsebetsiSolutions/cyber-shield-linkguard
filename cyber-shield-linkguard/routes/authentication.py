import email
from urllib import response
import bcrypt
import sqlite3
import os
from flask import Blueprint, jsonify, request, session
from itsdangerous import URLSafeTimedSerializer
from mailersend import MailerSendClient, EmailBuilder
from dotenv import load_dotenv

load_dotenv()

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def send_email(to, name, subject, reset_url):
    """Send email using MailerSend"""
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Cyber Shield LinkGuard</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000; line-height: 1.6;">
  <div style="padding: 40px 20px; background-color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #000000;">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 1px solid #000000;">
        <span style="font-size: 48px; color: #000000; margin-bottom: 16px; display: block;"></span>
        <h1 style="color: #000000; font-size: 28px; font-weight: 600; margin: 0 0 8px 0;">Cybershield LinkGuard</h1>
        <p style="color: #000000; font-size: 16px; margin: 0;">Password Reset Request</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="font-size: 18px; font-weight: 500; color: #000000; margin: 0 0 20px 0;">Hello,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #000000; margin: 0 0 30px 0;">
          We received a request to reset your password for your Cybershield LinkGuard account. 
          If you made this request, click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{reset_url}}" style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 16px 32px; border: 2px solid #000000; font-weight: 600; font-size: 16px; text-align: center;">
            Reset My Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #000000; text-align: center; margin: 20px 0; font-style: italic;">
          This reset link will expire in 1 hour for security reasons.
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #000000; padding: 20px; margin: 30px 0;">
          <p style="margin: 0; font-size: 14px; color: #000000; line-height: 1.5;">
            <span style="color: #000000; font-size: 20px; margin-right: 8px;"></span>
            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. 
            Your password will remain unchanged and your account is secure.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #000000; margin: 0 0 30px 0;">
          <strong>Having trouble with the button?</strong> Copy and paste the following link into your browser:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #000000; padding: 16px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; color: #000000;">
          {{reset_url}}
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #000000; margin: 0 0 30px 0;">
          For your security, this link can only be used once and will expire after 1 hour.
          If you need assistance, please contact our support team.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #ffffff; padding: 30px; text-align: center; border-top: 1px solid #000000;">
        <p style="font-size: 14px; color: #000000; margin: 0 0 10px 0; line-height: 1.5;">
          This email was sent from Cyber Shield LinkGuard.<br>
          If you have any questions, please contact our support team.
        </p>
        <p style="font-size: 12px; color: #000000; margin: 0;">
          © Msebetsi Solutions Pty Ltd<br>
          This is an automated message, please do not reply to this email.
        </p>
      </div>
      
    </div>
  </div>
</body>
</html>
"""

    html_content = html_content.replace('{{reset_url}}', reset_url)

    try:
        ms = MailerSendClient()

        email = (EmailBuilder().from_email('test@test-ywj2lpnwmmqg7oqz.mlsender.net', 'Cybershield Linknguard').to_many([{'email': to, 'name': name}])).subject(subject).html(html_content).build()

        response = ms.emails.send(email)

        if response.status_code == 202:
            print("Email sent successfully!")
        else:
            print("Failed to send email.") 
    except:
        print("Failed to send email.")
        
def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn


# User Registration Endpoint
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
                INSERT INTO users (full_name, email, password, Plan_Mode) 
                VALUES (?, ?, ?, 0)
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
            'user_id': user_id,
            'plan_mode': 0
        }), 201 
    
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'error': 'Signup failed'}), 500



# User Login Endpoint - Session Based Authentication
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

            # ✅ Include cellphone_number in query
            cursor.execute('SELECT id, full_name, email, password, Plan_Mode, cellphone_number FROM users WHERE email = ?', (email,))
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
                session['plan_mode'] = user['Plan_Mode']
                session['cellphone_number'] = user['cellphone_number']  
                session.permanent = True
                
                print(f"User {user['email']} logged in successfully. Session created.")
                conn.close()

                return jsonify({
                    'message': 'Login successful',
                    'full_name': user['full_name'],
                    'email': user['email'],
                    'cellphone_number': user['cellphone_number'], 
                    'user_id': user['id'],
                    'plan_mode': user['Plan_Mode'],
                    'authenticated': True
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



# User Logout Endpoint - Clear Session
@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        print("User logged out. Session cleared.")
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500


# Get Current User Information from Session
@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    try:
        if 'user_id' in session and 'user_email' in session:
            return jsonify({
                'authenticated': True,
                'user_id': session['user_id'],
                'full_name': session.get('user_full_name', ''),
                'email': session['user_email'],
                'cellphone_number': session.get('cellphone_number', ''),  # 👈 important
                'plan_mode': session.get('plan_mode', 0)
            }), 200
        else:
            return jsonify({'authenticated': False}), 200
    except Exception as e:
        print(f"Get user info error: {e}")
        return jsonify({'error': 'Failed to get user information'}), 500


# forgot password implementation
@auth_bp.route('forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()

    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    try:
        # checking is email exists in the database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('select id from users where email = ?', (email,))

        user = cursor.fetchone()

        if user:
            user_id = user['id']
            serializer = URLSafeTimedSerializer(os.getenv('FLASK_SECRET_KEY'))

            token = serializer.dumps(email, salt='password-reset-salt')

            print(f"Generated token for user {user_id}: {token}")

            reset_url = f"http://localhost:3000/reset-password/{token}"

            mail = send_email(email, 'Sivuyise', 'Password Reset Request', reset_url)

            conn.close()
            return jsonify({'message': 'Password reset email sent'}), 200
        else:
            conn.close()
            return jsonify({'error': 'Email not found'}), 404
            

    except sqlite3.Error as e:
        print(f"Database error in forgot_password: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
