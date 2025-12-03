# Suricata Integration

## Quick Start

1. Start the SOC Dashboard:

        python app.py

- The Suricata agent will start automatically when the dashboard launches.

2. Access the Monitoring Page:

- Open your browser and navigate to:

        http://127.0.0.1:5000

Then go to the Monitoring page to view Suricata alerts.

## Prerequisites - Suricata Installation

**For Windows**:

1. Download Suricata:

    - - Get the Windows 64-bit installer from: *https://suricata.io/download/*
    - - File: Suricata-7.0.13-1-64bit.msi

2. Install Npcap (Required for Windows):

    - - Download from: *https://npcap.com/#download/*
    - - Choose "Install Npcap in WinPcap API-compatible Mode"

3. Installation Steps:

    - - Run the Suricata MSI installer
    - - Default installation path: C:\Program Files\Suricata\
    - - Complete the installation wizard

**For Linux/Ubuntu**:

        # Add Suricata PPA and install
        sudo add-apt-repository ppa:oisf/suricata-stable
        sudo apt update
        sudo apt install suricata -y

        # Update Suricata rules
        sudo suricata-update

**For macOS**:

        # Install via Homebrew
        brew install suricata

        # Update rules
        sudo suricata-update

**For Other Systems**:
Download the source package *suricata-7.0.13.tar.gz* from *https://suricata.io/download/* and compile:

        tar -xzf suricata-7.0.13.tar.gz
        cd suricata-7.0.13
        ./configure
        make
        sudo make install

## Starting Suricata Engine

***Method 1: PowerShell/Command Line***

1. Windows:

        # Open PowerShell as Administrator
        cd "C:\Program Files\Suricata"
        .\suricata.exe -c suricata.yaml -i <your_network_interface> -v

2. Linux/macOS:

        # Find your network interface
        ip addr show  # or ifconfig on macOS
        sudo suricata -c /etc/suricata/suricata.yaml -i <your_interface> -v

***Method 2: VS Code Terminal***

1. Open VS Code
2. Open terminal (Ctrl + `)
3. Navigate to Suricata installation directory
4. Run the same command as above

**Finding Your Network Interface:**

- Windows: Run *Get-NetAdapter* in PowerShell

        Get-NetAdapter | Format-Table -AutoSize

        Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias,IPAddress

- Linux: Run *ip link show*

- macOS: Run *ifconfig*

***Example for Wi-Fi interface:***

        # Windows
        .\suricata.exe -c suricata.yaml -i Wi-Fi -v

        # Linux
        sudo suricata -c suricata.yaml -i wlp2s0 -v

## SOC Dashboard Integration

***Automatic Agent Startup***

When you run *"python app.py,"* the system automatically:

- Starts the Flask web server
- Launches suricata_agent.py to forward alerts
- Monitors Suricata's eve.json log file

***Manual Agent Start (if needed)***

        python suricata_agent.py --target http://127.0.0.1:5000

***Location of Eve.json Log Files***:

1. Windows: *C:\Program Files\Suricata\log\eve.json*
2. Linux: */var/log/suricata/eve.json*
3. macOS: */usr/local/var/log/suricata/eve.json*

## Verifying Setup

1. Check Suricata is running:

- Look for eve.json file in the log directory
- File should be growing as packets are captured

2. Check SOC Dashboard:

- Navigate to Monitoring page
- Look for "Suricata IDS Monitoring" section
- Status should show "Connected" with alert counts

3. Test with sample traffic:

        # Generate test traffic
        curl http://example.com
        ping 8.8.8.8

## Log Locations:

- **Suricata logs**: Check the log directory for eve.json
- **SOC agent logs**: View terminal output when running app.py
