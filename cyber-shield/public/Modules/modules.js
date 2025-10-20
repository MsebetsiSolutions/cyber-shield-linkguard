document.addEventListener("DOMContentLoaded", function () {
  initializePage();
  setupEventListeners();
  loadUserProgress();
  setupScrollEffects();
  setupNavigation();
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

function setupNavigation() {
  // Handle navigation between weeks
  const weekButtons = document.querySelectorAll(
    ".week-btn, .module-link, .module-card"
  );

  weekButtons.forEach((element) => {
    element.addEventListener("click", function (e) {
      e.preventDefault();
      const week =
        this.getAttribute("data-week") ||
        this.closest(".module-card")?.getAttribute("data-week");
      if (week) {
        loadWeekContent(week);
      }
    });
  });
}

async function loadWeekContent(week) {
  try {
    // Show loading state
    document.getElementById("content-area").innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading Week ${week} content...</p>
        </div>
      </div>
    `;

    // Update active state in sidebar
    document.querySelectorAll(".week-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`.week-btn[data-week="${week}"]`)
      ?.classList.add("active");

    if (week === "modules") {
      // Reload the dashboard
      location.reload();
      return;
    }

    // Load the week content
    const response = await fetch(`week${week}.html`);
    if (!response.ok) {
      throw new Error("Failed to load content");
    }

    const html = await response.text();
    document.getElementById("content-area").innerHTML = html;

    // Update progress
    updateProgressForWeek(week);

    // Re-initialize any scripts in the loaded content
    initializeLoadedContent();
  } catch (error) {
    console.error("Error loading week content:", error);
    document.getElementById("content-area").innerHTML = `
      <div class="alert alert-danger m-4">
        <h4>Error Loading Content</h4>
        <p>Failed to load Week ${week} content. Please try again later.</p>
        <button class="btn btn-primary" onclick="loadWeekContent('modules')">Return to Dashboard</button>
      </div>
    `;
  }
}

function initializeLoadedContent() {
  // Re-initialize any interactive elements in the loaded content
  const videos = document.querySelectorAll(".video-container iframe");
  videos.forEach((video) => {
    // Re-initialize video players if needed
  });

  // Re-attach event listeners for quizzes and interactive elements
  const quizButtons = document.querySelectorAll(
    '[onclick*="submitQuiz"], [onclick*="resetQuiz"]'
  );
  quizButtons.forEach((button) => {
    const onclick = button.getAttribute("onclick");
    if (onclick) {
      button.onclick = new Function(
        onclick.replace('onclick="', "").replace('"', "")
      );
    }
  });

  // Re-initialize any other dynamic content
  if (typeof window.initializeWeekContent === "function") {
    window.initializeWeekContent();
  }
}

function updateProgressForWeek(week) {
  const progressData = JSON.parse(localStorage.getItem("userProgress")) || {
    completed: [],
    inProgress: [],
    progressPercentage: 0,
  };

  if (!progressData.inProgress.includes(parseInt(week))) {
    progressData.inProgress.push(parseInt(week));
    localStorage.setItem("userProgress", JSON.stringify(progressData));
    loadUserProgress();
  }
}

function setupEventListeners() {
  const weekButtons = document.querySelectorAll(".week-btn");
  weekButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const week = this.getAttribute("data-week");
      loadWeekContent(week);
    });
  });

  const moduleCards = document.querySelectorAll(".module-card");
  moduleCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      if (!e.target.closest(".module-link")) {
        const week = this.getAttribute("data-week");
        loadWeekContent(week);
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
      loadWeekContent(week);
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
  return urlParams.get("week") || "modules";
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
  loadWeekContent,
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
