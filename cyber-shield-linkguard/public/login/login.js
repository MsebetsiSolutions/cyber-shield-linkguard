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
}

// Event listeners
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupPasswordToggle();
});
