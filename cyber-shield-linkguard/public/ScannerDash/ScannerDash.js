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

const token = {
  get access(){ return localStorage.getItem('access') || ''; },
  set access(v){ v ? localStorage.setItem('access', v) : localStorage.removeItem('access'); },
  get refresh(){ return localStorage.getItem('refresh') || ''; },
  set refresh(v){ v ? localStorage.setItem('refresh', v) : localStorage.removeItem('refresh'); },
  clear(){ this.access=''; this.refresh=''; }
};

// Scan counter management
const scanCounter = {
  get remaining(){ return parseInt(localStorage.getItem('remainingScans') || '5'); },
  set remaining(v){ localStorage.setItem('remainingScans', v.toString()); },
  reset(){ this.remaining = 5; },
  decrement(){ 
    if(this.remaining > 0) {
      this.remaining = this.remaining - 1;
      this.updateUI();
      this.checkSubscriptionButton();
      
      // Show subscription modal if scans reach zero
      if (this.remaining === 0) {
        toast('You have used all your 5 free scans. Please subscribe to get access to more scans.');
        setTimeout(() => {
          $('subscribeBtn').click();
        }, 5000);
      }
      
      return true;
    }
    return false;
  },
  updateUI(){
    $('remainingScans').textContent = this.remaining;
    
    // Change color based on remaining scans
    const scanCounterEl = $('scanCounter');
    scanCounterEl.classList.remove('text-danger', 'text-warning', 'text-success');
    
    if(this.remaining === 0) {
      scanCounterEl.classList.add('text-danger');
    } else if(this.remaining <= 2) {
      scanCounterEl.classList.add('text-warning');
    } else {
      scanCounterEl.classList.add('text-success');
    }
  },
  checkSubscriptionButton(){
    if(this.remaining === 0) {
      show($('subscribeBtn'));
    } else {
      hide($('subscribeBtn'));
    }
  }
};

// Subscription plans data
const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free Tier',
    subtitle: 'Hobbyist',
    price: 'R0 / month',
    idealFor: 'Students, enthusiasts, and individuals doing occasional checks.',
    features: [
      '5 scans per month',
      'Basic Threat Report',
      'URL scanning only',
      'Community support'
    ],
    color: 'plan-free'
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    subtitle: 'Professional',
    price: 'R75 / month',
    idealFor: 'Freelancers, IT administrators, and security analysts.',
    features: [
      'Unlimited scans',
      'Detailed Threat Reports (Geolocation, historical data)',
      'Browser Extension with quick-scan',
      'File and QR code scanning',
      'Priority email support'
    ],
    color: 'plan-pro'
  },
  {
    id: 'team',
    name: 'Team Tier',
    subtitle: 'Small Business',
    price: 'R200 / month',
    idealFor: 'Small teams, start-ups, and IT departments.',
    features: [
      'Everything in Pro',
      'Shared Team Workspace',
      'Monitor 50 assets',
      'Enhanced API Access (500 requests/month)',
      'Customizable Alert Rules',
      'SMS Alerts (25 credits)',
      'Priority chat & email support'
    ],
    color: 'plan-team'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Tier',
    subtitle: 'Organization',
    price: 'Contact Sales',
    idealFor: 'Larger organizations, MSSPs, and enterprises.',
    features: [
      'Everything in Team',
      'Unlimited users & workspaces',
      'Unlimited Asset Monitoring & Alerts',
      'Advanced API (2000 requests)',
      'SIEM Integration',
      'Threat Intelligence Feed',
      'Custom Branded Reports',
      'Dedicated Customer Success Manager',
      '24/7 Phone Support'
    ],
    color: 'plan-enterprise'
  }
];

// Render subscription plans
function renderSubscriptionPlans() {
  const plansContainer = $('#plansContainer');
  plansContainer.innerHTML = '';
  
  subscriptionPlans.forEach(plan => {
    const planCol = document.createElement('div');
    planCol.className = 'col-12 col-md-6 col-lg-3 mb-4';
    planCol.innerHTML = `
      <div class="plan-card ${plan.color}" data-plan-id="${plan.id}">
        <div class="plan-header">
          <h4>${plan.name}</h4>
          <div class="plan-subtitle">${plan.subtitle}</div>
          <div class="plan-price">${plan.price}</div>
          <div class="plan-description">${plan.idealFor}</div>
        </div>
        <ul class="plan-features">
          ${plan.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        <div class="plan-details">
          <ul class="plan-features">
            ${plan.features.slice(3).map(feature => `<li>${feature}</li>`).join('')}
          </ul>
          <button class="cs-btn btn-login w-100 mt-3">Select Plan</button>
        </div>
      </div>
    `;
    plansContainer.appendChild(planCol);
  });
  
  // Add click event to plan cards
  document.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', function() {
      // Toggle details expansion
      const details = this.querySelector('.plan-details');
      const isExpanded = details.classList.contains('expanded');
      
      // Collapse all other plans
      document.querySelectorAll('.plan-details').forEach(d => {
        d.classList.remove('expanded');
      });
      document.querySelectorAll('.plan-card').forEach(c => {
        c.classList.remove('plan-selected');
      });
      
      // Expand this plan if it wasn't already expanded
      if (!isExpanded) {
        details.classList.add('expanded');
        this.classList.add('plan-selected');
      }
    });
  });
}

async function fetchWithAuth(path, opts={}, autoRetry=true){
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
  if(token.access){ headers.Authorization = 'Bearer ' + token.access; }
  const r = await fetch(path, Object.assign({}, opts, { headers }));
  if(r.status !== 401 || !autoRetry || !token.refresh) return r;
  
  // Try one refresh
  const rf = await fetch('/api/auth/refresh', {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({ refresh_token: token.refresh })
  });
  
  if(!rf.ok){ token.clear(); return r; }
  const j = await rf.json();
  if(!j.access_token){ token.clear(); return r; }
  
  token.access = j.access_token;
  return fetch(path, Object.assign({}, opts, { 
    headers: Object.assign(headers, { Authorization: 'Bearer ' + token.access }) 
  }));
}

// Set user UI
const whoRow = $('whoRow');
const logoutBtn = $('logout');

function setUserUI(email){ 
  if(email){ 
    whoRow.textContent = 'Signed in: ' + email; 
    show(logoutBtn);
  } else { 
    whoRow.textContent = 'Guest mode'; 
    hide(logoutBtn);
  }
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
  token.clear(); 
  scanCounter.reset();
  setUserUI(''); 
  toast('Signed out');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
});

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
  // Hide all result sections
  hide($('resultUrl'));
  hide($('resultFile'));
  hide($('resultQr'));
  hide($('resultsOverview'));
  show($('emptyState'));
  
  // Reset stats
  $('statMalicious').textContent = '0';
  $('statSuspicious').textContent = '0';
  $('statHarmless').textContent = '0';
  $('statUndetected').textContent = '0';
}

// Update stats display
function updateStats(malicious, suspicious, harmless, undetected) {
  $('statMalicious').textContent = malicious;
  $('statSuspicious').textContent = suspicious;
  $('statHarmless').textContent = harmless;
  $('statUndetected').textContent = undetected;
  show($('resultsOverview'));
}

function setBadge(el, band){ 
  el.textContent = band; 
  el.className = 'badge ' + band; 
}

// Check if user can scan
function canScan() {
  if (scanCounter.remaining > 0) {
    return true;
  } else {
    toast('You have reached your scan limit. Please subscribe to continue scanning.');
    const subscriptionModal = new bootstrap.Modal($('subscriptionModal'));
    subscriptionModal.show();
    return false;
  }
}

// URL Scan functionality
const urlInput = $('urlInput');
const scanBtn = $('scanBtn');

async function runScanUrl(url){
  // Check scan limit
  if (!canScan()) return;
  
  setBusy(scanBtn, true, 'Scanning…');
  
  try{
    const r = await fetchWithAuth('/api/scan', { 
      method: 'POST', 
      body: JSON.stringify({ url })
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      toast(j.error || 'Scan failed');
      return;
    }
    
    // Decrement scan counter
    scanCounter.decrement();
    
    // Hide empty state and show results
    hide($('emptyState'));
    hide($('resultFile'));
    hide($('resultQr'));
    show($('resultUrl'));
    
    // Update results
    finalUrl.textContent = j.signals.final_url; 
    scoreUrl.textContent = j.verdict.score;
    reasonsUrl.innerHTML = '';
    
    j.verdict.reasons.forEach(x => { 
      const li = document.createElement('li'); 
      li.textContent = x; 
      reasonsUrl.appendChild(li);
    });
    
    setBadge(badgeUrl, j.verdict.band);
    
    // Update stats based on score
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
    
    // Auto-close mobile dropdown after scan
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
const fileBtn = $('fileBtn');

async function runScanFile(file){
  // Check scan limit
  if (!canScan()) return;
  
  setBusy(fileBtn, true, 'Uploading…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const headers = token.access ? { Authorization: 'Bearer ' + token.access } : {};
    const r = await fetch('/api/scan_file', { 
      method: 'POST', 
      headers, 
      body: fd 
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      toast(j.error || 'File scan failed');
      return;
    }
    
    // Decrement scan counter
    scanCounter.decrement();
    
    // Hide empty state and show results
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultQr'));
    show($('resultFile'));
    
    // Update results
    fileName.textContent = j.file.filename || '(file)'; 
    fileSha.textContent = j.file.sha256 ? ' · ' + j.file.sha256 : '';
    
    // Format VirusTotal summary
    let vtSummary = '';
    if (j.virustotal.enabled && !j.virustotal.error) {
      vtSummary = `Malicious: ${j.virustotal.malicious || 0}, Suspicious: ${j.virustotal.suspicious || 0}, ` +
                 `Harmless: ${j.virustotal.harmless || 0}, Undetected: ${j.virustotal.undetected || 0}`;
    } else {
      vtSummary = 'VirusTotal scan not available or failed';
    }
    vtSummaryFile.textContent = vtSummary;
    
    reasonsFile.innerHTML = '';
    
    (j.verdict.reasons || []).forEach(x => { 
      const li = document.createElement('li'); 
      li.textContent = x; 
      reasonsFile.appendChild(li);
    });
    
    setBadge(badgeFile, j.verdict.band); 
    scoreFile.textContent = j.verdict.score;
    
    // Update stats based on score
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
    
    // Auto-close mobile dropdown after scan
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy(fileBtn, false); 
  }
}

fileBtn.addEventListener('click', () => {
  const f = fileInput.files && fileInput.files[0]; 
  if(!f) return toast('Choose a file first'); 
  runScanFile(f); 
});

// QR Scan functionality
const qrInput = $('qrInput');
const qrBtn = $('qrBtn');

async function runScanQr(file){
  // Check scan limit
  if (!canScan()) return;
  
  setBusy(qrBtn, true, 'Analyzing…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const headers = token.access ? { Authorization: 'Bearer ' + token.access } : {};
    const r = await fetch('/api/scan_qr', { 
      method: 'POST', 
      headers, 
      body: fd 
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      toast(j.error || 'QR scan failed');
      return;
    }
    
    // Decrement scan counter
    scanCounter.decrement();
    
    // Hide empty state and show results
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultFile'));
    show($('resultQr'));
    
    // Update results
    qrText.textContent = j.decoded || '(no data)';
    
    // If the QR contains a URL and we have full analysis results
    if(j.type === 'url' && j.verdict) {
      show($('qrUrlBlock'));
      finalUrlQr.textContent = j.signals.final_url; 
      scoreQr.textContent = j.verdict.score;
      reasonsQr.innerHTML = '';
      
      j.verdict.reasons.forEach(x => { 
        const li = document.createElement('li'); 
        li.textContent = x; 
        reasonsQr.appendChild(li);
      });
      
      setBadge(badgeQr, j.verdict.band);
      
      // Update stats based on score
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
      updateStats(0, 0, 1, 0);
    }
    
    // Auto-close mobile dropdown after scan
    if (window.innerWidth < 992) {
      const mobileControls = document.getElementById('mobileControls');
      const bsCollapse = new bootstrap.Collapse(mobileControls, {toggle: false});
      bsCollapse.hide();
    }
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy(qrBtn, false); 
  }
}

qrBtn.addEventListener('click', () => {
  const f = qrInput.files && qrInput.files[0]; 
  if(!f) return toast('Pick an image of a QR code'); 
  runScanQr(f); 
});

// Subscription button functionality
$('subscribeBtn').addEventListener('click', () => {
  const subscriptionModal = new bootstrap.Modal($('subscriptionModal'));
  subscriptionModal.show();
});

// Initialize dashboard
(async function boot(){
  const accessToken = localStorage.getItem('access');
  
  if(accessToken){
    try {
      const r = await fetchWithAuth('/api/me');
      if(r.ok){ 
        const me = await r.json(); 
        setUserUI(me.email); 
        
        // Check if user has a paid plan
        const userPlan = localStorage.getItem('userPlan') || 'free';
        if (userPlan !== 'free') {
          scanCounter.remaining = 999; // Unlimited scans for paid users
        }
        
        return; 
      }
    } catch(e) {
      console.error('Failed to fetch user info', e);
    }
    token.clear();
  }
  
  setUserUI('');
  scanCounter.updateUI();
  scanCounter.checkSubscriptionButton();
  initResults();
  renderSubscriptionPlans();
})();

