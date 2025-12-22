<<<<<<< HEAD
# backend/routes_database.py
from flask import Blueprint, request, jsonify
from .database import initialize_db, fetch_data, insert_incident, save_log

database_bp = Blueprint("database", __name__)

@database_bp.post("/api/database/initialize")
def api_initialize_db():
    """Initialize the database"""
    try:
        initialize_db()
        return jsonify({"status": "success", "message": "Database initialized successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/fetch")
def api_fetch_data():
    """Fetch data from a table"""
    data = request.get_json() or {}
    table_name = data.get("table_name", "")
    
    if not table_name:
        return jsonify({"error": "Table name required"}), 400
    
    try:
        rows = fetch_data(table_name)
        return jsonify({
            "table": table_name,
            "rows": rows,
            "count": len(rows)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/incident")
def api_insert_incident():
    """Insert a new incident"""
    data = request.get_json() or {}
    description = data.get("description", "")
    
    if not description:
        return jsonify({"error": "Description required"}), 400
    
    try:
        insert_incident(description)
        return jsonify({"status": "success", "message": "Incident added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/log")
def api_save_log():
    """Save a log message"""
    data = request.get_json() or {}
    message = data.get("message", "")
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        save_log(message)
        return jsonify({"status": "success", "message": "Log saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/tables")
def api_get_tables():
    """Get list of available tables"""
    try:
        import sqlite3
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        return jsonify({"tables": tables})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
=======
# backend/routes_database.py
from flask import Blueprint, request, jsonify
from .database import initialize_db, fetch_data, insert_incident, save_log

database_bp = Blueprint("database", __name__)

@database_bp.post("/api/database/initialize")
def api_initialize_db():
    """Initialize the database"""
    try:
        initialize_db()
        return jsonify({"status": "success", "message": "Database initialized successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/fetch")
def api_fetch_data():
    """Fetch data from a table"""
    data = request.get_json() or {}
    table_name = data.get("table_name", "")
    
    if not table_name:
        return jsonify({"error": "Table name required"}), 400
    
    try:
        rows = fetch_data(table_name)
        return jsonify({
            "table": table_name,
            "rows": rows,
            "count": len(rows)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/incident")
def api_insert_incident():
    """Insert a new incident"""
    data = request.get_json() or {}
    description = data.get("description", "")
    
    if not description:
        return jsonify({"error": "Description required"}), 400
    
    try:
        insert_incident(description)
        return jsonify({"status": "success", "message": "Incident added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/log")
def api_save_log():
    """Save a log message"""
    data = request.get_json() or {}
    message = data.get("message", "")
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        save_log(message)
        return jsonify({"status": "success", "message": "Log saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@database_bp.post("/api/database/tables")
def api_get_tables():
    """Get list of available tables"""
    try:
        import sqlite3
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        return jsonify({"tables": tables})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
>>>>>>> deploy
