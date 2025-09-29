// Helper functions
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
  // Create toast element if it doesn't exist
  let t = $('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:white;padding:10px20px;border-radius:5px;z-index:10000;display:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg; 
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', ms); 
};

// Session-based fetch function
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
    
    if (welcomeMessage) welcomeMessage.textContent = welcomeText;
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    
    console.log('User UI updated:', {
      welcomeText,
      displayName,
      full_name: userData.full_name
    });

  } else { 
    if (welcomeMessage) welcomeMessage.textContent = ''; 
    if (userNameDisplay) userNameDisplay.textContent = 'Intelligence Analyst'; 
    console.log('User not authenticated, using fallback');
  }
}

// Logout functionality
async function handleLogout() {
    try {
        // Get current session ID before clearing
        const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();
        
        // Call server logout to invalidate sessions
        const logoutResponse = await fetchWithSession('/api/auth/logout', {
            method: 'POST'
        });
        
        if (logoutResponse.ok) {
            console.log('Logout successful');
            
            // Invalidate server-side sessions
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
    
    // Clear client-side data
    setUserUI(null);
    
    // Clear session storage
    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    
    toast('Signed out successfully');
    
    // Redirect to login page without session ID
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

// User dropdown functionality
function setupUserDropdown() {
  const userDropdownBtn = $('userDropdownBtn');
  const userDropdown = $('userDropdown');

  if (userDropdownBtn && userDropdown) {
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
  }
}

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
      return data.plan_mode;
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
  }
  return 0; 
}

// Check if user has Enterprise access
function checkEnterpriseAccess(planMode) {
  if (planMode !== 3) {
    toast('Enterprise feature requires Enterprise subscription');
    setTimeout(() => {
      window.location.href = '../ScannerDash/ScannerDash.html';
    }, 2000);
    return false;
  }
  return true;
}

// Background Check functionality
function initBackgroundCheck() {
  // Elements
  const scanBtn = document.getElementById("intelScanBtn");
  const overallRisk = document.getElementById("overallRisk");
  const riskScore = document.getElementById("riskScore");
  const riskLabel = document.getElementById("riskLabel");
  const riskPointer = document.getElementById("riskPointer");
  const reportActions = document.getElementById("reportActions");

  // Result containers
  const legalResults = document.getElementById("legalResults");
  const financialResults = document.getElementById("financialResults");
  const securityResults = document.getElementById("securityResults");
  const reputationResults = document.getElementById("reputationResults");
  const connectionsResults = document.getElementById("connectionsResults");

  // Scan button event
  if (scanBtn) {
    scanBtn.addEventListener("click", function () {
      const fullName = document.getElementById("fullName").value;

      if (!fullName) {
        toast("Please enter at least a full name");
        return;
      }

      // Show scanning state
      setBusy(scanBtn, true, 'Scanning...');

      // Simulate scan progress
      simulateIntelligenceScan();
    });
  }

  // Simulate the intelligence scanning process
  function simulateIntelligenceScan() {
    let progress = 0;

    const updateProgress = () => {
      progress += 2;

      // Update progress text based on stage
      if (progress < 20) {
        setBusy(scanBtn, true, `Searching public records (${progress}%)`);
      } else if (progress < 40) {
        setBusy(scanBtn, true, `Checking regulatory databases (${progress}%)`);
      } else if (progress < 60) {
        setBusy(scanBtn, true, `Analyzing financial history (${progress}%)`);
      } else if (progress < 80) {
        setBusy(scanBtn, true, `Scanning security databases (${progress}%)`);
      } else {
        setBusy(scanBtn, true, `Compiling final report (${progress}%)`);
      }

      // When complete
      if (progress >= 100) {
        setTimeout(() => {
          completeScan();
        }, 800);
      } else {
        setTimeout(updateProgress, 100);
      }
    };

    updateProgress();
  }

  // Complete the scan and show results
  function completeScan() {
    setBusy(scanBtn, false, 'RUN INTELLIGENCE SCAN');

    // Show overall risk assessment
    if (overallRisk) overallRisk.classList.remove("hidden");
    if (reportActions) reportActions.classList.remove("hidden");

    // Generate random risk score between 0-100
    const riskValue = Math.floor(Math.random() * 100);
    if (riskScore) riskScore.textContent = `${riskValue}%`;

    // Position risk pointer (0% = left: 10%, 100% = left: 90%)
    const pointerPosition = 10 + riskValue * 0.8;
    if (riskPointer) riskPointer.style.left = `${pointerPosition}%`;

    // Set risk label based on score
    if (riskLabel) {
      if (riskValue < 20) {
        riskLabel.className = "risk-badge risk-none";
        riskLabel.textContent = "Low Risk";
      } else if (riskValue < 60) {
        riskLabel.className = "risk-badge risk-medium";
        riskLabel.textContent = "Medium Risk";
      } else {
        riskLabel.className = "risk-badge risk-high";
        riskLabel.textContent = "High Risk";
      }
    }

    // Generate sample results for each category
    generateLegalResults();
    generateFinancialResults();
    generateSecurityResults();
    generateReputationResults();
    generateConnectionsResults();

    toast('Background check completed successfully!');
  }

  // Generate sample legal results
  function generateLegalResults() {
    const hasLegalIssues = Math.random() > 0.4;

    if (hasLegalIssues) {
      legalResults.innerHTML = `
            <div class="result-card cs-card mb-3">
              <div class="d-flex justify-content-between align-items-start">
                <h5><i class="bi bi-journal-check text-danger me-2"></i>Legal & Regulatory Issues Found</h5>
                <span class="risk-badge risk-high">High Severity</span>
              </div>
              <p class="cs-sub">The following potential legal concerns were identified:</p>
              <ul>
                <li>Subject mentioned in <span class="keyword-pill">lawsuit</span> regarding intellectual property rights (2022)</li>
                <li>Company fined for <span class="keyword-pill">regulatory violations</span> in the EU (2021)</li>
                <li>Previous <span class="keyword-pill">sanctions</span> violations noted in industry reports</li>
                <li>Subject's name appears in <span class="keyword-pill">PEP databases</span> (Politically Exposed Person)</li>
                <li>Company involved in <span class="keyword-pill">antitrust investigation</span> (2019-2020)</li>
              </ul>
              <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="source-badge">Global Legal Database</span>
                <small class="cs-sub">Last updated: 3 days ago</small>
              </div>
            </div>
          `;
    } else {
      legalResults.innerHTML = `
            <div class="result-card cs-card mb-3">
              <div class="d-flex justify-content-between align-items-start">
                <h5><i class="bi bi-journal-check text-success me-2"></i>No Significant Legal Issues</h5>
                <span class="risk-badge risk-none">Clean Record</span>
              </div>
              <p class="cs-sub">No lawsuits, regulatory actions, or significant legal proceedings found in public records.</p>
              <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="source-badge">Legal Database</span>
                <small class="cs-sub">Last updated: 2 days ago</small>
              </div>
            </div>
          `;
    }
  }

  // Generate sample financial results
  function generateFinancialResults() {
    financialResults.innerHTML = `
          <div class="result-card cs-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <h5><i class="bi bi-cash-coin text-warning me-2"></i>Financial Stability Assessment</h5>
              <span class="risk-badge risk-medium">Moderate Risk</span>
            </div>
            <p class="cs-sub">Based on available financial data and business records:</p>
            <ul>
              <li>Company established in 2015, stable registration history</li>
              <li>No recent <span class="keyword-pill">bankruptcy</span> filings or insolvency proceedings</li>
              <li>Minor <span class="keyword-pill">tax lien</span> resolved in 2021</li>
              <li>Moderate financial growth over past 3 years</li>
              <li>Subject appears in <span class="keyword-pill">offshore leaks database</span> (2016)</li>
              <li>Company structure includes entities in <span class="keyword-pill">tax haven jurisdictions</span></li>
            </ul>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="source-badge">Financial Intelligence</span>
              <small class="cs-sub">Last updated: 1 week ago</small>
            </div>
          </div>
        `;
  }

  // Generate sample security results
  function generateSecurityResults() {
    securityResults.innerHTML = `
          <div class="result-card cs-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <h5><i class="bi bi-shield-check text-info me-2"></i>Security Assessment</h5>
              <span class="risk-badge risk-low">Low Risk</span>
            </div>
            <p class="cs-sub">Analysis of digital footprint and security indicators:</p>
            <ul>
              <li>Domain registered for 7 years, consistent ownership</li>
              <li>No security blacklistings found on <span class="keyword-pill">AbuseIPDB</span> or similar services</li>
              <li>Email servers properly configured with SPF/DKIM/DMARC</li>
              <li>Website uses valid SSL certificate with strong encryption</li>
              <li>No significant vulnerabilities detected in public-facing systems</li>
              <li>Subject's email not found in major <span class="keyword-pill">data breaches</span></li>
            </ul>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="source-badge">Security Database</span>
              <small class="cs-sub">Last updated: Today</small>
            </div>
          </div>
        `;
  }

  // Generate sample reputation results
  function generateReputationResults() {
    const hasNegativeNews = Math.random() > 0.7;

    let reputationHTML = `
          <div class="result-card cs-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <h5><i class="bi bi-newspaper text-primary me-2"></i>Media & Public Perception</h5>
              <span class="risk-badge ${
                hasNegativeNews ? "risk-medium" : "risk-low"
              }">${hasNegativeNews ? "Mixed" : "Mostly Positive"}</span>
            </div>
            <p class="cs-sub">Analysis of news coverage and public records:</p>
            <ul>
              <li>Generally positive industry presence with regular coverage in trade publications</li>
        `;

    if (hasNegativeNews) {
      reputationHTML += `
            <li>Negative coverage regarding <span class="keyword-pill">labor practices</span> in 2022</li>
            <li>Minor <span class="keyword-pill">controversy</span> surrounding executive comments last year</li>
            <li>Subject criticized for <span class="keyword-pill">environmental record</span> in home country</li>
          `;
    }

    reputationHTML += `
              <li>No significant <span class="keyword-pill">scandals</span> or major negative press found</li>
              <li>Active social media presence with generally positive engagement</li>
              <li>Subject has <span class="keyword-pill">spoken at industry conferences</span> (2019, 2021)</li>
            </ul>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="source-badge">Media Monitoring</span>
              <small class="cs-sub">Last updated: Today</small>
            </div>
          </div>
        `;

    reputationResults.innerHTML = reputationHTML;
  }

  // Generate sample connections results
  function generateConnectionsResults() {
    connectionsResults.innerHTML = `
          <div class="result-card cs-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <h5><i class="bi bi-diagram-3 text-info me-2"></i>Network Analysis</h5>
              <span class="risk-badge risk-medium">Moderate Risk</span>
            </div>
            <p class="cs-sub">Analysis of professional connections and associations:</p>
            <ul>
              <li>Serves on board of 3 other companies in related industries</li>
              <li>Former business partner was <span class="keyword-pill">investigated</span> for fraud (2018)</li>
              <li>Company has suppliers in <span class="keyword-pill">high-risk jurisdictions</span></li>
              <li>Subject attended university with several <span class="keyword-pill">government officials</span></li>
              <li>No direct connections to <span class="keyword-pill">sanctioned entities</span> found</li>
              <li>Member of industry association with <span class="keyword-pill">lobbying activities</span></li>
            </ul>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="source-badge">Network Analysis</span>
              <small class="cs-sub">Last updated: 2 days ago</small>
            </div>
          </div>
        `;
  }
}

// Initialize dashboard and check authentication
(async function boot(){
  console.log('Background Check initializing...');
  
  try {
    const r = await fetchWithSession('/api/auth/me');
    console.log('Auth check response status:', r.status);
    
    if(r.ok){ 
      const userData = await r.json(); 
      console.log('User data received:', userData);
      
      if (userData.authenticated) {
        // Check user plan and update UI accordingly
        const planMode = await checkUserPlan();
        
        setUserUI({...userData, plan_mode: planMode}); 
        
        // Check if user has Enterprise access
        if (!checkEnterpriseAccess(planMode)) {
          return;
        }
        
        // Setup user interface components
        setupUserDropdown();
        
        // Add logout event listener
        if (logoutBtn) {
          logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Initialize background check functionality
        initBackgroundCheck();
        
        console.log('Background Check initialized successfully');
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
    
    // Try to get user data from sessionStorage as fallback
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUserUI(userData);
        
        // Setup user interface components
        setupUserDropdown();
        
        // Add logout event listener
        if (logoutBtn) {
          logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Initialize background check functionality
        initBackgroundCheck();
      } catch (parseError) {
        console.error('Error parsing stored user data:', parseError);
      }
    }
  }
})();
