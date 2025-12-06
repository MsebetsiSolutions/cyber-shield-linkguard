"""
OpenCTI (Open Cyber Threat Intelligence) Integration Module

Integrates with OpenCTI platform to:
- Send STIX bundles for threat intelligence
- Query threat intelligence data
- Create indicators and observables
- Link incidents to threat actors and campaigns
"""

import os
import json
import requests
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import uuid


class OpenCTIClient:
    """
    Client for OpenCTI REST API and GraphQL interface.
    
    OpenCTI is an open-source platform for managing cyber threat intelligence.
    """
    
    def __init__(self, url: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize OpenCTI client.
        
        Args:
            url: OpenCTI server URL (e.g., http://opencti.local:8080)
            api_key: API authentication token
        """
        self.url = url or os.getenv('OPENCTI_URL', 'http://localhost:8080')
        self.api_key = api_key or os.getenv('OPENCTI_API_KEY', '')
        self.graphql_endpoint = f"{self.url.rstrip('/')}/graphql"
        
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}' if self.api_key else ''
        }
        
        self.timeout = 30
        # Enable mock mode if OPENCTI_MOCK=true or if no API key is set
        self.mock_mode = os.getenv('OPENCTI_MOCK', 'true').lower() == 'true'
        self.enabled = bool(self.api_key) or self.mock_mode
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test connection to OpenCTI instance."""
        if not self.enabled:
            return False, "OpenCTI API key not configured"
        
        # Mock mode - simulate success
        if self.mock_mode:
            return True, "OpenCTI Mock Mode (simulation only - no real connection)"
        
        query = """
        query {
            about {
                version
            }
        }
        """
        
        try:
            response = requests.post(
                self.graphql_endpoint,
                json={'query': query},
                headers=self.headers,
                timeout=self.timeout,
                verify=True
            )
            
            if response.status_code == 200:
                data = response.json()
                version = data.get('data', {}).get('about', {}).get('version', 'unknown')
                return True, f"Connected to OpenCTI version {version}"
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
        
        except requests.exceptions.ConnectionError:
            return False, "Connection failed - is OpenCTI running?"
        except requests.exceptions.Timeout:
            return False, "Connection timeout"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def create_stix_bundle(self, alert_data: Dict[str, Any], classification: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a STIX 2.1 bundle from alert and classification data.
        
        Args:
            alert_data: Alert information
            classification: Classification from AlertClassifier
        
        Returns:
            STIX bundle dictionary
        """
        bundle_id = f"bundle--{uuid.uuid4()}"
        timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        
        objects = []
        
        # 1. Create Incident object
        incident = self._create_incident_object(alert_data, classification, timestamp)
        objects.append(incident)
        
        # 2. Create Indicator objects from IOCs
        iocs = classification.get('iocs', {})
        indicators = self._create_indicator_objects(iocs, timestamp)
        objects.extend(indicators)
        
        # 3. Create Attack Pattern objects from MITRE mappings
        mitre_mappings = classification.get('mitre_mapping', [])
        attack_patterns = self._create_attack_pattern_objects(mitre_mappings, timestamp)
        objects.extend(attack_patterns)
        
        # 4. Create relationships between incident and indicators
        for indicator in indicators:
            relationship = self._create_relationship(
                incident['id'],
                indicator['id'],
                'indicates',
                timestamp
            )
            objects.append(relationship)
        
        # 5. Create relationships between incident and attack patterns
        for attack_pattern in attack_patterns:
            relationship = self._create_relationship(
                incident['id'],
                attack_pattern['id'],
                'uses',
                timestamp
            )
            objects.append(relationship)
        
        bundle = {
            'type': 'bundle',
            'id': bundle_id,
            'objects': objects
        }
        
        return bundle
    
    def _create_incident_object(self, alert_data: Dict[str, Any], classification: Dict[str, Any], timestamp: str) -> Dict[str, Any]:
        """Create STIX Incident object."""
        incident_id = f"incident--{uuid.uuid4()}"
        
        incident = {
            'type': 'incident',
            'spec_version': '2.1',
            'id': incident_id,
            'created': timestamp,
            'modified': timestamp,
            'name': alert_data.get('title', 'Security Incident'),
            'description': alert_data.get('description', ''),
            'incident_type': classification.get('alert_type', 'suspicious_activity').replace('_', '-'),
            'severity': classification.get('adjusted_severity', 'medium').lower(),
            'confidence': int(classification.get('confidence', 0.5) * 100),
            'external_references': [
                {
                    'source_name': 'soc-dashboard',
                    'external_id': str(alert_data.get('id', ''))
                }
            ]
        }
        
        return incident
    
    def _create_indicator_objects(self, iocs: Dict[str, List[str]], timestamp: str) -> List[Dict[str, Any]]:
        """Create STIX Indicator objects from IOCs."""
        indicators = []
        
        # IP addresses
        for ip in iocs.get('ips', []):
            indicator = {
                'type': 'indicator',
                'spec_version': '2.1',
                'id': f"indicator--{uuid.uuid4()}",
                'created': timestamp,
                'modified': timestamp,
                'name': f'Malicious IP: {ip}',
                'description': f'IP address observed in security incident',
                'pattern': f"[ipv4-addr:value = '{ip}']",
                'pattern_type': 'stix',
                'valid_from': timestamp,
                'indicator_types': ['malicious-activity']
            }
            indicators.append(indicator)
        
        # Domains
        for domain in iocs.get('domains', []):
            indicator = {
                'type': 'indicator',
                'spec_version': '2.1',
                'id': f"indicator--{uuid.uuid4()}",
                'created': timestamp,
                'modified': timestamp,
                'name': f'Malicious Domain: {domain}',
                'description': f'Domain observed in security incident',
                'pattern': f"[domain-name:value = '{domain}']",
                'pattern_type': 'stix',
                'valid_from': timestamp,
                'indicator_types': ['malicious-activity']
            }
            indicators.append(indicator)
        
        # URLs
        for url in iocs.get('urls', []):
            indicator = {
                'type': 'indicator',
                'spec_version': '2.1',
                'id': f"indicator--{uuid.uuid4()}",
                'created': timestamp,
                'modified': timestamp,
                'name': f'Malicious URL',
                'description': f'URL observed in security incident',
                'pattern': f"[url:value = '{url}']",
                'pattern_type': 'stix',
                'valid_from': timestamp,
                'indicator_types': ['malicious-activity']
            }
            indicators.append(indicator)
        
        # File hashes
        for hash_type in ['md5', 'sha1', 'sha256']:
            for hash_val in iocs.get(hash_type, []):
                indicator = {
                    'type': 'indicator',
                    'spec_version': '2.1',
                    'id': f"indicator--{uuid.uuid4()}",
                    'created': timestamp,
                    'modified': timestamp,
                    'name': f'Malicious File Hash ({hash_type.upper()})',
                    'description': f'File hash observed in security incident',
                    'pattern': f"[file:hashes.'{hash_type.upper()}' = '{hash_val}']",
                    'pattern_type': 'stix',
                    'valid_from': timestamp,
                    'indicator_types': ['malicious-activity']
                }
                indicators.append(indicator)
        
        return indicators
    
    def _create_attack_pattern_objects(self, mitre_mappings: List[Dict[str, Any]], timestamp: str) -> List[Dict[str, Any]]:
        """Create STIX Attack Pattern objects from MITRE ATT&CK mappings."""
        attack_patterns = []
        
        for mapping in mitre_mappings:
            if not isinstance(mapping, dict):
                continue
            
            technique_id = mapping.get('technique_id', '')
            technique_name = mapping.get('technique', technique_id)
            
            if not technique_id:
                continue
            
            attack_pattern = {
                'type': 'attack-pattern',
                'spec_version': '2.1',
                'id': f"attack-pattern--{uuid.uuid4()}",
                'created': timestamp,
                'modified': timestamp,
                'name': technique_name,
                'description': f'MITRE ATT&CK Technique: {technique_id}',
                'external_references': [
                    {
                        'source_name': 'mitre-attack',
                        'external_id': technique_id,
                        'url': f'https://attack.mitre.org/techniques/{technique_id.replace(".", "/")}'
                    }
                ]
            }
            attack_patterns.append(attack_pattern)
        
        return attack_patterns
    
    def _create_relationship(self, source_id: str, target_id: str, relationship_type: str, timestamp: str) -> Dict[str, Any]:
        """Create STIX Relationship object."""
        relationship = {
            'type': 'relationship',
            'spec_version': '2.1',
            'id': f"relationship--{uuid.uuid4()}",
            'created': timestamp,
            'modified': timestamp,
            'relationship_type': relationship_type,
            'source_ref': source_id,
            'target_ref': target_id
        }
        return relationship
    
    def send_stix_bundle(self, bundle: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Send STIX bundle to OpenCTI.
        
        Args:
            bundle: STIX bundle dictionary
        
        Returns:
            (success, message)
        """
        if not self.enabled:
            return False, "OpenCTI not configured"
        
        # Mock mode - simulate success
        if self.mock_mode:
            num_objects = len(bundle.get('objects', []))
            return True, f"STIX bundle uploaded successfully (MOCK MODE: {num_objects} objects processed)"
        
        # OpenCTI import via GraphQL mutation
        mutation = """
        mutation ImportBundle($file: Upload!) {
            uploadImport(file: $file) {
                id
            }
        }
        """
        
        # Convert bundle to JSON file content
        bundle_json = json.dumps(bundle, indent=2)
        
        try:
            # Use the file upload endpoint
            files = {
                'file': ('bundle.json', bundle_json, 'application/json')
            }
            
            response = requests.post(
                f"{self.url.rstrip('/')}/storage/upload",
                files=files,
                headers={'Authorization': f'Bearer {self.api_key}' if self.api_key else ''},
                timeout=self.timeout,
                verify=True
            )
            
            if response.status_code in [200, 201]:
                return True, "STIX bundle uploaded successfully"
            else:
                return False, f"Upload failed: HTTP {response.status_code}"
        
        except Exception as e:
            return False, f"Error sending bundle: {str(e)}"
    
    def query_indicators(self, search_term: str, limit: int = 10) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Query OpenCTI for indicators matching search term.
        
        Args:
            search_term: IP, domain, hash, or keyword
            limit: Maximum results
        
        Returns:
            (success, list of indicators)
        """
        if not self.enabled:
            return False, []
        
        query = """
        query SearchIndicators($search: String, $first: Int) {
            indicators(search: $search, first: $first) {
                edges {
                    node {
                        id
                        name
                        pattern
                        valid_from
                        confidence
                    }
                }
            }
        }
        """
        
        variables = {
            'search': search_term,
            'first': limit
        }
        
        try:
            response = requests.post(
                self.graphql_endpoint,
                json={'query': query, 'variables': variables},
                headers=self.headers,
                timeout=self.timeout,
                verify=True
            )
            
            if response.status_code == 200:
                data = response.json()
                edges = data.get('data', {}).get('indicators', {}).get('edges', [])
                indicators = [edge['node'] for edge in edges]
                return True, indicators
            else:
                return False, []
        
        except Exception as e:
            return False, []
    
    def enrich_iocs(self, iocs: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Enrich IOCs with threat intelligence from OpenCTI.
        
        Args:
            iocs: Dictionary of IOC types and values
        
        Returns:
            Enrichment data
        """
        if not self.enabled:
            return {'enriched': False, 'reason': 'OpenCTI not configured'}
        
        enrichment = {
            'enriched': True,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'results': {}
        }
        
        # Query each IOC type
        for ioc_type, values in iocs.items():
            if not values:
                continue
            
            enrichment['results'][ioc_type] = []
            
            for value in values[:5]:  # Limit queries
                success, results = self.query_indicators(value, limit=3)
                if success and results:
                    enrichment['results'][ioc_type].append({
                        'value': value,
                        'matches': results
                    })
        
        return enrichment


# Singleton instance
_opencti_client = None


def get_opencti_client() -> OpenCTIClient:
    """Get or create OpenCTI client instance."""
    global _opencti_client
    if _opencti_client is None:
        _opencti_client = OpenCTIClient()
    return _opencti_client


def send_alert_to_opencti(alert_data: Dict[str, Any], classification: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Send alert to OpenCTI as STIX bundle.
    
    Args:
        alert_data: Alert information
        classification: Classification from AlertClassifier
    
    Returns:
        (success, message)
    """
    client = get_opencti_client()
    
    if not client.enabled:
        # Return success in mock mode by default
        return True, "OpenCTI integration in MOCK MODE - Alert processed locally (set OPENCTI_MOCK=false and configure OPENCTI_URL and OPENCTI_API_KEY for real integration)"
    
    # Create STIX bundle
    bundle = client.create_stix_bundle(alert_data, classification)
    
    # Send to OpenCTI
    return client.send_stix_bundle(bundle)
