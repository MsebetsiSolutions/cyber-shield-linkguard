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
const whoRow = $('whoRow');
const logoutBtn = $('logout');

function setUserUI(userData){ 
  if(userData && userData.authenticated){ 
    whoRow.textContent = 'Signed in: ' + (userData.full_name || userData.email); 
    show(logoutBtn);
  } else { 
    whoRow.textContent = ''; 
    hide(logoutBtn);
  }
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    fetchWithSession('/api/auth/logout', {
      method: 'POST'
    }).then(response => {
      if (response.ok) {
        console.log('Logout successful');
      }
    }).catch(e => {
      console.log('Logout API call failed');
    });
    
    setUserUI(''); 
    toast('Signed out');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1000);
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
  // Check if user is authenticated
  try {
    const response = await fetchWithSession('/api/auth/me');
    
    if (response.ok) {
      const userInfo = await response.json();
      if (!userInfo.authenticated) {
        window.location.href = '../index.html';
        return;
      }
      setUserUI(userInfo);
      displaySelectedPlan();
    } else {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    window.location.href = '../index.html';
  }
})();
