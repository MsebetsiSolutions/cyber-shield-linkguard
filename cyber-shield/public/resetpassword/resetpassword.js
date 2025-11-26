const $ = (id) => document.getElementById(id);
const setBusy = (btn, busy, text) => {
  btn.disabled = !!busy;
  if (text) {
    btn.dataset._orig = btn.dataset._orig || btn.textContent;
    btn.textContent = busy ? text : btn.dataset._orig;
  }
};

const toast = (msg, ms = 2000) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), ms);
};

// Modal Management Functions
function openModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.classList.remove('active');
  });
  document.body.style.overflow = 'auto';
}

// Password toggle functionality
function setupPasswordToggle(toggleBtnId, inputId) {
  const toggleBtn = $(toggleBtnId);
  const inputField = $(inputId);

  if (!toggleBtn || !inputField) return;

  toggleBtn.addEventListener("click", () => {
    const isPassword = inputField.getAttribute("type") === "password";
    inputField.setAttribute("type", isPassword ? "text" : "password");

    toggleBtn.classList.toggle("bi-eye", !isPassword);
    toggleBtn.classList.toggle("bi-eye-slash", isPassword);

    // Maintain cursor position
    const pos = inputField.value.length;
    inputField.focus();
    try {
      inputField.setSelectionRange(pos, pos);
    } catch (e) {}
  });

  // Also allow Enter key to toggle when focused
  toggleBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleBtn.click();
    }
  });
}

// Get token from URL parameters
const getTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("token");
};

// Password validation - Updated to match backend requirements (6-12 characters)
const validatePassword = (password) => {
  return password.length >= 6 && password.length <= 12;
};

// Update password input styling based on validation
const updatePasswordInput = (input, isValid) => {
  input.classList.remove("error", "success");
  if (input.value.length > 0) {
    input.classList.add(isValid ? "success" : "error");
  }
};

// Support Form Validation
function validateSupportForm() {
  const email = $('supportEmail').value.trim();
  const heading = $('supportHeading').value.trim();
  const description = $('supportDescription').value.trim();

  if (!email) {
    toast('Please enter your email address');
    return false;
  }

  if (!validateEmail(email)) {
    toast('Please enter a valid email address');
    return false;
  }

  if (!heading) {
    toast('Please enter a subject for your support request');
    return false;
  }

  if (!description) {
    toast('Please describe your issue');
    return false;
  }

  if (description.length < 10) {
    toast('Please provide a more detailed description (at least 10 characters)');
    return false;
  }

  return true;
}

// Email validation helper
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Handle Support Form Submission
async function handleSupportSubmit() {
  if (!validateSupportForm()) return;

  const email = $('supportEmail').value.trim();
  const heading = $('supportHeading').value.trim();
  const description = $('supportDescription').value.trim();

  setBusy($('submitSupport'), true, 'Sending...');

  try {
    const response = await fetch('/api/auth/support-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        heading: heading,
        description: description
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return toast(result.error || 'Failed to submit support request');
    }

    toast('Support request submitted successfully! We will contact you within 3 hours.');
    
    // Clear form
    $('supportForm').reset();
    
    // Close modal
    closeModal('supportModal');
    
  } catch (error) {
    console.error('Support request error:', error);
    toast('Network error occurred. Please try again.');
  } finally {
    setBusy($('submitSupport'), false);
  }
}

// Password input event listeners
$("newPassword").addEventListener("input", (e) => {
  const password = e.target.value;
  const isValid = validatePassword(password);

  updatePasswordInput(e.target, isValid);

  // Check if passwords match when confirm password has value
  const confirmPassword = $("confirmPassword").value;
  if (confirmPassword) {
    updatePasswordInput($("confirmPassword"), password === confirmPassword);
  }
});

$("confirmPassword").addEventListener("input", (e) => {
  const password = $("newPassword").value;
  const confirmPassword = e.target.value;
  const passwordsMatch = password === confirmPassword;

  updatePasswordInput(e.target, passwordsMatch && confirmPassword.length > 0);
});

// Reset password function
$("doReset").addEventListener("click", async () => {
  const token = getTokenFromUrl();
  const newPassword = $("newPassword").value.trim();
  const confirmPassword = $("confirmPassword").value.trim();

  // Validation
  if (!token) {
    return toast("Invalid or missing reset token");
  }

  if (!newPassword || !confirmPassword) {
    return toast("Please fill in both password fields");
  }

  if (newPassword !== confirmPassword) {
    return toast("Passwords do not match");
  }

  if (!validatePassword(newPassword)) {
    return toast("Password must be between 6 and 12 characters");
  }

  setBusy($("doReset"), true, "Updating...");

  try {
    // Send new password to backend with token in request body
    const response = await fetch('/api/auth/reset-password', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token: token,
        newPassword: newPassword 
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return toast(result.error || "Failed to reset password");
    }

    toast("Password updated successfully! Redirecting to login...");

    // Redirect to home page after success
    setTimeout(() => {
      window.location.href = "../";
    }, 2000);
  } catch (error) {
    console.error("Reset password error:", error);
    toast("Network error occurred. Please try again.");
  } finally {
    setBusy($("doReset"), false);
  }
});

// Allow form submission with Enter key
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    (e.target.id === "newPassword" || e.target.id === "confirmPassword")
  ) {
    e.preventDefault();
    $("doReset").click();
  }
});

// Setup Event Listeners for Support Features
function setupSupportFeatures() {
  // Support button click
  $('supportBtn').addEventListener('click', () => {
    openModal('supportModal');
  });

  // Close support modal
  $('closeSupportModal').addEventListener('click', () => {
    closeModal('supportModal');
  });

  // Support form submission
  $('submitSupport').addEventListener('click', handleSupportSubmit);

  // Close modal on outside click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAllModals();
      }
    });
  });

  // Close modal on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Support form enter key support
  const supportInputs = [$('supportEmail'), $('supportHeading'), $('supportDescription')];
  supportInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSupportSubmit();
      }
    });
  });
}

// Check for token on page load and update UI accordingly
document.addEventListener("DOMContentLoaded", () => {
  const token = getTokenFromUrl();

  if (!token) {
    toast("Invalid reset link. Please request a new password reset.");
    // Disable the form
    $("newPassword").disabled = true;
    $("confirmPassword").disabled = true;
    $("doReset").disabled = true;
    
    setTimeout(() => {
      window.location.href = "../";
    }, 3000);
    return;
  }

  // Initialize password toggles
  setupPasswordToggle("toggleNewPassword", "newPassword");
  setupPasswordToggle("toggleConfirmPassword", "confirmPassword");
  
  // Initialize support features
  setupSupportFeatures();
  
  console.log("Reset token found:", token);
});
