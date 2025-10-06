# Cyber Shield LinkGuard

browser-based anti-phishing PWA by Msebetsi Solutions.

---

## Overview
Cyber Shield LinkGuard is a cross-platform cybersecurity tool designed to protect users from malicious links, infected files, and unsafe QR codes. The project integrates with VirusTotal for threat intelligence and provides a lightweight web application that works on both desktop and mobile devices.

## Key Features
- **URL Security Check** – Detect and analyze suspicious URLs using the VirusTotal API
- **File Scanning** – Upload and verify files against malware signatures
- **QR Code Scanner** – Identify and flag malicious QR codes
- **User Authentication** – Secure login and sign-up system
- **Dashboard Interface** – Simple and intuitive candy-themed UI
- **Reporting System** – Report malicious content to authorities
- **Responsive Design** – Works seamlessly on mobile and desktop
- **Cyber Shield Community** – System assistance and troubleshooting, Reporting bugs and issues, Sharing ideas and suggestions, Community support and discussions

## Quick Start
### 1. Create virtual environment
    ```bash        
            python3 -m venv .venv && source .venv/bin/activate

### 2. Install dependencies
    ```bash
            pip install -r requirements.txt
 
### 3. Run application
    ```bash
            python app.py





Open http://127.0.0.1:5000 in your browser.

## Deploy
Any VPS/Platform-as-a-Service works.

For platforms using Procfile:

web: gunicorn -w 2 -b 0.0.0.0:$PORT app:app

Demo Authentication
This build includes simple localStorage-based demo authentication (Login/Sign). Do not use for production without proper security enhancements.

## Project Structure
        cyber-shield-linkguard/
        |
        ├── cyber-shield-linkguard/
        |      |
        |      ├── app.py  
        |      ├── Procfile
        |      ├── apt.txt
        |      ├── requirements.txt 
        |      ├── .gitignore
        |      ├── .env
        |      |
        │      ├── venv/
        |      |     ├── bin/
        |      |     ├── lin/
        |      |     └── pyvenv.cfg
        |      |
        │      ├── routes/ 
        |      |     ├── _pycache_/
        |      |     ├── subscription.py
        |      |     ├── teamCollab.py
        |      |     ├── admin.py
        |      |     ├── scan_results.py
        |      |     ├── settings.py
        |      |     ├── chats.py
        |      |     └── authentication.py
        |      |
        │      └── public/ 
        |            ├── assets/
        |            |
        |            ├── enterprice/        
        |            |     |
        |            |     ├── enter-dash/
        |            |     |          ├── enterprise-dashboard.html
        |            |     |          ├── enterprise-dashboard.css
        |            |     |          └── enterprise-dashboard.js
        |            |     |
        |            |     ├── enterprice_payment/
        |            |     |          ├── enterprice_payment.html
        |            |     |          ├── enterprice_payment.css
        |            |     |          └── enterprice_payment.js
        |            |     |
        |            |     └── start-enter/
        |            |                ├── start-enter.html
        |            |                ├── start-enter.css
        |            |                └── start-enter.js
        |            |
        |            ├── profile/        
        |            |     ├── profile.html
        |            |     ├── profile.css
        |            |     └── profile.js
        |            |
        |            ├── supcom/        
        |            |     ├── supcom.html
        |            |     ├── supcom.css
        |            |     └── supcom.js
        |            |
        |            ├── cyber-awareness/        
        |            |     ├── cyber-awareness.html
        |            |     ├── cyber-awareness.css
        |            |     └── cyber-awareness.js
        |            |
        |            ├── ScannerDash/        
        |            |     ├── ScannerDash.html
        |            |     ├── ScannerDash.css
        |            |     └── ScannerDash.js
        |            |
        |            ├── shareTeamCollab/        
        |            |     ├── shareTeamCollab.html
        |            |     ├── shareTeamCollab.css
        |            |     └── shareTeamCollab.js 
        |            |
        |            ├── Subscription/        
        |            |     ├── Subscription.html
        |            |     ├── Subscription.css
        |            |     └── Subscription.js
        |            |
        |            ├── BackgroundCheck/        
        |            |     ├── ComprehensiveBackgroundCheck.html
        |            |     ├── ComprehensiveBackgroundCheck.css
        |            |     └── ComprehensiveBackgroundCheck.js
        |            |   
        |            ├── settings/          
        |            |     ├── settings.html
        |            |     ├── settings.css
        |            |     └── settings.js
        |            |
        |            ├── report/              
        |            |     ├── report.html
        |            |     ├── report.css
        |            |     └── report.js
        |            |
        |            ├── payment_sys/              
        |            |     ├── payment_sys.html
        |            |     ├── payment_sys.css
        |            |     └── payment_sys.js
        |            |
        |            ├── resetpassword/          
        |            |     ├── resetpassword.html
        |            |     ├── resetpassword.css
        |            |     └── resetpassword.js
        |            |
        |            ├── aeribuferobuf/          
        |            |          ├── wodfbowef.html
        |            |          ├── wodfbowef.css
        |            |          └── wodfbowef.js
        |            |
        |            ├── index.html      
        |            ├── logg.js
        |            ├── manifest.json
        |            ├── session.js
        |            ├── robots.txt
        |            ├── sitemap.xml
        |            ├── sw.js
        |            └── theme.css
        |                
        ├── SECURITY.md
        |
        └── README.md



---