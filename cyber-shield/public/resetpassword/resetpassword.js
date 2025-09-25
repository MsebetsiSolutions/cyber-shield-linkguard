const $ = id => document.getElementById(id);
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

// Get token from URL parameters
const getTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

// Password validation - Updated to match backend requirements (6-12 characters)
const validatePassword = (password) => {
  return password.length >= 6 && password.length <= 12;
};

// Update password input styling based on validation
const updatePasswordInput = (input, isValid) => {
  input.classList.remove('error', 'success');
  if (input.value.length > 0) {
    input.classList.add(isValid ? 'success' : 'error');
  }
};

// Password input event listeners
$('newPassword').addEventListener('input', (e) => {
  const password = e.target.value;
  const isValid = validatePassword(password);
  
  updatePasswordInput(e.target, isValid);
  
  // Check if passwords match when confirm password has value
  const confirmPassword = $('confirmPassword').value;
  if (confirmPassword) {
    updatePasswordInput($('confirmPassword'), password === confirmPassword);
  }
});

$('confirmPassword').addEventListener('input', (e) => {
  const password = $('newPassword').value;
  const confirmPassword = e.target.value;
  const passwordsMatch = password === confirmPassword;
  
  updatePasswordInput(e.target, passwordsMatch && confirmPassword.length > 0);
});

// Reset password function
$('doReset').addEventListener('click', async () => {
  const token = getTokenFromUrl();
  const newPassword = $('newPassword').value.trim();
  const confirmPassword = $('confirmPassword').value.trim();
  
  // Validation
  if (!token) {
    return toast('Invalid or missing reset token');
  }
  
  if (!newPassword || !confirmPassword) {
    return toast('Please fill in both password fields');
  }
  
  if (newPassword !== confirmPassword) {
    return toast('Passwords do not match');
  }
  
  if (!validatePassword(newPassword)) {
    return toast('Password must be between 6 and 12 characters');
  }
  
  setBusy($('doReset'), true, 'Updating...');
  
    try {
      // Send new password to backend, including token in the URL
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ newPassword })
      });
    
    const result = await response.json();
    
    if (!response.ok) {
      return toast(result.error || 'Failed to reset password');
    }
    
    toast('Password updated successfully!');
    
    // Redirect to login after success
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 2000);
    
  } catch (error) {
    toast('Network error occurred');
  } finally {
    setBusy($('doReset'), false);
  }
});

// Allow form submission with Enter key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.target.id === 'newPassword' || e.target.id === 'confirmPassword')) {
    e.preventDefault();
    $('doReset').click();
  }
});

// Check for token on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = getTokenFromUrl();
  
  if (!token) {
    toast('Invalid reset link. Please request a new password reset.');
    setTimeout(() => {
      window.location.href = '../forgot-password/forgotPassword.html';
    }, 3000);
  }
});