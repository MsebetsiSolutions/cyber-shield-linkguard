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
let statsChart1 = null;
let statsChart2 = null;

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
      localStorage.setItem('remainingScans', '1'); 
      return 1; 
    }
    
    return parseInt(localStorage.getItem('remainingScans') || '1'); 
  },
  set remaining(v){ 
    localStorage.setItem('remainingScans', v.toString()); 
    localStorage.setItem('lastScanDate', new Date().toDateString()); 
  },
  reset(){ 
    this.remaining = 1; // Changed from 5 to 1
    localStorage.setItem('lastScanDate', new Date().toDateString());
  },
  decrement(){ 
    if(this.remaining > 0) {
      this.remaining = this.remaining - 1;
      this.updateUI();
      
      if (this.remaining === 0) {

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
      }
    }
  }
};

// Session-based fetch function (no JWT tokens needed)
async function fetchWithSession(path, opts={}) {
  // For FormData (file uploads), don't set Content-Type header
  const headers = {};
  
  // Only set Content-Type for JSON requests
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge with any existing headers
  Object.assign(headers, opts.headers || {});
  
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
    // Determine threat level based on verdict band
    let threatLevel = 'clean';
    if (scanData.verdict_band === 'DANGER') {
      threatLevel = 'malicious';
    } else if (scanData.verdict_band === 'WARN') {
      threatLevel = 'suspicious';
    }
    
    // Add threat level to scan data
    scanData.threat_level = threatLevel;
    
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
const fileScanBtn = $('fileScanBtn'); 
const qrScanBtn = $('qrScanBtn');     
const twButton = $('twButton');     

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

    // button states based on plan_mode
    controlScanButtons(userData.plan_mode);
    controlTeamWorkspaceButton(userData.plan_mode);

  } else { 
    welcomeMessage.textContent = ''; 
    userNameDisplay.textContent = 'User Name';
    console.log('User not authenticated, using fallback');

    controlScanButtons(0); 
    controlTeamWorkspaceButton(0); 
  }
}

// Function to control scan button states (File and QR)
function controlScanButtons(planMode) {
  const isPaidPlan = planMode === 1 || planMode === 2 || planMode === 3;

  $('scanBtn').disabled = false; 

  if (isPaidPlan) {
    fileScanBtn.disabled = false;
    qrScanBtn.disabled = false;
    fileScanBtn.title = ''; 
    qrScanBtn.title = '';  
  } else {
    fileScanBtn.disabled = true;
    qrScanBtn.disabled = true;
    fileScanBtn.title = 'Upgrade to a paid plan to scan files';
    qrScanBtn.title = 'Upgrade to a paid plan to scan QR codes';
  }
  console.log(`Plan Mode: ${planMode}, File Scan Enabled: ${!fileScanBtn.disabled}, QR Scan Enabled: ${!qrScanBtn.disabled}`);
}

// New function to control Team Workspace button visibility
function controlTeamWorkspaceButton(planMode) {
  if (planMode === 2 || planMode === 3) {
    show(twButton);
  } else {
    hide(twButton);
  }
  console.log(`Plan Mode: ${planMode}, Team Workspace Visible: ${!twButton.classList.contains('hidden')}`);
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

// Check if user can scan 
function canScan(scanType = 'url') {
  let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0'); 
  
  if (scanType === 'file' || scanType === 'qr') {
    if (userPlanMode === 0) { 
      toast('Upgrade your plan to unlock file and QR code scanning.');
      
      const subscriptionModalElement = $('subscriptionModal');
      if (subscriptionModalElement) {
          const subscriptionModal = new bootstrap.Modal(subscriptionModalElement);
          subscriptionModal.show();
      }
      return false;
    }
  }

  if (scanCounter.remaining > 0 || userPlanMode > 0) {
    return true;
  } else {
    toast('You have reached your daily scan limit. Please subscribe to continue scanning.');
    // Only show modal if it's explicitly about subscription
    const subscriptionModalElement = $('subscriptionModal');
    if (subscriptionModalElement) {
        const subscriptionModal = new bootstrap.Modal(subscriptionModalElement);
        subscriptionModal.show();
    }
    return false;
  }
}

// URL Scan functionality
const urlInput = $('urlInput');
const scanBtn = $('scanBtn');

async function runScanUrl(url){
  if (!canScan('url')) return; 
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
    
    // Process combined API results for URL
    if (j.signals && j.signals.api_results) {
        let totalMalicious = 0;
        let totalSuspicious = 0;
        let totalHarmless = 0;
        let totalUndetected = 0;
        let totalEngines = 0;
        
        j.signals.api_results.forEach(apiResult => {
            if (apiResult.enabled && !apiResult.error) {
                totalMalicious += apiResult.malicious || 0;
                totalSuspicious += apiResult.suspicious || 0;
                totalHarmless += apiResult.harmless || 0;
                totalUndetected += apiResult.undetected || 0;
                totalEngines += apiResult.total_engines || 1;
            }
        });
        
        if (totalEngines > 0) {
            updateStats(totalMalicious, totalSuspicious, totalHarmless, totalUndetected);
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
    
    // Save scan result to database
    const scanData = {
      scan_type: 'url',
      content: url,
      result: JSON.stringify(j),
      verdict_band: j.verdict.band 
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
  if (!canScan('file')) return;
  
  setBusy(fileScanBtn, true, 'Uploading…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    // Use fetchWithSession instead of regular fetch to include session cookies
    const r = await fetchWithSession('/api/scan_file', { 
      method: 'POST',
      body: fd 
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      // More specific error messages
      if (j.error && j.error.includes('File type not allowed')) {
          toast('File type not supported. Please use: TXT, PDF, PNG, JPG, GIF, DOC, DOCX, EXE, ZIP');
      } else {
          toast(j.error || 'File scan failed');
      }
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
    
    $('reasonsFile').innerHTML = '';
    
    (j.verdict.reasons || []).forEach(x => { 
      const li = document.createElement('li'); 
      li.textContent = x; 
      $('reasonsFile').appendChild(li);
    });
    
    setBadge($('badgeFile'), j.verdict.band); 
    $('scoreFile').textContent = j.verdict.score;
    
    // Process combined API results for files
    if (j.api_results && j.api_results.length > 0) {
        let totalMalicious = 0;
        let totalSuspicious = 0;
        let totalHarmless = 0;
        let totalUndetected = 0;
        let totalEngines = 0;
        
        j.api_results.forEach(apiResult => {
            if (apiResult.enabled && !apiResult.error) {
                totalMalicious += apiResult.malicious || 0;
                totalSuspicious += apiResult.suspicious || 0;
                totalHarmless += apiResult.harmless || 0;
                totalUndetected += apiResult.undetected || 0;
                totalEngines += apiResult.total_engines || 1;
            }
        });
        
        // If we have valid results, use them
        if (totalEngines > 0) {
            updateStats(totalMalicious, totalSuspicious, totalHarmless, totalUndetected);
        } else {
            // Fallback to verdict score if no engine data
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
        // Fallback when no API results
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
    
    // Save scan result to database
    const scanData = {
      scan_type: 'file',
      content: file.name,
      result: JSON.stringify(j),
      verdict_band: j.verdict.band
    };
    
    saveScanResult(scanData);
    
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    console.error('File scan error:', e);
    toast('Network error: ' + e.message); 
  } finally { 
    setBusy(fileScanBtn, false); 
  }
}

// QR Scan functionality
const qrInput = $('qrInput');

qrScanBtn.addEventListener('click', () => {
  const f = qrInput.files && qrInput.files[0]; 
  if(!f) return toast('Pick an image of a QR code'); 
  runScanQr(f); 
});

async function runScanQr(file){
  if (!canScan('qr')) return;
  
  setBusy(qrScanBtn, true, 'Analyzing…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const r = await fetchWithSession('/api/scan_qr', { 
      method: 'POST',
      body: fd
    });
    
    if (!r.ok) {
      const errorData = await r.json();
      // More specific error handling
      if (r.status === 503) {
        toast('QR scanning feature is currently unavailable. Please try again later or contact support.');
        console.error('QR library error:', errorData.error);
        return;
      }
      throw new Error(errorData.error || 'QR scan failed');
    }
    
    const j = await r.json(); 
    
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
    
    let qrVerdictBand = 'SAFE';
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
      qrVerdictBand = j.verdict.band;
      
      // Process combined API results for QR URL
      if (j.signals && j.signals.api_results) {
          let totalMalicious = 0;
          let totalSuspicious = 0;
          let totalHarmless = 0;
          let totalUndetected = 0;
          let totalEngines = 0;
          
          j.signals.api_results.forEach(apiResult => {
              if (apiResult.enabled && !apiResult.error) {
                  totalMalicious += apiResult.malicious || 0;
                  totalSuspicious += apiResult.suspicious || 0;
                  totalHarmless += apiResult.harmless || 0;
                  totalUndetected += apiResult.undetected || 0;
                  totalEngines += apiResult.total_engines || 1;
              }
          });
          
          if (totalEngines > 0) {
              updateStats(totalMalicious, totalSuspicious, totalHarmless, totalUndetected);
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
    } else {
      hide($('qrUrlBlock'));
      updateStats(0, 0, 1, 0);
    }
    
    // Save scan result to database
    const scanData = {
      scan_type: 'qr_code',
      content: j.decoded || 'QR code image',
      result: JSON.stringify(j),
      verdict_band: qrVerdictBand
    };
    
    saveScanResult(scanData);
    
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    console.error('QR scan error:', e);
    if (e.message.includes('library not installed')) {
      toast('QR scanning is temporarily unavailable. Our team is working on a fix.');
    } else {
      toast('QR scan failed: ' + e.message); 
    }
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
      
      scanCounter.updateUI();
      
      return data.plan_mode;
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
  }
  return 0; 
}

// Toggle stats button visibility based on plan mode
function toggleStatsButton(planMode) {
  const statsButton = document.getElementById('statsButton');
  const isSubscribed = planMode === 1 || planMode === 2 || planMode === 3;
  
  if (isSubscribed) {
    statsButton.classList.remove('hidden');
  } else {
    statsButton.classList.add('hidden');
  }
}

// Add this function to control Enterprise button visibility
function controlEnterpriseButton(planMode) {
  const enterpriseButton = document.getElementById('twEnterprise');
  if (planMode === 3) { 
    show(enterpriseButton);
  } else {
    hide(enterpriseButton);
  }
  console.log(`Plan Mode: ${planMode}, Enterprise Button Visible: ${!enterpriseButton.classList.contains('hidden')}`);
}


// control Background Check button visibility
function controlBackgroundCheckButton(planMode) {
  const reputationButton = document.getElementById('twReputation');
  if (planMode === 3) { 
    show(reputationButton);
  } else {
    hide(reputationButton);
  }
  console.log(`Plan Mode: ${planMode}, Background Check Button Visible: ${!reputationButton.classList.contains('hidden')}`);
}


// Updated setUserUI function with Enterprise button control
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

    // Control button states based on plan_mode
    controlScanButtons(userData.plan_mode);
    controlTeamWorkspaceButton(userData.plan_mode);
    controlEnterpriseButton(userData.plan_mode);
    controlBackgroundCheckButton(userData.plan_mode); 

  } else { 
    welcomeMessage.textContent = ''; 
    userNameDisplay.textContent = 'User Name'; 
    console.log('User not authenticated, using fallback');
    controlScanButtons(0);
    controlTeamWorkspaceButton(0);
    controlEnterpriseButton(0);
    controlBackgroundCheckButton(0); 
  }
}

// Initialize stats charts
function initStatsCharts() {
  // Destroy existing charts if they exist
  if (statsChart1) {
    statsChart1.destroy();
  }
  if (statsChart2) {
    statsChart2.destroy();
  }
  
  // Scan Type Chart
  const typeCtx = document.getElementById('scanTypeChart').getContext('2d');
  statsChart1 = new Chart(typeCtx, {
    type: 'doughnut',
    data: {
      labels: ['URL Scans', 'File Scans', 'QR Scans'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          'rgba(0, 179, 255, 0.8)',
          'rgba(255, 195, 107, 0.8)',
          'rgba(167, 239, 182, 0.8)'
        ],
        borderColor: [
          'rgb(0, 179, 255)',
          'rgb(255, 195, 107)',
          'rgb(167, 239, 182)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });
  
  // Timeline Chart
  const timelineCtx = document.getElementById('timelineChart').getContext('2d');
  statsChart2 = new Chart(timelineCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Scans per Day',
        data: [],
        backgroundColor: 'rgba(233, 183, 201, 0.2)',
        borderColor: 'rgba(233, 183, 201, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  return { statsChart1, statsChart2 };
}

// Load user stats
async function loadUserStats() {
  const statsLoading = document.getElementById('statsLoading');
  const statsContent = document.getElementById('statsContent');
  const statsError = document.getElementById('statsError');
  
  show(statsLoading);
  hide(statsContent);
  hide(statsError);
  
  try {
    const response = await fetchWithSession('/api/scans/stats');
    
    if (response.ok) {
      const statsData = await response.json();
      displayStats(statsData);
    } else {
      throw new Error('Failed to fetch stats');
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    hide(statsLoading);
    show(statsError);
  }
}

// Display stats in modal
function displayStats(statsData) {
  const statsLoading = document.getElementById('statsLoading');
  const statsContent = document.getElementById('statsContent');
  
  hide(statsLoading);
  show(statsContent);
  
  // Update summary cards
  document.getElementById('totalScans').textContent = statsData.totalScans || 0;
  
  // Calculate malicious and safe scans from threat levels
  const maliciousScans = statsData.threatLevels?.malicious || 0;
  const safeScans = (statsData.threatLevels?.clean || 0) + (statsData.threatLevels?.suspicious || 0);
  
  document.getElementById('maliciousScans').textContent = maliciousScans;
  document.getElementById('safeScans').textContent = safeScans;
  
  // Update charts
  if (statsChart1 && statsData.scanTypes) {
    statsChart1.data.datasets[0].data = [
      statsData.scanTypes.url || 0,
      statsData.scanTypes.file || 0,
      statsData.scanTypes.qr_code || 0
    ];
    statsChart1.update();
  }
  
  if (statsChart2 && statsData.timeline) {
    statsChart2.data.labels = statsData.timeline.labels || [];
    statsChart2.data.datasets[0].data = statsData.timeline.data || [];
    statsChart2.update();
  }
  
  // Update recent scans table
  const recentScansTable = document.getElementById('recentScansTable');
  recentScansTable.innerHTML = '';
  
  if (statsData.recentScans && statsData.recentScans.length > 0) {
    statsData.recentScans.forEach(scan => {
      const row = document.createElement('tr');
      
      // Format date
      const scanDate = new Date(scan.scanned_at);
      const formattedDate = scanDate.toLocaleDateString();
      
      // Format scan type for display
      const scanTypeMap = {
        'url': 'URL',
        'file': 'File',
        'qr_code': 'QR Code'
      };
      const displayType = scanTypeMap[scan.scan_type] || scan.scan_type;
      
      // Truncate content if too long
      let contentDisplay = scan.content;
      if (contentDisplay.length > 30) {
        contentDisplay = contentDisplay.substring(0, 30) + '...';
      }
      
      // Format threat level with appropriate badge
      let threatBadge = '';
      if (scan.threat_level) {
        const threatClass = scan.threat_level === 'malicious' ? 'badge-DANGER' : 
                           scan.threat_level === 'suspicious' ? 'badge-WARN' : 'badge-SAFE';
        const threatDisplay = scan.threat_level.charAt(0).toUpperCase() + scan.threat_level.slice(1);
        threatBadge = `<span class="table-badge ${threatClass}">${threatDisplay}</span>`;
      } else {
        threatBadge = '<span class="text-muted">N/A</span>';
      }
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${displayType}</td>
        <td title="${scan.content}">${contentDisplay}</td>
        <td>${threatBadge}</td>
      `;
      
      recentScansTable.appendChild(row);
    });
  } else {
    recentScansTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-3">No scan history available</td>
      </tr>
    `;
  }
}

// Download stats report
function downloadStatsReport() {
  toast('Preparing your download...');
  
  // In a real implementation, this would generate a PDF or CSV report
  setTimeout(() => {
    // Simulate download
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,Scan Report - Generated on ' + new Date().toLocaleDateString();
    a.download = 'scan-report-' + new Date().toISOString().split('T')[0] + '.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast('Report downloaded successfully!');
  }, 1500);
}

// Event listener for stats modal
document.addEventListener('DOMContentLoaded', function() {
  const statsModal = document.getElementById('statsModal');
  
  if (statsModal) {
    statsModal.addEventListener('show.bs.modal', function() {
      initStatsCharts();
      loadUserStats();
    });
    
    statsModal.addEventListener('hidden.bs.modal', function() {
      // Clean up charts when modal is closed
      if (statsChart1) {
        statsChart1.destroy();
        statsChart1 = null;
      }
      if (statsChart2) {
        statsChart2.destroy();
        statsChart2 = null;
      }
    });
  }
});

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
        
        // Toggle stats button based on plan mode
        toggleStatsButton(planMode);
        
        console.log('User authenticated successfully');
        return;
      } else {
        console.log('User not authenticated, redirecting to login');
        sessionStorage.removeItem('plan_mode');
        window.location.href = '../index.html';
        return;
      }
    } else {
      console.log('Auth check failed, redirecting to login');
      sessionStorage.removeItem('plan_mode');
      window.location.href = '../index.html';
      return;
    }
  } catch(e) {
    console.error('Failed to fetch user info', e);
    toast('Network error - using offline mode');
    
    // Initialize with default settings for offline use
    initChart();
    initResults();
    scanCounter.updateUI();
    
    // Try to get user data from sessionStorage as fallback
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserUI(userData);
      } catch (parseError) {
        console.error('Error parsing stored user data:', parseError);
      }
    }
  }
})();
