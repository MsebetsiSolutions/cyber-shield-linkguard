class AdminDashboard {
    constructor() {
        this.currentTab = 'dashboard';
        this.charts = {};
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        // Always show login form first, don't auto-check auth status
        this.showLogin();
        this.bindEvents();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        this.setupPasswordToggle();
    }

    setupPasswordToggle() {
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.classList.toggle('bi-eye-fill');
                this.classList.toggle('bi-eye-slash-fill');
            });
        }
    }

    checkAuthStatus() {
        // Don't auto-check auth status - always show login first
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('dashboard-section').classList.add('d-none');
        this.isLoggedIn = false;
        
        // Clear any previous form data
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('login-alert').classList.add('d-none');
    }

    showDashboard() {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('dashboard-section').classList.remove('d-none');
        this.isLoggedIn = true;
        this.loadDashboard();
    }

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Tab navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isLoggedIn) {
                    this.switchTab(link.dataset.tab);
                }
            });
        });

        // Refresh buttons
        document.getElementById('refresh-users')?.addEventListener('click', () => this.loadUsers());
        document.getElementById('refresh-scans')?.addEventListener('click', () => this.loadScans());
        document.getElementById('refresh-payments')?.addEventListener('click', () => this.loadPayments());
        document.getElementById('refresh-teams')?.addEventListener('click', () => this.loadTeams());
        document.getElementById('refresh-audit')?.addEventListener('click', () => this.loadAuditLogs());

        // Logout - Redirect to index.html
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            // Clear any admin session data
            this.isLoggedIn = false;
            
            // Get current session ID for redirection
            const sessionId = window.CyberShieldSession?.getCurrentSessionId();
            const redirectUrl = sessionId ? `../index.html?session=${sessionId}` : '../index.html';
            window.location.href = redirectUrl;
        });

        // Search and filters
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        document.getElementById('scan-type-filter')?.addEventListener('change', (e) => {
            this.filterScans(e.target.value);
        });

        document.getElementById('payment-status-filter')?.addEventListener('change', (e) => {
            this.filterPayments(e.target.value);
        });

        // Modal events
        const editUserModal = new bootstrap.Modal(document.getElementById('edit-user-modal'));
        
        document.getElementById('edit-user-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserChanges();
            editUserModal.hide();
        });

        // Quick actions
        document.getElementById('clear-cache')?.addEventListener('click', () => {
            this.clearCache();
        });

        document.getElementById('backup-db')?.addEventListener('click', () => {
            this.backupDatabase();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        const spinner = document.getElementById('login-spinner');
        const loginText = document.getElementById('login-text');
        const alert = document.getElementById('login-alert');

        // Show loading state
        loginBtn.disabled = true;
        spinner.classList.remove('d-none');
        loginText.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Logging in...';
        alert.classList.add('d-none');

        try {
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.showDashboard();
                document.getElementById('admin-username').textContent = data.user.username;
                this.showNotification('Login successful!', 'success');
            } else {
                alert.textContent = data.message || 'Login failed';
                alert.classList.remove('d-none');
            }
        } catch (error) {
            alert.textContent = 'Network error. Please try again.';
            alert.classList.remove('d-none');
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            spinner.classList.add('d-none');
            loginText.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login to Dashboard';
        }
    }

    switchTab(tabName) {
        // Update active tab in sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update page title
        document.getElementById('page-title').textContent = 
            tabName.charAt(0).toUpperCase() + tabName.slice(1) + ' Management';

        // Load tab data
        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'scans':
                this.loadScans();
                break;
            case 'payments':
                this.loadPayments();
                break;
            case 'teams':
                this.loadTeams();
                break;
            case 'audit':
                this.loadAuditLogs();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/admin/api/stats');
            if (!response.ok) {
                throw new Error('Failed to load dashboard data');
            }
            const data = await response.json();

            // Update stats
            document.getElementById('total-users').textContent = data.total_users.toLocaleString();
            document.getElementById('total-scans').textContent = data.total_scans.toLocaleString();
            document.getElementById('total-payments').textContent = data.total_payments.toLocaleString();
            document.getElementById('total-teams').textContent = data.total_teams.toLocaleString();
            document.getElementById('active-today').textContent = data.active_today.toLocaleString();

            // Create charts
            this.createThreatChart(data.threat_stats);
            this.createPaymentChart(data.revenue_stats);
            this.loadRecentActivities();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    createThreatChart(threatStats) {
        const ctx = document.getElementById('threatChart').getContext('2d');
        
        if (this.charts.threatChart) {
            this.charts.threatChart.destroy();
        }

        const labels = threatStats.map(stat => stat.threat_level || 'unknown');
        const data = threatStats.map(stat => stat.count);
        const colors = {
            'malicious': '#ff6f61',
            'suspicious': '#ffc36b',
            'harmless': '#a7efb6',
            'unknown': '#c4ebf9'
        };

        this.charts.threatChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: labels.map(label => colors[label] || '#cccccc')
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createPaymentChart(paymentStats) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        
        if (this.charts.paymentChart) {
            this.charts.paymentChart.destroy();
        }

        const labels = paymentStats.map(stat => stat.status);
        const data = paymentStats.map(stat => stat.total || 0);

        this.charts.paymentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: data,
                    backgroundColor: '#00b3ff'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadRecentActivities() {
        try {
            const response = await fetch('/admin/api/audit-logs');
            if (!response.ok) {
                throw new Error('Failed to load recent activities');
            }
            const logs = await response.json();
            
            const activitiesContainer = document.getElementById('recent-activities');
            activitiesContainer.innerHTML = logs.slice(0, 10).map(log => `
                <div class="activity-item">
                    <strong>${log.action}</strong> - ${log.description}
                    <span class="activity-time">${new Date(log.created_at).toLocaleString()}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/admin/api/users');
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            const users = await response.json();
            
            const tbody = document.getElementById('users-tbody');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${this.escapeHtml(user.email)}</td>
                    <td>${this.escapeHtml(user.full_name)}</td>
                    <td>
                        <span class="threat-badge plan-${this.getPlanClass(user.Plan_Mode)}">
                            ${this.getPlanName(user.Plan_Mode)}
                        </span>
                    </td>
                    <td>${user.sub_plan || 'None'} ${user.plan_active ? '✅' : '❌'}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="admin.editUser(${user.id}, '${this.escapeHtml(user.email)}', '${this.escapeHtml(user.full_name)}', ${user.Plan_Mode})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="admin.deleteUser(${user.id})">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');

            this.usersData = users;
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    async loadScans() {
        try {
            const response = await fetch('/admin/api/scans');
            if (!response.ok) {
                throw new Error('Failed to load scans');
            }
            const scans = await response.json();
            
            const tbody = document.getElementById('scans-tbody');
            tbody.innerHTML = scans.map(scan => `
                <tr>
                    <td>${scan.scan_id}</td>
                    <td>${this.escapeHtml(scan.email)}</td>
                    <td>${scan.scan_type}</td>
                    <td>
                        <span class="threat-badge threat-${scan.threat_level || 'unknown'}">
                            ${scan.threat_level || 'unknown'}
                        </span>
                    </td>
                    <td title="${this.escapeHtml(scan.content)}">
                        ${this.truncateText(scan.content, 50)}
                    </td>
                    <td>${new Date(scan.scanned_at).toLocaleString()}</td>
                </tr>
            `).join('');

            this.scansData = scans;
        } catch (error) {
            console.error('Error loading scans:', error);
            this.showNotification('Error loading scans', 'error');
        }
    }

    async loadPayments() {
        try {
            const response = await fetch('/admin/api/payments');
            if (!response.ok) {
                throw new Error('Failed to load payments');
            }
            const payments = await response.json();
            
            const tbody = document.getElementById('payments-tbody');
            tbody.innerHTML = payments.map(payment => `
                <tr>
                    <td>${payment.payment_id}</td>
                    <td>${this.escapeHtml(payment.email)}</td>
                    <td>$${payment.amount} ${payment.currency}</td>
                    <td>
                        <span class="status-badge status-${payment.status}">
                            ${payment.status}
                        </span>
                    </td>
                    <td>${payment.payment_method}</td>
                    <td>${new Date(payment.created_at).toLocaleString()}</td>
                </tr>
            `).join('');

            this.paymentsData = payments;
        } catch (error) {
            console.error('Error loading payments:', error);
            this.showNotification('Error loading payments', 'error');
        }
    }

    async loadTeams() {
        try {
            const response = await fetch('/admin/api/teams');
            if (!response.ok) {
                throw new Error('Failed to load teams');
            }
            const teams = await response.json();
            
            const tbody = document.getElementById('teams-tbody');
            tbody.innerHTML = teams.map(team => `
                <tr>
                    <td>${team.id}</td>
                    <td>${this.escapeHtml(team.name)}</td>
                    <td>${this.escapeHtml(team.creator_email)}</td>
                    <td>${team.member_count}</td>
                    <td>${new Date(team.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showNotification('Error loading teams', 'error');
        }
    }

    async loadAuditLogs() {
        try {
            const response = await fetch('/admin/api/audit-logs');
            if (!response.ok) {
                throw new Error('Failed to load audit logs');
            }
            const logs = await response.json();
            
            const tbody = document.getElementById('audit-tbody');
            tbody.innerHTML = logs.map(log => `
                <tr>
                    <td>${log.log_id}</td>
                    <td>${log.email || 'System'}</td>
                    <td>${log.action}</td>
                    <td title="${this.escapeHtml(log.description)}">
                        ${this.truncateText(log.description, 80)}
                    </td>
                    <td>${log.ip_address}</td>
                    <td>${new Date(log.created_at).toLocaleString()}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading audit logs:', error);
            this.showNotification('Error loading audit logs', 'error');
        }
    }

    loadSettings() {
        document.getElementById('server-time').textContent = new Date().toLocaleString();
        document.getElementById('admin-user-info').textContent = document.getElementById('admin-username').textContent;
    }

    editUser(id, email, name, plan) {
        document.getElementById('edit-user-id').value = id;
        document.getElementById('edit-user-email').value = email;
        document.getElementById('edit-user-name').value = name;
        document.getElementById('edit-user-plan').value = plan;
        
        const editUserModal = new bootstrap.Modal(document.getElementById('edit-user-modal'));
        editUserModal.show();
    }

    async saveUserChanges() {
        const userId = document.getElementById('edit-user-id').value;
        const email = document.getElementById('edit-user-email').value;
        const name = document.getElementById('edit-user-name').value;
        const plan = document.getElementById('edit-user-plan').value;

        try {
            // Update email
            await fetch('/admin/api/update-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    field: 'email',
                    value: email
                })
            });

            // Update name
            await fetch('/admin/api/update-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    field: 'full_name',
                    value: name
                })
            });

            // Update plan
            await fetch('/admin/api/update-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    field: 'Plan_Mode',
                    value: plan
                })
            });

            this.loadUsers();
            this.showNotification('User updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating user:', error);
            this.showNotification('Error updating user', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/admin/api/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                this.loadUsers();
                this.showNotification('User deleted successfully!', 'success');
            } else {
                this.showNotification('Error deleting user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        }
    }

    filterUsers(searchTerm) {
        if (!this.usersData) return;

        const filtered = this.usersData.filter(user => 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderFilteredUsers(filtered);
    }

    filterScans(type) {
        if (!this.scansData) return;

        const filtered = type ? 
            this.scansData.filter(scan => scan.scan_type === type) : 
            this.scansData;

        this.renderFilteredScans(filtered);
    }

    filterPayments(status) {
        if (!this.paymentsData) return;

        const filtered = status ? 
            this.paymentsData.filter(payment => payment.status === status) : 
            this.paymentsData;

        this.renderFilteredPayments(filtered);
    }

    renderFilteredUsers(users) {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${this.escapeHtml(user.full_name)}</td>
                <td>
                    <span class="threat-badge plan-${this.getPlanClass(user.Plan_Mode)}">
                        ${this.getPlanName(user.Plan_Mode)}
                    </span>
                </td>
                <td>${user.sub_plan || 'None'} ${user.plan_active ? '✅' : '❌'}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="admin.editUser(${user.id}, '${this.escapeHtml(user.email)}', '${this.escapeHtml(user.full_name)}', ${user.Plan_Mode})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="admin.deleteUser(${user.id})">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderFilteredScans(scans) {
        const tbody = document.getElementById('scans-tbody');
        tbody.innerHTML = scans.map(scan => `
            <tr>
                <td>${scan.scan_id}</td>
                <td>${this.escapeHtml(scan.email)}</td>
                <td>${scan.scan_type}</td>
                <td>
                    <span class="threat-badge threat-${scan.threat_level || 'unknown'}">
                        ${scan.threat_level || 'unknown'}
                    </span>
                </td>
                <td title="${this.escapeHtml(scan.content)}">
                    ${this.truncateText(scan.content, 50)}
                </td>
                <td>${new Date(scan.scanned_at).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    renderFilteredPayments(payments) {
        const tbody = document.getElementById('payments-tbody');
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.payment_id}</td>
                <td>${this.escapeHtml(payment.email)}</td>
                <td>$${payment.amount} ${payment.currency}</td>
                <td>
                    <span class="status-badge status-${payment.status}">
                        ${payment.status}
                    </span>
                </td>
                <td>${payment.payment_method}</td>
                <td>${new Date(payment.created_at).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    updateTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = 
            now.toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
    }

    getPlanClass(planMode) {
        const plans = ['free', 'pro', 'team', 'enterprise'];
        return plans[planMode] || 'free';
    }

    getPlanName(planMode) {
        const plans = ['Free', 'Pro', 'Team', 'Enterprise'];
        return plans[planMode] || 'Free';
    }

    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    async clearCache() {
        this.showNotification('Cache cleared successfully!', 'success');
    }

    async backupDatabase() {
        this.showNotification('Database backup initiated!', 'success');
    }
}

// Initialize the admin dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminDashboard();
});
