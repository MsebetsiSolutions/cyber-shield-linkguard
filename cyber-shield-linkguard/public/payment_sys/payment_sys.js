const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

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

// Set user UI
const whoRow = $('whoRow');
const logoutBtn = $('logout');

function setUserUI(email){ 
  if(email){ 
    whoRow.textContent = 'Signed in: ' + email; 
    show(logoutBtn);
  } else { 
    whoRow.textContent = ''; 
    show(logoutBtn);
  }
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
  token.clear(); 
  setUserUI(''); 
  toast('Signed out');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
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
  $('planPrice').textContent = selectedPlan.price;
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
  
  // Simulate payment processing
  setTimeout(() => {
    // Simulate successful payment
    localStorage.setItem('userPlan', selectedPlan.id);
    localStorage.removeItem('selectedPlan');
    
    toast('Payment successful! Your subscription has been activated.');
    
    // Redirect to dashboard after successful payment
    setTimeout(() => {
      window.location.href = '../ScannerDash/ScannerDash.html';
    }, 2000);
    
    // Reset button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }, 3000);
});

// Initialize payment page
(async function boot(){
  const accessToken = localStorage.getItem('access');
  
  if(accessToken){
    try {
      const r = await fetch('/api/me', {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      });
      if(r.ok){ 
        const me = await r.json(); 
        setUserUI(me.email); 
        displaySelectedPlan();
        return; 
      }
    } catch(e) {
      console.error('Failed to fetch user info', e);
    }
    token.clear();
  }
  
  setUserUI('');
  displaySelectedPlan();
})();
