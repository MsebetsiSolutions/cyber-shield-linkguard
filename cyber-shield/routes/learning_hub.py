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
    """Get all courses - returns individual course/lesson entries or grouped by title"""
    try:
        # Check if grouping is requested
        group_by_title = request.args.get('grouped', 'false').lower() == 'true'
        
        # Connect to database and fetch courses
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Fetch all courses with all fields, ordered by title, week, day for grouping
        cursor.execute('''
            SELECT id, title, lesson_title, description, full_description, category, duration, 
                   instructor, image, youtube_url, intro_stakes, intro_reflection,
                   sections_json, activities_json, lessons_json, status, students, 
                   rating, created_at, updated_at, completions, week, day,
                   objectives_json, case_studies_json, resources_json, additional_links_json
            FROM course
            ORDER BY title, week, day
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries with ALL fields
        courses = []
        for row in rows:
            courses.append({
                'id': row[0],
                'title': row[1],
                'lesson_title': row[2],
                'description': row[3],
                'full_description': row[4],
                'category': row[5],
                'duration': row[6],
                'instructor': row[7],
                'image': row[8],
                'youtube_url': row[9],
                'intro_stakes': row[10],
                'intro_reflection': row[11],
                'sections_json': row[12],
                'activities_json': row[13],
                'lessons_json': row[14],
                'status': row[15],
                'students': row[16] or 0,
                'rating': row[17] or 0.0,
                'created_at': row[18],
                'updated_at': row[19],
                'completions': row[20] or 0,
                'week': row[21],
                'day': row[22],
                'objectives_json': row[23],
                'case_studies_json': row[24],
                'resources_json': row[25],
                'additional_links_json': row[26]
            })
        
        # If grouping is requested, group courses by title
        if group_by_title:
            grouped_courses = {}
            
            for course in courses:
                title = course['title']
                
                if title not in grouped_courses:
                    # Create course group with first entry's metadata
                    grouped_courses[title] = {
                        'id': course['id'],  # Use first lesson's ID
                        'title': title,
                        'description': course['description'],
                        'full_description': course['full_description'],
                        'category': course['category'],
                        'instructor': course['instructor'],
                        'image': course['image'],
                        'students': course['students'],
                        'rating': course['rating'],
                        'status': course['status'],
                        'created_at': course['created_at'],
                        'updated_at': course['updated_at'],
                        'lessons': [],
                        'total_duration': 0
                    }
                
                # Add lesson to group
                grouped_courses[title]['lessons'].append({
                    'id': course['id'],
                    'week': course['week'],
                    'day': course['day'],
                    'lesson_title': course['lesson_title'],
                    'duration': course['duration'],
                    'youtube_url': course['youtube_url'],
                    'intro_stakes': course['intro_stakes'],
                    'intro_reflection': course['intro_reflection'],
                    'sections_json': course['sections_json'],
                    'activities_json': course['activities_json'],
                    'objectives_json': course['objectives_json'],
                    'case_studies_json': course['case_studies_json'],
                    'resources_json': course['resources_json'],
                    'additional_links_json': course['additional_links_json']
                })
                grouped_courses[title]['total_duration'] += course['duration']
            
            # Convert to list and add computed fields
            result = []
            for course_data in grouped_courses.values():
                course_data['duration'] = course_data['total_duration']
                course_data['total_lessons'] = len(course_data['lessons'])
                result.append(course_data)
            
            print(f"Grouped {len(courses)} course entries into {len(result)} courses")
            
            return jsonify({
                'success': True,
                'courses': result,
                'count': len(result),
                'grouped': True
            }), 200
        
        # Return ungrouped courses (default)
        return jsonify({
            'success': True,
            'courses': courses,
            'count': len(courses),
            'grouped': False
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500


@learning_hub_bp.route('/courses/upload', methods=['POST'])
def upload_course():
    """Upload a new course - receives and stores all form fields"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Log all received fields for debugging
        print("=" * 80)
        print("COURSE UPLOAD - Received data:")
        print(f"  Course Title: {data.get('title')}")
        print(f"  Lesson Title: {data.get('lesson_title')}")
        print(f"  Week: {data.get('week')}")
        print(f"  Day: {data.get('day')}")
        print(f"  Category: {data.get('category')}")
        print(f"  Duration: {data.get('duration')} hours")
        print(f"  Instructor: {data.get('instructor')}")
        print(f"  Image URL: {data.get('image', 'default')}")
        print(f"  YouTube URL: {data.get('youtube_url', 'none')}")
        print(f"  Introduction Stakes: {'yes' if data.get('intro_stakes') else 'no'}")
        print(f"  Introduction Reflection: {'yes' if data.get('intro_reflection') else 'no'}")
        print(f"  Lessons JSON length: {len(data.get('lessons_json', '[]'))} chars")
        print(f"  Sections JSON length: {len(data.get('sections_json', '[]'))} chars")
        print(f"  Activities JSON length: {len(data.get('activities_json', '[]'))} chars")
        print(f"  Objectives JSON length: {len(data.get('objectives_json', '[]'))} chars")
        print(f"  Case Studies JSON length: {len(data.get('case_studies_json', '[]'))} chars")
        print(f"  Resources JSON length: {len(data.get('resources_json', '[]'))} chars")
        print(f"  Additional Links JSON length: {len(data.get('additional_links_json', '[]'))} chars")
        print(f"  Status: {data.get('status', 'draft')}")
        print("=" * 80)
        
        # Validate required fields
        required_fields = ['title', 'category', 'duration', 'instructor']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Check if lesson_title column exists, if not add it
        try:
            cursor.execute("SELECT lesson_title FROM course LIMIT 1")
        except sqlite3.OperationalError:
            # Column doesn't exist, add it
            print("Adding lesson_title column to course table...")
            cursor.execute("ALTER TABLE course ADD COLUMN lesson_title TEXT")
            conn.commit()
        
        # Check if a course with the same title, week, and day already exists
        cursor.execute('''
            SELECT id FROM course 
            WHERE title = ? AND week = ? AND day = ? 
            LIMIT 1
        ''', (data.get('title'), data.get('week'), data.get('day')))
        
        existing_course = cursor.fetchone()
        
        if existing_course:
            # Exact match exists (same title, week, day) - update it
            existing_course_id = existing_course[0]
            
            print(f"→ Found existing course entry: {data.get('title')} - Week {data.get('week')}, Day {data.get('day')}")
            print(f"→ Updating existing lesson...")
            
            # Update the existing course entry
            cursor.execute('''
                UPDATE course SET
                    lesson_title = ?,
                    description = ?,
                    full_description = ?,
                    category = ?,
                    duration = ?,
                    instructor = ?,
                    image = ?,
                    youtube_url = ?,
                    intro_stakes = ?,
                    intro_reflection = ?,
                    sections_json = ?,
                    activities_json = ?,
                    lessons_json = ?,
                    status = ?,
                    updated_at = ?,
                    objectives_json = ?,
                    case_studies_json = ?,
                    resources_json = ?,
                    additional_links_json = ?
                WHERE id = ?
            ''', (
                data.get('lesson_title', data.get('title', '')),
                data.get('description', data.get('title', '')),
                data.get('full_description', data.get('description', data.get('title', ''))),
                data.get('category'),
                data.get('duration'),
                data.get('instructor'),
                data.get('image', ''),
                data.get('youtube_url', ''),
                data.get('intro_stakes', ''),
                data.get('intro_reflection', ''),
                data.get('sections_json', '[]'),
                data.get('activities_json', '[]'),
                data.get('lessons_json', '[]'),
                data.get('status', 'draft'),
                datetime.now().isoformat(),
                data.get('objectives_json', '[]'),
                data.get('case_studies_json', '[]'),
                data.get('resources_json', '[]'),
                data.get('additional_links_json', '[]'),
                existing_course_id
            ))
            
            conn.commit()
            conn.close()
            
            print(f"✓ Lesson updated successfully!")
            print(f"  Course ID: {existing_course_id}")
            print(f"  Course Title: {data.get('title')}")
            print(f"  Week {data.get('week')}, Day {data.get('day')}")
            print("=" * 80)
            
            return jsonify({
                'success': True,
                'message': 'Lesson updated successfully',
                'course_id': existing_course_id,
                'action': 'lesson_updated'
            }), 200
        
        else:
            # Check how many lessons exist for this course title
            cursor.execute('SELECT COUNT(*) FROM course WHERE title = ?', (data.get('title'),))
            existing_count = cursor.fetchone()[0]
            
            if existing_count > 0:
                print(f"→ Adding new lesson to course series: {data.get('title')}")
                print(f"→ Creating lesson entry for Week {data.get('week')}, Day {data.get('day')}")
                print(f"→ Existing lessons in series: {existing_count}")
            else:
                print(f"→ Creating new course: {data.get('title')}")
            
            # Prepare all field values with defaults
            course_data = {
                'id': data.get('id'),
                'title': data.get('title'),
                'lesson_title': data.get('lesson_title', data.get('title', '')),
                'description': data.get('description', data.get('title', '')),
                'full_description': data.get('full_description', data.get('description', data.get('title', ''))),
                'category': data.get('category'),
                'duration': data.get('duration'),
                'instructor': data.get('instructor'),
                'image': data.get('image', ''),
                'youtube_url': data.get('youtube_url', ''),
                'intro_stakes': data.get('intro_stakes', ''),
                'intro_reflection': data.get('intro_reflection', ''),
                'sections_json': data.get('sections_json', '[]'),
                'activities_json': data.get('activities_json', '[]'),
                'lessons_json': data.get('lessons_json', '[]'),
                'status': data.get('status', 'draft'),
                'students': data.get('students', 0),
                'rating': data.get('rating', 0.0),
                'created_at': data.get('created_at', datetime.now().isoformat()),
                'updated_at': data.get('updated_at', datetime.now().isoformat()),
                'completions': data.get('completions', 0),
                'week': data.get('week'),
                'day': data.get('day'),
                'objectives_json': data.get('objectives_json', '[]'),
                'case_studies_json': data.get('case_studies_json', '[]'),
                'resources_json': data.get('resources_json', '[]'),
                'additional_links_json': data.get('additional_links_json', '[]')
            }
            
            # Insert NEW course with ALL fields from the upload form
            cursor.execute('''
                INSERT INTO course (
                    id, title, lesson_title, description, full_description, category, duration,
                    instructor, image, youtube_url, intro_stakes, intro_reflection,
                    sections_json, activities_json, lessons_json, status, students,
                    rating, created_at, updated_at, completions, week, day,
                    objectives_json, case_studies_json, resources_json, additional_links_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                course_data['id'],
                course_data['title'],
                course_data['lesson_title'],
                course_data['description'],
                course_data['full_description'],
                course_data['category'],
                course_data['duration'],
                course_data['instructor'],
                course_data['image'],
                course_data['youtube_url'],
                course_data['intro_stakes'],
                course_data['intro_reflection'],
                course_data['sections_json'],
                course_data['activities_json'],
                course_data['lessons_json'],
                course_data['status'],
                course_data['students'],
                course_data['rating'],
                course_data['created_at'],
                course_data['updated_at'],
                course_data['completions'],
                course_data['week'],
                course_data['day'],
                course_data['objectives_json'],
                course_data['case_studies_json'],
                course_data['resources_json'],
                course_data['additional_links_json']
            ))
            
            conn.commit()
            course_id = cursor.lastrowid if cursor.lastrowid else course_data['id']
            
            # Check total lessons in series before closing connection
            cursor.execute('SELECT COUNT(*) FROM course WHERE title = ?', (course_data['title'],))
            total_in_series = cursor.fetchone()[0]
            
            conn.close()
            
            is_new_lesson = existing_count > 0
            
            print(f"✓ {'New lesson added to course series' if is_new_lesson else 'New course created'} successfully!")
            print(f"  Course ID: {course_id}")
            print(f"  Title: {course_data['title']}")
            print(f"  Week/Day: {course_data['week']}/{course_data['day']}")
            if is_new_lesson:
                print(f"  Total lessons in series: {total_in_series}")
            print(f"  All {len(course_data)} fields stored in database")
            print("=" * 80)
            
            return jsonify({
                'success': True,
                'message': 'Lesson added to course successfully' if is_new_lesson else 'Course uploaded successfully',
                'course_id': course_id,
                'action': 'lesson_added' if is_new_lesson else 'course_created',
                'total_lessons': total_in_series if is_new_lesson else 1
            }), 201
        
    except sqlite3.IntegrityError as e:
        print(f"Database integrity error: {str(e)}")
        return jsonify({'error': 'Course with this ID already exists or invalid data'}), 409
    except sqlite3.Error as e:
        print(f"Database error in upload_course: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in upload_course: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@learning_hub_bp.route('/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get a single course/lesson by ID"""
    try:
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Fetch course with all fields
        cursor.execute('''
            SELECT id, title, lesson_title, description, full_description, category, duration, 
                   instructor, image, youtube_url, intro_stakes, intro_reflection,
                   sections_json, activities_json, lessons_json, status, students, 
                   rating, created_at, updated_at, completions, week, day,
                   objectives_json, case_studies_json, resources_json, additional_links_json
            FROM course
            WHERE id = ?
        ''', (course_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'error': 'Course not found'}), 404
        
        course = {
            'id': row[0],
            'title': row[1],
            'lesson_title': row[2],
            'description': row[3],
            'full_description': row[4],
            'category': row[5],
            'duration': row[6],
            'instructor': row[7],
            'image': row[8],
            'youtube_url': row[9],
            'intro_stakes': row[10],
            'intro_reflection': row[11],
            'sections_json': row[12],
            'activities_json': row[13],
            'lessons_json': row[14],
            'status': row[15],
            'students': row[16] or 0,
            'rating': row[17] or 0.0,
            'created_at': row[18],
            'updated_at': row[19],
            'completions': row[20] or 0,
            'week': row[21],
            'day': row[22],
            'objectives_json': row[23],
            'case_studies_json': row[24],
            'resources_json': row[25],
            'additional_links_json': row[26]
        }
        
        return jsonify({
            'success': True,
            'course': course
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500

@learning_hub_bp.route('/courses/<course_id>', methods=['PUT'])
def update_course(course_id):
    """Update an existing course"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Check if course exists
        cursor.execute('SELECT id FROM course WHERE id = ?', (course_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Course not found'}), 404
        
        # Update course with ALL fields from the form
        cursor.execute('''
            UPDATE course SET
                title = ?,
                lesson_title = ?,
                description = ?,
                full_description = ?,
                category = ?,
                duration = ?,
                instructor = ?,
                image = ?,
                youtube_url = ?,
                intro_stakes = ?,
                intro_reflection = ?,
                sections_json = ?,
                activities_json = ?,
                lessons_json = ?,
                status = ?,
                updated_at = ?,
                week = ?,
                day = ?,
                objectives_json = ?,
                case_studies_json = ?,
                resources_json = ?,
                additional_links_json = ?
            WHERE id = ?
        ''', (
            data.get('title'),
            data.get('lesson_title', data.get('title', '')),
            data.get('description'),
            data.get('full_description'),
            data.get('category'),
            data.get('duration'),
            data.get('instructor'),
            data.get('image'),
            data.get('youtube_url'),
            data.get('intro_stakes'),
            data.get('intro_reflection'),
            data.get('sections_json', '[]'),
            data.get('activities_json', '[]'),
            data.get('lessons_json', '[]'),
            data.get('status', 'draft'),
            datetime.now().isoformat(),
            data.get('week'),
            data.get('day'),
            data.get('objectives_json', '[]'),
            data.get('case_studies_json', '[]'),
            data.get('resources_json', '[]'),
            data.get('additional_links_json', '[]'),
            course_id
        ))
        
        conn.commit()
        conn.close()
        
        print(f"Course updated successfully: ID {course_id}")
        
        return jsonify({
            'success': True,
            'message': 'Course updated successfully'
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error in update_course: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in update_course: {str(e)}")
        return jsonify({'error': 'An error occurred'}), 500


@learning_hub_bp.route('/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete a course"""
    try:
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Check if course exists
        cursor.execute('SELECT id FROM course WHERE id = ?', (course_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Course not found'}), 404
        
        # Delete course
        cursor.execute('DELETE FROM course WHERE id = ?', (course_id,))
        conn.commit()
        conn.close()
        
        print(f"Course deleted successfully: ID {course_id}")
        
        return jsonify({
            'success': True,
            'message': 'Course deleted successfully'
        }), 200
        
    except sqlite3.Error as e:
        print(f"Database error in delete_course: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"Error in delete_course: {str(e)}")
        return jsonify({'error': 'An error occurred'}), 500
        