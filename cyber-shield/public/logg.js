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

// Screens management
const screens = { 
  welcome: $('welcomeScreen')
};

function go(name){ 
  Object.values(screens).forEach(hide); 
  show(screens[name]); 
}

// Event listeners
// Event listeners with session support
$('btnLogin').addEventListener('click', () => {
  const sessionId = window.CyberShieldSession?.getCurrentSessionId();
  const url = sessionId ? `login/login.html?session=${sessionId}` : 'login/login.html';
  window.location.href = url;
});

$('btnSignup').addEventListener('click', () => {
  const sessionId = window.CyberShieldSession?.getCurrentSessionId();
  const url = sessionId ? `signup/signup.html?session=${sessionId}` : 'signup/signup.html';
  window.location.href = url;
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  go('welcome');
});
