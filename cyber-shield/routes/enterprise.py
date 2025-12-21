from flask import Blueprint, jsonify, request, session
import sqlite3
import os
from datetime import datetime

enterprise_bp = Blueprint('enterprise', __name__)

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

@enterprise_bp.route('/api/enterprise/verify', methods=['POST'])
def verify_enterprise():
    """Verify enterprise access and store company name"""
    try:
        data = request.get_json()
        company_name = data.get('company_name', '').strip()
        verification_code = data.get('verification_code', '').strip()
        
        if not company_name:
            return jsonify({'error': 'Company name is required'}), 400
        
        # Store company name in session
        session['company_name'] = company_name
        session['enterprise_verified'] = True
        
        return jsonify({
            'success': True,
            'message': 'Enterprise verification successful',
            'company_name': company_name
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enterprise_bp.route('/api/enterprise/dashboard-data')
def get_dashboard_data():
    """Get enterprise dashboard data"""
    if not session.get('enterprise_verified'):
        return jsonify({'error': 'Enterprise access not verified'}), 403
    
    # Mock data for demonstration - in real app, fetch from database
    dashboard_data = {
        'company_name': session.get('company_name', 'Enterprise'),
        'stats': {
            'total_scans_today': 12482,
            'threats_found': 1128,
            'active_users': 2013,
            'workspaces': 18
        },
        'recent_threats': [
            {
                'id': 1,
                'title': 'Phishing kit distributed via zip',
                'severity': 'High',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 2,
                'title': 'Malware PE detected',
                'severity': 'Critical', 
                'timestamp': datetime.now().isoformat()
            }
        ]
    }
    
    return jsonify(dashboard_data)

@enterprise_bp.route('/api/enterprise/team-members')
def get_team_members():
    """Get team members for the enterprise"""
    if not session.get('enterprise_verified'):
        return jsonify({'error': 'Enterprise access not verified'}), 403
    
    # Mock team data
    team_members = [
        {'id': 1, 'name': 'Aisha M.', 'email': 'aisha@company.com', 'role': 'Admin'},
        {'id': 2, 'name': 'Thabo N.', 'email': 'thabo@company.com', 'role': 'Analyst'},
        {'id': 3, 'name': 'Lerato M.', 'email': 'lerato@company.com', 'role': 'Developer'}
    ]
    
    return jsonify(team_members)

@enterprise_bp.route('/api/enterprise/brand-reputation', methods=['POST'])
def check_brand_reputation():
    """Check brand reputation for a domain"""
    if not session.get('enterprise_verified'):
        return jsonify({'error': 'Enterprise access not verified'}), 403
    
    data = request.get_json()
    domain = data.get('domain', '').strip()
    
    if not domain:
        return jsonify({'error': 'Domain is required'}), 400
    
    # Mock brand reputation check
    reputation_data = {
        'domain': domain,
        'reputation_score': 85,
        'status': 'Good',
        'threats_found': 2,
        'recommendations': ['Monitor for phishing attempts', 'Enable DMARC']
    }
    
    return jsonify(reputation_data)

