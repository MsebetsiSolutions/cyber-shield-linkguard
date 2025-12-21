const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");
const toast = (msg, ms = 2000) => {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), ms);
};

// Session-based fetch function
async function fetchWithSession(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  try {
    const response = await fetch(path, {
      ...opts,
      headers,
      credentials: "include",
    });
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Set user UI
const welcomeMessage = $("welcomeMessage");
const userNameDisplay = $("userNameDisplay");
const logoutBtn = $("logout");
const scanCounterEl = $("scanCounter");
const remainingScansEl = $("remainingScans");
const currentPlanBanner = $("currentPlanBanner");
const currentPlanText = $("currentPlanText");
const manageSubscriptionBtn = $("manageSubscriptionBtn");

function setUserUI(userData) {
  console.log("Setting user UI with data:", userData);
  if (userData && userData.authenticated) {
    const welcomeText = `Welcome, ${userData.full_name || userData.email}!`;
    const displayName = userData.full_name || userData.email.split("@")[0];
    if (welcomeMessage) welcomeMessage.textContent = welcomeText;
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    console.log("User UI updated:", {
      welcomeText,
      displayName,
      full_name: userData.full_name,
      plan_mode: userData.plan_mode,
    });

    updateCurrentPlanDisplay(userData.plan_mode);
    updatePlanBadge(userData.plan_mode);
    controlIncreaseScansButton(userData.plan_mode);
  } else {
    if (welcomeMessage) welcomeMessage.textContent = "";
    if (userNameDisplay) userNameDisplay.textContent = "User Name";
    console.log("User not authenticated, using fallback");
  }
}

// Control the Increase Scans button visibility
function controlIncreaseScansButton(planMode) {
  if (manageSubscriptionBtn) {
    if (planMode === 0) {
      manageSubscriptionBtn.classList.remove("hidden");
    } else {
      manageSubscriptionBtn.classList.add("hidden");
    }
  }
}

// current plan display based on plan_mode
function updateCurrentPlanDisplay(planMode) {
  const planMap = {
    0: { name: "Free Tier", badgeId: "freeBadge" },
    1: { name: "Pro Tier", badgeId: "proBadge" },
    2: { name: "Team Tier", badgeId: "teamBadge" },
    3: { name: "Enterprise Tier", badgeId: "enterpriseBadge" },
  };

  const currentPlan = planMap[planMode] || planMap[0];
  if (currentPlanText) {
    currentPlanText.textContent = `You're currently on the ${currentPlan.name} plan`;
  }

  document.querySelectorAll(".plan-card").forEach((card) => {
    card.classList.remove("current-plan", "pulse-animation");
    const badge = card.querySelector(".plan-badge.current-badge");
    if (badge) {
      badge.style.display = "none";
    }
  });

  const currentPlanCard = document.querySelector(
    `.plan-card[data-plan-id="${Object.keys(planMap)
      .find((key) => planMap[key].name === currentPlan.name)
      .toLowerCase()}"]`
  );
  if (currentPlanCard) {
    currentPlanCard.classList.add("current-plan", "pulse-animation");
    const badge = currentPlanCard.querySelector(".plan-badge.current-badge");
    if (badge) {
      badge.style.display = "block";
    }
  }
}

// plan badge in header
function updatePlanBadge(planMode) {
  const planBadge = document.getElementById("planMode");
  if (!planBadge) return;
  const planMap = {
    0: { text: "FREE PLAN", class: "free-plan" },
    1: { text: "PRO PLAN", class: "pro-plan" },
    2: { text: "TEAM PLAN", class: "team-plan" },
    3: { text: "ENTERPRISE", class: "enterprise-plan" },
  };
  const plan = planMap[planMode] || planMap[0];
  planBadge.classList.remove(
    "free-plan",
    "pro-plan",
    "team-plan",
    "enterprise-plan"
  );
  planBadge.classList.add(plan.class);
  planBadge.textContent = plan.text;
}

// scan counter UI based on plan mode
function updateScanCounterUI(planMode) {
  const scanCounter = $("scanCounter");
  if (planMode === 1 || planMode === 2 || planMode === 3) {
    hide(scanCounter);
  } else {
    show(scanCounter);
    const today = new Date().toDateString();
    const lastScanDate = localStorage.getItem("lastScanDate");
    let remainingScans = 1;
    if (lastScanDate !== today) {
      localStorage.setItem("lastScanDate", today);
      localStorage.setItem("remainingScans", "1");
    } else {
      remainingScans = parseInt(localStorage.getItem("remainingScans") || "1");
    }
    if (remainingScansEl) remainingScansEl.textContent = remainingScans;
    if (scanCounter) {
      scanCounter.classList.remove(
        "text-danger",
        "text-warning",
        "text-success"
      );
      if (remainingScans === 0) {
        scanCounter.classList.add("text-danger");
      }
    }
  }
}

// Check user plan function
async function checkUserPlan() {
  try {
    const response = await fetchWithSession("/api/subscription/current");
    if (response.ok) {
      const data = await response.json();
      updateScanCounterUI(data.plan_mode);
      return data.plan_mode;
    }
  } catch (error) {
    console.error("Error checking user plan:", error);
  }
  return 0;
}

// Logout functionality
async function handleLogout() {
  try {
    const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();

    const logoutResponse = await fetchWithSession("/api/auth/logout", {
      method: "POST",
    });

    if (logoutResponse.ok) {
      console.log("Logout successful");

      if (currentSessionId) {
        await fetch("/api/session/invalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
      }
    }
  } catch (e) {
    console.log("Logout failed, proceeding with client");
  }

  setUserUI(null);

  sessionStorage.removeItem("cyberShieldSession");
  sessionStorage.removeItem("userData");
  sessionStorage.removeItem("plan_mode");

  toast("Signed out successfully");

  setTimeout(() => {
    window.location.href = "../";
  }, 1000);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}

const planCodes = {
  free: { 
    code: "CSLG-FREE-001", 
    price: 0,
    monthly: 0,
    yearly: 0
  },
  pro: { 
    code: "CSLG-PRO-002", 
    price: 350,
    monthly: 350,
    yearly: 3780
  },
  team: { 
    code: "CSLG-TEAM-003", 
    price: 500,
    monthly: 500,
    yearly: 5400
  },
  enterprise: { 
    code: "CSLG-ENT-004", 
    price: 0,
    monthly: 0,
    yearly: 0
  },
  increase: { 
    code: "CSLG-INCREASE-001", 
    price: 25,
    monthly: 25,
    yearly: 25
  },
};

// Get selected billing period for a plan
function getSelectedBillingPeriod(planId) {
  if (planId === 'pro') {
    const selectedOption = document.querySelector('input[name="proTierOptions"]:checked');
    return selectedOption ? selectedOption.value : 'monthly';
  } else if (planId === 'team') {
    const selectedOption = document.querySelector('input[name="teamTierOptions"]:checked');
    return selectedOption ? selectedOption.value : 'monthly';
  }
  return 'monthly'; 
}

// Get price based on plan and billing period
function getPlanPrice(planId, billingPeriod) {
  const plan = planCodes[planId];
  if (!plan) return 0;
  
  if (billingPeriod === 'yearly' && plan.yearly !== undefined) {
    return plan.yearly;
  }
  return plan.monthly || plan.price;
}

// Get expiry date based on billing period
function getExpiryDate(billingPeriod) {
  const now = new Date();
  if (billingPeriod === 'yearly') {
    return new Date(now.setDate(now.getDate() + 365)).toISOString();
  } else {
    return new Date(now.setDate(now.getDate() + 30)).toISOString();
  }
}

// Add event listener for the Increase Scans button
if (manageSubscriptionBtn) {
  manageSubscriptionBtn.addEventListener("click", function () {
    localStorage.setItem(
      "selectedPlan",
      JSON.stringify({
        id: "increase",
        name: "Increase Scans",
        price: planCodes.increase.price,
        code: planCodes.increase.code,
        billingPeriod: 'monthly',
        duration: 'week',
        expiryDate: getExpiryDate('monthly') 
      })
    );

    window.location.href = "../payment_sys/payment_sys.html";
  });
}

// Plan selection functionality
document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('click', function (e) {
    if (e.target.type === 'radio' || e.target.tagName === 'LABEL') {
      return;
    }

    const planId = this.dataset.planId;
    const userPlanMode = parseInt(sessionStorage.getItem('plan_mode') || '0');
    const planModeMap = { free: 0, pro: 1, team: 2, enterprise: 3 };
    
    if (planModeMap[planId] === userPlanMode) {
      toast(`You're already on the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan`);
      return;
    }
    
    const planName = this.querySelector('h4').textContent;
    const billingPeriod = getSelectedBillingPeriod(planId);
    const planPrice = getPlanPrice(planId, billingPeriod);
    const planCode = planCodes[planId].code;
    const expiryDate = getExpiryDate(billingPeriod);
    const duration = billingPeriod === 'yearly' ? 'year' : 'month';
    
    localStorage.setItem('selectedPlan', JSON.stringify({
      id: planId,
      name: planName,
      price: planPrice,
      code: planCode,
      billingPeriod: billingPeriod,
      duration: duration,
      expiryDate: expiryDate
    }));
    
    console.log('Selected plan:', {
      planId,
      planName,
      price: planPrice,
      billingPeriod,
      duration,
      expiryDate
    });
    
    try {
      if (planId === 'enterprise') {
        const enterprisePath = '../enterprice/enterprice_payment/enterprice_payment.html';
        console.log('Redirecting to enterprise payment:', enterprisePath);
        
        fetch(enterprisePath, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              window.location.href = enterprisePath;
            } else {
              throw new Error('Enterprise payment page not found');
            }
          })
          .catch(error => {
            console.error('Error accessing enterprise payment page:', error);
            toast('Enterprise payment page is currently unavailable');
            setTimeout(() => {
              window.location.href = '../ScannerDash/ScannerDash.html';
            }, 2000);
          });
      } else {
        const paymentPath = '../payment_sys/payment_sys.html';
        console.log('Redirecting to payment system:', paymentPath);
        
        fetch(paymentPath, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              window.location.href = paymentPath;
            } else {
              throw new Error('Payment page not found');
            }
          })
          .catch(error => {
            console.error('Error accessing payment page:', error);
            toast('Payment page is currently unavailable');
            setTimeout(() => {
              window.location.href = '../ScannerDash/ScannerDash.html';
            }, 2000);
          });
      }
    } catch (error) {
      console.error('Error during redirect:', error);
      toast('An error occurred during redirection');
      setTimeout(() => {
        window.location.href = '../ScannerDash/ScannerDash.html';
      }, 2000);
    }
  });
});

// Initialize subscription page
(async function initSubscriptionPage() {
  console.log("Subscription page initializing...");
  try {
    const r = await fetchWithSession("/api/auth/me");
    if (r.ok) {
      const userData = await r.json();
      if (userData.authenticated) {
        sessionStorage.setItem("user_id", userData.user_id || "");
        sessionStorage.setItem("full_name", userData.full_name || "");
        sessionStorage.setItem("email", userData.email || "");
        sessionStorage.setItem("plan_mode", userData.plan_mode || "0");
        setUserUI(userData);
        await checkUserPlan();
        console.log("Subscription page initialized successfully");
        return;
      } else {
        console.log("User not authenticated, redirecting to login");
        window.location.href = "../";
        return;
      }
    } else {
      console.log("Auth check failed, redirecting to login");
      window.location.href = "../";
      return;
    }
  } catch (error) {
    console.error("Error initializing subscription page:", error);
    window.location.href = "../";
  }
})();
