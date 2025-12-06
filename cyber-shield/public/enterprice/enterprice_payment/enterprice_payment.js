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

// Set user UI
const welcomeMessage = $('welcomeMessage');
const userNameDisplay = $('userNameDisplay');
const logoutBtn = $('logout'); 

function setUserUI(userData){ 
  console.log('Setting user UI with data:', userData); 
  
  if(userData && userData.authenticated){ 
    const welcomeText = `Welcome, ${userData.full_name || userData.email}!`;
    const displayName = userData.full_name || userData.email.split('@')[0];
    
    if (welcomeMessage) welcomeMessage.textContent = welcomeText;
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    
    console.log('User UI updated:', {
      welcomeText,
      displayName,
      full_name: userData.full_name
    });

  } else { 
    if (welcomeMessage) welcomeMessage.textContent = ''; 
    if (userNameDisplay) userNameDisplay.textContent = 'User Name'; 
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
    window.location.href = '../../';
  }, 1000);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

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
  
  if ($('planNameDisplay')) $('planNameDisplay').textContent = selectedPlan.name;
  if ($('planPriceDisplay')) $('planPriceDisplay').textContent = `R${selectedPlan.price} / month`;
  
  const monthlyPrice = parseFloat(selectedPlan.price);
  const annualPrice = monthlyPrice * 12;
  if ($('annualPriceDisplay')) $('annualPriceDisplay').textContent = `R${annualPrice.toFixed(2)}`;
  
  if ($('finalAmount')) $('finalAmount').textContent = `R${annualPrice.toFixed(2)}`;
}

// Detect card type based on number
function detectCardType(cardNumber) {
  const cardTypeElement = $('cardType');
  if (!cardTypeElement) return 'unknown';
  
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

// price display in modal
async function updatePriceDisplay(teamSize) {
  const priceData = await calculateEnterprisePrice(teamSize);
  
  if ($('displayTeamSize')) $('displayTeamSize').textContent = teamSize;
  if ($('basePrice')) $('basePrice').textContent = `R${priceData.base_price.toFixed(2)}`;
  if ($('monthlyTotal')) $('monthlyTotal').textContent = `R${priceData.total_price.toFixed(2)}`;
  if ($('annualTotal')) $('annualTotal').textContent = `R${priceData.annual_price.toFixed(2)}`;
  
  const baseTotal = priceData.base_price * teamSize;
  const discount = baseTotal - priceData.total_price;
  if ($('discountAmount')) $('discountAmount').textContent = `R${discount.toFixed(2)}`;
  
  return priceData;
}

// Generate PDF invoice 
function generateInvoicePDF(companyData, teamSize, priceData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Set African color scheme for PDF
  const primaryColor = [212, 175, 55]; 
  const secondaryColor = [139, 69, 19]; 
  const accentColor = [34, 139, 34]; 
  
  // Add header with African pattern
  doc.setFillColor(15, 76, 58); 
  doc.rect(0, 0, 210, 30, 'F');
  
  try {
    doc.addImage('../../assets/CYBER_SHIELD_LINKGUARD2.png', 'PNG', 15, 8, 40, 15);
  } catch (e) {
    console.log('Logo not available for PDF');
  }
  
  // Title with African colors
  doc.setFontSize(20);
  doc.setTextColor(212, 175, 55);
  doc.text('ENTERPRISE QUOTE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  doc.setFont(undefined, 'bold');
  doc.text('COMPANY INFORMATION', 20, 45);
  doc.setFont(undefined, 'normal');
  doc.text(`Company Name: ${companyData.name}`, 25, 55);
  doc.text(`Registration Number: ${companyData.regNumber}`, 25, 62);
  doc.text(`Address: ${companyData.address}`, 25, 69);
  doc.text(`Industry: ${companyData.industry}`, 25, 76);
  doc.text(`VAT Number: ${companyData.vatNumber || 'Not provided'}`, 25, 83);
  
  doc.setFont(undefined, 'bold');
  doc.text('BILLING INFORMATION', 110, 45);
  doc.setFont(undefined, 'normal');
  doc.text(`Billing Contact: ${companyData.billingName}`, 115, 55);
  doc.text(`Billing Email: ${companyData.billingEmail}`, 115, 62);
  doc.text(`Billing Phone: ${companyData.billingPhone}`, 115, 69);
  doc.text(`Billing Department: ${companyData.billingDepartment}`, 115, 76);
  
  doc.setFont(undefined, 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('BANK TRANSFER DETAILS', 105, 95, { align: 'center' });
  
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Bank: FNB Business Cheque', 20, 105);
  doc.text('Account Number: 62467764827', 20, 112);
  doc.text('Account Holder: Msebetsi Solutions', 20, 119);
  doc.text('Branch Code: 253305 (Rosebank)', 20, 126);
  doc.text('Email: tshepho@msebetsisolutions.com', 20, 133);
  
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, 140, 180, 8, 'F');
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PRICING DETAILS', 105, 146, { align: 'center' });
  
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Team Size: ${teamSize} members`, 20, 160);
  doc.text(`Base Price per Member: R${priceData.base_price.toFixed(2)}`, 20, 167);
  doc.text(`Monthly Total: R${priceData.total_price.toFixed(2)}`, 20, 174);
  doc.text(`Annual Total: R${priceData.annual_price.toFixed(2)}`, 20, 181);
  
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(15, 190, 180, 8, 'F');
  doc.setFont(undefined, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PAYMENT INSTRUCTIONS', 105, 196, { align: 'center' });
  
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('1. Make an EFT payment to the bank account details provided above', 20, 208);
  doc.text('2. Use your company name as the payment reference', 20, 215);
  doc.text('3. Email the proof of payment to tshepho@msebetsisolutions.com', 20, 222);
  doc.text('4. Your subscription will be activated within 24 hours of payment confirmation', 20, 229);
  
  doc.setFillColor(15, 76, 58);
  doc.rect(0, 270, 210, 30, 'F');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text('© Msebetsi Solutions Pty Ltd - Cyber Shield LinkGuard Enterprise', 105, 278, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-ZA')}`, 105, 283, { align: 'center' });
  
  const fileName = `CyberShield-Enterprise-Quote-${companyData.name.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
  
  return fileName;
}

// Handle invoice request - UPDATED: No database interaction
function setupInvoiceRequest() {
  const requestInvoiceBtn = $('requestInvoiceBtn');
  const confirmInvoiceRequest = $('confirmInvoiceRequest');
  const teamSizeSelect = $('teamSize');
  const invoiceModalElement = $('invoiceModal');
  
  if (!requestInvoiceBtn || !confirmInvoiceRequest || !teamSizeSelect || !invoiceModalElement) {
    console.log('Invoice request elements not found');
    return;
  }
  
  const invoiceModal = new bootstrap.Modal(invoiceModalElement);
  let currentPriceData = null;
  
  requestInvoiceBtn.addEventListener('click', () => {
    invoiceModal.show();
    updatePriceDisplay(1).then(data => {
      currentPriceData = data;
    });
  });
  
  teamSizeSelect.addEventListener('change', async (e) => {
    const teamSize = parseInt(e.target.value);
    currentPriceData = await updatePriceDisplay(teamSize);
  });
  
  confirmInvoiceRequest.addEventListener('click', async () => {
    const invoiceAgreement = $('invoiceAgreement');
    if (!invoiceAgreement.checked) {
      toast('Please agree to be contacted by our sales team');
      return;
    }
    
    const companyName = $('modalCompanyName').value;
    const regNumber = $('modalCompanyRegNumber').value;
    const address = $('modalCompanyAddress').value;
    const industry = $('modalIndustry').value;
    
    if (!companyName || !regNumber || !address || !industry) {
      toast('Please fill in all required company information fields');
      return;
    }
    
    const teamSize = parseInt(teamSizeSelect.value);
    
    const companyData = {
      name: companyName,
      regNumber: regNumber,
      address: address,
      vatNumber: $('modalVatNumber').value,
      industry: industry,
      employees: "To be specified",
      billingName: companyName, 
      billingEmail: "To be provided",
      billingPhone: "To be provided",
      billingDepartment: "To be provided"
    };
    
    confirmInvoiceRequest.innerHTML = '<i class="bi bi-arrow-repeat spinner"></i> Generating PDF...';
    confirmInvoiceRequest.disabled = true;
    
    try {
      const fileName = generateInvoicePDF(companyData, teamSize, currentPriceData);
      
      invoiceModal.hide();
      toast(`Invoice generated successfully! File: ${fileName}`);
      
      confirmInvoiceRequest.innerHTML = 'Generate & Download PDF Invoice';
      confirmInvoiceRequest.disabled = false;
      
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast('Invoice generation failed. Please try again.');
      
      confirmInvoiceRequest.innerHTML = 'Generate & Download PDF Invoice';
      confirmInvoiceRequest.disabled = false;
    }
  });
}

function isValidCardNumber(cardNumber) {
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
        
        const cardNumberInput = $('cardNumber');
        if (cardNumberInput) {
          cardNumberInput.addEventListener('input', (e) => {
            e.target.value = formatCardNumber(e.target.value);
            detectCardType(e.target.value);
          });
        }
        
        const expiryDateInput = $('expiryDate');
        if (expiryDateInput) {
          expiryDateInput.addEventListener('input', (e) => {
            e.target.value = formatExpiryDate(e.target.value);
          });
        }
        
        setupInvoiceRequest();
        
        console.log('Enterprise Payment page initialized successfully');
        return;
      } else {
        console.log('User not authenticated, but staying on page for enterprise payment');
        displaySelectedPlan();
        return;
      }
    } else {
      console.log('Auth check failed, but staying on page for enterprise payment');
      displaySelectedPlan();
      return;
    }
  } catch(e) {
    console.error('Failed to fetch user info', e);
    console.log('Error occurred, but staying on page for enterprise payment');
    displaySelectedPlan();
    return;
  }
})();
