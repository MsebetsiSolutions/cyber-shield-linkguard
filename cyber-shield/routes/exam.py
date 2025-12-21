from flask import Blueprint, request, jsonify, session, render_template, redirect, url_for
import json
import os
import sqlite3

exam_bp = Blueprint('exam', __name__, url_prefix='/exam')

# Load all questions from questions folder
QUESTIONS = {}
for week in range(1, 13):
    try:
        with open(f'questions/week{week}_questions.json') as f:
            QUESTIONS[week] = json.load(f)
        print(f"Loaded {len(QUESTIONS[week])} questions for week {week}")
    except FileNotFoundError:
        print(f"Warning: Missing questions for week {week}")
        QUESTIONS[week] = []

# User exam progress storage
user_exam_progress = {}

def init_exam_db():
    """Initialize the exam database table"""
    try:
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS exam_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                week INTEGER,
                score INTEGER,
                passed BOOLEAN,
                total_questions INTEGER,
                correct_answers INTEGER,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        print("✅ Exam database table initialized successfully")
    except Exception as e:
        print(f"❌ Error creating exam table: {e}")

# Initialize the database when the module loads
init_exam_db()

def get_user_exam_data(user_id):
    """Get or create user exam data"""
    if user_id not in user_exam_progress:
        user_exam_progress[user_id] = {
            'current_week': 1,
            'score': 0,
            'answers': [],
            'max_weeks': 12,
            'current_question': 0
        }
    return user_exam_progress[user_id]

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

@exam_bp.route('/')
def exam_dashboard():
    """Main exam dashboard - requires authentication"""
    if 'user_id' not in session:
        return redirect('/api/auth/login')
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    # Check if user has completed any exams
    user_results = []
    try:
        conn = get_db_connection()
        user_results = conn.execute(
            'SELECT week, score, passed FROM exam_results WHERE user_id = ? ORDER BY week',
            (user_id,)
        ).fetchall()
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}")
        init_exam_db()
    
    return render_template('exam_dashboard.html',
                         current_week=user_data['current_week'],
                         max_weeks=user_data['max_weeks'],
                         user_results=user_results,
                         QUESTIONS=QUESTIONS)

@exam_bp.route('/start')
def start_exam():
    """Start or continue exam"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    # Reset for new attempt
    user_data['current_question'] = 0
    user_data['score'] = 0
    user_data['answers'] = []
    
    return show_question()

def show_question():
    """Show current question"""
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    week = user_data['current_week']
    q_idx = user_data['current_question']
    
    if week in QUESTIONS and q_idx < len(QUESTIONS[week]):
        question = QUESTIONS[week][q_idx]
        return render_template('exam_question.html',
            week=week,
            question_num=q_idx+1,
            question_index=q_idx,
            question_text=question['question'],
            options=question['options'],
            total_questions=len(QUESTIONS[week])
        )
    else:
        # All questions answered, redirect to review page
        return redirect(url_for('exam.show_all_answers'))

@exam_bp.route('/answer', methods=['POST'])
def handle_answer():
    """Handle answer submission"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    week = user_data['current_week']
    q_idx = int(request.form['question_index'])
    selected = int(request.form.get('answer', 0))
    
    if selected == 0:
        # No answer selected, show same question again
        return show_question()
    
    question = QUESTIONS[week][q_idx]
    correct_answer_index = question['options'].index(question['answer'])
    is_correct = (selected - 1 == correct_answer_index)
    
    user_data['answers'].append({
        'question': question['question'],
        'selected': question['options'][selected-1],
        'correct': question['answer'],
        'is_correct': is_correct
    })
    
    if is_correct:
        user_data['score'] += 1
    
    user_data['current_question'] += 1
    
    # Check if all questions are answered
    if user_data['current_question'] >= len(QUESTIONS[week]):
        # Save results and redirect to review page
        save_exam_results(user_id, user_data, week)
        return redirect(url_for('exam.show_all_answers'))
    else:
        return show_question()

def save_exam_results(user_id, user_data, week):
    """Save exam results to database"""
    total = len(QUESTIONS.get(week, []))
    score = int((user_data['score'] / total) * 100) if total > 0 else 0
    passed = score >= 70
    
    try:
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO exam_results (user_id, week, score, passed, total_questions, correct_answers) VALUES (?, ?, ?, ?, ?, ?)',
            (user_id, week, score, passed, total, user_data['score'])
        )
        conn.commit()
        conn.close()
        print(f"✅ Exam results saved for user {user_id}, week {week}, score {score}%")
    except Exception as e:
        print(f"❌ Error saving exam results: {e}")

@exam_bp.route('/results')
def show_results_route():
    """Route to show exam results summary"""
    if 'user_id' not in session:
        return redirect('/api/auth/login')
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    week = user_data['current_week']
    total = len(QUESTIONS.get(week, []))
    score = int((user_data['score'] / total) * 100) if total > 0 else 0
    passed = score >= 70
    
    return render_template('exam_results.html',
        week=week,
        max_weeks=user_data['max_weeks'],
        score=score,
        correct=user_data['score'],
        total=total,
        passed=passed
    )

@exam_bp.route('/answers')
def show_all_answers():
    """Show answer review - this is where users go after completing exam"""
    if 'user_id' not in session:
        return redirect('/api/auth/login')
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    # Calculate score for display
    week = user_data['current_week']
    total = len(QUESTIONS.get(week, []))
    score = int((user_data['score'] / total) * 100) if total > 0 else 0
    passed = score >= 70
    
    return render_template('exam_review.html',
        answers=user_data['answers'],
        week=week,
        score=score,
        total=total,
        passed=passed,
        correct=user_data['score']
    )

@exam_bp.route('/next_week')
def next_week():
    """Move to next week"""
    if 'user_id' not in session:
        return redirect('/api/auth/login')
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    if user_data['current_week'] < user_data['max_weeks']:
        user_data['current_week'] += 1
    
    return redirect(url_for('exam.start_exam'))

@exam_bp.route('/retry_week')
def retry_week():
    """Retry current week"""
    if 'user_id' not in session:
        return redirect('/api/auth/login')
    
    return redirect(url_for('exam.start_exam'))

@exam_bp.route('/progress')
def get_progress():
    """Get user exam progress (API endpoint)"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    user_data = get_user_exam_data(user_id)
    
    return jsonify({
        'current_week': user_data['current_week'],
        'max_weeks': user_data['max_weeks'],
        'completed': user_data['current_week'] - 1
    })