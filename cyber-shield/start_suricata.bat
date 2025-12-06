@echo off
echo Starting SOC Dashboard with Suricata Integration...
echo.

REM Start Flask app
echo Starting Flask SOC Dashboard...
start cmd /k "python app.py"

timeout /t 5 /nobreak >nul

REM Start Suricata (adjust path as needed)
echo Starting Suricata IDS...
cd "C:\Program Files\Suricata"
start cmd /k "suricata.exe -c suricata.yaml -i 192.168.0.171 -v"

timeout /t 3 /nobreak >nul

REM Start Suricata Agent
echo Starting Suricata Agent...
cd /d %~dp0
start cmd /k "python suricata_agent.py --target http://127.0.0.1:5000"

echo.
echo All components started!
echo 1. SOC Dashboard: http://127.0.0.1:5000
echo 2. Suricata IDS: Running on interface 192.168.0.171
echo 3. Suricata Agent: Forwarding alerts to dashboard
echo.
pause