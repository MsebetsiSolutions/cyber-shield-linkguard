import sqlite3
from flask import Blueprint, jsonify, request, session
import time

chats_bp = Blueprint('chats', __name__)

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

@chats_bp.route('/join', methods=['POST'])
def join_chat():
    # Check if user is authenticated via session
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized, please log in'}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user is already in the chat
        cursor.execute('SELECT chat_id FROM chats WHERE user_id = ?', (user_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'message': 'User already joined the support chat', 'joined': True}), 200
            
        # Insert new chat entry
        cursor.execute('INSERT INTO chats (user_id) VALUES (?)', (user_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Successfully joined the support chat', 
            'joined': True,
            'user_id': user_id
        }), 201
        
    except sqlite3.Error as e:
        print(f"Database error when joining chat: {e}")
        return jsonify({'error': 'Database error. Please try again later.'}), 500
    except Exception as e:
        print(f"Unexpected error when joining chat: {e}")
        return jsonify({'error': 'Unexpected error. Please try again.'}), 500

@chats_bp.route('/member_count', methods=['GET'])
def get_member_count():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(DISTINCT user_id) AS count FROM chats')
        result = cursor.fetchone()
        count = result['count'] if result else 0
        conn.close()
        return jsonify({'member_count': count}), 200
    except sqlite3.Error as e:
        print(f"Database error when getting member count: {e}")
        return jsonify({'member_count': 0}), 200
    except Exception as e:
        print(f"Unexpected error when getting member count: {e}")
        return jsonify({'member_count': 0}), 200

@chats_bp.route('/check_joined', methods=['GET'])
def check_joined():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT chat_id FROM chats WHERE user_id = ?', (user_id,))
        is_joined = bool(cursor.fetchone())
        conn.close()
        return jsonify({'joined': is_joined}), 200
    except sqlite3.Error as e:
        print(f"Database error when checking join status: {e}")
        return jsonify({'joined': False}), 200
    except Exception as e:
        print(f"Unexpected error when checking join status: {e}")
        return jsonify({'joined': False}), 200
    