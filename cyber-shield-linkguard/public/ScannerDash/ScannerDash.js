const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');
const setBusy = (btn, busy, text) => { 
  btn.disabled = !!busy; 
  if(text){ 
    btn.dataset._orig = btn.dataset._orig || btn.textContent; 
    btn.textContent = busy ? text : btn.dataset._orig; 
  } 
};

const toast = (msg, ms=2000) => { 
  const t = $('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), ms); 
};

// Chart.js instance
let resultsChart = null;

// Initialize Chart.js
function initChart() {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  resultsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Malicious', 'Suspicious', 'Harmless', 'Undetected'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 111, 97, 0.8)',
          'rgba(255, 195, 107, 0.8)',
          'rgba(167, 239, 182, 0.8)',
          'rgba(196, 235, 249, 0.8)'
        ],
        borderColor: [
          'rgb(255, 111, 97)',
          'rgb(255, 195, 107)',
          'rgb(167, 239, 182)',
          'rgb(196, 235, 249)'
        ],
        borderWidth: 1,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 11
            }
          }
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Update chart with new data
function updateChart(malicious, suspicious, harmless, undetected) {
  if (resultsChart) {
    resultsChart.data.datasets[0].data = [malicious, suspicious, harmless, undetected];
    resultsChart.update();
  }
}

// Scan counter management
const scanCounter = {
  get remaining(){ 
    const today = new Date().toDateString();
    const lastScanDate = localStorage.getItem('lastScanDate');
    
    // Reset scan count daily
    if (lastScanDate !== today) {
      localStorage.setItem('lastScanDate', today);
      localStorage.setItem('remainingScans', '5');
      return 5;
    }
    
    return parseInt(localStorage.getItem('remainingScans') || '5'); 
  },
  set remaining(v){ 
    localStorage.setItem('remainingScans', v.toString()); 
    localStorage.setItem('lastScanDate', new Date().toDateString()); // Update date when count changes
  },
  reset(){ 
    this.remaining = 5; 
    localStorage.setItem('lastScanDate', new Date().toDateString());
  },
  decrement(){ 
    if(this.remaining > 0) {
      this.remaining = this.remaining - 1;
      this.updateUI();
      
      if (this.remaining === 0) {
        // Show subscription modal if free scans are depleted
        setTimeout(() => {
          const subscriptionModal = new bootstrap.Modal($('subscriptionModal'));
          subscriptionModal.show();
        }, 1000);
      }
      
      return true;
    }
    return false;
  },
  updateUI(){
    const userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
    
    // Hide scan counter for paid users
    if (userPlanMode > 0) {
      $('scanCounter').classList.add('hidden');
    } else {
      $('scanCounter').classList.remove('hidden');
      $('remainingScans').textContent = this.remaining;
      
      const scanCounterEl = $('scanCounter');
      scanCounterEl.classList.remove('text-danger', 'text-warning', 'text-success');
      
      if(this.remaining === 0) {
        scanCounterEl.classList.add('text-danger');
      } else if(this.remaining <= 2) {
        scanCounterEl.classList.add('text-warning');
      } else {
        scanCounterEl.classList.add('text-success');
      }
    }
  }
};

// Session-based fetch function (no JWT tokens needed)
async function fetchWithSession(path, opts={}) {
  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers
  };
  
  try {
    const response = await fetch(path, {
      ...opts,
      headers,
      credentials: 'include' 
    });
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Save scan result to database
async function saveScanResult(scanData) {
  try {
    const response = await fetchWithSession('/api/scans/save', {
      method: 'POST',
      body: JSON.stringify(scanData)
    });
    
    if (response.ok) {
      console.log('Scan result saved successfully!');
    } else {
      const errorData = await response.json();
      console.error('Failed to save scan result:', response.status, errorData.error);
      toast('Failed to save scan result: ' + errorData.error);
    }
  } catch (error) {
    console.error('Error saving scan result:', error);
    toast('Network error when trying to save scan result.');
  }
}

// Set user UI
const welcomeMessage = $('welcomeMessage');
const userNameDisplay = $('userNameDisplay');
const logoutBtn = $('logout');
const fileScanBtn = $('fileScanBtn'); // Get the File Scan button
const qrScanBtn = $('qrScanBtn');     // Get the QR Scan button

function setUserUI(userData){ 
  console.log('Setting user UI with data:', userData); 
  
  if(userData && userData.authenticated){ 
    const welcomeText = `Welcome, ${userData.full_name || userData.email}!`;
    const displayName = userData.full_name || userData.email.split('@')[0];
    
    welcomeMessage.textContent = welcomeText;
    userNameDisplay.textContent = displayName;
    
    console.log('User UI updated:', {
      welcomeText,
      displayName,
      full_name: userData.full_name
    });

    // New logic: Control button states based on plan_mode
    controlScanButtons(userData.plan_mode);

  } else { 
    welcomeMessage.textContent = ''; 
    userNameDisplay.textContent = 'User Name'; // Fallback text
    console.log('User not authenticated, using fallback');
    // If not authenticated, disable all advanced scan buttons
    controlScanButtons(0); // Treat as free plan (plan_mode 0)
  }
}

// New function to control button states
function controlScanButtons(planMode) {
  const isPaidPlan = planMode === 1 || planMode === 2 || planMode === 3;

  // URL Scan button is always enabled (subject to daily limit)
  $('scanBtn').disabled = false; 

  if (isPaidPlan) {
    fileScanBtn.disabled = false;
    qrScanBtn.disabled = false;
    fileScanBtn.title = ''; // Clear title if previously set
    qrScanBtn.title = '';   // Clear title if previously set
  } else {
    fileScanBtn.disabled = true;
    qrScanBtn.disabled = true;
    fileScanBtn.title = 'Upgrade to a paid plan to scan files'; // Tooltip for disabled buttons
    qrScanBtn.title = 'Upgrade to a paid plan to scan QR codes';
  }
  console.log(`Plan Mode: ${planMode}, File Scan Enabled: ${!fileScanBtn.disabled}, QR Scan Enabled: ${!qrScanBtn.disabled}`);
}

// Logout functionality
function handleLogout() {
  try {
    fetchWithSession('/api/auth/logout', {
      method: 'POST'
    }).then(response => {
      if (response.ok) {
        console.log('Logout successful');
      } else {
        console.log('Logout API call failed, proceeding with client-side cleanup');
      }
    }).catch(e => {
      console.log('Logout API call failed, proceeding with client-side cleanup');
    });
  } catch (e) {
    console.log('Logout API call failed, proceeding with client-side cleanup');
  }
  
  scanCounter.reset();
  setUserUI(null); 
  toast('Signed out');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
}

logoutBtn.addEventListener('click', handleLogout);

// File input handling
const fileInput = $('fileInput');
const fileLabelText = $('fileLabelText');

fileInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    fileLabelText.textContent = this.files[0].name;
  } else {
    fileLabelText.textContent = 'Choose file or drag here';
  }
});

// Initialize results display
function initResults() {
  hide($('resultUrl'));
  hide($('resultFile'));
  hide($('resultQr'));
  hide($('resultsOverview'));
  show($('emptyState'));
  
  $('statMalicious').textContent = '0';
  $('statSuspicious').textContent = '0';
  $('statHarmless').textContent = '0';
  $('statUndetected').textContent = '0';
  
  // Reset chart if it exists
  if (resultsChart) {
    updateChart(0, 0, 0, 0);
  }
}

// Update stats display
function updateStats(malicious, suspicious, harmless, undetected) {
  $('statMalicious').textContent = malicious;
  $('statSuspicious').textContent = suspicious;
  $('statHarmless').textContent = harmless;
  $('statUndetected').textContent = undetected;
  show($('resultsOverview'));
  
  // Update chart
  updateChart(malicious, suspicious, harmless, undetected);
}

function setBadge(el, band){ 
  el.textContent = band; 
  el.className = 'badge ' + band; 
}

// Check if user can scan (now also considers plan mode for file/qr scans)
function canScan(scanType = 'url') { // Add scanType parameter
  let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0'); // Get plan_mode from session storage
  
  if (scanType === 'file' || scanType === 'qr') {
    if (userPlanMode === 0) { // Free plan cannot access file or QR scans
      toast('Upgrade your plan to unlock file and QR code scanning.');
      const subscriptionModal = new bootstrap.Modal($('subscriptionModal'));
      subscriptionModal.show();
      return false;
    }
  }

  if (scanCounter.remaining > 0 || userPlanMode > 0) { // Paid users have unlimited scans
    return true;
  } else {
    toast('You have reached your daily scan limit. Please subscribe to continue scanning.');
    const subscriptionModal = new bootstrap.Modal($('subscriptionModal'));
    subscriptionModal.show();
    return false;
  }
}

// URL Scan functionality
const urlInput = $('urlInput');
const scanBtn = $('scanBtn');

async function runScanUrl(url){
  if (!canScan('url')) return; // Pass scanType
  setBusy(scanBtn, true, 'Scanning…');
  
  try{
    const r = await fetchWithSession('/api/scan', { 
      method: 'POST', 
      body: JSON.stringify({ url })
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      toast(j.error || 'Scan failed');
      return;
    }
    
    // Decrement scan count only for free users
    let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
    if (userPlanMode === 0) {
      scanCounter.decrement();
    }
    
    hide($('emptyState'));
    hide($('resultFile'));
    hide($('resultQr'));
    show($('resultUrl'));
    
    $('finalUrl').textContent = j.signals.final_url; 
    $('scoreUrl').textContent = j.verdict.score;
    $('reasonsUrl').innerHTML = '';
    
    j.verdict.reasons.forEach(x => { 
      const li = document.createElement('li'); 
      li.textContent = x; 
      $('reasonsUrl').appendChild(li);
    });
    
    setBadge($('badgeUrl'), j.verdict.band);
    
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
    
    // Save scan result to database
    const scanData = {
      scan_type: 'url',
      content: url,
      result: JSON.stringify(j),
      verdict_band: j.verdict.band // Pass the verdict band
    };
    
    saveScanResult(scanData);
    
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy(scanBtn, false); 
  }
}

scanBtn.addEventListener('click', () => {
  const u = urlInput.value.trim(); 
  if(!u) return toast('Paste a link first'); 
  runScanUrl(u); 
});

urlInput.addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    scanBtn.click(); 
  } 
});

// File Scan functionality
fileScanBtn.addEventListener('click', () => {
  const f = fileInput.files && fileInput.files[0]; 
  if(!f) return toast('Choose a file first'); 
  runScanFile(f); 
});

async function runScanFile(file){
  if (!canScan('file')) return; // Pass scanType
  
  setBusy(fileScanBtn, true, 'Uploading…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const r = await fetch('/api/scan_file', { 
      method: 'POST', 
      credentials: 'include', // Include session cookies
      body: fd 
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      toast(j.error || 'File scan failed');
      return;
    }
    
    // Decrement scan count only for free users
    let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
    if (userPlanMode === 0) {
      scanCounter.decrement();
    }
    
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultQr'));
    show($('resultFile'));
    
    $('fileName').textContent = j.file.filename || '(file)'; 
    $('fileSha').textContent = j.file.sha256 ? ' · ' + j.file.sha256 : '';
    
    let vtSummary = '';
    if (j.virustotal.enabled && !j.virustotal.error) {
      vtSummary = `Malicious: ${j.virustotal.malicious || 0}, Suspicious: ${j.virustotal.suspicious || 0}, ` +
                 `Harmless: ${j.virustotal.harmless || 0}, Undetected: ${j.virustotal.undetected || 0}`;
    } else {
      vtSummary = 'VirusTotal scan not available or failed';
    }
    $('vtSummaryFile').textContent = vtSummary;
    
    $('reasonsFile').innerHTML = '';
    
    (j.verdict.reasons || []).forEach(x => { 
      const li = document.createElement('li'); 
      li.textContent = x; 
      $('reasonsFile').appendChild(li);
    });
    
    setBadge($('badgeFile'), j.verdict.band); 
    $('scoreFile').textContent = j.verdict.score;
    
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
    
    // Save scan result to database
    const scanData = {
      scan_type: 'file',
      content: file.name,
      result: JSON.stringify(j),
      verdict_band: j.verdict.band // Pass the verdict band
    };
    
    saveScanResult(scanData);
    
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy(fileScanBtn, false); 
  }
}

// QR Scan functionality
qrScanBtn.addEventListener('click', () => {
  const f = qrInput.files && qrInput.files[0]; 
  if(!f) return toast('Pick an image of a QR code'); 
  runScanQr(f); 
});

async function runScanQr(file){
  if (!canScan('qr')) return; // Pass scanType
  
  setBusy(qrScanBtn, true, 'Analyzing…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const r = await fetch('/api/scan_qr', { 
      method: 'POST', 
      credentials: 'include', // Include session cookies
      body: fd 
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      toast(j.error || 'QR scan failed');
      return;
    }
    
    // Decrement scan count only for free users
    let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
    if (userPlanMode === 0) {
      scanCounter.decrement();
    }
    
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultFile'));
    show($('resultQr'));
    
    $('qrText').textContent = j.decoded || '(no data)';
    
    let qrVerdictBand = 'SAFE'; // Default for non-URL QR codes
    if(j.type === 'url' && j.verdict) {
      show($('qrUrlBlock'));
      $('finalUrlQr').textContent = j.signals.final_url; 
      $('scoreQr').textContent = j.verdict.score;
      $('reasonsQr').innerHTML = '';
      
      j.verdict.reasons.forEach(x => { 
        const li = document.createElement('li'); 
        li.textContent = x; 
        $('reasonsQr').appendChild(li);
      });
      
      setBadge($('badgeQr'), j.verdict.band);
      qrVerdictBand = j.verdict.band; // Set band from URL verdict
      
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
    } else {
      hide($('qrUrlBlock'));
      updateStats(0, 0, 1, 0); // Consider non-URL QR as harmless for stats if no other verdict
    }
    
    // Save scan result to database
    const scanData = {
      scan_type: 'qr_code',
      content: j.decoded || 'QR code image',
      result: JSON.stringify(j),
      verdict_band: qrVerdictBand // Pass the verdict band (default or from URL scan)
    };
    
    saveScanResult(scanData);
    
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy(qrScanBtn, false); 
  }
}

// User dropdown functionality
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

// Toggle desktop dropdown
userDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!userDropdownBtn.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.style.display = 'none';
  }
});

// Prevent dropdown from closing when clicking inside it
userDropdown.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Update the plan badge based on user's plan mode
function updatePlanBadge(planMode) {
  const planBadge = document.getElementById('planMode');
  if (!planBadge) return;
  
  const planMap = {
    0: {text: 'FREE PLAN', class: 'free-plan'},
    1: {text: 'PRO PLAN', class: 'pro-plan'},
    2: {text: 'TEAM PLAN', class: 'team-plan'},
    3: {text: 'ENTERPRISE', class: 'enterprise-plan'}
  };
  
  const plan = planMap[planMode] || planMap[0];
  
  // Remove all plan classes
  planBadge.classList.remove('free-plan', 'pro-plan', 'team-plan', 'enterprise-plan');
  
  // Add the current plan class
  planBadge.classList.add(plan.class);
  planBadge.textContent = plan.text;
}

// Check user plan function
async function checkUserPlan() {
  try {
    const response = await fetchWithSession('/api/subscription/current');
    if (response.ok) {
      const data = await response.json();
      updatePlanBadge(data.plan_mode);
      // Store plan_mode in sessionStorage for easy access
      sessionStorage.setItem('plan_mode', data.plan_mode);
      
      // Update scan counter UI based on plan
      scanCounter.updateUI();
      
      return data.plan_mode;
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
  }
  return 0; // Default to free plan
}

// Initialize dashboard and check authentication
(async function boot(){
  console.log('Dashboard initializing...');
  
  try {
    const r = await fetchWithSession('/api/auth/me');
    console.log('Auth check response status:', r.status);
    
    if(r.ok){ 
      const userData = await r.json(); 
      console.log('User data received:', userData);
      
      if (userData.authenticated) {
        // Initialize chart
        initChart();
        
        // Check user plan and update UI accordingly
        const planMode = await checkUserPlan();
        
        setUserUI({...userData, plan_mode: planMode}); 
        scanCounter.updateUI();
        initResults();
        console.log('User authenticated successfully');
        return;
      } else {
        console.log('User not authenticated, redirecting to login');
        sessionStorage.removeItem('plan_mode'); // Clear plan_mode if not authenticated
        window.location.href = '../index.html';
        return;
      }
    } else {
      console.log('Auth check failed, redirecting to login');
      sessionStorage.removeItem('plan_mode'); // Clear plan_mode on auth check failure
      window.location.href = '../index.html';
      return;
    }
  } catch(e) {
    console.error('Failed to fetch user info', e);
    sessionStorage.removeItem('plan_mode'); // Clear plan_mode on error
    window.location.href = '../index.html';
    return;
  }
})();
