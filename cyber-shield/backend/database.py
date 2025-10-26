import sqlite3
import datetime

def initialize_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # Create tables if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'Pending'
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS compliance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_name TEXT NOT NULL,
        status TEXT DEFAULT 'Compliant'
    )
    """)

    # Add a default admin user
    cursor.execute("""
    INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin123')
    """)

    conn.commit()
    conn.close()

def fetch_data(table_name):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    conn.close()
    return rows

def insert_incident(description):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO incidents (timestamp, description) VALUES (?, ?)", (timestamp, description))
    conn.commit()
    conn.close()


def save_log(message):
    """Save logs to the SQLite database."""
    conn = sqlite3.connect('cybersecurity_tool.db')
    c = conn.cursor()
    c.execute("INSERT INTO logs (log_message) VALUES (?)", (message,))
    conn.commit()
    conn.close()

