const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const toast = (msg, ms=2000) => { 
  const t = document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  t.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    background: #111827;
    color: #fff;
    padding: .6rem .9rem;
    border-radius: .5rem;
    box-shadow: 0 6px 18px rgba(0,0,0,.25);
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s;
    font-size: .9rem;
    z-index: 1000;
  `;
  document.body.appendChild(t);
  
  setTimeout(() => {
    t.classList.add('show');
    t.style.opacity = '1';
  }, 10);
  
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 250);
  }, ms);
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
    
    setUserUI(null);
    
    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    
    toast('Signed out successfully');
    
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

// Simple animation observer for elements
document.addEventListener('DOMContentLoaded', function() {
  // Add intersection observer for animated items
  const animatedItems = document.querySelectorAll('.animated-item');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  animatedItems.forEach(item => {
    observer.observe(item);
  });
  
  // Add hover effects programmatically
  const reportItems = document.querySelectorAll('.report-item, .tip-item');
  reportItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = this.classList.contains('report-item') 
        ? 'translateX(8px)' 
        : 'translateY(-3px)';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateX(0)';
    });
  });
  
  // Add click effect to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', function() {
      this.style.transform = '';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
  
  // Animate cards on load
  const cards = document.querySelectorAll('.animated-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });
  
  // Initialize dashboard and check authentication
  (async function boot(){
    console.log('Report page initializing...');
    
    try {
      const r = await fetchWithSession('/api/auth/me');
      console.log('Auth check response status:', r.status);
      
      if(r.ok){ 
        const userData = await r.json(); 
        console.log('User data received:', userData);
        
        if (userData.authenticated) {
          setUserUI(userData); 
          console.log('User authenticated successfully');
          return;
        } else {
          console.log('User not authenticated, redirecting to login');
          // Redirect to login page if not authenticated
          window.location.href = '../index.html';
          return;
        }
      } else {
        console.log('Auth check failed, redirecting to login');
        // Redirect to login page if request failed
        window.location.href = '../index.html';
        return;
      }
    } catch(e) {
      console.error('Failed to fetch user info', e);
      // Redirect to login page on error
      window.location.href = '../index.html';
      return;
    }
  })();
});
