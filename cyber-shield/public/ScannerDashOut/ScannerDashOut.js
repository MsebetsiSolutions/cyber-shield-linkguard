const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");
const setBusy = (btn, busy, text) => {
  btn.disabled = !!busy;
  if (text) {
    btn.dataset._orig = btn.dataset._orig || btn.textContent;
    btn.textContent = busy ? text : btn.dataset._orig;
  }
};

const toast = (msg, ms = 2000) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), ms);
};

// Chart.js instance
let resultsChart = null;

// Scan counter management
const scanCounter = {
  get remaining() {
    const today = new Date().toDateString();
    const lastScanDate = localStorage.getItem("lastScanDate");

    if (lastScanDate !== today) {
      localStorage.setItem("lastScanDate", today);
      localStorage.setItem("remainingScans", "1");
      return 1;
    }

    return parseInt(localStorage.getItem("remainingScans") || "1");
  },
  set remaining(v) {
    localStorage.setItem("remainingScans", v.toString());
    localStorage.setItem("lastScanDate", new Date().toDateString());
  },
  reset() {
    this.remaining = 1;
    localStorage.setItem("lastScanDate", new Date().toDateString());
  },
  decrement() {
    if (this.remaining > 0) {
      this.remaining = this.remaining - 1;
      this.updateUI();
      return true;
    }
    return false;
  },
  updateUI() {
    $("scanCounter").classList.remove("hidden");
    $("remainingScans").textContent = this.remaining;

    const scanCounterEl = $("scanCounter");
    scanCounterEl.classList.remove(
      "text-danger",
      "text-warning",
      "text-success"
    );

    if (this.remaining === 0) {
      scanCounterEl.classList.add("text-danger");
    }
  },
};

// Initialize Chart.js
function initChart() {
  const ctx = document.getElementById("resultsChart").getContext("2d");
  resultsChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Malicious", "Suspicious", "Harmless", "Undetected"],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: [
            "rgba(255, 111, 97, 0.8)",
            "rgba(255, 195, 107, 0.8)",
            "rgba(167, 239, 182, 0.8)",
            "rgba(196, 235, 249, 0.8)",
          ],
          borderColor: [
            "rgb(255, 111, 97)",
            "rgb(255, 195, 107)",
            "rgb(167, 239, 182)",
            "rgb(196, 235, 249)",
          ],
          borderWidth: 1,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              size: 11,
            },
          },
        },
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });
}

// Update chart with new data
function updateChart(malicious, suspicious, harmless, undetected) {
  if (resultsChart) {
    resultsChart.data.datasets[0].data = [
      malicious,
      suspicious,
      harmless,
      undetected,
    ];
    resultsChart.update();
  }
}

// Update stats display
function updateStats(malicious, suspicious, harmless, undetected) {
  $("statMalicious").textContent = malicious;
  $("statSuspicious").textContent = suspicious;
  $("statHarmless").textContent = harmless;
  $("statUndetected").textContent = undetected;
  show($("resultsOverview"));

  updateChart(malicious, suspicious, harmless, undetected);
}

function setBadge(el, band) {
  el.textContent = band;
  el.className = "badge " + band;
}

// Check if user can scan
function canScan() {
  if (scanCounter.remaining > 0) {
    return true;
  } else {
    toast(
      "You have reached your daily scan limit. Please sign up for unlimited scans."
    );
    return false;
  }
}

// URL Scan functionality
const urlInput = $("urlInput");
const scanBtn = $("scanBtn");

async function runScanUrl(url) {
  if (!canScan()) return;
  setBusy(scanBtn, true, "Scanning…");

  try {
    const r = await fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const j = await r.json();
    if (!r.ok) {
      toast(j.error || "Scan failed");
      return;
    }

    scanCounter.decrement();

    hide($("emptyState"));
    show($("resultUrl"));

    $("finalUrl").textContent = j.signals.final_url;
    $("scoreUrl").textContent = j.verdict.score;
    $("reasonsUrl").innerHTML = "";

    j.verdict.reasons.forEach((x) => {
      const li = document.createElement("li");
      li.textContent = x;
      $("reasonsUrl").appendChild(li);
    });

    setBadge($("badgeUrl"), j.verdict.band);

    // Process combined API results for URL
    if (j.signals && j.signals.api_results) {
      let totalMalicious = 0;
      let totalSuspicious = 0;
      let totalHarmless = 0;
      let totalUndetected = 0;
      let totalEngines = 0;

      j.signals.api_results.forEach((apiResult) => {
        if (apiResult.enabled && !apiResult.error) {
          totalMalicious += apiResult.malicious || 0;
          totalSuspicious += apiResult.suspicious || 0;
          totalHarmless += apiResult.harmless || 0;
          totalUndetected += apiResult.undetected || 0;
          totalEngines += apiResult.total_engines || 1;
        }
      });

      if (totalEngines > 0) {
        updateStats(
          totalMalicious,
          totalSuspicious,
          totalHarmless,
          totalUndetected
        );
      } else {
        const score = parseInt(j.verdict.score);
        if (score >= 80) {
          updateStats(1, 0, 0, 0);
        } else if (score >= 50) {
          updateStats(0, 1, 0, 0);
        } else if (score >= 20) {
          updateStats(0, 0, 1, 0);
        } else {
          updateStats(0, 0, 0, 1);
        }
      }
    } else {
      const score = parseInt(j.verdict.score);
      if (score >= 80) {
        updateStats(1, 0, 0, 0);
      } else if (score >= 50) {
        updateStats(0, 1, 0, 0);
      } else if (score >= 20) {
        updateStats(0, 0, 1, 0);
      } else {
        updateStats(0, 0, 0, 1);
      }
    }

    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById("mobileControls");
      const bsCollapse = new bootstrap.Collapse(mobileControls, {
        toggle: false,
      });
      bsCollapse.hide();
    }
  } catch (e) {
    toast("Network error");
  } finally {
    setBusy(scanBtn, false);
  }
}

scanBtn.addEventListener("click", () => {
  const u = urlInput.value.trim();
  if (!u) return toast("Paste a link first");
  runScanUrl(u);
});

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    scanBtn.click();
  }
});

// Initialize results display
function initResults() {
  hide($("resultUrl"));
  hide($("resultsOverview"));
  show($("emptyState"));

  $("statMalicious").textContent = "0";
  $("statSuspicious").textContent = "0";
  $("statHarmless").textContent = "0";
  $("statUndetected").textContent = "0";

  if (resultsChart) {
    updateChart(0, 0, 0, 0);
  }
}

// Navigation Menu
function toggleMenu() {
  const nav = document.getElementById("nav");
  const hamburger = $("hamburger");
  nav.classList.toggle("active");
  hamburger.classList.toggle("active");
}

function closeMenu() {
  const nav = document.getElementById("nav");
  const hamburger = $("hamburger");
  nav.classList.remove("active");
  hamburger.classList.remove("active");
}

// Event Listeners
function setupEventListeners() {
  // Menu Toggle
  $("hamburger").addEventListener("click", toggleMenu);

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        closeMenu();
      }
    });
  });
}

// Initialize everything
document.addEventListener("DOMContentLoaded", function () {
  console.log("ScannerDashOut initializing...");

  initChart();
  scanCounter.updateUI();
  initResults();
  setupEventListeners();

  console.log("ScannerDashOut ready - URL scanning available");
});
