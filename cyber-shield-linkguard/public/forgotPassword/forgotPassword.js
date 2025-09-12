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

$('doReset').addEventListener('click', async () => {
  const email = $('resetEmail').value.trim().toLowerCase();
  
  if(!email){ 
    return toast('Please enter your email'); 
  }
  
  setBusy($('doReset'), true, 'Sending...');
  
  try{
    const r = await fetch('/api/auth/forgot-password', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ email })
    });
    
    const j = await r.json(); 
    if(!r.ok){ 
      return toast(j.error || 'Failed to send reset link'); 
    }
    
    toast('Reset link sent to your email');
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 2000);
    
  } catch(e) { 
    toast('Network error'); 
  } finally { 
    setBusy($('doReset'), false); 
  }
});

// Allow form submission with Enter key
$('resetEmail').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ 
    e.preventDefault(); 
    $('doReset').click(); 
  } 
});
