document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const userNameDisplay = document.getElementById("userNameDisplay");
  const welcomeMessage = document.getElementById("welcomeMessage");
  const logoutBtn = document.getElementById("logout");
  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdown = document.getElementById("userDropdown");
  const contactSupportBtn = document.getElementById("contactSupportBtn");
  const emailSupportBtn = document.getElementById("emailSupportBtn");

  //======================================================
  // -------------------- Functions ----------------------
  //======================================================
  
  function initializePopovers() {
    const popoverTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="popover"]')
    );
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl, {
        trigger: "hover focus",
        container: "body",
      });
    });
  }

  
  function setUserUI(userData) {
    if (userData && userData.authenticated) {
      const welcomeText = `Welcome, ${userData.full_name || userData.email}!`;
      const displayName = userData.full_name || userData.email.split("@")[0];

      if (welcomeMessage) welcomeMessage.textContent = welcomeText;
      if (userNameDisplay) userNameDisplay.textContent = displayName;
    } else {
      if (welcomeMessage) welcomeMessage.textContent = "";
      if (userNameDisplay) userNameDisplay.textContent = "User Name";
    }
  }

  
  async function loadUserData() {
    try {
      const response = await fetchWithSession("/api/auth/me");

      if (response.ok) {
        const userData = await response.json();
        setUserUI(userData);
        return userData;
      } else if (response.status === 401) {
        window.location.href = "../index.html";
        return null;
      } else {
        console.error("Failed to load user data");
        return null;
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  }

  async function fetchWithSession(path, opts = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...opts.headers,
    };

    try {
      const response = await fetch(path, {
        ...opts,
        headers,
        credentials: "include",
      });
      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  async function handleLogout() {
    try {
      const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();

      const logoutResponse = await fetchWithSession("/api/auth/logout", {
        method: "POST",
      });

      if (logoutResponse.ok) {
        if (currentSessionId) {
          await fetch("/api/session/invalidate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });
        }
      }
    } catch (e) {
      console.log("Logout failed, proceeding with client cleanup");
    }

    setUserUI(null);
    sessionStorage.removeItem("cyberShieldSession");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("plan_mode");

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1000);
  }

  function showContactSupportModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("contactSupportModal")
    );
    modal.show();
  }

  function handleEmailSupport() {
    window.location.href =
      "mailto:support@linkguard.com?subject=Support Request - Cyber Shield LinkGuard";
  }

  function initializeCharCounter() {
    const bugDescription = document.getElementById("bugDescription");
    const charCount = document.getElementById("charCount");

    if (bugDescription && charCount) {
      bugDescription.addEventListener("input", function () {
        charCount.textContent = this.value.length;

        if (this.value.length > 900) {
          charCount.classList.add("text-warning");
        } else {
          charCount.classList.remove("text-warning");
        }
      });
    }
  }

  async function handleBugReportSubmission() {
    const issueHeading = document.getElementById("issueHeading").value.trim();
    const bugDescription = document
      .getElementById("bugDescription")
      .value.trim();

    if (!issueHeading) {
      alert("Please enter an issue heading");
      return;
    }

    if (!bugDescription) {
      alert("Please describe the issue");
      return;
    }

    if (bugDescription.length < 10) {
      alert(
        "Please provide a more detailed description (at least 10 characters)"
      );
      return;
    }

    const submitButton = document.getElementById("submitBugReport");
    const originalText = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';

    try {
      const response = await fetchWithSession("/api/user/bug-report", {
        method: "POST",
        body: JSON.stringify({
          heading: issueHeading,
          description: bugDescription,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        alert(
          "Thank you for your report! We will review it and get back to you soon."
        );

        const modal = bootstrap.Modal.getInstance(
          document.getElementById("contactSupportModal")
        );
        modal.hide();

        document.getElementById("bugReportForm").reset();
        document.getElementById("charCount").textContent = "0";

        console.log("Bug Report Saved to Database:", {
          report_id: result.report_id,
          heading: issueHeading,
          description: bugDescription,
          timestamp: new Date().toISOString(),
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit bug report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting bug report:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }

  //======================================================
  // ---------------- Event Listeners -------------------
  //======================================================

  // User dropdown functionality
  if (userDropdownBtn && userDropdown) {
    userDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.style.display =
        userDropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (
        !userDropdownBtn.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userDropdown.style.display = "none";
      }
    });

    userDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Contact support modal
  if (contactSupportBtn) {
    contactSupportBtn.addEventListener("click", showContactSupportModal);
  }

  // Email support button
  if (emailSupportBtn) {
    emailSupportBtn.addEventListener("click", handleEmailSupport);
  }

  // Submit bug report button
  const submitBugReportBtn = document.getElementById("submitBugReport");
  if (submitBugReportBtn) {
    submitBugReportBtn.addEventListener("click", handleBugReportSubmission);
  }

  //======================================================
  // ------------------ Initialize ----------------------
  //======================================================

  async function initializePage() {
    const userInfo = await loadUserData();

    if (!userInfo || !userInfo.authenticated) {
      window.location.href = "../index.html";
      return;
    }

    // Initialize popovers
    initializePopovers();

    // Initialize character counter
    initializeCharCounter();

    console.log("FAQ page initialized successfully");
  }

  // Start initialization
  initializePage();
});

