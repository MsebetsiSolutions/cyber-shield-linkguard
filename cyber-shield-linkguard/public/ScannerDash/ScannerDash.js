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
  get remaining(){ 
    const today = new Date().toDateString();
    const lastScanDate = localStorage.getItem('lastScanDate');
    
    if (lastScanDate !== today) {
      localStorage.setItem('lastScanDate', today);
      localStorage.setItem('remainingScans', '5');
      return 5;
    }
    
    return parseInt(localStorage.getItem('remainingScans') || '5'); 
  },
  set remaining(v){ 
    localStorage.setItem('remainingScans', v.toString()); 
    localStorage.setItem('lastScanDate', new Date().toDateString());
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
};

// Improved fetchWithAuth function
async function fetchWithAuth(path, opts={}, autoRetry=true) {
  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers
  };
  
  if (token.access) {
    headers.Authorization = 'Bearer ' + token.access;
  }
  
  try {
    let response = await fetch(path, {
      ...opts,
      headers
    });
    
    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && autoRetry && token.refresh) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ refresh_token: token.refresh })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.access_token) {
            token.access = refreshData.access_token;
            
            // Retry the original request with new token
            headers.Authorization = 'Bearer ' + token.access;
            response = await fetch(path, {
              ...opts,
              headers
            });
          }
        } else {
          // Refresh failed, clear tokens
          token.clear();
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        token.clear();
      }
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Set user UI
const whoRow = $('whoRow');
const welcomeMessage = $('welcomeMessage');
const logoutBtn = $('logout');

function setUserUI(userData){ 
  if(userData && userData.authenticated){ 
    welcomeMessage.textContent = `Welcome, ${userData.full_name || userData.email}!`;
    whoRow.textContent = `Signed in: ${userData.email}`; 
    show(logoutBtn);
  } else { 
    welcomeMessage.textContent = ''; 
    whoRow.textContent = ''; 
    show(logoutBtn);
  }
}

// Logout functionality
logoutBtn.addEventListener('click', async () => {
  try {
    await fetchWithAuth('/api/auth/logout', {
      method: 'POST'
    });
  } catch (e) {
    console.log('Logout API call failed, proceeding with client-side cleanup');
  }
  
  token.clear(); 
  scanCounter.reset();
  setUserUI(null); 
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
  hide($('resultUrl'));
  hide($('resultFile'));
  hide($('resultQr'));
  hide($('resultsOverview'));
  show($('emptyState'));
  
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
    
    scanCounter.decrement();
    
    hide($('emptyState'));
    hide($('resultFile'));
    hide($('resultQr'));
    show($('resultUrl'));
    
    finalUrl.textContent = j.signals.final_url; 
    scoreUrl.textContent = j.verdict.score;
    reasonsUrl.innerHTML = '';
    
    j.verdict.reasons.forEach(x => { 
      const li = document.createElement('li'); 
      li.textContent = x; 
      reasonsUrl.appendChild(li);
    });
    
    setBadge(badgeUrl, j.verdict.band);
    
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
  if (!canScan()) return;
  
  setBusy(fileBtn, true, 'Uploading…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const headers = {};
    if (token.access) {
      headers.Authorization = 'Bearer ' + token.access;
    }
    
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
    
    scanCounter.decrement();
    
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultQr'));
    show($('resultFile'));
    
    fileName.textContent = j.file.filename || '(file)'; 
    fileSha.textContent = j.file.sha256 ? ' · ' + j.file.sha256 : '';
    
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
  if (!canScan()) return;
  
  setBusy(qrBtn, true, 'Analyzing…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const headers = {};
    if (token.access) {
      headers.Authorization = 'Bearer ' + token.access;
    }
    
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
    
    scanCounter.decrement();
    
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultFile'));
    show($('resultQr'));
    
    qrText.textContent = j.decoded || '(no data)';
    
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
  window.location.href = '../Subscription/Subscription.html';
});

// Initialize dashboard
(async function boot(){
  const accessToken = localStorage.getItem('access');

  if(accessToken){
    try {
      const r = await fetchWithAuth('/api/auth/me');
      if(r.ok){ 
        const userData = await r.json(); 
        setUserUI(userData); 
        scanCounter.updateUI();
        initResults();
        return; 
      } else {
        
        token.clear();
      }
    } catch(e) {
      console.error('Failed to fetch user info', e);
      token.clear();
    }
  }

  setUserUI(null);
  scanCounter.updateUI();
  initResults();
})();
