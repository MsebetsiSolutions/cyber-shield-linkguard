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

const toast = (msg, ms=3000) => { 
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

// Modal Management
function openModal(modalId) {
  const modal = $(modalId);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = $(modalId);
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = 'auto';
}

// Navigation Menu
function toggleMenu() {
  const nav = document.getElementById('nav');
  const hamburger = $('hamburger');
  nav.classList.toggle('active');
  hamburger.classList.toggle('active');
}

function closeMenu() {
  const nav = document.getElementById('nav');
  const hamburger = $('hamburger');
  nav.classList.remove('active');
  hamburger.classList.remove('active');
}

// Password Toggle Functionality
function setupPasswordToggle(toggleBtnId, inputId) {
  const toggleBtn = $(toggleBtnId);
  const inputField = $(inputId);

  if (!toggleBtn || !inputField) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = inputField.getAttribute('type') === 'password';
    inputField.setAttribute('type', isPassword ? 'text' : 'password');

    toggleBtn.classList.toggle('bi-eye', !isPassword);
    toggleBtn.classList.toggle('bi-eye-slash', isPassword);
    
    const pos = inputField.value.length;
    inputField.focus();
    try {
      inputField.setSelectionRange(pos, pos);
    } catch (e) {}
  });
}

// Password Strength Meter
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

  if (password.length > 5) strength++;
  if (password.length > 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

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

  $('passwordStrengthBar').style.width = `${barWidth}%`;
  $('passwordStrengthBar').style.backgroundColor = barColor;
  $('passwordStrengthText').textContent = message;
  $('passwordStrengthText').style.color = barColor;
}

// Email Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Form Validation
function validateLoginForm() {
  const email = $('loginEmail').value.trim().toLowerCase();
  const password = $('loginPass').value;

  if (!email) {
    toast('Please enter your email address');
    return false;
  }

  if (!validateEmail(email)) {
    toast('Please enter a valid email address');
    return false;
  }

  if (!password) {
    toast('Please enter your password');
    return false;
  }

  return true;
}

function validateSignupForm() {
  const fullName = $('fullName').value.trim();
  const email = $('suEmail').value.trim().toLowerCase();
  const password = $('suPass').value;
  const passwordConfirm = $('suPassConfirm').value;

  if (!fullName) {
    toast('Please enter your full name');
    return false;
  }

  if (!email) {
    toast('Please enter your email address');
    return false;
  }

  if (!validateEmail(email)) {
    toast('Please enter a valid email address');
    return false;
  }

  if (password.length < 6) {
    show($('passwordError'));
    $('passwordErrorText').textContent = 'Password must be at least 6 characters';
    return false;
  }

  if (password !== passwordConfirm) {
    show($('passwordError'));
    $('passwordErrorText').textContent = 'Passwords do not match';
    return false;
  }

  hide($('passwordError'));
  return true;
}

function validateForgotPasswordForm() {
  const email = $('resetEmail').value.trim().toLowerCase();

  if (!email) {
    toast('Please enter your email address');
    return false;
  }

  if (!validateEmail(email)) {
    toast('Please enter a valid email address');
    return false;
  }

  return true;
}

// Simple AOS (Animate On Scroll) implementation
function initAOS() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
  });
}

// Login Functionality
async function handleLogin() {
  if (!validateLoginForm()) return;

  const emailInput = $('loginEmail');
  const passwordInput = $('loginPass');
  const doLoginBtn = $('doLogin');

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  setBusy(doLoginBtn, true, 'Signing in…');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' 
    });

    const data = await response.json();

    if (!response.ok) {
      toast(data.error || 'Login failed');
      return;
    }

    toast('Welcome back! Redirecting to dashboard...');
    
    // Get current session ID and redirect with it
    const sessionId = window.CyberShieldSession?.getCurrentSessionId();
    const redirectUrl = sessionId ? 
      'ScannerDash/ScannerDash.html?session=' + sessionId : 
      'ScannerDash/ScannerDash.html';

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);

  } catch (error) {
    console.error('Login error:', error);
    toast('Network error. Please check your connection.');
  } finally {
    setBusy(doLoginBtn, false);
  }
}

// Signup Functionality
async function handleSignup() {
  if (!validateSignupForm()) return;

  const fullName = $('fullName').value.trim();
  const email = $('suEmail').value.trim().toLowerCase();
  const password = $('suPass').value;

  setBusy($('doSignup'), true, 'Creating Account…');

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ full_name: fullName, email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      show($('passwordError'));
      $('passwordErrorText').textContent = data.error || 'Sign up failed. Please try again.';
      return;
    }

    toast('Account created successfully! You can now login.');

    setTimeout(() => {
      closeModal('signupModal');
      openModal('loginModal');
      // Clear form
      $('fullName').value = '';
      $('suEmail').value = '';
      $('suPass').value = '';
      $('suPassConfirm').value = '';
      hide($('passwordStrength'));
    }, 2000);
  } catch (error) {
    toast('Network error. Please check your connection.');
  } finally {
    setBusy($('doSignup'), false);
  }
}

// Forgot Password Functionality
async function handleForgotPassword() {
  if (!validateForgotPasswordForm()) return;

  const email = $('resetEmail').value.trim().toLowerCase();
  
  setBusy($('doReset'), true, 'Sending...');
  
  try {
    const response = await fetch('/api/auth/forgot-password', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ email })
    });
    
    const data = await response.json(); 
    if (!response.ok) { 
      return toast(data.error || 'Failed to send reset link'); 
    }
    
    toast('Reset link sent to your email');
    setTimeout(() => {
      closeModal('forgotPasswordModal');
      openModal('loginModal');
      $('resetEmail').value = '';
    }, 2000);
    
  } catch (error) { 
    toast('Network error'); 
  } finally { 
    setBusy($('doReset'), false); 
  }
}

// Event Listeners
function setupEventListeners() {
  // Menu Toggle
  $('hamburger').addEventListener('click', toggleMenu);

  // Modal Controls
  $('aboutBtn').addEventListener('click', () => openModal('aboutModal'));
  $('closeAboutModal').addEventListener('click', () => closeModal('aboutModal'));
  
  // Developers Modal
  $('developersBtn').addEventListener('click', () => openModal('developersModal'));
  $('closeDevelopersModal').addEventListener('click', () => closeModal('developersModal'));
  
  // Login Modal
  $('desktopLoginBtn').addEventListener('click', () => openModal('loginModal'));
  $('mobileLoginBtn').addEventListener('click', () => {
    openModal('loginModal');
    closeMenu();
  });
  $('closeLoginModal').addEventListener('click', () => closeModal('loginModal'));
  
  // Signup Modal
  $('desktopSignupBtn').addEventListener('click', () => openModal('signupModal'));
  $('mobileSignupBtn').addEventListener('click', () => {
    openModal('signupModal');
    closeMenu();
  });
  $('heroSignupBtn').addEventListener('click', () => openModal('signupModal'));
  $('closeSignupModal').addEventListener('click', () => closeModal('signupModal'));
  
  // Forgot Password Modal
  $('forgotPasswordBtn').addEventListener('click', () => {
    closeModal('loginModal');
    openModal('forgotPasswordModal');
  });
  $('closeForgotPasswordModal').addEventListener('click', () => closeModal('forgotPasswordModal'));
  $('backToLogin').addEventListener('click', () => {
    closeModal('forgotPasswordModal');
    openModal('loginModal');
  });
  
  // Modal Switching
  $('switchToSignup').addEventListener('click', () => {
    closeModal('loginModal');
    openModal('signupModal');
  });
  $('switchToLogin').addEventListener('click', () => {
    closeModal('signupModal');
    openModal('loginModal');
  });

  // Form Submissions
  $('doLogin').addEventListener('click', handleLogin);
  $('doSignup').addEventListener('click', handleSignup);
  $('doReset').addEventListener('click', handleForgotPassword);

  // Enter key support for forms
  $('loginEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  $('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // Enter key support for signup form
  const signupInputs = [$('fullName'), $('suEmail'), $('suPass'), $('suPassConfirm')];
  signupInputs.forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSignup();
    });
  });

  // Enter key support for forgot password form
  $('resetEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleForgotPassword();
    }
  });

  // Password strength and validation
  $('suPass').addEventListener('input', function() {
    checkPasswordStrength(this.value);
    if (this.value.length >= 6) hide($('passwordError'));
  });

  $('suPassConfirm').addEventListener('input', () => {
    if ($('suPass').value !== $('suPassConfirm').value) {
      show($('passwordError'));
      $('passwordErrorText').textContent = 'Passwords do not match';
    } else {
      hide($('passwordError'));
    }
  });

  // Close modals on outside click and escape key
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAllModals();
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        closeMenu();
      }
    });
  });

  // Prevent form submission on enter in forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
  // Initialize session first
  if (window.CyberShieldSession) {
    window.CyberShieldSession.initSession();
  }

  // Setup password toggles
  setupPasswordToggle('togglePassword', 'loginPass');
  setupPasswordToggle('toggleSignupPassword', 'suPass');
  setupPasswordToggle('toggleSignupPasswordConfirm', 'suPassConfirm');

  // Hide error and strength indicators initially
  hide($('passwordStrength'));
  hide($('passwordError'));

  // Initialize animations
  initAOS();

  // Setup all event listeners
  setupEventListeners();

  // Debug message if user already logged in
  if (token.access) {
    console.log('User already logged in with access token');
  }
});