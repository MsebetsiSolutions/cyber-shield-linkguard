from flask import Blueprint, request, jsonify
import io
import os
from datetime import datetime

phishing_replica_bp = Blueprint('phishing_replica', __name__)

@phishing_replica_bp.route('/api/phishing-replica/certificate', methods=['POST'])
def generate_certificate():
    """
    Generate a simple text certificate (PDF generation disabled)
    """
    try:
        data = request.get_json()
        user_name = data.get('user_name', 'Security Trainee')
        score = data.get('score', 10)
        completion_date = data.get('completion_date', datetime.now().strftime('%Y-%m-%d'))
        
        # Create a simple text certificate instead of PDF
        certificate_content = f"""
CYBER SECURITY AWARENESS CERTIFICATE

This certifies that {user_name} has successfully completed the
Phishing Detection and Cybersecurity Awareness Training Program.

Training Score: {score}/10 Points
Completion Date: {completion_date}
Certificate ID: CSLG-{datetime.now().strftime('%Y%m%d%H%M%S')}

Skills Demonstrated:
✓ Phishing Email Identification
✓ Suspicious Link Analysis
✓ QR Code Security Assessment
✓ Malicious Attachment Detection
✓ Social Engineering Recognition
✓ Secure Browsing Practices

This certificate acknowledges the commitment to cybersecurity awareness
and the development of essential skills to protect against digital threats
in today's interconnected world.

Cyber Shield LinkGuard
Msebetsi Solutions Pty Ltd
"""
        
        # Return as plain text
        return jsonify({
            'status': 'success',
            'certificate_content': certificate_content,
            'user_name': user_name,
            'score': score,
            'completion_date': completion_date,
            'message': 'Certificate generated successfully (PDF generation unavailable)'
        })
        
    except Exception as e:
        print(f"Certificate generation error: {e}")
        return jsonify({'error': 'Failed to generate certificate'}), 500

@phishing_replica_bp.route('/api/phishing-replica/instructions', methods=['GET'])
def download_instructions():
    """
    Download simple text instructions (PDF generation disabled)
    """
    try:
        instructions_content = """
Phishing Detection Guide & Best Practices

This guide provides comprehensive instructions for identifying and
protecting against various types of phishing attacks.

1. Email Phishing Detection
• Check the sender's email address carefully
• Look for spelling and grammar mistakes
• Hover over links to see the actual URL
• Be wary of urgent or threatening language
• Verify unexpected attachments before opening
• Contact the organization directly if unsure

2. QR Code Security
• Only scan QR codes from trusted sources
• Check the URL preview before proceeding
• Use a QR scanner with security features
• Be cautious of QR codes in public places
• Verify the destination website is legitimate

3. General Security Best Practices
• Enable two-factor authentication everywhere
• Use unique passwords for different accounts
• Keep software and systems updated
• Regularly review account activity
• Educate team members about security threats
• Report suspicious activity immediately

Remember: When in doubt, don't click! Always verify through
official channels before taking any action.
"""
        
        return jsonify({
            'status': 'success',
            'instructions_content': instructions_content,
            'message': 'Instructions available (PDF generation unavailable)'
        })
        
    except Exception as e:
        print(f"Instructions generation error: {e}")
        return jsonify({'error': 'Failed to generate instructions'}), 500

@phishing_replica_bp.route('/api/phishing-replica/submit-score', methods=['POST'])
def submit_score():
    """
    Submit user score and progress for the phishing detection training
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        score = data.get('score', 0)
        completed_modules = data.get('completed_modules', [])
        total_time = data.get('total_time', 0)  # in minutes
        
        response_data = {
            'status': 'success',
            'score': score,
            'completed_modules': completed_modules,
            'total_time': total_time,
            'certificate_eligible': score >= 8
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Score submission error: {e}")
        return jsonify({'error': 'Failed to submit score'}), 500
