# backend/routes_intel.py
from __future__ import annotations

import os
import re
import json
import base64
import ipaddress
from typing import Any, Dict, List, Optional, Tuple

import requests
from flask import Blueprint, request, jsonify, Response

import uuid
from datetime import datetime

intel_bp = Blueprint("intel", __name__)

# --------------------------- Config & Helpers ------------------------------ #

TIMEOUT = (10, 25)  # connect, read seconds
UA = "Msebetsi-SOC-Intel/1.0"

# Simple secret accessor
def get_secret(name: str) -> Optional[str]:
    env_variants = [
        name,
        name.upper(),
        f"SOC_{name}",
        f"SOC_{name.upper()}",
    ]
    for v in env_variants:
        if os.getenv(v):
            return os.getenv(v)
    return None

# Basic validators / regex
RE_DOMAIN = re.compile(r"\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+)\b", re.I)
RE_URL = re.compile(r"https?://[^\s\"'<>]+", re.I)
RE_HASH = re.compile(r"\b([A-Fa-f0-9]{32}|[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})\b")
RE_TID = re.compile(r"\bT\d{4}(?:\.\d{3})?\b", re.I)

def is_ip(s: str) -> bool:
    try:
        ipaddress.ip_address(s)
        return True
    except Exception:
        return False

def unique(seq: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def normalize_iocs(text: str) -> Dict[str, List[str]]:
    ips = []
    domains = []
    urls = []
    hashes = []

    # URLs first
    for m in RE_URL.finditer(text or ""):
        urls.append(m.group(0).strip().rstrip(").,;"))

    # Split by non-word to find potential IPs/domains/hashes
    tokens = re.split(r"[\s,;|()\[\]{}<>]+", text or "")
    for tok in tokens:
        if not tok:
            continue
        t = tok.strip().strip("',\"")
        if not t:
            continue
        if is_ip(t):
            ips.append(t)
        elif RE_HASH.fullmatch(t):
            hashes.append(t.lower())
        else:
            dm = RE_DOMAIN.fullmatch(t)
            if dm:
                domains.append(dm.group(1).lower())

    return {
        "ips": unique(ips),
        "domains": unique(domains),
        "urls": unique(urls),
        "hashes": unique(hashes),
    }

def extract_tactics(text: str) -> List[str]:
    return unique([m.group(0).upper() for m in RE_TID.finditer(text or "")])

def http_get_json(url: str, headers: Dict[str, str], params: Dict[str, Any] | None = None, verify: bool = True) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        r = requests.get(url, headers=headers, params=params or {}, timeout=TIMEOUT, verify=verify)
        if r.status_code >= 200 and r.status_code < 300:
            try:
                return r.json(), None
            except Exception as e:
                return None, f"JSON decode failed for {url}: {e}"
        return None, f"{url} -> HTTP {r.status_code}"
    except requests.exceptions.Timeout:
        return None, f"Connection timeout to {url}"
    except requests.exceptions.ConnectionError:
        return None, f"Connection error to {url}"
    except requests.exceptions.RequestException as e:
        return None, f"Request failed: {str(e)}"

# --------------------------- TAXII / STIX ---------------------------------- #

def try_taxii_pull(server: str, collection_id: str, username: Optional[str], password: Optional[str]) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Pull STIX objects via TAXII 2.1 if taxii2client is installed.
    Returns (objects, error).
    """
    try:
        from taxii2client.v21 import Server, Collection
    except Exception as e:
        return [], "taxii2-client not installed. Add to requirements to enable TAXII pull."

    try:
        if username and password:
            srv = Server(server, user=username, password=password, verify=True, timeout=TIMEOUT)
        else:
            srv = Server(server, verify=True, timeout=TIMEOUT)
        
        for api_root in srv.api_roots:
            for col in api_root.collections:
                if getattr(col, "id", "") == collection_id or getattr(col, "title", "") == collection_id:
                    c = Collection(col.url)
                    bundle = c.get_objects()
                    objs = bundle.get("objects", []) if isinstance(bundle, dict) else []
                    return objs, None
        return [], f"Collection {collection_id} not found on server."
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return [], f"Connection timeout to TAXII server: {server}"
        elif "connection" in error_msg.lower():
            return [], f"Connection error to TAXII server: {server}"
        else:
            return [], f"TAXII server error: {error_msg}"

def list_taxii_collections(server: str, username: Optional[str], password: Optional[str]) -> Tuple[List[Dict[str, str]], Optional[str]]:
    """
    Return a list of collections available on a TAXII 2.1 server.
    """
    try:
        from taxii2client.v21 import Server
    except Exception as e:
        return [], "taxii2-client not installed. Add to requirements to enable TAXII features."

    try:
        if username and password:
            srv = Server(server, user=username, password=password, verify=True, timeout=TIMEOUT)
        else:
            srv = Server(server, verify=True, timeout=TIMEOUT)

        out: List[Dict[str, str]] = []
        for api_root in srv.api_roots:
            for col in api_root.collections:
                out.append({
                    "id": getattr(col, "id", ""),
                    "title": getattr(col, "title", ""),
                    "url": getattr(col, "url", ""),
                    "api_root": getattr(api_root, "url", ""),
                })
        return out, None
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return [], f"Connection timeout to TAXII server: {server}"
        elif "connection" in error_msg.lower():
            return [], f"Connection error to TAXII server: {server}"
        else:
            return [], f"TAXII server error: {error_msg}"

def parse_stix_objects(objs: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Extract common IOCs from a STIX bundle."""
    ips: List[str] = []
    domains: List[str] = []
    urls: List[str] = []
    hashes: List[str] = []
    for o in objs or []:
        t = o.get("type")
        if t == "indicator":
            patt = o.get("pattern", "")
            ips += re.findall(r"ipv4-addr:value\s*=\s*'([^']+)'", patt)
            domains += re.findall(r"domain-name:value\s*=\s*'([^']+)'", patt)
            urls += re.findall(r"url:value\s*=\s*'([^']+)'", patt)
            hashes += re.findall(r"file:hashes\.'?\w+'?:\s*'([A-Fa-f0-9]{32,64})'", patt)
    return {
        "ips": unique([x for x in ips if is_ip(x)]),
        "domains": unique([x.lower() for x in domains]),
        "urls": unique(urls),
        "hashes": unique([h.lower() for h in hashes]),
    }

# --------------------------- Routes: IOC & Enrich --------------------------- #

@intel_bp.post("/api/ti/parse")
def ti_parse():
    """
    Parse/normalize IOCs from free text.
    """
    b = request.get_json(silent=True) or {}
    text = b.get("text", "")
    out = normalize_iocs(text)
    out["mitre"] = extract_tactics(text)
    return jsonify(out)

@intel_bp.post("/api/ti/enrich")
def ti_enrich():
    """
    Enrich a set of IOCs using multiple providers.
    """
    b = request.get_json(silent=True) or {}
    iocs = {
        "ips": b.get("ips") or [],
        "domains": b.get("domains") or [],
        "urls": b.get("urls") or [],
        "hashes": b.get("hashes") or [],
    }
    providers = set((b.get("providers") or ["vt", "otx", "abuseipdb"]))

    # Mock enrichment response for frontend
    results = []
    for provider in providers:
        results.append({
            "provider": provider,
            "results": {},
            "errors": []
        })

    return jsonify({"providers": list(providers), "results": results, "errors": []})

# --------------------------- Routes: STIX/TAXII ---------------------------- #

@intel_bp.post("/api/ti/stix/upload")
def ti_stix_upload():
    """
    Upload a STIX bundle and extract IOCs + ATT&CK TIDs.
    """
    objs: List[Dict[str, Any]] = []
    raw = None

    if request.files:
        f = request.files.get("file")
        if not f:
            return jsonify({"error": "Missing file"}), 400
        raw = f.read().decode("utf-8", errors="ignore")
    else:
        b = request.get_json(silent=True) or {}
        raw = b.get("bundle")

    if not raw:
        return jsonify({"error": "No bundle provided"}), 400

    try:
        bundle = json.loads(raw)
    except Exception as e:
        return jsonify({"error": f"Invalid JSON: {e}"}), 400

    objs = bundle.get("objects", []) if isinstance(bundle, dict) else []
    iocs = parse_stix_objects(objs)
    text_concat = json.dumps(objs)
    mitre = extract_tactics(text_concat)
    
    # Format objects for frontend display
    formatted_objects = []
    for obj in objs:
        formatted_objects.append({
            "id": obj.get("id", ""),
            "type": obj.get("type", "unknown"),
            "name": obj.get("name", obj.get("value", "N/A")),
            "description": obj.get("description", "No description"),
            "created": obj.get("created", ""),
            "modified": obj.get("modified", "")
        })
    
    return jsonify({
        "objects": len(objs), 
        "iocs": iocs, 
        "mitre": mitre,
        "formatted_objects": formatted_objects
    })

@intel_bp.post("/api/ti/taxii/pull")
def ti_taxii_pull():
    """
    Pull STIX objects via TAXII 2.1.
    """
    b = request.get_json(silent=True) or {}
    server = (b.get("server") or "").strip()
    collection_id = (b.get("collection_id") or "").strip()
    username = b.get("username")
    password = b.get("password")

    if not server or not collection_id:
        return jsonify({"error": "server and collection_id required"}), 400

    objs, err = try_taxii_pull(server, collection_id, username, password)
    if err:
        return jsonify({"error": err}), 501
        
    # Format objects for frontend
    formatted_objects = []
    for obj in objs:
        formatted_objects.append({
            "id": obj.get("id", ""),
            "type": obj.get("type", "unknown"),
            "name": obj.get("name", obj.get("value", "N/A")),
            "description": obj.get("description", "No description"),
            "created": obj.get("created", ""),
            "modified": obj.get("modified", "")
        })
    
    iocs = parse_stix_objects(objs)
    mitre = extract_tactics(json.dumps(objs))
    
    return jsonify({
        "objects": len(objs), 
        "iocs": iocs, 
        "mitre": mitre,
        "formatted_objects": formatted_objects
    })

@intel_bp.post("/api/ti/taxii/list")
def ti_taxii_list():
    """
    List collections from a TAXII 2.1 server.
    """
    b = request.get_json(silent=True) or {}
    server = (b.get("server") or "").strip()
    username = b.get("username")
    password = b.get("password")

    if not server:
        return jsonify({"error": "server is required"}), 400

    cols, err = list_taxii_collections(server, username, password)
    if err:
        return jsonify({"error": err}), 501
        
    return jsonify({"collections": cols, "count": len(cols)})

# --------------------------- Routes: MITRE Map ----------------------------- #

@intel_bp.post("/api/ti/mapping/attack")
def ti_mapping_attack():
    """
    Map indicators to MITRE ATT&CK techniques.
    """
    b = request.get_json(silent=True) or {}
    indicators = b.get("indicators", [])
    
    mapped_results = []
    for indicator in indicators:
        ind_value = indicator.get("indicator", "")
        ind_type = indicator.get("type", "")
        
        techniques = []
        tactics = []
        
        if ind_type == "ipv4-addr":
            techniques = ["T1071.001", "T1090", "T1568.002"]
            tactics = ["TA0011", "TA0010"]
        elif ind_type == "domain-name":
            if any(x in ind_value.lower() for x in ["mail", "smtp"]):
                techniques = ["T1566.001", "T1566.002"]
                tactics = ["TA0001"]
            else:
                techniques = ["T1583.001", "T1071.001"]
                tactics = ["TA0042", "TA0011"]
        elif ind_type == "url":
            if any(x in ind_value.lower() for x in ["exe", "zip", "download"]):
                techniques = ["T1105", "T1204.002"]
                tactics = ["TA0002", "TA0001"]
            else:
                techniques = ["T1566.001", "T1059.003"]
                tactics = ["TA0001", "TA0002"]
        elif "hash" in ind_type:
            techniques = ["T1204.002", "T1059.003", "T1547.001"]
            tactics = ["TA0002", "TA0003"]
        
        mapped_results.append({
            "indicator": ind_value,
            "techniques": techniques,
            "tactics": tactics
        })
    
    return jsonify({"results": mapped_results})

@intel_bp.post("/api/ti/heatmap")
def ti_heatmap():
    """
    Generate MITRE ATT&CK heatmap data.
    """
    b = request.get_json(silent=True) or {}
    mappings = b.get("mappings", {})
    
    tactics_techniques = {
        'Reconnaissance': ['T1595', 'T1592', 'T1589'],
        'Resource Development': ['T1583', 'T1584', 'T1585', 'T1586', 'T1587', 'T1588'],
        'Initial Access': ['T1566', 'T1195', 'T1078', 'T1133', 'T1200'],
        'Execution': ['T1059', 'T1106', 'T1129', 'T1053'],
        'Persistence': ['T1547', 'T1136', 'T1543', 'T1037', 'T1176'],
        'Defense Evasion': ['T1140', 'T1027', 'T1112', 'T1222', 'T1218'],
        'Credential Access': ['T1110', 'T1555', 'T1003', 'T1528'],
        'Discovery': ['T1083', 'T1135', 'T1040', 'T1018', 'T1518'],
        'Lateral Movement': ['T1021', 'T1550', 'T1534', 'T1570'],
        'Collection': ['T1113', 'T1115', 'T1213', 'T1005'],
        'Command & Control': ['T1071', 'T1090', 'T1571', 'T1572', 'T1568'],
        'Exfiltration': ['T1041', 'T1020', 'T1030', 'T1048', 'T1567'],
        'Impact': ['T1485', 'T1486', 'T1490', 'T1491', 'T1495', 'T1496']
    }
    
    technique_counts = {}
    for indicator_techniques in mappings.values():
        for technique in indicator_techniques:
            base_technique = technique.split('.')[0]
            technique_counts[base_technique] = technique_counts.get(base_technique, 0) + 1
    
    heatmap_data = {}
    for tactic, techniques in tactics_techniques.items():
        heatmap_data[tactic] = {}
        for technique in techniques:
            heatmap_data[tactic][technique] = technique_counts.get(technique, 0)
    
    return jsonify({
        "heatmap": heatmap_data,
        "total_indicators": len(mappings),
        "total_techniques": len(technique_counts)
    })

@intel_bp.post("/api/ti/stix/graph")
def ti_stix_graph():
    """
    Generate STIX relationship graph data.
    """
    b = request.get_json(silent=True) or {}
    stix_objects = b.get("objects", [])
    
    elements = generate_stix_graph_elements(stix_objects)
    
    return jsonify({
        "elements": elements,
        "node_count": len([e for e in elements if e.get("group") == "nodes"]),
        "edge_count": len([e for e in elements if e.get("group") == "edges"])
    })

def generate_stix_graph_elements(stix_objects):
    """Generate Cytoscape elements from STIX objects."""
    elements = []
    node_colors = {
        'indicator': '#d4af37',
        'malware': '#228b22', 
        'attack-pattern': '#b22222',
        'threat-actor': '#ff8c00',
        'campaign': '#8b4513',
        'identity': '#6a5acd',
        'vulnerability': '#ff1493'
    }
    
    # Add nodes
    for obj in stix_objects:
        obj_type = obj.get("type", "unknown")
        obj_id = obj.get("id", "")
        obj_name = obj.get("name", obj.get("value", "Unknown"))
        
        elements.append({
            "data": {
                "id": obj_id,
                "label": obj_name[:20] + "..." if len(obj_name) > 20 else obj_name,
                "type": obj_type,
                "description": obj.get("description", "No description"),
                "color": node_colors.get(obj_type, '#666666')
            },
            "group": "nodes"
        })
    
    # Add relationships
    edge_id = 0
    for i, source in enumerate(stix_objects):
        for j, target in enumerate(stix_objects):
            if i != j and should_create_relationship(source, target):
                elements.append({
                    "data": {
                        "id": f"edge-{edge_id}",
                        "source": source.get("id"),
                        "target": target.get("id"),
                        "label": infer_relationship(source, target)
                    },
                    "group": "edges"
                })
                edge_id += 1
    
    return elements

def should_create_relationship(source, target):
    """Determine if a relationship should be created between two STIX objects."""
    source_type = source.get("type")
    target_type = target.get("type")
    
    relationship_rules = {
        'threat-actor': ['malware', 'campaign'],
        'malware': ['attack-pattern', 'indicator'],
        'campaign': ['malware', 'attack-pattern'],
        'attack-pattern': ['indicator']
    }
    
    return target_type in relationship_rules.get(source_type, [])

def infer_relationship(source, target):
    """Infer relationship type between STIX objects."""
    source_type = source.get("type")
    target_type = target.get("type")
    
    relationship_map = {
        ('threat-actor', 'malware'): 'uses',
        ('threat-actor', 'campaign'): 'attributed-to',
        ('malware', 'attack-pattern'): 'uses', 
        ('malware', 'indicator'): 'indicates',
        ('campaign', 'malware'): 'uses',
        ('campaign', 'attack-pattern'): 'employs',
        ('attack-pattern', 'indicator'): 'detected-by'
    }
    
    return relationship_map.get((source_type, target_type), 'related-to')