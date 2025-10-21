// =============================================================
// ✅ LearnHub / CyberShield Payment System with Yoco Inline Integration
// =============================================================

const $ = id => document.getElementById(id);
const show = el => el && el.classList.remove('hidden');
const hide = el => el && el.classList.add('hidden');

const toast = (msg, ms = 2000) => {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
};

// =============================================================
// 🧩 Security Utilities
// =============================================================
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =============================================================
// 💳 Payment Reference Generator
// =============================================================
function generatePaymentReference(planCode) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const planPrefix = planCode.replace('CSLG-', '').split('-')[0];
  return `${planCode}-${timestamp}-${random}`;
}

// =============================================================
// 🌐 Fetch Helper with Session
// =============================================================
async function fetchWithSession(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
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

// =============================================================
// 👤 User UI Setup
// =============================================================
const welcomeMessage = $('welcomeMessage');
const userNameDisplay = $('userNameDisplay');
const logoutBtn = $('logout');
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

function setUserUI(userData) {
  if (userData && userData.authenticated) {
    const welcomeText = `Welcome, ${userData.full_name || userData.email}!`;
    const displayName = userData.full_name || userData.email.split('@')[0];
    if (welcomeMessage) welcomeMessage.textContent = welcomeText;
    if (userNameDisplay) userNameDisplay.textContent = displayName;
  } else {
    if (welcomeMessage) welcomeMessage.textContent = '';
    if (userNameDisplay) userNameDisplay.textContent = 'User Name';
  }
}

// =============================================================
// 🚪 Logout Logic
// =============================================================
async function handleLogout() {
  try {
    const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();
    const logoutResponse = await fetchWithSession('/api/auth/logout', {
      method: 'POST'
    });
    if (logoutResponse.ok && currentSessionId) {
      await fetch('/api/session/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    }
  } catch (e) {
    console.log('Logout failed, proceeding with client');
  }

  setUserUI(null);
  sessionStorage.clear();
  localStorage.removeItem('selectedPlan');
  toast('Signed out successfully');
  setTimeout(() => (window.location.href = '../index.html'), 1000);
}

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

if (userDropdownBtn && userDropdown) {
  userDropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    userDropdown.style.display =
      userDropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', e => {
    if (!userDropdownBtn.contains(e.target) && !userDropdown.contains(e.target))
      userDropdown.style.display = 'none';
  });
  userDropdown.addEventListener('click', e => e.stopPropagation());
}

// =============================================================
// 🧾 Display Selected Plan
// =============================================================
function displaySelectedPlan() {
  const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
  if (!selectedPlan.id) {
    toast('No plan selected. Redirecting to subscription page...');
    setTimeout(() => {
      window.location.href = '../Subscription/Subscription.html';
    }, 2000);
    return;
  }

  if ($('planNameDisplay')) $('planNameDisplay').textContent = selectedPlan.name;
  if ($('planPriceDisplay'))
    $('planPriceDisplay').textContent = `R${selectedPlan.price} / month`;
  if ($('planCodeDisplay')) $('planCodeDisplay').textContent = selectedPlan.code;

  const paymentReference = generatePaymentReference(selectedPlan.code);
  if ($('paymentReference'))
    $('paymentReference').textContent = paymentReference;
  if ($('paymentReferenceDisplay'))
    $('paymentReferenceDisplay').textContent = paymentReference;

  sessionStorage.setItem('paymentReference', paymentReference);
  return { selectedPlan, paymentReference };
}

// =============================================================
// 💳 Yoco Inline Card Form Integration
// =============================================================
function initYocoInline() {
  const { selectedPlan, paymentReference } = displaySelectedPlan();
  if (!selectedPlan.id) return;

  // Initialize Yoco SDK
  const yoco = new window.YocoSDK({
    publicKey: 'pk_test_ed3c54a6gOol69qa7f45' // ✅ your working public key
  });

  // Mount inline card form
  const inline = yoco.inline({
    layout: 'basic',
    amountInCents: selectedPlan.price * 100,
    currency: 'ZAR'
  });
  inline.mount('#yoco_inline');

  const form = $('yocoForm');
  const resultMessage = $('paymentResult');

  if (!form) {
    console.error('Form element #yocoForm not found');
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelector('button').disabled = true;
    resultMessage.textContent = 'Processing payment...';

    inline
      .createToken()
      .then(async response => {
        form.querySelector('button').disabled = false;

        if (response.error) {
          console.error('Yoco error:', response.error.message);
          resultMessage.textContent = response.error.message;
        } else {
          console.log('Token created:', response.id);

          // Send token to backend for charge
          try {
            const res = await fetchWithSession('/api/payment/process', {
              method: 'POST',
              body: JSON.stringify({
                token: response.id,
                planId: selectedPlan.id,
                reference: paymentReference,
                amount: selectedPlan.price * 100
              })
            });

            const data = await res.json();
            if (data.status === 'successful' || res.ok) {
              resultMessage.textContent = 'Payment successful!';
              toast('Payment successful! Redirecting to Scanner Dash...');
              // Persist plan info locally immediately if server returned it
              if (data.plan_mode !== undefined) {
                try {
                  sessionStorage.setItem('plan_mode', data.plan_mode);
                  if (data.plan_name) sessionStorage.setItem('plan_name', data.plan_name);
                } catch (e) {
                  console.warn('Failed to set plan in sessionStorage', e);
                }
              }
              // Refresh user session/server-side info to ensure plan_mode is current
              try {
                const refresh = await fetchWithSession('/api/auth/me');
                if (refresh.ok) {
                  // Wait a brief moment for session to persist and then redirect
                  await new Promise(r => setTimeout(r, 500));
                }
              } catch (e) {
                console.warn('Failed to refresh user session before redirect', e);
              }
              setTimeout(
                () => (window.location.href = '../ScannerDash/ScannerDash.html'),
                1500
              );
            } else {
              resultMessage.textContent =
                data.displayMessage || 'Payment failed.';
            }
          } catch (err) {
            resultMessage.textContent = 'Network error during payment.';
            console.error(err);
          }
        }
      })
      .catch(err => {
        form.querySelector('button').disabled = false;
        resultMessage.textContent = 'Payment failed. Try again.';
        console.error(err);
      });
  });
}

// =============================================================
// 🚀 Page Boot
// =============================================================
(async function boot() {
  console.log('Payment page initializing...');

  try {
    const r = await fetchWithSession('/api/auth/me');
    if (r.ok) {
      const userData = await r.json();
      if (userData.authenticated) {
        setUserUI(userData);
        sessionStorage.setItem('userEmail', userData.email);
        displaySelectedPlan();
        initYocoInline(); // ✅ initialize inline Yoco card form
        return;
      }
    }
    window.location.href = '../index.html';
  } catch (e) {
    console.error('Auth fetch failed', e);
    window.location.href = '../index.html';
  }
})();

// =============================================================
// 🧹 Security Cleanup
// =============================================================
window.addEventListener('beforeunload', function () {
  sessionStorage.removeItem('paymentReference');
});
if (window.history.replaceState)
  window.history.replaceState(null, null, window.location.href);
