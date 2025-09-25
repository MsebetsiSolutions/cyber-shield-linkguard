const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const toast = (msg, ms=3000) => { 
  const t = $('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), ms); 
};

// Session-based fetch function
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

// Set user UI (Updated to match ScannerDash's user dropdown)
const welcomeMessage = $('welcomeMessage');
const userNameDisplay = $('userNameDisplay');
const logoutBtn = $('logout'); 
const userDropdownBtn = $('userDropdownBtn');
const userDropdown = $('userDropdown');

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
    userNameDisplay.textContent = 'User Name'; 
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

// Attach logout event listener
logoutBtn.addEventListener('click', handleLogout);

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

// Display selected plan info
function displaySelectedPlan() {
  const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
  
  if (!selectedPlan.id) {
    toast('No plan selected. Redirecting to subscription page...');
    setTimeout(() => {
      window.location.href = '../Subscription/Subscription.html';
    }, 2000);
    return;
  }
  
  $('planName').textContent = selectedPlan.name;
  $('planPrice').textContent = `R${selectedPlan.price} / month`;
  
  // Calculate and display annual price
  const monthlyPrice = parseFloat(selectedPlan.price);
  const annualPrice = monthlyPrice * 12;
  $('annualPrice').textContent = `R${annualPrice.toFixed(2)}`;
  
  $('finalAmount').textContent = `R${annualPrice.toFixed(2)}`;
}

// Detect card type based on number
function detectCardType(cardNumber) {
  const cardTypeElement = $('cardType');
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      cardTypeElement.innerHTML = `<i class="bi bi-credit-card fs-5 text-${type === 'amex' ? 'warning' : 'primary'}"></i>`;
      return type;
    }
  }
  
  cardTypeElement.innerHTML = '<i class="bi bi-question-circle fs-5 text-muted"></i>';
  return 'unknown';
}

// Format card number with spaces
function formatCardNumber(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  
  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
}

// Format expiry date
function formatExpiryDate(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  
  if (v.length <= 2) {
    return v;
  }
  
  return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
}

// Calculate enterprise price based on team size
async function calculateEnterprisePrice(teamSize) {
  try {
    const response = await fetchWithSession('/api/subscription/calculate-enterprise-price', {
      method: 'POST',
      body: JSON.stringify({ team_size: parseInt(teamSize) })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to calculate enterprise price');
      // Fallback calculation
      const basePrice = 2750;
      let totalPrice = basePrice * teamSize;
      
      if (teamSize > 5 && teamSize <= 10) {
        totalPrice *= 0.9; // 10% discount
      } else if (teamSize > 10 && teamSize <= 20) {
        totalPrice *= 0.85; // 15% discount
      } else if (teamSize > 20) {
        totalPrice *= 0.8; // 20% discount
      }
      
      return {
        team_size: teamSize,
        base_price: basePrice,
        total_price: Math.round(totalPrice * 100) / 100,
        annual_price: Math.round(totalPrice * 12 * 100) / 100
      };
    }
  } catch (error) {
    console.error('Error calculating enterprise price:', error);
    // Fallback calculation
    const basePrice = 2750;
    const totalPrice = basePrice * teamSize;
    return {
      team_size: teamSize,
      base_price: basePrice,
      total_price: totalPrice,
      annual_price: totalPrice * 12
    };
  }
}

// Update price display in modal
async function updatePriceDisplay(teamSize) {
  const priceData = await calculateEnterprisePrice(teamSize);
  
  $('displayTeamSize').textContent = teamSize;
  $('basePrice').textContent = `R${priceData.base_price.toFixed(2)}`;
  $('monthlyTotal').textContent = `R${priceData.total_price.toFixed(2)}`;
  $('annualTotal').textContent = `R${priceData.annual_price.toFixed(2)}`;
  
  // Calculate discount
  const baseTotal = priceData.base_price * teamSize;
  const discount = baseTotal - priceData.total_price;
  $('discountAmount').textContent = `R${discount.toFixed(2)}`;
  
  return priceData;
}

// Generate PDF invoice
function generateInvoicePDF(companyData, teamSize, priceData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add logo
  doc.addImage('../../assets/CYBER_SHIELD_LINKGUARD2.png', 'PNG', 15, 15, 40, 15);
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text('ENTERPRISE SUBSCRIPTION QUOTE', 105, 30, { align: 'center' });
  
  // Company information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Company: ${companyData.name}`, 20, 50);
  doc.text(`Registration Number: ${companyData.regNumber}`, 20, 57);
  doc.text(`Address: ${companyData.address}`, 20, 64);
  doc.text(`Industry: ${companyData.industry}`, 20, 71);
  doc.text(`VAT Number: ${companyData.vatNumber || 'Not provided'}`, 20, 78);
  
  // Billing information
  doc.text(`Billing Contact: ${companyData.billingName}`, 20, 90);
  doc.text(`Billing Email: ${companyData.billingEmail}`, 20, 97);
  doc.text(`Billing Phone: ${companyData.billingPhone}`, 20, 104);
  doc.text(`Billing Department: ${companyData.billingDepartment}`, 20, 111);
  
  // Price details
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text('PRICING DETAILS', 105, 125, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Team Size: ${teamSize} members`, 20, 135);
  doc.text(`Base Price per Member: R${priceData.base_price.toFixed(2)}`, 20, 142);
  doc.text(`Monthly Total: R${priceData.total_price.toFixed(2)}`, 20, 149);
  doc.text(`Annual Total: R${priceData.annual_price.toFixed(2)}`, 20, 156);
  
  // Terms and conditions
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a quotation for enterprise subscription services. Final invoice will be generated after', 20, 170);
  doc.text('confirmation from our sales team. Terms and conditions apply.', 20, 175);
  
  // Footer
  doc.setFontSize(8);
  doc.text('© Msebetsi Solutions Pty Ltd - Cyber Shield LinkGuard Enterprise', 105, 280, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`CyberShield-Enterprise-Quote-${companyData.name}.pdf`);
}

// Handle invoice request
function setupInvoiceRequest() {
  const invoiceRequestBtn = $('invoiceRequestBtn');
  const confirmInvoiceRequest = $('confirmInvoiceRequest');
  const teamSizeSelect = $('teamSize');
  const invoiceModal = new bootstrap.Modal($('invoiceModal'));
  let currentPriceData = null;
  
  invoiceRequestBtn.addEventListener('click', () => {
    invoiceModal.show();
    // Initialize with default team size
    updatePriceDisplay(1).then(data => {
      currentPriceData = data;
    });
  });
  
  teamSizeSelect.addEventListener('change', async (e) => {
    const teamSize = parseInt(e.target.value);
    currentPriceData = await updatePriceDisplay(teamSize);
  });
  
  confirmInvoiceRequest.addEventListener('click', async () => {
    if (!$('invoiceAgreement').checked) {
      toast('Please agree to be contacted by our sales team');
      return;
    }
    
    const teamSize = parseInt($('teamSize').value);
    const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
    
    // Collect company information
    const companyData = {
      name: $('companyName').value,
      regNumber: $('companyRegNumber').value,
      address: $('companyAddress').value,
      vatNumber: $('vatNumber').value,
      industry: $('industry').value,
      employees: $('employees').value,
      billingName: $('billingName').value,
      billingEmail: $('billingEmail').value,
      billingPhone: $('billingPhone').value,
      billingDepartment: $('billingDepartment').value
    };
    
    // Show loading state
    confirmInvoiceRequest.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i> Generating PDF...';
    confirmInvoiceRequest.disabled = true;
    
    try {
      // Generate PDF invoice
      generateInvoicePDF(companyData, teamSize, currentPriceData);
      
      // Create enterprise subscription with plan_mode 3
      const subscriptionData = {
        plan_id: 'enterprise',
        plan_name: 'Enterprise Team',
        plan_code: 'ENT_TEAM',
        price: currentPriceData.total_price,
        team_size: teamSize
      };
      
      const response = await fetchWithSession('/api/subscription/create', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Enterprise subscription created:', result);
        
        // Clear selected plan from storage
        localStorage.removeItem('selectedPlan');
        
        invoiceModal.hide();
        toast('Invoice generated and enterprise subscription created! Our sales team will contact you within 24 hours.');
        
        // Redirect to start page after successful request
        setTimeout(() => {
          window.location.href = '../start-enter/start-enter.html';
        }, 3000);
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Invoice request error:', error);
      toast('Invoice request failed. Please try again.');
      
      // Reset button state
      confirmInvoiceRequest.innerHTML = 'Confirm Request & Download PDF';
      confirmInvoiceRequest.disabled = false;
    }
  });
}

// Add validation functions
function isValidCardNumber(cardNumber) {
  // Basic Luhn algorithm validation
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return (sum % 10) === 0;
}

function isValidExpiryDate(expiryDate) {
  const pattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!pattern.test(expiryDate)) return false;
  
  const [month, year] = expiryDate.split('/');
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  if (parseInt(year) < currentYear) return false;
  if (parseInt(year) === currentYear && parseInt(month) < currentMonth) return false;
  
  return true;
}

// Payment form handling - Enhanced version
$('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan') || '{}');
  const cardNumber = $('cardNumber').value.replace(/\s/g, '');
  const cardName = $('cardName').value;
  const expiryDate = $('expiryDate').value;
  const cvv = $('cvv').value;
  const zipCode = $('zipCode').value;
  const email = $('billingEmail').value;
  
  // Enhanced validation
  if (!cardNumber || !cardName || !expiryDate || !cvv || !zipCode || !email) {
    toast('Please fill in all required fields');
    return;
  }
  
  // Validate card number (basic Luhn algorithm check)
  if (!isValidCardNumber(cardNumber)) {
    toast('Please enter a valid card number');
    return;
  }
  
  // Validate expiry date
  if (!isValidExpiryDate(expiryDate)) {
    toast('Please enter a valid expiration date (MM/YY)');
    return;
  }
  
  if (!$('termsAgreement').checked) {
    toast('Please agree to the Terms of Service and Enterprise Agreement');
    return;
  }
  
  // Show loading state
  const submitBtn = $('paymentForm').querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i> Processing...';
  submitBtn.disabled = true;
  
  try {
    // Create enterprise subscription with plan_mode 3
    const subscriptionData = {
      plan_id: 'enterprise',
      plan_name: selectedPlan.name || 'Enterprise',
      plan_code: selectedPlan.code || 'ENTERPRISE',
      price: parseFloat(selectedPlan.price) || 2750,
      team_size: 1 // Default team size for direct payment
    };
    
    const response = await fetchWithSession('/api/subscription/create', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Subscription created:', result);
      
      // Clear selected plan from storage
      localStorage.removeItem('selectedPlan');
      
      toast('Payment successful! Your enterprise subscription has been activated.');
      
      // Redirect to start page after successful payment
      setTimeout(() => {
        window.location.href = '../start-enter/start-enter.html';
      }, 2000);
    } else {
      throw new Error(result.error || 'Payment failed');
    }
  } catch (error) {
    console.error('Payment error:', error);
    toast(error.message || 'Payment failed. Please try again.');
    
    // Reset button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Initialize payment page
(async function boot(){
  console.log('Enterprise Payment page initializing...');
  
  try {
    const r = await fetchWithSession('/api/auth/me');
    console.log('Auth check response status:', r.status);
    
    if(r.ok){ 
      const userData = await r.json(); 
      console.log('User data received:', userData);
      
      if (userData.authenticated) {
        setUserUI(userData); 
        displaySelectedPlan();
        
        // Set up event listeners for formatters
        $('cardNumber').addEventListener('input', (e) => {
          e.target.value = formatCardNumber(e.target.value);
          detectCardType(e.target.value);
        });
        
        $('expiryDate').addEventListener('input', (e) => {
          e.target.value = formatExpiryDate(e.target.value);
        });
        
        // Set up invoice request
        setupInvoiceRequest();
        
        console.log('Enterprise Payment page initialized successfully');
        return;
      } else {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '../index.html';
        return;
      }
    } else {
      console.log('Auth check failed, redirecting to login');
      window.location.href = '../index.html';
      return;
    }
  } catch(e) {
    console.error('Failed to fetch user info', e);
    window.location.href = '../index.html';
    return;
  }
})();
