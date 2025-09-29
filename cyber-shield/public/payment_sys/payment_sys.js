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

// Security: Validate card number using Luhn algorithm
function validateCardNumber(cardNumber) {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Check if it's all digits and correct length
  if (!/^\d+$/.test(cleanNumber) || cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  
  // Luhn algorithm implementation
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Security: Validate expiry date
function validateExpiryDate(expiryDate) {
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expiryRegex.test(expiryDate)) {
    return false;
  }
  
  const [month, year] = expiryDate.split('/').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
}

function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

function formatCardNumber(cardNumber) {
  return cardNumber.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
}

function formatExpiryDate(expiryDate) {
  const cleaned = expiryDate.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
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

// Payment form validation and submission
$('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
  const cardNumber = $('cardNumber').value.replace(/\s/g, '');
  const cardName = $('cardName').value.trim();
  const expiryDate = $('expiryDate').value;
  const cvv = $('cvv').value;
  const zipCode = $('zipCode').value;
  const email = $('email').value.trim();
  
  // Security: Input validation
  if (!cardNumber || !cardName || !expiryDate || !cvv || !zipCode || !email) {
    toast('Please fill in all fields');
    return;
  }
  
  if (!validateEmail(email)) {
    toast('Please enter a valid email address');
    return;
  }
  
  if (!validateCardNumber(cardNumber)) {
    toast('Please enter a valid card number');
    return;
  }
  
  if (!validateExpiryDate(expiryDate)) {
    toast('Please enter a valid expiry date (MM/YY)');
    return;
  }
  
  if (!validateCVV(cvv)) {
    toast('Please enter a valid CVV (3 or 4 digits)');
    return;
  }
  
  if (!/^\d{5}$/.test(zipCode)) {
    toast('Please enter a valid 5-digit ZIP code');
    return;
  }
  
  // Security: Sanitize inputs
  const sanitizedCardName = sanitizeInput(cardName);
  const sanitizedEmail = sanitizeInput(email);
  
  // Show loading state
  const submitBtn = $('paymentForm').querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i> Processing...';
  submitBtn.disabled = true;
  
  try {
    // Call backend to process payment and create subscription
    const response = await fetchWithSession('/api/subscription/process-payment', {
      method: 'POST',
      body: JSON.stringify({
        plan_data: {
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          plan_code: selectedPlan.code,
          price: selectedPlan.price,
          team_size: selectedPlan.team_size || 1
        },
        payment_data: {
          card_number: cardNumber,
          expiry_date: expiryDate,
          cvv: cvv,
          card_holder: sanitizedCardName,
          email: sanitizedEmail,
          zip_code: zipCode
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Clear sensitive data from form
      $('paymentForm').reset();
      
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

// Input formatting and validation
$('cardNumber').addEventListener('input', function(e) {
  const cursorPosition = e.target.selectionStart;
  const formatted = formatCardNumber(e.target.value);
  e.target.value = formatted;
  
  // Restore cursor position
  const diff = formatted.length - e.target.value.length;
  e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
});

$('expiryDate').addEventListener('input', function(e) {
  const cursorPosition = e.target.selectionStart;
  const formatted = formatExpiryDate(e.target.value);
  e.target.value = formatted;
  
  // Restore cursor position
  const diff = formatted.length - e.target.value.length;
  e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
});

// Security: Prevent non-numeric input for CVV and ZIP
$('cvv').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/\D/g, '');
});

$('zipCode').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/\D/g, '');
});

// Security: Real-time validation feedback
$('cardNumber').addEventListener('blur', function() {
  if (this.value && !validateCardNumber(this.value)) {
    this.style.borderColor = 'var(--candy-red)';
  } else if (this.value) {
    this.style.borderColor = 'var(--candy-green)';
  }
});

$('expiryDate').addEventListener('blur', function() {
  if (this.value && !validateExpiryDate(this.value)) {
    this.style.borderColor = 'var(--candy-red)';
  } else if (this.value) {
    this.style.borderColor = 'var(--candy-green)';
  }
});

$('email').addEventListener('blur', function() {
  if (this.value && !validateEmail(this.value)) {
    this.style.borderColor = 'var(--candy-red)';
  } else if (this.value) {
    this.style.borderColor = 'var(--candy-green)';
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

// Security: Clear sensitive data when leaving page
window.addEventListener('beforeunload', function() {
  localStorage.removeItem('selectedPlan');
});

// Security: Prevent form resubmission
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}
