# -*- coding: utf-8 -*-
from flask import Flask, send_from_directory
import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

app = Flask(__name__, static_folder="public")

@app.route("/")
def root():
    """Serve the main SOC dashboard"""
    try:
        return send_from_directory("public/soc", "index.html")
    except Exception as e:
        print(f"Error serving index.html: {e}")
        return f"Error: {e}", 500

@app.route("/assets/<path:path>")
def serve_soc_assets(path):
    """Serve assets from soc/assets directory"""
    try:
        return send_from_directory("public/soc/assets", path)
    except Exception as e:
        print(f"Error serving asset {path}: {e}")
        return f"Asset not found: {path}", 404

@app.route("/pages/<path:path>")
def serve_pages(path):
    """Serve pages from soc/pages directory"""
    try:
        return send_from_directory("public/soc/pages", path)
    except Exception as e:
        print(f"Error serving page {path}: {e}")
        return f"Page not found: {path}", 404

if __name__ == "__main__":
    print("Starting test server on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
