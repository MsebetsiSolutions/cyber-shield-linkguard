from flask import Blueprint, jsonify, request, session
import os
from markupsafe import escape
from datetime import datetime
from mailersend import MailerSendClient, EmailBuilder
import sqlite3

email_phishing_bp = Blueprint('email_phishing', __name__)


def load_template(filename='email-template.html'):
    """Load an email template from public/email-templates directory."""
    try:
        base = os.path.dirname(__file__)
        tmpl_path = os.path.normpath(os.path.join(base, '..', 'public', 'email-templates', filename))
        if not os.path.exists(tmpl_path):
            return None
        with open(tmpl_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error loading template {filename}: {e}")
        return None


@email_phishing_bp.route('/generate', methods=['POST'])
def generate_phishing_email():
    data = request.get_json() or {}

    # Accept multiple field name conventions
    first_name = data.get('firstname')
    last_name = data.get('lastname')
    email = data.get('email')
    company = data.get('company')
    job_title = data.get('jobtitle')
    platform = data.get('platform').lower()

    if not first_name or not last_name or not email:
        return jsonify({'error': 'Provide the required fields: firstName, lastName and email'}), 400

    
    # Load platform-specific template if available, otherwise fallback to generic
    template_html = load_template(f'{platform}-template.html')
    if not template_html:
        return jsonify({'error': 'Template not found for platform', 'platform': platform}), 404

    # Escape user-provided values
    safe_first = escape(first_name)

    # Replace simple placeholders (template currently uses [first_name])
    rendered = template_html.replace('[first_name]', safe_first)

    response_data = {
        'status': 'success',
        'sender_name': 'Security Team',
        'sender_email': f'no-reply@{platform}.com',
        'recipient_email': email,
        'subject': f'{platform.capitalize()} Security Update',
        'content': f'{platform.capitalize()} Security Alert: please review your account activity.',
        'html_content': rendered,
        'platform': platform,
        'generated_at': datetime.now().isoformat(),
        'warning': 'This is a simulated phishing email generated for cybersecurity training purposes. Never click on suspicious links in real emails.',
        'training_tips': [
            'Always verify the sender\'s email domain',
            'Hover over links to inspect URLs before clicking',
            'Look for urgent language designed to cause panic'
        ]
    }

    return jsonify(response_data), 200


@email_phishing_bp.route('/send', methods=['POST'])
def send_phishing_email():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.get_json()
        to_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html_content')
        email_type = data.get('type')

        # Extract recipient details for database storage (handle different field name formats)
        first_name = data.get('first_name') or data.get('firstname') or ''
        last_name = data.get('last_name') or data.get('lastname') or ''
        email = data.get('email') or to_email or ''
        company = data.get('company') or ''
        role = data.get('role') or data.get('jobtitle') or ''
        platform = data.get('platform') or 'generic'

        if not to_email:
            return jsonify({'error': 'Recipient email is required'}), 400
        
        
        try:
            ms = MailerSendClient()

            email_obj = (EmailBuilder().from_email('test@test-ywj2lpnwmmqg7oqz.mlsender.net', 'Test User').to(to_email)).subject(subject).html(html_content).build()

            print(f'Email content {email_obj}')
            response = ms.emails.send(email_obj)

            if response.status_code == 202:
                print("Email sent successfully!")
                
                # Store email data in database after successful send
                try:
                    user_id = session['user_id']
                    sent_at = datetime.now().isoformat()

                    conn = sqlite3.connect('cyber-shield-linkguard.db')
                    cursor = conn.cursor()

                    cursor.execute('''
                        INSERT INTO cyber_training (
                            user_id, target_name, target_surname, target_email, 
                            target_company, target_title, html_content, sent_at, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        user_id, first_name, last_name, to_email, 
                        company, role, html_content, sent_at, 'sent'
                    ))
                    
                    email_id = cursor.lastrowid  # Get the inserted email ID
                    conn.commit()
                    conn.close()
                    print(f'Email training data stored for user: {user_id} with ID: {email_id}')
                    
                except Exception as db_err:
                    print(f'Database error: {db_err}')
                    # Don't fail the email send if database storage fails

                return jsonify({'status': 'success',
                                'message': 'Email sent successfully',
                                'email_id': email_id}), 200
            else:
                print(f"Failed to send email. Status code: {response.status_code}")
                print(f"Response: {response.text if hasattr(response, 'text') else 'No response text'}")
                return jsonify({'status': 'error',
                                'message': 'Failed to send email'}), 500
            
        except Exception as e:
            print(f'Email send error: {e}')
            return jsonify({'error': 'Failed to send email'}), 500
            
    except Exception as e:
        print(f'Email send error: {e}')
        return jsonify({'error': 'Failed to send email'}), 500


@email_phishing_bp.route('/sent', methods=['GET'])
def get_sent_emails():
    """Retrieve sent training emails for the authenticated user"""
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        user_id = session['user_id']
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        conn.row_factory = sqlite3.Row  # This allows us to access columns by name
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, target_name, target_surname, target_email, 
                   target_company, target_title, html_content, sent_at
            FROM cyber_training 
            WHERE user_id = ? AND status = 'sent'
            ORDER BY sent_at DESC
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert rows to list of dictionaries
        sent_emails = []
        for row in rows:
            sent_emails.append({
                'id': row['id'],
                'target_name': row['target_name'],
                'target_surname': row['target_surname'],
                'target_email': row['target_email'],
                'target_company': row['target_company'],
                'target_title': row['target_title'],
                'html_content': row['html_content'],
                'sent_at': row['sent_at']
            })
        
        return jsonify({
            'status': 'success',
            'sent_emails': sent_emails,
            'count': len(sent_emails)
        }), 200
        
    except Exception as e:
        print(f'Error retrieving sent emails: {e}')
        return jsonify({'error': 'Failed to retrieve sent emails'}), 500


@email_phishing_bp.route('/drafts', methods=['GET'])
def get_draft_emails():
    """Retrieve draft training emails for the authenticated user"""
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        user_id = session['user_id']
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, target_name, target_surname, target_email, 
                   target_company, target_title, html_content, sent_at
            FROM cyber_training 
            WHERE user_id = ? AND status = 'draft'
            ORDER BY sent_at DESC
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert rows to list of dictionaries
        draft_emails = []
        for row in rows:
            draft_emails.append({
                'id': row['id'],
                'target_name': row['target_name'],
                'target_surname': row['target_surname'],
                'target_email': row['target_email'],
                'target_company': row['target_company'],
                'target_title': row['target_title'],
                'html_content': row['html_content'],
                'sent_at': row['sent_at']
            })
        
        return jsonify({
            'status': 'success',
            'draft_emails': draft_emails,
            'count': len(draft_emails)
        }), 200
        
    except Exception as e:
        print(f'Error retrieving draft emails: {e}')
        return jsonify({'error': 'Failed to retrieve draft emails'}), 500


@email_phishing_bp.route('/draft', methods=['POST'])
def save_email_draft():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.get_json() or {}
        from_email = data.get('from') or data.get('sender_email') or ''
        to_email = data.get('to') or data.get('recipient_email') or ''
        subject = data.get('subject') or 'Training Email Draft'
        html_content = data.get('html_content') or data.get('content') or ''
        email_type = data.get('type') or 'phishing_training'

        # Extract recipient details for database storage (handle different field name formats)
        first_name = data.get('first_name') or data.get('firstname') or ''
        last_name = data.get('last_name') or data.get('lastname') or ''
        email = data.get('email') or to_email or ''
        company = data.get('company') or ''
        role = data.get('role') or data.get('jobtitle') or ''

        # Save draft to database
        try:
            user_id = session['user_id']
            saved_at = datetime.now().isoformat()

            conn = sqlite3.connect('cyber-shield-linkguard.db')
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO cyber_training (
                    user_id, target_name, target_surname, target_email, 
                    target_company, target_title, html_content, sent_at, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, first_name, last_name, to_email, 
                company, role, html_content, saved_at, 'draft'
            ))
            
            draft_id = cursor.lastrowid
            conn.commit()
            conn.close()
            print(f'Email draft saved for user: {user_id}')
            
        except Exception as db_err:
            print(f'Database error saving draft: {db_err}')
            return jsonify({'error': 'Failed to save draft to database'}), 500

        response = {
            'status': 'success',
            'message': 'Email saved to drafts successfully',
            'draft_id': draft_id,
            'saved_at': saved_at,
            'recipient': to_email,
            'subject': subject,
            'type': email_type
        }
        return jsonify(response)
    except Exception as e:
        print(f'Draft save error: {e}')
        return jsonify({'error': 'Failed to save email to drafts'}), 500
    

@email_phishing_bp.route('/clicked', methods=['POST'])
def clicked_email():
    pass