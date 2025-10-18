const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const toast = (msg, ms=2000) => { 
  const t = $('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), ms); 
};

// Security: Input sanitization
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Security: Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate unique payment reference based on plan code
function generatePaymentReference(planCode) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  // Create reference based on plan code
  const planPrefix = planCode.replace('CSLG-', '').split('-')[0];
  return `${planCode}-${timestamp}-${random}`;
}

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
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

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
    if (userNameDisplay) userNameDisplay.textContent = 'User Name'; 
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
    
    setUserUI(null);

    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    localStorage.removeItem('selectedPlan'); 
    
    toast('Signed out successfully');
    
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

// Attach logout event listener
if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

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

// Display selected plan info
function displaySelectedPlan() {
  const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
  
  if (!selectedPlan.id) {
    toast('No plan selected. Redirecting to subscription page...');
    setTimeout(() => {
      window.location.href = '../Subscription/Subscription.html';
    }, 2000);
    return;
  }
  
  // Update plan summary section
  if ($('planNameDisplay')) $('planNameDisplay').textContent = selectedPlan.name;
  if ($('planPriceDisplay')) $('planPriceDisplay').textContent = `R${selectedPlan.price}${selectedPlan.id === 'increase' ? '' : ' / month'}`;
  if ($('planCodeDisplay')) $('planCodeDisplay').textContent = selectedPlan.code;
  
  // Generate and display payment reference based on plan code
  const paymentReference = generatePaymentReference(selectedPlan.code);
  if ($('paymentReference')) $('paymentReference').textContent = paymentReference;
  if ($('paymentReferenceDisplay')) $('paymentReferenceDisplay').textContent = paymentReference;
  
  // Store reference for later use
  sessionStorage.setItem('paymentReference', paymentReference);
}

// Disable card payment form interactions
const paymentForm = $('paymentForm');
if (paymentForm) {
  paymentForm.querySelectorAll('input, button').forEach(element => {
    element.disabled = true;
  });
}

// Initialize payment page
(async function boot(){
  console.log('Payment page initializing...');
  
  try {
    const r = await fetchWithSession('/api/auth/me');
    console.log('Auth check response status:', r.status);
    
    if(r.ok){ 
      const userData = await r.json(); 
      console.log('User data received:', userData);
      
      if (userData.authenticated) {
        setUserUI(userData); 
        displaySelectedPlan();
        console.log('User authenticated successfully');
        return;
      } else {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '../index.html';
        return;
      }
    } else {
      console.log('Auth check failed, redirecting to login');
      window.location.href = '../index.html';
      return;
    }
  } catch(e) {
    console.error('Failed to fetch user info', e);
    window.location.href = '../index.html';
    return;
  }
})();

// Security: Clear sensitive data when leaving page
window.addEventListener('beforeunload', function() {
  localStorage.removeItem('selectedPlan');
  sessionStorage.removeItem('paymentReference');
});

// Security: Prevent form resubmission
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}