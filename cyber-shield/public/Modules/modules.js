class LearningHubEnrollment {
  constructor() {
    this.currentUser = null;
    this.enrollmentStatus = {};
    this.init();
  }

  async init() {
    await this.checkAuthentication();
    await this.checkEnrollmentStatus();
    this.setupEventListeners();
  }

  async checkAuthentication() {
    try {
      const response = await fetch("/api/auth/check-session");
      const data = await response.json();

      if (data.authenticated) {
        this.currentUser = data.user;
        console.log("User authenticated:", this.currentUser);
      } else {
        window.location.href = "../index.html";
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      window.location.href = "../index.html";
    }
  }

  async checkEnrollmentStatus() {
    try {
      console.log("Checking enrollment status...");
      const response = await fetch("/api/modules/enrollment-status");

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Enrollment status check failed:",
          response.status,
          errorText
        );
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Enrollment status data:", data);

      // Ensure enrollment_status is properly set
      this.enrollmentStatus = data.enrollment_status || {};

      // Also check if we have enrolled_weeks array for additional validation
      if (data.enrolled_weeks && Array.isArray(data.enrolled_weeks)) {
        data.enrolled_weeks.forEach((week) => {
          this.enrollmentStatus[week.week] = true;
        });
      }

      console.log("Final enrollment status:", this.enrollmentStatus);

      this.updateModuleCards();
      this.updateProgressDisplay();

      // Show enrollment modal only if user is not enrolled in week1
      if (!this.enrollmentStatus.week1) {
        console.log("User not enrolled in week1, showing modal");
        setTimeout(() => {
          this.showEnrollmentModal();
        }, 1000);
      } else {
        console.log("User already enrolled in week1");
      }
    } catch (error) {
      console.error("Error checking enrollment status:", error);
      this.showToast(
        "Unable to load enrollment status. Please try again.",
        "warning"
      );
    }
  }

  showEnrollmentModal() {
    const enrollmentModal = new bootstrap.Modal(
      document.getElementById("enrollmentModal")
    );
    enrollmentModal.show();
  }

  async enrollInWeek(week) {
    try {
      console.log(`Attempting to enroll in ${week}...`);

      const response = await fetch("/api/modules/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ week: week }),
      });

      const data = await response.json();
      console.log("Enrollment response:", data);

      if (response.ok && data.enrolled) {
        this.showToast(`Successfully enrolled in ${week}!`, "success");

        // Close modal if it's open
        const enrollmentModal = bootstrap.Modal.getInstance(
          document.getElementById("enrollmentModal")
        );
        if (enrollmentModal) {
          enrollmentModal.hide();
        }

        // Update enrollment status
        this.enrollmentStatus[week] = true;
        this.updateModuleCards();
        this.updateProgressDisplay();

        return true;
      } else {
        const errorMessage = data.error || "Enrollment failed";

        // Handle specific error cases
        if (errorMessage.includes("already enrolled")) {
          this.enrollmentStatus[week] = true;
          this.updateModuleCards();
          this.updateProgressDisplay();
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Enrollment error:", error);

      let userMessage = "Failed to enroll. Please try again.";
      if (error.message.includes("logged in")) {
        userMessage = "Please log in to enroll in courses.";
      } else if (error.message.includes("complete previous")) {
        userMessage = error.message;
      } else if (error.message.includes("already enrolled")) {
        userMessage = "You are already enrolled in this week.";
      }

      this.showToast(userMessage, "error");
      return false;
    }
  }

  updateModuleCards() {
    const moduleCards = document.querySelectorAll(".module-card");

    moduleCards.forEach((card) => {
      const week = card.dataset.week;
      const statusBadge = card.querySelector(".status-badge");
      const moduleLink = card.querySelector(".module-link");

      if (this.enrollmentStatus[`week${week}`] || this.enrollmentStatus[week]) {
        // User is enrolled - enable the link
        const enrolledWeek = this.enrollmentStatus[`week${week}`]
          ? `week${week}`
          : week;
        statusBadge.textContent = "Enrolled";
        statusBadge.className = "status-badge enrolled";

        // Remove disabled class and enable pointer events
        moduleLink.classList.remove("disabled");
        moduleLink.style.pointerEvents = "auto";
        moduleLink.style.cursor = "pointer";

        // Remove any existing onclick handlers that might prevent navigation
        moduleLink.removeAttribute("onclick");
        moduleLink.onclick = null;

        // Ensure the link has the correct href
        if (
          week !== "modules" &&
          moduleLink.getAttribute("href") &&
          moduleLink.getAttribute("href") !== "#"
        ) {
          // Link already has a valid href, keep it
        } else if (week !== "modules") {
          moduleLink.href = `week${week}.html`;
        }
      } else {
        // User is NOT enrolled
        statusBadge.textContent = "Not Enrolled";
        statusBadge.className = "status-badge not-started";

        // Add disabled class and disable pointer events
        moduleLink.classList.add("disabled");
        moduleLink.style.pointerEvents = "none";
        moduleLink.style.cursor = "not-allowed";

        // Set up click handler to show appropriate message
        moduleLink.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (week === "1") {
            this.showEnrollmentModal();
          } else {
            this.showToast("Please complete previous weeks first.", "info");
          }
        };
      }
    });
  }

  updateProgressDisplay() {
    fetch("/api/modules/progress")
      .then((response) => response.json())
      .then((data) => {
        const progressFill = document.getElementById("progressFill");
        const progressText = document.getElementById("progressText");

        if (progressFill && progressText) {
          progressFill.style.width = `${data.progress_percentage}%`;
          progressText.textContent = `${Math.round(
            data.progress_percentage
          )}% Complete`;
        }
      })
      .catch((error) => {
        console.error("Error updating progress:", error);
      });
  }

  setupEventListeners() {
    const enrollBtn = document.getElementById("enrollBtn");
    if (enrollBtn) {
      enrollBtn.addEventListener("click", () => {
        this.enrollInWeek("week1");
      });
    }

    document.addEventListener("click", (e) => {
      const moduleLink = e.target.closest(".module-link");
      if (moduleLink && moduleLink.classList.contains("disabled")) {
        e.preventDefault();
        e.stopPropagation();
        const week = moduleLink.closest(".module-card").dataset.week;
        if (week !== "week1") {
          this.showToast("Please complete previous weeks first.", "info");
        }
      }
    });
  }

  showToast(message, type = "info") {
    // Remove existing toast
    const existingToast = document.getElementById("toast");
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  // Debug method
  testEnrollment() {
    console.log("Current enrollment status:", this.enrollmentStatus);
    console.log("Current user:", this.currentUser);

    // Test the enrollment endpoint directly
    fetch("/api/modules/enrollment-status")
      .then((response) => {
        console.log(
          "Enrollment status response:",
          response.status,
          response.statusText
        );
        return response.json();
      })
      .then((data) => console.log("Enrollment data:", data))
      .catch((error) => console.error("Test error:", error));
  }
}

// Add toast styles
const toastStyles = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    border-left: 4px solid #00b3ff;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 9999;
    max-width: 350px;
}

.toast.show {
    transform: translateX(0);
}

.toast-success {
    border-left-color: #4cc453;
}

.toast-error {
    border-left-color: #ff5b5b;
}

.toast-warning {
    border-left-color: #ffa64d;
}

.toast-info {
    border-left-color: #00b3ff;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #2b2b2b;
    font-weight: 500;
}

.toast-content i {
    font-size: 1.2rem;
}

.toast-success .toast-content i {
    color: #4cc453;
}

.toast-error .toast-content i {
    color: #ff5b5b;
}

.toast-warning .toast-content i {
    color: #ffa64d;
}

.toast-info .toast-content i {
    color: #00b3ff;
}

.status-badge.enrolled {
    background: var(--candy-green);
    color: white;
    box-shadow: 0 4px 15px rgba(76, 196, 83, 0.3);
}

.module-link.disabled {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
    background: var(--muted);
    border-color: var(--muted);
    color: white;
}

.module-link:not(.disabled) {
    pointer-events: auto;
    cursor: pointer;
}
`;

// Inject toast styles
const styleSheet = document.createElement("style");
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Initialize the enrollment system when DOM is loaded
let learningHub;
document.addEventListener("DOMContentLoaded", () => {
  learningHub = new LearningHubEnrollment();
  window.learningHub = learningHub;

  // Add debug method to window
  window.testEnrollment = () => {
    learningHub.testEnrollment();
  };
});
