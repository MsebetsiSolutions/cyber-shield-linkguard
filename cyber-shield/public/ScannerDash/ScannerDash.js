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

// Camera variables
let cameraStream = null;
let cameraModal = null;
let currentFacingMode = 'environment';
let qrScanningActive = false;

const FEATURE_ACCESS = {
  0: ['feature-learning-hub', 'feature-cybersmart-kids'],
  1: ['feature-learning-hub', 'feature-learning-hub2', 'feature-cybersmart-kids', 'feature-stats', 'feature-cyber-awareness'],
  2: ['feature-learning-hub', 'feature-learning-hub2', 'feature-cybersmart-kids', 'feature-stats', 'feature-cyber-awareness', 'feature-team-workspace', 'feature-background-check', 'feature-cybersecurity-exams'],
  3: ['feature-learning-hub', 'feature-learning-hub2', 'feature-cybersmart-kids', 'feature-stats', 'feature-cyber-awareness', 'feature-background-check', 'feature-cybersecurity-exams', 'feature-enterprise']
};

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
    this.remaining = 1; 
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

// Session-based 
async function fetchWithSession(path, opts={}) {
  const headers = {};
  
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

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
    let threatLevel = 'clean';
    if (scanData.verdict_band === 'DANGER') {
      threatLevel = 'malicious';
    } else if (scanData.verdict_band === 'WARN') {
      threatLevel = 'suspicious';
    }
    
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
const cameraBtn = $('cameraBtn');

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

    // button states based on pla_mode
    controlScanButtons(userData.plan_mode);
    controlCameraButton(userData.plan_mode);
    updatePlanLabel(userData.plan_mode);
    updateFeatureAccess(userData.plan_mode);

  } else { 
    welcomeMessage.textContent = ''; 
    userNameDisplay.textContent = 'User Name';
    console.log('User not authenticated, using fallback');

    controlScanButtons(0); 
    controlCameraButton(0);
    updateFeatureAccess(0);
  }
}

// Update feature access based on plan mode
function updateFeatureAccess(planMode) {
  console.log(`Updating feature access for plan mode: ${planMode}`);
  
  const featureElements = document.querySelectorAll('[data-plan-required]');
  
  featureElements.forEach(feature => {
    feature.classList.add('hidden');
  });
  
  const allowedFeatures = FEATURE_ACCESS[planMode] || FEATURE_ACCESS[0];
  
  allowedFeatures.forEach(featureId => {
    const featureElement = document.getElementById(featureId);
    if (featureElement) {
      featureElement.classList.remove('hidden');
      featureElement.classList.remove('locked');
    }
  });
  
  console.log(`Allowed features for plan ${planMode}:`, allowedFeatures);
}

// Function to control scan button states (File and QR)
function controlScanButtons(planMode) {
  const isPaidPlan = planMode === 1 || planMode === 2 || planMode === 3;

  $('scanBtn').disabled = false; 

  if (isPaidPlan) {
    fileScanBtn.disabled = false;
    fileScanBtn.title = ''; 
  } else {
    fileScanBtn.disabled = true;
    fileScanBtn.title = 'Upgrade to a paid plan to scan files and QR codes';
  }
  console.log(`Plan Mode: ${planMode}, File/QR Scan Enabled: ${!fileScanBtn.disabled}`);
}

// Control camera button based on plan mode
function controlCameraButton(planMode) {
  const isPaidPlan = planMode === 1 || planMode === 2 || planMode === 3;

  // Camera button VISIBLE
  show(cameraBtn);

  if (isPaidPlan) {
    cameraBtn.disabled = false;
    cameraBtn.title = 'Scan QR code using camera';
  } else {
    cameraBtn.disabled = true;
    cameraBtn.title = 'Upgrade to a paid plan to use camera for QR scanning';
  }
  console.log(`Plan Mode: ${planMode}, Camera Enabled: ${!cameraBtn.disabled}`);
}

// plan badge label
function updatePlanLabel(planMode) {
  const planBadge = document.getElementById('planMode');
  if (!planBadge) return;

  const planMap = {
    0: { text: 'FREE', cls: 'free-plan' },
    1: { text: 'PRO', cls: 'pro-plan' },
    2: { text: 'TEAM', cls: 'team-plan' },
    3: { text: 'ENTERPRISE', cls: 'enterprise-plan' }
  };

  const plan = planMap[planMode] || planMap[0];
  planBadge.textContent = plan.text;

  planBadge.classList.remove('free-plan', 'pro-plan', 'team-plan', 'enterprise-plan');
  planBadge.classList.add(plan.cls);
}

// Logout functionality
async function handleLogout() {
    try {
        const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();
        
        const logoutResponse = await fetchWithSession('/api/auth/logout', {
            method: 'POST'
        });
        
        if (logoutResponse.ok) {
            console.log('logout successful');
            
            if (currentSessionId) {
                await fetch('/api/session/invalidate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({})
                });
            }
        }
    } catch (e) {
        console.log('Logout failed, proceeding with client');
    }
    
    scanCounter.reset();
    setUserUI(null);
    
    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    
    toast('Signed out successfully');
    
    setTimeout(() => {
        window.location.href = '../';
    }, 1000);
}

logoutBtn.addEventListener('click', handleLogout);

// File input and preview handling
const fileInput = $('fileInput');
const fileLabelText = $('fileLabelText');
const filePreview = $('filePreview');
const previewImage = $('previewImage');
const previewPlaceholder = $('previewPlaceholder');
const previewFileName = $('previewFileName');
const clearPreview = $('clearPreview');
const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp'];

fileInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    const file = this.files[0];
    fileLabelText.textContent = file.name;
    
    show(filePreview);
    
    if (imageTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImage.src = e.target.result;
        show(previewImage);
        hide(previewPlaceholder);
      };
      reader.readAsDataURL(file);
    } else {
      hide(previewImage);
      show(previewPlaceholder);
      previewFileName.textContent = file.name;
    }
  } else {
    fileLabelText.textContent = 'Choose file or drag here';
    hide(filePreview);
  }
});

// Clear preview
clearPreview.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  fileInput.value = '';
  fileLabelText.textContent = 'Choose file or drag here';
  hide(filePreview);
});

// Camera functionality for QR code scanning
function initCameraButton() {
  cameraModal = new bootstrap.Modal($('cameraModal'));
  const switchCameraBtn = $('switchCameraBtn');
  
  cameraBtn.addEventListener('click', function() {
    if (this.disabled) {
      toast('Upgrade to a paid plan to use camera for QR scanning');
      
      setTimeout(() => {
        window.location.href = '../Subscription/Subscription.html';
      }, 1500);
      return;
    }
    openCameraModal();
  });
  
  switchCameraBtn.addEventListener('click', function() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    startCamera();
  });
  
  $('cameraModal').addEventListener('hidden.bs.modal', function() {
    stopCamera();
    qrScanningActive = false;
  });
}

// Open camera modal and start camera
async function openCameraModal() {
  cameraModal.show();
  await startCamera();
}

// Start camera stream
async function startCamera() {
  const video = $('cameraVideo');
  const cameraError = $('cameraError');
  
  hide(cameraError);
  
  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = cameraStream;
    
    video.onloadedmetadata = () => {
      video.play();
      startQRScanning();
    };
    
  } catch (error) {
    console.error('Camera error:', error);
    show(cameraError);
    $('cameraErrorText').textContent = getCameraErrorMessage(error);
  }
}

// Stop camera stream
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  qrScanningActive = false;
}

// Get user-friendly camera error message
function getCameraErrorMessage(error) {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Camera access denied. Please allow camera permissions in your browser settings.';
    case 'NotFoundError':
      return 'No camera found on this device.';
    case 'NotSupportedError':
      return 'Camera not supported in this browser.';
    case 'NotReadableError':
      return 'Camera is already in use by another application.';
    default:
      return 'Unable to access camera. Please check your permissions.';
  }
}

// Start QR code scanning from camera
function startQRScanning() {
  const video = $('cameraVideo');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  qrScanningActive = true;
  
  function scanQRCode() {
    if (!qrScanningActive || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      handleQRCodeDetected(code.data);
      return;
    }
    
    requestAnimationFrame(scanQRCode);
  }
  
  scanQRCode();
}

// detected QR code
function handleQRCodeDetected(qrData) {
  console.log('QR Code detected:', qrData);
  stopCamera();
  cameraModal.hide();
  
  processQRCodeResult(qrData);
}

// Process QR code result
async function processQRCodeResult(qrData) {
  if (!canScan('qr')) return;
  
  toast('QR code detected! Processing...');
  
  try {
    if (isValidUrl(qrData)) {
      urlInput.value = qrData;
      await runScanUrl(qrData);
    } else {
      hide($('emptyState'));
      hide($('resultUrl'));
      hide($('resultFile'));
      show($('resultQr'));
      
      $('qrText').textContent = qrData;
      hide($('qrUrlBlock'));
      updateStats(0, 0, 1, 0);
      
      const scanData = {
        scan_type: 'qr_code',
        content: qrData,
        result: JSON.stringify({ decoded: qrData, type: 'text' }),
        verdict_band: 'SAFE'
      };
      
      saveScanResult(scanData);
      
      let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
      if (userPlanMode === 0) {
        scanCounter.decrement();
      }
    }
  } catch (error) {
    console.error('Error processing QR code:', error);
    toast('Error processing QR code');
  }
}

// Check if string is a valid URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function checkAuthenticationWithSession() {
    try {
        const sessionId = window.CyberShieldSession?.getCurrentSessionId();
        
        console.log('Checking authentication with session:', sessionId);
        
        const r = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        console.log('Auth check response status:', r.status);
        
        if(r.ok){ 
            const userData = await r.json(); 
            console.log('User data received:', userData);
            
            if (userData.authenticated) {
                console.log('User is authenticated via Flask session');
                
                if (sessionId && userData.user_id) {
                    try {
                        await fetch('/api/session/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                session: sessionId,
                                user_id: userData.user_id
                            })
                        });
                        console.log('Session registered with server');
                    } catch (e) {
                        console.log('Failed to register session with server, but continuing:', e);
                    }
                }
                
                return userData;
            } else {
                console.log('User not authenticated via Flask session, redirecting to index');
                window.location.href = '../';
                return false;
            }
        } else {
            console.log('Auth check failed, redirecting to index');
            window.location.href = '../';
            return false;
        }
    } catch(e) {
        console.error('Authentication check failed:', e);
        window.location.href = '../';
        return false;
    }
}

// results display
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
  
  if (resultsChart) {
    updateChart(0, 0, 0, 0);
  }
}

async function validateServerSession(sessionId) {
    try {
        const response = await fetch('/api/session/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session: sessionId })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.valid;
        }
        return false;
    } catch (error) {
        console.error('Session validation error:', error);
        return false;
    }
}

// Update stats display
function updateStats(malicious, suspicious, harmless, undetected) {
  $('statMalicious').textContent = malicious;
  $('statSuspicious').textContent = suspicious;
  $('statHarmless').textContent = harmless;
  $('statUndetected').textContent = undetected;
  show($('resultsOverview'));
  
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

fileScanBtn.addEventListener('click', () => {
  const f = fileInput.files && fileInput.files[0]; 
  if(!f) return toast('Choose a file first'); 
  runScanFileOrQR(f); 
});

async function runScanFileOrQR(file){
  if (!canScan('file')) return;
  
  setBusy(fileScanBtn, true, 'Analyzing…');
  
  try{
    const fd = new FormData(); 
    fd.append('file', file);
    
    const isImage = file.type.startsWith('image/');
    let endpoint = '/api/scan_file';
    
    if (isImage) {
      try {
        const qrResponse = await fetchWithSession('/api/scan_qr', { 
          method: 'POST',
          body: fd 
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          
          if (qrData.decoded) {
            return handleQRResult(qrData, file);
          }
        }
      } catch (qrError) {
        console.log('QR scan failed, falling back to file scan:', qrError);
      }
    }
    
    const r = await fetchWithSession(endpoint, { 
      method: 'POST',
      body: fd 
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      if (j.error && j.error.includes('File type not allowed')) {
          toast('File type not supported. Please use: TXT, PDF, PNG, JPG, GIF, DOC, DOCX, EXE, ZIP');
      } else {
          toast(j.error || 'File scan failed');
      }
      return;
    }
    
    handleFileResult(j, file);
    
  } catch(e) { 
    console.error('File/QR scan error:', e);
    toast('Scan failed: ' + e.message); 
  } finally { 
    setBusy(fileScanBtn, false); 
  }
}

function handleQRResult(j, file) {
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
}

function handleFileResult(j, file) {
  let userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
  if (userPlanMode === 0) {
    scanCounter.decrement();
  }
  
  hide($('emptyState'));
  hide($('resultUrl'));
  hide($('resultQr'));
  show($('resultFile'));
  
  $('fileName').textContent = file.name; 
  $('fileSha').textContent = j.file.sha256 ? ' · ' + j.file.sha256 : '';
  
  $('reasonsFile').innerHTML = '';
  
  (j.verdict.reasons || []).forEach(x => { 
    const li = document.createElement('li'); 
    li.textContent = x; 
    $('reasonsFile').appendChild(li);
  });
  
  setBadge($('badgeFile'), j.verdict.band); 
  $('scoreFile').textContent = j.verdict.score;
  
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
}

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
  
  planBadge.classList.remove('free-plan', 'pro-plan', 'team-plan', 'enterprise-plan');
  
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
      sessionStorage.setItem('plan_mode', data.plan_mode);
      
      scanCounter.updateUI();
      
      return data.plan_mode;
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
  }
  return 0; 
}

// stats charts
function initStatsCharts() {
  if (statsChart1) {
    statsChart1.destroy();
  }
  if (statsChart2) {
    statsChart2.destroy();
  }
  
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
  
  document.getElementById('totalScans').textContent = statsData.totalScans || 0;
  
  const maliciousScans = statsData.threatLevels?.malicious || 0;
  const safeScans = (statsData.threatLevels?.clean || 0) + (statsData.threatLevels?.suspicious || 0);
  
  document.getElementById('maliciousScans').textContent = maliciousScans;
  document.getElementById('safeScans').textContent = safeScans;
  
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
  
  // recent scans table
  const recentScansTable = document.getElementById('recentScansTable');
  recentScansTable.innerHTML = '';
  
  if (statsData.recentScans && statsData.recentScans.length > 0) {
    statsData.recentScans.forEach(scan => {
      const row = document.createElement('tr');
      
      const scanDate = new Date(scan.scanned_at);
      const formattedDate = scanDate.toLocaleDateString();
      
      const scanTypeMap = {
        'url': 'URL',
        'file': 'File',
        'qr_code': 'QR Code'
      };
      const displayType = scanTypeMap[scan.scan_type] || scan.scan_type;
      
      let contentDisplay = scan.content;
      if (contentDisplay.length > 30) {
        contentDisplay = contentDisplay.substring(0, 30) + '...';
      }
      
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
  
  setTimeout(() => {
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

// dashboard and check authentication
(async function boot(){
    console.log('Dashboard initializing with enhanced session management...');
    
    try {
        const userData = await checkAuthenticationWithSession();
        
        if (userData) {
            initChart();
            initCameraButton();
            
            const planMode = await checkUserPlan();
            
            setUserUI({...userData, plan_mode: planMode}); 
            scanCounter.updateUI();
            initResults();
            
            console.log('User authenticated successfully with valid session');
            return;
        }
    } catch(e) {
        console.error('Failed to initialize dashboard', e);
        toast('Authentication error - please login again');
        
        sessionStorage.removeItem('cyberShieldSession');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('plan_mode');
        window.location.href = '../';
    }
})();

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('Page became visible, validating session...');
        
        const sessionId = window.CyberShieldSession?.getCurrentSessionId();
        if (sessionId) {
            validateServerSession(sessionId).then(isValid => {
                if (!isValid) {
                    console.log('Session invalid on page visibility, redirecting...');
                    sessionStorage.removeItem('cyberShieldSession');
                    window.location.href = '../';
                }
            });
        }
    }
});

window.addEventListener('beforeunload', function() {
  // Stop camera when page is about to unload
  if (cameraStream) {
    stopCamera();
  }
});