from flask import Flask, request, jsonify, send_from_directory, session
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
        print("No QR code library available - QR scanning disabled")


#importing blueprints
from routes.authentication import auth_bp
from routes.subscription import subscription_bp
from routes.settings import settings_bp
from routes.scan_results import scan_results_bp
from routes.chats import chats_bp
from routes.profile import profile_bp

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


VT_API_KEY = os.getenv("VT_API_KEY", "").strip()
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


#======================================================
# ---------------------- Helpers ----------------------
#======================================================

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

def vt_lookup(u: str):
    if not VT_API_KEY:
        return {"enabled": False}
    
    try:
        # First try to get existing report
        url_id = base64.urlsafe_b64encode(u.encode()).decode().strip('=')
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
                "total_engines": sum(stats.values()) if stats else 0
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
                        "total_engines": sum(stats.values()) if stats else 0
                    }
        
        return {"enabled": True, "error": "Failed to get results"}
        
    except Exception as e:
        print(f"VirusTotal error: {e}")
        return {"enabled": True, "error": str(e)}

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
                "total_engines": sum(stats.values()) if stats else 0
            }
        return {"enabled": True, "error": True}
    except Exception as e:
        print(f"VirusTotal file error: {e}")
        return {"enabled": True, "error": True}

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
        
        return None, "unknown"
        
    except Exception as e:
        print(f"QR scan error: {e}")
        return None, "error"
    
def score_fallback(signals: dict) -> dict:
    """Fallback scoring when Cyber Shield fails"""
    s = 0
    reasons = ["Cyber Shield scan unavailable - using heuristic analysis"]
    
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

def score(signals: dict) -> dict:
    s = 0
    reasons = []
    
    vt = signals.get("Cyber Shield", {})
    if vt.get("enabled") and not vt.get("error"):
        malicious = vt.get("malicious", 0)
        suspicious = vt.get("suspicious", 0)
        total_engines = vt.get("total_engines", 0) or (malicious + suspicious + vt.get("harmless", 0) + vt.get("undetected", 0))
        
        if total_engines > 0:
            # Calculate threat percentage
            threat_percentage = ((malicious + suspicious) / total_engines) * 100
            
            s = min(100, threat_percentage * 2)  # Scale 0-100
            
            if malicious > 0:
                reasons.append(f"Detected as malicious by {malicious} security engines")
            if suspicious > 0:
                reasons.append(f"Detected as suspicious by {suspicious} security engines")
            if malicious == 0 and suspicious == 0:
                reasons.append("No threats detected by security engines")
        else:
            reasons.append("No scan results available from security engines")
            s = 50  # Medium risk when no data
    
    # Add secondary heuristic factors (reduced weight)
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

def score_file(vt_result: dict) -> dict:
    s = 0
    reasons = []
    
    if vt_result.get("enabled") and not vt_result.get("error"):
        malicious = vt_result.get("malicious", 0)
        suspicious = vt_result.get("suspicious", 0)
        total_engines = vt_result.get("total_engines", 0) or (malicious + suspicious + vt_result.get("harmless", 0) + vt_result.get("undetected", 0))
        
        if total_engines > 0:
            # Calculate threat percentage
            threat_percentage = ((malicious + suspicious) / total_engines) * 100
            
            s = min(100, threat_percentage * 2)
            
            if malicious > 0:
                reasons.append(f"Detected as malicious by {malicious} security engines")
            if suspicious > 0:
                reasons.append(f"Detected as suspicious by {suspicious} security engines")
            if malicious == 0 and suspicious == 0:
                reasons.append("No threats detected by security engines")
        else:
            reasons.append("No scan results available from security engines")
            s = 50  # Medium risk when no data
    else:
        reasons.append("Cyber Shield scan not available")
        s = 50  # Medium score when scan is unavailable
    
    s = max(0, min(100, s))
    band = next(b for lo, hi, b in RISK_BANDS if lo <= s <= hi)
    return {"score": s, "band": band, "reasons": reasons}


#======================================================
# ------------------------ API ------------------------
#======================================================

@app.route("/api/users", methods=["GET"])
def get_users():
    """Get all users from the database for channel creation"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all users with only necessary fields (excluding password)
        cursor.execute("SELECT id, email, full_name, created_at FROM users ORDER BY full_name")
        users = cursor.fetchall()
        
        # Convert to list of dictionaries
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'created_at': user['created_at']
            })
        
        conn.close()
        return jsonify(users_list)
    
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"error": "Failed to fetch users"}), 500

@app.route("/api/channels", methods=["POST"])
def create_channel():
    """Create a new channel"""
    try:
        # Check if user is logged in
        if 'user_id' not in session:
            return jsonify({"error": "You must be logged in to create a channel"}), 401
        
        # Get the current user ID from session
        creator_id = session['user_id']
        creator_name = session.get('user_full_name', '')
        
        # Debug logging
        print(f"Creating channel with creator ID: {creator_id}, Name: {creator_name}")
        print(f"Session data: {session}")
        
        data = request.get_json()
        channel_name = data.get('name')
        user_ids = data.get('users', [])
        
        # Make sure creator_id is an integer
        try:
            creator_id = int(creator_id)
        except (ValueError, TypeError):
            print(f"Warning: Invalid creator_id format: {creator_id}, defaulting to 1")
            creator_id = 1
        
        # Make sure the creator is included in the members list
        if creator_id not in user_ids:
            user_ids.append(creator_id)
        
        if not channel_name:
            return jsonify({"error": "Channel name is required"}), 400
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Check if a channel with this name already exists
        cursor.execute("SELECT id FROM channels WHERE name = ?", (channel_name,))
        existing_channel = cursor.fetchone()
        
        if existing_channel:
            # Channel already exists, get its ID and members
            channel_id = existing_channel[0]
            
            # Get existing members
            cursor.execute("SELECT user_id FROM channel_members WHERE channel_id = ?", (channel_id,))
            existing_members = [row[0] for row in cursor.fetchall()]
            
            # Add any new members not already in the channel
            for user_id in user_ids:
                if user_id not in existing_members:
                    cursor.execute(
                        "INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)",
                        (channel_id, user_id)
                    )
            
            conn.commit()
            
            # Get updated member list
            cursor.execute("""
                SELECT u.id, u.full_name 
                FROM channel_members cm 
                JOIN users u ON cm.user_id = u.id 
                WHERE cm.channel_id = ?
            """, (channel_id,))
            members = cursor.fetchall()
            members_list = [{"id": member[0], "full_name": member[1]} for member in members]
            
            conn.close()
            
            return jsonify({
                "id": channel_id,
                "name": channel_name,
                "members": members_list,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "message": "Channel already exists, members updated"
            })
        else:
            # Insert new channel if it doesn't exist
            cursor.execute(
                "INSERT INTO channels (name, created_by) VALUES (?, ?)",
                (channel_name, creator_id)  # Using the logged-in user's ID
            )
            
            channel_id = cursor.lastrowid
            
            # Add members to the channel
            for user_id in user_ids:
                cursor.execute(
                    "INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)",
                    (channel_id, user_id)
                )
            
            # Get member information for response
            cursor.execute("""
                SELECT u.id, u.full_name 
                FROM channel_members cm 
                JOIN users u ON cm.user_id = u.id 
                WHERE cm.channel_id = ?
            """, (channel_id,))
            members = cursor.fetchall()
            members_list = [{"id": member[0], "full_name": member[1]} for member in members]
            
            conn.commit()
            conn.close()
            
            return jsonify({
                "id": channel_id,
                "name": channel_name,
                "members": members_list,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "message": "Channel created successfully"
            })
    
    except Exception as e:
        print(f"Error creating channel: {e}")
        return jsonify({"error": "Failed to create channel"}), 500

@app.route("/api/channels/<int:channel_id>", methods=["DELETE"])
def delete_channel(channel_id):
    """Delete a channel"""
    try:
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Delete channel (this will cascade delete channel_members due to ON DELETE CASCADE)
        cursor.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Channel not found"}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": f"Channel {channel_id} deleted successfully"
        })
    
    except Exception as e:
        print(f"Error deleting channel: {e}")
        return jsonify({"error": "Failed to delete channel"}), 500

# Debug endpoint to check session data
@app.route("/api/debug/session", methods=["GET"])
def debug_session():
    """Debug endpoint to check current session data"""
    if 'user_id' not in session:
        return jsonify({"authenticated": False, "message": "Not logged in"}), 200
    
    return jsonify({
        "authenticated": True,
        "user_id": session.get('user_id'),
        "user_full_name": session.get('user_full_name'),
        "user_email": session.get('user_email'),
        "plan_mode": session.get('plan_mode'),
        "session_keys": list(session.keys())
    }), 200

# Debug endpoint to check user data in database
@app.route("/api/debug/users", methods=["GET"])
def debug_users():
    """Debug endpoint to check users in database"""
    try:
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all users
        cursor.execute("SELECT id, full_name, email FROM users")
        users = cursor.fetchall()
        
        user_list = [{
            "id": user['id'], 
            "full_name": user['full_name'], 
            "email": user['email']
        } for user in users]
        
        conn.close()
        return jsonify({"users": user_list})
    
    except Exception as e:
        print(f"Error fetching users for debug: {e}")
        return jsonify({"error": "Failed to fetch users"}), 500

@app.route("/api/channels", methods=["GET"])
def get_channels():
    """Get all channels with their members"""
    try:
        # Log current user from session
        current_user_id = session.get('user_id')
        current_user_name = session.get('user_full_name')
        print(f"Getting channels for session user: ID={current_user_id}, Name={current_user_name}")
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        conn.row_factory = sqlite3.Row  # This makes the database return rows as dictionaries
        cursor = conn.cursor()
        
        # Get all channels with creator info
        cursor.execute("""
            SELECT c.id, c.name, c.created_at, c.created_by, u.full_name as creator_name
            FROM channels c
            LEFT JOIN users u ON c.created_by = u.id
            ORDER BY c.created_at DESC
        """)
        
        channels = cursor.fetchall()
        
        channels_list = []
        for channel in channels:
            channel_id = channel['id']
            name = channel['name']
            created_at = channel['created_at']
            creator_id = channel['created_by']
            creator_name = channel['creator_name']
            
            print(f"Channel: {name}, Creator ID: {creator_id}, Creator Name: {creator_name}")
            
            # Get members for this channel
            cursor.execute("""
                SELECT u.id, u.full_name 
                FROM channel_members cm 
                JOIN users u ON cm.user_id = u.id 
                WHERE cm.channel_id = ?
                ORDER BY cm.joined_at
            """, (channel_id,))
            
            members = cursor.fetchall()
            members_list = [{"id": member['id'], "full_name": member['full_name']} for member in members]
            
            # Debug: print members
            print(f"Channel {name} members: {members_list}")
            
            channels_list.append({
                "id": channel_id,
                "name": name,
                "created_at": created_at,
                "created_by": {
                    "id": creator_id,
                    "full_name": creator_name or "Unknown User"
                },
                "members": members_list
            })
        
        conn.close()
        return jsonify(channels_list)
    
    except Exception as e:
        print(f"Error fetching channels: {e}")
        return jsonify({"error": "Failed to fetch channels"}), 500

# Debug endpoint to update a channel's creator
@app.route("/api/debug/update_channel_creator/<int:channel_id>", methods=["POST"])
def update_channel_creator(channel_id):
    """Debug endpoint to update a channel's creator"""
    try:
        # Ensure user is logged in
        if 'user_id' not in session:
            return jsonify({"error": "You must be logged in to update a channel"}), 401
        
        # Get the current user ID from session
        new_creator_id = session['user_id']
        
        conn = sqlite3.connect('cyber-shield-linkguard.db')
        cursor = conn.cursor()
        
        # Check if channel exists
        cursor.execute("SELECT id FROM channels WHERE id = ?", (channel_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Channel not found"}), 404
        
        # Update the channel's creator
        cursor.execute(
            "UPDATE channels SET created_by = ? WHERE id = ?",
            (new_creator_id, channel_id)
        )
        
        # Make sure user is a member of the channel
        cursor.execute(
            "INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)",
            (channel_id, new_creator_id)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"Channel {channel_id} creator updated to user {new_creator_id}"
        })
    
    except Exception as e:
        print(f"Error updating channel creator: {e}")
        return jsonify({"error": "Failed to update channel creator"}), 500

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
        
        # results with timeout
        vt = {}
        try:
            vt = vt_lookup(final_url)
        except Exception as vt_error:
            print(f"Cyber Shield lookup failed: {vt_error}")
            vt = {"enabled": True, "error": "Cyber Shield scan failed"}
        
        if vt.get("error"):
            # Create a basic score based on heuristics only
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
            verdict = score_fallback(signals)
        else:
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
            vt_result = vt_file_lookup(file_hash)            
            os.unlink(temp_path)
            
            file_info = {
                "filename": filename,
                "sha256": file_hash,
                "size": os.path.getsize(temp_path) if os.path.exists(temp_path) else 0
            }
            
            verdict = score_file(vt_result)
            
            return jsonify({
                "file": file_info,
                "Cyber Shield": vt_result,
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
        return jsonify({"error": "QR code scanning not available - required libraries not installed"}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        # save image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        # scan QR code
        decoded_content, content_type = scan_qr_code(temp_path)        
        os.unlink(temp_path)
        
        if decoded_content:
            if content_type == "url" and decoded_content.startswith(('http://', 'https://')):
                
                final_url, hops = unshorten(decoded_content)
                df = domain_features(final_url)
                ipaddr = resolve_ip(df.get("host", "")) if df else None
                tlsok, tlsmsg = tls_ok(final_url)
                
                # Get results for the URL
                vt = {}
                try:
                    vt = vt_lookup(final_url)
                except Exception as vt_error:
                    print(f"Cyber Shield lookup failed: {vt_error}")
                    vt = {"enabled": True, "error": "Cyber Shield scan failed"}
                
                signals = {
                    "final_url": final_url,
                    "unshorten_hops": hops,
                    "domain": df,
                    "ip": ipaddr,
                    "tls": {"ok": tlsok, "note": tlsmsg},
                    "Cyber Shield": vt,
                }
                
                # Use appropriate scoring based on VT availability
                if vt.get("error"):
                    verdict = score_fallback(signals)
                else:
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
