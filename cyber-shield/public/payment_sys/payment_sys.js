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

// Set user UI (Updated to match ScannerDash's user dropdown)
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

// Attach logout event listener
logoutBtn.addEventListener('click', handleLogout);

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
  
  $('planName').textContent = selectedPlan.name;
  $('planPrice').textContent = `R${selectedPlan.price} / month`;
  $('planCode').textContent = selectedPlan.code;
}

// Payment form handling
$('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
  const cardNumber = $('cardNumber').value;
  const cardName = $('cardName').value;
  const expiryDate = $('expiryDate').value;
  const cvv = $('cvv').value;
  const zipCode = $('zipCode').value;
  const email = $('email').value;
  
  // Basic validation
  if (!cardNumber || !cardName || !expiryDate || !cvv || !zipCode || !email) {
    toast('Please fill in all fields');
    return;
  }
  
  // Show loading state
  const submitBtn = $('paymentForm').querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i> Processing...';
  submitBtn.disabled = true;
  
  try {
    // Call backend to create subscription
    const response = await fetchWithSession('/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        plan_code: selectedPlan.code,
        price: selectedPlan.price
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Clear selected plan from storage
      localStorage.removeItem('selectedPlan');
      
      toast('Payment successful! Your subscription has been activated.');
      
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        window.location.href = '../ScannerDash/ScannerDash.html';
      }, 2000);
    } else {
      const error = await response.json();
      toast(error.error || 'Payment failed. Please try again.');
      
      // Reset button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Payment error:', error);
    toast('Payment failed. Please try again.');
    
    // Reset button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

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
