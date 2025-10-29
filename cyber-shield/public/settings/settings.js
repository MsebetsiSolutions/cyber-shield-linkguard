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

function setUserUI(userData){ 
  console.log('Setting user UI with data:', userData); 
  
  if(userData && userData.authenticated){ 
    const welcomeText = `Welcome, ${userData.full_name || userData.email}!`;
    const displayName = userData.full_name || userData.email.split('@')[0];
    
    if (welcomeMessage) welcomeMessage.textContent = welcomeText;
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    
    // Enable/disable Contact Support button based on plan_mode
    const supportButton = document.querySelector('a.cs-btn.btn-secondary[href="../supcom/supcom.html"]');
    if (supportButton) {
      if (userData.plan_mode === 0) {
        // Free plan - disable support
        supportButton.classList.add('disabled');
        supportButton.style.opacity = '0.6';
        supportButton.style.pointerEvents = 'none';
        supportButton.setAttribute('aria-disabled', 'true');
      } else {
        // Paid plans (1, 2, or 3) - enable support
        supportButton.classList.remove('disabled');
        supportButton.style.opacity = '1';
        supportButton.style.pointerEvents = 'auto';
        supportButton.setAttribute('aria-disabled', 'false');
      }
    }
    
    console.log('User UI updated:', {
      welcomeText,
      displayName,
      full_name: userData.full_name,
      plan_mode: userData.plan_mode,
      support_enabled: userData.plan_mode !== 0
    });
  } else { 
    if (welcomeMessage) welcomeMessage.textContent = ''; 
    if (userNameDisplay) userNameDisplay.textContent = 'User Name'; // Fallback text
    
    // Disable support button if user is not authenticated
    const supportButton = document.querySelector('a.cs-btn.btn-secondary[href="../supcom/supcom.html"]');
    if (supportButton) {
      supportButton.classList.add('disabled');
      supportButton.style.opacity = '0.6';
      supportButton.style.pointerEvents = 'none';
      supportButton.setAttribute('aria-disabled', 'true');
    }
    
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
    
    // Clear client-side data
    setUserUI(null);
    
    // Clear session storage
    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    
    toast('Signed out successfully');
    
    setTimeout(() => {
        window.location.href = '../';
    }, 1000);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

// User dropdown functionality
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

// Toggle desktop dropdown
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

// Simple email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Simple phone validation (international format)
const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Load user data from session
async function loadUserData() {
  try {
    const response = await fetchWithSession('/api/auth/me');
    
    if (response.ok) {
      const userData = await response.json();
      
      // Set user UI (top right corner)
      setUserUI(userData);
      
      // If we're on the settings page, populate the form fields
      if ($('userName') && $('userEmail') && $('userPhone')) {
        $('userName').value = userData.full_name || '';
        $('userEmail').value = userData.email || '';
        $('userPhone').value = userData.cellphone_number || '';
      }
      
      return userData;
    } else if (response.status === 401) {
      // Not authenticated, redirect to login
      window.location.href = '../';
      return null;
    } else {
      const error = await response.json();
      toast(error.error || 'Failed to load user data');
      return null;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    toast('Network error. Please check your connection.');
    return null;
  }
}

// Update profile: this sent data to the backend to update user profile
if ($('profileForm')) {
  $('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const full_name = $('userName').value.trim();
    const email = $('userEmail').value.trim().toLowerCase();
    const phone_number = $('userPhone').value.trim();
    
    // Validation
    if (!full_name) {
      return toast('Full name is required');
    }
    
    if (!email) {
      return toast('Email is required');
    }
    
    if (!isValidEmail(email)) {
      return toast('Please enter a valid email address');
    }
    
    if (phone_number && !isValidPhone(phone_number)) {
      return toast('Please enter a valid phone number in international format (e.g., +1234567890)');
    }
    
    const updateButton = $('profileForm').querySelector('button[type="submit"]');
  setBusy(updateButton, true, 'Saving...');
    
    try {
      // This endpoint needs to be implemented in your backend
      const response = await fetchWithSession('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name, email, phone_number })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast('Profile updated successfully');
        
        // Update session data with new values
        if (result.user) {
          setUserUI(result.user);
        }
      } else {
        const error = await response.json();
        toast(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast('Network error. Please check your connection.');
    } finally {
      setBusy(updateButton, false);
    }
  });
}

// Update password (this will need to be implemented in your backend)
if ($('passwordForm')) {
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
    
    if (newPassword.length > 12) {
      return toast('New password must not exceed 12 characters');
    }
    
    if (newPassword !== confirmPassword) {
      if ($('passwordError')) {
        show($('passwordError'));
        $('passwordError').textContent = 'Passwords do not match';
      }
      return;
    } else if ($('passwordError')) {
      hide($('passwordError'));
    }
    
    const updateButton = $('passwordForm').querySelector('button[type="submit"]');
    setBusy(updateButton, true, 'Updating...');
    
    try {
      // This endpoint needs to be implemented in your backend
      const response = await fetchWithSession('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (response.ok) {
        toast('Password updated successfully');
        $('passwordForm').reset();
      } else {
        const error = await response.json();
        toast(error.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast('Network error. Please check your connection.');
    } finally {
      setBusy(updateButton, false);
    }
  });
}

// Delete account (this will need to be implemented in your backend)
if ($('confirmDelete')) {
  $('confirmDelete').addEventListener('click', async () => {
    const password = $('deletePassword').value;
    
    if (!password) {
      return toast('Please enter your password to confirm');
    }
    
    setBusy($('confirmDelete'), true, 'Deleting...');
    
    try {
      // This endpoint needs to be implemented in your backend
      const response = await fetchWithSession('/api/user/account', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        toast('Account deleted successfully');
        setTimeout(() => {
          window.location.href = '../';
        }, 1500);
      } else {
        const error = await response.json();
        toast(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast('Network error. Please check your connection.');
    } finally {
      setBusy($('confirmDelete'), false);
    }
  });
}

// Initialize
(async function init() {
  // Check if user is authenticated and load user data
  try {
    const userInfo = await loadUserData();
    
    if (!userInfo || !userInfo.authenticated) {
      window.location.href = '../';
      return;
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    window.location.href = '../';
  }
})();

// Add event listener to clear error message when user starts typing in password fields
if ($('passwordError')) {
  ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
    if ($(id)) {
      $(id).addEventListener('input', () => {
        hide($('passwordError'));
      });
    }
  });
}

// Add event listener for modal close to clear password field
const deleteAccountModal = document.getElementById('deleteAccountModal');
if (deleteAccountModal) {
  deleteAccountModal.addEventListener('hidden.bs.modal', () => {
    if ($('deletePassword')) {
      $('deletePassword').value = '';
    }
  });
}
