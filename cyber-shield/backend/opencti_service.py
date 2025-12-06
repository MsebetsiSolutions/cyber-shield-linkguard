"""
Advanced OpenCTI Integration Service
Provides full OpenCTI platform integration using pycti library
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any

# Try to import pycti, fall back to mock mode if not available
try:
    from pycti import OpenCTIApiClient
    import stix2
    from taxii2client.v20 import Server as TAXIIServer
    PYCTI_AVAILABLE = True
except ImportError as e:
    print(f"[WARNING] pycti not available, running in mock-only mode: {e}")
    OpenCTIApiClient = None
    stix2 = None
    TAXIIServer = None
    PYCTI_AVAILABLE = False


class OpenCTIService:
    """Advanced OpenCTI service with full API integration"""
    
    def __init__(self):
        self.url = os.getenv('OPENCTI_URL', 'http://localhost:8080')
        self.api_key = os.getenv('OPENCTI_API_KEY', '')
        self.mock_mode = os.getenv('OPENCTI_MOCK', 'true').lower() == 'true'
        
        # Force mock mode if pycti is not available
        if not PYCTI_AVAILABLE:
            self.mock_mode = True
        
        self.client: Any = None
        if not self.mock_mode and self.api_key and PYCTI_AVAILABLE and OpenCTIApiClient:
            try:
                self.client = OpenCTIApiClient(self.url, self.api_key)  # type: ignore
                print(f"✓ Connected to OpenCTI at {self.url}")
            except Exception as e:
                print(f"✗ Failed to connect to OpenCTI: {e}")
                self.mock_mode = True
        else:
            print("ℹ Running in MOCK mode (set OPENCTI_URL and OPENCTI_API_KEY to enable)")
    
    def is_connected(self) -> bool:
        """Check if connected to OpenCTI"""
        if self.mock_mode:
            return False
        try:
            if self.client:
                # Test connection
                self.client.identity.list(first=1)
                return True
        except:
            pass
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get OpenCTI connection status"""
        return {
            'connected': self.is_connected(),
            'url': self.url,
            'mock_mode': self.mock_mode,
            'version': self.client.version() if self.client else None
        }
    
    # ==================== INDICATORS ====================
    
    def create_indicator(self, 
                        pattern: str,
                        name: str,
                        description: str = "",
                        indicator_type: str = "stix",
                        valid_from: Optional[str] = None,
                        valid_until: Optional[str] = None,
                        confidence: int = 50,
                        labels: Optional[List[str]] = None,
                        external_references: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Create a new indicator in OpenCTI"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'indicator_id': f"indicator--mock-{hash(pattern)}",
                'message': f"Mock: Created indicator '{name}'"
            }
        
        try:
            indicator = self.client.indicator.create(
                name=name,
                description=description,
                pattern_type=indicator_type,
                pattern=pattern,
                valid_from=valid_from or datetime.utcnow().isoformat(),
                valid_until=valid_until,
                x_opencti_score=confidence,
                createdBy=None,
                objectMarking=None,
                objectLabel=labels or [],
                externalReferences=external_references or [],
                update=True
            )
            
            return {
                'success': True,
                'indicator_id': indicator['id'],
                'indicator': indicator
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def search_indicators(self,
                         search: Optional[str] = None,
                         indicator_types: Optional[List[str]] = None,
                         limit: int = 50) -> Dict[str, Any]:
        """Search for indicators in OpenCTI"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'indicators': [
                    {
                        'id': 'indicator--mock-1',
                        'name': 'Malicious IP 192.168.1.100',
                        'pattern': '[ipv4-addr:value = "192.168.1.100"]',
                        'confidence': 75,
                        'created': '2025-12-01T10:00:00Z'
                    },
                    {
                        'id': 'indicator--mock-2',
                        'name': 'Suspicious domain evil.com',
                        'pattern': '[domain-name:value = "evil.com"]',
                        'confidence': 85,
                        'created': '2025-12-02T14:30:00Z'
                    }
                ],
                'total': 2
            }
        
        try:
            filters = []
            if search:
                filters.append({'key': 'name', 'values': [search], 'operator': 'match'})
            if indicator_types:
                filters.append({'key': 'indicator_types', 'values': indicator_types})
            
            indicators = self.client.indicator.list(
                filters=filters if filters else None,
                first=limit,
                orderBy='created_at',
                orderMode='desc'
            )
            
            return {
                'success': True,
                'indicators': indicators,
                'total': len(indicators)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_indicator(self, indicator_id: str) -> Dict[str, Any]:
        """Get indicator details by ID"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'indicator': {
                    'id': indicator_id,
                    'name': f'Mock Indicator {indicator_id}',
                    'pattern': '[ipv4-addr:value = "10.0.0.1"]',
                    'confidence': 70,
                    'valid_from': '2025-12-01T00:00:00Z',
                    'created': '2025-12-01T10:00:00Z'
                }
            }
        
        try:
            indicator = self.client.indicator.read(id=indicator_id)
            return {
                'success': True,
                'indicator': indicator
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==================== OBSERVABLES ====================
    
    def create_observable(self, 
                         type: str,
                         value: str,
                         description: str = "",
                         labels: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create an observable (IPv4, Domain, URL, Hash, etc.)"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'observable_id': f"observable--mock-{hash(value)}",
                'message': f"Mock: Created {type} observable '{value}'"
            }
        
        try:
            observable = self.client.stix_cyber_observable.create(
                type=type,
                simple_observable_value=value,
                simple_observable_description=description,
                objectLabel=labels or [],
                update=True
            )
            
            return {
                'success': True,
                'observable_id': observable['id'],
                'observable': observable
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def enrich_observable(self, observable_id: str) -> Dict[str, Any]:
        """Trigger enrichment for an observable"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'enrichment': {
                    'status': 'completed',
                    'sources': ['VirusTotal', 'AbuseIPDB', 'Shodan'],
                    'score': 85,
                    'tags': ['malicious', 'botnet', 'c2-server']
                }
            }
        
        try:
            # Trigger enrichment connectors
            result = self.client.stix_cyber_observable.ask_enrichment(id=observable_id)
            return {
                'success': True,
                'enrichment': result
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==================== MITRE ATT&CK ====================
    
    def search_attack_patterns(self, search: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """Search MITRE ATT&CK patterns"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'patterns': [
                    {
                        'id': 'attack-pattern--mock-1',
                        'name': 'T1059.001 - PowerShell',
                        'external_id': 'T1059.001',
                        'description': 'Adversaries may abuse PowerShell commands...',
                        'kill_chain_phases': ['execution']
                    },
                    {
                        'id': 'attack-pattern--mock-2',
                        'name': 'T1071.001 - Web Protocols',
                        'external_id': 'T1071.001',
                        'description': 'Adversaries may communicate using HTTP/HTTPS...',
                        'kill_chain_phases': ['command-and-control']
                    }
                ],
                'total': 2
            }
        
        try:
            filters = []
            if search:
                filters.append({'key': 'name', 'values': [search], 'operator': 'match'})
            
            patterns = self.client.attack_pattern.list(
                filters=filters if filters else None,
                first=limit,
                orderBy='name',
                orderMode='asc'
            )
            
            return {
                'success': True,
                'patterns': patterns,
                'total': len(patterns)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_attack_pattern(self, pattern_id: str) -> Dict[str, Any]:
        """Get MITRE ATT&CK pattern details"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'pattern': {
                    'id': pattern_id,
                    'name': 'T1059.001 - PowerShell',
                    'external_id': 'T1059.001',
                    'description': 'Mock description for PowerShell technique',
                    'kill_chain_phases': ['execution'],
                    'platforms': ['Windows']
                }
            }
        
        try:
            pattern = self.client.attack_pattern.read(id=pattern_id)
            return {
                'success': True,
                'pattern': pattern
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==================== THREAT ACTORS ====================
    
    def search_threat_actors(self, search: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """Search for threat actors"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'threat_actors': [
                    {
                        'id': 'threat-actor--mock-1',
                        'name': 'APT28',
                        'description': 'Russian state-sponsored threat group',
                        'aliases': ['Fancy Bear', 'Sofacy'],
                        'sophistication': 'advanced'
                    },
                    {
                        'id': 'threat-actor--mock-2',
                        'name': 'Lazarus Group',
                        'description': 'North Korean APT group',
                        'aliases': ['Hidden Cobra', 'ZINC'],
                        'sophistication': 'advanced'
                    }
                ],
                'total': 2
            }
        
        try:
            filters = []
            if search:
                filters.append({'key': 'name', 'values': [search], 'operator': 'match'})
            
            actors = self.client.threat_actor.list(
                filters=filters if filters else None,
                first=limit,
                orderBy='name',
                orderMode='asc'
            )
            
            return {
                'success': True,
                'threat_actors': actors,
                'total': len(actors)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==================== INCIDENTS ====================
    
    def create_incident(self,
                       name: str,
                       description: str,
                       severity: str = "medium",
                       incident_type: str = "alert",
                       first_seen: Optional[str] = None,
                       last_seen: Optional[str] = None,
                       confidence: int = 50,
                       labels: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a security incident"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'incident_id': f"incident--mock-{hash(name)}",
                'message': f"Mock: Created incident '{name}'"
            }
        
        try:
            incident = self.client.incident.create(
                name=name,
                description=description,
                severity=severity,
                incident_type=incident_type,
                first_seen=first_seen or datetime.utcnow().isoformat(),
                last_seen=last_seen or datetime.utcnow().isoformat(),
                confidence=confidence,
                objectLabel=labels or [],
                update=True
            )
            
            return {
                'success': True,
                'incident_id': incident['id'],
                'incident': incident
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def link_indicator_to_incident(self, indicator_id: str, incident_id: str) -> Dict[str, Any]:
        """Link an indicator to an incident"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'message': f"Mock: Linked indicator {indicator_id} to incident {incident_id}"
            }
        
        try:
            relationship = self.client.stix_core_relationship.create(
                fromId=incident_id,
                toId=indicator_id,
                relationship_type="related-to",
                confidence=80,
                update=True
            )
            
            return {
                'success': True,
                'relationship_id': relationship['id']
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==================== STIX BUNDLES ====================
    
    def submit_stix_bundle(self, bundle_data: Dict) -> Dict[str, Any]:
        """Submit a STIX 2.1 bundle to OpenCTI"""
        
        if self.mock_mode:
            # Count objects in bundle
            objects_count = len(bundle_data.get('objects', []))
            return {
                'success': True,
                'mock': True,
                'message': f"Mock: Processed STIX bundle with {objects_count} objects",
                'objects_count': objects_count
            }
        
        try:
            # Import bundle
            result = self.client.stix2.import_bundle_from_json(json.dumps(bundle_data))
            
            return {
                'success': True,
                'result': result,
                'objects_count': len(bundle_data.get('objects', []))
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def export_stix_bundle(self, entity_id: str) -> Dict[str, Any]:
        """Export an entity as a STIX bundle"""
        
        if self.mock_mode:
            return {
                'success': True,
                'mock': True,
                'bundle': {
                    'type': 'bundle',
                    'id': f'bundle--mock-{entity_id}',
                    'objects': []
                }
            }
        
        try:
            bundle = self.client.stix2.export_entity(entity_type='Indicator', entity_id=entity_id)
            
            return {
                'success': True,
                'bundle': json.loads(bundle)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==================== ALERT INTEGRATION ====================
    
    def submit_alert(self, alert_data: Dict) -> Dict[str, Any]:
        """Submit an alert from SOC dashboard to OpenCTI"""
        
        try:
            # Create incident
            incident_result = self.create_incident(
                name=alert_data.get('title', 'SOC Alert'),
                description=alert_data.get('description', ''),
                severity=alert_data.get('severity', 'medium'),
                incident_type='alert',
                confidence=alert_data.get('confidence', 50),
                labels=alert_data.get('tags', [])
            )
            
            if not incident_result['success']:
                return incident_result
            
            incident_id = incident_result.get('incident_id')
            
            # Create observables from IOCs
            iocs = alert_data.get('iocs', {})
            created_observables = []
            
            # IPs
            for ip in iocs.get('ips', []):
                obs = self.create_observable('IPv4-Addr', ip, f"IP from alert: {alert_data.get('title')}")
                if obs['success']:
                    created_observables.append(obs)
                    if not self.mock_mode:
                        self.client.stix_core_relationship.create(
                            fromId=incident_id,
                            toId=obs['observable_id'],
                            relationship_type="related-to",
                            update=True
                        )
            
            # Domains
            for domain in iocs.get('domains', []):
                obs = self.create_observable('Domain-Name', domain, f"Domain from alert: {alert_data.get('title')}")
                if obs['success']:
                    created_observables.append(obs)
                    if not self.mock_mode:
                        self.client.stix_core_relationship.create(
                            fromId=incident_id,
                            toId=obs['observable_id'],
                            relationship_type="related-to",
                            update=True
                        )
            
            # URLs
            for url in iocs.get('urls', []):
                obs = self.create_observable('Url', url, f"URL from alert: {alert_data.get('title')}")
                if obs['success']:
                    created_observables.append(obs)
                    if not self.mock_mode:
                        self.client.stix_core_relationship.create(
                            fromId=incident_id,
                            toId=obs['observable_id'],
                            relationship_type="related-to",
                            update=True
                        )
            
            # Hashes
            for hash_type in ['md5', 'sha1', 'sha256']:
                for hash_value in iocs.get(hash_type, []):
                    obs_type = f"StixFile.hashes.{hash_type.upper()}"
                    obs = self.create_observable(obs_type, hash_value, f"Hash from alert: {alert_data.get('title')}")
                    if obs['success']:
                        created_observables.append(obs)
            
            return {
                'success': True,
                'incident_id': incident_id,
                'observables_created': len(created_observables),
                'mock': self.mock_mode
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Global instance
_opencti_service = None

def get_opencti_service() -> OpenCTIService:
    """Get or create OpenCTI service instance"""
    global _opencti_service
    if _opencti_service is None:
        _opencti_service = OpenCTIService()
    return _opencti_service
