import sqlite3
import datetime
from flask import Blueprint, jsonify, request, session


#======================================================
# ------------- Subscription Blueprint ---------------
#======================================================

subscription_bp = Blueprint('subscription', __name__, url_prefix='/api/subscription')


#======================================================
# -------------------- Helpers -----------------------
#======================================================

def get_db_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn


#======================================================
# ---------------------- API -------------------------
#======================================================

#  subscription endpoint
@subscription_bp.route('/create', methods=['POST'])
def create_subscription():
    """Create a new subscription for the authenticated user."""
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
        
        # Validate required fields
        if not all([plan_id, plan_name, plan_code, price]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate price is a valid number
        try:
            price = float(price)
        except ValueError:
            return jsonify({'error': 'Invalid price format'}), 400
        
        # handling for "increase" plan
        if plan_id == 'increase':
            # For increase plan, keep user's plan_mode at 0 
            plan_mode = 0

            # expiry to 7 days
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
            # Set expiry to 30 days from now
            expiry_date = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
            increased = None
        
        user_id = session['user_id']
        
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
            
            conn.commit()
            subscription_id = cursor.lastrowid
            conn.close()
            
            # Update session only if it's not an "increase" plan
            if plan_id != 'increase':
                session['plan_mode'] = plan_mode
            
            return jsonify({
                'message': 'Subscription created successfully',
                'subscription_id': subscription_id,
                'plan_mode': plan_mode,
                'expiry_date': expiry_date
            }), 201
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500
            
    except Exception as e:
        print(f"Subscription creation error: {e}")
        return jsonify({'error': 'Subscription creation failed'}), 500

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
        
        conn.close()
        
        return jsonify({
            'current_subscription': dict(subscription) if subscription else None,
            'subscription_history': history
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
    