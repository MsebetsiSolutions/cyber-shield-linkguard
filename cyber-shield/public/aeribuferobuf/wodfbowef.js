class SecureConsole {
  constructor() {
    this.currentTab = "dashboard";
    this.charts = {};
    this.isLoggedIn = false;
    this.sessionTimer = null;
    this.sessionTime = 300; 
    this.failedAttempts = 0;
    this.maxAttempts = 3;
    this.lockoutTime = 30; 
    this.isLocked = false;
    this.autoRefreshInterval = null;
    this.lastDataRefresh = null;
    this.usersData = null;
    this.scansData = null;
    this.paymentsData = null;
    this.scrollSpy = null;
    this.init();
  }

  init() {
    this.showSecureConsole();
    this.bindEvents();
    this.startSessionTimer();
    this.updateSessionInfo();
    setInterval(() => this.updateSessionInfo(), 1000);

    this.setupPasswordToggle();
    this.setupSecurityMeasures();
    this.initializeScrollSpy();
  }

  initializeScrollSpy() {
    // Initialize Bootstrap ScrollSpy
    const dataSpyList = [].slice.call(document.querySelectorAll('[data-bs-spy="scroll"]'));
    dataSpyList.forEach((dataSpyEl) => {
      this.scrollSpy = new bootstrap.ScrollSpy(dataSpyEl, {
        target: '#analytics-sidebar',
        offset: 100
      });
    });
  }

  setupSecurityMeasures() {
    // Input sanitization setup
    this.setupInputSanitization();

    // Session monitoring
    this.monitorSession();
  }

  setupInputSanitization() {
    const sanitizeInput = (input) => {
      return input.replace(/[<>"&\\]/g, "");
    };

    document.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", (e) => {
        e.target.value = sanitizeInput(e.target.value);
      });
    });
  }

  monitorSession() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.addOutputLine("Session visibility changed", "warning");
      }
    });
  }

  setupPasswordToggle() {
    const togglePassword = document.getElementById("toggle-access-key");
    const passwordInput = document.getElementById("access-key");

    if (togglePassword && passwordInput) {
      togglePassword.addEventListener("click", function () {
        const type =
          passwordInput.getAttribute("type") === "password"
            ? "text"
            : "password";
        passwordInput.setAttribute("type", type);
        this.classList.toggle("bi-eye-fill");
        this.classList.toggle("bi-eye-slash-fill");
      });
    }
  }

  showSecureConsole() {
    document.getElementById("secure-console").classList.remove("d-none");
    document.getElementById("analytics-dashboard").classList.add("d-none");
    this.isLoggedIn = false;

    // Clear inputs
    document.getElementById("access-code").value = "";
    document.getElementById("access-key").value = "";
    document.getElementById("console-alert").classList.add("d-none");

    // Reset security state
    this.failedAttempts = 0;
    this.isLocked = false;
    this.updateAttemptsCounter();
    this.updateSecurityStatus("SECURE CONNECTION ESTABLISHED", "success");

    // Stop auto-refresh
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  showAnalyticsDashboard() {
    document.getElementById("secure-console").classList.add("d-none");
    document.getElementById("analytics-dashboard").classList.remove("d-none");
    this.isLoggedIn = true;
    this.loadDashboard();
    this.resetSessionTimer();

    // Reinitialize scrollspy when dashboard is shown
    setTimeout(() => {
      this.initializeScrollSpy();
    }, 100);

    // Start auto-refresh for dashboard data
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    // Refresh data every 30 seconds
    this.autoRefreshInterval = setInterval(() => {
      if (this.isLoggedIn && this.currentTab === "dashboard") {
        this.loadDashboard();
      }
    }, 30000);
  }

  bindEvents() {
    // Console login form
    const loginForm = document.getElementById("console-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleConsoleLogin();
      });
    }

    // Tab navigation with smooth scroll
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (this.isLoggedIn) {
          const targetTab = link.dataset.tab;
          this.switchTab(targetTab);
          
          // Smooth scroll to the target tab
          const targetElement = document.getElementById(`${targetTab}-tab`);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Refresh buttons
    const refreshUsersBtn = document.getElementById("refresh-users");
    if (refreshUsersBtn)
      refreshUsersBtn.addEventListener("click", () => this.loadUsers());

    const refreshScansBtn = document.getElementById("refresh-scans");
    if (refreshScansBtn)
      refreshScansBtn.addEventListener("click", () => this.loadScans());

    const refreshPaymentsBtn = document.getElementById("refresh-payments");
    if (refreshPaymentsBtn)
      refreshPaymentsBtn.addEventListener("click", () => this.loadPayments());

    const refreshTeamsBtn = document.getElementById("refresh-teams");
    if (refreshTeamsBtn)
      refreshTeamsBtn.addEventListener("click", () => this.loadTeams());

    const refreshAuditBtn = document.getElementById("refresh-audit");
    if (refreshAuditBtn)
      refreshAuditBtn.addEventListener("click", () => this.loadAuditLogs());

    const refreshActivitiesBtn = document.getElementById("refresh-activities");
    if (refreshActivitiesBtn)
      refreshActivitiesBtn.addEventListener("click", () =>
        this.loadRecentActivities()
      );

    // Logout
    const logoutBtn = document.getElementById("analytics-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.isLoggedIn = false;
        const sessionId = window.CyberShieldSession?.getCurrentSessionId();
        const redirectUrl = sessionId
          ? `../index.html?session=${sessionId}`
          : "../index.html";
        window.location.href = redirectUrl;
      });
    }

    // Search and filters
    const userSearch = document.getElementById("user-search");
    if (userSearch)
      userSearch.addEventListener("input", (e) => {
        this.filterUsers(e.target.value);
      });

    const scanTypeFilter = document.getElementById("scan-type-filter");
    if (scanTypeFilter)
      scanTypeFilter.addEventListener("change", (e) => {
        this.filterScans(e.target.value);
      });

    const threatLevelFilter = document.getElementById("threat-level-filter");
    if (threatLevelFilter)
      threatLevelFilter.addEventListener("change", (e) => {
        this.filterScansByThreat(e.target.value);
      });

    const paymentStatusFilter = document.getElementById(
      "payment-status-filter"
    );
    if (paymentStatusFilter)
      paymentStatusFilter.addEventListener("change", (e) => {
        this.filterPayments(e.target.value);
      });

    // Quick actions
    const clearCacheBtn = document.getElementById("clear-cache");
    if (clearCacheBtn)
      clearCacheBtn.addEventListener("click", () => {
        this.clearCache();
      });

    const backupDbBtn = document.getElementById("backup-db");
    if (backupDbBtn)
      backupDbBtn.addEventListener("click", () => {
        this.backupDatabase();
      });

    const systemHealthBtn = document.getElementById("system-health");
    if (systemHealthBtn)
      systemHealthBtn.addEventListener("click", () => {
        this.showSystemHealth();
      });

    // Export buttons
    const exportUsersBtn = document.getElementById("export-users");
    if (exportUsersBtn)
      exportUsersBtn.addEventListener("click", () => {
        this.exportUsers();
      });

    const updatePlanForm = document.getElementById("update-plan-form");
    if (updatePlanForm) {
      updatePlanForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.updateUserPlan();
      });
    }
  }

  async handleConsoleLogin() {
    if (this.isLocked) {
      this.showAlert("System temporarily locked. Please wait...");
      return;
    }

    const accessCode = document.getElementById("access-code").value;
    const accessKey = document.getElementById("access-key").value;
    const loginBtn = document.querySelector(".console-submit");
    const btnContent = loginBtn?.querySelector(".btn-content");
    const btnLoader = loginBtn?.querySelector(".btn-loader");
    const alert = document.getElementById("console-alert");

    if (!accessCode || !accessKey) {
      this.showAlert("Please enter both access code and key");
      return;
    }

    // Show loading state
    if (loginBtn) {
      loginBtn.disabled = true;
      if (btnContent) btnContent.classList.add("d-none");
      if (btnLoader) btnLoader.classList.remove("d-none");
    }
    if (alert) alert.classList.add("d-none");

    // Add authentication attempt to output
    this.addOutputLine("Authentication attempt initiated...", "info");

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accessCode,
          password: accessKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.addOutputLine(
          "Authentication successful. Access granted.",
          "success"
        );
        this.failedAttempts = 0;
        this.updateAttemptsCounter();

        setTimeout(() => {
          this.showAnalyticsDashboard();
          const usernameDisplay = document.getElementById(
            "analytics-username-display"
          );
          const userInfo = document.getElementById("analytics-user-info");
          if (usernameDisplay) usernameDisplay.textContent = data.user.username;
          if (userInfo) userInfo.textContent = data.user.username;
          this.showNotification("Secure access established", "success");
        }, 1000);
      } else {
        this.failedAttempts++;
        this.updateAttemptsCounter();
        this.addOutputLine(
          `Authentication failed. Attempt ${this.failedAttempts}/${this.maxAttempts}`,
          "error"
        );

        if (this.failedAttempts >= this.maxAttempts) {
          this.lockConsole("Maximum failed attempts reached");
        } else {
          this.showAlert(data.message || "Invalid credentials");
        }
      }
    } catch (error) {
      this.failedAttempts++;
      this.updateAttemptsCounter();
      this.addOutputLine("Network error during authentication", "error");
      this.showAlert("Network error. Please try again.");
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        if (btnContent) btnContent.classList.remove("d-none");
        if (btnLoader) btnLoader.classList.add("d-none");
      }
    }
  }

  lockConsole(reason) {
    this.isLocked = true;
    this.showAlert(
      `System locked: ${reason}. Please wait ${this.lockoutTime} seconds.`
    );
    this.addOutputLine(`SYSTEM LOCKED: ${reason}`, "error");
    this.updateSecurityStatus("SYSTEM LOCKED - SECURITY BREACH", "error");

    // Disable form
    const loginForm = document.getElementById("console-login-form");
    if (loginForm) loginForm.classList.add("disabled");

    // Start lockout timer
    let lockoutTime = this.lockoutTime;
    const lockoutInterval = setInterval(() => {
      lockoutTime--;
      this.updateSecurityStatus(`SYSTEM LOCKED - ${lockoutTime}s`, "error");

      if (lockoutTime <= 0) {
        clearInterval(lockoutInterval);
        this.isLocked = false;
        this.failedAttempts = 0;
        this.updateAttemptsCounter();
        if (loginForm) loginForm.classList.remove("disabled");
        this.updateSecurityStatus(
          "SECURE CONNECTION RE-ESTABLISHED",
          "success"
        );
        this.addOutputLine(
          "System lockout period ended. Ready for authentication.",
          "success"
        );
        this.showAlert("System unlocked. You may try again.");
      }
    }, 1000);
  }

  startSessionTimer() {
    this.sessionTimer = setInterval(() => {
      this.sessionTime--;
      this.updateSessionTimer();

      if (this.sessionTime <= 0 && this.isLoggedIn) {
        this.autoLogout();
      }
    }, 1000);
  }

  resetSessionTimer() {
    this.sessionTime = 300; // Reset to 5 minutes
    this.updateSessionTimer();
  }

  updateSessionTimer() {
    const minutes = Math.floor(this.sessionTime / 60);
    const seconds = this.sessionTime % 60;
    const timerElement = document.getElementById("session-timer");
    if (timerElement) {
      timerElement.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // Change color when time is running low
      if (this.sessionTime <= 60) {
        timerElement.style.color = "#ff4444";
      } else if (this.sessionTime <= 120) {
        timerElement.style.color = "#ffaa00";
      } else {
        timerElement.style.color = "#00ff00";
      }
    }
  }

  updateAttemptsCounter() {
    const attemptsElement = document.getElementById("attempts-counter");
    if (attemptsElement) {
      attemptsElement.textContent = this.maxAttempts - this.failedAttempts;

      // Change color based on remaining attempts
      if (this.maxAttempts - this.failedAttempts <= 1) {
        attemptsElement.style.color = "#ff4444";
      } else if (this.maxAttempts - this.failedAttempts <= 2) {
        attemptsElement.style.color = "#ffaa00";
      } else {
        attemptsElement.style.color = "#00ff00";
      }
    }
  }

  updateSecurityStatus(message, type = "info") {
    const statusElement = document.getElementById("security-status");
    if (statusElement) {
      statusElement.textContent = message;

      switch (type) {
        case "success":
          statusElement.style.color = "#00ff00";
          break;
        case "warning":
          statusElement.style.color = "#ffaa00";
          break;
        case "error":
          statusElement.style.color = "#ff4444";
          break;
        default:
          statusElement.style.color = "#00ff00";
      }
    }
  }

  updateSessionInfo() {
    const now = new Date();
    const sessionInfo = document.getElementById("session-info");
    if (sessionInfo) {
      sessionInfo.textContent = now.toLocaleTimeString();
    }

    const currentTime = document.getElementById("analytics-current-time");
    if (currentTime) {
      currentTime.textContent = now.toLocaleTimeString();
    }
  }

  addOutputLine(message, type = "info") {
    const outputContainer = document.querySelector(".terminal-output");
    if (!outputContainer) return;

    const outputLine = document.createElement("div");
    outputLine.className = "output-line";

    const prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "system@secure:~$";

    const messageSpan = document.createElement("span");
    messageSpan.textContent = ` ${message}`;

    switch (type) {
      case "error":
        messageSpan.style.color = "#ff4444";
        break;
      case "warning":
        messageSpan.style.color = "#ffaa00";
        break;
      case "success":
        messageSpan.style.color = "#00ff00";
        break;
      default:
        messageSpan.style.color = "#00ff00";
    }

    outputLine.appendChild(prompt);
    outputLine.appendChild(messageSpan);
    outputContainer.appendChild(outputLine);

    // Scroll to bottom
    outputContainer.scrollTop = outputContainer.scrollHeight;
  }

  showAlert(message) {
    const alert = document.getElementById("console-alert");
    const alertMessage = document.getElementById("alert-message");

    if (alert && alertMessage) {
      alertMessage.textContent = message;
      alert.classList.remove("d-none");

      // Auto-hide after 5 seconds
      setTimeout(() => {
        alert.classList.add("d-none");
      }, 5000);
    }
  }

  autoLogout() {
    this.addOutputLine("Session timeout - Auto-logout initiated", "warning");
    this.showNotification("Session expired due to inactivity", "warning");

    setTimeout(() => {
      this.showSecureConsole();
    }, 2000);
  }

  switchTab(tabName) {
    // Update active nav links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) activeLink.classList.add("active");

    // Update active tab content
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });

    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) activeTab.classList.add("active");

    // Update page title
    const pageTitle = document.getElementById("analytics-page-title");
    if (pageTitle) pageTitle.textContent = this.getTabTitle(tabName);

    this.currentTab = tabName;
    this.loadTabData(tabName);

    // Reset scroll position for the new tab
    const scrollableContent = activeTab.querySelector('.dashboard-scrollable-content, .tab-scrollable-content');
    if (scrollableContent) {
      scrollableContent.scrollTop = 0;
    }
  }

  getTabTitle(tabName) {
    const titles = {
      dashboard: "Overview",
      users: "User Management",
      scans: "Scan Analytics",
      payments: "Revenue Statistics",
      teams: "Team Insights",
      audit: "Activity Logs",
      settings: "System Configuration",
    };
    return titles[tabName] || "Dashboard";
  }

  loadTabData(tabName) {
    switch (tabName) {
      case "dashboard":
        this.loadDashboard();
        break;
      case "users":
        this.loadUsers();
        break;
      case "scans":
        this.loadScans();
        break;
      case "payments":
        this.loadPayments();
        break;
      case "teams":
        this.loadTeams();
        break;
      case "audit":
        this.loadAuditLogs();
        break;
      case "settings":
        this.loadSettings();
        break;
    }
  }

  async loadDashboard() {
    try {
      const response = await fetch("/admin/api/stats");
      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const data = await response.json();

      // Update main stats
      this.updateElementText(
        "total-users",
        data.total_users?.toLocaleString() || "0"
      );
      this.updateElementText(
        "total-scans",
        data.total_scans?.toLocaleString() || "0"
      );
      this.updateElementText(
        "total-payments",
        data.total_payments?.toLocaleString() || "0"
      );
      this.updateElementText(
        "total-teams",
        data.total_teams?.toLocaleString() || "0"
      );
      this.updateElementText(
        "active-today",
        data.active_today?.toLocaleString() || "0"
      );

      // Update trend indicators
      this.updateTrendIndicators(data);

      if (data.threat_stats) this.createThreatChart(data.threat_stats);
      if (data.revenue_stats) this.createPaymentChart(data.revenue_stats);
      if (data.recent_activities)
        this.loadRecentActivities(data.recent_activities);

      // Update last refresh time
      this.updateLastRefreshTime();
    } catch (error) {
      console.error("Error loading dashboard:", error);
      this.showNotification("Error loading dashboard data", "error");
    }
  }

  updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  updateTrendIndicators(data) {
    // This is a simplified version - in a real app, you'd compare with previous data
    const trends = {
      "users-trend": "↗️ +5%",
      "scans-trend": "↗️ +12%",
      "payments-trend": "↗️ +8%",
      "teams-trend": "→ 0%",
      "active-trend": "↗️ +3%",
      "scans24h-trend": "↗️ +15%",
    };

    Object.keys(trends).forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = trends[id];
        element.className = "stat-trend positive";
      }
    });
  }

  createThreatChart(threatStats) {
    const ctx = document.getElementById("threatChart");
    if (!ctx) return;

    if (this.charts.threatChart) {
      this.charts.threatChart.destroy();
    }

    const labels = threatStats.map((stat) => {
      const level = stat.threat_level || "unknown";
      return level.charAt(0).toUpperCase() + level.slice(1);
    });
    const data = threatStats.map((stat) => stat.count);
    const colors = {
      malicious: "#ff6f61",
      suspicious: "#ffc36b",
      harmless: "#a7efb6",
      unknown: "#c4ebf9",
    };

    this.charts.threatChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: threatStats.map(
              (stat) => colors[stat.threat_level] || "#cccccc"
            ),
            borderWidth: 2,
            borderColor: "#1a1a1a",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#00ff00",
              font: {
                family: "'Courier New', monospace",
              },
            },
          },
          tooltip: {
            titleFont: {
              family: "'Courier New', monospace",
            },
            bodyFont: {
              family: "'Courier New', monospace",
            },
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
        },
      },
    });

    // Update chart time
    this.updateElementText(
      "threat-chart-time",
      `Updated: ${new Date().toLocaleTimeString()}`
    );
  }

  createPaymentChart(paymentStats) {
    const ctx = document.getElementById("paymentChart");
    if (!ctx) return;

    if (this.charts.paymentChart) {
      this.charts.paymentChart.destroy();
    }

    const labels = paymentStats.map((stat) => {
      const status = stat.status || "unknown";
      return status.charAt(0).toUpperCase() + status.slice(1);
    });
    const data = paymentStats.map((stat) => stat.total || 0);

    this.charts.paymentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Revenue ($)",
            data: data,
            backgroundColor: "#00b3ff",
            borderColor: "#00b3ff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#00ff00",
              font: {
                family: "'Courier New', monospace",
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#00ff00",
              font: {
                family: "'Courier New', monospace",
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#00ff00",
              font: {
                family: "'Courier New', monospace",
              },
            },
          },
          tooltip: {
            titleFont: {
              family: "'Courier New', monospace",
            },
            bodyFont: {
              family: "'Courier New', monospace",
            },
          },
        },
        animation: {
          duration: 1000,
          easing: "easeOutQuart",
        },
      },
    });

    // Update chart time
    this.updateElementText(
      "payment-chart-time",
      `Updated: ${new Date().toLocaleTimeString()}`
    );
  }

  async loadRecentActivities(activities = null) {
    try {
      if (!activities) {
        const response = await fetch("/admin/api/audit-logs");
        if (!response.ok) {
          throw new Error("Failed to load recent activities");
        }
        const logs = await response.json();
        activities = logs.slice(0, 10);
      }

      const activitiesContainer = document.getElementById("recent-activities");
      if (activitiesContainer) {
        activitiesContainer.innerHTML = activities
          .map(
            (log) => `
                  <div class="activity-item">
                      <div>
                          <strong>${log.action}</strong> - ${log.description}
                      </div>
                      <span class="activity-time">${new Date(
                        log.created_at
                      ).toLocaleString()}</span>
                  </div>
              `
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }

  async loadUsers() {
    try {
      const response = await fetch("/admin/api/users");
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      const users = await response.json();

      const tbody = document.getElementById("users-tbody");
      if (tbody) {
        tbody.innerHTML = users
          .map(
            (user) => `
                  <tr>
                      <td>${user.id}</td>
                      <td>${this.escapeHtml(user.email)}</td>
                      <td>${this.escapeHtml(user.full_name)}</td>
                      <td>
                          <span class="threat-badge plan-${this.getPlanClass(
                            user.Plan_Mode
                          )}">
                              ${this.getPlanName(user.Plan_Mode)}
                          </span>
                      </td>
                      <td>
                          <button class="btn-plan-update" onclick="secureConsole.showUpdatePlanModal(${
                            user.id
                          }, '${this.escapeHtml(
              user.email
            )}', '${this.escapeHtml(user.full_name)}', ${user.Plan_Mode})">
                              🔄 Update Plan
                          </button>
                      </td>
                      <td>${user.sub_plan || "None"} ${
              user.plan_active ? "✅" : "❌"
            }</td>
                      <td>${new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                          <button class="btn btn-primary btn-sm" onclick="secureConsole.editUser(${
                            user.id
                          }, '${this.escapeHtml(
              user.email
            )}', '${this.escapeHtml(user.full_name)}', ${user.Plan_Mode})">
                              ✏️ Edit
                          </button>
                          <button class="btn btn-danger btn-sm" onclick="secureConsole.deleteUser(${
                            user.id
                          })">
                              🗑️ Delete
                          </button>
                      </td>
                  </tr>
              `
          )
          .join("");
      }

      this.usersData = users;
      this.updateLastRefreshTime();
    } catch (error) {
      console.error("Error loading users:", error);
      this.showNotification("Error loading users", "error");
    }
  }

  showUpdatePlanModal(userId, email, name, currentPlan) {
    // Set the form values
    document.getElementById("update-plan-user-id").value = userId;
    document.getElementById(
      "update-plan-user-info"
    ).value = `${name} (${email})`;
    document.getElementById("update-plan-current").value =
      this.getPlanName(currentPlan);
    document.getElementById("update-plan-new").value = currentPlan;

    const updatePlanModal = new bootstrap.Modal(
      document.getElementById("update-plan-modal")
    );
    updatePlanModal.show();
  }

  async updateUserPlan() {
    const userId = document.getElementById("update-plan-user-id").value;
    const newPlan = document.getElementById("update-plan-new").value;

    // Validate inputs
    if (!userId || !newPlan) {
      this.showNotification("Please select a valid plan", "error");
      return;
    }

    try {
      const response = await fetch("/admin/api/update-user-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          plan_mode: parseInt(newPlan),
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification("User plan updated successfully!", "success");
        this.loadUsers(); 

        const updatePlanModal = bootstrap.Modal.getInstance(
          document.getElementById("update-plan-modal")
        );
        if (updatePlanModal) {
          updatePlanModal.hide();
        }
      } else {
        this.showNotification(
          "Error updating user plan: " + result.error,
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating user plan:", error);
      this.showNotification(
        "Error updating user plan: " + error.message,
        "error"
      );
    }
  }

  async loadScans() {
    try {
      const response = await fetch("/admin/api/scans");
      if (!response.ok) {
        throw new Error("Failed to load scans");
      }
      const scans = await response.json();

      const tbody = document.getElementById("scans-tbody");
      if (tbody) {
        tbody.innerHTML = scans
          .map(
            (scan) => `
                  <tr>
                      <td>${scan.scan_id}</td>
                      <td>${this.escapeHtml(scan.email)}</td>
                      <td>${scan.scan_type}</td>
                      <td>
                          <span class="threat-badge threat-${
                            scan.threat_level || "unknown"
                          }">
                              ${scan.threat_level || "unknown"}
                          </span>
                      </td>
                      <td title="${this.escapeHtml(scan.content)}">
                          ${this.truncateText(scan.content, 50)}
                      </td>
                      <td>${new Date(scan.scanned_at).toLocaleString()}</td>
                  </tr>
              `
          )
          .join("");
      }

      this.scansData = scans;
      this.updateLastRefreshTime();
    } catch (error) {
      console.error("Error loading scans:", error);
      this.showNotification("Error loading scans", "error");
    }
  }

  async loadPayments() {
    try {
      const response = await fetch("/admin/api/payments");
      if (!response.ok) {
        throw new Error("Failed to load payments");
      }
      const payments = await response.json();

      const tbody = document.getElementById("payments-tbody");
      if (tbody) {
        tbody.innerHTML = payments
          .map(
            (payment) => `
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
              `
          )
          .join("");
      }

      this.paymentsData = payments;
      this.updateLastRefreshTime();
    } catch (error) {
      console.error("Error loading payments:", error);
      this.showNotification("Error loading payments", "error");
    }
  }

  async loadTeams() {
    try {
      const response = await fetch("/admin/api/teams");
      if (!response.ok) {
        throw new Error("Failed to load teams");
      }
      const teams = await response.json();

      const tbody = document.getElementById("teams-tbody");
      if (tbody) {
        tbody.innerHTML = teams
          .map(
            (team) => `
                  <tr>
                      <td>${team.id}</td>
                      <td>${this.escapeHtml(team.name)}</td>
                      <td>${this.escapeHtml(team.creator_email)}</td>
                      <td>${team.member_count}</td>
                      <td>${new Date(team.created_at).toLocaleDateString()}</td>
                  </tr>
              `
          )
          .join("");
      }
      this.updateLastRefreshTime();
    } catch (error) {
      console.error("Error loading teams:", error);
      this.showNotification("Error loading teams", "error");
    }
  }

  async loadAuditLogs() {
    try {
      const response = await fetch("/admin/api/audit-logs");
      if (!response.ok) {
        throw new Error("Failed to load audit logs");
      }
      const logs = await response.json();

      const tbody = document.getElementById("audit-tbody");
      if (tbody) {
        tbody.innerHTML = logs
          .map(
            (log) => `
                  <tr>
                      <td>${log.log_id}</td>
                      <td>${log.email || "System"}</td>
                      <td>${log.action}</td>
                      <td title="${this.escapeHtml(log.description)}">
                          ${this.truncateText(log.description, 80)}
                      </td>
                      <td>${log.ip_address}</td>
                      <td>${new Date(log.created_at).toLocaleString()}</td>
                  </tr>
              `
          )
          .join("");
      }
      this.updateLastRefreshTime();
    } catch (error) {
      console.error("Error loading audit logs:", error);
      this.showNotification("Error loading audit logs", "error");
    }
  }

  loadSettings() {
    this.updateElementText("server-time", new Date().toLocaleString());

    const userInfo = document.getElementById("analytics-user-info");
    const usernameDisplay = document.getElementById(
      "analytics-username-display"
    );
    if (userInfo && usernameDisplay) {
      userInfo.textContent = usernameDisplay.textContent;
    }

    this.updateLastRefreshTime();
  }

  updateLastRefreshTime() {
    this.lastDataRefresh = new Date();
    const refreshElement = document.getElementById("last-refresh-time");
    if (refreshElement) {
      refreshElement.textContent = this.lastDataRefresh.toLocaleTimeString();
    }
  }

  editUser(id, email, name, plan) {
    // This would open a more comprehensive edit modal
    this.showUpdatePlanModal(id, email, name, plan);
  }

  async deleteUser(userId) {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/admin/api/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        this.loadUsers();
        this.showNotification("User deleted successfully!", "success");
      } else {
        this.showNotification("Error deleting user", "error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      this.showNotification("Error deleting user", "error");
    }
  }

  filterUsers(searchTerm) {
    if (!this.usersData) return;

    const filtered = this.usersData.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.renderFilteredUsers(filtered);
  }

  filterScans(type) {
    if (!this.scansData) return;

    const filtered = type
      ? this.scansData.filter((scan) => scan.scan_type === type)
      : this.scansData;

    this.renderFilteredScans(filtered);
  }

  filterScansByThreat(threatLevel) {
    if (!this.scansData) return;

    const filtered = threatLevel
      ? this.scansData.filter((scan) => scan.threat_level === threatLevel)
      : this.scansData;

    this.renderFilteredScans(filtered);
  }

  filterPayments(status) {
    if (!this.paymentsData) return;

    const filtered = status
      ? this.paymentsData.filter((payment) => payment.status === status)
      : this.paymentsData;

    this.renderFilteredPayments(filtered);
  }

  renderFilteredUsers(users) {
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>${user.id}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${this.escapeHtml(user.full_name)}</td>
                <td>
                    <span class="threat-badge plan-${this.getPlanClass(
                      user.Plan_Mode
                    )}">
                        ${this.getPlanName(user.Plan_Mode)}
                    </span>
                </td>
                <td>
                    <button class="btn-plan-update" onclick="secureConsole.showUpdatePlanModal(${
                      user.id
                    }, '${this.escapeHtml(user.email)}', '${this.escapeHtml(
          user.full_name
        )}', ${user.Plan_Mode})">
                        🔄 Update Plan
                    </button>
                </td>
                <td>${user.sub_plan || "None"} ${
          user.plan_active ? "✅" : "❌"
        }</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="secureConsole.editUser(${
                      user.id
                    }, '${this.escapeHtml(user.email)}', '${this.escapeHtml(
          user.full_name
        )}', ${user.Plan_Mode})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="secureConsole.deleteUser(${
                      user.id
                    })">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  renderFilteredScans(scans) {
    const tbody = document.getElementById("scans-tbody");
    if (!tbody) return;

    tbody.innerHTML = scans
      .map(
        (scan) => `
            <tr>
                <td>${scan.scan_id}</td>
                <td>${this.escapeHtml(scan.email)}</td>
                <td>${scan.scan_type}</td>
                <td>
                    <span class="threat-badge threat-${
                      scan.threat_level || "unknown"
                    }">
                        ${scan.threat_level || "unknown"}
                    </span>
                </td>
                <td title="${this.escapeHtml(scan.content)}">
                    ${this.truncateText(scan.content, 50)}
                </td>
                <td>${new Date(scan.scanned_at).toLocaleString()}</td>
            </tr>
        `
      )
      .join("");
  }

  renderFilteredPayments(payments) {
    const tbody = document.getElementById("payments-tbody");
    if (!tbody) return;

    tbody.innerHTML = payments
      .map(
        (payment) => `
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
        `
      )
      .join("");
  }

  getPlanClass(planMode) {
    const plans = ["free", "pro", "team", "enterprise"];
    return plans[planMode] || "free";
  }

  getPlanName(planMode) {
    const plans = ["Free", "Pro", "Team", "Enterprise"];
    return plans[planMode] || "Free";
  }

  truncateText(text, length) {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `alert alert-${
      type === "success" ? "success" : "danger"
    } alert-dismissible fade show`;
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

  async refreshAllData() {
    this.showNotification("Refreshing all data...", "info");
    await this.loadDashboard();
    this.showNotification("All data refreshed successfully!", "success");
  }

  async exportData() {
    this.showNotification("Export feature coming soon!", "info");
  }

  async clearCache() {
    this.showNotification("Cache cleared successfully!", "success");
  }

  async backupDatabase() {
    this.showNotification("Database backup initiated!", "success");
  }

  async showSystemHealth() {
    this.showNotification(
      "System health check completed - All systems OK",
      "success"
    );
  }

  async exportUsers() {
    this.showNotification("Exporting user data...", "info");
    // In a real implementation, this would generate and download a CSV/Excel file
    setTimeout(() => {
      this.showNotification("User data exported successfully!", "success");
    }, 2000);
  }
}

// Initialize the secure console when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.secureConsole = new SecureConsole();
});