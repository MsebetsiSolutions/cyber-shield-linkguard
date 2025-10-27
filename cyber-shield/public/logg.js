const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");
const setBusy = (btn, busy, text) => {
  btn.disabled = !!busy;
  if (text) {
    btn.dataset._orig = btn.dataset._orig || btn.textContent;
    btn.textContent = busy ? text : btn.dataset._orig;
  }
};

const toast = (msg, ms = 3000) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), ms);
};

const token = {
  get access() {
    return localStorage.getItem("access") || "";
  },
  set access(v) {
    v ? localStorage.setItem("access", v) : localStorage.removeItem("access");
  },
  get refresh() {
    return localStorage.getItem("refresh") || "";
  },
  set refresh(v) {
    v ? localStorage.setItem("refresh", v) : localStorage.removeItem("refresh");
  },
  clear() {
    this.access = "";
    this.refresh = "";
  },
};

// Typewriter Effect
function initTypewriter() {
  const typewriterElement = $("typewriter-text");
  if (!typewriterElement) return;

  const text = "Cyber Shield LinkGuard";
  let charIndex = 0;
  let isDeleting = false;
  let isPaused = false;

  function type() {
    if (isPaused) return;

    const currentText = text.substring(0, charIndex);
    typewriterElement.textContent = currentText;
    typewriterElement.classList.add("typewriter");

    if (!isDeleting && charIndex < text.length) {
      // Typing
      charIndex++;
      setTimeout(type, 100);
    } else if (isDeleting && charIndex > 0) {
      // Deleting
      charIndex--;
      setTimeout(type, 50);
    } else if (!isDeleting && charIndex === text.length) {
      // Pause at the end of typing
      isPaused = true;
      setTimeout(() => {
        isPaused = false;
        isDeleting = true;
        type();
      }, 2000);
    } else if (isDeleting && charIndex === 0) {
      // Pause at the beginning after deleting
      isPaused = true;
      setTimeout(() => {
        isPaused = false;
        isDeleting = false;
        type();
      }, 500);
    }
  }

  // Start the typewriter effect
  type();
}

// Cybersmart Slider Functionality
function initCybersmartSlider() {
  const slides = document.querySelectorAll('.cybersmart-slide');
  const indicators = document.querySelectorAll('.indicator');
  let currentSlide = 0;

  function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Show current slide
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
    currentSlide = index;
  }

  // Add click events to indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
    });
  });

  setInterval(() => {
    const nextSlide = (currentSlide + 1) % slides.length;
    showSlide(nextSlide);
  }, 6000);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showSlide(0); 
        }
      });
    },
    {
      threshold: 0.3,
    }
  );

  const cybersmartSection = document.getElementById('cybersmart');
  if (cybersmartSection) {
    observer.observe(cybersmartSection);
  }
}

// Modal Management
function openModal(modalId) {
  const modal = $(modalId);
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  const modal = $(modalId);
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal-overlay");
  modals.forEach((modal) => {
    modal.classList.remove("active");
  });
  document.body.style.overflow = "auto";
}

// Navigation Menu
function toggleMenu() {
  const nav = document.getElementById("nav");
  const hamburger = $("hamburger");
  nav.classList.toggle("active");
  hamburger.classList.toggle("active");
}

function closeMenu() {
  const nav = document.getElementById("nav");
  const hamburger = $("hamburger");
  nav.classList.remove("active");
  hamburger.classList.remove("active");
}

// Password Toggle Functionality
function setupPasswordToggle(toggleBtnId, inputId) {
  const toggleBtn = $(toggleBtnId);
  const inputField = $(inputId);

  if (!toggleBtn || !inputField) return;

  toggleBtn.addEventListener("click", () => {
    const isPassword = inputField.getAttribute("type") === "password";
    inputField.setAttribute("type", isPassword ? "text" : "password");

    toggleBtn.classList.toggle("bi-eye", !isPassword);
    toggleBtn.classList.toggle("bi-eye-slash", isPassword);

    const pos = inputField.value.length;
    inputField.focus();
    try {
      inputField.setSelectionRange(pos, pos);
    } catch (e) {}
  });
}

// Email Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Form Validation
function validateLoginForm() {
  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPass").value;

  if (!email) {
    toast("Please enter your email address");
    return false;
  }

  if (!validateEmail(email)) {
    toast("Please enter a valid email address");
    return false;
  }

  if (!password) {
    toast("Please enter your password");
    return false;
  }

  return true;
}

function validateForgotPasswordForm() {
  const email = $("resetEmail").value.trim().toLowerCase();

  if (!email) {
    toast("Please enter your email address");
    return false;
  }

  if (!validateEmail(email)) {
    toast("Please enter a valid email address");
    return false;
  }

  return true;
}

// Simple AOS (Animate On Scroll) implementation
function initAOS() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("aos-animate");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  document.querySelectorAll("[data-aos]").forEach((el) => {
    observer.observe(el);
  });
}

// Login Functionality
async function handleLogin() {
  if (!validateLoginForm()) return;

  const emailInput = $("loginEmail");
  const passwordInput = $("loginPass");
  const doLoginBtn = $("doLogin");

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  setBusy(doLoginBtn, true, "Signing in…");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      toast(data.error || "Login failed");
      return;
    }

    toast("Welcome back! Redirecting to dashboard...");

    // Get current session ID and redirect with it
    const sessionId = window.CyberShieldSession?.getCurrentSessionId();
    const redirectUrl = sessionId
      ? "ScannerDash/ScannerDash.html?session=" + sessionId
      : "ScannerDash/ScannerDash.html";

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  } catch (error) {
    console.error("Login error:", error);
    toast("Network error. Please check your connection.");
  } finally {
    setBusy(doLoginBtn, false);
  }
}

// Forgot Password Functionality
async function handleForgotPassword() {
  if (!validateForgotPasswordForm()) return;

  const email = $("resetEmail").value.trim().toLowerCase();

  setBusy($("doReset"), true, "Sending...");

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      return toast(data.error || "Failed to send reset link");
    }

    toast("Password reset link has been sent to your email!");
    setTimeout(() => {
      closeModal("forgotPasswordModal");
      openModal("loginModal");
      $("resetEmail").value = "";
    }, 2000);
  } catch (error) {
    console.error("Forgot password error:", error);
    toast("Network error. Please check your connection.");
  } finally {
    setBusy($("doReset"), false);
  }
}

// Mobile dropdown functionality
function setupMobileDropdown() {
  const dropdown = $("simulatorsDropdown");
  const dropbtn = dropdown.querySelector(".dropbtn");

  dropbtn.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      dropdown.classList.toggle("active");
    }
  });
}

// Simulator Signup Button Functionality
function setupSimulatorSignup() {
  const simulatorSignupBtn = $("simulatorSignupBtn");

  if (simulatorSignupBtn) {
    simulatorSignupBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = $("simulatorsDropdown");
      dropdown.classList.remove("active");

      closeMenu();

      window.location.href = "create.html";

      toast(
        "Ready to upgrade your security! Sign up for team/enterprise features."
      );
    });
  }
}

function redirectToSignup() {
  window.location.href = "create.html";
}

// Listeners
function setupEventListeners() {
  // Menu Toggle
  $("hamburger").addEventListener("click", toggleMenu);

  // Modal Controls
  $("aboutBtn").addEventListener("click", () => openModal("aboutModal"));
  $("closeAboutModal").addEventListener("click", () =>
    closeModal("aboutModal")
  );

  // Developers Modal
  $("developersBtn").addEventListener("click", () =>
    openModal("developersModal")
  );
  $("closeDevelopersModal").addEventListener("click", () =>
    closeModal("developersModal")
  );

  // Login Modal
  $("desktopLoginBtn").addEventListener("click", () => openModal("loginModal"));
  $("mobileLoginBtn").addEventListener("click", () => {
    openModal("loginModal");
    closeMenu();
  });
  $("closeLoginModal").addEventListener("click", () =>
    closeModal("loginModal")
  );

  $("desktopSignupBtn").addEventListener("click", redirectToSignup);
  $("mobileSignupBtn").addEventListener("click", () => {
    redirectToSignup();
    closeMenu();
  });
  $("heroSignupBtn").addEventListener("click", redirectToSignup);

  $("forgotPasswordBtn").addEventListener("click", () => {
    closeModal("loginModal");
    openModal("forgotPasswordModal");
  });
  $("closeForgotPasswordModal").addEventListener("click", () =>
    closeModal("forgotPasswordModal")
  );
  $("backToLogin").addEventListener("click", () => {
    closeModal("forgotPasswordModal");
    openModal("loginModal");
  });

  $("switchToSignup").addEventListener("click", () => {
    closeModal("loginModal");
    redirectToSignup();
  });

  $("doLogin").addEventListener("click", handleLogin);
  $("doReset").addEventListener("click", handleForgotPassword);

  $("loginEmail").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  $("loginPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  $("resetEmail").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleForgotPassword();
    }
  });


  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeAllModals();
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        closeMenu();
      }
    });
  });

  // Prevent form submission on enter in forms
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  });

  // Mobile mode dropdown 
  setupMobileDropdown();
  setupSimulatorSignup();
}

// everything must start
document.addEventListener("DOMContentLoaded", function () {
  if (window.CyberShieldSession) {
    window.CyberShieldSession.initSession();
  }

  initTypewriter();
  initCybersmartSlider();
  setupPasswordToggle("togglePassword", "loginPass");
  initAOS();
  setupEventListeners();

  if (token.access) {
    console.log("User already logged in with access token");
  }
});