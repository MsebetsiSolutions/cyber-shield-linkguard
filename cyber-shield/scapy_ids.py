#!/usr/bin/env python3
"""Lightweight Snort-like IDS using Scapy.

Usage:
  python scapy_ids.py --rules scapy_rules.txt --iface eth0

Rules format (very small subset, one rule per line):
  alert tcp any any -> any 80 (msg:"HTTP GET"; content:"GET"; sid:1001; rev:1;)

This file implements a minimal rule parser and a live sniffer that posts
alerts to the monitoring server at `/api/monitoring/snort/push` (same as the
existing snort_agent expects).
"""
import os
import re
import argparse
import time
import json
from datetime import datetime

try:
    from scapy.all import sniff, IP, IPv6, TCP, UDP, get_if_list
    _SCAPY = True
except Exception:
    _SCAPY = False

import requests

SERVER = os.environ.get('MONITOR_SERVER', 'http://127.0.0.1:5000')
API_KEY = os.environ.get('MONITOR_TOKEN', '')

HEADERS = {'Content-Type': 'application/json'}
if API_KEY:
    HEADERS['Authorization'] = f'Bearer {API_KEY}'


class Rule:
    RULE_RE = re.compile(r'^(?P<action>alert)\s+(?P<proto>\w+)\s+(?P<src>\S+)\s+(?P<srcp>\S+)\s+->\s+(?P<dst>\S+)\s+(?P<dstp>\S+)\s*\((?P<body>.*)\)')

    def __init__(self, proto, src, srcp, dst, dstp, msg=None, content=None, sid=None, rev=None, priority=1):
        self.proto = proto.lower()
        self.src = src
        self.srcp = srcp
        self.dst = dst
        self.dstp = dstp
        self.msg = msg or ''
        self.content = content
        self.sid = sid or 0
        self.rev = rev or 1
        self.priority = priority

    @classmethod
    def parse(cls, line):
        m = cls.RULE_RE.search(line)
        if not m:
            return None
        body = m.group('body')
        # simple key:value parser inside parentheses
        kv = {}
        for part in re.split(r';\s*', body):
            if not part.strip():
                continue
            k_v = part.split(':', 1)
            if len(k_v) == 2:
                k = k_v[0].strip()
                v = k_v[1].strip().strip('"')
                kv[k] = v
        msg = kv.get('msg')
        content = kv.get('content')
        sid = int(kv.get('sid')) if kv.get('sid') and kv.get('sid').isdigit() else None
        rev = int(kv.get('rev')) if kv.get('rev') and kv.get('rev').isdigit() else None
        pr = int(kv.get('priority')) if kv.get('priority') and kv.get('priority').isdigit() else 1
        return cls(m.group('proto'), m.group('src'), m.group('srcp'), m.group('dst'), m.group('dstp'), msg=msg, content=content, sid=sid, rev=rev, priority=pr)

    def match_addr(self, rule_addr, pkt_addr):
        if rule_addr == 'any':
            return True
        return rule_addr == pkt_addr

    def match_port(self, rule_port, pkt_port):
        if rule_port == 'any':
            return True
        try:
            return int(rule_port) == int(pkt_port)
        except Exception:
            return False

    def matches(self, pkt):
        # proto
        proto_ok = False
        if self.proto == 'tcp' and pkt.haslayer(TCP):
            proto_ok = True
        elif self.proto == 'udp' and pkt.haslayer(UDP):
            proto_ok = True
        elif self.proto == 'ip' and (pkt.haslayer(TCP) or pkt.haslayer(UDP)):
            proto_ok = True
        if not proto_ok:
            return False

        # addresses
        try:
            if pkt.haslayer(IP):
                src = pkt[IP].src
                dst = pkt[IP].dst
            elif pkt.haslayer(IPv6):
                src = pkt[IPv6].src
                dst = pkt[IPv6].dst
            else:
                src = ''
                dst = ''
        except Exception:
            src = ''
            dst = ''

        if not self.match_addr(self.src, src) and self.src != 'any':
            return False
        if not self.match_addr(self.dst, dst) and self.dst != 'any':
            return False

        # ports
        sport = None
        dport = None
        try:
            if pkt.haslayer(TCP):
                sport = pkt[TCP].sport
                dport = pkt[TCP].dport
            elif pkt.haslayer(UDP):
                sport = pkt[UDP].sport
                dport = pkt[UDP].dport
        except Exception:
            pass

        if self.srcp != 'any' and sport is not None:
            if not self.match_port(self.srcp, sport):
                return False
        if self.dstp != 'any' and dport is not None:
            if not self.match_port(self.dstp, dport):
                return False

        # content match on payload bytes
        if self.content:
            try:
                raw = bytes(pkt.payload)
                if isinstance(self.content, str):
                    pat = self.content.encode(errors='ignore')
                else:
                    pat = self.content
                if pat not in raw:
                    return False
            except Exception:
                return False

        return True


def load_rules(path):
    rules = []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for ln in f:
                ln = ln.strip()
                if not ln or ln.startswith('#'):
                    continue
                r = Rule.parse(ln)
                if r:
                    rules.append(r)
    except Exception as e:
        print('[ERROR] could not load rules:', e)
    return rules


def make_alert(rule, pkt):
    now = datetime.utcnow().isoformat() + 'Z'
    try:
        if pkt.haslayer(IP):
            src = pkt[IP].src
            dst = pkt[IP].dst
        elif pkt.haslayer(IPv6):
            src = pkt[IPv6].src
            dst = pkt[IPv6].dst
        else:
            src = ''
            dst = ''
    except Exception:
        src = ''
        dst = ''

    sport = None
    dport = None
    try:
        if pkt.haslayer(TCP):
            sport = pkt[TCP].sport
            dport = pkt[TCP].dport
        elif pkt.haslayer(UDP):
            sport = pkt[UDP].sport
            dport = pkt[UDP].dport
    except Exception:
        pass

    alert = {
        'timestamp': now,
        'priority': rule.priority,
        'classification': f"1:{rule.sid or 0}:{rule.rev or 1}",
        'message': rule.msg or f"{rule.proto} rule matched",
        'source': f"{src}:{sport}" if sport else src,
        'destination': f"{dst}:{dport}" if dport else dst,
        'protocol': rule.proto,
        'sid': rule.sid,
        'rev': rule.rev,
        'raw': None,
    }
    try:
        alert['raw'] = bytes(pkt).hex()
    except Exception:
        alert['raw'] = None
    return alert


class ScapyIDS:
    def __init__(self, iface=None, rules=None, dry_run=False):
        self.iface = iface
        self.rules = rules or []
        self.dry_run = dry_run

    def post_alert(self, alert):
        url = SERVER.rstrip('/') + '/api/monitoring/snort/push'
        if self.dry_run:
            print('[ALERT-DRY]', json.dumps(alert, indent=2))
            return True
        try:
            r = requests.post(url, headers=HEADERS, json=alert, timeout=5)
            if not r.ok:
                print('[WARN] push failed', r.status_code, r.text)
                return False
            return True
        except Exception as e:
            print('[ERROR] push failed:', e)
            return False

    def packet_callback(self, pkt):
        for r in self.rules:
            try:
                if r.matches(pkt):
                    alert = make_alert(r, pkt)
                    print('[INFO] rule matched:', r.msg or r.sid)
                    self.post_alert(alert)
            except Exception:
                continue

    def run(self):
        if not _SCAPY:
            print('[ERROR] scapy not available in this environment')
            return
        print('[INFO] starting Scapy IDS, interface=', self.iface, 'rules=', len(self.rules))
        try:
            sniff(iface=self.iface, prn=self.packet_callback, store=False)
        except KeyboardInterrupt:
            print('[INFO] stopped by user')
        except Exception as e:
            print('[ERROR] sniff failed:', e)


def main():
    p = argparse.ArgumentParser(description='Scapy-based Snort-like IDS (minimal)')
    p.add_argument('--rules', '-r', default='scapy_rules.txt', help='Rules file path')
    p.add_argument('--iface', '-i', default=None, help='Interface to sniff (optional)')
    p.add_argument('--list-ifs', action='store_true', help='List available interfaces and exit')
    p.add_argument('--dry-run', action='store_true', help='Do not POST alerts, just print')
    args = p.parse_args()

    # list interfaces if requested
    if args.list_ifs:
        if not _SCAPY:
            print('scapy not available')
            return
        try:
            ifs = get_if_list()
            print('\n'.join(ifs))
        except Exception as e:
            print('failed to list interfaces:', e)
        return

    rules = load_rules(args.rules)
    if not rules:
        print('[WARN] no rules loaded - nothing will match')

    ids = ScapyIDS(iface=args.iface, rules=rules, dry_run=args.dry_run)
    # check iface presence early and provide friendly message on Windows
    if args.iface:
        if not _SCAPY:
            print('[ERROR] scapy not available in this environment')
            return
        try:
            if args.iface not in get_if_list():
                print(f"[ERROR] interface '{args.iface}' not found. Available interfaces:")
                for i in get_if_list():
                    print('  ', i)
                print("Use one of the above names (Windows often uses friendly names like 'Ethernet' or 'Wi-Fi').")
                return
        except Exception:
            pass

    ids.run()


if __name__ == '__main__':
    main()
