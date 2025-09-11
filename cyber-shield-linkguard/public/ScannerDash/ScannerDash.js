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

// Set user UI
const welcomeMessage = $('welcomeMessage');
const userNameDisplay = $('userNameDisplay');
const logoutBtn = $('logout');

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
  } else { 
    welcomeMessage.textContent = ''; 
    userNameDisplay.textContent = 'User Name'; // Fallback text
    console.log('User not authenticated, using fallback');
  }
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
    const r = await fetchWithSession('/api/scan', { 
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
    
    scanCounter.decrement();
    
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
    
    scanCounter.decrement();
    
    hide($('emptyState'));
    hide($('resultUrl'));
    hide($('resultFile'));
    show($('resultQr'));
    
    $('qrText').textContent = j.decoded || '(no data)';
    
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
        setUserUI(userData); 
        scanCounter.updateUI();
        initResults();
        console.log('User authenticated successfully');
        return;
      } else {
        console.log('User not authenticated, redirecting to login');
        // Redirect to login page if not authenticated
        window.location.href = '../index.html';
        return;
      }
    } else {
      console.log('Auth check failed, redirecting to login');
      // Redirect to login page if request failed
      window.location.href = '../index.html';
      return;
    }
  } catch(e) {
    console.error('Failed to fetch user info', e);
    // Redirect to login page on error
    window.location.href = '../index.html';
    return;
  }
})();
