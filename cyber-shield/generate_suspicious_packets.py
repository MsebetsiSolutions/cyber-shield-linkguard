#!/usr/bin/env python3
"""
Generate suspicious packets to trigger sniffer IDS alert detection.

This script sends various packets with patterns that match the sniffer 
detection rules defined in monitoring.py:
  - Suspicious TCP flags (SYN+FIN, SYN+RST, FIN+RST)
  - Port scanning activity (low src port to standard ports)
  - Large packets (>5000 bytes)
  - Traffic to unusual ports (4444, 5555, 6666, 7777, 8888, 9999, 31337)

Prerequisites:
  - scapy installed: pip install scapy
  - Run with administrator/root privileges
  
Usage:
  python generate_suspicious_packets.py
  
This will generate packets on your local machine that the sniffer will capture
and analyze, triggering alerts in soc_dashboard.db that appear on the Alerts page.
"""

import sys
import time

try:
    from scapy.all import IP, TCP, UDP, send, get_if_list
except ImportError:
    print("ERROR: scapy is not installed.")
    print("Install with: pip install scapy")
    sys.exit(1)


def send_suspicious_tcp_flags():
    """Generate packets with suspicious TCP flag combinations."""
    print("\n[1] Sending packets with suspicious TCP flags...")
    
    # SYN+FIN (suspicious: connection initiation + termination simultaneously)
    try:
        pkt = IP(dst="127.0.0.1") / TCP(dport=443, flags="SF", sport=12345)
        print("    → SYN+FIN to port 443")
        send(pkt, verbose=0)
        time.sleep(0.3)
    except Exception as e:
        print(f"    ✗ SYN+FIN failed: {e}")
    
    # SYN+RST (suspicious: initiation + reset simultaneously)
    try:
        pkt = IP(dst="127.0.0.1") / TCP(dport=22, flags="SR", sport=12346)
        print("    → SYN+RST to port 22")
        send(pkt, verbose=0)
        time.sleep(0.3)
    except Exception as e:
        print(f"    ✗ SYN+RST failed: {e}")
    
    # FIN+RST (suspicious: both close flags together)
    try:
        pkt = IP(dst="127.0.0.1") / TCP(dport=80, flags="FR", sport=12347)
        print("    → FIN+RST to port 80")
        send(pkt, verbose=0)
        time.sleep(0.3)
    except Exception as e:
        print(f"    ✗ FIN+RST failed: {e}")


def send_port_scan_pattern():
    """Generate packets mimicking port scanning behavior."""
    print("\n[2] Sending port scan activity pattern...")
    
    # Low source port (< 1024) to multiple common service ports
    target_ports = [80, 443, 22, 21]
    for dst_port in target_ports:
        try:
            pkt = IP(dst="127.0.0.1") / TCP(sport=500, dport=dst_port, flags="S")
            print(f"    → SYN from port 500 to port {dst_port}")
            send(pkt, verbose=0)
            time.sleep(0.2)
        except Exception as e:
            print(f"    ✗ Port {dst_port} failed: {e}")


def send_large_packets():
    """Generate large packets (potential exfiltration)."""
    print("\n[3] Sending large packets (>5000 bytes)...")
    
    payload = "X" * 6000  # 6KB payload
    try:
        pkt = IP(dst="127.0.0.1") / TCP(dport=443, sport=12348) / payload
        print(f"    → Large packet ({len(payload)} bytes) to port 443")
        send(pkt, verbose=0)
        time.sleep(0.3)
    except Exception as e:
        print(f"    ✗ Large packet failed: {e}")


def send_unusual_port_traffic():
    """Generate traffic to unusual/suspicious ports."""
    print("\n[4] Sending traffic to unusual ports...")
    
    unusual_ports = [4444, 5555, 6666, 7777, 8888, 9999, 31337]
    for port in unusual_ports[:3]:  # Send to first 3 to keep it quick
        try:
            pkt = IP(dst="127.0.0.1") / TCP(dport=port, sport=12349, flags="S")
            print(f"    → Connection attempt to port {port}")
            send(pkt, verbose=0)
            time.sleep(0.2)
        except Exception as e:
            print(f"    ✗ Port {port} failed: {e}")


def main():
    print("=" * 70)
    print("Suspicious Packet Generator")
    print("=" * 70)
    print("\nThis script generates suspicious network packets to trigger")
    print("the sniffer IDS alert detection in monitoring.py.")
    print("\nExpected result:")
    print("  • Packets are captured by the sniffer")
    print("  • Detection rules generate alerts")
    print("  • Alerts are stored in soc_dashboard.db")
    print("  • Alerts appear on the Alerts page when you refresh")
    print("\n" + "=" * 70)
    
    # Check if scapy is available
    if not sys.platform.startswith('linux') and not sys.platform.startswith('win') and not sys.platform.startswith('darwin'):
        print(f"\nWARNING: Unsupported platform: {sys.platform}")
        print("This script is tested on Linux, Windows, and macOS.")
    
    print("\nGenerating packets...\n")
    
    try:
        send_suspicious_tcp_flags()
        send_port_scan_pattern()
        send_large_packets()
        send_unusual_port_traffic()
        
        print("\n" + "=" * 70)
        print("✓ Packet generation complete!")
        print("=" * 70)
        print("\nNext steps:")
        print("  1. Make sure the sniffer is running on the Monitoring page")
        print("  2. Wait 2-3 seconds for alerts to be processed")
        print("  3. Refresh the Alerts page in your browser")
        print("  4. You should see new alerts with source='sniffer'")
        print("\nAlert details:")
        print("  • Severity: Low, Medium, or High (based on rule)")
        print("  • Source: 'sniffer'")
        print("  • Description: Contains packet details (src/dst/ports)")
        print("=" * 70 + "\n")
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        print("\nMake sure:")
        print("  • You have admin/root privileges")
        print("  • Scapy is installed (pip install scapy)")
        print("  • Network interfaces are available")
        sys.exit(1)


if __name__ == "__main__":
    main()
