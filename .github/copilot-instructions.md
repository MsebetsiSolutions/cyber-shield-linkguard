## Copilot instructions for Cyber Shield LinkGuard

This file contains focused guidance for automated coding agents working on the Cyber Shield LinkGuard Flask app. Keep changes minimal and follow the project's conventions.

- Project entry: `cyber-shield/app.py` (Flask app). Blueprints live in `cyber-shield/routes/` and are registered inside `app.py`.
- Static/PWA front-end: served from `cyber-shield/public/`. Email templates are plain HTML files in `public/email-templates/` (not Jinja templates).
- Database: lightweight SQLite file `cyber-shield/cyber-shield-linkguard.db`. No migration framework present; schema is edited manually.

Key architecture and flows
- app.py centralizes helper functions and heuristics (URL normalization, `unshorten`, `domain_features`, `fetch_snippet`, rate limiting). Reuse these helpers when adding scanning/analysis features.
- Authentication is session-based (Flask `session`) implemented in `routes/authentication.py`. New endpoints should respect `session['user_id']` checks already used across `routes/*` (see `scan_results.save_scan`).
- Each route file exposes a Blueprint (e.g., `email_phishing_bp`) and endpoints are typically mounted under prefixes from `app.py` (for example `/api/auth`, `/api/scans`, `/api/phishing`).

Run / debug locally
- Create a virtualenv and install requirements: `pip install -r cyber-shield/requirements.txt`.
- Start the app for development: `python cyber-shield/app.py` (app listens on 127.0.0.1:5000). Production Procfile: `web: gunicorn app:app --workers=2 --bind 0.0.0.0:$PORT`.
- Environment variables used in code: `FLASK_SECRET_KEY`, `VT_API_KEY`, `DYMO_API_KEY`, `BASE_URL`, (MailerSend credentials are read by `routes/authentication.py` / mailersend client). Provide them via a `.env` for local testing but never commit secrets.

Project-specific conventions & patterns
- Blueprint pattern: create new route file under `cyber-shield/routes/` returning a Blueprint and register it in `app.py`. Example: `email_phishing.py` defines `email_phishing_bp` and is registered as `app.register_blueprint(email_phishing_bp, url_prefix='/api/phishing')`.
- Template rendering: email templates are simple placeholder-based replacements (see `routes/email_phishing.py` — placeholders like `[first_name]`). Use `markupsafe.escape` when injecting user-provided values.
- Flexible request fields: several endpoints accept multiple naming conventions (e.g., `firstName`, `firstname`, `first_name`). Follow that tolerant parsing style for compatibility.
- Logging: code uses plain `print()` statements for operational logs. When adding operationally-important logs, use the same style unless migrating to a logger is requested.
- Security: passwords hashed with `bcrypt` (see `authentication.signup`). Session handling is simple; be cautious when changing auth flow.

External integrations & optional dependencies
- VirusTotal: look for `VT_API_KEY` usage in `app.py` (`vt_lookup` helpers). Network calls use `requests` and the `UA` header constant.
- MailerSend: used for sending confirmation/reset emails in `routes/authentication.py`.
- QR scanning: optional runtime imports (`pyzbar`, `qreader`, OpenCV) with fallbacks. Check `app.py` import logic.

Where to change things safely
- Add API endpoints: new file in `routes/` exposing a Blueprint -> import and register in `app.py`.
- Add front-end pages: drop files into `public/` and link them via existing client-side routing.
- Database changes: update the SQLite file; tests/migrations are not available — preserve backward compatibility.

Concrete examples (use as reference patterns)
- Generate phishing email (POST JSON to `/api/phishing/generate`): accepts keys like `firstName`/`firstname`, `email`, `company`, `platform`. It loads `public/email-templates/{platform}-template.html` or falls back to `email-template.html`.
- Save a scan (POST to `/api/scans/save`): requires an authenticated session (`session['user_id']`) and JSON fields `scan_type`, `content`, `result`, `verdict_band`.

Notes for contributors/agents
- There are no unit tests or CI configs in the repo; add tests conservatively alongside behavior changes.
- Avoid committing secrets or `.env` files. Use environment variables when testing mail or VirusTotal integrations.
- Prefer small, reversible changes. Add feature flags or config checks when introducing external network calls.

If anything here is unclear or you need more examples (payloads, database schema, or how a specific blueprint is wired), tell me which area and I will expand the file with exact snippets or add small integration tests.
