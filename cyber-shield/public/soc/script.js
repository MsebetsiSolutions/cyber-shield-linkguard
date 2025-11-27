// script.js - CyberShield Pro integration for your provided HTML
// - Persists projects, config, phases, findings, activity, last page
// - Injects Saved Projects panel into sidebar if missing
// - Simulates scanning and updates stats/activity/findings
// - Works with elements present in your HTML

(() => {
  // --- LocalStorage helper ---
  const LS = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch(e){ return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){}
    },
    push(key, item) {
      const arr = LS.get(key, []);
      arr.push(item);
      LS.set(key, arr);
    },
    removeItem(key) { localStorage.removeItem(key); }
  };

  // --- State keys ---
  const KEYS = {
    CONFIG: "cs_config_v1",
    PROJECTS: "cs_projects_v1",
    PHASES: "cs_phases_v1",
    ACTIVITIES: "cs_activities_v1",
    FINDINGS: "cs_findings_v1",
    LASTPAGE: "cs_lastpage_v1"
  };

  // --- Query shortcut ---
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // --- Ensure UI elements exist and create saved projects block if missing ---
  function ensureProjectsPanel() {
    // Look for existing savedProjectsCard
    if ($("#savedProjectsCard")) return;
    // Find sidebar column (.col-md-3)
    const sidebarCol = document.querySelector(".col-md-3");
    if (!sidebarCol) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="card shadow-sm mb-4" id="savedProjectsCard" style="display:none;">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0"><i class="bi bi-check-circle"></i> Saved Projects <span class="badge bg-light text-dark" id="projectCount">0</span></h5>
        </div>
        <div class="card-body" id="savedProjectsList"></div>
      </div>
    `;
    sidebarCol.insertBefore(wrapper.firstElementChild, sidebarCol.querySelector(".card.shadow-sm")?.nextSibling || null);
  }

  // --- Utilities ---
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).slice(2, 9);
  }

  function nowTS() { return new Date().toISOString(); }
  function niceDate(ts) { return ts ? new Date(ts).toLocaleString() : ""; }

  // --- Save/load config ---
  function loadConfigToUI() {
    const cfg = LS.get(KEYS.CONFIG, {});
    if ($("#targetHost")) $("#targetHost").value = cfg.target || "";
    if ($("#projectName")) $("#projectName").value = cfg.project || "";
    if ($("#authConfirm")) $("#authConfirm").checked = !!cfg.auth;
  }
  function saveConfigFromUI() {
    const cfg = {
      target: ($("#targetHost") && $("#targetHost").value.trim()) || "",
      project: ($("#projectName") && $("#projectName").value.trim()) || "Untitled Project",
      auth: ($("#authConfirm") && $("#authConfirm").checked) || false,
      savedAt: nowTS()
    };
    LS.set(KEYS.CONFIG, cfg);
    addActivity("Configuration", "Saved config", cfg.target || "—", "Success");
    // Also create a project entry on save (so save button both saves config and adds project)
    addProjectFromConfig(cfg);
    renderAll();
    showToast("Configuration saved");
  }

  // --- Projects management (inject UI) ---
  function addProjectFromConfig(cfg) {
    const projects = LS.get(KEYS.PROJECTS, []);
    // ensure uniqueness by project name+target
    const existing = projects.find(p => p.target === cfg.target && p.name === cfg.project);
    if (existing) return; // don't duplicate
    const project = {
      id: uid(),
      name: cfg.project,
      target: cfg.target,
      auth: !!cfg.auth,
      savedAt: nowTS()
    };
    projects.push(project);
    LS.set(KEYS.PROJECTS, projects);
    addActivity("Project", "Added project", project.target, "Success");
  }

  function renderProjects() {
    ensureProjectsPanel();
    const projects = LS.get(KEYS.PROJECTS, []);
    const card = $("#savedProjectsCard");
    const list = $("#savedProjectsList");
    const count = $("#projectCount");
    if (!card || !list || !count) return;
    if (!projects.length) {
      card.style.display = "none";
      list.innerHTML = "";
      count.textContent = "0";
      return;
    }
    card.style.display = "block";
    count.textContent = String(projects.length);
    list.innerHTML = projects.slice().reverse().map(p => {
      const authBadge = p.auth ? `<span class="badge bg-success ms-2">Authorized</span>` : "";
      return `
        <div class="project-card mb-2 p-2" style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong>${escapeHtml(p.name)}</strong>
                ${authBadge}
              </div>
              <div class="text-muted">${escapeHtml(p.target)}</div>
              <small class="text-muted">Saved: ${niceDate(p.savedAt)}</small>
            </div>
            <div class="ms-2">
              <button class="btn btn-sm btn-outline-secondary mb-1" onclick="openProject('${p.id}')"><i class="bi bi-box-arrow-up-right"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deleteProject('${p.id}')"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // global helpers exposed for inline onclick attribute
  window.deleteProject = function(id) {
    let projects = LS.get(KEYS.PROJECTS, []);
    const toDelete = projects.find(p => p.id === id);
    projects = projects.filter(p => p.id !== id);
    LS.set(KEYS.PROJECTS, projects);
    addActivity("Project", "Deleted project", toDelete ? toDelete.target : id, "Success");
    renderAll();
    showToast("Project deleted");
  };

  window.openProject = function(id) {
    // open project: load its config into UI and set as active
    const projects = LS.get(KEYS.PROJECTS, []);
    const p = projects.find(x => x.id === id);
    if (!p) return;
    if ($("#targetHost")) $("#targetHost").value = p.target;
    if ($("#projectName")) $("#projectName").value = p.name;
    if ($("#authConfirm")) $("#authConfirm").checked = !!p.auth;
    LS.set(KEYS.CONFIG, { target: p.target, project: p.name, auth: !!p.auth, savedAt: nowTS() });
    addActivity("Project", "Loaded project", p.target, "Success");
    showToast("Project loaded");
    renderAll();
  };

  // --- Activity log ---
  function addActivity(phase, action, target = "", status = "Success") {
    const activities = LS.get(KEYS.ACTIVITIES, []);
    activities.push({
      id: uid(),
      timestamp: nowTS(),
      phase: phase || "General",
      action: action || "",
      target: target || (LS.get(KEYS.CONFIG, {}).target || "—"),
      status: status || "Success"
    });
    LS.set(KEYS.ACTIVITIES, activities);
    renderActivity();
  }

  function renderActivity() {
    const tableBody = $("#activityLog");
    if (!tableBody) return;
    const activities = LS.get(KEYS.ACTIVITIES, []);
    if (!activities.length) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No activity yet</td></tr>`;
      return;
    }
    // show last 15 activities, newest first
    const slice = activities.slice(-15).reverse();
    tableBody.innerHTML = slice.map(a => `
      <tr>
        <td class="small">${new Date(a.timestamp).toLocaleString()}</td>
        <td><strong>${escapeHtml(a.phase)}</strong></td>
        <td>${escapeHtml(a.action)}</td>
        <td>${escapeHtml(a.target)}</td>
        <td><span class="badge ${a.status === 'Success' || a.status === 'OK' ? 'bg-success' : 'bg-danger'}">${escapeHtml(a.status)}</span></td>
      </tr>
    `).join("");
  }

  // --- Findings / Criticals ---
  function addFinding({ severity = "Low", description = "", target = "" } = {}) {
    const findings = LS.get(KEYS.FINDINGS, []);
    findings.push({
      id: uid(),
      severity,
      description,
      target,
      timestamp: nowTS()
    });
    LS.set(KEYS.FINDINGS, findings);
    renderFindings();
    renderStats();
  }

  function renderFindings() {
    const container = $("#criticalFindings");
    if (!container) return;
    const findings = LS.get(KEYS.FINDINGS, []);
    if (!findings.length) {
      container.innerHTML = `<p class="text-muted text-center py-3">No critical findings yet. Run scans to identify issues.</p>`;
      return;
    }
    // show criticals first
    const crit = findings.filter(f => f.severity && f.severity.toLowerCase() === "critical");
    if (!crit.length) {
      container.innerHTML = findings.slice(-10).reverse().map(f => `
        <div class="finding-card">${escapeHtml(f.description)}<br><small class="text-muted">${escapeHtml(f.target)} • ${new Date(f.timestamp).toLocaleString()}</small></div>
      `).join("");
      return;
    }
    container.innerHTML = crit.slice(-10).reverse().map(f => `
      <div class="alert alert-danger">
        <strong>${escapeHtml(f.description)}</strong><br><small class="text-muted">Target: ${escapeHtml(f.target)} • ${new Date(f.timestamp).toLocaleString()}</small>
      </div>
    `).join("");
  }

  // --- Phases (click handlers and saved statuses) ---
  function bindPhases() {
    // Look for phase-card elements; the HTML doesn't include data attributes so use textual title to identify
    const cards = $$(".phase-card");
    cards.forEach(card => {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        // identify which phase by the H5 text
        const name = (card.querySelector("h5")?.textContent || "Phase").trim();
        const id = (card.id || card.dataset.phaseId || name.replace(/\s+/g, "-").toLowerCase());
        // Save phase lastUsed and mark UI badge
        const phases = LS.get(KEYS.PHASES, {});
        phases[id] = { name, lastUsed: nowTS() };
        LS.set(KEYS.PHASES, phases);
        addActivity(name, "Phase opened", LS.get(KEYS.CONFIG, {}).target || "—", "Success");
        renderPhaseStatuses();
        // Special behavior: if this is scanning card, trigger simulated scan
        if (card.id === "scanningCard") {
          startSimulatedScan();
        }
      });
    });
    renderPhaseStatuses();
  }

  function renderPhaseStatuses() {
    const phases = LS.get(KEYS.PHASES, {});
    for (let i = 1; i <= 6; i++) {
      const badge = $(`#phase${i}Status`);
      if (!badge) continue;
      // find matching phase by name:
      const card = $(`.phase-card:nth-of-type(${i})`);
      const name = (card?.querySelector("h5")?.textContent || "").trim();
      // find stored entry
      const stored = Object.values(phases).find(p => p.name === name);
      if (stored) {
        badge.textContent = `Last used: ${new Date(stored.lastUsed).toLocaleString()}`;
        badge.className = "badge bg-info";
      } else {
        badge.textContent = "Not Started";
        badge.className = "badge bg-secondary";
      }
    }
  }

  // --- Scanning simulation (updates activities/findings/stats) ---
  let scanRunning = false;
  function startSimulatedScan() {
    if (scanRunning) return;
    const cfg = LS.get(KEYS.CONFIG, {});
    const target = cfg.target || ($("#targetHost") && $("#targetHost").value.trim()) || "unknown";
    if (!target) {
      alert("Set a target first in Active Target.");
      return;
    }
    scanRunning = true;
    // Update UI phase badge quickly:
    const badge = $("#phase3Status");
    if (badge) { badge.textContent = "In Progress"; badge.className = "badge bg-warning"; }
    addActivity("Scanning", "Simulated scan started", target, "Running");

    // Simulated steps with timeouts
    const simulatedSteps = [
      { delay: 800, action: () => addActivity("Reconnaissance", "OSINT pass completed", target, "Success") },
      { delay: 1200, action: () => addActivity("Scanning", "Port scan discovered open ports", target, "Success") },
      { delay: 1600, action: () => {
        addFinding({ severity: "High", description: "Outdated Apache server banner disclosure", target });
        addFinding({ severity: "Critical", description: "SSH root login allowed", target });
      }},
      { delay: 800, action: () => addActivity("Scanning", "Vulnerability scan finished", target, "Success") }
    ];

    // Execute steps sequentially
    (async () => {
      for (const step of simulatedSteps) {
        await new Promise(r => setTimeout(r, step.delay));
        try { step.action && step.action(); } catch(e){}
        if (!scanRunning) break;
      }
      scanRunning = false;
      if (badge) { badge.textContent = "Completed"; badge.className = "badge bg-success"; }
      addActivity("Scanning", "Simulated scan completed", target, "Success");
      renderAll();
    })();
  }

  // --- Stats rendering ---
  function renderStats() {
    const projects = LS.get(KEYS.PROJECTS, []);
    const activities = LS.get(KEYS.ACTIVITIES, []);
    const findings = LS.get(KEYS.FINDINGS, []);
    const scansCount = activities.filter(a => a.phase && a.phase.toLowerCase().includes("scan")).length;

    if ($("#statProjects")) $("#statProjects").textContent = String(projects.length || 0);
    if ($("#statScans")) $("#statScans").textContent = String(scansCount || 0);
    if ($("#statFindings")) $("#statFindings").textContent = String(findings.length || 0);
    if ($("#statCritical")) $("#statCritical").textContent = String(findings.filter(f => (f.severity||"").toLowerCase() === "critical").length || 0);
  }

  // --- Last visited page handling (nav links) ---
  function bindNavLinks() {
    const navLinks = Array.from(document.querySelectorAll(".navbar .nav-link"));
    navLinks.forEach(a => {
      a.addEventListener("click", (evt) => {
        // store last clicked link text or href
        const last = a.getAttribute("href") || a.textContent.trim();
        LS.set(KEYS.LASTPAGE, { href: last, label: a.textContent.trim(), ts: nowTS() });
        // allow default navigation
      });
    });
    // On load, show last page info (non-intrusive)
    const last = LS.get(KEYS.LASTPAGE, null);
    if (last) {
      setTimeout(() => {
        showToast("Last visited", `${last.label} • ${new Date(last.ts).toLocaleString()}`);
      }, 600);
    }
  }

  // --- Report modal / exports ---
  window.openReportModal = function() {
    const modal = $("#reportModal");
    const backdrop = $("#reportModalBackdrop");
    if (modal) modal.classList.add("show");
    if (backdrop) backdrop.classList.add("show");
  };
  window.closeReportModal = function() {
    const modal = $("#reportModal");
    const backdrop = $("#reportModalBackdrop");
    if (modal) modal.classList.remove("show");
    if (backdrop) backdrop.classList.remove("show");
  };

  window.generateTextReport = function() {
    // Generate a simple JSON report of state
    const report = {
      config: LS.get(KEYS.CONFIG, {}),
      projects: LS.get(KEYS.PROJECTS, []),
      activities: LS.get(KEYS.ACTIVITIES, []),
      findings: LS.get(KEYS.FINDINGS, []),
      phases: LS.get(KEYS.PHASES, {})
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cybershield_report_${(new Date()).toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    closeReportModal();
  };

  window.generatePDFReport = function() {
    if (!window.jspdf) {
      alert("jsPDF library not loaded.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const projects = LS.get(KEYS.PROJECTS, []);
    const findings = LS.get(KEYS.FINDINGS, []);
    pdf.text("CyberShield Pro - Quick Report", 10, 10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 18);
    pdf.text(`Projects: ${projects.length}`, 10, 26);
    pdf.text(`Findings: ${findings.length}`, 10, 34);
    pdf.save(`cybershield_report_${(new Date()).toISOString().slice(0,19).replace(/:/g,'-')}.pdf`);
    closeReportModal();
  };

  // --- Tiny toast helper ---
  function showToast(title, sub = "") {
    const container = $("#toastContainer");
    if (!container) return;
    const t = document.createElement("div");
    t.className = "custom-toast";
    t.style.minWidth = "260px";
    t.innerHTML = `<div style="font-weight:600">${escapeHtml(title)}</div>${sub ? `<div class="small text-muted">${escapeHtml(sub)}</div>` : ""}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // --- Render everything convenience ---
  function renderAll() {
    loadConfigToUI();
    renderProjects();
    renderActivity();
    renderFindings();
    renderPhaseStatuses();
    renderStats();
  }

  // --- Escape HTML helper for safe rendering ---
  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // --- Bindings on DOM ready ---
  function bindUI() {
    ensureProjectsPanel();
    // saveConfig button
    const saveBtn = document.getElementById("saveConfig");
    if (saveBtn) saveBtn.addEventListener("click", saveConfigFromUI);

    // scanning card
    const scanningCard = document.getElementById("scanningCard");
    if (scanningCard) {
      scanningCard.addEventListener("click", (e) => {
        // Save last page (phase) and then start scan
        LS.set(KEYS.LASTPAGE, { href: "#scanning", label: "Scanning", ts: nowTS() });
        startSimulatedScan();
      });
    }

    // Report modal openers (if any nav or UI calls openReportModal, functions exist)
    // Bind nav link tracking
    bindNavLinks();

    // Also bind pressing Enter on project name to save
    const projectNameInput = $("#projectName");
    if (projectNameInput) {
      projectNameInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          saveConfigFromUI();
        }
      });
    }

    // If the modal backdrop was included in HTML, clicking it should close the modal
    const backdrop = $("#reportModalBackdrop");
    if (backdrop) backdrop.addEventListener("click", closeReportModal);
  }

  // --- Initial startup ---
  function init() {
    bindUI();
    bindPhases();
    renderAll();

    // show welcome toast
    setTimeout(() => showToast("CyberShield Pro loaded", "All state persisted locally"), 800);
  }

  // run init when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose helpers to console for debugging
  window.CyberShield = {
    LS, KEYS, renderAll, addFinding, addActivity, deleteProject: window.deleteProject
  };

})();
