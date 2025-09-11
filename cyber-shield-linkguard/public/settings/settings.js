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

// Session-based fetch function (no JWT tokens needed)
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
    
    welcomeMessage.textContent = welcomeText;
    userNameDisplay.textContent = displayName;
    
    console.log('User UI updated:', {
      welcomeText,
      displayName,
      full_name: userData.full_name
    });
  } else { 
    welcomeMessage.textContent = ''; 
    userNameDisplay.textContent = 'User Name'; // Fallback text
    console.log('User not authenticated, using fallback');
  }
}

// Logout functionality
function handleLogout() {
  try {
    fetchWithSession('/api/auth/logout', {
      method: 'POST'
    }).then(response => {
      if (response.ok) {
        console.log('Logout successful');
      } else {
        console.log('Logout API call failed, proceeding with client-side cleanup');
      }
    }).catch(e => {
      console.log('Logout API call failed, proceeding with client-side cleanup');
    });
  } catch (e) {
    console.log('Logout API call failed, proceeding with client-side cleanup');
  }
  
  setUserUI(null); 
  toast('Signed out');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
}

logoutBtn.addEventListener('click', handleLogout);

// User dropdown functionality
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

// Toggle desktop dropdown
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

// Load user data
async function loadUserData() {
  try {
    const response = await fetchWithSession('/api/user/profile');
    
    if(response.ok) {
      const userData = await response.json();
      $('userName').value = userData.full_name || '';
      $('userEmail').value = userData.email || '';
      $('userPhone').value = userData.phone_number || '';
    } else if (response.status === 401) {
      // Not authenticated, redirect to login
      window.location.href = '../index.html';
    } else {
      const error = await response.json();
      toast(error.error || 'Failed to load user data');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    toast('Network error. Please check your connection.');
  }
}

// Update profile
$('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const full_name = $极('userName').value.trim();
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
    const response = await fetchWithSession('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name, email, phone_number })
    });
    
    if (response.ok) {
      const result = await response.json();
      toast('Profile updated successfully');
      // Update the form with the returned data
      $('userName').value = result.user.full_name || '';
      $('userEmail').value = result.user.email || '';
      $('userPhone').value = result.user.phone_number || '';
      
      // Update the user display name
      if (userNameDisplay) {
        userNameDisplay.textContent = result.user.full_name || result.user.email.split('@')[0];
      }
      if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${result.user.full_name || result.user.email}!`;
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
  
  if (newPassword.length > 12) {
    return toast('New password must not exceed 12 characters');
  }
  
  if (newPassword !== confirmPassword) {
    show($('passwordError'));
    $('passwordError').textContent = 'Passwords do not match';
    return;
  } else {
    hide($('passwordError'));
  }
  
  const updateButton = $('passwordForm').querySelector('button[type="submit"]');
  setBusy(updateButton, true, 'Updating...');
  
  try {
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

// Delete account
$('confirmDelete').addEventListener('click', async () => {
  const password = $('deletePassword').value;
  
  if (!password) {
    return toast('Please enter your password to confirm');
  }
  
  setBusy($('confirmDelete'), true, 'Deleting...');
  
  try {
    const response = await fetchWithSession('/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    });
    
    if (response.ok) {
      toast('Account deleted successfully');
      setTimeout(() => {
        window.location.href = '../index.html';
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

// Initialize
(async function init() {
  // Check if user is authenticated
  try {
    const response = await fetchWithSession('/api/auth/me');
    
    if (response.ok) {
      const userInfo = await response.json();
      if (!userInfo.authenticated) {
        window.location.href = '../index.html';
        return;
      }
      setUserUI(userInfo);
      await loadUserData();
    } else {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    window.location.href = '../index.html';
  }
})();

// Add event listener to clear error message when user starts typing in password fields
['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
  $(id).addEventListener('input', () => {
    hide($('passwordError'));
  });
});

// Add event listener for modal close to clear password field
const deleteAccountModal = document.getElementById('deleteAccountModal');
if (deleteAccountModal) {
  deleteAccountModal.addEventListener('hidden.bs.modal', () => {
    $('deletePassword').value = '';
  });
}
