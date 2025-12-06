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
    except requests.RequestException as e:
        return None, str(e)

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
        return [], "taxii2-client not installed. Add to requirements to enable TAXII pull."

    try:
        if username and password:
            srv = Server(server, user=username, password=password, verify=True)
        else:
            srv = Server(server, verify=True)
        # naive approach: search all API Roots -> Collections, pick by id
        for api_root in srv.api_roots:
            for col in api_root.collections:
                if getattr(col, "id", "") == collection_id or getattr(col, "title", "") == collection_id:
                    c = Collection(col.url)
                    bundle = c.get_objects()
                    objs = bundle.get("objects", []) if isinstance(bundle, dict) else []
                    return objs, None
        return [], f"Collection {collection_id} not found on server."
    except Exception as e:
        return [], str(e)

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
    return jsonify({"objects": len(objs), "iocs": iocs, "mitre": mitre})


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

