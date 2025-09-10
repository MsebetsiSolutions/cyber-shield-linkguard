const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

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

// Subscription plan codes
const planCodes = {
  free: 'CSLG-FREE-001',
  pro: 'CSLG-PRO-002',
  team: 'CSLG-TEAM-003',
  enterprise: 'CSLG-ENT-004'
};

// Set user UI
const whoRow = $('whoRow');
const logoutBtn = $('logout');

function setUserUI(email){ 
  if(email){ 
    whoRow.textContent = 'Signed in: ' + email; 
    show(logoutBtn);
  } else { 
    // Don't show "Guest mode" text, just keep it empty
    whoRow.textContent = ''; 
    show(logoutBtn);
  }
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
  token.clear(); 
  setUserUI(''); 
  toast('Signed out');
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1000);
});

// Plan selection functionality
document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('click', function() {
    const planId = this.dataset.planId;
    
    if (planId === 'free') {
      toast('You are currently on the Free plan');
      return;
    }
    
    if (planId === 'enterprise') {
      toast('Please contact our sales team for enterprise pricing');
      return;
    }
    
    // Store selected plan details
    const planName = this.querySelector('h4').textContent;
    const planPrice = this.querySelector('.plan-price').textContent;
    const planCode = planCodes[planId];
    
    localStorage.setItem('selectedPlan', JSON.stringify({
      id: planId,
      name: planName,
      price: planPrice,
      code: planCode
    }));
    
    // Redirect to payment page
    window.location.href = '../payment_sys/payment_sys.html';
  });
});

// Initialize subscription page
(async function boot(){
  const accessToken = localStorage.getItem('access');
  
  if(accessToken){
    try {
      const r = await fetch('/api/me', {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      });
      if(r.ok){ 
        const me = await r.json(); 
        setUserUI(me.email); 
        return; 
      }
    } catch(e) {
      console.error('Failed to fetch user info', e);
    }
    token.clear();
  }
  
  setUserUI('');
})();
