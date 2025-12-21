"""
IOC (Indicators of Compromise) and IOA (Indicators of Attack) Detection Module

This module provides sophisticated detection capabilities for identifying:
- IOCs: IP addresses, domains, URLs, file hashes, email addresses, CVEs
- IOAs: Behavioral patterns, attack techniques, anomalies
"""

import re
import hashlib
import ipaddress
from typing import Dict, List, Any, Set, Tuple
from datetime import datetime, timedelta
import json


class IOCDetector:
    """Detects and extracts Indicators of Compromise from various sources."""
    
    # Regex patterns for IOC extraction
    IP_PATTERN = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
    DOMAIN_PATTERN = re.compile(r'\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b', re.IGNORECASE)
    URL_PATTERN = re.compile(r'https?://[^\s<>"\']+', re.IGNORECASE)
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    MD5_PATTERN = re.compile(r'\b[A-Fa-f0-9]{32}\b')
    SHA1_PATTERN = re.compile(r'\b[A-Fa-f0-9]{40}\b')
    SHA256_PATTERN = re.compile(r'\b[A-Fa-f0-9]{64}\b')
    CVE_PATTERN = re.compile(r'CVE-\d{4}-\d{4,7}', re.IGNORECASE)
    
    # MITRE ATT&CK TTP patterns
    MITRE_TID_PATTERN = re.compile(r'\b[T]\d{4}(?:\.\d{3})?\b')
    
    # Suspicious patterns for IOA detection
    SUSPICIOUS_COMMANDS = [
        'powershell', 'cmd.exe', 'wscript', 'cscript', 'mshta', 'rundll32',
        'regsvr32', 'certutil', 'bitsadmin', 'wmic', 'psexec', 'net user',
        'net localgroup', 'schtasks', 'at.exe', 'reg add', 'reg delete'
    ]
    
    MALICIOUS_EXTENSIONS = [
        '.exe', '.dll', '.scr', '.bat', '.cmd', '.vbs', '.js', '.ps1',
        '.hta', '.msi', '.reg', '.lnk', '.pif', '.com'
    ]
    
    SUSPICIOUS_PORTS = [
        4444, 5555, 6666, 7777, 8888, 9999, 31337, 1337, 12345, 54321
    ]
    
    def extract_iocs(self, text: str) -> Dict[str, List[str]]:
        """Extract all IOCs from text."""
        if not text:
            return self._empty_iocs()
        
        iocs = {
            'ips': self._unique(self.IP_PATTERN.findall(text)),
            'domains': self._extract_domains(text),
            'urls': self._unique(self.URL_PATTERN.findall(text)),
            'emails': self._unique(self.EMAIL_PATTERN.findall(text)),
            'md5': self._unique(self.MD5_PATTERN.findall(text)),
            'sha1': self._unique(self.SHA1_PATTERN.findall(text)),
            'sha256': self._unique(self.SHA256_PATTERN.findall(text)),
            'cves': self._unique(self.CVE_PATTERN.findall(text)),
            'mitre_ttps': self._unique(self.MITRE_TID_PATTERN.findall(text))
        }
        
        return iocs
    
    def _extract_domains(self, text: str) -> List[str]:
        """Extract domains, filtering out IPs and common false positives."""
        domains = self.DOMAIN_PATTERN.findall(text)
        filtered = []
        for d in domains:
            # Skip if it's actually an IP
            if self.IP_PATTERN.match(d):
                continue
            # Skip common false positives
            if d.lower() in ['example.com', 'localhost', 'test.com']:
                continue
            filtered.append(d.lower())
        return self._unique(filtered)
    
    def _unique(self, items: List[str]) -> List[str]:
        """Return unique items preserving order."""
        seen = set()
        result = []
        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)
        return result
    
    def _empty_iocs(self) -> Dict[str, List[str]]:
        """Return empty IOC structure."""
        return {
            'ips': [], 'domains': [], 'urls': [], 'emails': [],
            'md5': [], 'sha1': [], 'sha256': [], 'cves': [], 'mitre_ttps': []
        }


class IOADetector:
    """Detects Indicators of Attack (behavioral patterns and techniques)."""
    
    def __init__(self):
        self.ioc_detector = IOCDetector()
    
    def detect_suspicious_behavior(self, alert_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze alert for suspicious behavioral patterns (IOAs).
        
        Returns list of detected behaviors with severity and confidence.
        """
        behaviors = []
        
        title = (alert_data.get('title', '') or '').lower()
        description = (alert_data.get('description', '') or '').lower()
        artifacts = alert_data.get('artifacts', [])
        
        combined_text = f"{title} {description}"
        
        # Check for suspicious commands
        for cmd in IOCDetector.SUSPICIOUS_COMMANDS:
            if cmd in combined_text:
                behaviors.append({
                    'type': 'suspicious_command',
                    'indicator': cmd,
                    'severity': 'Medium',
                    'confidence': 0.7,
                    'description': f'Suspicious command detected: {cmd}'
                })
        
        # Check for malicious file extensions
        for ext in IOCDetector.MALICIOUS_EXTENSIONS:
            if ext in combined_text:
                behaviors.append({
                    'type': 'suspicious_file',
                    'indicator': ext,
                    'severity': 'Medium',
                    'confidence': 0.6,
                    'description': f'Potentially malicious file extension: {ext}'
                })
        
        # Check for port scanning behavior
        if any(word in combined_text for word in ['port scan', 'scanning', 'sweep']):
            behaviors.append({
                'type': 'port_scanning',
                'indicator': 'port_scan_pattern',
                'severity': 'Low',
                'confidence': 0.5,
                'description': 'Port scanning activity detected'
            })
        
        # Check for lateral movement indicators
        if any(word in combined_text for word in ['psexec', 'wmi', 'remote execution', 'lateral']):
            behaviors.append({
                'type': 'lateral_movement',
                'indicator': 'lateral_movement_pattern',
                'severity': 'High',
                'confidence': 0.8,
                'description': 'Lateral movement indicators detected'
            })
        
        # Check for data exfiltration
        if any(word in combined_text for word in ['exfil', 'upload', 'data transfer', 'large transfer']):
            behaviors.append({
                'type': 'data_exfiltration',
                'indicator': 'exfiltration_pattern',
                'severity': 'Critical',
                'confidence': 0.75,
                'description': 'Potential data exfiltration detected'
            })
        
        # Check for privilege escalation
        if any(word in combined_text for word in ['privilege', 'escalation', 'uac bypass', 'admin access']):
            behaviors.append({
                'type': 'privilege_escalation',
                'indicator': 'privesc_pattern',
                'severity': 'High',
                'confidence': 0.8,
                'description': 'Privilege escalation attempt detected'
            })
        
        # Check for persistence mechanisms
        if any(word in combined_text for word in ['persistence', 'scheduled task', 'registry run', 'startup']):
            behaviors.append({
                'type': 'persistence',
                'indicator': 'persistence_pattern',
                'severity': 'High',
                'confidence': 0.7,
                'description': 'Persistence mechanism detected'
            })
        
        # Check for credential access
        if any(word in combined_text for word in ['credential', 'password', 'mimikatz', 'dump', 'lsass']):
            behaviors.append({
                'type': 'credential_access',
                'indicator': 'credential_theft_pattern',
                'severity': 'Critical',
                'confidence': 0.85,
                'description': 'Credential theft indicators detected'
            })
        
        # Check artifacts for suspicious IPs/domains
        for artifact in artifacts:
            if isinstance(artifact, dict):
                art_type = artifact.get('type', '')
                art_value = artifact.get('value', '')
                
                if art_type == 'ip':
                    # Check for suspicious ports
                    if any(str(port) in str(artifact) for port in IOCDetector.SUSPICIOUS_PORTS):
                        behaviors.append({
                            'type': 'suspicious_port',
                            'indicator': art_value,
                            'severity': 'Medium',
                            'confidence': 0.65,
                            'description': f'Connection to suspicious port from/to {art_value}'
                        })
        
        return behaviors


class AlertClassifier:
    """Classifies alerts based on IOCs, IOAs, and threat intelligence."""
    
    SEVERITY_SCORES = {
        'Low': 1,
        'Medium': 2,
        'High': 3,
        'Critical': 4
    }
    
    def __init__(self):
        self.ioc_detector = IOCDetector()
        self.ioa_detector = IOADetector()
    
    def classify_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify an alert and enrich with IOC/IOA analysis.
        
        Returns classification with:
        - alert_type: phishing, malware, intrusion, data_breach, etc.
        - severity: adjusted based on IOC/IOA findings
        - confidence: 0-1 confidence score
        - iocs: extracted indicators
        - ioas: behavioral indicators
        - mitre_mapping: ATT&CK techniques
        - recommendations: response actions
        """
        title = alert_data.get('title', '')
        description = alert_data.get('description', '')
        severity = alert_data.get('severity', 'Medium')
        
        combined_text = f"{title} {description}"
        
        # Extract IOCs
        iocs = self.ioc_detector.extract_iocs(combined_text)
        
        # Detect IOAs
        ioas = self.ioa_detector.detect_suspicious_behavior(alert_data)
        
        # Determine alert type
        alert_type = self._determine_alert_type(combined_text, iocs, ioas)
        
        # Calculate confidence score
        confidence = self._calculate_confidence(iocs, ioas)
        
        # Adjust severity based on findings
        adjusted_severity = self._adjust_severity(severity, iocs, ioas)
        
        # Map to MITRE ATT&CK
        mitre_mapping = self._map_to_mitre(alert_type, ioas, iocs)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(alert_type, adjusted_severity, iocs, ioas)
        
        return {
            'alert_type': alert_type,
            'original_severity': severity,
            'adjusted_severity': adjusted_severity,
            'confidence': confidence,
            'iocs': iocs,
            'ioas': ioas,
            'mitre_mapping': mitre_mapping,
            'recommendations': recommendations,
            'enriched_at': datetime.utcnow().isoformat() + 'Z'
        }
    
    def _determine_alert_type(self, text: str, iocs: Dict, ioas: List[Dict]) -> str:
        """Determine the primary alert type."""
        text_lower = text.lower()
        
        # Check for specific patterns
        if any(word in text_lower for word in ['phish', 'spoof', 'credential harvest']):
            return 'phishing'
        elif any(word in text_lower for word in ['malware', 'ransomware', 'trojan', 'virus']):
            return 'malware'
        elif any(word in text_lower for word in ['intrusion', 'breach', 'unauthorized access']):
            return 'intrusion'
        elif any(word in text_lower for word in ['exfil', 'data breach', 'leak']):
            return 'data_breach'
        elif any(word in text_lower for word in ['dos', 'ddos', 'flood']):
            return 'denial_of_service'
        elif any(word in text_lower for word in ['scan', 'reconnaissance', 'probe']):
            return 'reconnaissance'
        elif any(ioa.get('type') == 'lateral_movement' for ioa in ioas):
            return 'lateral_movement'
        elif any(ioa.get('type') == 'privilege_escalation' for ioa in ioas):
            return 'privilege_escalation'
        elif iocs.get('cves'):
            return 'vulnerability_exploitation'
        else:
            return 'suspicious_activity'
    
    def _calculate_confidence(self, iocs: Dict, ioas: List[Dict]) -> float:
        """Calculate confidence score (0-1)."""
        score = 0.5  # Base confidence
        
        # Increase based on number of IOCs
        total_iocs = sum(len(v) for v in iocs.values())
        score += min(0.3, total_iocs * 0.05)
        
        # Increase based on IOA confidence
        if ioas:
            avg_ioa_confidence = sum(ioa.get('confidence', 0.5) for ioa in ioas) / len(ioas)
            score += avg_ioa_confidence * 0.2
        
        return min(1.0, score)
    
    def _adjust_severity(self, current_severity: str, iocs: Dict, ioas: List[Dict]) -> str:
        """Adjust severity based on IOC/IOA findings."""
        current_score = self.SEVERITY_SCORES.get(current_severity, 2)
        
        # Increase severity for critical IOAs
        critical_ioas = [ioa for ioa in ioas if ioa.get('severity') == 'Critical']
        if critical_ioas:
            current_score = max(current_score, 4)
        
        high_ioas = [ioa for ioa in ioas if ioa.get('severity') == 'High']
        if high_ioas and current_score < 3:
            current_score = 3
        
        # Increase for multiple IOCs
        total_iocs = sum(len(v) for v in iocs.values())
        if total_iocs > 10:
            current_score = min(4, current_score + 1)
        
        # Map back to severity label
        for sev, score in self.SEVERITY_SCORES.items():
            if score == current_score:
                return sev
        
        return current_severity
    
    def _map_to_mitre(self, alert_type: str, ioas: List[Dict], iocs: Dict) -> List[Dict[str, str]]:
        """Map alert to MITRE ATT&CK techniques."""
        mappings = []
        
        # Use existing MITRE TIDs from IOCs if available
        if iocs.get('mitre_ttps'):
            for tid in iocs['mitre_ttps']:
                mappings.append({'technique_id': tid, 'confidence': 0.9})
        
        # Map based on alert type
        type_mappings = {
            'phishing': [
                {'technique_id': 'T1566.001', 'technique': 'Spearphishing Attachment', 'tactic': 'Initial Access'},
                {'technique_id': 'T1566.002', 'technique': 'Spearphishing Link', 'tactic': 'Initial Access'}
            ],
            'malware': [
                {'technique_id': 'T1204.002', 'technique': 'Malicious File', 'tactic': 'Execution'},
                {'technique_id': 'T1059.001', 'technique': 'PowerShell', 'tactic': 'Execution'}
            ],
            'intrusion': [
                {'technique_id': 'T1078', 'technique': 'Valid Accounts', 'tactic': 'Initial Access'},
                {'technique_id': 'T1133', 'technique': 'External Remote Services', 'tactic': 'Initial Access'}
            ],
            'data_breach': [
                {'technique_id': 'T1567', 'technique': 'Exfiltration Over Web Service', 'tactic': 'Exfiltration'},
                {'technique_id': 'T1041', 'technique': 'Exfiltration Over C2 Channel', 'tactic': 'Exfiltration'}
            ],
            'reconnaissance': [
                {'technique_id': 'T1595', 'technique': 'Active Scanning', 'tactic': 'Reconnaissance'},
                {'technique_id': 'T1046', 'technique': 'Network Service Scanning', 'tactic': 'Discovery'}
            ],
            'lateral_movement': [
                {'technique_id': 'T1021', 'technique': 'Remote Services', 'tactic': 'Lateral Movement'},
                {'technique_id': 'T1570', 'technique': 'Lateral Tool Transfer', 'tactic': 'Lateral Movement'}
            ],
            'privilege_escalation': [
                {'technique_id': 'T1068', 'technique': 'Exploitation for Privilege Escalation', 'tactic': 'Privilege Escalation'},
                {'technique_id': 'T1548', 'technique': 'Abuse Elevation Control Mechanism', 'tactic': 'Privilege Escalation'}
            ]
        }
        
        mappings.extend(type_mappings.get(alert_type, []))
        
        # Map based on IOA types
        ioa_mappings = {
            'credential_access': [
                {'technique_id': 'T1003', 'technique': 'OS Credential Dumping', 'tactic': 'Credential Access'}
            ],
            'persistence': [
                {'technique_id': 'T1547', 'technique': 'Boot or Logon Autostart Execution', 'tactic': 'Persistence'}
            ]
        }
        
        for ioa in ioas:
            ioa_type = ioa.get('type')
            if ioa_type in ioa_mappings:
                mappings.extend(ioa_mappings[ioa_type])
        
        return mappings
    
    def _generate_recommendations(self, alert_type: str, severity: str, iocs: Dict, ioas: List[Dict]) -> List[str]:
        """Generate response recommendations."""
        recommendations = []
        
        # Base recommendations by alert type
        type_recs = {
            'phishing': [
                'Quarantine suspicious emails',
                'Block sender domains',
                'Educate users about phishing indicators'
            ],
            'malware': [
                'Isolate affected systems',
                'Run full antivirus scan',
                'Check for persistence mechanisms',
                'Review related alerts for lateral movement'
            ],
            'intrusion': [
                'Reset compromised credentials',
                'Review access logs',
                'Enable MFA if not already active',
                'Check for lateral movement'
            ],
            'data_breach': [
                'Identify scope of data accessed',
                'Preserve forensic evidence',
                'Notify security leadership immediately',
                'Engage incident response team'
            ],
            'lateral_movement': [
                'Isolate affected systems',
                'Review network segmentation',
                'Check for compromised credentials',
                'Hunt for additional compromised hosts'
            ]
        }
        
        recommendations.extend(type_recs.get(alert_type, ['Investigate further']))
        
        # Add severity-based recommendations
        if severity in ['Critical', 'High']:
            recommendations.append('Escalate to senior analyst immediately')
            recommendations.append('Consider engaging incident response team')
        
        # Add IOC-based recommendations
        if iocs.get('ips'):
            recommendations.append(f"Block IPs: {', '.join(iocs['ips'][:3])}")
        if iocs.get('domains'):
            recommendations.append(f"Block domains: {', '.join(iocs['domains'][:3])}")
        if iocs.get('md5') or iocs.get('sha256'):
            recommendations.append('Add file hashes to blocklist')
        
        return recommendations
