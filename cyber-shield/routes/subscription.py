import sqlite3
import datetime
import random
import string
from flask import Blueprint, jsonify, request, session

# ======================================================
# ------------- Subscription Blueprint ---------------
# ======================================================

subscription_bp = Blueprint('subscription', __name__, url_prefix='/api/subscription')

# ======================================================
# -------------------- Helpers -----------------------
# ======================================================

def get_db_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

def generate_transaction_id():
    """Generate a unique transaction ID."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TX{timestamp}{random_str}"

def validate_card_number(card_number):
    """Basic card number validation (Luhn algorithm)."""
    card_number = card_number.replace(" ", "")
    if not card_number.isdigit() or len(card_number) < 13 or len(card_number) > 19:
        return False
    
    # Luhn algorithm
    def luhn_check(card_num):
        def digits_of(n):
            return [int(d) for d in str(n)]
        digits = digits_of(card_num)
        odd_digits = digits[-1::-2]
        even_digits = digits[-2::-2]
        checksum = sum(odd_digits)
        for d in even_digits:
            checksum += sum(digits_of(d*2))
        return checksum % 10 == 0
    
    return luhn_check(card_number)

def validate_expiry_date(expiry_date):
    """Validate card expiry date."""
    try:
        month, year = expiry_date.split('/')
        month = int(month.strip())
        year = int(year.strip())
        
        if month < 1 or month > 12:
            return False
            
        current_year = datetime.datetime.now().year % 100
        current_month = datetime.datetime.now().month
        
        if year < current_year or (year == current_year and month < current_month):
            return False
            
        return True
    except:
        return False

def validate_cvv(cvv):
    """Validate CVV code."""
    return cvv.isdigit() and len(cvv) in [3, 4]

# ======================================================
# ---------------------- API -------------------------
# ======================================================

@subscription_bp.route('/create', methods=['POST'])
def create_subscription():
    """Create a new subscription and payment record for the authenticated user."""
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
        team_size = data.get('team_size', 1)
        
        # Payment details (for recording)
        payment_method = data.get('payment_method', 'card')
        card_last_four = data.get('card_last_four')
        
        # Validate required fields
        if not all([plan_id, plan_name, plan_code, price]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate price is a valid number
        try:
            price = float(price)
        except ValueError:
            return jsonify({'error': 'Invalid price format'}), 400
        
        # Handle different plan types
        if plan_id == 'increase':
            plan_mode = 0  # Keep user's plan_mode at 0 for increase plan
            expiry_date = (datetime.datetime.now() + datetime.timedelta(days=7)).isoformat()
            increased = 'yes'
        else:
            # Regular plan handling
            plan_mode_map = {
                'free': 0,
                'pro': 1,
                'team': 2,
                'enterprise': 3
            }
            plan_mode = plan_mode_map.get(plan_id, 0)
            expiry_date = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
            increased = None
        
        user_id = session['user_id']
        transaction_id = generate_transaction_id()
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Only update user's plan mode if it's not an "increase" plan
            if plan_id != 'increase':
                cursor.execute(
                    'UPDATE users SET Plan_Mode = ? WHERE id = ?',
                    (plan_mode, user_id)
                )
            
            # Deactivate any existing active subscriptions
            cursor.execute(
                'UPDATE subscriptions SET plan_active = 0 WHERE user_id = ? AND plan_active = 1',
                (user_id,)
            )
            
            # Insert new subscription
            cursor.execute('''
                INSERT INTO subscriptions (user_id, sub_plan, plan_code, price, date_expiry, plan_active, team_size, increased)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            ''', (user_id, plan_name, plan_code, price, expiry_date, team_size, increased))
            
            subscription_id = cursor.lastrowid
            
            # Insert payment record
            cursor.execute('''
                INSERT INTO payments (user_id, subscription_id, amount, currency, payment_method, status, transaction_id, card_last_four)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, subscription_id, price, 'ZAR', payment_method, 'completed', transaction_id, card_last_four))
            
            conn.commit()
            conn.close()
            
            # Update session only if it's not an "increase" plan
            if plan_id != 'increase':
                session['plan_mode'] = plan_mode
            
            return jsonify({
                'message': 'Subscription created successfully',
                'subscription_id': subscription_id,
                'transaction_id': transaction_id,
                'plan_mode': plan_mode,
                'expiry_date': expiry_date
            }), 201
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500
            
    except Exception as e:
        print(f"Subscription creation error: {e}")
        return jsonify({'error': 'Subscription creation failed'}), 500

@subscription_bp.route('/process-payment', methods=['POST'])
def process_payment():
    """Process payment and create subscription (enhanced security version)."""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract payment and subscription data
        plan_data = data.get('plan_data', {})
        payment_data = data.get('payment_data', {})
        
        # Validate required fields
        if not all([plan_data.get('plan_id'), plan_data.get('plan_name'), 
                   plan_data.get('plan_code'), plan_data.get('price')]):
            return jsonify({'error': 'Missing plan information'}), 400
            
        # Validate payment data
        card_number = payment_data.get('card_number', '').replace(" ", "")
        expiry_date = payment_data.get('expiry_date')
        cvv = payment_data.get('cvv')
        
        if not validate_card_number(card_number):
            return jsonify({'error': 'Invalid card number'}), 400
            
        if not validate_expiry_date(expiry_date):
            return jsonify({'error': 'Invalid or expired card'}), 400
            
        if not validate_cvv(cvv):
            return jsonify({'error': 'Invalid CVV'}), 400
        
        # Process subscription (same logic as create_subscription)
        plan_id = plan_data['plan_id']
        plan_name = plan_data['plan_name']
        plan_code = plan_data['plan_code']
        price = float(plan_data['price'])
        team_size = plan_data.get('team_size', 1)
        
        user_id = session['user_id']
        transaction_id = generate_transaction_id()
        card_last_four = card_number[-4:]
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Handle plan mode
            if plan_id == 'increase':
                plan_mode = 0
                expiry_date = (datetime.datetime.now() + datetime.timedelta(days=7)).isoformat()
                increased = 'yes'
            else:
                plan_mode_map = {
                    'free': 0,
                    'pro': 1,
                    'team': 2,
                    'enterprise': 3
                }
                plan_mode = plan_mode_map.get(plan_id, 0)
                expiry_date = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
                increased = None
            
            # Update user plan mode if not increase plan
            if plan_id != 'increase':
                cursor.execute(
                    'UPDATE users SET Plan_Mode = ? WHERE id = ?',
                    (plan_mode, user_id)
                )
            
            # Deactivate existing subscriptions
            cursor.execute(
                'UPDATE subscriptions SET plan_active = 0 WHERE user_id = ? AND plan_active = 1',
                (user_id,)
            )
            
            # Insert new subscription
            cursor.execute('''
                INSERT INTO subscriptions (user_id, sub_plan, plan_code, price, date_expiry, plan_active, team_size, increased)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            ''', (user_id, plan_name, plan_code, price, expiry_date, team_size, increased))
            
            subscription_id = cursor.lastrowid
            
            # Insert payment record
            cursor.execute('''
                INSERT INTO payments (user_id, subscription_id, amount, currency, payment_method, status, transaction_id, card_last_four)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, subscription_id, price, 'ZAR', 'card', 'completed', transaction_id, card_last_four))
            
            conn.commit()
            conn.close()
            
            # Update session
            if plan_id != 'increase':
                session['plan_mode'] = plan_mode
            
            return jsonify({
                'message': 'Payment processed successfully',
                'subscription_id': subscription_id,
                'transaction_id': transaction_id,
                'plan_mode': plan_mode,
                'expiry_date': expiry_date
            }), 201
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500
            
    except Exception as e:
        print(f"Payment processing error: {e}")
        return jsonify({'error': 'Payment processing failed'}), 500

# Get user's current subscription
@subscription_bp.route('/current', methods=['GET'])
def get_current_subscription():
    """Get the current subscription for the authenticated user."""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
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

# Get payment history
@subscription_bp.route('/payment-history', methods=['GET'])
def get_payment_history():
    """Get payment history for the authenticated user."""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, s.sub_plan, s.plan_code 
            FROM payments p 
            JOIN subscriptions s ON p.subscription_id = s.sub_id 
            WHERE p.user_id = ? 
            ORDER BY p.created_at DESC
        ''', (user_id,))
        
        payments = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'payments': payments
        }), 200
        
    except Exception as e:
        print(f"Error fetching payment history: {e}")
        return jsonify({'error': 'Failed to fetch payment history'}), 500

# Get subscription statistics
@subscription_bp.route('/stats', methods=['GET'])
def get_subscription_stats():
    """Get subscription statistics and history for the authenticated user."""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get subscription details
        cursor.execute('''
            SELECT s.*, u.Plan_Mode 
            FROM subscriptions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.user_id = ? AND s.plan_active = 1 
            ORDER BY s.created_at DESC 
            LIMIT 1
        ''', (user_id,))
        
        subscription = cursor.fetchone()
        
        # Get subscription history
        cursor.execute('''
            SELECT * FROM subscriptions 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,))
        
        history = [dict(row) for row in cursor.fetchall()]
        
        # Get payment history
        cursor.execute('''
            SELECT p.*, s.sub_plan 
            FROM payments p 
            JOIN subscriptions s ON p.subscription_id = s.sub_id 
            WHERE p.user_id = ? 
            ORDER BY p.created_at DESC
        ''', (user_id,))
        
        payments = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'current_subscription': dict(subscription) if subscription else None,
            'subscription_history': history,
            'payment_history': payments
        }), 200
        
    except Exception as e:
        print(f"Error fetching subscription stats: {e}")
        return jsonify({'error': 'Failed to fetch subscription statistics'}), 500

# Calculate enterprise pricing based on team size
@subscription_bp.route('/calculate-enterprise-price', methods=['POST'])
def calculate_enterprise_price():
    """Calculate enterprise pricing based on team size."""
    try:
        data = request.get_json()
        team_size = data.get('team_size', 1)
        
        # Base price for enterprise
        base_price = 2750
        if team_size <= 5:
            total_price = base_price * team_size
        elif team_size <= 10:
            total_price = base_price * team_size * 0.9  # 10% discount
        elif team_size <= 20:
            total_price = base_price * team_size * 0.85  # 15% discount
        else:
            total_price = base_price * team_size * 0.8  # 20% discount
        
        return jsonify({
            'team_size': team_size,
            'base_price': base_price,
            'total_price': round(total_price, 2),
            'annual_price': round(total_price * 12, 2)
        }), 200
        
    except Exception as e:
        print(f"Price calculation error: {e}")
        return jsonify({'error': 'Failed to calculate price'}), 500
