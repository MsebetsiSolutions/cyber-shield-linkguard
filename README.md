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


---


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


---


## Deploy
Any VPS/Platform-as-a-Service works.

For platforms using Procfile:

web: gunicorn -w 2 -b 0.0.0.0:$PORT app:app

Demo Authentication
This build includes simple localStorage-based demo authentication (Login/Sign). Do not use for production without proper security enhancements.


---


## Project Structure
        cyber-shield-linkguard/
        |
        ├── cyber-shield/
        |      |
        |      ├── app.py  
        |      ├── Procfile
        |      ├── apt.txt
        |      ├── requirements.txt 
        |      ├── soc_dashboard.db
        |      ├── .gitignore
        |      ├── .env
        |      |
        │      ├── routes/ 
        |      |     ├── _pycache_/
        |      |     ├── subscription.py
        |      |     ├── teamCollab.py
        |      |     ├── admin.py
        |      |     ├── enterprise.py
        |      |     ├── module.py
        |      |     ├── scan_results.py
        |      |     ├── profile.py
        |      |     ├── email_phishing.py
        |      |     ├── settings.py
        |      |     ├── chats.py
        |      |     ├── exam.py
        |      |     └── authentication.py
        |      |
        │      ├── backend/ 
        |      |     ├── _pycache_/
        |      |     ├── routes_database.py
        |      |     ├── routes_monitoring.py
        |      |     ├── routes_pentesting.py
        |      |     ├── database.py
        |      |     ├── monitoring.py
        |      |     ├── pentesting.py
        |      |     ├── routes_alerts.py
        |      |     ├── routes_host.py
        |      |     ├── routes_intel.py
        |      |     ├── routes_monitor.py
        |      |     ├── routes_reports.py
        |      |     └── routes_settings.py
        |      |
        │      ├── templates/ 
        |      |     ├── assets/
        |      |     |     
        |      |     ├── exam_dashbaord.html
        |      |     ├── exam_question.html
        |      |     ├── exam_results.html
        |      |     └── exam_reviews.html
        |      |
        │      ├── questions/ 
        |      |     ├── week1_questions.json
        |      |     ├── week2_questions.json
        |      |     ├── week3_questions.json
        |      |     ├── week4_questions.json
        |      |     ├── week5_questions.json
        |      |     ├── week6_questions.json
        |      |     ├── week7_questions.json
        |      |     ├── week8_questions.json
        |      |     ├── week9_questions.json
        |      |     ├── week10_questions.json
        |      |     ├── week11_questions.json
        |      |     └── week12_questions.json
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
        |            ├── CyberSmart_Learning_Dashboard/
        |            |     ├── Grade 1 and 2 cybersecurity course/
        |            |     ├── Grade 3 & 4 - Cyber Agents/
        |            |     ├── Grade 5 & 6 - Future Cyber Defenders/
        |            |     ├── Grade R - My Digital World/
        |            |     └── index.html
        |            |
        |            ├── cyber-awareness/        
        |            |     ├── cyber-awareness.html
        |            |     ├── cyber-awareness.css
        |            |     └── cyber-awareness.js
        |            |
        |            ├── Modules/
        |            |     ├── modules.css
        |            |     ├── modules.js
        |            |     ├── modules.html
        |            |     ├── week1.html
        |            |     ├── week2.html
        |            |     ├── week6.html
        |            |     ├── week7.html
        |            |     ├── week8.html
        |            |     ├── week9.html
        |            |     └── week11.html
        |            |
        |            ├── ScannerDash/        
        |            |     ├── ScannerDash.html
        |            |     ├── ScannerDash.css
        |            |     └── ScannerDash.js
        |            |
        |            ├── ScannerDashOut/        
        |            |     ├── ScannerDashOut.html
        |            |     ├── ScannerDashOut.css
        |            |     └── ScannerDashOut.js
        |            |
        |            ├── soc/        
        |            |     |
        |            |     ├── assets/
        |            |     |      ├── css/
        |            |     |      |    └── style.css
        |            |     |      |
        |            |     |      └── js/
        |            |     |           ├── data/
        |            |     |           |    └── sample-data.js
        |            |     |           |
        |            |     |           ├── monitoring.js
        |            |     |           └── app.js
        |            |     |
        |            |     ├── pages/
        |            |     |      ├── alerts.html
        |            |     |      ├── intel.html
        |            |     |      ├── monitoring.html
        |            |     |      ├── pentesting.html
        |            |     |      ├── reports.html
        |            |     |      └── settings.html
        |            |     |
        |            |     └── index.html
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
        |            ├── create.html
        |            ├── logg.js
        |            ├── manifest.json
        |            ├── Nigerian_Fraud.csv
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

