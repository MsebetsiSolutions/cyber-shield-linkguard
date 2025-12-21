from flask import Blueprint, request, jsonify, session
import sqlite3
import json
from datetime import datetime
import os
from functools import wraps

team_collab_bp = Blueprint('team_collab', __name__)

# Fixed Database helper function - use the same database as app.py
def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required', 'authenticated': False}), 401
        return f(*args, **kwargs)
    return decorated_function

# Get current user ID
def get_current_user_id():
    return session.get('user_id')

# Team Management Routes
@team_collab_bp.route('/api/teams', methods=['POST'])
@login_required
def create_team():
    data = request.get_json()
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        # Check if user already has a team
        existing_teams = conn.execute(
            'SELECT COUNT(*) as count FROM teams WHERE created_by = ?', 
            (user_id,)
        ).fetchone()['count']
        
        if existing_teams >= 1:  # Limit to 1 team per user for simplicity
            return jsonify({'error': 'You can only create one team'}), 400
        
        # Create team
        cursor = conn.execute(
            'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)',
            (data['name'], data.get('description', ''), user_id)
        )
        team_id = cursor.lastrowid
        
        # Add creator as team owner
        conn.execute(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            (team_id, user_id, 'owner')
        )
        
        conn.commit()
        return jsonify({'message': 'Team created successfully', 'team_id': team_id}), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@team_collab_bp.route('/api/teams/<int:team_id>/channels', methods=['POST'])
@login_required
def create_channel(team_id):
    data = request.get_json()
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        # Check if user is team member
        member = conn.execute(
            'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
            (team_id, user_id)
        ).fetchone()
        
        if not member:
            return jsonify({'error': 'You are not a member of this team'}), 403
        
        # Check channel limit (2 channels per user)
        user_channels = conn.execute(
            'SELECT COUNT(*) as count FROM channels WHERE created_by = ?',
            (user_id,)
        ).fetchone()['count']
        
        if user_channels >= 2:
            return jsonify({'error': 'You can only create 2 channels'}), 400
        
        # Create channel
        cursor = conn.execute(
            'INSERT INTO channels (name, description, team_id, created_by, is_private) VALUES (?, ?, ?, ?, ?)',
            (data['name'], data.get('description', ''), team_id, user_id, data.get('is_private', False))
        )
        channel_id = cursor.lastrowid
        
        conn.commit()
        return jsonify({'message': 'Channel created successfully', 'channel_id': channel_id}), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# User Search and Management
@team_collab_bp.route('/api/users/search', methods=['GET'])
@login_required
def search_users():
    query = request.args.get('q', '')
    user_id = get_current_user_id()
    
    if not query or len(query) < 2:
        return jsonify({'error': 'Query must be at least 2 characters long'}), 400
    
    conn = get_db_connection()
    try:
        users = conn.execute('''
            SELECT id, full_name, email 
            FROM users 
            WHERE (full_name LIKE ? OR email LIKE ?) AND id != ?
            LIMIT 10
        ''', (f'%{query}%', f'%{query}%', user_id)).fetchall()
        
        user_list = [dict(user) for user in users]
        return jsonify({'users': user_list})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@team_collab_bp.route('/api/teams/<int:team_id>/members', methods=['POST'])
@login_required
def add_team_member(team_id):
    data = request.get_json()
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        # Check if current user is team owner/admin
        current_member = conn.execute('''
            SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
        ''', (team_id, user_id)).fetchone()
        
        if not current_member or current_member['role'] not in ['owner', 'admin']:
            return jsonify({'error': 'Only team owners and admins can add members'}), 403
        
        # Check if user exists
        target_user = conn.execute(
            'SELECT id FROM users WHERE id = ?', (data['user_id'],)
        ).fetchone()
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Add user to team
        conn.execute(
            'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            (team_id, data['user_id'], data.get('role', 'member'))
        )
        
        conn.commit()
        return jsonify({'message': 'User added to team successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@team_collab_bp.route('/api/teams/<int:team_id>/members/<int:member_id>', methods=['DELETE'])
@login_required
def remove_team_member(team_id, member_id):
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        # Check if current user is team owner/admin
        current_member = conn.execute('''
            SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
        ''', (team_id, user_id)).fetchone()
        
        if not current_member or current_member['role'] not in ['owner', 'admin']:
            return jsonify({'error': 'Only team owners and admins can remove members'}), 403
        
        # Cannot remove yourself if you're the only owner
        if member_id == user_id:
            other_owners = conn.execute('''
                SELECT COUNT(*) as count FROM team_members 
                WHERE team_id = ? AND role = 'owner' AND user_id != ?
            ''', (team_id, user_id)).fetchone()['count']
            
            if other_owners == 0:
                return jsonify({'error': 'Cannot remove yourself as the only owner'}), 400
        
        # Remove member
        conn.execute(
            'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
            (team_id, member_id)
        )
        
        conn.commit()
        return jsonify({'message': 'Member removed successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Message Management
@team_collab_bp.route('/api/messages/channel/<int:channel_id>', methods=['GET'])
@login_required
def get_channel_messages(channel_id):
    limit = request.args.get('limit', 50)
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        # Verify user has access to channel by checking team membership
        channel = conn.execute('''
            SELECT c.*, t.id as team_id 
            FROM channels c 
            JOIN teams t ON c.team_id = t.id 
            WHERE c.id = ?
        ''', (channel_id,)).fetchone()
        
        if not channel:
            return jsonify({'error': 'Channel not found'}), 404
        
        # Check if user is a member of the team that owns the channel
        team_member = conn.execute('''
            SELECT * FROM team_members WHERE team_id = ? AND user_id = ?
        ''', (channel['team_id'], user_id)).fetchone()
        
        if not team_member:
            return jsonify({'error': 'Access denied'}), 403
        
        messages = conn.execute('''
            SELECT m.*, u.full_name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.channel_id = ?
            ORDER BY m.created_at DESC
            LIMIT ?
        ''', (channel_id, limit)).fetchall()
        
        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg['id'],
                'sender_id': msg['sender_id'],
                'sender_name': msg['sender_name'],
                'message_text': msg['message_text'],
                'message_type': msg['message_type'],
                'created_at': msg['created_at']
            })
        
        return jsonify({'messages': message_list})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@team_collab_bp.route('/api/messages/direct/<int:recipient_id>', methods=['GET'])
@login_required
def get_direct_messages(recipient_id):
    limit = request.args.get('limit', 50)
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        messages = conn.execute('''
            SELECT m.*, u.full_name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.recipient_id = ?) 
               OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY m.created_at ASC
            LIMIT ?
        ''', (user_id, recipient_id, recipient_id, user_id, limit)).fetchall()
        
        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg['id'],
                'sender_id': msg['sender_id'],
                'sender_name': msg['sender_name'],
                'message_text': msg['message_text'],
                'message_type': msg['message_type'],
                'created_at': msg['created_at'],
                'is_outgoing': msg['sender_id'] == user_id
            })
        
        return jsonify({'messages': message_list})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@team_collab_bp.route('/api/messages', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    user_id = get_current_user_id()
    
    required_fields = ['message_text']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    try:
        # If it's a channel message, verify the user has access to the channel
        if data.get('channel_id'):
            channel = conn.execute('''
                SELECT c.*, t.id as team_id 
                FROM channels c 
                JOIN teams t ON c.team_id = t.id 
                WHERE c.id = ?
            ''', (data.get('channel_id'),)).fetchone()
            
            if channel:
                team_member = conn.execute('''
                    SELECT * FROM team_members WHERE team_id = ? AND user_id = ?
                ''', (channel['team_id'], user_id)).fetchone()
                
                if not team_member:
                    return jsonify({'error': 'Access denied'}), 403
        
        cursor = conn.execute('''
            INSERT INTO messages (channel_id, sender_id, recipient_id, message_text, message_type)
            VALUES (?, ?, ?, ?, ?)
        ''', (data.get('channel_id'), user_id, data.get('recipient_id'), 
              data['message_text'], data.get('message_type', 'text')))
        
        message_id = cursor.lastrowid
        conn.commit()
        
        # Get the complete message for response
        message = conn.execute('''
            SELECT m.*, u.full_name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        ''', (message_id,)).fetchone()
        
        return jsonify({
            'message': {
                'id': message['id'],
                'sender_id': message['sender_id'],
                'sender_name': message['sender_name'],
                'message_text': message['message_text'],
                'message_type': message['message_type'],
                'created_at': message['created_at']
            }
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get user's teams and channels
@team_collab_bp.route('/api/user/teams', methods=['GET'])
@login_required
def get_user_teams():
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        teams = conn.execute('''
            SELECT t.*, tm.role
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = ?
        ''', (user_id,)).fetchall()
        
        team_list = []
        for team in teams:
            # Get channels for this team
            channels = conn.execute('''
                SELECT c.* FROM channels c
                WHERE c.team_id = ?
            ''', (team['id'],)).fetchall()
            
            # Get team members
            members = conn.execute('''
                SELECT u.id, u.full_name, u.email, tm.role
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = ?
            ''', (team['id'],)).fetchall()
            
            team_list.append({
                'id': team['id'],
                'name': team['name'],
                'description': team['description'],
                'role': team['role'],
                'channels': [dict(channel) for channel in channels],
                'members': [dict(member) for member in members]
            })
        
        return jsonify({'teams': team_list})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get user info for current user
@team_collab_bp.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    user_id = get_current_user_id()
    
    conn = get_db_connection()
    try:
        user = conn.execute('''
            SELECT id, email, full_name, created_at, cellphone_number, Plan_Mode
            FROM users WHERE id = ?
        ''', (user_id,)).fetchone()
        
        if user:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'created_at': user['created_at'],
                    'cellphone_number': user['cellphone_number'],
                    'plan_mode': user['Plan_Mode']
                }
            })
        else:
            return jsonify({'authenticated': False}), 404
            
    except Exception as e:
        return jsonify({'error': str(e), 'authenticated': False}), 500
    finally:
        conn.close()

