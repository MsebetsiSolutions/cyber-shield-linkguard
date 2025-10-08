from flask import Blueprint, jsonify, request
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
        data = request.get_json()
        to_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html_content')
        email_type = data.get('type')
        
        if not to_email:
            return jsonify({'error': 'Recipient email is required'}), 400
        
        
        try:
            ms = MailerSendClient()

            email = (EmailBuilder().from_email('test@test-ywj2lpnwmmqg7oqz.mlsender.net', 'Test User').to(to_email)).subject(subject).html(html_content).build()

            print(f'Email content {email}')
            response = ms.emails.send(email)

            if response.status_code == 202:
                print("Email sent successfully!")
                return jsonify({'status': 'success',
                                'message': 'Email sent successfully'}), 200
            else:
                print(f"Failed to send email. Status code: {response.status_code}")
                print(f"Response: {response.text if hasattr(response, 'text') else 'No response text'}")
                return jsonify({'status': 'error',
                                'message': 'Failed to send email'}), 500
            
        except Exception as e:
            print(f'Email send error: {e}')   
        response = {
            'status': 'success',
            'message': 'Training email sent successfully',
            'email_id': f"train_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'sent_to': to_email,
            'sent_at': datetime.now().isoformat(),
            'type': email_type
        }
        return jsonify(response)
    except Exception as e:
        print(f'Email send error: {e}')
        return jsonify({'error': 'Failed to send email'}), 500


@email_phishing_bp.route('/draft', methods=['POST'])
def save_email_draft():
    try:
        data = request.get_json() or {}
        from_email = data.get('from') or data.get('sender_email') or ''
        to_email = data.get('to') or data.get('recipient_email') or ''
        subject = data.get('subject') or 'Training Email'
        html_content = data.get('html_content') or data.get('content') or ''
        email_type = data.get('type') or 'phishing_training'

        draft_id = f'draft_{datetime.now().strftime("%Y%m%d%H%M%S")}'

        print('Simulated draft save:')
        print(f'Draft ID: {draft_id}')
        print(f'From: {from_email}')
        print(f'To: {to_email}')

        response = {
            'status': 'success',
            'message': 'Email saved to drafts successfully',
            'draft_id': draft_id,
            'saved_at': datetime.now().isoformat(),
            'recipient': to_email,
            'subject': subject,
            'type': email_type
        }
        return jsonify(response)
    except Exception as e:
        print(f'Draft save error: {e}')
        return jsonify({'error': 'Failed to save email to drafts'}), 500