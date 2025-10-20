from flask import Flask, request, jsonify, send_from_directory, session, redirect
from urllib.parse import urlparse
import os, time, re, socket, requests, tldextract
import base64
from werkzeug.utils import secure_filename
import hashlib
import tempfile
from PIL import Image
import cv2
import numpy as np
import sqlite3
from routes.exam import exam_bp


# Try to import QR code libraries with fallbacks
QR_AVAILABLE = False
QR_LIB = None

try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    QR_LIB = "pyzbar"
    QR_AVAILABLE = True
    print("Using pyzbar for QR code scanning")
except ImportError:
    try:
        from qreader import QReader
        QR_LIB = "qreader"
        QR_AVAILABLE = True
        print("Using qreader for QR code scanning")
    except ImportError:
        try:
            # Fallback: using OpenCV's built-in QR code detector
            import cv2
            if hasattr(cv2, 'QRCodeDetector'):
                QR_LIB = "opencv"
                QR_AVAILABLE = True
                print("Using OpenCV for QR code scanning")
            else:
                print("No QR code library available - QR scanning disabled")
        except ImportError:
            print("No QR code library available - QR scanning disabled")

#importing blueprints
from routes.authentication import auth_bp
from routes.subscription import subscription_bp
from routes.settings import settings_bp
from routes.scan_results import scan_results_bp
from routes.chats import chats_bp
from routes.profile import profile_bp
from routes.teamCollab import team_collab_bp
from routes.admin import admin_bp
from routes.enterprise import enterprise_bp
from routes.learning_hub import learning_hub_bp

# importing email phishing blueprint
from routes.email_phishing import email_phishing_bp

# from routes.phishing_replica import phishing_replica_bp


from dotenv import load_dotenv
load_dotenv()



#======================================================
# -------------------- Flask setup --------------------
#======================================================

app = Flask(__name__, static_url_path="", static_folder="public")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")

# registering blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(subscription_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(scan_results_bp)
app.register_blueprint(chats_bp, url_prefix='/api/chats')
app.register_blueprint(profile_bp)
app.register_blueprint(team_collab_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(enterprise_bp)
app.register_blueprint(learning_hub_bp)
app.register_blueprint(exam_bp)

# registering email phishing blueprint
app.register_blueprint(email_phishing_bp, url_prefix='/api/phishing')

# app.register_blueprint(phishing_replica_bp)


VT_API_KEY = os.getenv("VT_API_KEY", "").strip()
DYMO_API_KEY = os.getenv("DYMO_API_KEY", "").strip()
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))

_ip_bucket = {}

#======================================================
# -------------- Heuristics & constants ---------------
#======================================================

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

# file types for upload
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'exe', 'zip'}

user_sessions = {}

active_sessions = {}

def validate_session(session_id):
    """Validate session and return user data - more lenient for authenticated users"""
    if not session_id:
        return None
    
    if 'user_id' in session:
        if session_id in user_sessions:
            session_data = user_sessions[session_id]

            session_data['last_activity'] = time.time()
            return session_data
        else:
            
            return create_session(session_id, session.get('user_id'))
    
    
    if session_id in user_sessions:
        session_data = user_sessions[session_id]

        if (time.time() - session_data['created'] < 1800 and 
            session_data.get('active', True)):
            session_data['last_activity'] = time.time()
            return session_data
        else:
            # Session expired, remove it
            if session_id in user_sessions:
                del user_sessions[session_id]
    
    return None


def create_session(session_id, user_id=None):
    """Create a new session"""
    user_sessions[session_id] = {
        'created': time.time(),
        'last_activity': time.time(),
        'user_id': user_id,
        'message_count': 0,
        'active': True  
    }
    
    # Track this session for the user
    if user_id:
        if user_id not in active_sessions:
            active_sessions[user_id] = set()
        active_sessions[user_id].add(session_id)
    
    return user_sessions[session_id]


def invalidate_user_sessions(user_id):
    """Immediately invalidate all sessions for a user (on logout)"""
    if user_id in active_sessions:
        for session_id in active_sessions[user_id]:
            if session_id in user_sessions:

                user_sessions[session_id]['active'] = False

                user_sessions[session_id]['cleanup_time'] = time.time() + 60
        
        del active_sessions[user_id]
    return True


def cleanup_expired_sessions():
    """Clean up expired and inactive sessions"""
    current_time = time.time()
    sessions_to_remove = []
    
    for session_id, session_data in user_sessions.items():
        if (current_time - session_data['created'] > 1800 or 
            (not session_data.get('active', True) and 
             session_data.get('cleanup_time', current_time) <= current_time)):
            sessions_to_remove.append(session_id)
    
    for session_id in sessions_to_remove:
        user_id = user_sessions[session_id].get('user_id')
        if user_id and user_id in active_sessions:
            active_sessions[user_id].discard(session_id)
            if not active_sessions[user_id]:
                del active_sessions[user_id]
        
        del user_sessions[session_id]


@app.route('/api/session/invalidate', methods=['POST'])
def invalidate_session_endpoint():
    """Invalidate all sessions for the current user"""
    try:

        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'No user session found'}), 400
        
        invalidate_user_sessions(user_id)
        return jsonify({'status': 'sessions_invalidated'})
        
    except Exception as e:
        print(f"Session invalidation error: {e}")
        return jsonify({'error': 'Failed to invalidate sessions'}), 500





@app.route('/api/session/validate', methods=['POST'])
def validate_session_endpoint():
    session_id = request.json.get('session', '')
    session_data = validate_session(session_id)
    
    cleanup_expired_sessions()
    
    return jsonify({
        'valid': session_data is not None,
        'session': session_id,
        'user_id': session_data.get('user_id') if session_data else None,
        'message_count': session_data.get('message_count', 0) if session_data else 0
    })




@app.route('/api/session/create', methods=['POST'])
def create_session_endpoint():
    session_id = request.json.get('session', '')
    user_id = request.json.get('user_id')
    
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400
    
    session_data = create_session(session_id, user_id)
    
    return jsonify({
        'status': 'created',
        'session': session_id,
        'user_id': user_id
    })


def start_session_cleanup_task():
    """Start background session cleanup (runs every 5 minutes)"""
    def cleanup_task():
        while True:
            try:
                cleanup_expired_sessions()
                time.sleep(300)  # 5 minutes
            except Exception as e:
                print(f"Session cleanup error: {e}")
                time.sleep(60)  # Wait 1 minute on error
    
    import threading
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()

start_session_cleanup_task()


#======================================================
# ---------------------- Helpers ----------------------
#======================================================

@app.route('/admin')
def admin_redirect():
    return redirect('/admin/login')

def get_db_connection():
    conn = sqlite3.connect('cyber-shield-linkguard.db')
    conn.row_factory = sqlite3.Row
    return conn

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

#======================================================
# ------------------ API Integrations -----------------
#======================================================

def vt_lookup(u: str):
    """VirusTotal URL analysis"""
    if not VT_API_KEY:
        return {"enabled": False, "error": "API key not configured"}
    
    try:
        # First try to get existing report
        url_id = base64_urlsafe(u)
        rep = requests.get(
            f"https://www.virustotal.com/api/v3/urls/{url_id}",
            headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
            timeout=10,
        )
        
        if rep.status_code == 200:
            data = rep.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {})
            return {
                "enabled": True,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
                "total_engines": sum(stats.values()) if stats else 0,
                "source": "virustotal"
            }
        
        # If no existing report, submit URL for analysis
        submit_response = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
            data={"url": u},
            timeout=10,
        )
        
        if submit_response.status_code == 200:
            analysis_id = submit_response.json().get('data', {}).get('id')
            if analysis_id:
                # Wait for analysis to complete
                time.sleep(3)
                
                analysis_response = requests.get(
                    f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                    headers={"x-apikey": VT_API_KEY, "accept": "application/json"},
                    timeout=15,
                )
                
                if analysis_response.status_code == 200:
                    analysis_data = analysis_response.json().get('data', {}).get('attributes', {})
                    stats = analysis_data.get('stats', {})
                    return {
                        "enabled": True,
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "undetected": stats.get("undetected", 0),
                        "total_engines": sum(stats.values()) if stats else 0,
                        "source": "virustotal"
                    }
        
        return {"enabled": True, "error": "Failed to get results", "source": "virustotal"}
        
    except Exception as e:
        print(f"VirusTotal error: {e}")
        return {"enabled": True, "error": str(e), "source": "virustotal"}

def dymo_lookup(u: str):
    """Dymo API URL analysis"""
    if not DYMO_API_KEY:
        return {"enabled": False, "error": "API key not configured", "source": "dymo"}
    
    try:
        # Dymo API endpoint 
        headers = {
            "Authorization": f"Bearer {DYMO_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Example Dymo API call 
        response = requests.post(
            "https://api.dymo.com/v1/analyze",
            headers=headers,
            json={"url": u},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            return {
                "enabled": True,
                "malicious": data.get("threat_score", 0) if data.get("is_malicious") else 0,
                "suspicious": data.get("suspicious_score", 0),
                "harmless": data.get("confidence", 100) if not data.get("is_malicious") else 0,
                "undetected": data.get("unknown", 0),
                "total_engines": 1,  
                "source": "dymo",
                "dymo_specific_data": data 
            }
        else:
            return {"enabled": True, "error": f"API returned {response.status_code}", "source": "dymo"}
            
    except Exception as e:
        print(f"Dymo API error: {e}")
        return {"enabled": True, "error": str(e), "source": "dymo"}

def vt_file_lookup(file_hash: str):
    """VirusTotal file analysis"""
    if not VT_API_KEY:
        return {"enabled": False, "error": "API key not configured"}
    
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
                "total_engines": sum(stats.values()) if stats else 0,
                "source": "virustotal"
            }
        
        return {"enabled": True, "error": "File not found in database", "source": "virustotal"}
        
    except Exception as e:
        print(f"VirusTotal file error: {e}")
        return {"enabled": True, "error": str(e), "source": "virustotal"}

def dymo_file_lookup(file_hash: str):
    """Dymo API file analysis"""
    if not DYMO_API_KEY:
        return {"enabled": False, "error": "API key not configured", "source": "dymo"}
    
    try:
        headers = {
            "Authorization": f"Bearer {DYMO_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            "https://api.dymo.com/v1/analyze/file", 
            headers=headers,
            json={"file_hash": file_hash},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "enabled": True,
                "malicious": data.get("threat_level", 0),
                "suspicious": data.get("suspicion_score", 0),
                "harmless": 100 - data.get("threat_level", 0),
                "undetected": 0,
                "total_engines": 1,
                "source": "dymo",
                "dymo_specific_data": data
            }
        else:
            return {"enabled": True, "error": f"API returned {response.status_code}", "source": "dymo"}
            
    except Exception as e:
        print(f"Dymo file API error: {e}")
        return {"enabled": True, "error": str(e), "source": "dymo"}

def combined_url_lookup(u: str):
    """Combine results from multiple security APIs"""
    results = []
    
    # VirusTotal scan
    vt_result = vt_lookup(u)
    if vt_result.get("enabled") and not vt_result.get("error"):
        results.append(vt_result)
    
    # Dymo scan
    dymo_result = dymo_lookup(u)
    if dymo_result.get("enabled") and not dymo_result.get("error"):
        results.append(dymo_result)
    
    return results

def combined_file_lookup(file_hash: str):
    """Combine results from multiple security APIs for files"""
    results = []
    
    # VirusTotal scan
    vt_result = vt_file_lookup(file_hash)
    if vt_result.get("enabled") and not vt_result.get("error"):
        results.append(vt_result)
    
    # Dymo scan
    dymo_result = dymo_file_lookup(file_hash)
    if dymo_result.get("enabled") and not dymo_result.get("error"):
        results.append(dymo_result)
    
    return results

#======================================================
# ------------------ QR Code Scanning -----------------
#======================================================

def scan_qr_code(image_path):
    """Scan QR code from image file with multiple library support"""
    if not QR_AVAILABLE:
        return None, "QR scanning not available - library not installed"
    
    try:
        if QR_LIB == "pyzbar":
            image = cv2.imread(image_path)        
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)        
            decoded_objects = pyzbar_decode(gray)
            
            if decoded_objects:
                return decoded_objects[0].data.decode('utf-8'), "url"
            else:
                return None, "unknown"
                
        elif QR_LIB == "qreader":
            qreader = QReader()
            image = cv2.imread(image_path)
            decoded_text = qreader.detect_and_decode(image=image)
            
            if decoded_text and decoded_text[0]:
                return decoded_text[0], "url"
            else:
                return None, "unknown"
        
        elif QR_LIB == "opencv":
            # Fallback using OpenCV's built-in QR code detector
            image = cv2.imread(image_path)
            qr_detector = cv2.QRCodeDetector()
            decoded_text, points, straight_qrcode = qr_detector.detectAndDecode(image)
            
            if decoded_text:
                return decoded_text, "url"
            else:
                return None, "unknown"
        
        return None, "unknown"
        
    except Exception as e:
        print(f"QR scan error: {e}")
        # Try one more fallback with basic image processing
        try:
            return simple_qr_scan_fallback(image_path)
        except Exception as fallback_error:
            print(f"Fallback QR scan also failed: {fallback_error}")
            return None, "error"
        
def simple_qr_scan_fallback(image_path):
    """Simple fallback QR scanning using basic image processing"""
    try:
        import cv2
        import numpy as np
        
        # Read and preprocess image
        image = cv2.imread(image_path)
        if image is None:
            return None, "error"
            
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # square-like contours
        for contour in contours:
            approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
            if len(approx) == 4: 

                x, y, w, h = cv2.boundingRect(contour)
                if w > 50 and h > 50:  

                    roi = gray[y:y+h, x:x+w]
                    return "QR Code detected but decoding unavailable", "qr_detected"
        
        return None, "unknown"
        
    except Exception as e:
        print(f"Simple QR fallback error: {e}")
        return None, "error"


@app.route("/api/scan_file_or_qr", methods=["POST"])
def scan_file_or_qr():
    """Combined endpoint that automatically detects if file is QR code or regular file"""
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if limited(ip):
        return jsonify({"error": "Rate limit exceeded"}), 429

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    # Check file type
    allowed_image_types = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    
    if file and allowed_file(file.filename):
        try:
            # Save file temporarily
            filename = secure_filename(file.filename)
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                file.save(temp_file.name)
                temp_path = temp_file.name
            
            # If it's an image, try QR code scanning first
            if file_ext in allowed_image_types and QR_AVAILABLE:
                decoded_content, content_type = scan_qr_code(temp_path)
                
                if decoded_content:
                    # QR code found - return QR results
                    os.unlink(temp_path)
                    
                    if content_type == "url" and decoded_content.startswith(('http://', 'https://')):
                        # Process URL from QR code
                        final_url, hops = unshorten(decoded_content)
                        df = domain_features(final_url)
                        ipaddr = resolve_ip(df.get("host", "")) if df else None
                        tlsok, tlsmsg = tls_ok(final_url)
                        
                        api_results = combined_url_lookup(final_url)
                        
                        signals = {
                            "final_url": final_url,
                            "unshorten_hops": hops,
                            "domain": df,
                            "ip": ipaddr,
                            "tls": {"ok": tlsok, "note": tlsmsg},
                            "api_results": api_results,
                        }
                        
                        if api_results:
                            verdict = score_combined(api_results, signals)
                        else:
                            verdict = score_fallback(signals)
                        
                        return jsonify({
                            "type": "qr_url",
                            "decoded": decoded_content,
                            "signals": signals,
                            "verdict": verdict
                        })
                    else:
                        # Non-URL QR content
                        return jsonify({
                            "type": "qr_content",
                            "decoded": decoded_content,
                            "content_type": content_type
                        })
            
            # If not QR code or QR scanning failed, do regular file scan
            file_hash = get_file_hash(temp_path)            
            api_results = combined_file_lookup(file_hash)            
            os.unlink(temp_path)
            
            file_info = {
                "filename": filename,
                "sha256": file_hash,
                "size": os.path.getsize(temp_path) if os.path.exists(temp_path) else 0
            }
            
            verdict = score_file_combined(api_results)
            
            return jsonify({
                "type": "file",
                "file": file_info,
                "api_results": api_results,
                "verdict": verdict
            })
            
        except Exception as e:
            print(f"Combined file/QR scan error: {e}")
            return jsonify({"error": "Failed to scan file"}), 500
    
    return jsonify({"error": "File type not allowed"}), 400

#======================================================
# ------------------- Scoring Logic -------------------
#======================================================

def score_fallback(signals: dict) -> dict:
    """Fallback scoring when security APIs fail"""
    s = 0
    reasons = ["Security scan unavailable - using heuristic analysis"]
    
    df = signals["domain"]
    if df.get("is_shortener"): 
        s += 15
        reasons.append("Shortener domain")
    
    if df.get("digits", 0) >= 3: 
        s += 10
        reasons.append("Many digits in domain")
    
    if df.get("hyphens", 0) >= 2: 
        s += 10
        reasons.append("Many hyphens in domain")
    
    if df.get("is_long_domain"): 
        s += 10
        reasons.append("Very long domain")
    
    if df.get("looks_dga_like"): 
        s += 12
        reasons.append("Domain looks algorithmically generated")
    
    if not signals["tls"]["ok"]:
        s += 12
        reasons.append("No HTTPS")
    
    snip = signals["snippet"]
    if snip.get("has_login_words"): 
        s += 8
        reasons.append("Login/verification wording present")
    
    if signals.get("ip") is None:
        s += 10
        reasons.append("Host did not resolve")
    
    s = max(0, min(100, s))
    band = next(b for lo, hi, b in RISK_BANDS if lo <= s <= hi)
    return {"score": s, "band": band, "reasons": reasons}

def score_combined(api_results: list, signals: dict) -> dict:
    """Score based on combined results from multiple APIs"""
    s = 0
    reasons = []
    total_malicious = 0
    total_suspicious = 0
    total_engines = 0
    successful_scans = 0
    
    for result in api_results:
        if result.get("enabled") and not result.get("error"):
            successful_scans += 1
            malicious = result.get("malicious", 0)
            suspicious = result.get("suspicious", 0)
            engines = result.get("total_engines", 1)
            
            total_malicious += malicious
            total_suspicious += suspicious
            total_engines += engines
            
            source_display = "Linkguard"
            
            if malicious > 0:
                reasons.append(f"{source_display}: Detected as malicious by {malicious} engines")
            if suspicious > 0:
                reasons.append(f"{source_display}: Detected as suspicious by {suspicious} engines")
            if malicious == 0 and suspicious == 0:
                reasons.append(f"{source_display}: No threats detected")
    
    if successful_scans > 0 and total_engines > 0:
        # Calculate combined threat percentage
        threat_percentage = ((total_malicious + total_suspicious) / total_engines) * 100
        s = min(100, threat_percentage * 1.5)  
        
        reasons.insert(0, f"Combined analysis from {successful_scans} security services")
    else:
        reasons.append("No successful security scans available")
        s = 50  # Medium risk when no data
    
    # Add secondary heuristic factors
    df = signals["domain"]
    if df.get("is_shortener"): 
        s += 5
        reasons.append("Shortener domain (potential redirection risk)")
    
    if not signals["tls"]["ok"]:
        s += 10
        reasons.append("No HTTPS (connection not encrypted)")
    
    if signals.get("ip") is None:
        s += 5
        reasons.append("Domain did not resolve to IP address")
    
    s = max(0, min(100, s))
    
    # Determine risk band
    band = next(b for lo, hi, b in RISK_BANDS if lo <= s <= hi)
    return {"score": s, "band": band, "reasons": reasons}



def score_file_combined(api_results: list) -> dict:
    """Score files based on combined API results"""
    s = 0
    reasons = []
    total_malicious = 0
    total_suspicious = 0
    total_engines = 0
    successful_scans = 0
    
    for result in api_results:
        if result.get("enabled") and not result.get("error"):
            successful_scans += 1
            malicious = result.get("malicious", 0)
            suspicious = result.get("suspicious", 0)
            engines = result.get("total_engines", 1)
            
            total_malicious += malicious
            total_suspicious += suspicious
            total_engines += engines
            
            source_display = "Linkguard"
            
            if malicious > 0:
                reasons.append(f"{source_display}: Detected as malicious by {malicious} engines")
            if suspicious > 0:
                reasons.append(f"{source_display}: Detected as suspicious by {suspicious} engines")
            if malicious == 0 and suspicious == 0:
                reasons.append(f"{source_display}: No threats detected")
    
    if successful_scans > 0 and total_engines > 0:
        threat_percentage = ((total_malicious + total_suspicious) / total_engines) * 100
        s = min(100, threat_percentage * 1.5)
        reasons.insert(0, f"Combined analysis from {successful_scans} security services")
    else:
        reasons.append("No security scan results available")
        s = 50
    
    s = max(0, min(100, s))
    band = next(b for lo, hi, b in RISK_BANDS if lo <= s <= hi)
    return {"score": s, "band": band, "reasons": reasons}

#======================================================
# ------------------------ API ------------------------
#======================================================

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
        
        # Get combined results from multiple APIs
        api_results = combined_url_lookup(final_url)
        
        signals = {
            "input": raw,
            "normalized": url,
            "final_url": final_url,
            "unshorten_hops": hops,
            "domain": df,
            "ip": ipaddr,
            "tls": {"ok": tlsok, "note": tlsmsg},
            "snippet": snip,
            "api_results": api_results,
            "ts": int(time.time()),
        }
        
        if api_results:
            verdict = score_combined(api_results, signals)
        else:
            verdict = score_fallback(signals)
            
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
            api_results = combined_file_lookup(file_hash)            
            os.unlink(temp_path)
            
            file_info = {
                "filename": filename,
                "sha256": file_hash,
                "size": os.path.getsize(temp_path) if os.path.exists(temp_path) else 0
            }
            
            verdict = score_file_combined(api_results)
            
            return jsonify({
                "file": file_info,
                "api_results": api_results,
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

    if not QR_AVAILABLE:
        error_msg = f"QR code scanning not available. Available library: {QR_LIB if QR_LIB else 'None'}"
        return jsonify({"error": error_msg}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    # Validate file type
    allowed_image_types = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_image_types:
        return jsonify({"error": f"File type not allowed. Supported types: {', '.join(allowed_image_types)}"}), 400
        
    try:
        # save image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        # scan QR code
        decoded_content, content_type = scan_qr_code(temp_path)        
        os.unlink(temp_path)
        
        if decoded_content:
            if content_type == "url" and decoded_content.startswith(('http://', 'https://')):
                # Process URL scan with combined APIs
                final_url, hops = unshorten(decoded_content)
                df = domain_features(final_url)
                ipaddr = resolve_ip(df.get("host", "")) if df else None
                tlsok, tlsmsg = tls_ok(final_url)
                
                # Get combined results from multiple APIs
                api_results = combined_url_lookup(final_url)
                
                signals = {
                    "final_url": final_url,
                    "unshorten_hops": hops,
                    "domain": df,
                    "ip": ipaddr,
                    "tls": {"ok": tlsok, "note": tlsmsg},
                    "api_results": api_results,
                }
                
                if api_results:
                    verdict = score_combined(api_results, signals)
                else:
                    verdict = score_fallback(signals)
                
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
        return jsonify({"error": f"Failed to scan QR code: {str(e)}"}), 500


#======================================================
# ----------------- Static / Health -------------------
#======================================================
@app.route("/")
def root():
    return send_from_directory("public", "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    if path.startswith('api'):
        return jsonify({'error': 'Not found'}), 404
    
    return send_from_directory("public", path)

@app.route("/health")
def health():
    return jsonify({"ok": True})

#======================================================
# ----------------------- Entry -----------------------
#======================================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
