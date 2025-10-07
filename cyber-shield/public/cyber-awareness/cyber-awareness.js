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

// Session-based API calls
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
    userNameDisplay.textContent = 'User Name';
    console.log('User not authenticated, using fallback');
  }
}

// Check authentication with session
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
                window.location.href = '../index.html';
                return false;
            }
        } else {
            console.log('Auth check failed, redirecting to index');
            window.location.href = '../index.html';
            return false;
        }
    } catch(e) {
        console.error('Authentication check failed:', e);
        window.location.href = '../index.html';
        return false;
    }
}

// Validate server session
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
    
    setUserUI(null);
    
    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    
    toast('Signed out successfully');
    
    // Redirect to login page without session ID
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

// Update plan badge
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
      
      return data.plan_mode;
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
  }
  return 0; 
}

// User dropdown functionality
function initUserDropdown() {
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

  // Prevent dropdown from closing 
  userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Phishing simulation functionality
function initPhishingSimulation() {
  const generateEmailForm = $('generateEmailForm');
  const platformSelect = $('platformSelect');

  // Platform select handler
  if (platformSelect) {
    // Restore saved choice
    try {
      const saved = localStorage.getItem('platformSelect');
      if (saved) platformSelect.value = saved;
    } catch (e) { }

    platformSelect.addEventListener('change', function() {
      const val = this.value || '';
      try { localStorage.setItem('platformSelect', val); } catch (e) { }
    });
  }

  // Generate email form
  if (generateEmailForm) {
    generateEmailForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const fd = new FormData(generateEmailForm);
      const first = fd.get('firstName')?.trim();
      const last = fd.get('lastName')?.trim();
      const email = fd.get('email')?.trim();
      const company = fd.get('company')?.trim();
      const jobTitle = fd.get('jobTitle')?.trim();
      const platform = platformSelect ? platformSelect.value : '';

      if (!first || !last || !email) { 
        toast('Please fill first name, last name and email'); 
        return; 
      }

      setBusy(generateEmailForm.querySelector('button[type="submit"]'), true, 'Generating...');

      try {
        // Simulate API call to generate phishing email
        const response = await fetchWithSession('/api/phishing/generate', {
          method: 'POST',
          body: JSON.stringify({
            firstName: first,
            lastName: last,
            email: email,
            company: company,
            jobTitle: jobTitle,
            platform: platform
          })
        });

        if (response.ok) {
          const result = await response.json();
          toast('Phishing email generated successfully! Check your training dashboard.');
          console.log('Generated phishing email:', result);
          
          // Reset form
          generateEmailForm.reset();
        } else {
          const errorData = await response.json();
          toast('Failed to generate email: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error generating phishing email:', error);
        toast('Network error when generating email');
      } finally {
        setBusy(generateEmailForm.querySelector('button[type="submit"]'), false);
      }
    });
  }
}

// Detection Phishing Replica functionality
function initDetectionPhishingReplica() {
  // Update time display
  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeElement = document.getElementById('time');
    if (timeElement) {
      timeElement.textContent = timeString;
    }
  }

  // Email folder functionality
  function initEmailFolders() {
    const folderItems = document.querySelectorAll('.folder-item');
    const emailFolders = document.querySelectorAll('.email-folder');
    
    folderItems.forEach(item => {
      item.addEventListener('click', function() {
        const folderType = this.getAttribute('data-folder');
        
        // Update active state
        folderItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Show selected folder
        emailFolders.forEach(folder => {
          folder.classList.add('hidden');
        });
        
        const selectedFolder = document.getElementById(`${folderType}-folder`);
        if (selectedFolder) {
          selectedFolder.classList.remove('hidden');
        }
        
        // Clear email view when switching folders
        const emailViews = document.querySelectorAll('.email-view-content');
        emailViews.forEach(view => {
          view.style.display = 'none';
        });
        
        // Clear email selection
        const emailItems = document.querySelectorAll('.email-item');
        emailItems.forEach(item => {
          item.classList.remove('active');
        });
      });
    });
  }

  // Email selection functionality
  function initEmailSelection() {
    const emailItems = document.querySelectorAll('.email-item');
    const emailViews = document.querySelectorAll('.email-view-content');
    
    emailItems.forEach(item => {
      item.addEventListener('click', function() {
        const emailType = this.getAttribute('data-email');
        
        // Hide all email views
        emailViews.forEach(view => {
          view.style.display = 'none';
        });
        
        // Show selected email view
        const selectedView = document.getElementById(`${emailType}Email`);
        if (selectedView) {
          selectedView.style.display = 'block';
        }
        
        // Update active state
        emailItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
      });
    });
    
    // Select first email by default in inbox
    const firstEmail = document.querySelector('#inbox-folder .email-item');
    if (firstEmail) {
      firstEmail.click();
    }
  }

  // Refresh emails functionality
  function initRefreshEmails() {
    const refreshButton = document.getElementById('refreshEmails');
    if (refreshButton) {
      refreshButton.addEventListener('click', function() {
        setBusy(this, true);
        setTimeout(() => {
          setBusy(this, false);
          toast('Emails refreshed');
        }, 1000);
      });
    }
  }

  // Phishing link interactions
  function initPhishingInteractions() {
    const phishingLink = document.getElementById('phishingLink');
    const reportBtn = document.getElementById('reportBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const successOverlay = document.getElementById('successOverlay');
    const failureOverlay = document.getElementById('failureOverlay');

    // Show fake URL on hover
    if (phishingLink) {
      phishingLink.addEventListener('mouseover', function() {
        this.textContent = "http://secure-login.xyz/verify-account";
        this.style.color = "#ff5b5b";
      });

      phishingLink.addEventListener('mouseout', function() {
        this.innerHTML = '<i class="fas fa-lock"></i> Verify Your Account Now';
        this.style.color = "#00b3ff";
      });

      // Handle phishing link click
      phishingLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (failureOverlay) {
          failureOverlay.classList.add('active');
        }
      });
    }

    // Handle report button
    if (reportBtn) {
      reportBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (successOverlay) {
          successOverlay.classList.add('active');
        }
        toast('Training step completed! Phishing attempt reported successfully.');
      });
    }

    // Handle verify button
    if (verifyBtn) {
      verifyBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (successOverlay) {
          successOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious link identified correctly.');
      });
    }
  }

  // QR code interactions
  function initQrInteractions() {
    const reportQrBtn = document.getElementById('reportQrBtn');
    const scanQrBtn = document.getElementById('scanQrBtn');
    const qrSuccessOverlay = document.getElementById('qrSuccessOverlay');

    if (reportQrBtn) {
      reportQrBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (qrSuccessOverlay) {
          qrSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious QR code reported successfully.');
      });
    }

    if (scanQrBtn) {
      scanQrBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (qrSuccessOverlay) {
          qrSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! QR code security check completed.');
      });
    }
  }

  // Attachment interactions
  function initAttachmentInteractions() {
    const reportAttachmentBtn = document.getElementById('reportAttachmentBtn');
    const checkAttachmentBtn = document.getElementById('checkAttachmentBtn');
    const downloadAttachmentBtn = document.getElementById('downloadAttachment');
    const attachmentSuccessOverlay = document.getElementById('attachmentSuccessOverlay');

    if (reportAttachmentBtn) {
      reportAttachmentBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (attachmentSuccessOverlay) {
          attachmentSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious attachment reported successfully.');
      });
    }

    if (checkAttachmentBtn) {
      checkAttachmentBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (attachmentSuccessOverlay) {
          attachmentSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Attachment security analysis completed.');
      });
    }

    if (downloadAttachmentBtn) {
      downloadAttachmentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toast('Warning: This attachment appears suspicious. Always verify before downloading.');
      });
    }
  }

  // Image phishing interactions
  function initImageInteractions() {
    const reportImageBtn = document.getElementById('reportImageBtn');
    const checkImageBtn = document.getElementById('checkImageBtn');
    const suspiciousImage = document.getElementById('suspiciousImage');
    const imageSuccessOverlay = document.getElementById('imageSuccessOverlay');

    if (reportImageBtn) {
      reportImageBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (imageSuccessOverlay) {
          imageSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious image reported successfully.');
      });
    }

    if (checkImageBtn) {
      checkImageBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (imageSuccessOverlay) {
          imageSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Image security analysis completed.');
      });
    }

    if (suspiciousImage) {
      suspiciousImage.addEventListener('click', function() {
        toast('Warning: This image link appears suspicious. Always verify before clicking.');
      });
    }
  }

  // Training progress functionality
  function updateTrainingProgress() {
    const steps = document.querySelectorAll('.step');
    let currentActiveIndex = -1;
    
    // Find current active step
    steps.forEach((step, index) => {
      if (step.classList.contains('active')) {
        currentActiveIndex = index;
      }
    });
    
    // Move to next step if available
    if (currentActiveIndex >= 0 && currentActiveIndex < steps.length - 1) {
      steps[currentActiveIndex].classList.remove('active');
      steps[currentActiveIndex].classList.add('completed');
      steps[currentActiveIndex].innerHTML = '<i class="bi bi-check-circle-fill"></i><span>' + steps[currentActiveIndex].textContent.trim() + '</span>';
      
      steps[currentActiveIndex + 1].classList.add('active');
    }
  }

  // Close overlay functionality
  function initOverlayClose() {
    const closeButtons = document.querySelectorAll('.close-btn');
    const overlays = document.querySelectorAll('.result-overlay');

    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        overlays.forEach(overlay => {
          overlay.classList.remove('active');
        });
      });
    });

    // Close overlay when clicking outside
    overlays.forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('active');
        }
      });
    });
  }

  // Initialize all replica functionality
  updateTime();
  setInterval(updateTime, 60000);
  initEmailFolders();
  initEmailSelection();
  initRefreshEmails();
  initPhishingInteractions();
  initQrInteractions();
  initAttachmentInteractions();
  initImageInteractions();
  initOverlayClose();
}

// Initialize the application
(async function boot(){
    console.log('Cybersecurity Awareness initializing with session management...');
    
    try {
        const userData = await checkAuthenticationWithSession();
        
        if (userData) {
            initUserDropdown();
            
            const planMode = await checkUserPlan();
            
            setUserUI({...userData, plan_mode: planMode}); 
            initPhishingSimulation();
            initDetectionPhishingReplica();
            
            // Set up logout handler
            logoutBtn.addEventListener('click', handleLogout);
            
            console.log('User authenticated successfully with valid session');
            return;
        }
    } catch(e) {
        console.error('Failed to initialize cybersecurity awareness', e);
        toast('Authentication error - please login again');
        
        sessionStorage.removeItem('cyberShieldSession');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('plan_mode');
        window.location.href = '../index.html';
    }
})();

// Session validation on page visibility
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('Page became visible, validating session...');
        
        const sessionId = window.CyberShieldSession?.getCurrentSessionId();
        if (sessionId) {
            validateServerSession(sessionId).then(isValid => {
                if (!isValid) {
                    console.log('Session invalid on page visibility, redirecting...');
                    sessionStorage.removeItem('cyberShieldSession');
                    window.location.href = '../index.html';
                }
            });
        }
    }
});
