"""
IODEF (Incident Object Description Exchange Format) XML Generator

Generates RFC 5070/7970 compliant IODEF documents for cyber incidents.
This format is used for exchanging incident information between organizations
and CSIRTs (Computer Security Incident Response Teams).
"""

import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
from typing import Dict, List, Any, Optional
import uuid


class IODEFGenerator:
    """
    Generate IODEF XML documents for security incidents.
    Based on RFC 7970 (IODEF v2).
    """
    
    IODEF_NAMESPACE = "urn:ietf:params:xml:ns:iodef-2.0"
    
    def __init__(self):
        self.namespace = self.IODEF_NAMESPACE
    
    def generate_iodef(self, alert_data: Dict[str, Any], classification: Dict[str, Any]) -> str:
        """
        Generate IODEF XML document from alert and classification data.
        
        Args:
            alert_data: Alert information (id, title, severity, etc.)
            classification: Classification data from AlertClassifier
        
        Returns:
            Pretty-printed XML string
        """
        # Create root element
        iodef_doc = ET.Element(
            '{%s}IODEF-Document' % self.namespace,
            attrib={
                'version': '2.00',
                'lang': 'en',
                'formatid': 'iodef-1.0'
            }
        )
        
        # Create Incident element
        incident = self._create_incident(alert_data, classification)
        iodef_doc.append(incident)
        
        # Convert to pretty-printed string
        return self._prettify(iodef_doc)
    
    def _create_incident(self, alert_data: Dict[str, Any], classification: Dict[str, Any]) -> ET.Element:
        """Create the main Incident element."""
        incident_id = f"soc-{alert_data.get('id', uuid.uuid4().hex[:8])}"
        
        incident = ET.Element(
            '{%s}Incident' % self.namespace,
            attrib={'purpose': 'reporting'}
        )
        
        # IncidentID
        incident_id_elem = ET.SubElement(incident, '{%s}IncidentID' % self.namespace)
        incident_id_elem.text = incident_id
        incident_id_elem.set('name', 'soc-dashboard')
        
        # ReportTime
        report_time = ET.SubElement(incident, '{%s}ReportTime' % self.namespace)
        report_time.text = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # GenerationTime (when alert was first detected)
        gen_time = ET.SubElement(incident, '{%s}GenerationTime' % self.namespace)
        created_at = alert_data.get('created_at', datetime.utcnow().isoformat() + 'Z')
        gen_time.text = created_at
        
        # Description
        description = ET.SubElement(incident, '{%s}Description' % self.namespace)
        description.text = alert_data.get('description', alert_data.get('title', 'Security incident'))
        
        # Assessment (impact, confidence, severity)
        assessment = self._create_assessment(alert_data, classification)
        incident.append(assessment)
        
        # Contact (organization contact info)
        contact = self._create_contact()
        incident.append(contact)
        
        # EventData (technical details)
        event_data = self._create_event_data(alert_data, classification)
        incident.append(event_data)
        
        return incident
    
    def _create_assessment(self, alert_data: Dict[str, Any], classification: Dict[str, Any]) -> ET.Element:
        """Create Assessment element with impact and confidence."""
        assessment = ET.Element('{%s}Assessment' % self.namespace)
        
        # Impact
        impact = ET.SubElement(assessment, '{%s}Impact' % self.namespace)
        impact.set('severity', self._map_severity(classification.get('adjusted_severity', 'medium')))
        impact.set('completion', 'succeeded')
        
        # Add impact type
        alert_type = classification.get('alert_type', 'suspicious_activity')
        impact.set('type', self._map_alert_type_to_impact(alert_type))
        
        impact_desc = ET.SubElement(impact, '{%s}Description' % self.namespace)
        impact_desc.text = alert_type.replace('_', ' ').title()
        
        # Confidence
        confidence = ET.SubElement(assessment, '{%s}Confidence' % self.namespace)
        confidence.set('rating', 'numeric')
        confidence_val = classification.get('confidence', 0.5)
        confidence.text = str(round(confidence_val * 100))  # Convert to percentage
        
        return assessment
    
    def _create_contact(self) -> ET.Element:
        """Create Contact element for the reporting organization."""
        contact = ET.Element('{%s}Contact' % self.namespace)
        contact.set('role', 'creator')
        contact.set('type', 'organization')
        
        contact_name = ET.SubElement(contact, '{%s}ContactName' % self.namespace)
        contact_name.text = 'SOC Dashboard'
        
        email = ET.SubElement(contact, '{%s}Email' % self.namespace)
        email_addr = ET.SubElement(email, '{%s}EmailTo' % self.namespace)
        email_addr.text = 'soc@organization.local'
        
        return contact
    
    def _create_event_data(self, alert_data: Dict[str, Any], classification: Dict[str, Any]) -> ET.Element:
        """Create EventData with flow information and indicators."""
        event_data = ET.Element('{%s}EventData' % self.namespace)
        
        # DetectTime
        detect_time = ET.SubElement(event_data, '{%s}DetectTime' % self.namespace)
        detect_time.text = alert_data.get('created_at', datetime.utcnow().isoformat() + 'Z')
        
        # Description
        event_desc = ET.SubElement(event_data, '{%s}Description' % self.namespace)
        event_desc.text = alert_data.get('title', 'Security event detected')
        
        # Flow (network/system activity)
        iocs = classification.get('iocs', {})
        artifacts = alert_data.get('artifacts', [])
        
        # Add IP-based flows
        for ip in iocs.get('ips', [])[:5]:  # Limit to first 5
            flow = self._create_flow_for_ip(ip)
            event_data.append(flow)
        
        # Add artifacts as flows
        for artifact in artifacts[:5]:
            if isinstance(artifact, dict):
                art_type = artifact.get('type', '')
                art_value = artifact.get('value', '')
                
                if art_type == 'ip' and art_value:
                    flow = self._create_flow_for_ip(art_value)
                    event_data.append(flow)
        
        # Expectation (recommended actions)
        recommendations = classification.get('recommendations', [])
        if recommendations:
            expectation = ET.SubElement(event_data, '{%s}Expectation' % self.namespace)
            expectation.set('action', 'investigate')
            
            exp_desc = ET.SubElement(expectation, '{%s}Description' % self.namespace)
            exp_desc.text = '; '.join(recommendations[:3])
        
        # Record (evidence and observables)
        record = self._create_record(alert_data, classification)
        event_data.append(record)
        
        return event_data
    
    def _create_flow_for_ip(self, ip_address: str) -> ET.Element:
        """Create a Flow element for an IP address."""
        flow = ET.Element('{%s}Flow' % self.namespace)
        
        system = ET.SubElement(flow, '{%s}System' % self.namespace)
        system.set('category', 'source')
        
        node = ET.SubElement(system, '{%s}Node' % self.namespace)
        address = ET.SubElement(node, '{%s}Address' % self.namespace)
        address.set('category', 'ipv4-addr')
        address.text = ip_address
        
        return flow
    
    def _create_record(self, alert_data: Dict[str, Any], classification: Dict[str, Any]) -> ET.Element:
        """Create Record element with observables and evidence."""
        record = ET.Element('{%s}Record' % self.namespace)
        
        # RecordData with observables
        record_data = ET.SubElement(record, '{%s}RecordData' % self.namespace)
        
        # Add IOCs as RecordItems
        iocs = classification.get('iocs', {})
        
        # Add domains
        for domain in iocs.get('domains', [])[:5]:
            record_item = ET.SubElement(record_data, '{%s}RecordItem' % self.namespace)
            record_item.set('dtype', 'string')
            record_item.text = f"Domain: {domain}"
        
        # Add URLs
        for url in iocs.get('urls', [])[:3]:
            record_item = ET.SubElement(record_data, '{%s}RecordItem' % self.namespace)
            record_item.set('dtype', 'url')
            record_item.text = url
        
        # Add file hashes
        for hash_type in ['md5', 'sha1', 'sha256']:
            for hash_val in iocs.get(hash_type, [])[:3]:
                record_item = ET.SubElement(record_data, '{%s}RecordItem' % self.namespace)
                record_item.set('dtype', 'hash')
                record_item.text = f"{hash_type.upper()}: {hash_val}"
        
        # Add CVEs
        for cve in iocs.get('cves', []):
            record_item = ET.SubElement(record_data, '{%s}RecordItem' % self.namespace)
            record_item.set('dtype', 'string')
            record_item.text = f"CVE: {cve}"
        
        # Add MITRE ATT&CK mappings
        mitre_mappings = classification.get('mitre_mapping', [])
        for mapping in mitre_mappings[:5]:
            if isinstance(mapping, dict):
                tid = mapping.get('technique_id', '')
                technique = mapping.get('technique', '')
                record_item = ET.SubElement(record_data, '{%s}RecordItem' % self.namespace)
                record_item.set('dtype', 'string')
                record_item.text = f"MITRE ATT&CK: {tid} - {technique}"
        
        # AdditionalData for IOAs
        ioas = classification.get('ioas', [])
        if ioas:
            for ioa in ioas[:5]:
                additional = ET.SubElement(record, '{%s}AdditionalData' % self.namespace)
                additional.set('dtype', 'string')
                additional.set('meaning', 'IOA')
                ioa_desc = ioa.get('description', 'Behavioral indicator')
                additional.text = f"{ioa.get('type', 'unknown')}: {ioa_desc}"
        
        return record
    
    def _map_severity(self, severity: str) -> str:
        """Map internal severity to IODEF severity."""
        mapping = {
            'Low': 'low',
            'Medium': 'medium',
            'High': 'high',
            'Critical': 'high'  # IODEF doesn't have 'critical', use 'high'
        }
        return mapping.get(severity, 'medium')
    
    def _map_alert_type_to_impact(self, alert_type: str) -> str:
        """Map alert type to IODEF impact type."""
        mapping = {
            'phishing': 'phishing',
            'malware': 'malware',
            'intrusion': 'unauthorized-access',
            'data_breach': 'information-disclosure',
            'denial_of_service': 'dos',
            'reconnaissance': 'recon',
            'lateral_movement': 'unauthorized-access',
            'privilege_escalation': 'privilege-escalation',
            'vulnerability_exploitation': 'exploit'
        }
        return mapping.get(alert_type, 'other')
    
    def _prettify(self, elem: ET.Element) -> str:
        """Return pretty-printed XML string."""
        rough_string = ET.tostring(elem, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")
    
    def save_to_file(self, xml_content: str, filename: str) -> bool:
        """Save IODEF XML to file."""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(xml_content)
            return True
        except Exception as e:
            print(f"Error saving IODEF file: {e}")
            return False


def generate_iodef_for_alert(alert_data: Dict[str, Any], classification: Dict[str, Any]) -> str:
    """
    Convenience function to generate IODEF XML for an alert.
    
    Args:
        alert_data: Alert dictionary with id, title, severity, etc.
        classification: Classification dict from AlertClassifier
    
    Returns:
        IODEF XML string
    """
    generator = IODEFGenerator()
    return generator.generate_iodef(alert_data, classification)
