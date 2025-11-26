#!/usr/bin/env python3
"""
Generate alerts by posting directly to the SOC API.

This method is more reliable on Windows than packet capture.
It simulates various alert scenarios by POSTing to /api/monitoring/snort/push

Usage:
  python generate_alerts_direct.py
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def post_alert(title, severity, message, source_ip, dest_ip, protocol="TCP", priority=None):
    """Post an alert to the SOC backend."""
    
    if priority is None:
        # Convert severity to priority (1=Critical, 2=High, 3=Medium, 4+=Low)
        severity_map = {
            "Critical": 1,
            "High": 2,
            "Medium": 3,
            "Low": 4
        }
        priority = severity_map.get(severity, 4)
    
    payload = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "priority": priority,
        "classification": title,
        "message": message,
        "source": source_ip,
        "destination": dest_ip,
        "protocol": protocol
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/monitoring/snort/push",
            json=payload,
            timeout=5
        )
        if response.status_code in [200, 201]:
            print(f"  ✓ Alert posted: {title}")
            return True
        else:
            print(f"  ✗ Failed: {response.status_code} - {response.text[:100]}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def main():
    print("=" * 70)
    print("SOC Alert Generator (Direct API)")
    print("=" * 70)
    print("\nGenerating various alert scenarios...\n")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/api/monitoring/sniffer/status", timeout=3)
        if response.status_code != 200:
            print("ERROR: SOC server not responding at http://localhost:5000")
            print("Make sure to start the server: python app.py")
            return
    except Exception as e:
        print(f"ERROR: Cannot connect to SOC server: {e}")
        print("Make sure to start the server: python app.py")
        return
    
    # Scenario 1: Suspicious TCP Flags
    print("[1] Suspicious TCP Flags Alerts")
    post_alert(
        title="Suspicious TCP Flags: SYN+FIN",
        severity="Medium",
        message="Packet with suspicious TCP flag combination (SYN+FIN) detected",
        source_ip="192.168.1.105",
        dest_ip="10.0.0.50",
        protocol="TCP",
        priority=3
    )
    time.sleep(0.3)
    
    post_alert(
        title="Suspicious TCP Flags: SYN+RST",
        severity="Medium",
        message="Packet with suspicious TCP flag combination (SYN+RST) detected",
        source_ip="192.168.1.106",
        dest_ip="10.0.0.51",
        protocol="TCP",
        priority=3
    )
    time.sleep(0.3)
    
    # Scenario 2: Port Scanning Activity
    print("\n[2] Port Scanning Activity Alerts")
    for port in [80, 443, 22]:
        post_alert(
            title="Possible Port Scan Activity",
            severity="Low",
            message=f"Connection attempt from low-numbered port to standard service port {port}",
            source_ip="203.0.113.45",
            dest_ip="192.168.1.20",
            protocol="TCP",
            priority=4
        )
        time.sleep(0.2)
    
    # Scenario 3: Large Packet Detection
    print("\n[3] Large Packet Detection")
    post_alert(
        title="Large Packet Detected",
        severity="Low",
        message="Unusually large packet (6000+ bytes) detected - possible data exfiltration",
        source_ip="192.168.1.110",
        dest_ip="203.0.113.100",
        protocol="TCP",
        priority=4
    )
    time.sleep(0.3)
    
    # Scenario 4: Unusual Port Traffic
    print("\n[4] Unusual Port Traffic Alerts")
    unusual_ports = [4444, 5555, 6666, 7777]
    for port in unusual_ports:
        post_alert(
            title=f"Traffic to Unusual Port: {port}",
            severity="Medium",
            message=f"Connection to suspicious/unusual port {port}",
            source_ip="192.168.1.115",
            dest_ip="10.20.30.40",
            protocol="TCP",
            priority=3
        )
        time.sleep(0.2)
    
    # Scenario 5: C2 Communication Pattern
    print("\n[5] Possible C2 Communication Pattern")
    post_alert(
        title="Possible C2 Communication",
        severity="High",
        message="Outbound connection to known malware C2 server",
        source_ip="192.168.1.50",
        dest_ip="198.51.100.75",
        protocol="TCP",
        priority=2
    )
    time.sleep(0.3)
    
    # Scenario 6: Data Exfiltration
    print("\n[6] Possible Data Exfiltration")
    post_alert(
        title="Suspicious Data Transfer",
        severity="High",
        message="Large volume of data transferred to external IP address",
        source_ip="192.168.1.78",
        dest_ip="192.0.2.100",
        protocol="TCP",
        priority=2
    )
    time.sleep(0.3)
    
    # Scenario 7: Multiple Failed Login Attempts
    print("\n[7] Brute Force Attack Pattern")
    post_alert(
        title="Multiple Failed Login Attempts",
        severity="High",
        message="20+ failed SSH login attempts detected from same source",
        source_ip="198.51.100.200",
        dest_ip="192.168.1.25",
        protocol="TCP",
        priority=2
    )
    time.sleep(0.3)
    
    # Scenario 8: Potential Ransomware Activity
    print("\n[8] Potential Ransomware Activity")
    post_alert(
        title="Ransomware-like Behavior Detected",
        severity="Critical",
        message="High volume of file encryption activity detected on system",
        source_ip="192.168.1.99",
        dest_ip="192.168.1.1",
        protocol="TCP",
        priority=1
    )
    
    print("\n" + "=" * 70)
    print("✓ Alert generation complete!")
    print("=" * 70)
    print("\nNext steps:")
    print("  1. Open the SOC Dashboard in your browser: http://localhost:5000")
    print("  2. Go to the 'Alerts' page")
    print("  3. Click 'Refresh' to see the new alerts")
    print("  4. You should see ~13 alerts with various severities")
    print("\nAlert features to explore:")
    print("  • Filter by severity (High, Medium, Low, Critical)")
    print("  • Sort by severity or timestamp")
    print("  • Click on an alert to view details")
    print("  • Assign alerts to analysts")
    print("  • Change alert status (New, In Progress, Resolved, etc.)")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
