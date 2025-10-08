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

// Generate unique payment reference
function generatePaymentReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CSLG-${timestamp}-${random}`;
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
  
  if ($('planName')) $('planName').textContent = selectedPlan.name;
  if ($('planPrice')) $('planPrice').textContent = `R${selectedPlan.price} / month`;
  if ($('planCode')) $('planCode').textContent = selectedPlan.code;
  
  // Generate and display payment reference
  const paymentReference = generatePaymentReference();
  if ($('paymentReference')) $('paymentReference').textContent = paymentReference;
  
  // Store reference for later use
  sessionStorage.setItem('paymentReference', paymentReference);
}

// Show success modal
function showSuccessModal(userName) {
  // Set user name in modal
  if ($('userNameModal')) {
    $('userNameModal').textContent = userName || 'User';
  }
  
  // Show modal
  const successModalElement = $('successModal');
  if (successModalElement) {
    const successModal = new bootstrap.Modal(successModalElement);
    successModal.show();
    
    // Redirect when modal is closed
    successModalElement.addEventListener('hidden.bs.modal', function () {
      window.location.href = '../ScannerDash/ScannerDash.html';
    });
  }
}

// Handle proof of payment upload
const proofUploadForm = $('proofUploadForm');
if (proofUploadForm) {
  proofUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Proof upload form submitted');
    
    const fileInput = $('proofFile');
    const senderEmail = $('senderEmail') ? $('senderEmail').value.trim() : '';
    const additionalNotes = $('additionalNotes') ? $('additionalNotes').value.trim() : '';
    const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
    const paymentReference = sessionStorage.getItem('paymentReference');
    
    // Validation
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast('Please select a proof of payment file');
      return;
    }
    
    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      toast('File size must be less than 5MB');
      return;
    }
    
    if (!validateEmail(senderEmail)) {
      toast('Please enter a valid email address');
      return;
    }
    
    // Show loading state
    const submitBtn = proofUploadForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('proof_file', file);
      formData.append('sender_email', senderEmail);
      formData.append('additional_notes', additionalNotes);
      formData.append('plan_name', selectedPlan.name);
      formData.append('plan_price', selectedPlan.price);
      formData.append('payment_reference', paymentReference);
      
      console.log('Sending proof of payment to server...');
      
      // Use fetch without credentials for file upload
      const response = await fetch('/api/subscription/submit-proof', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Proof submission successful:', result);
        
        // Clear form
        proofUploadForm.reset();
        
        // Get user name for modal
        const userName = sessionStorage.getItem('full_name') || (userNameDisplay ? userNameDisplay.textContent : 'User');
        
        // Show success modal instead of toast
        showSuccessModal(userName);
        
      } else {
        const errorText = await response.text();
        console.error('Proof submission failed:', errorText);
        let errorMessage = 'Failed to submit proof. Please try again or email directly.';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        toast(errorMessage);
        
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('Proof submission error:', error);
      toast('Failed to submit proof. Please try again or email directly to tshepho@msebetsisolutions.com');
      
      // Reset button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Card payment tab functionality
const cardTab = document.getElementById('card-tab');
if (cardTab) {
  cardTab.addEventListener('click', function(e) {
    console.log('Card payment tab clicked');
    // Show construction modal
    const constructionModalElement = $('constructionModal');
    if (constructionModalElement) {
      const constructionModal = new bootstrap.Modal(constructionModalElement);
      constructionModal.show();
    } else {
      console.error('Construction modal element not found');
    }
  });
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
