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

// Password visibility toggle
function setupPasswordToggle() {
  const togglePassword = $('#togglePassword');
  const togglePasswordConfirm = $('#togglePasswordConfirm');
  const passwordInput = $('#suPass');
  const confirmPasswordInput = $('#suPassConfirm');
  
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
  });
  
  togglePasswordConfirm.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
  });
}

// Password strength meter
function checkPasswordStrength(password) {
  let strength = 0;
  let message = '';
  let barColor = '';
  let barWidth = 0;
  
  if (password.length === 0) {
    hide($('passwordStrength'));
    return;
  }
  
  show($('passwordStrength'));
  
  // Length check
  if (password.length > 5) strength++;
  if (password.length > 8) strength++;
  
  // Character variety checks
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  // Determine strength level
  if (password.length < 6) {
    message = 'Too short';
    barColor = 'var(--progress-weak)';
    barWidth = 25;
  } else if (strength < 3) {
    message = 'Weak';
    barColor = 'var(--progress-weak)';
    barWidth = 33;
  } else if (strength < 5) {
    message = 'Medium';
    barColor = 'var(--progress-medium)';
    barWidth = 66;
  } else {
    message = 'Strong';
    barColor = 'var(--progress-strong)';
    barWidth = 100;
  }
  
  // Update UI
  $('#passwordStrengthBar').style.width = `${barWidth}%`;
  $('#passwordStrengthBar').style.backgroundColor = barColor;
  $('#passwordStrengthText').textContent = message;
  $('#passwordStrengthText').style.color = barColor;
}

// Event listeners
$('backToLogin').addEventListener('click', () => {
  window.location.href = '../index.html';
});

$('doSignup').addEventListener('click', async () => {
  const fullName = $('fullName').value.trim();
  const email = $('suEmail').value.trim().toLowerCase(); 
  const password = $('suPass').value;
  const passwordConfirm = $('suPassConfirm').value;
  
  // Validation
  if(!fullName) {
    return toast('Please enter your full name');
  }
  
  if(!email) { 
    return toast('Please enter a valid email address'); 
  }
  
  if(!validateEmail(email)) {
    return toast('Please enter a valid email format');
  }
  
  if(password.length < 6) { 
    show($('passwordError'));
    $('#passwordErrorText').textContent = 'Password must be at least 6 characters';
    return;
  }
  
  if(password !== passwordConfirm) {
    show($('passwordError'));
    $('#passwordErrorText').textContent = 'Passwords do not match';
    return;
  } else {
    hide($('passwordError'));
  }
  
  setBusy($('doSignup'), true, 'Creating Account…');
  
  try{
    const r = await fetch('/api/auth/signup', {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ full_name: fullName, email, password })
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      show($('passwordError'));
      $('#passwordErrorText').textContent = j.error || 'Sign up failed. Please try again.';
      return;
    }
    
    // Store tokens
    localStorage.setItem('access', j.access_token);
    localStorage.setItem('refresh', j.refresh_token);
    
    toast('Account created successfully! Redirecting...');
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 1500);
    
  } catch(e) { 
    toast('Network error. Please check your connection.'); 
  } finally { 
    setBusy($('doSignup'), false); 
  }
});

// Password confirmation validation
$('suPassConfirm').addEventListener('input', () => {
  const password = $('suPass').value;
  const passwordConfirm = $('suPassConfirm').value;
  
  if(passwordConfirm && password !== passwordConfirm) {
    show($('passwordError'));
    $('#passwordErrorText').textContent = 'Passwords do not match';
  } else {
    hide($('passwordError'));
  }
});

// Password strength check
$('suPass').addEventListener('input', function() {
  checkPasswordStrength(this.value);
  
  // Clear error when user types
  if(this.value.length >= 6) {
    hide($('passwordError'));
  }
});

// Email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupPasswordToggle();
  
  // Add slash to eye icons initially
  $('#togglePassword').classList.add('bi-eye-slash');
  $('#togglePasswordConfirm').classList.add('bi-eye-slash');
  
  // Hide password strength initially
  hide($('passwordStrength'));
  hide($('passwordError'));
});
