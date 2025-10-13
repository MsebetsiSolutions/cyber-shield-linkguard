import sqlite3
from flask import Blueprint, jsonify, request
from datetime import datetime

learning_hub_bp = Blueprint('learning_hub', __name__, url_prefix='/api/learning')

@learning_hub_bp.route('/course-notification', methods=['POST'])
def course_notification():
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email', '').strip()
       
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
        # Simple email validation
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Connect to database and insert notification request
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Insert the notification request
        cursor.execute('''
            INSERT INTO notify (email)
            VALUES (?)
        ''', (email,))
        
        conn.commit()
        conn.close()
        
        print(f"Course notification request saved: ID {notification_id}, Email: {email}, Course: {course_id}")
        
        return jsonify({
            'success': True,
            'message': 'Thank you! We\'ll notify you when the course is ready.'
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500

@learning_hub_bp.route('/courses', methods=['GET'])
def get_courses():
    try:
        # Connect to database and fetch courses
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Fetch all courses
        cursor.execute('''
            SELECT id, title, category, duration, level, description, content, created_at
            FROM courses
            ORDER BY created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        courses = []
        for row in rows:
            courses.append({
                'id': row[0],
                'title': row[1],
                'category': row[2],
                'duration': row[3],
                'level': row[4],
                'description': row[5],
                'content': row[6],
                'created_at': row[7]
            })
        
        return jsonify({
            'success': True,
            'courses': courses,
            'count': len(courses)
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
        