const $ = id => document.getElementById(id);
const show = el => el && el.classList.remove('hidden');
const hide = el => el && el.classList.add('hidden');

// Session-based fetch
async function fetchWithSession(path, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers
  };

  const response = await fetch(path, {
    ...opts,
    headers,
    credentials: 'include'  // ensures cookies/session are sent
  });
  return response;
}

// Update the plan badge based on user's plan mode
function updatePlanBadge(planMode) {
  const planBadge = document.getElementById('planMode');
  if (!planBadge) return;
  
  const planMap = {
    0: {text: 'FREE PLAN', class: 'free-plan'},
    1: {text: 'PRO PLAN', class: 'pro-plan'},
    2: {text: 'TEAM PLAN', class: 'team-plan'},
    3: {text: 'ENTERPRISE', class: 'enterprise-plan'}
  };
  
  const plan = planMap[planMode] || planMap[0];
  
  // Remove all plan classes
  planBadge.classList.remove('free-plan', 'pro-plan', 'team-plan', 'enterprise-plan');
  
  // Add the current plan class
  planBadge.classList.add(plan.class);
  planBadge.textContent = plan.text;
  
  // Update plan features based on plan
  updatePlanFeatures(planMode);
}

// Update plan features based on selected plan
function updatePlanFeatures(planMode) {
  const planFeatures = document.querySelector('.plan-features');
  if (!planFeatures) return;
  
  const features = {
    0: [
      {icon: 'check-circle-fill', text: 'Basic scanning', available: true},
      {icon: 'check-circle-fill', text: '5 scans per day', available: true},
      {icon: 'x-circle', text: 'Advanced threat detection', available: false},
      {icon: 'x-circle', text: 'Priority support', available: false}
    ],
    1: [
      {icon: 'check-circle-fill', text: 'Advanced scanning', available: true},
      {icon: 'check-circle-fill', text: 'Unlimited scans', available: true},
      {icon: 'check-circle-fill', text: 'Advanced threat detection', available: true},
      {icon: 'x-circle', text: 'Priority support', available: false}
    ],
    2: [
      {icon: 'check-circle-fill', text: 'Advanced scanning', available: true},
      {icon: 'check-circle-fill', text: 'Unlimited scans', available: true},
      {icon: 'check-circle-fill', text: 'Advanced threat detection', available: true},
      {icon: 'check-circle-fill', text: 'Team management', available: true}
    ],
    3: [
      {icon: 'check-circle-fill', text: 'All features', available: true},
      {icon: 'check-circle-fill', text: 'Unlimited everything', available: true},
      {icon: 'check-circle-fill', text: '24/7 priority support', available: true},
      {icon: 'check-circle-fill', text: 'Custom solutions', available: true}
    ]
  };
  
  const planFeaturesList = features[planMode] || features[0];
  let featuresHTML = '';
  
  planFeaturesList.forEach(feature => {
    featuresHTML += `
      <p><i class="bi bi-${feature.icon}"></i> ${feature.text}</p>
    `;
  });
  
  planFeatures.innerHTML = featuresHTML;
}

// Animate counter
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Check user plan function
async function checkUserPlan() {
  try {
    const response = await fetchWithSession('/api/subscription/current');
    if (response.ok) {
      const data = await response.json();
      updatePlanBadge(data.plan_mode);
      sessionStorage.setItem('plan_mode', data.plan_mode);
      return data.plan_mode;
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
  }
  return 0; // Default to free plan
}

// Fetch user stats
async function fetchUserStats() {
  try {    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const stats = {
      scansCount: 0
    };
    
    // Animate the counter
    animateValue($('scansCount'), 0, stats.scansCount, 1500);
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    $('scansCount').textContent = 'N/A';
  }
}

async function loadProfile() {
  try {
    const res = await fetchWithSession("/api/auth/me");

    if (res.ok) {
      const user = await res.json();
      if (user && user.authenticated) {
        const displayName = user.full_name || user.email.split("@")[0];

        // Update profile fields
        $("profileName").textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        $("profileEmail").textContent = user.email;
        $("profileAvatar").textContent = displayName.charAt(0).toUpperCase();

        // Check subscription plan and update badge
        const planMode = await checkUserPlan();
        updatePlanBadge(planMode);
        
        // Fetch and display user stats
        await fetchUserStats();
        
        // Hide loading, show content
        hide($('loadingState'));
        show($('profileContent'));
        
        // Animate the profile card entrance
        $('profileContent').style.opacity = '0';
        $('profileContent').style.transform = 'translateY(20px)';
        $('profileContent').style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
          $('profileContent').style.opacity = '1';
          $('profileContent').style.transform = 'translateY(0)';
        }, 100);

      } else {
        $("profileCard").innerHTML = `
          <div class="text-center p-4">
            <i class="bi bi-exclamation-circle text-danger" style="font-size: 3rem;"></i>
            <h3 class="mt-3">Not logged in</h3>
            <p>Redirecting to login page...</p>
          </div>
        `;
        setTimeout(() => window.location.href = "../index.html", 1500);
      }
    } else if (res.status === 401) {
      $("profileCard").innerHTML = `
        <div class="text-center p-4">
          <i class="bi bi-clock-history text-warning" style="font-size: 3rem;"></i>
          <h3 class="mt-3">Session expired</h3>
          <p>Redirecting to login page...</p>
        </div>
      `;
      setTimeout(() => window.location.href = "../index.html", 1500);
    } else {
      const err = await res.json();
      $("profileCard").innerHTML = `
        <div class="text-center p-4">
          <i class="bi bi-x-circle text-danger" style="font-size: 3rem;"></i>
          <h3 class="mt-3">Error loading profile</h3>
          <p>${err.error || "Please try again later."}</p>
        </div>
      `;
    }
  } catch (err) {
    console.error("Profile load error:", err);
    $("profileCard").innerHTML = `
      <div class="text-center p-4">
        <i class="bi bi-wifi-off text-danger" style="font-size: 3rem;"></i>
        <h3 class="mt-3">Network error</h3>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  }
}

// Add event listeners for interactive elements
document.addEventListener("DOMContentLoaded", function() {
  loadProfile();
  
  // Upgrade button functionality - redirect to subscription page
  document.querySelector('.btn-upgrade')?.addEventListener('click', function() {
    window.location.href = '../subscription/subscription.html';
  });
  
  // Add hover effect to plan card
  const planCard = document.querySelector('.plan-card');
  if (planCard) {
    planCard.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
    });
    
    planCard.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
    });
  }
});
