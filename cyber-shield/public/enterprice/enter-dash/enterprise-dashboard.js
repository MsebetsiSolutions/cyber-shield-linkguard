/* ===== Mock data & helpers ===== */
const reports = [
  {
    id: 1,
    title: "Phishing kit distributed via zip",
    severity: "High",
    source: "http://malicious.example",
    ts: "2025-09-16T06:10:00Z"
  },
  {
    id: 2,
    title: "Malware PE detected",
    severity: "Critical",
    source: "attachment:invoice.docx",
    ts: "2025-09-15T19:45:00Z"
  },
  {
    id: 3,
    title: "Suspicious domain engaging in typosquatting",
    severity: "Medium",
    source: "typo-secure.com",
    ts: "2025-09-15T11:02:00Z"
  },
  {
    id: 4,
    title: "QR redirecting to credential harvest",
    severity: "High",
    source: "qr://redirect/abc",
    ts: "2025-09-14T08:12:00Z"
  }
];

const feedItems = [
  {
    id: 1,
    title: "IOC: 203.0.113.45 observed in brute-force",
    time: "10m ago"
  },
  { 
    id: 2, 
    title: "Emerging CVE advisory: libfoo 3.2.1 - RCE", 
    time: "2h ago" 
  },
  {
    id: 3,
    title: "New phishing campaign targeting finance teams",
    time: "4h ago"
  },
  {
    id: 4,
    title: "Malicious APK observed on third-party store",
    time: "1d ago"
  }
];

// Updated user data with South African names and random company emails
const users = [
  { id: 1, name: "Aisha M.", email: "aisha@msebetsi.com", role: "Admin" },
  { id: 2, name: "Thabo N.", email: "thabo@cyberdefense.co.za", role: "Analyst" },
  { id: 3, name: "Lerato M.", email: "lerato@securetech.africa", role: "Developer" },
  { id: 4, name: "Sipho D.", email: "sipho@dataguard.solutions", role: "Analyst" },
  { id: 5, name: "Nomsa K.", email: "nomsa@africyber.co.za", role: "Manager" }
];

/* ===== USER MANAGEMENT ===== */
// Get the current user (in a real app, this would come from your auth system)
let currentUser = {
  name: "Aisha M.",
  email: "aisha@msebetsi.com",
  role: "Admin"
};

/* ===== UI helpers ===== */
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

/* ===== SECTION NAVIGATION ===== */
function switchSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section-content').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show the selected section
  const targetSection = document.querySelector(`.${sectionName}-section`);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Update navigation
  document.querySelectorAll('.nav a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-section') === sectionName) {
      link.classList.add('active');
    }
  });
}

/* ===== EXIT CONFIRMATION MODAL ===== */
function setupExitModal() {
  const logoButton = document.getElementById('logo-button');
  const exitModal = document.getElementById('exit-modal');
  const exitCancel = document.getElementById('exit-cancel');
  const exitConfirm = document.getElementById('exit-confirm');
  const usernamePlaceholder = document.getElementById('username-placeholder');
  
  // Set the username in the modal
  usernamePlaceholder.textContent = currentUser.name;
  
  // Open modal when logo is clicked
  if (logoButton) {
    logoButton.addEventListener('click', () => {
      exitModal.style.display = 'flex';
    });
  }
  
  // Close modal when cancel is clicked
  if (exitCancel) {
    exitCancel.addEventListener('click', () => {
      exitModal.style.display = 'none';
    });
  }
  
  // Handle exit confirmation - UPDATED TO REDIRECT
  if (exitConfirm) {
    exitConfirm.addEventListener('click', () => {
      // Redirect to the scanner dashboard
      window.location.href = '../../ScannerDash/ScannerDash.html';
    });
  }
}

/* ===== NAVIGATION HANDLING ===== */
function setupNavigation() {
  document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      
      if (section === 'settings') {
        switchSection('settings');
      } else {
        // For other sections, show a message (as per original code)
        alert(`Navigation to ${section} is a UI mock. Implement section switching if needed.`);
      }
    });
  });
}

/* Populate reports */
const reportsList = document.getElementById("reports-list");
function renderReports() {
  if (!reportsList) return;
  
  reportsList.innerHTML = "";
  for (const r of reports) {
    const item = el("div", { class: "report", role: "listitem" }, [
      el("div", {
        style:
          "width:10px;height:10px;border-radius:50%;background:" +
          (r.severity === "Critical"
            ? "var(--danger)"
            : r.severity === "High"
            ? "orange"
            : "var(--accent)")
      }),
      el("div", { class: "meta" }, [
        el("div", {}, [el("strong", {}, r.title)]),
        el(
          "div",
          { class: "small muted" },
          `${r.source} • ${new Date(r.ts).toLocaleString()}`
        )
      ]),
      el("div", {}, [
        el(
          "button",
          { class: "muted-btn", onclick: () => openReport(r.id) },
          "View"
        )
      ])
    ]);
    reportsList.appendChild(item);
  }
}

function openReport(id) {
  const r = reports.find((x) => x.id === id);
  if (!r) return alert("Report not found");
  const modal = document.getElementById("modal");
  document.getElementById("modal-title").textContent =
    "Threat Report — " + r.title;
  document.getElementById("modal-body").innerHTML = `
    <div style="flex:1">
      <div class="small">Source</div>
      <div style="font-weight:700;margin-top:6px">${r.source}</div>
      <div class="small" style="margin-top:12px">Severity: <strong>${
        r.severity
      }</strong></div>
      <div class="small" style="margin-top:8px">Time: ${new Date(
        r.ts
      ).toLocaleString()}</div>
      <div style="margin-top:12px" class="small">Details</div>
      <div style="margin-top:6px">This is a mock report. Replace this section with detailed indicators, affected hosts, yara signatures, file hashes, recommended remediation steps, and attachments.</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="scan-btn" onclick="ackReport(${id})">Acknowledge</button>
        <button class="muted-btn" onclick="exportReport(${id})">Export</button>
        <button class="muted-btn" onclick="pinToWorkspace(${id})">Pin to Workspace</button>
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

function ackReport(id) {
  alert("Report " + id + " acknowledged (mock)");
  document.getElementById("modal").style.display = "none";
}
function exportReport(id) {
  alert("Exporting report " + id + " (mock)");
}
function pinToWorkspace(id) {
  alert("Pinned report " + id + " to workspace Collections (mock)");
}

/* Feed */
function renderFeed() {
  const feed = document.getElementById("feed");
  if (!feed) return;
  
  feed.innerHTML = "";
  for (const f of feedItems) {
    const node = el("div", { class: "feed-item" }, [
      el("div", {}, [
        el("strong", {}, f.title),
        el("div", { class: "time" }, f.time)
      ]),
      el("div", { class: "space" })
    ]);
    feed.appendChild(node);
  }
}

/* Users */
function renderUsers() {
  const list = document.getElementById("users-list");
  if (!list) return;
  
  list.innerHTML = "";
  for (const u of users) {
    const node = el("div", { class: "user" }, [
      el(
        "div",
        {
          style:
            "width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent-2));display:flex;align-items:center;justify-content:center;font-weight:600"
        },
        u.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
      ),
      el("div", {}, [
        el("div", {}, u.name),
        el("div", { class: "small muted" }, u.email)
      ]),
      el("div", { class: "space" }),
      el("div", { class: "tag" }, u.role),
      el(
        "button",
        { class: "muted-btn", onclick: () => removeUser(u.id) },
        "Remove"
      )
    ]);
    list.appendChild(node);
  }
}
function removeUser(id) {
  if (!confirm("Remove user?")) return;
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) users.splice(idx, 1);
  renderUsers();
}

/* Workspace activities */
function renderWorkspaceActivities() {
  const container = document.getElementById("workspace-activities");
  if (!container) return;
  
  container.innerHTML = "";
  const acts = [
    "Pinned report: Phishing kit distributed via zip",
    "Shared report with Analysts group",
    "Added Lerato M. to Collections workspace",
    "Notebook added: Incident 2025-0916"
  ];
  acts.forEach((a) => {
    container.appendChild(el("div", { class: "small" }, a));
  });
}

/* Reputation checker (mock) */
if (document.getElementById("rep-check")) {
  document.getElementById("rep-check").addEventListener("click", () => {
    const v = document.getElementById("rep-input").value.trim();
    const out = document.getElementById("rep-result");
    if (!v) {
      out.textContent = "Enter an email or domain to check.";
      return;
    }
    // simple detection
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v);
    out.textContent = "Checking...";
    setTimeout(() => {
      // mock logic: domains containing "example" are good; "malicious" or "typo" are bad
      const badKeywords = ["malicious", "typo", "phish", "bad"];
      const foundBad = badKeywords.some((k) => v.toLowerCase().includes(k));
      if (foundBad) {
        out.innerHTML = `<span class="bad">Reputation: Poor</span> — Indicators found: phishing URLs, suspicious history.`;
      } else {
        if (isEmail) {
          out.innerHTML = `<span class="ok">Reputation: Clean</span> — No public breaches found (mock).`;
        } else if (isDomain) {
          out.innerHTML = `<span class="ok">Reputation: Neutral</span> — Low risk observed in passive DNS (mock).`;
        } else {
      out.innerHTML = `<span class="muted">Unknown format</span>`;
        }
      }
    }, 700);
  });
}

if (document.getElementById("rep-reset")) {
  document.getElementById("rep-reset").addEventListener("click", () => {
    document.getElementById("rep-input").value = "";
    document.getElementById("rep-result").textContent = "";
  });
}

/* Scanning (mock) */
if (document.getElementById("scan-url-btn")) {
  document.getElementById("scan-url-btn").addEventListener("click", () => {
    const v = document.getElementById("scan-input").value.trim();
    if (!v) {
      alert("Enter a URL or domain to scan");
      return;
    }
    simulateScan({ type: "url", value: v });
  });
}

if (document.getElementById("upload-trigger")) {
  document.getElementById("upload-trigger").addEventListener("click", () => {
    document.getElementById("file-input").click();
  });
}

if (document.getElementById("file-input")) {
  document.getElementById("file-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    simulateScan({ type: "file", value: file.name });
  });
}

if (document.getElementById("open-qr")) {
  document.getElementById("open-qr").addEventListener("click", () => {
    openQRMock();
  });
}

function simulateScan({ type, value }) {
  const id = reports.length + 1;
  const severity = Math.random() > 0.7 ? "High" : "Medium";
  const title =
    (type === "file" ? "File flagged" : "URL analysis") + " — " + value;
  reports.unshift({
    id,
    title,
    severity,
    source: value,
    ts: new Date().toISOString()
  });
  renderReports();
  // add feed item
  feedItems.unshift({
    id: Date.now(),
    title: `Scan result: ${value} — ${severity}`,
    time: "just now"
  });
  renderFeed();
  alert(`Scan complete (mock). Report ${id} added.`);
}

/* QR mock modal */
function openQRMock() {
  const modal = document.getElementById("modal");
  document.getElementById("modal-title").textContent = "QR Scanner (mock)";
  document.getElementById("modal-body").innerHTML = `
    <div class="qr-canvas" id="qr-canvas">QR image</div>
    <div style="flex:1">
      <div class="small">Detected content</div>
      <div id="qr-content" style="margin-top:8px;font-weight:700">https://phish.example/login</div>
      <div style="margin-top:12px" id="qr-actions">
        <button class="scan-btn" id="qr-scan-btn">Scan Content</button>
        <button class="muted-btn" id="qr-ignore">Ignore</button>
      </div>
    </div>
  `;
  modal.style.display = "flex";
  document.getElementById("qr-scan-btn").addEventListener("click", () => {
    simulateScan({
      type: "qr",
      value: document.getElementById("qr-content").textContent
    });
    modal.style.display = "none";
  });
  document
    .getElementById("qr-ignore")
    .addEventListener("click", () => (modal.style.display = "none"));
}

if (document.getElementById("close-modal")) {
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").style.display = "none";
  });
}

/* SIEM save (mock) */
if (document.getElementById("siem-save")) {
  document.getElementById("siem-save").addEventListener("click", () => {
    const endpoint = document.getElementById("siem-endpoint").value.trim();
    const token = document.getElementById("siem-token").value.trim();
    if (!endpoint || !token) return alert("Provide endpoint and token");
    document.getElementById("siem-last").textContent =
      new Date().toLocaleString();
    alert("SIEM settings saved (mock). Forwarding enabled.");
  });
}

/* Invite & tickets */
if (document.getElementById("invite-btn")) {
  document.getElementById("invite-btn").addEventListener("click", () => {
    const email = document.getElementById("invite-email").value.trim();
    if (!email) return alert("Enter email to invite");
    users.push({
      id: Date.now(),
      name: email.split("@")[0],
      email,
      role: "Member"
    });
    renderUsers();
    alert("Invitation sent (mock).");
    document.getElementById("invite-email").value = "";
  });
}

if (document.getElementById("open-ticket")) {
  document.getElementById("open-ticket").addEventListener("click", () => {
    const text = document.getElementById("ticket-text").value.trim();
    if (!text) return alert("Describe your issue");
    alert("Ticket created (mock). Support will respond in the community forum.");
    document.getElementById("ticket-text").value = "";
  });
}

if (document.getElementById("refresh-feed")) {
  document.getElementById("refresh-feed").addEventListener("click", () => {
    // mock update
    feedItems.unshift({
      id: Date.now(),
      title: "New advisory: Keep-alive attack observed",
      time: "now"
    });
    renderFeed();
  });
}

if (document.getElementById("export-feed")) {
  document.getElementById("export-feed").addEventListener("click", () => alert("Exporting feed (mock)"));
}

if (document.getElementById("view-forum")) {
  document.getElementById("view-forum").addEventListener("click", () => alert("Opening community forum (mock)"));
}

if (document.getElementById("open-workspaces")) {
  document.getElementById("open-workspaces").addEventListener('click', () => alert("Opening workspaces (mock)"));
}

/* Simple nav */
document.querySelectorAll(".nav a").forEach((a) => {
  a.addEventListener("click", () => {
    document
      .querySelectorAll(".nav a")
      .forEach((x) => x.classList.remove("active"));
    a.classList.add("active");
    alert("Navigation is a UI mock. Implement section switching if needed.");
  });
});

/* ===== INITIALIZATION ===== */
window.addEventListener("DOMContentLoaded", () => {
  // Existing initialization code
  renderReports();
  renderFeed();
  renderUsers();
  renderWorkspaceActivities();
  
  // New initialization
  setupExitModal();
  setupNavigation();
  
  // Set the current user name in the exit modal
  const usernamePlaceholder = document.getElementById('username-placeholder');
  if (usernamePlaceholder) {
    usernamePlaceholder.textContent = currentUser.name;
  }
});

// Accessibility: close modal with Esc
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    document.getElementById("modal").style.display = "none";
});

// Expose a couple functions for testing in console
window.__Cybershield = { simulateScan, reports, feedItems, users };
