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

async function fetchWithAuth(path, opts={}, autoRetry=true){
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
  if(token.access){ headers.Authorization = 'Bearer ' + token.access; }
  const r = await fetch(path, Object.assign({}, opts, { headers }));
  if(r.status !== 401 || !autoRetry || !token.refresh) return r;
  
  // Try one refresh
  const rf = await fetch('/api/auth/refresh', {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({ refresh_token: token.refresh })
  });
  
  if(!rf.ok){ token.clear(); return r; }
  const j = await rf.json();
  if(!j.access_token){ token.clear(); return r; }
  
  token.access = j.access_token;
  return fetch(path, Object.assign({}, opts, { 
    headers: Object.assign(headers, { Authorization: 'Bearer ' + token.access }) 
  }));
}

// Load user data
async function loadUserData() {
  try {
    const r = await fetchWithAuth('/api/me');
    if(r.ok) {
      const userData = await r.json();
      $('userName').value = userData.name || '';
      $('userEmail').value = userData.email || '';
    } else {
      toast('Failed to load user data');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    toast('Network error');
  }
}

// Update profile
$('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = $('userName').value.trim();
  const email = $('userEmail').value.trim().toLowerCase();
  
  if (!name || !email) {
    return toast('Please fill in all fields');
  }
  
  setBusy($('profileForm').querySelector('button'), true, 'Saving...');
  
  try {
    const r = await fetchWithAuth('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    });
    
    if (r.ok) {
      toast('Profile updated successfully');
    } else {
      const error = await r.json();
      toast(error.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    toast('Network error');
  } finally {
    setBusy($('profileForm').querySelector('button'), false);
  }
});

// Update password
$('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = $('currentPassword').value;
  const newPassword = $('newPassword').value;
  const confirmPassword = $('confirmPassword').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    return toast('Please fill in all fields');
  }
  
  if (newPassword.length < 6) {
    return toast('New password must be at least 6 characters');
  }
  
  if (newPassword !== confirmPassword) {
    show($('passwordError'));
    $('passwordError').textContent = 'Passwords do not match';
    return;
  } else {
    hide($('passwordError'));
  }
  
  setBusy($('passwordForm').querySelector('button'), true, 'Updating...');
  
  try {
    const r = await fetchWithAuth('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    if (r.ok) {
      toast('Password updated successfully');
      $('passwordForm').reset();
    } else {
      const error = await r.json();
      toast(error.message || 'Failed to update password');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    toast('Network error');
  } finally {
    setBusy($('passwordForm').querySelector('button'), false);
  }
});

// Delete account
$('confirmDelete').addEventListener('click', async () => {
  const password = $('deletePassword').value;
  
  if (!password) {
    return toast('Please enter your password to confirm');
  }
  
  setBusy($('confirmDelete'), true, 'Deleting...');
  
  try {
    const r = await fetchWithAuth('/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    });
    
    if (r.ok) {
      toast('Account deleted successfully');
      token.clear();
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1500);
    } else {
      const error = await r.json();
      toast(error.message || 'Failed to delete account');
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    toast('Network error');
  } finally {
    setBusy($('confirmDelete'), false);
  }
});

// Initialize
(async function init() {
  const accessToken = localStorage.getItem('access');
  
  if (!accessToken) {
    window.location.href = '../index.html';
    return;
  }
  
  await loadUserData();
})();

