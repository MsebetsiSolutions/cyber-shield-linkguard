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

const token = {
  get access(){ return localStorage.getItem('access') || ''; },
  set access(v){ v ? localStorage.setItem('access', v) : localStorage.removeItem('access'); },
  get refresh(){ return localStorage.getItem('refresh') || ''; },
  set refresh(v){ v ? localStorage.setItem('refresh', v) : localStorage.removeItem('refresh'); },
  clear(){ this.access=''; this.refresh=''; }
};

// Generate random captcha
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

// Update captcha display
function updateCaptcha() {
  const captcha = generateCaptcha();
  $('captchaDisplay').textContent = captcha;
  $('captchaDisplay').dataset.value = captcha;
}

// Password visibility toggle
function setupPasswordToggle() {
  // Toggle for login password
  const togglePassword = $('#togglePassword');
  const passwordInput = $('#loginPass');
  
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
  });
  
  // Toggle for new password
  const toggleNewPassword = $('#toggleNewPassword');
  const newPasswordInput = $('#newPassword');
  
  toggleNewPassword.addEventListener('click', function() {
    const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    newPasswordInput.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
  });
  
  // Toggle for confirm password
  const toggleConfirmPassword = $('#toggleConfirmPassword');
  const confirmPasswordInput = $('#confirmPassword');
  
  toggleConfirmPassword.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
  });
}

// Screens management
const screens = { 
  login: $('loginForm'), 
  forgot: $('forgotPasswordForm')
};

function go(name){ 
  Object.values(screens).forEach(hide); 
  show(screens[name]); 
  if (name === 'forgot') {
    updateCaptcha();
  }
}

// Event listeners
$('forgotPasswordLink').addEventListener('click', () => go('forgot'));
$('backToLogin').addEventListener('click', () => go('login'));
$('backToWelcome').addEventListener('click', () => {
  window.location.href = '../index.html';
});
$('signupLink').addEventListener('click', () => {
  window.location.href = '../signup/signup.html';
});
$('refreshCaptcha').addEventListener('click', updateCaptcha);

$('doLogin').addEventListener('click', async () => {
  const email = $('loginEmail').value.trim().toLowerCase(); 
  const password = $('loginPass').value;
  
  if(!email || !password){ 
    return toast('Missing email or password'); 
  }
  
  setBusy($('doLogin'), true, 'Signing in…');
  
  try{
    const r = await fetch('/api/auth/login', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ email, password })
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      return toast(j.error || 'Login failed'); 
    }
    
    token.access = j.access_token; 
    token.refresh = j.refresh_token; 
    toast('Welcome back');
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '../ScannerDash/ScannerDash.html';
    }, 1000);
    
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy($('doLogin'), false); 
  }
});

$('doReset').addEventListener('click', async () => {
  const email = $('resetEmail').value.trim().toLowerCase();
  const captchaInput = $('captchaInput').value;
  const captchaValue = $('captchaDisplay').dataset.value;
  const newPassword = $('#newPassword').value;
  const confirmPassword = $('#confirmPassword').value;
  
  if(!email){ 
    return toast('Please enter your email'); 
  }
  
  if(!captchaInput || captchaInput !== captchaValue) {
    return toast('Invalid verification code');
  }
  
  if(!newPassword) {
    return toast('Please enter a new password');
  }
  
  if(newPassword !== confirmPassword) {
    return toast('Passwords do not match');
  }
  
  setBusy($('doReset'), true, 'Processing…');
  
  try{
    const r = await fetch('/api/auth/reset-password', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ email, newPassword })
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      return toast(j.error || 'Password reset failed'); 
    }
    
    toast('Password reset successfully');
    setTimeout(() => go('login'), 2000);
    
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy($('doReset'), false); 
  }
});

// Allow form submission with Enter key
$('loginEmail').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doLogin').click(); 
  } 
});

$('loginPass').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doLogin').click(); 
  } 
});

$('resetEmail').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doReset').click(); 
  } 
});

$('captchaInput').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doReset').click(); 
  } 
});

$('newPassword').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doReset').click(); 
  } 
});

$('confirmPassword').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doReset').click(); 
  } 
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupPasswordToggle();
  go('login');
});
