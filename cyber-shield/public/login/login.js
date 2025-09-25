const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

'use strict';

const $ = id => document.getElementById(id);

// Utility functions
const setBusy = (btn, busy, text) => {
  if (!btn) return;
  btn.disabled = !!busy;
  if (text) {
    btn.dataset._orig = btn.dataset._orig || btn.textContent;
    btn.textContent = busy ? text : btn.dataset._orig;
  }
};

// Toast notification
const toast = (msg, ms = 2000) => {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
};

// Token management
const token = {
  get access() { return localStorage.getItem('access') || ''; },
  set access(v) { v ? localStorage.setItem('access', v) : localStorage.removeItem('access'); },
  get refresh() { return localStorage.getItem('refresh') || ''; },
  set refresh(v) { v ? localStorage.setItem('refresh', v) : localStorage.removeItem('refresh'); },
  clear() { this.access = ''; this.refresh = ''; }
};


// Setup password visibility toggle

function setupPasswordToggle() {
  const togglePassword = $('togglePassword');
  const passwordInput = $('loginPass');

  if (!togglePassword || !passwordInput) return;

  togglePassword.addEventListener('click', () => {
    // Determine the new type
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';

    // Update the eye icon
    if (isHidden) {
      togglePassword.classList.remove('bi-eye-slash');
      togglePassword.classList.add('bi-eye');
      togglePassword.setAttribute('aria-label', 'Hide password');
    } else {
      togglePassword.classList.remove('bi-eye');
      togglePassword.classList.add('bi-eye-slash');
      togglePassword.setAttribute('aria-label', 'Show password');
    }

    // Keep the focus and caret at the end
    const pos = passwordInput.value.length;
    passwordInput.focus();
    try {
      passwordInput.setSelectionRange(pos, pos);
    } catch (e) {
    }
  });
}

// Handle login process

async function handleLogin() {
  const emailInput = $('loginEmail');
  const passwordInput = $('loginPass');
  const doLoginBtn = $('doLogin');

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    toast('Missing email or password');
    return;
  }

  setBusy(doLoginBtn, true, 'Signing in…');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      toast(data.error || 'Login failed');
      return;
    }

    // Save tokens
    token.access = data.access_token;
    token.refresh = data.refresh_token;

    toast('Welcome back');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '../ScannerDash/ScannerDash.html';
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    toast('Network error');
  } finally {
    setBusy(doLoginBtn, false);
  }
}


//Initialize events
 
document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();

  const doLoginBtn = $('doLogin');
  const emailInput = $('loginEmail');
  const passwordInput = $('loginPass');

  // Login button click
  if (doLoginBtn) {
    doLoginBtn.addEventListener('click', handleLogin);
  }

  // Enter key on email or password triggers login
  if (emailInput) {
    emailInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }

  // Debug message if user already logged in
  if (token.access) {
    console.log('User already logged in with access token');
  }
});
