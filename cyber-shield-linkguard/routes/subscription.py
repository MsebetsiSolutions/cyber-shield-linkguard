import sqlite3
import datetime
from flask import Blueprint, jsonify, request, session

subscription_bp = Blueprint('subscription', __name__, url_prefix='/api/subscription')

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

# Create subscription endpoint
@subscription_bp.route('/create', methods=['POST'])
def create_subscription():
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
        
        if not all([plan_id, plan_name, plan_code, price]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Map plan names to plan mode values
        plan_mode_map = {
            'free': 0,
            'pro': 1,
            'team': 2,
            'enterprise': 3
        }
        
        # Calculate expiry date (30 days from now)
        expiry_date = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
        
        user_id = session['user_id']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # First, update the user's plan mode
            plan_mode = plan_mode_map.get(plan_id, 0)
            cursor.execute(
                'UPDATE users SET Plan_Mode = ? WHERE id = ?',
                (plan_mode, user_id)
            )
            
            # Then create a new subscription record
            cursor.execute('''
                INSERT INTO subscriptions (user_id, sub_plan, plan_code, price, date_expiry, plan_active)
                VALUES (?, ?, ?, ?, ?, 1)
            ''', (user_id, plan_name, plan_code, price, expiry_date))
            
            conn.commit()
            subscription_id = cursor.lastrowid
            conn.close()
            
            # Update session with new plan mode
            session['plan_mode'] = plan_mode
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({'error': 'Database error occurred'}), 500
            
        return jsonify({
            'message': 'Subscription created successfully',
            'subscription_id': subscription_id,
            'plan_mode': plan_mode,
            'expiry_date': expiry_date
        }), 201
        
    except Exception as e:
        print(f"Subscription creation error: {e}")
        return jsonify({'error': 'Subscription creation failed'}), 500

# Get user's current subscription
@subscription_bp.route('/current', methods=['GET'])
def get_current_subscription():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user_id = session['user_id']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get the most recent active subscription
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
                # Return default free plan if no subscription found
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

# Get subscription statistics (moved from scans_bp)
@subscription_bp.route('/stats', methods=['GET'])
def get_subscription_stats():
    try:
        # Check if user is authenticated
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
    