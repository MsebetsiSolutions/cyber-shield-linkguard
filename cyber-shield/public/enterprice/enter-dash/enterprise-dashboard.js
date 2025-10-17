class EnterpriseDashboard {
    constructor() {
        this.currentSection = 'overview';
        this.companyName = localStorage.getItem('enterprise_company') || 'Enterprise';
        this.init();
    }

    init() {
        this.displayCompanyName();
        this.setupNavigation();
        this.setupEventListeners();
        this.loadDashboardData();
        this.checkEnterpriseAccess();
        this.setupConstructionModal();
    }

    displayCompanyName() {
        const companyDisplay = document.getElementById('company-name-display');
        if (companyDisplay) {
            companyDisplay.textContent = this.companyName;
        }
    }

    setupNavigation() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Quick action cards
        document.getElementById('quick-scan')?.addEventListener('click', () => {
            this.switchSection('scanner');
        });

        document.getElementById('team-management')?.addEventListener('click', () => {
            this.switchSection('teams');
        });

        document.getElementById('reports-view')?.addEventListener('click', () => {
            this.switchSection('reports');
        });

        document.getElementById('brand-check')?.addEventListener('click', () => {
            this.switchSection('reputation');
        });
    }

    setupEventListeners() {
        // Exit modal
        document.getElementById('logo-button')?.addEventListener('click', () => {
            this.showExitModal();
        });

        document.getElementById('cancel-exit')?.addEventListener('click', () => {
            this.hideExitModal();
        });

        document.getElementById('confirm-exit')?.addEventListener('click', () => {
            window.location.href = '../../../ScannerDash/ScannerDash.html';
        });

        // Scanner functionality
        this.setupScanner();

        // Reports functionality
        this.setupReports();

        // Reputation functionality
        this.setupReputation();

        // Teams functionality
        this.setupTeams();

        // SIEM functionality
        this.setupSIEM();

        // Threat Feed functionality
        this.setupThreatFeed();

        // Support functionality
        this.setupSupport();

        // Settings functionality
        this.setupSettings();
    }

    setupConstructionModal() {
        // Close construction modal
        document.getElementById('close-construction')?.addEventListener('click', () => {
            this.hideConstructionModal();
        });
    }

    showConstructionModal(message = "This feature is currently being developed and will be available soon.") {
        document.getElementById('construction-message').textContent = message;
        document.getElementById('construction-modal').classList.add('active');
    }

    hideConstructionModal() {
        document.getElementById('construction-modal').classList.remove('active');
    }

    setupScanner() {
        // Scan type switching
        document.querySelectorAll('.scan-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.scan-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');

                const scanType = option.getAttribute('data-type');
                this.showScanInput(scanType);
            });
        });

        // URL scanning
        document.getElementById('scan-url-btn')?.addEventListener('click', () => {
            this.scanURL();
        });

        // File scanning
        document.getElementById('file-input')?.addEventListener('change', (e) => {
            this.scanFiles(e.target.files);
        });

        // QR scanning
        document.getElementById('qr-input')?.addEventListener('change', (e) => {
            this.scanQRCode(e.target.files[0]);
        });
    }

    setupReports() {
        document.getElementById('generate-report')?.addEventListener('click', () => {
            this.showConstructionModal("Custom branded reports feature is under construction. This will allow you to generate detailed threat analysis reports with your company branding.");
        });
    }

    setupReputation() {
        document.getElementById('check-reputation')?.addEventListener('click', () => {
            const domain = document.getElementById('domain-input').value.trim();
            if (!domain) {
                alert('Please enter a domain to check');
                return;
            }
            this.showConstructionModal(`Brand reputation check for ${domain} is under construction. This feature will provide comprehensive reputation monitoring for your domains.`);
        });

        document.getElementById('save-monitoring')?.addEventListener('click', () => {
            this.showConstructionModal("Continuous monitoring settings feature is under construction. This will enable 24/7 brand reputation monitoring with customizable alert thresholds.");
        });
    }

    setupTeams() {
        document.getElementById('add-user')?.addEventListener('click', () => {
            const email = document.getElementById('user-email').value.trim();
            if (!email) {
                alert('Please enter user email');
                return;
            }
            this.showConstructionModal(`Team member management feature is under construction. This will allow you to add ${email} to your enterprise team with role-based permissions.`);
        });

        document.getElementById('create-workspace')?.addEventListener('click', () => {
            const name = document.getElementById('workspace-name').value.trim();
            if (!name) {
                alert('Please enter workspace name');
                return;
            }
            this.showConstructionModal(`Workspace creation feature is under construction. This will create a new shared workspace named "${name}" for your team collaboration.`);
        });
    }

    setupSIEM() {
        document.getElementById('test-siem')?.addEventListener('click', () => {
            this.showConstructionModal("SIEM integration testing feature is under construction. This will test the connection to your Security Information and Event Management system.");
        });

        document.getElementById('save-siem')?.addEventListener('click', () => {
            this.showConstructionModal("SIEM configuration feature is under construction. This will save your SIEM integration settings for automatic threat data sharing.");
        });
    }

    setupThreatFeed() {
        document.getElementById('refresh-feed')?.addEventListener('click', () => {
            this.showConstructionModal("Threat intelligence feed refresh feature is under construction. This will update the feed with the latest threat indicators and security advisories.");
        });

        document.getElementById('export-feed')?.addEventListener('click', () => {
            this.showConstructionModal("Threat feed export feature is under construction. This will allow you to export threat intelligence data in various formats for analysis.");
        });
    }

    setupSupport() {
        document.getElementById('call-support')?.addEventListener('click', () => {
            this.showConstructionModal("24/7 phone support feature is under construction. Enterprise customers will have access to dedicated phone support with priority routing.");
        });

        document.getElementById('start-chat')?.addEventListener('click', () => {
            this.showConstructionModal("Live chat support feature is under construction. This will provide instant messaging support with dedicated enterprise support agents.");
        });

        document.getElementById('create-ticket')?.addEventListener('click', () => {
            document.getElementById('ticket-creation').style.display = 'block';
        });

        document.getElementById('cancel-ticket')?.addEventListener('click', () => {
            document.getElementById('ticket-creation').style.display = 'none';
        });

        document.getElementById('submit-ticket')?.addEventListener('click', () => {
            const subject = document.getElementById('ticket-subject').value.trim();
            if (!subject) {
                alert('Please enter ticket subject');
                return;
            }
            this.showConstructionModal("Priority ticket system feature is under construction. Your support ticket will be handled with priority by our dedicated customer success team.");
            document.getElementById('ticket-creation').style.display = 'none';
        });
    }

    setupSettings() {
        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Settings buttons
        document.querySelector('.save-settings-btn')?.addEventListener('click', () => {
            this.showConstructionModal("Settings save feature is under construction. Your enterprise configuration will be saved across all team workspaces.");
        });

        document.querySelector('.reset-settings-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to defaults?')) {
                this.showConstructionModal("Settings reset feature is under construction. This will restore all enterprise settings to their default values.");
            }
        });

        // API key buttons
        document.querySelector('.copy-btn')?.addEventListener('click', () => {
            this.showConstructionModal("API key copy feature is under construction. This will copy your enterprise API key to the clipboard securely.");
        });

        document.querySelector('.regenerate-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
                this.showConstructionModal("API key regeneration feature is under construction. This will generate a new API key for your enterprise account.");
            }
        });
    }

    async checkEnterpriseAccess() {
        try {
            const response = await fetch('/api/enterprise/dashboard-data');
            if (!response.ok) {
                throw new Error('Enterprise access not verified');
            }
        } catch (error) {
            alert('Enterprise access required. Redirecting to verification...');
            window.location.href = '../start-enter/start-enter.html';
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/enterprise/dashboard-data');
            const data = await response.json();

            if (response.ok) {
                this.updateDashboardStats(data.stats);
                this.displayRecentThreats(data.recent_threats);
                this.displayTeamMembers(data.team_members || []);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Load mock data for demonstration
            this.loadMockData();
        }
    }

    loadMockData() {
        // Mock dashboard stats
        this.updateDashboardStats({
            total_scans_today: 12482,
            threats_found: 1128,
            active_users: 2013,
            workspaces: 18
        });

        // Mock recent threats
        this.displayRecentThreats([
            {
                id: 1,
                title: "Phishing kit distributed via zip",
                severity: "High",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                title: "Malware PE detected in email attachment",
                severity: "Critical",
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                title: "Suspicious domain engaging in typosquatting",
                severity: "Medium",
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            }
        ]);

        // Mock team members
        this.displayTeamMembers([
            { id: 1, name: "Aisha M.", email: "aisha@company.com", role: "Admin" },
            { id: 2, name: "Thabo N.", email: "thabo@company.com", role: "Analyst" },
            { id: 3, name: "Lerato M.", email: "lerato@company.com", role: "Developer" }
        ]);
    }

    updateDashboardStats(stats) {
        document.getElementById('total-scans').textContent = stats.total_scans_today.toLocaleString();
        document.getElementById('threats-found').textContent = stats.threats_found.toLocaleString();
        document.getElementById('active-users').textContent = stats.active_users.toLocaleString();
        document.getElementById('workspaces').textContent = stats.workspaces;
    }

    displayRecentThreats(threats) {
        const container = document.getElementById('recent-threats');
        if (!container) return;

        container.innerHTML = threats.map(threat => `
            <div class="threat-item">
                <div class="threat-severity ${threat.severity.toLowerCase()}">${threat.severity}</div>
                <div class="threat-content">
                    <div class="threat-title">${threat.title}</div>
                    <div class="threat-time">${new Date(threat.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    displayTeamMembers(members) {
        const container = document.getElementById('team-members-body');
        if (!container) return;

        container.innerHTML = members.map(member => `
            <div class="team-member">
                <span>${member.name}</span>
                <span>${member.email}</span>
                <span>${member.role}</span>
                <span>
                    <button class="action-btn edit-btn" data-member="${member.id}">Edit</button>
                    <button class="action-btn remove-btn" data-member="${member.id}">Remove</button>
                </span>
            </div>
        `).join('');

        // Add event listeners to action buttons
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.getAttribute('data-member');
                this.showConstructionModal(`Team member editing feature is under construction. This will allow you to modify permissions for user ID: ${memberId}`);
            });
        });

        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.getAttribute('data-member');
                if (confirm('Are you sure you want to remove this team member?')) {
                    this.showConstructionModal(`Team member removal feature is under construction. This will remove user ID: ${memberId} from your enterprise team.`);
                }
            });
        });
    }

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('active');
            }
        });

        // Show target section
        const targetSection = document.querySelector(`.${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentSection = sectionName;
    }

    showScanInput(scanType) {
        document.querySelectorAll('.scan-input-area > div').forEach(div => {
            div.classList.remove('active');
        });

        const targetInput = document.querySelector(`.${scanType}-scan`);
        if (targetInput) {
            targetInput.classList.add('active');
        }
    }

    async scanURL() {
        const urlInput = document.getElementById('url-input');
        const url = urlInput.value.trim();

        if (!url) {
            alert('Please enter a URL to scan');
            return;
        }

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            const result = await response.json();
            this.displayScanResult(result, 'URL Scan');
        } catch (error) {
            this.displayError('Scan failed: ' + error.message);
        }
    }

    async scanFiles(files) {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let file of files) {
            formData.append('file', file);
        }

        try {
            const response = await fetch('/api/scan_file', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.displayScanResult(result, 'File Scan');
        } catch (error) {
            this.displayError('File scan failed: ' + error.message);
        }
    }

    async scanQRCode(file) {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/scan_qr', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.displayScanResult(result, 'QR Scan');
        } catch (error) {
            this.displayError('QR scan failed: ' + error.message);
        }
    }

    displayScanResult(result, scanType) {
        const resultsContainer = document.getElementById('scan-results');
        if (!resultsContainer) return;

        let html = `
            <div class="scan-result">
                <div class="result-header">
                    <h3>${scanType} Result</h3>
                    <span class="scan-time">${new Date().toLocaleString()}</span>
                </div>
        `;

        if (result.verdict) {
            html += `
                <div class="verdict verdict-${result.verdict.band.toLowerCase()}">
                    <strong>Verdict:</strong> ${result.verdict.band} (Score: ${result.verdict.score}/100)
                </div>
                <div class="reasons">
                    <strong>Reasons:</strong>
                    <ul>
                        ${result.verdict.reasons.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else if (result.error) {
            html += `<div class="error">Error: ${result.error}</div>`;
        }

        html += `</div>`;
        resultsContainer.innerHTML = html;
    }

    displayError(message) {
        const resultsContainer = document.getElementById('scan-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    showExitModal() {
        document.getElementById('exit-modal').classList.add('active');
    }

    hideExitModal() {
        document.getElementById('exit-modal').classList.remove('active');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnterpriseDashboard();
});
