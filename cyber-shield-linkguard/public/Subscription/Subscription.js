const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const toast = (msg, ms=2000) => { 
  const t = $('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), ms); 
};

// Session-based fetch function
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
const scanCounterEl = $('scanCounter');
const remainingScansEl = $('remainingScans');
const currentPlanBanner = $('currentPlanBanner');
const currentPlanText = $('currentPlanText');

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
      full_name: userData.full_name,
      plan_mode: userData.plan_mode
    });
    
    // Update current plan display based on plan_mode
    updateCurrentPlanDisplay(userData.plan_mode);
    updatePlanBadge(userData.plan_mode); // Update the plan badge in header
  } else { 
    if (welcomeMessage) welcomeMessage.textContent = ''; 
    if (userNameDisplay) userNameDisplay.textContent = 'User Name';
    console.log('User not authenticated, using fallback');
  }
}

// Update current plan display based on plan_mode
function updateCurrentPlanDisplay(planMode) {
  const planMap = {
    0: { name: 'Free Tier', badgeId: 'freeBadge' },
    1: { name: 'Pro Tier', badgeId: 'proBadge' },
    2: { name: 'Team Tier', badgeId: 'teamBadge' },
    3: { name: 'Enterprise Tier', badgeId: 'enterpriseBadge' }
  };
  
  const currentPlan = planMap[planMode] || planMap[0];
  
  // Update banner text
  if (currentPlanText) {
    currentPlanText.textContent = `You're currently on the ${currentPlan.name} plan`;
  }
  
  // Highlight current plan card
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.remove('current-plan', 'pulse-animation');
    
    // Add badge if it's the current plan
    const badge = card.querySelector('.plan-badge.current-badge');
    if (badge) {
      badge.style.display = 'none';
    }
  });
  
  // Highlight the current plan card
  const currentPlanCard = document.querySelector(`.plan-card[data-plan-id="${Object.keys(planMap).find(key => planMap[key].name === currentPlan.name).toLowerCase()}"]`);
  if (currentPlanCard) {
    currentPlanCard.classList.add('current-plan', 'pulse-animation');
    
    // Show the current badge
    const badge = currentPlanCard.querySelector('.plan-badge.current-badge');
    if (badge) {
      badge.style.display = 'block';
    }
  }
}

// Update plan badge in header (similar to ScannerDash)
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
  
  setUserUI(null); 
  toast('Signed out');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

// User dropdown functionality
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

// Toggle desktop dropdown
if (userDropdownBtn && userDropdown) {
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
  updateUI(){
    if (remainingScansEl) remainingScansEl.textContent = this.remaining;
    
    if (scanCounterEl) {
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

// Subscription plan codes and prices
const planCodes = {
  free: {code: 'CSLG-FREE-001', price: 0},
  pro: {code: 'CSLG-PRO-002', price: 75},
  team: {code: 'CSLG-TEAM-003', price: 200},
  enterprise: {code: 'CSLG-ENT-004', price: 0} // Contact sales for price
};

// Plan selection functionality
document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('click', function() {
    const planId = this.dataset.planId;
    const userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
    const planModeMap = {free: 0, pro: 1, team: 2, enterprise: 3};
    
    // If this is the current plan, show a message
    if (planModeMap[planId] === userPlanMode) {
      toast(`You're already on the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan`);
      return;
    }
    
    if (planId === 'enterprise') {
      toast('Please contact our sales team for enterprise pricing');
      return;
    }
    
    // Store selected plan details
    const planName = this.querySelector('h4').textContent;
    const planPrice = planCodes[planId].price;
    const planCode = planCodes[planId].code;
    
    localStorage.setItem('selectedPlan', JSON.stringify({
      id: planId,
      name: planName,
      price: planPrice,
      code: planCode
    }));
    
    // Redirect to payment page
    window.location.href = '../payment_sys/payment_sys.html';
  });
});

// Initialize subscription page
(async function boot(){
  // Check if user is authenticated
  try {
    const response = await fetchWithSession('/api/auth/me');
    
    if (response.ok) {
      const userInfo = await response.json();
      if (!userInfo.authenticated) {
        window.location.href = '../index.html';
        return;
      }
      
      // Store user info in sessionStorage for easy access
      sessionStorage.setItem('user_id', userInfo.user_id || '');
      sessionStorage.setItem('full_name', userInfo.full_name || '');
      sessionStorage.setItem('email', userInfo.email || '');
      sessionStorage.setItem('plan_mode', userInfo.plan_mode || '0');
      
      setUserUI(userInfo);
      scanCounter.updateUI();
      
    } else {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    window.location.href = '../index.html';
  }
})();
