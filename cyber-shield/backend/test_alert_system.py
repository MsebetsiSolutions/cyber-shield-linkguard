"""
Test script to demonstrate the Alert Detection and Intelligence System

This script creates sample alerts and demonstrates:
- IOC extraction
- IOA detection
- Alert classification
- IODEF generation
- OpenCTI integration (if configured)
"""

import requests
import json
import time

# Configuration
API_BASE = "http://127.0.0.1:5000"

def create_sample_alert(title, description, severity="Medium"):
    """Create a sample alert for testing."""
    url = f"{API_BASE}/api/alerts/create"
    payload = {
        "title": title,
        "description": description,
        "severity": severity,
        "status": "New",
        "owner": "",
        "tags": ["test", "demo"],
        "artifacts": [],
        "source": "test_script"
    }
    
    response = requests.post(url, json=payload)
    if response.status_code == 201:
        alert = response.json()
        print(f"✓ Created alert {alert['id']}: {title}")
        return alert['id']
    else:
        print(f"✗ Failed to create alert: {response.text}")
        return None


def classify_alert(alert_id):
    """Classify an alert to detect IOCs/IOAs."""
    url = f"{API_BASE}/api/alerts/classify"
    payload = {"id": alert_id}
    
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        classification = data.get('classification', {})
        
        print(f"\n📊 Classification Results for Alert {alert_id}:")
        print(f"   Type: {classification.get('alert_type')}")
        print(f"   Severity: {classification.get('adjusted_severity')} (Confidence: {classification.get('confidence', 0) * 100:.1f}%)")
        
        iocs = classification.get('iocs', {})
        total_iocs = sum(len(v) for v in iocs.values())
        print(f"   IOCs Found: {total_iocs}")
        for ioc_type, values in iocs.items():
            if values:
                print(f"      - {ioc_type}: {', '.join(values[:3])}")
        
        ioas = classification.get('ioas', [])
        print(f"   IOAs Found: {len(ioas)}")
        for ioa in ioas[:3]:
            print(f"      - {ioa.get('type')}: {ioa.get('description')}")
        
        mitre = classification.get('mitre_mapping', [])
        print(f"   MITRE ATT&CK: {len(mitre)} techniques mapped")
        for technique in mitre[:3]:
            tid = technique.get('technique_id', '')
            name = technique.get('technique', '')
            print(f"      - {tid}: {name}")
        
        recommendations = classification.get('recommendations', [])
        print(f"   Recommendations: {len(recommendations)}")
        for rec in recommendations[:3]:
            print(f"      - {rec}")
        
        return classification
    else:
        print(f"✗ Classification failed: {response.text}")
        return None


def generate_iodef(alert_id):
    """Generate IODEF XML report."""
    url = f"{API_BASE}/api/alerts/generate_iodef"
    payload = {"id": alert_id, "save_to_file": True}
    
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        filename = data.get('saved_to')
        print(f"✓ Generated IODEF report: {filename}")
        return data.get('iodef_xml')
    else:
        print(f"✗ IODEF generation failed: {response.text}")
        return None


def send_to_opencti(alert_id):
    """Send alert to OpenCTI."""
    # First check if OpenCTI is configured
    status_url = f"{API_BASE}/api/alerts/opencti_status"
    status_response = requests.get(status_url)
    
    if status_response.status_code == 200:
        status = status_response.json()
        if not status.get('enabled'):
            print("⚠ OpenCTI not configured - skipping")
            return False
        if not status.get('connected'):
            print(f"⚠ OpenCTI not connected: {status.get('message')}")
            return False
    
    url = f"{API_BASE}/api/alerts/send_to_opencti"
    payload = {"id": alert_id}
    
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"✓ Sent to OpenCTI successfully")
            return True
        else:
            print(f"✗ OpenCTI submission failed: {data.get('message')}")
            return False
    else:
        print(f"✗ OpenCTI request failed: {response.text}")
        return False


def main():
    print("=" * 70)
    print("Alert Detection and Intelligence System - Demo")
    print("=" * 70)
    
    # Sample alerts with different characteristics
    test_cases = [
        {
            "title": "Suspicious PowerShell Execution",
            "description": """
            PowerShell executed with encoded command from suspicious process.
            Source IP: 192.168.1.50
            Destination: 185.220.101.45:4444
            Command: powershell -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0
            File hash: 44d88612fea8a8f36de82e1278abb02f
            MITRE: T1059.001
            """,
            "severity": "High"
        },
        {
            "title": "Phishing Email Detected",
            "description": """
            Suspicious email received from spoofed sender.
            From: ceo@malicious-domain.com
            Subject: Urgent: Reset your password at http://phishing-site.com/login
            Contains attachment: invoice.exe
            Targeted user: admin@company.com
            """,
            "severity": "Critical"
        },
        {
            "title": "Lateral Movement via PSExec",
            "description": """
            Lateral movement detected using psexec.exe
            Source: WORKSTATION-01 (10.0.0.15)
            Target: SERVER-DC01 (10.0.0.5)
            Tool: psexec.exe
            Credential dump attempted via mimikatz
            Privilege escalation to SYSTEM
            """,
            "severity": "Critical"
        },
        {
            "title": "Data Exfiltration Attempt",
            "description": """
            Large data transfer detected to external IP
            Internal Host: 10.0.0.25
            External IP: 203.0.113.50
            Data Volume: 5.2 GB
            Protocol: HTTPS
            Destination: cloud-storage-evil.com
            CVE-2024-1234 exploitation suspected
            """,
            "severity": "High"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'─' * 70}")
        print(f"Test Case {i}: {test_case['title']}")
        print(f"{'─' * 70}")
        
        # Create alert
        alert_id = create_sample_alert(
            test_case['title'],
            test_case['description'],
            test_case['severity']
        )
        
        if not alert_id:
            continue
        
        # Wait a moment
        time.sleep(0.5)
        
        # Classify alert (IOC/IOA detection)
        classification = classify_alert(alert_id)
        
        if classification:
            # Generate IODEF report
            print(f"\n📄 Generating IODEF report...")
            iodef_xml = generate_iodef(alert_id)
            
            # Send to OpenCTI (if configured)
            print(f"\n☁️ Sending to OpenCTI...")
            opencti_success = send_to_opencti(alert_id)
            
            results.append({
                'alert_id': alert_id,
                'title': test_case['title'],
                'classification': classification,
                'iodef_generated': bool(iodef_xml),
                'opencti_sent': opencti_success
            })
    
    # Summary
    print(f"\n{'=' * 70}")
    print("Summary")
    print(f"{'=' * 70}")
    print(f"Total alerts created: {len(results)}")
    print(f"Successfully classified: {len([r for r in results if r.get('classification')])}")
    print(f"IODEF reports generated: {len([r for r in results if r.get('iodef_generated')])}")
    print(f"Sent to OpenCTI: {len([r for r in results if r.get('opencti_sent')])}")
    
    print(f"\n✓ Demo complete!")
    print(f"\nView alerts in the web UI: {API_BASE}/soc/pages/alerts.html")
    print(f"IODEF reports saved to: ./iodef_reports/")
    print(f"\nTo configure OpenCTI integration:")
    print(f"  export OPENCTI_URL=http://opencti-server:8080")
    print(f"  export OPENCTI_API_KEY=your-api-key")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user")
    except Exception as e:
        print(f"\n\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
