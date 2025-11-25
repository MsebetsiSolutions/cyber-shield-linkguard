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

# Simple secret accessor — you can swap to DB/KMS in routes_settings
def get_secret(name: str) -> Optional[str]:
    # Try env with common patterns
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

    # URLs first (so we don't count domains inside)
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
    

@intel_bp.post("/api/ti/mapping/attack")
def ti_mapping_attack():
    """
    Map indicators to MITRE ATT&CK techniques (simplified version).
    Frontend expects: { results: [{indicator, techniques:[], tactics:[]}, ...] }
    """
    b = request.get_json(silent=True) or {}
    indicators = b.get("indicators", [])
    
    # Simplified mapping - in production, you'd use actual ATT&CK intelligence
    mapped_results = []
    for indicator in indicators:
        ind_value = indicator.get("indicator", "")
        ind_type = indicator.get("type", "")
        
        # Simple heuristic mapping based on indicator type and content
        techniques = []
        tactics = []
        
        if ind_type == "ipv4-addr":
            techniques = ["T1071.001"]  # Application Layer Protocol: Web Protocols
            tactics = ["TA0011", "TA0010"]  # Command and Control, Exfiltration
        elif ind_type == "domain-name" and any(x in ind_value.lower() for x in ["mail", "smtp"]):
            techniques = ["T1566.001"]  # Phishing: Spearphishing Attachment
            tactics = ["TA0001"]  # Initial Access
        elif ind_type == "url" and any(x in ind_value.lower() for x in ["exe", "zip", "download"]):
            techniques = ["T1105"]  # Ingress Tool Transfer
            tactics = ["TA0002"]  # Execution
        
        mapped_results.append({
            "indicator": ind_value,
            "techniques": techniques,
            "tactics": tactics
        })
    
    return jsonify({"results": mapped_results})

@intel_bp.post("/api/siem/forward")
def siem_forward():
    """
    Forward indicators to SIEM (alternative to /api/ti/push).
    Uses the same logic as ti_push but with different expected input format.
    """
    b = request.get_json(silent=True) or {}
    indicators = b.get("indicators", [])
    
    # Convert frontend format to iocs format
    iocs = {"ips": [], "domains": [], "urls": [], "hashes": []}
    for ind in indicators:
        indicator = ind.get("indicator", "")
        ind_type = ind.get("type", "")
        
        if ind_type == "ipv4-addr":
            iocs["ips"].append(indicator)
        elif ind_type == "domain-name":
            iocs["domains"].append(indicator)
        elif ind_type == "url":
            iocs["urls"].append(indicator)
        elif "hash" in ind_type:
            iocs["hashes"].append(indicator)
    
    # Use existing ti_push logic
    source = "ti"
    sourcetype = "msebetsi:ti"
    hec_url = get_secret("splunk_hec_url") or ""
    hec_token = get_secret("splunk_hec_token") or ""
    
    if not hec_url or not hec_token:
        return jsonify({"error": "Missing HEC url/token"}), 400

    headers = {
        "Authorization": f"Splunk {hec_token}",
        "Content-Type": "application/json",
        "User-Agent": UA,
    }

    event = {
        "event": {"type": "ioc_batch", "iocs": iocs},
        "source": source,
        "sourcetype": sourcetype,
    }
    
    try:
        r = requests.post(hec_url + "/services/collector", headers=headers, 
                         data=json.dumps(event), timeout=TIMEOUT, verify=True)
        return Response(r.text, status=r.status_code, 
                       mimetype="application/json" if "json" in (r.headers.get("content-type", "")) else "text/plain")
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

@intel_bp.post("/api/webhooks/relay")
def webhooks_relay():
    """
    Relay webhook notifications for high-risk IOCs.
    Body: { "webhooks": [{url, threshold}], "items": [indicator_data] }
    """
    b = request.get_json(silent=True) or {}
    webhooks = b.get("webhooks", [])
    items = b.get("items", [])
    
    results = []
    for wh in webhooks:
        url = wh.get("url", "").strip()
        threshold = wh.get("threshold", 80)
        
        if not url:
            continue
            
        # Filter items by threshold
        high_risk_items = [item for item in items if item.get("risk", 0) >= threshold]
        
        if not high_risk_items:
            continue
            
        payload = {
            "text": f"🚨 Msebetsi SOC Alert: {len(high_risk_items)} high-risk IOCs detected",
            "attachments": [
                {
                    "title": "High Risk Indicators",
                    "fields": [
                        {
                            "title": item.get("indicator", "Unknown"),
                            "value": f"Risk: {item.get('risk', 0)} | Type: {item.get('type', 'Unknown')}",
                            "short": True
                        }
                        for item in high_risk_items[:10]  # Limit to first 10
                    ],
                    "color": "danger" if any(item.get("risk", 0) >= 90 for item in high_risk_items) else "warning"
                }
            ]
        }
        
        headers = {"Content-Type": "application/json", "User-Agent": UA}
        try:
            r = requests.post(url, headers=headers, data=json.dumps(payload), 
                             timeout=TIMEOUT, verify=True)
            results.append({
                "url": url,
                "status": r.status_code,
                "success": 200 <= r.status_code < 300
            })
        except requests.RequestException as e:
            results.append({
                "url": url,
                "status": "error",
                "error": str(e)
            })
    
    return jsonify({"results": results})


# --------------------------- Enrichment Providers -------------------------- #

def vt_enrich(iocs: Dict[str, List[str]]) -> Dict[str, Any]:
    """VirusTotal v3 public endpoints. Keys: 'virustotal_api_key' (from env or settings)."""
    api_key = get_secret("virustotal_api_key")
    out: Dict[str, Any] = {"provider": "virustotal", "results": {}, "errors": []}
    if not api_key:
        out["errors"].append("Missing API key.")
        return out

    headers = {"x-apikey": api_key, "User-Agent": UA}
    # Hashes and URLs/Domains/IPs: VT has different endpoints
    # Hash
    for h in iocs.get("hashes", [])[:20]:  # keep it modest
        url = f"https://www.virustotal.com/api/v3/files/{h}"
        j, err = http_get_json(url, headers)
        if err: out["errors"].append(err)
        out["results"][f"hash:{h}"] = j

    # Domain
    for d in iocs.get("domains", [])[:20]:
        url = f"https://www.virustotal.com/api/v3/domains/{d}"
        j, err = http_get_json(url, headers)
        if err: out["errors"].append(err)
        out["results"][f"domain:{d}"] = j

    # IP
    for ip in iocs.get("ips", [])[:20]:
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
        j, err = http_get_json(url, headers)
        if err: out["errors"].append(err)
        out["results"][f"ip:{ip}"] = j

    # URL — requires URL ID (base64url)
    for u in iocs.get("urls", [])[:10]:
        try:
            url_id = base64.urlsafe_b64encode(u.encode()).decode().strip("=")
            url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
            j, err = http_get_json(url, headers)
            if err: out["errors"].append(err)
            out["results"][f"url:{u}"] = j
        except Exception as e:
            out["errors"].append(f"URL encode failed: {u} ({e})")

    return out

def otx_enrich(iocs: Dict[str, List[str]]) -> Dict[str, Any]:
    """AlienVault OTX v1. Key: 'otx_api_key'."""
    api_key = get_secret("otx_api_key")
    out: Dict[str, Any] = {"provider": "otx", "results": {}, "errors": []}
    if not api_key:
        out["errors"].append("Missing API key.")
        return out

    headers = {"X-OTX-API-KEY": api_key, "User-Agent": UA}

    for ip in iocs.get("ips", [])[:20]:
        url = f"https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general"
        j, err = http_get_json(url, headers)
        if err: out["errors"].append(err)
        out["results"][f"ip:{ip}"] = j

    for d in iocs.get("domains", [])[:20]:
        url = f"https://otx.alienvault.com/api/v1/indicators/domain/{d}/general"
        j, err = http_get_json(url, headers)
        if err: out["errors"].append(err)
        out["results"][f"domain:{d}"] = j

    for h in iocs.get("hashes", [])[:20]:
        url = f"https://otx.alienvault.com/api/v1/indicators/file/{h}/general"
        j, err = http_get_json(url, headers)
        if err: out["errors"].append(err)
        out["results"][f"hash:{h}"] = j

    return out

def abuseipdb_enrich(iocs: Dict[str, List[str]]) -> Dict[str, Any]:
    """AbuseIPDB v2. Key: 'abuseipdb_api_key' (optional)."""
    api_key = get_secret("abuseipdb_api_key")
    out: Dict[str, Any] = {"provider": "abuseipdb", "results": {}, "errors": []}
    if not api_key:
        out["errors"].append("Missing API key.")
        return out

    headers = {"Key": api_key, "Accept": "application/json", "User-Agent": UA}
    for ip in iocs.get("ips", [])[:50]:
        url = "https://api.abuseipdb.com/api/v2/check"
        j, err = http_get_json(url, headers, params={"ipAddress": ip, "maxAgeInDays": 90})
        if err: out["errors"].append(err)
        out["results"][f"ip:{ip}"] = j

    return out


# --------------------------- TAXII / STIX ---------------------------------- #

def try_taxii_pull(server: str, collection_id: str, username: Optional[str], password: Optional[str]) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Pull STIX objects via TAXII 2.1 if taxii2client is installed.
    Returns (objects, error).
    """
    try:
        # optional dependency
        from taxii2client.v21 import Server, Collection  # type: ignore
    except Exception as e:
        return [], "taxii2-client not installed. Add 'taxii2-client' to requirements.txt to enable TAXII pull."

    try:
        auth = None
        if username and password:
            auth = (username, password)
            
        # Create server connection
        srv = Server(server, auth=auth, verify=True, timeout=TIMEOUT[0])
        
        # Get all collections
        collections = []
        for api_root in srv.api_roots:
            for col in api_root.collections:
                collections.append(col)
        
        # Find the requested collection
        target_collection = None
        for col in collections:
            if getattr(col, "id", "") == collection_id:
                target_collection = col
                break
                
        if not target_collection:
            return [], f"Collection '{collection_id}' not found on server. Available collections: {[getattr(c, 'id', '') for c in collections]}"
        
        # Pull objects from the collection
        collection = Collection(target_collection.url, auth=auth, verify=True)
        bundle = collection.get_objects()
        objs = bundle.get("objects", []) if isinstance(bundle, dict) else []
        
        return objs, None
        
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return [], f"Connection timeout to TAXII server: {server}"
        elif "connection" in error_msg.lower():
            return [], f"Connection error to TAXII server: {server}"
        elif "401" in error_msg or "403" in error_msg:
            return [], f"Authentication failed for TAXII server. Check username/password."
        else:
            return [], f"TAXII server error: {error_msg}"


def list_taxii_collections(server: str, username: Optional[str], password: Optional[str]) -> Tuple[List[Dict[str, str]], Optional[str]]:
    """
    Return a list of collections available on a TAXII 2.1 server.
    Each item: {"id": ..., "title": ..., "url": ...}
    """
    try:
        from taxii2client.v21 import Server  # type: ignore
    except Exception as e:
        return [], "taxii2-client not installed. Add 'taxii2-client' to requirements.txt to enable TAXII features."

    try:
        auth = None
        if username and password:
            auth = (username, password)
            
        srv = Server(server, auth=auth, verify=True, timeout=TIMEOUT[0])

        out: List[Dict[str, str]] = []
        for api_root in srv.api_roots:
            for col in api_root.collections:
                out.append({
                    "id": getattr(col, "id", ""),
                    "title": getattr(col, "title", ""),
                    "url": getattr(col, "url", ""),
                    "api_root": getattr(api_root, "url", ""),
                    "description": getattr(col, "description", ""),
                })
        return out, None
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return [], f"Connection timeout to TAXII server: {server}"
        elif "connection" in error_msg.lower():
            return [], f"Connection error to TAXII server: {server}"
        elif "401" in error_msg or "403" in error_msg:
            return [], f"Authentication failed for TAXII server. Check username/password."
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
            patt = o.get("pattern", "")  # e.g., "[ipv4-addr:value = '1.2.3.4']"
            ips += re.findall(r"ipv4-addr:value\s*=\s*'([^']+)'", patt)
            domains += re.findall(r"domain-name:value\s*=\s*'([^']+)'", patt)
            urls += re.findall(r"url:value\s*=\s*'([^']+)'", patt)
            hashes += re.findall(r"file:hashes\.'?\w+'?:\s*'([A-Fa-f0-9]{32,64})'", patt)
        elif t == "malware":
            # sometimes external_references include VT/URL etc.
            pass
        elif t == "attack-pattern":
            # handled in MITRE mapping
            pass
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
    Parse/normalize IOCs from free text (like your IOC paste box).
    Body: { "text": "..." }
    Returns: { ips, domains, urls, hashes, mitre }
    """
    b = request.get_json(silent=True) or {}
    text = b.get("text", "")
    out = normalize_iocs(text)
    out["mitre"] = extract_tactics(text)
    return jsonify(out)

@intel_bp.post("/api/ti/enrich")
def ti_enrich():
    """
    Enrich a set of IOCs using multiple providers (best-effort).
    Body:
      {
        "ips": [], "domains": [], "urls": [], "hashes": [],
        "providers": ["vt","otx","abuseipdb"]   # optional subset
      }
    """
    b = request.get_json(silent=True) or {}
    iocs = {
        "ips": b.get("ips") or [],
        "domains": b.get("domains") or [],
        "urls": b.get("urls") or [],
        "hashes": b.get("hashes") or [],
    }
    providers = set((b.get("providers") or ["vt", "otx", "abuseipdb"]))

    results: List[Dict[str, Any]] = []
    if "vt" in providers:
        results.append(vt_enrich(iocs))
    if "otx" in providers:
        results.append(otx_enrich(iocs))
    if "abuseipdb" in providers:
        results.append(abuseipdb_enrich(iocs))

    # Aggregate errors
    errors = []
    for r in results:
        errors.extend(r.get("errors", []))

    return jsonify({"providers": [r["provider"] for r in results], "results": results, "errors": errors})


# --------------------------- Routes: STIX/TAXII ---------------------------- #

@intel_bp.post("/api/ti/stix/upload")
def ti_stix_upload():
    """
    Upload a STIX bundle (JSON string) and extract IOCs + ATT&CK TIDs.
    Body: { "bundle": "{...}" }  OR multipart file 'file'
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
    # Extract MITRE TIDs from attack-patterns or descriptions
    text_concat = json.dumps(objs)
    mitre = extract_tactics(text_concat)
    return jsonify({"iocs": iocs, "mitre": mitre, "count": len(objs)})

@intel_bp.post("/api/ti/taxii/pull")
def ti_taxii_pull():
    """
    Pull indicators via TAXII 2.1.
    Body: { "server":"https://cti-taxii.mitre.org/taxii/", "collection_id":"", "username":null, "password":null }
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
        return jsonify({"error": err}), 501  # Not Implemented (until lib installed)
    
    iocs = parse_stix_objects(objs)
    mitre = extract_tactics(json.dumps(objs))
    
    # Format for frontend table display
    formatted_objects = []
    for obj in objs:
        obj_type = obj.get("type", "unknown")
        obj_id = obj.get("id", "")
        obj_name = obj.get("name", obj.get("value", obj_id))
        obj_desc = obj.get("description", "No description")
        
        formatted_objects.append({
            "id": obj_id,
            "type": obj_type,
            "name": obj_name,
            "description": obj_desc,
            "created": obj.get("created", ""),
            "modified": obj.get("modified", "")
        })
    
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
    Body: { "server": "https://...", "username": null, "password": null }
    """
    b = request.get_json(silent=True) or {}
    server = (b.get("server") or "").strip()
    username = b.get("username")
    password = b.get("password")

    if not server:
        return jsonify({"error": "server is required"}), 400

    cols, err = list_taxii_collections(server, username, password)
    if err:
        # Surface a friendly error message for the UI
        return jsonify({"error": err}), 501
    return jsonify({"collections": cols, "count": len(cols)})


# --------------------------- Routes: MITRE Map ----------------------------- #

@intel_bp.post("/api/ti/mitre/map")
def ti_mitre_map():
    """
    Extract and normalize ATT&CK technique IDs from text or fields.
    Body: { "text":"... T1059.001 ...", "fields":["desc", "notes"], "records":[{"desc":".."}] }
    """
    b = request.get_json(silent=True) or {}
    text = b.get("text", "")

    # Also scan arbitrary records/fields if provided
    if b.get("records") and isinstance(b["records"], list):
        fields = b.get("fields") or []
        for rec in b["records"]:
            for f in fields:
                if f in rec and isinstance(rec[f], str):
                    text += " " + rec[f]

    tids = extract_tactics(text)
    # Return also the tactic (prefix) buckets (e.g., T1059 -> 1059 family)
    families = unique([t.split(".")[0] for t in tids])
    return jsonify({"tids": tids, "families": families})


# --------------------------- Routes: Push / Webhooks ----------------------- #

@intel_bp.post("/api/ti/push")
def ti_push():
    """
    Push normalized IOCs to Splunk HEC (or other SIEM later).
    Body: { "iocs":{ips,domains,urls,hashes}, "source":"ti", "sourcetype":"msebetsi:ti", "hec_url":?, "hec_token":? }
    If hec_url/token not provided, tries secrets 'splunk_hec_url' and 'splunk_hec_token'.
    """
    b = request.get_json(silent=True) or {}
    iocs = b.get("iocs") or {}
    source = b.get("source", "ti")
    sourcetype = b.get("sourcetype", "msebetsi:ti")

    hec_url = (b.get("hec_url") or get_secret("splunk_hec_url") or "").rstrip("/")
    hec_token = b.get("hec_token") or get_secret("splunk_hec_token")
    if not hec_url or not hec_token:
        return jsonify({"error": "Missing HEC url/token"}), 400

    headers = {
        "Authorization": f"Splunk {hec_token}",
        "Content-Type": "application/json",
        "User-Agent": UA,
    }

    # Build one event payload with all IOCs (could be split if you prefer)
    event = {
        "event": {"type": "ioc_batch", "iocs": iocs},
        "source": source,
        "sourcetype": sourcetype,
    }
    try:
        r = requests.post(hec_url + "/services/collector", headers=headers, data=json.dumps(event), timeout=TIMEOUT, verify=True)
        return Response(r.text, status=r.status_code, mimetype="application/json" if "json" in (r.headers.get("content-type","")) else "text/plain")
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

@intel_bp.post("/api/ti/webhook/test")
def ti_webhook_test():
    """
    Sends a test payload to a webhook URL (Slack, Teams, etc).
    Body: { "url":"https://hooks.slack.com/services/...", "text":"optional", "payload":{...} }
    """
    b = request.get_json(silent=True) or {}
    url = (b.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Missing url"}), 400

    payload = b.get("payload") or {"text": b.get("text") or "Msebetsi SOC: TI webhook test"}
    headers = {"Content-Type": "application/json", "User-Agent": UA}
    try:
        r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=TIMEOUT)
        return Response(r.text or "OK", status=r.status_code, mimetype="text/plain")
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502


# --------------------------- Convenience Endpoint -------------------------- #

@intel_bp.post("/api/ti/normalize")
def ti_normalize():
    """
    Convenience endpoint that takes raw text or arrays and returns normalized IOCs.
    Body: { "text": "...", "ips":[], "domains":[], "urls":[], "hashes":[] }
    """
    b = request.get_json(silent=True) or {}
    text_part = normalize_iocs(b.get("text", ""))
    merged = {
        "ips": unique((b.get("ips") or []) + text_part["ips"]),
        "domains": unique((b.get("domains") or []) + text_part["domains"]),
        "urls": unique((b.get("urls") or []) + text_part["urls"]),
        "hashes": unique((b.get("hashes") or []) + text_part["hashes"]),
    }
    return jsonify(merged)


# --------------------------- New Routes for Enhanced Features --------------- #

@intel_bp.post("/api/ti/stix/graph")
def ti_stix_graph():
    """
    Generate STIX relationship graph data for visualization.
    Body: { "objects": [stix_objects] }
    """
    b = request.get_json(silent=True) or {}
    stix_objects = b.get("objects", [])
    
    # Generate graph elements for Cytoscape
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
    
    # Add relationships (simplified - in real implementation, parse relationships)
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
    
    # Define relationship rules
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