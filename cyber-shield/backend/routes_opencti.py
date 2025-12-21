"""
OpenCTI API Routes
Advanced threat intelligence integration endpoints
"""

from flask import Blueprint, request, jsonify
from backend.opencti_service import get_opencti_service
from backend.ioc_detector import AlertClassifier
import json


bp = Blueprint('opencti', __name__, url_prefix='/api/opencti')


@bp.route('/status', methods=['GET'])
def get_status():
    """Get OpenCTI connection status"""
    service = get_opencti_service()
    status = service.get_status()
    return jsonify(status)


@bp.route('/indicators/search', methods=['POST'])
def search_indicators():
    """Search for indicators in OpenCTI"""
    data = request.json or {}
    search = data.get('search', '')
    indicator_types = data.get('types', None)
    limit = data.get('limit', 50)
    
    service = get_opencti_service()
    indicator_types = data.get('indicator_types') or None
    result = service.search_indicators(search=search, indicator_types=indicator_types, limit=limit)
    
    return jsonify(result)


@bp.route('/indicators/<indicator_id>', methods=['GET'])
def get_indicator(indicator_id):
    """Get indicator details"""
    service = get_opencti_service()
    result = service.get_indicator(indicator_id)
    return jsonify(result)


@bp.route('/indicators/create', methods=['POST'])
def create_indicator():
    """Create a new indicator"""
    data = request.json or {}
    
    pattern = data.get('pattern')
    name = data.get('name')
    
    if not pattern or not name:
        return jsonify({'success': False, 'error': 'Pattern and name are required'}), 400
    
    service = get_opencti_service()
    result = service.create_indicator(
        pattern=pattern,
        name=name,
        description=data.get('description', ''),
        indicator_type=data.get('type', 'stix'),
        valid_from=data.get('valid_from'),
        valid_until=data.get('valid_until'),
        confidence=data.get('confidence', 50),
        labels=data.get('labels', []),
        external_references=data.get('external_references', [])
    )
    
    return jsonify(result)


@bp.route('/observables/create', methods=['POST'])
def create_observable():
    """Create an observable"""
    data = request.json or {}
    
    obs_type = data.get('type')
    value = data.get('value')
    
    if not obs_type or not value:
        return jsonify({'success': False, 'error': 'Type and value are required'}), 400
    
    service = get_opencti_service()
    result = service.create_observable(
        type=obs_type,
        value=value,
        description=data.get('description', ''),
        labels=data.get('labels', [])
    )
    
    return jsonify(result)


@bp.route('/observables/<observable_id>/enrich', methods=['POST'])
def enrich_observable(observable_id):
    """Trigger enrichment for an observable"""
    service = get_opencti_service()
    result = service.enrich_observable(observable_id)
    return jsonify(result)


@bp.route('/attack-patterns/search', methods=['POST'])
def search_attack_patterns():
    """Search MITRE ATT&CK patterns"""
    data = request.json or {}
    search = data.get('search', '')
    limit = data.get('limit', 50)
    
    service = get_opencti_service()
    result = service.search_attack_patterns(search=search, limit=limit)
    
    return jsonify(result)


@bp.route('/attack-patterns/<pattern_id>', methods=['GET'])
def get_attack_pattern(pattern_id):
    """Get MITRE ATT&CK pattern details"""
    service = get_opencti_service()
    result = service.get_attack_pattern(pattern_id)
    return jsonify(result)


@bp.route('/threat-actors/search', methods=['POST'])
def search_threat_actors():
    """Search for threat actors"""
    data = request.json or {}
    search = data.get('search', '')
    limit = data.get('limit', 50)
    
    service = get_opencti_service()
    result = service.search_threat_actors(search=search, limit=limit)
    
    return jsonify(result)


@bp.route('/incidents/create', methods=['POST'])
def create_incident():
    """Create a security incident"""
    data = request.json or {}
    
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'success': False, 'error': 'Name is required'}), 400
    
    service = get_opencti_service()
    result = service.create_incident(
        name=name,
        description=description,
        severity=data.get('severity', 'medium'),
        incident_type=data.get('type', 'alert'),
        first_seen=data.get('first_seen'),
        last_seen=data.get('last_seen'),
        confidence=data.get('confidence', 50),
        labels=data.get('labels', [])
    )
    
    return jsonify(result)


@bp.route('/stix/import', methods=['POST'])
def import_stix_bundle():
    """Import a STIX bundle"""
    data = request.json or {}
    
    if 'bundle' not in data:
        return jsonify({'success': False, 'error': 'STIX bundle is required'}), 400
    
    service = get_opencti_service()
    result = service.submit_stix_bundle(data['bundle'])
    
    return jsonify(result)


@bp.route('/stix/export/<entity_id>', methods=['GET'])
def export_stix_bundle(entity_id):
    """Export an entity as STIX bundle"""
    service = get_opencti_service()
    result = service.export_stix_bundle(entity_id)
    return jsonify(result)


@bp.route('/alerts/submit', methods=['POST'])
def submit_alert():
    """Submit an alert to OpenCTI (creates incident + observables)"""
    data = request.json or {}
    
    if 'alert_id' not in data:
        return jsonify({'success': False, 'error': 'Alert ID is required'}), 400
    
    # Import here to avoid circular dependency
    from backend.routes_alerts import get_alert_by_id
    
    alert = get_alert_by_id(data['alert_id'])
    if not alert:
        return jsonify({'success': False, 'error': 'Alert not found'}), 404
    
    # Classify alert to extract IOCs
    classifier = AlertClassifier()
    classification = classifier.classify_alert(alert)
    
    # Prepare alert data for OpenCTI
    alert_data = {
        'title': alert.get('title', 'SOC Alert'),
        'description': alert.get('description', ''),
        'severity': alert.get('severity', 'medium'),
        'confidence': classification.get('confidence', 50),
        'tags': alert.get('tags', []),
        'iocs': classification.get('iocs', {})
    }
    
    service = get_opencti_service()
    result = service.submit_alert(alert_data)
    
    # If successful, tag the alert
    if result.get('success'):
        from backend.routes_alerts import add_tag_to_alert
        add_tag_to_alert(data['alert_id'], 'opencti_submitted')
    
    return jsonify(result)


@bp.route('/alerts/bulk-submit', methods=['POST'])
def bulk_submit_alerts():
    """Submit multiple alerts to OpenCTI"""
    data = request.json or {}
    alert_ids = data.get('alert_ids', [])
    
    if not alert_ids:
        return jsonify({'success': False, 'error': 'No alert IDs provided'}), 400
    
    results = []
    success_count = 0
    fail_count = 0
    
    for alert_id in alert_ids:
        try:
            # Import here to avoid circular dependency
            from backend.routes_alerts import get_alert_by_id, add_tag_to_alert
            
            alert = get_alert_by_id(alert_id)
            if not alert:
                results.append({
                    'alert_id': alert_id,
                    'success': False,
                    'error': 'Alert not found'
                })
                fail_count += 1
                continue
            
            # Classify alert
            classifier = AlertClassifier()
            classification = classifier.classify_alert(alert)
            
            # Submit to OpenCTI
            alert_data = {
                'title': alert.get('title', 'SOC Alert'),
                'description': alert.get('description', ''),
                'severity': alert.get('severity', 'medium'),
                'confidence': classification.get('confidence', 50),
                'tags': alert.get('tags', []),
                'iocs': classification.get('iocs', {})
            }
            
            service = get_opencti_service()
            result = service.submit_alert(alert_data)
            
            if result.get('success'):
                add_tag_to_alert(alert_id, 'opencti_submitted')
                success_count += 1
            else:
                fail_count += 1
            
            results.append({
                'alert_id': alert_id,
                **result
            })
            
        except Exception as e:
            results.append({
                'alert_id': alert_id,
                'success': False,
                'error': str(e)
            })
            fail_count += 1
    
    return jsonify({
        'success': True,
        'total': len(alert_ids),
        'success_count': success_count,
        'fail_count': fail_count,
        'results': results
    })
