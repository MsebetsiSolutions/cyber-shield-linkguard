const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');
const setBusy = (btn, busy, text) => { 
  btn.disabled = !!busy; 
  if (text) { 
    btn.dataset._orig = btn.dataset._orig || btn.textContent; 
    btn.textContent = busy ? text : btn.dataset._orig; 
  } 
};

const toast = (msg, ms = 2000) => { 
  const t = $('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), ms); 
};

// Toggle password visibility for any input field
function setupPasswordToggle(toggleBtnId, inputId) {
  const toggleBtn = $(toggleBtnId);
  const inputField = $(inputId);

  toggleBtn.addEventListener('click', () => {
    const isPassword = inputField.getAttribute('type') === 'password';
    inputField.setAttribute('type', isPassword ? 'text' : 'password');

    // Update the eye icon
    toggleBtn.classList.toggle('bi-eye', !isPassword);
    toggleBtn.classList.toggle('bi-eye-slash', isPassword);
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

  // Character variety
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  // Determine strength
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
  $('passwordStrengthBar').style.width = `${barWidth}%`;
  $('passwordStrengthBar').style.backgroundColor = barColor;
  $('passwordStrengthText').textContent = message;
  $('passwordStrengthText').style.color = barColor;
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Form submission
$('doSignup').addEventListener('click', async () => {
  const fullName = $('fullName').value.trim();
  const email = $('suEmail').value.trim().toLowerCase();
  const password = $('suPass').value;
  const passwordConfirm = $('suPassConfirm').value;

  if (!fullName) return toast('Please enter your full name');
  if (!email) return toast('Please enter your email address');
  if (!validateEmail(email)) return toast('Invalid email format');

  if (password.length < 6) {
    show($('passwordError'));
    $('passwordErrorText').textContent = 'Password must be at least 6 characters';
    return;
  }

  if (password !== passwordConfirm) {
    show($('passwordError'));
    $('passwordErrorText').textContent = 'Passwords do not match';
    return;
  } else {
    hide($('passwordError'));
  }

  setBusy($('doSignup'), true, 'Creating Account…');

  try {
    const r = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ full_name: fullName, email, password })
    });

    const j = await r.json();
    if (!r.ok) {
      show($('passwordError'));
      $('passwordErrorText').textContent = j.error || 'Sign up failed. Please try again.';
      return;
    }

    // Save tokens
    localStorage.setItem('access', j.access_token);
    localStorage.setItem('refresh', j.refresh_token);

    toast('Account created successfully! Redirecting...');

    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 1500);
  } catch (e) {
    toast('Network error. Please check your connection.');
  } finally {
    setBusy($('doSignup'), false);
  }
});

// Password strength check
$('suPass').addEventListener('input', function() {
  checkPasswordStrength(this.value);
  if (this.value.length >= 6) hide($('passwordError'));
});

// Confirm password check
$('suPassConfirm').addEventListener('input', () => {
  if ($('suPass').value !== $('suPassConfirm').value) {
    show($('passwordError'));
    $('passwordErrorText').textContent = 'Passwords do not match';
  } else {
    hide($('passwordError'));
  }
});

// Navigation back to login
$('backToLogin').addEventListener('click', () => {
  window.location.href = '../index.html';
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Setup toggles
  setupPasswordToggle('togglePassword', 'suPass');
  setupPasswordToggle('togglePasswordConfirm', 'suPassConfirm');

  hide($('passwordStrength'));
  hide($('passwordError'));
});

