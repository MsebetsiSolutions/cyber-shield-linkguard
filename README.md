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

### 3. Configure environment
    ```bash
            cp .env.example .env  # then edit your VirusTotal key (optional)

### 4. Run application
    ```bash
            python app.py





Open http://127.0.0.1:5000 in your browser.

## Deploy
Any VPS/Platform-as-a-Service works.

For platforms using Procfile:

web: gunicorn -w 2 -b 0.0.0.0:$PORT app:app

Demo Authentication
This build includes simple localStorage-based demo authentication (Login/Sign Up/Guest). Do not use for production without proper security enhancements.

## Project Structure
        cyber-shield-linkguard/
        |
        ├── cyber-shield-linkguard/
        |      |
        |      ├── app.py  
        |      ├── Procfile
        |      ├── requirements.txt 
        |      ├── .gitignore
        |      ├── .env.example
        |      |
        │      ├── venv/
        |      |     ├── bin/
        |      |     ├── lin/
        |      |     └── pyvenv.cfg
        |      |
        │      ├── routes/ 
        |      |     ├── _pycache_/
        |      |     ├── subscription.py
        |      |     ├── settings.py
        |      |     ├── chats.py
        |      |     └── authentication.py
        |      |
        │      └── public/ 
        |            ├── assets/
        |            ├── icons/
        |            ├── signup/              
        |            |     ├── signup.html
        |            |     ├── signup.css
        |            |     └── signup.js
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
        |            ├── settings/          
        |            |     ├── settings.html
        |            |     ├── settings.css
        |            |     └── settings.js
        |            |
        |            ├── forgotPassword/              
        |            |     ├── forgotPassword.html
        |            |     ├── forgotPassword.css
        |            |     └── forgotPassword.js
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
        |            ├── clarity/          
        |            |     ├── clarity.html
        |            |     ├── clarity.css
        |            |     └── clarity.js
        |            |
        |            ├── login/          
        |            |     ├── login.html
        |            |     ├── login.css
        |            |     └── login.js
        |            |
        |            ├── index.html      
        |            ├── logg.js
        |            ├── manifest.json
        |            ├── sw.js
        |            └── theme.css
        |                
        └── README.md

