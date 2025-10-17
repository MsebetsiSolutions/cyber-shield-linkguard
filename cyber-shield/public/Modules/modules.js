document.addEventListener("DOMContentLoaded", function () {
  initializePage();
  setupEventListeners();
  loadUserProgress();
  setupScrollEffects();
});

function initializePage() {
  const currentWeek = getCurrentWeek();
  highlightCurrentWeek(currentWeek);

  updateModuleCards();

  if (typeof bootstrap !== "undefined") {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

function setupEventListeners() {
  const weekButtons = document.querySelectorAll(".week-btn");
  weekButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const week = this.getAttribute("data-week");
      navigateToWeek(week);
    });
  });

  const moduleCards = document.querySelectorAll(".module-card");
  moduleCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      if (!e.target.closest(".module-link")) {
        const week = this.getAttribute("data-week");
        navigateToWeek(week);
      }
    });

    // Add hover effects
    card.addEventListener("mouseenter", function () {
      this.style.cursor = "pointer";
    });
  });

  // Module link click events
  const moduleLinks = document.querySelectorAll(".module-link");
  moduleLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.stopPropagation();
      const week = this.closest(".module-card").getAttribute("data-week");
      navigateToWeek(week);
    });
  });
}

function setupScrollEffects() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = "running";
      }
    });
  }, observerOptions);

  document.querySelectorAll(".module-card").forEach((card) => {
    observer.observe(card);
  });
}

function getCurrentWeek() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("week") || "1";
}

function highlightCurrentWeek(week) {
  const weekButtons = document.querySelectorAll(".week-btn");
  weekButtons.forEach((btn) => btn.classList.remove("active"));

  const currentWeekBtn = document.querySelector(
    `.week-btn[data-week="${week}"]`
  );
  if (currentWeekBtn) {
    currentWeekBtn.classList.add("active");
  }
}

function navigateToWeek(week) {
  // Removed loading state as requested
  window.location.href = `week${week}.html`;
}

function loadUserProgress() {
  const progressData = JSON.parse(localStorage.getItem("userProgress")) || {
    completed: [],
    inProgress: [],
    progressPercentage: 0,
  };

  updateProgressBar(progressData.progressPercentage);
  updateModuleStatuses(progressData);
  updateQuickStats(progressData);
}

function updateProgressBar(percentage) {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  if (progressFill && progressText) {
    progressFill.style.width = "0%";
    setTimeout(() => {
      progressFill.style.width = `${percentage}%`;
    }, 100);

    progressText.textContent = `${percentage}% Complete`;
  }
}

function updateModuleStatuses(progressData) {
  const moduleCards = document.querySelectorAll(".module-card");

  moduleCards.forEach((card) => {
    const week = card.getAttribute("data-week");
    const statusBadge = card.querySelector(".status-badge");

    if (progressData.completed.includes(parseInt(week))) {
      statusBadge.textContent = "Completed";
      statusBadge.className = "status-badge completed";
    } else if (progressData.inProgress.includes(parseInt(week))) {
      statusBadge.textContent = "In Progress";
      statusBadge.className = "status-badge in-progress";
    }
  });
}

function updateQuickStats(progressData) {
  const completedCount = progressData.completed.length;
  const inProgressCount = progressData.inProgress.length;

  console.log(`Completed: ${completedCount}, In Progress: ${inProgressCount}`);
}

function updateModuleCards() {
  const moduleCards = document.querySelectorAll(".module-card");

  moduleCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1 + 0.1}s`;
    card.style.animationPlayState = "paused";
  });
}

// Utility function to simulate progress update
function simulateProgressUpdate() {
  const progressData = {
    completed: [1, 2],
    inProgress: [6],
    progressPercentage: 42,
  };

  localStorage.setItem("userProgress", JSON.stringify(progressData));
  loadUserProgress();
}

// Export functions for use
window.ModulesManager = {
  navigateToWeek,
  loadUserProgress,
  simulateProgressUpdate,
  updateProgressBar,
  updateModuleStatuses,
};

// Handle page visibility changes
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    loadUserProgress();
  }
});
