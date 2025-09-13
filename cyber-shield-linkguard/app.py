# app.py
from flask import Flask, request, jsonify, send_from_directory
from urllib.parse import urlparse
import os, time, re, socket, requests, tldextract
import base64
from werkzeug.utils import secure_filename
import hashlib
import tempfile
from PIL import Image
import cv2
from pyzbar.pyzbar import decode
import numpy as np

#importing auth_bp from authentication.py
from routes.authentication import auth_bp
from routes.subscription import subscription_bp
from routes.scan_results import scan_results_bp

from dotenv import load_dotenv
load_dotenv()

# -------------------- Flask setup --------------------
app = Flask(__name__, static_url_path="", static_folder="public")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Add secret key for session management
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")

# registering 'auth_bp' blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(subscription_bp)
app.register_blueprint(scan_results_bp)

# Read VirusTotal API key from env (put it in .env as VT_API_KEY=...)
VT_API_KEY = os.getenv("VT_API_KEY", "").strip()
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))

# Simple in-memory rate limiter (use Redis in production)
_ip_bucket = {}

# -------------------- Heuristics & constants --------------------
UA = {"User-Agent": "CyberShield-LinkGuard/1.0 (+https://msebetsi.co.za)"}

SHORTENER_DOMAINS = set("""
bit.ly goo.gl t.co tinyurl.com ow.ly is.gd buff.ly s.id lnkd.in rebrand.ly cutt.ly
""".split())

DGA_LIKE_RE = re.compile(r"[bcdfghjklmnpqrstvwxyz]{4,}")
COMMON_LOGIN_WORDS = {"login","signin","verify","account","update","secure","wallet","bank"}

RISK_BANDS = [
    (0, 20, "SAFE"),
    (21, 59, "WARN"),
    (60, 100, "DANGER"),
]

# Allow file types for upload
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'exe', 'zip'}

# -------------------- Helpers --------------------
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_hash(file_path):
    """Calculate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def limited(ip: str) -> bool:
    """Very small in-memory rate limit bucket."""
    now_window = int(time.time()) // 60
    bucket = _ip_bucket.setdefault(ip, {})
    if bucket.get("window") != now_window:
        bucket["window"] = now_window
        bucket["count"] = 0
    bucket["count"] += 1
    return bucket["count"] > RATE_LIMIT_PER_MIN

def normalize_url(raw: str) -> str:
    raw = (raw or "").strip().replace(" ", "")
    if not raw:
        return raw
    if not raw.startswith(("http://", "https://")):
        raw = "http://" + raw
    return raw

def unshorten(u: str, max_hops=5):
    try:
        seen = set()
        current = u
        for _ in range(max_hops):
            if current in seen:
                break
            seen.add(current)
            r = requests.head(current, allow_redirects=False, timeout=5, headers=UA)
            loc = r.headers.get("location")
            if r.is_redirect and loc:
                if not loc.startswith(("http://", "https://")):
                    parsed = urlparse(current)
                    loc = f"{parsed.scheme}://{parsed.netloc}{loc}"
                current = loc
            else:
                return current, len(seen) - 1
        return current, len(seen) - 1
    except Exception:
        return u, 0

def domain_features(u: str):
    try:
        ext = tldextract.extract(u)
        sld, tld, sub = ext.domain, ext.suffix, ext.subdomain
        host = ".".join([p for p in [sub, sld, tld] if p])
        digits = sum(ch.isdigit() for ch in host)
        hyphens = host.count("-")
        return {
            "host": host,
            "sld": sld,
            "tld": tld,
            "sub": sub,
            "digits": digits,
            "hyphens": hyphens,
            "is_long_domain": len(host) > 25,
            "looks_dga_like": bool(DGA_LIKE_RE.search(sld)),
            "is_shortener": host in SHORTENER_DOMAINS,
        }
    except Exception:
        return {}

def resolve_ip(host: str):
    try:
        return socket.gethostbyname(host)
    except Exception:
        return None

def tls_ok(u: str):
    try:
        parsed = urlparse(u)
        if parsed.scheme != "https":
            return False, "URL not using HTTPS"
        return True, "HTTPS enabled"
    except Exception:
        return False, "TLS check failed"

def fetch_snippet(u: str):
    try:
        r = requests.get(u, headers=UA, timeout=7)
        text = r.text[:4000]
        has_login_words = any(w in text.lower() for w in COMMON_LOGIN_WORDS)
        title = ""
        m = re.search(r"<title>(.*?)</title>", text, re.I | re.S)
        if m:
            title = m.group(1).strip()
        return {"status": r.status_code, "has_login_words": has_login_words, "title": title}
    except Exception:
        return {"status": None, "has_login_words": False, "title": ""}

def base64_urlsafe(s: str) -> str:
    return base64.urlsafe_b64encode(s.encode()).decode().strip("=")

def vt_lookup(u: str):
    if not VT_API_KEY:
        return {"enabled": False}
    try:
        # Submit URL to VirusTotal
        submit_response = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
            data={"url": u},
            timeout=8,
        )
        
        # If submission was successful, get the analysis ID
        if submit_response.status_code == 200:
            analysis_id = submit_response.json().get('data', {}).get('id')
            if analysis_id:
                # Wait a moment for analysis to complete
                time.sleep(2)
                
                # Get the analysis results
                analysis_response = requests.get(
                    f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                    headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
                    timeout=10,
                )
                
                if analysis_response.status_code == 200:
                    stats = analysis_response.json().get('data', {}).get('attributes', {}).get('stats', {})
                    return {
                        "enabled": True,
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "undetected": stats.get("undetected", 0),
                    }
        
        # Fallback: Try to get existing report
        url_id = base64_urlsafe(u)
        rep = requests.get(
            f"https://www.virustotal.com/api/v3/urls/{url_id}",
            headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
            timeout=8,
        )
        if rep.status_code == 200:
            data = rep.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {}) or {}
            return {
                "enabled": True,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
            }
        return {"enabled": True, "error": True}
    except Exception as e:
        print(f"VirusTotal error: {e}")
        return {"enabled": True, "error": True}

def vt_file_lookup(file_hash: str):
    if not VT_API_KEY:
        return {"enabled": False}
    try:
        rep = requests.get(
            f"https://www.virustotal.com/api/v3/files/{file_hash}",
            headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
            timeout=10,
        )
        if rep.status_code == 200:
            data = rep.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {}) or {}
            return {
                "enabled": True,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
                "type_description": data.get("type_description", ""),
                "names": data.get("names", []),
            }
        return {"enabled": True, "error": True}
    except Exception as e:
        print(f"VirusTotal file error: {e}")
        return {"enabled": True, "error": True}

def scan_qr_code(image_path):
    """Scan QR code from image file"""
    try:
        # Read the image
        image = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Use pyzbar to decode QR codes
        decoded_objects = decode(gray)
        
        if decoded_objects:
            # Return the first decoded QR code content
            return decoded_objects[0].data.decode('utf-8'), "url"
        else:
            return None, "unknown"
    except Exception as e:
        print(f"QR scan error: {e}")
        return None, "error"

def score(signals: dict) -> dict:
    s = 0
    reasons = []

    if signals["unshorten_hops"] > 0:
        s += min(15, 5 * signals["unshorten_hops"])
        reasons.append("Multiple redirects (possible shortener chain)")

    df = signals["domain"]
    if df.get("is_shortener"): s += 10; reasons.append("Shortener domain")
    if df.get("digits", 0) >= 3: s += 10; reasons.append("Many digits in domain")
    if df.get("hyphens", 0) >= 2: s += 10; reasons.append("Many hyphens in domain")
    if df.get("is_long_domain"): s += 10; reasons.append("Very long domain")
    if df.get("looks_dga_like"): s += 12; reasons.append("Domain looks algorithmically generated")

    if not signals["tls"]["ok"]:
        s += 12; reasons.append("No HTTPS")

    snip = signals["snippet"]
    if snip.get("has_login_words"): s += 8; reasons.append("Login/verification wording present")

    if signals.get("ip") is None:
        s += 10; reasons.append("Host did not resolve")

    vt = signals.get("virustotal", {})
    if vt.get("enabled") and not vt.get("error"):
        s += min(40, 20 * vt.get("malicious", 0) + 10 * vt.get("suspicious", 0))
        if vt.get("malicious", 0) > 0 or vt.get("suspicious", 0) > 0:
            reasons.append("VirusTotal detections present")

    s = max(0, min(100, s))
    band = next(b for lo, hi, b in RISK_BANDS if lo <= s <= hi)
    return {"score": s, "band": band, "reasons": reasons}

def score_file(vt_result: dict) -> dict:
    s = 0
    reasons = []
    
    if vt_result.get("enabled") and not vt_result.get("error"):
        s += min(80, 20 * vt_result.get("malicious", 0) + 10 * vt_result.get("suspicious", 0))
        if vt_result.get("malicious", 0) > 0:
            reasons.append(f"File detected as malicious by {vt_result.get('malicious', 0)} engines")
        elif vt_result.get("suspicious", 0) > 0:
            reasons.append(f"File detected as suspicious by {vt_result.get('suspicious', 0)} engines")
        else:
            reasons.append("No threats detected by VirusTotal")
            s = 10  # Low score for clean files
    else:
        reasons.append("VirusTotal scan not available")
        s = 50  # Medium score when scan is unavailable
    
    s = max(0, min(100, s))
    band = next(b for lo, hi, b in RISK_BANDS if lo <= s <= hi)
    return {"score": s, "band": band, "reasons": reasons}

# -------------------- API --------------------
@app.route("/api/scan", methods=["POST"])
def scan():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if limited(ip):
        return jsonify({"error": "Rate limit exceeded"}), 429

    data = request.get_json(silent=True) or {}
    raw = data.get("url", "")
    url = normalize_url(raw)
    if not url:
        return jsonify({"error": "Empty URL"}), 400

    try:
        final_url, hops = unshorten(url)
        df = domain_features(final_url)
        ipaddr = resolve_ip(df.get("host", "")) if df else None
        tlsok, tlsmsg = tls_ok(final_url)
        snip = fetch_snippet(final_url)
        vt = vt_lookup(final_url)

        signals = {
            "input": raw,
            "normalized": url,
            "final_url": final_url,
            "unshorten_hops": hops,
            "domain": df,
            "ip": ipaddr,
            "tls": {"ok": tlsok, "note": tlsmsg},
            "snippet": snip,
            "virustotal": vt,
            "ts": int(time.time()),
        }
        verdict = score(signals)
        return jsonify({"signals": signals, "verdict": verdict})
    except Exception as e:
        print(f"URL scan error: {e}")
        return jsonify({"error": "Failed to scan URL"}), 500

@app.route("/api/scan_file", methods=["POST"])
def scan_file():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if limited(ip):
        return jsonify({"error": "Rate limit exceeded"}), 429

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    if file and allowed_file(file.filename):
        try:
            # Save file temporarily
            filename = secure_filename(file.filename)
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                file.save(temp_file.name)
                temp_path = temp_file.name
            
            # Calculate file hash
            file_hash = get_file_hash(temp_path)
            
            # Lookup file in VirusTotal
            vt_result = vt_file_lookup(file_hash)
            
            # Clean up temp file
            os.unlink(temp_path)
            
            # Prepare response
            file_info = {
                "filename": filename,
                "sha256": file_hash,
                "size": os.path.getsize(temp_path) if os.path.exists(temp_path) else 0
            }
            
            verdict = score_file(vt_result)
            
            return jsonify({
                "file": file_info,
                "virustotal": vt_result,
                "verdict": verdict
            })
        except Exception as e:
            print(f"File scan error: {e}")
            return jsonify({"error": "Failed to scan file"}), 500
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route("/api/scan_qr", methods=["POST"])
def scan_qr():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if limited(ip):
        return jsonify({"error": "Rate limit exceeded"}), 429

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        # Save image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        # Scan QR code
        decoded_content, content_type = scan_qr_code(temp_path)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        if decoded_content:
            if content_type == "url" and decoded_content.startswith(('http://', 'https://')):
                
                final_url, hops = unshorten(decoded_content)
                df = domain_features(final_url)
                tlsok, tlsmsg = tls_ok(final_url)
                vt = vt_lookup(final_url)
                
                signals = {
                    "final_url": final_url,
                    "unshorten_hops": hops,
                    "domain": df,
                    "tls": {"ok": tlsok, "note": tlsmsg},
                    "virustotal": vt,
                }
                verdict = score(signals)
                
                return jsonify({
                    "decoded": decoded_content,
                    "type": "url",
                    "signals": signals,
                    "verdict": verdict
                })
            else:
                # For non-URL content
                return jsonify({
                    "decoded": decoded_content,
                    "type": content_type,
                    "message": "QR code decoded successfully"
                })
        else:
            return jsonify({
                "decoded": "",
                "type": "unknown",
                "message": "No QR code found in the image"
            })
    except Exception as e:
        print(f"QR scan error: {e}")
        return jsonify({"error": "Failed to scan QR code"}), 500

# -------------------- Static / Health --------------------
@app.route("/")
def root():
    return send_from_directory("public", "index.html")

@app.route("/<path:path>")
def static_proxy(path):

    if path.startswith('api'):
        return jsonify({'error': 'Not found'}), 404
    # Allows serving assets like /assets/welcome-bg.png
    return send_from_directory("public", path)

@app.route("/health")
def health():
    return jsonify({"ok": True})

# -------------------- Entry --------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
    