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

// Session-based API calls
async function fetchWithSession(path, opts={}) {
  const headers = {};
  
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  Object.assign(headers, opts.headers || {});
  
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
    userNameDisplay.textContent = 'User Name';
    console.log('User not authenticated, using fallback');
  }
}

// Check authentication with session
async function checkAuthenticationWithSession() {
    try {
        const sessionId = window.CyberShieldSession?.getCurrentSessionId();
        
        console.log('Checking authentication with session:', sessionId);
        
        const r = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        console.log('Auth check response status:', r.status);
        
        if(r.ok){ 
            const userData = await r.json(); 
            console.log('User data received:', userData);
            
            if (userData.authenticated) {
                console.log('User is authenticated via Flask session');
                
                if (sessionId && userData.user_id) {
                    try {
                        await fetch('/api/session/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                session: sessionId,
                                user_id: userData.user_id
                            })
                        });
                        console.log('Session registered with server');
                    } catch (e) {
                        console.log('Failed to register session with server, but continuing:', e);
                    }
                }
                
                return userData;
            } else {
                console.log('User not authenticated via Flask session, redirecting to index');
                window.location.href = '../index.html';
                return false;
            }
        } else {
            console.log('Auth check failed, redirecting to index');
            window.location.href = '../index.html';
            return false;
        }
    } catch(e) {
        console.error('Authentication check failed:', e);
        window.location.href = '../index.html';
        return false;
    }
}

// Validate server session
async function validateServerSession(sessionId) {
    try {
        const response = await fetch('/api/session/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session: sessionId })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.valid;
        }
        return false;
    } catch (error) {
        console.error('Session validation error:', error);
        return false;
    }
}

// Logout functionality
async function handleLogout() {
    try {
        const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();
        
        const logoutResponse = await fetchWithSession('/api/auth/logout', {
            method: 'POST'
        });
        
        if (logoutResponse.ok) {
            console.log('logout successful');
            
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
    
    // Redirect to login page without session ID
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

// Update plan badge
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
  
  planBadge.classList.remove('free-plan', 'pro-plan', 'team-plan', 'enterprise-plan');
  
  planBadge.classList.add(plan.class);
  planBadge.textContent = plan.text;
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
  return 0; 
}

// User dropdown functionality
function initUserDropdown() {
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

  // Prevent dropdown from closing 
  userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Phishing simulation functionality
// Function to display generated phishing email
function displayGeneratedEmail(emailData) {
  const container = $('generatedEmailContainer');
  const content = $('generatedEmailContent');
  
  if (!container || !content) {
    console.error('Email display elements not found');
    return;
  }

  // Create email HTML content
  const emailHTML = `
    <div class="email-preview">
      <div class="email-header-info">
        <div class="email-meta">
          <span class="email-from"><strong>From:</strong> ${emailData.sender_name || 'Security Team'} &lt;${emailData.sender_email || 'security@example.com'}&gt;</span>
          <span class="email-to"><strong>To:</strong> ${emailData.recipient_email || emailData.email}</span>
          <span class="email-subject"><strong>Subject:</strong> ${emailData.subject || 'Important Security Notice'}</span>
          <span class="email-date"><strong>Date:</strong> ${new Date().toLocaleString()}</span>
        </div>
      </div>
      <div class="email-body-content">
        ${emailData.html_content || emailData.content || '<p>Email content not available</p>'}
      </div>
      ${emailData.warning ? `
        <div class="phishing-warning mt-3">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Training Notice:</strong> This is a simulated phishing email for educational purposes.
            ${emailData.warning}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Set the content and show container
  content.innerHTML = emailHTML;
  container.style.display = 'block';
  
  // Add animation class after a small delay
  setTimeout(() => {
    container.classList.add('show');
  }, 50);
  
  // Scroll to the email display
  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// Function to send the generated phishing email
function sendGeneratedEmail() {
  const content = $('generatedEmailContent');
  if (!content) return;

  // Show confirmation dialog
  if (!confirm('This will send the simulated phishing email for training purposes. Are you sure you want to proceed?')) {
    return;
  }

  // Get the email data from the content
  const emailData = getEmailDataFromContent();
  
  if (!emailData) {
    toast('Error: Could not retrieve email data');
    return;
  }

  // Simulate sending email via API
  sendPhishingEmailAPI(emailData)
    .then(result => {
      toast('Training email sent successfully!');
      console.log('Email sent:', result);
    })
    .catch(error => {
      console.error('Failed to send email:', error);
      toast('Failed to send email');
    });
}

// Function to save email to drafts
function saveEmailToDraft() {
  const content = $('generatedEmailContent');
  if (!content) return;

  const emailData = getEmailDataFromContent();
  
  if (!emailData) {
    toast('Error: Could not retrieve email data');
    return;
  }

  // Save to drafts via API
  saveEmailDraftAPI(emailData)
    .then(result => {
      toast('Email saved to drafts successfully!');
      console.log('Email saved to draft:', result);

      // Insert the saved draft into the Detection Replica mailbox UI so users
      // can see and open the draft immediately without reloading.
      try {
        const draftId = result && result.draft_id ? result.draft_id : `draft_${Date.now()}`;
        insertDraftToMailbox(draftId, emailData, result && result.saved_at);
      } catch (e) {
        console.warn('Failed to insert draft into mailbox UI:', e);
      }
    })
    .catch(error => {
      console.error('Failed to save to drafts:', error);
      toast('Failed to save email to drafts');
    });
}

// Helper function to extract email data from the displayed content
function getEmailDataFromContent() {
  const content = $('generatedEmailContent');
  if (!content) return null;

  // Extract email metadata from the display
  const emailMeta = content.querySelector('.email-meta');
  if (!emailMeta) return null;

  const spans = emailMeta.querySelectorAll('span');
  let fromEmail = '', toEmail = '', subject = '', senderName = '';
  
  spans.forEach(span => {
    const text = span.textContent;
    if (text.includes('From:')) {
      // Extract sender name and email
      const fromText = text.replace('From:', '').trim();
      const nameMatch = fromText.match(/^([^<]+)/);
      const emailMatch = fromText.match(/<([^>]+)>/);
      
      senderName = nameMatch ? nameMatch[1].trim() : '';
      fromEmail = emailMatch ? emailMatch[1] : '';
    } else if (text.includes('To:')) {
      toEmail = text.replace('To:', '').trim();
    } else if (text.includes('Subject:')) {
      subject = text.replace('Subject:', '').trim();
    }
  });

  const bodyContent = content.querySelector('.email-body-content');
  const htmlContent = bodyContent ? bodyContent.innerHTML : '';

  return {
    sender_name: senderName,
    from: fromEmail,
    to: toEmail,
    subject: subject,
    html_content: htmlContent,
    type: 'phishing_training'
  };
}

// API function to send phishing email
async function sendPhishingEmailAPI(emailData) {
  const response = await fetchWithSession('/api/phishing/send', {
    method: 'POST',
    body: JSON.stringify(emailData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to send email');
  }
  
  return await response.json();
}

// API function to save email to drafts
async function saveEmailDraftAPI(emailData) {
  const response = await fetchWithSession('/api/phishing/draft', {
    method: 'POST',
    body: JSON.stringify(emailData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save email to drafts');
  }
  
  return await response.json();
}

// Insert a saved draft into the Detection Phishing Replica mailbox UI
function insertDraftToMailbox(draftId, emailData, savedAt) {
  const emailList = document.getElementById('emailList');
  const draftsFolderId = 'drafts-folder';

  if (!emailList) {
    console.warn('Email list container not found, cannot insert draft');
    return;
  }

  // Ensure drafts folder exists (create if missing)
  let draftsFolder = document.getElementById(draftsFolderId);
  if (!draftsFolder) {
    draftsFolder = document.createElement('div');
    draftsFolder.className = 'email-folder hidden';
    draftsFolder.id = draftsFolderId;
    emailList.appendChild(draftsFolder);
  }

  // Build preview text (strip HTML and truncate)
  const stripHtml = html => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  const previewText = (emailData.html_content ? stripHtml(emailData.html_content) : (emailData.content || '') ).slice(0, 120);

  // Create email item element
  const item = document.createElement('div');
  item.className = 'email-item';
  item.setAttribute('data-draft-id', draftId);
  item.innerHTML = `
    <div class="avatar">${(emailData.sender_name || 'SD').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
    <div class="content">
      <div class="header">
        <div class="subject">${(emailData.subject || 'Draft').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div class="time">${savedAt ? new Date(savedAt).toLocaleString() : new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
      </div>
      <div class="preview">${previewText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
  `;

  // Add click handler to show the draft in the email view
  item.addEventListener('click', function() {
    // Hide all existing email views
    const emailViews = document.querySelectorAll('.email-view-content');
    emailViews.forEach(v => v.style.display = 'none');

    // Build or show the draft view
    const viewId = `draftView_${draftId}`;
    let draftView = document.getElementById(viewId);
    if (!draftView) {
      draftView = document.createElement('div');
      draftView.className = 'email-view-content';
      draftView.id = viewId;
      draftView.innerHTML = `
        <div class="email-header-view">
          <h2>${(emailData.subject || 'Draft').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
          <div class="sender-info">
            <div class="sender-avatar">${(emailData.sender_name || 'SD').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
            <div class="sender-details">
              <div class="sender-name">${(emailData.sender_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              <div class="sender-email">${(emailData.from || '')}</div>
            </div>
            <div class="email-date">${savedAt ? new Date(savedAt).toLocaleString() : new Date().toLocaleString()}</div>
          </div>
        </div>
        <div class="email-body">
          ${emailData.html_content || `<p>${(emailData.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`}
        </div>
      `;

      // Append to the email view container
      const emailViewContainer = document.querySelector('.email-view');
      if (emailViewContainer) {
        emailViewContainer.appendChild(draftView);
      }
    }

    // Display the draft view
    draftView.style.display = 'block';

    // Update active state for email items
    const emailItems = document.querySelectorAll('.email-item');
    emailItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });

  // Append item to the drafts folder
  draftsFolder.appendChild(item);

  // Update drafts badge count in folder list if present
  const draftsFolderBtn = document.querySelector('.folder-item[data-folder="drafts"]');
  if (draftsFolderBtn) {
    const badge = draftsFolderBtn.querySelector('.badge');
    if (badge) {
      const current = parseInt(badge.textContent || '0', 10) || 0;
      badge.textContent = current + 1;
    }
  }
}

// exportEmailAsTrainingMaterial removed: was unused in this file. Keep training exports in a dedicated utilities module if needed.

// Email Editor Functions
function openEmailEditor() {
  const modal = $('emailEditorModal');
  const content = $('generatedEmailContent');
  
  if (!modal || !content) return;

  // Extract current email data
  const emailData = getEmailDataFromContent();
  if (!emailData) {
    toast('No email content to edit');
    return;
  }

  // Populate editor fields
  populateEmailEditor(emailData);
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeEmailEditor() {
  const modal = $('emailEditorModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
}

function populateEmailEditor(emailData) {
  const senderNameInput = $('editSenderName');
  const senderEmailInput = $('editSenderEmail');
  const subjectInput = $('editSubject');
  const bodyEditor = $('editEmailBody');

  if (senderNameInput && emailData.sender_name) {
    senderNameInput.value = emailData.sender_name;
  }
  
  if (senderEmailInput && emailData.from) {
    senderEmailInput.value = emailData.from;
  }
  
  if (subjectInput && emailData.subject) {
    subjectInput.value = emailData.subject;
  }
  
  if (bodyEditor && emailData.html_content) {
    // Clean up the content for editing - remove warning notices
    let cleanContent = emailData.html_content;
    
    // Remove training notices
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<strong>⚠️ TRAINING NOTICE:.*?<\/p>/gsi, '');
    cleanContent = cleanContent.replace(/<div[^>]*class="phishing-warning".*?<\/div>/gsi, '');
    
    bodyEditor.innerHTML = cleanContent;
  }
}

function getEmailDataFromEditor() {
  const senderNameInput = $('editSenderName');
  const senderEmailInput = $('editSenderEmail');
  const subjectInput = $('editSubject');
  const bodyEditor = $('editEmailBody');

  return {
    sender_name: senderNameInput ? senderNameInput.value : '',
    sender_email: senderEmailInput ? senderEmailInput.value : '',
    subject: subjectInput ? subjectInput.value : '',
    html_content: bodyEditor ? bodyEditor.innerHTML : '',
    recipient_email: getEmailDataFromContent()?.to || '',
    generated_at: new Date().toISOString(),
    warning: 'This is a simulated phishing email generated for cybersecurity training purposes. Never click on suspicious links in real emails.'
  };
}

function saveEmailChanges() {
  const updatedEmailData = getEmailDataFromEditor();
  
  if (!updatedEmailData.sender_name || !updatedEmailData.sender_email || !updatedEmailData.subject) {
    toast('Please fill in all required fields (sender name, email, and subject)');
    return;
  }

  // Update the displayed email with edited content
  displayGeneratedEmail(updatedEmailData);
  
  // Close the editor
  closeEmailEditor();
  
  toast('Email content updated successfully!');
}

// Rich text editor functionality
function initRichTextEditor() {
  const toolbar = document.querySelector('.editor-toolbar');
  const editor = $('editEmailBody');
  
  if (!toolbar || !editor) return;

  // Handle toolbar button clicks
  toolbar.addEventListener('click', function(e) {
    const btn = e.target.closest('.editor-btn');
    if (!btn) return;
    
    e.preventDefault();
    
    const command = btn.dataset.command;
    const value = btn.dataset.value;
    
    if (command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'insertHTML') {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, null);
    }
    
    // Update button states
    updateToolbarButtonStates();
    
    // Focus back to editor
    editor.focus();
  });

  // Handle editor selection changes
  editor.addEventListener('mouseup', updateToolbarButtonStates);
  editor.addEventListener('keyup', updateToolbarButtonStates);
}

function updateToolbarButtonStates() {
  const buttons = document.querySelectorAll('.editor-btn[data-command]');
  
  buttons.forEach(btn => {
    const command = btn.dataset.command;
    if (command && command !== 'createLink' && command !== 'insertHTML') {
      const isActive = document.queryCommandState(command);
      btn.classList.toggle('active', isActive);
    }
  });
}

function initPhishingSimulation() {
  const generateEmailForm = $('generateEmailForm');
  const platformSelect = $('platformSelect');

  // Platform select handler
  if (platformSelect) {
    // Restore saved choice
    try {
      const saved = localStorage.getItem('platformSelect');
      if (saved) platformSelect.value = saved;
    } catch (e) { }

    platformSelect.addEventListener('change', function() {
      const val = this.value || '';
      try { localStorage.setItem('platformSelect', val); } catch (e) { }
    });
  }

  // Generate email form
  if (generateEmailForm) {
    generateEmailForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const fd = new FormData(generateEmailForm);
      const first = fd.get('firstName')?.trim();
      const last = fd.get('lastName')?.trim();
      const email = fd.get('email')?.trim();
      const company = fd.get('company')?.trim();
      const jobTitle = fd.get('jobTitle')?.trim();
      const platform = platformSelect ? platformSelect.value : '';

      if (!first || !last || !email) { 
        toast('Please fill first name, last name and email'); 
        return; 
      }

      setBusy(generateEmailForm.querySelector('button[type="submit"]'), true, 'Generating...');

      try {
        // Simulate API call to generate phishing email
        const response = await fetchWithSession('/api/phishing/generate', {
          method: 'POST',
          body: JSON.stringify({
            firstname: first,
            lastname: last,
            email: email,
            company: company,
            jobtitle: jobTitle,
            platform: platform
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          // Display the generated email
          displayGeneratedEmail(result);
          
          toast('Phishing email generated successfully!');
          console.log('Generated phishing email:', result);
          
          // Reset form
          generateEmailForm.reset();
        } else {
          const errorData = await response.json();
          toast('Failed to generate email: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error generating phishing email:', error);
        toast('Network error when generating email');
      } finally {
        setBusy(generateEmailForm.querySelector('button[type="submit"]'), false);
      }
    });
  }

  // Email display controls
  const closeEmailDisplay = $('closeEmailDisplay');
  const editEmailBtn = $('editEmailContent');
  const sendEmailBtn = $('sendEmailContent');
  const saveToDraftBtn = $('saveToDraftContent');

  if (closeEmailDisplay) {
    closeEmailDisplay.addEventListener('click', function() {
      const container = $('generatedEmailContainer');
      if (container) {
        container.classList.remove('show');
        setTimeout(() => {
          container.style.display = 'none';
        }, 400); // Wait for animation to complete
      }
    });
  }

  if (editEmailBtn) {
    editEmailBtn.addEventListener('click', openEmailEditor);
  }

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener('click', sendGeneratedEmail);
  }

  if (saveToDraftBtn) {
    saveToDraftBtn.addEventListener('click', saveEmailToDraft);
  }

  // Email editor controls
  const closeEmailEditorBtn = $('closeEmailEditor');
  const saveEmailChangesBtn = $('saveEmailChanges');
  const cancelEmailEditBtn = $('cancelEmailEdit');

  if (closeEmailEditorBtn) {
    closeEmailEditorBtn.addEventListener('click', closeEmailEditor);
  }

  if (saveEmailChangesBtn) {
    saveEmailChangesBtn.addEventListener('click', saveEmailChanges);
  }

  if (cancelEmailEditBtn) {
    cancelEmailEditBtn.addEventListener('click', closeEmailEditor);
  }

  // Initialize rich text editor
  initRichTextEditor();

  // Close modal when clicking outside
  const emailEditorModal = $('emailEditorModal');
  if (emailEditorModal) {
    emailEditorModal.addEventListener('click', function(e) {
      if (e.target === emailEditorModal) {
        closeEmailEditor();
      }
    });
  }

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Close modal on Escape key
    if (e.key === 'Escape') {
      const modal = $('emailEditorModal');
      if (modal && modal.style.display === 'flex') {
        closeEmailEditor();
      }
    }
  });
}

// Detection Phishing Replica functionality
function initDetectionPhishingReplica() {
  // Update time display
  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeElement = document.getElementById('time');
    if (timeElement) {
      timeElement.textContent = timeString;
    }
  }

  // Email folder functionality
  function initEmailFolders() {
    const folderItems = document.querySelectorAll('.folder-item');
    const emailFolders = document.querySelectorAll('.email-folder');
    
    folderItems.forEach(item => {
      item.addEventListener('click', function() {
        const folderType = this.getAttribute('data-folder');
        
        // Update active state
        folderItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Show selected folder
        emailFolders.forEach(folder => {
          folder.classList.add('hidden');
        });
        
        const selectedFolder = document.getElementById(`${folderType}-folder`);
        if (selectedFolder) {
          selectedFolder.classList.remove('hidden');
        }
        
        // Clear email view when switching folders
        const emailViews = document.querySelectorAll('.email-view-content');
        emailViews.forEach(view => {
          view.style.display = 'none';
        });
        
        // Clear email selection
        const emailItems = document.querySelectorAll('.email-item');
        emailItems.forEach(item => {
          item.classList.remove('active');
        });
      });
    });
  }

  // Email selection functionality
  function initEmailSelection() {
    const emailItems = document.querySelectorAll('.email-item');
    const emailViews = document.querySelectorAll('.email-view-content');
    
    emailItems.forEach(item => {
      item.addEventListener('click', function() {
        const emailType = this.getAttribute('data-email');
        
        // Hide all email views
        emailViews.forEach(view => {
          view.style.display = 'none';
        });
        
        // Show selected email view
        const selectedView = document.getElementById(`${emailType}Email`);
        if (selectedView) {
          selectedView.style.display = 'block';
        }
        
        // Update active state
        emailItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
      });
    });
    
    // Select first email by default in inbox
    const firstEmail = document.querySelector('#inbox-folder .email-item');
    if (firstEmail) {
      firstEmail.click();
    }
  }

  // Refresh emails functionality
  function initRefreshEmails() {
    const refreshButton = document.getElementById('refreshEmails');
    if (refreshButton) {
      refreshButton.addEventListener('click', function() {
        setBusy(this, true);
        setTimeout(() => {
          setBusy(this, false);
          toast('Emails refreshed');
        }, 1000);
      });
    }
  }

  // Phishing link interactions
  function initPhishingInteractions() {
    const phishingLink = document.getElementById('phishingLink');
    const reportBtn = document.getElementById('reportBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const successOverlay = document.getElementById('successOverlay');
    const failureOverlay = document.getElementById('failureOverlay');

    // Show fake URL on hover
    if (phishingLink) {
      phishingLink.addEventListener('mouseover', function() {
        this.textContent = "http://secure-login.xyz/verify-account";
        this.style.color = "#ff5b5b";
      });

      phishingLink.addEventListener('mouseout', function() {
        this.innerHTML = '<i class="fas fa-lock"></i> Verify Your Account Now';
        this.style.color = "#00b3ff";
      });

      // Handle phishing link click
      phishingLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (failureOverlay) {
          failureOverlay.classList.add('active');
        }
      });
    }

    // Handle report button
    if (reportBtn) {
      reportBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (successOverlay) {
          successOverlay.classList.add('active');
        }
        toast('Training step completed! Phishing attempt reported successfully.');
      });
    }

    // Handle verify button
    if (verifyBtn) {
      verifyBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (successOverlay) {
          successOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious link identified correctly.');
      });
    }
  }

  // QR code interactions
  function initQrInteractions() {
    const reportQrBtn = document.getElementById('reportQrBtn');
    const scanQrBtn = document.getElementById('scanQrBtn');
    const qrSuccessOverlay = document.getElementById('qrSuccessOverlay');

    if (reportQrBtn) {
      reportQrBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (qrSuccessOverlay) {
          qrSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious QR code reported successfully.');
      });
    }

    if (scanQrBtn) {
      scanQrBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (qrSuccessOverlay) {
          qrSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! QR code security check completed.');
      });
    }
  }

  // Attachment interactions
  function initAttachmentInteractions() {
    const reportAttachmentBtn = document.getElementById('reportAttachmentBtn');
    const checkAttachmentBtn = document.getElementById('checkAttachmentBtn');
    const downloadAttachmentBtn = document.getElementById('downloadAttachment');
    const attachmentSuccessOverlay = document.getElementById('attachmentSuccessOverlay');

    if (reportAttachmentBtn) {
      reportAttachmentBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (attachmentSuccessOverlay) {
          attachmentSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious attachment reported successfully.');
      });
    }

    if (checkAttachmentBtn) {
      checkAttachmentBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (attachmentSuccessOverlay) {
          attachmentSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Attachment security analysis completed.');
      });
    }

    if (downloadAttachmentBtn) {
      downloadAttachmentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toast('Warning: This attachment appears suspicious. Always verify before downloading.');
      });
    }
  }

  // Image phishing interactions
  function initImageInteractions() {
    const reportImageBtn = document.getElementById('reportImageBtn');
    const checkImageBtn = document.getElementById('checkImageBtn');
    const suspiciousImage = document.getElementById('suspiciousImage');
    const imageSuccessOverlay = document.getElementById('imageSuccessOverlay');

    if (reportImageBtn) {
      reportImageBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (imageSuccessOverlay) {
          imageSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Suspicious image reported successfully.');
      });
    }

    if (checkImageBtn) {
      checkImageBtn.addEventListener('click', function() {
        updateTrainingProgress();
        if (imageSuccessOverlay) {
          imageSuccessOverlay.classList.add('active');
        }
        toast('Training step completed! Image security analysis completed.');
      });
    }

    if (suspiciousImage) {
      suspiciousImage.addEventListener('click', function() {
        toast('Warning: This image link appears suspicious. Always verify before clicking.');
      });
    }
  }

  // Training progress functionality
  function updateTrainingProgress() {
    const steps = document.querySelectorAll('.step');
    let currentActiveIndex = -1;
    
    // Find current active step
    steps.forEach((step, index) => {
      if (step.classList.contains('active')) {
        currentActiveIndex = index;
      }
    });
    
    // Move to next step if available
    if (currentActiveIndex >= 0 && currentActiveIndex < steps.length - 1) {
      steps[currentActiveIndex].classList.remove('active');
      steps[currentActiveIndex].classList.add('completed');
      steps[currentActiveIndex].innerHTML = '<i class="bi bi-check-circle-fill"></i><span>' + steps[currentActiveIndex].textContent.trim() + '</span>';
      
      steps[currentActiveIndex + 1].classList.add('active');
    }
  }

  // Close overlay functionality
  function initOverlayClose() {
    const closeButtons = document.querySelectorAll('.close-btn');
    const overlays = document.querySelectorAll('.result-overlay');

    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        overlays.forEach(overlay => {
          overlay.classList.remove('active');
        });
      });
    });

    // Close overlay when clicking outside
    overlays.forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('active');
        }
      });
    });
  }

  // Initialize all replica functionality
  updateTime();
  setInterval(updateTime, 60000);
  initEmailFolders();
  initEmailSelection();
  initRefreshEmails();
  initPhishingInteractions();
  initQrInteractions();
  initAttachmentInteractions();
  initImageInteractions();
  initOverlayClose();
}

// Initialize the application
(async function boot(){
    console.log('Cybersecurity Awareness initializing with session management...');
    
    try {
        const userData = await checkAuthenticationWithSession();
        
        if (userData) {
            initUserDropdown();
            
            const planMode = await checkUserPlan();
            
            setUserUI({...userData, plan_mode: planMode}); 
            initPhishingSimulation();
            initDetectionPhishingReplica();
            
            // Set up logout handler
            logoutBtn.addEventListener('click', handleLogout);
            
            console.log('User authenticated successfully with valid session');
            return;
        }
    } catch(e) {
        console.error('Failed to initialize cybersecurity awareness', e);
        toast('Authentication error - please login again');
        
        sessionStorage.removeItem('cyberShieldSession');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('plan_mode');
        window.location.href = '../index.html';
    }
})();

// Session validation on page visibility
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('Page became visible, validating session...');
        
        const sessionId = window.CyberShieldSession?.getCurrentSessionId();
        if (sessionId) {
            validateServerSession(sessionId).then(isValid => {
                if (!isValid) {
                    console.log('Session invalid on page visibility, redirecting...');
                    sessionStorage.removeItem('cyberShieldSession');
                    window.location.href = '../index.html';
                }
            });
        }
    }
});

// Global Phishing Patterns Quiz Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeGlobalPatternsQuiz();
    initializeEmailDatabase();
});

// CSV Email Database Functionality - Updated for Auto-loading Nigerian CSV
function initializeEmailDatabase() {
    const regionSelect = document.getElementById('regionSelect');
    const emailViewerSection = document.getElementById('emailViewerSection');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const totalEmailsSpan = document.getElementById('totalEmails');
    const regionInfo = document.getElementById('regionInfo');
    
    // Navigation elements
    const prevEmailBtn = document.getElementById('prevEmailBtn');
    const nextEmailBtn = document.getElementById('nextEmailBtn');
    const emailCounter = document.getElementById('emailCounter');
    const jumpToInput = document.getElementById('jumpToInput');
    const jumpToBtn = document.getElementById('jumpToBtn');
    
    // Display elements
    const emailSubjectDisplay = document.getElementById('emailSubjectDisplay');
    const emailFromDisplay = document.getElementById('emailFromDisplay');
    const emailDateDisplay = document.getElementById('emailDateDisplay');
    const scamTypeBadge = document.getElementById('scamTypeBadge');
    const riskLevelBadge = document.getElementById('riskLevelBadge');
    const emailContentDisplay = document.getElementById('emailContentDisplay');
    const analysisTagsDisplay = document.getElementById('analysisTagsDisplay');
    const analysisExplanation = document.getElementById('analysisExplanation');
    
    // Action buttons
    const markSafeBtn = document.getElementById('markSafeBtn');
    const markDangerousBtn = document.getElementById('markDangerousBtn');
    
    let emailData = [];
    let currentEmailIndex = 0;
    let currentRegion = '';
    
    // Sample data for other regions (USA, India, Russia)
    const sampleEmailData = {
        usa: [
            {
                subject: "Action Required: Your Bank Account Will Be Suspended",
                sender: "Bank of America Security <security@bankofamerica-alert.com>",
                date: "2024-10-15",
                content: `Dear Valued Customer,

We have detected suspicious activity on your Bank of America account. Your account will be suspended within 24 hours unless you verify your information immediately.

Click here to verify your account: http://bankofamerica-verification.secure-login.net

You will need to provide:
- Username and Password
- Social Security Number
- Account Number
- Phone Number

Failure to verify within 24 hours will result in permanent account closure.

Bank of America Security Team
DO NOT REPLY TO THIS EMAIL`,
                scamType: "banking",
                riskLevel: "high"
            },
            {
                subject: "IRS Tax Refund: $2,847 Available for Immediate Claim",
                sender: "Internal Revenue Service <refunds@irs-treasury.gov>",
                date: "2024-10-14",
                content: `OFFICIAL NOTICE FROM THE IRS

You are eligible for a tax refund of $2,847.00 from the 2023 tax year.

To receive your refund immediately, click the link below and provide your banking information:

https://irs-refund-processing.treasury-gov.net/claim

Required Information:
- Social Security Number
- Bank Account Number
- Routing Number
- Driver's License Number

This refund will expire in 72 hours if not claimed.

Internal Revenue Service
U.S. Department of Treasury`,
                scamType: "government",
                riskLevel: "high"
            }
        ],
        india: [
            {
                subject: "Complete Your KYC or Account Will Be Blocked - SBI",
                sender: "State Bank of India <kyc@sbi-india.co.in>",
                date: "2024-10-15",
                content: `Dear SBI Customer,

Your account KYC (Know Your Customer) verification is pending. As per RBI guidelines, your account will be blocked if KYC is not completed within 48 hours.

Complete your KYC now: http://sbi-kyc-update.co.in

Required Documents:
- PAN Card
- Aadhaar Card
- Bank Account Details
- Mobile OTP Verification

Ignore this message at your own risk.

State Bank of India
Customer Service Team`,
                scamType: "banking",
                riskLevel: "high"
            },
            {
                subject: "Job Offer: $2000/month Work From Home Opportunity",
                sender: "TCS HR Department <hr@tcs-careers.co.in>",
                date: "2024-10-14",
                content: `Dear Job Seeker,

Congratulations! You have been selected for a work-from-home position with Tata Consultancy Services (TCS).

Position: Data Entry Operator
Salary: $2000 per month
Working Hours: 4 hours daily

To confirm your position, pay a registration fee of ₹5000 to cover training materials and laptop shipping.

Payment Details:
Account Name: TCS Training Center
Account Number: 1234567890
IFSC Code: SBIN0001234

Send payment confirmation to secure your job immediately.

TCS HR Department`,
                scamType: "job",
                riskLevel: "medium"
            }
        ],
        russia: [
            {
                subject: "Urgent: Critical Security Update Required",
                sender: "Microsoft Security <security@microsoft-updates.ru>",
                date: "2024-10-15",
                content: `CRITICAL SECURITY ALERT

Your Windows system has been compromised by malware. Immediate action is required to prevent data loss.

Download the security patch immediately:
https://microsoft-security-update.download-center.ru/patch.exe

This update will:
- Remove all malware
- Secure your personal data
- Protect against future attacks

WARNING: Failure to install this update within 2 hours may result in complete system failure and data loss.

Microsoft Security Team
Incident ID: MS-2024-10-15-7829`,
                scamType: "tech_support",
                riskLevel: "high"
            },
            {
                subject: "Love Letter from Natasha - Are You Single?",
                sender: "Natasha Petrova <natasha.petrova@yandex.ru>",
                date: "2024-10-14",
                content: `Hello my dear friend,

My name is Natasha, I am 28 years old beautiful woman from Moscow, Russia. I found your email and I think you seem like a very nice person.

I am looking for serious relationship and maybe marriage with foreign man. I am lonely and want to find my true love.

Please write me back if you are interested. I will send you my photos.

I am waiting for your letter.

With love and hope,
Natasha

P.S. If you are serious about relationship, I may need help with visa costs to visit you. It costs about $500.`,
                scamType: "romance",
                riskLevel: "medium"
            }
        ]
    };
    
    // Region selection handler
    regionSelect.addEventListener('change', function() {
        const selectedRegion = this.value;
        if (selectedRegion === 'africa') {
            loadNigerianCSV();
        } else if (selectedRegion && sampleEmailData[selectedRegion]) {
            loadSampleEmails(selectedRegion);
        } else {
            showEmptyState();
        }
    });
    
    // Navigation handlers
    prevEmailBtn.addEventListener('click', () => navigateEmail(-1));
    nextEmailBtn.addEventListener('click', () => navigateEmail(1));
    jumpToBtn.addEventListener('click', jumpToEmail);
    jumpToInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') jumpToEmail();
    });
    
    // Action button handlers
    markSafeBtn.addEventListener('click', () => markEmail('safe'));
    markDangerousBtn.addEventListener('click', () => markEmail('dangerous'));
    
    // Load Nigerian CSV file for Africa region
    function loadNigerianCSV() {
        showLoading();
        currentRegion = 'africa';
        const regionInfo = document.getElementById('regionInfo');
        regionInfo.textContent = 'Loading authentic Nigerian scam emails from Lagos...';
        
        // Try multiple paths to fetch the CSV file
        const csvPaths = [
            '/Nigerian_Fraud.csv',
            './Nigerian_Fraud.csv',
            '../Nigerian_Fraud.csv',
            'Nigerian_Fraud.csv'
        ];
        
        let pathIndex = 0;
        
        function tryNextPath() {
            if (pathIndex >= csvPaths.length) {
                console.error('Failed to load CSV from any path');
                showEmptyState();
                totalEmailsSpan.textContent = 'Error loading emails';
                regionInfo.textContent = 'Failed to load authentic Nigerian email data';
                toast('Error: Could not locate Nigerian_Fraud.csv file. Please ensure it exists in the public folder.', 6000);
                return;
            }
            
            const currentPath = csvPaths[pathIndex];
            console.log(`Trying to fetch CSV from: ${currentPath}`);
            
            fetch(currentPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for path: ${currentPath}`);
                    }
                    return response.text();
                })
                .then(csvText => {
                    console.log(`Successfully loaded CSV from: ${currentPath}`);
                    console.log(`CSV content length: ${csvText.length} characters`);
                    console.log('First 500 characters of CSV:', csvText.substring(0, 500));
                    
                    emailData = parseNigerianCSV(csvText);
                    currentEmailIndex = 0;
                    
                    console.log(`Parsed ${emailData.length} emails from CSV`);
                    if (emailData.length > 0) {
                        console.log('Sample email:', emailData[0]);
                        showEmailViewer();
                        displayCurrentEmail();
                        updateNavigation();
                        totalEmailsSpan.textContent = `${emailData.length} authentic emails from Nigerian scammers`;
                        regionInfo.textContent = `Displaying ${emailData.length} real phishing emails from Lagos, Nigeria`;
                        toast(`✅ Loaded ${emailData.length} authentic phishing emails from Lagos scammers for educational analysis`, 4000);
                    } else {
                        console.log('No valid emails found after parsing');
                        showEmptyState();
                        toast('⚠️ CSV file loaded but no valid emails found', 3000);
                    }
                })
                .catch(error => {
                    console.error(`Error loading CSV from ${currentPath}:`, error);
                    pathIndex++;
                    tryNextPath();
                });
        }
        
        tryNextPath();
    }
    
    function loadSampleEmails(region) {
        showLoading();
        currentRegion = region;
        regionInfo.textContent = `Loading ${region.toUpperCase()} phishing examples...`;
        
        // Simulate loading delay
        setTimeout(() => {
            emailData = sampleEmailData[region] || [];
            currentEmailIndex = 0;
            
            if (emailData.length > 0) {
                showEmailViewer();
                displayCurrentEmail();
                updateNavigation();
                totalEmailsSpan.textContent = `${emailData.length} sample emails available`;
                regionInfo.textContent = `${region.toUpperCase()} sample emails loaded`;
            } else {
                showEmptyState();
            }
        }, 1000);
    }
    
    function parseNigerianCSV(csvText) {
        console.log('Starting CSV parsing...');
        
        // Parse CSV properly handling multi-line quoted fields
        const rows = parseCSVText(csvText);
        console.log(`Total rows in CSV: ${rows.length}`);
        
        if (rows.length < 2) {
            console.error('CSV file has insufficient rows');
            return [];
        }
        
        // Get headers from first row
        const headers = rows[0];
        console.log('CSV Headers:', headers);
        
        // Find column indices (case-insensitive search)
        const senderIndex = headers.findIndex(h => h.toLowerCase().includes('sender') || h.toLowerCase().includes('from'));
        const receiverIndex = headers.findIndex(h => h.toLowerCase().includes('receiver') || h.toLowerCase().includes('to'));
        const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('time'));
        const subjectIndex = headers.findIndex(h => h.toLowerCase().includes('subject'));
        const bodyIndex = headers.findIndex(h => h.toLowerCase().includes('body') || h.toLowerCase().includes('content') || h.toLowerCase().includes('message'));
        const urlsIndex = headers.findIndex(h => h.toLowerCase().includes('urls') || h.toLowerCase().includes('url'));
        const labelIndex = headers.findIndex(h => h.toLowerCase().includes('label') || h.toLowerCase().includes('class'));
        
        console.log('Column indices:', {
            sender: senderIndex,
            receiver: receiverIndex,
            date: dateIndex,
            subject: subjectIndex,
            body: bodyIndex,
            urls: urlsIndex,
            label: labelIndex
        });
        
        const emails = [];
        let validEmails = 0;
        let invalidEmails = 0;
        
        for (let i = 1; i < rows.length; i++) {
            try {
                const values = rows[i];
                if (values.length >= Math.max(senderIndex, subjectIndex, bodyIndex) + 1) {
                    const email = {
                        sender: values[senderIndex] || 'Unknown Sender',
                        receiver: values[receiverIndex] || '',
                        date: values[dateIndex] || 'Unknown Date',
                        subject: values[subjectIndex] || 'No Subject',
                        content: values[bodyIndex] || 'No content available',
                        urls: values[urlsIndex] || '0',
                        label: values[labelIndex] || '1'
                    };
                    
                    // Clean up the content
                    email.subject = email.subject.trim();
                    email.content = email.content.trim();
                    email.sender = email.sender.trim();
                    
                    // Skip obviously empty or invalid emails
                    if (email.subject.length > 3 && email.content.length > 10) {
                        // Add derived fields
                        email.riskLevel = determineRiskLevel(email);
                        email.scamType = classifyScamType(email);
                        emails.push(email);
                        validEmails++;
                    } else {
                        invalidEmails++;
                    }
                } else {
                    invalidEmails++;
                }
            } catch (error) {
                console.error(`Error parsing row ${i}:`, error);
                invalidEmails++;
            }
        }
        
        console.log(`CSV parsing complete. Valid emails: ${validEmails}, Invalid emails: ${invalidEmails}`);
        return emails;
    }
    
    function parseCSVText(csvText) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let insideQuotes = false;
        let i = 0;
        
        while (i < csvText.length) {
            const char = csvText[i];
            const nextChar = i < csvText.length - 1 ? csvText[i + 1] : null;
            
            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i += 2;
                    continue;
                } else {
                    // Start or end of quoted field
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                // End of field
                currentRow.push(currentField);
                currentField = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                // End of row
                if (currentField !== '' || currentRow.length > 0) {
                    currentRow.push(currentField);
                    if (currentRow.some(field => field.trim() !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                }
                // Skip \r\n combinations
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                currentField += char;
            }
            i++;
        }
        
        // Add final row if exists
        if (currentField !== '' || currentRow.length > 0) {
            currentRow.push(currentField);
            if (currentRow.some(field => field.trim() !== '')) {
                rows.push(currentRow);
            }
        }
        
        return rows;
    }
    
    function determineRiskLevel(email) {
        const subject = (email.subject || '').toLowerCase();
        const content = (email.content || '').toLowerCase();
        
        const highRiskWords = ['urgent', 'immediate', 'lottery', 'million', 'inheritance', 'wire transfer', 'western union', 'suspended', 'blocked', 'claim', 'beneficiary'];
        const mediumRiskWords = ['opportunity', 'investment', 'business', 'partnership', 'confidential', 'verify', 'update', 'assistance', 'proposal'];
        
        const text = subject + ' ' + content;
        const highCount = highRiskWords.filter(word => text.includes(word)).length;
        const mediumCount = mediumRiskWords.filter(word => text.includes(word)).length;
        
        if (highCount >= 3) return 'high';
        if (highCount >= 1 || mediumCount >= 3) return 'medium';
        return 'low';
    }
    
    function classifyScamType(email) {
        const subject = (email.subject || '').toLowerCase();
        const content = (email.content || '').toLowerCase();
        const text = subject + ' ' + content;
        
        if (text.includes('lottery') || text.includes('won') || text.includes('winner') || text.includes('congratulations')) return 'lottery';
        if (text.includes('inheritance') || text.includes('deceased') || text.includes('will') || text.includes('beneficiary')) return 'inheritance';
        if (text.includes('business') || text.includes('investment') || text.includes('partnership') || text.includes('proposal')) return 'business';
        if (text.includes('bank') || text.includes('account') || text.includes('suspended') || text.includes('frozen')) return 'banking';
        if (text.includes('irs') || text.includes('tax') || text.includes('government') || text.includes('refund')) return 'government';
        if (text.includes('job') || text.includes('employment') || text.includes('salary') || text.includes('work')) return 'job';
        if (text.includes('love') || text.includes('relationship') || text.includes('dating') || text.includes('marriage')) return 'romance';
        if (text.includes('security') || text.includes('virus') || text.includes('update') || text.includes('software')) return 'tech_support';
        if (text.includes('assistance') || text.includes('help') || text.includes('urgent') || text.includes('confidential')) return 'advance_fee';
        return 'other';
    }
    
    function displayCurrentEmail() {
        if (emailData.length === 0 || currentEmailIndex >= emailData.length) return;
        
        const email = emailData[currentEmailIndex];
        
        // Update display elements
        emailSubjectDisplay.textContent = email.subject || 'No Subject';
        emailFromDisplay.innerHTML = `<i class="bi bi-person me-1"></i>${escapeHtml(email.sender || 'Unknown Sender')}`;
        emailDateDisplay.innerHTML = `<i class="bi bi-calendar me-1"></i>${email.date || 'Unknown Date'}`;
        
        // Update badges
        const typeLabel = email.scamType.charAt(0).toUpperCase() + email.scamType.slice(1).replace('_', ' ');
        scamTypeBadge.textContent = typeLabel;
        
        riskLevelBadge.textContent = `${email.riskLevel.toUpperCase()} RISK`;
        riskLevelBadge.className = `badge risk-badge risk-${email.riskLevel}`;
        
        // Update content with proper formatting
        const content = email.content || 'No content available';
        // Convert line breaks to HTML and preserve formatting
        const formattedContent = escapeHtml(content).replace(/\n/g, '<br>');
        emailContentDisplay.innerHTML = formattedContent;
        
        // Update analysis
        updateAnalysis(email);
    }
    
    function updateAnalysis(email) {
        // Generate analysis tags
        const tags = generateAnalysisTags(email);
        analysisTagsDisplay.innerHTML = tags.map(tag => 
            `<span class="analysis-tag ${tag.type}">${tag.text}</span>`
        ).join('');
        
        // Generate explanation
        const explanation = generateAnalysisExplanation(email);
        analysisExplanation.innerHTML = explanation;
    }
    
    function generateAnalysisTags(email) {
        const tags = [];
        const text = ((email.subject || '') + ' ' + (email.content || '')).toLowerCase();
        
        if (text.includes('urgent') || text.includes('immediate')) {
            tags.push({ text: 'Urgency Tactics', type: 'warning' });
        }
        if (text.includes('money') || text.includes('$') || text.includes('million') || text.includes('dollar')) {
            tags.push({ text: 'Large Money Promise', type: '' });
        }
        if (text.includes('confidential') || text.includes('secret') || text.includes('private')) {
            tags.push({ text: 'False Secrecy', type: 'warning' });
        }
        if (text.includes('fee') || text.includes('tax') || text.includes('charge') || text.includes('cost')) {
            tags.push({ text: 'Advance Fee Request', type: '' });
        }
        if (text.includes('beneficiary') || text.includes('inheritance') || text.includes('claim')) {
            tags.push({ text: 'False Inheritance', type: '' });
        }
        if (text.includes('assistance') || text.includes('help') || text.includes('partner')) {
            tags.push({ text: 'False Partnership', type: 'warning' });
        }
        if (text.includes('god') || text.includes('blessing') || text.includes('prayer')) {
            tags.push({ text: 'Religious Manipulation', type: 'info' });
        }
        if (text.includes('bank') || text.includes('account') || text.includes('transfer')) {
            tags.push({ text: 'Banking Fraud', type: '' });
        }
        
        return tags;
    }
    
    function generateAnalysisExplanation(email) {
        const riskLevel = email.riskLevel;
        const scamType = email.scamType;
        
        let explanation = `<strong>Risk Assessment: ${riskLevel.toUpperCase()}</strong><br><br>`;
        
        if (currentRegion === 'africa') {
            explanation += '<strong>Authentic Nigerian Scam Email</strong><br>';
            explanation += 'This is a real phishing email from the Nigerian_Fraud.csv dataset, collected from actual Lagos-based scammers. ';
        }
        
        switch (scamType) {
            case 'inheritance':
                explanation += 'Classic "419 scam" or advance fee fraud claiming you are entitled to a large inheritance. The scammer requests upfront fees to process the claim. All such emails are fraudulent.';
                break;
            case 'lottery':
                explanation += 'Lottery scam claiming you\'ve won money in a lottery you never entered. They request personal information and fees to claim "winnings." Legitimate lotteries never work this way.';
                break;
            case 'business':
                explanation += 'Business opportunity scam promising large returns for minimal effort. Often involves money laundering schemes or advance fee fraud disguised as investment opportunities.';
                break;
            case 'advance_fee':
                explanation += 'Advance fee fraud where scammers request upfront payments for promised larger returns. This is the foundation of most Nigerian scams (419 fraud).';
                break;
            case 'banking':
                explanation += 'Banking fraud attempting to steal credentials or convince victims to transfer money. Real banks never communicate this way via email.';
                break;
            case 'government':
                explanation += 'Government impersonation scam. Real government agencies communicate primarily through postal mail and never request immediate payments via email.';
                break;
            case 'job':
                explanation += 'Employment scam offering unrealistic salaries for simple work. Legitimate employers never charge fees for job opportunities.';
                break;
            case 'romance':
                explanation += 'Romance scam where criminals create fake profiles to build relationships and eventually request money for emergencies or travel expenses.';
                break;
            case 'tech_support':
                explanation += 'Tech support scam claiming your computer is infected. They may ask you to download malicious software or provide remote access.';
                break;
            default:
                explanation += 'This email exhibits characteristics typical of advance fee fraud or 419 scams originating from Nigeria. Always verify through official channels.';
        }
        
        if (currentRegion === 'africa') {
            explanation += '<br><br><strong>Educational Value:</strong> Studying real scam emails like this helps you recognize the language patterns, emotional manipulation tactics, and structural elements that Nigerian scammers commonly use. This authentic data provides invaluable insight into actual criminal operations for training purposes.';
        }
        
        return explanation;
    }
    
    function navigateEmail(direction) {
        const newIndex = currentEmailIndex + direction;
        if (newIndex >= 0 && newIndex < emailData.length) {
            currentEmailIndex = newIndex;
            displayCurrentEmail();
            updateNavigation();
        }
    }
    
    function jumpToEmail() {
        const emailNumber = parseInt(jumpToInput.value);
        if (emailNumber >= 1 && emailNumber <= emailData.length) {
            currentEmailIndex = emailNumber - 1;
            displayCurrentEmail();
            updateNavigation();
            jumpToInput.value = '';
        } else {
            toast(`Please enter a number between 1 and ${emailData.length}`, 3000);
        }
    }
    
    function updateNavigation() {
        emailCounter.textContent = `Email ${currentEmailIndex + 1} of ${emailData.length}`;
        prevEmailBtn.disabled = currentEmailIndex === 0;
        nextEmailBtn.disabled = currentEmailIndex === emailData.length - 1;
    }
    
    function markEmail(type) {
        const message = type === 'safe' ? 
            'This email has been marked as a safe example for educational purposes.' :
            'This email has been marked as dangerous. Great job identifying the threats!';
        toast(message, 3000);
    }
    
    function showLoading() {
        emailViewerSection.style.display = 'none';
        emptyState.style.display = 'none';
        loadingState.style.display = 'block';
    }
    
    function showEmailViewer() {
        loadingState.style.display = 'none';
        emptyState.style.display = 'none';
        emailViewerSection.style.display = 'block';
    }
    
    function showEmptyState() {
        loadingState.style.display = 'none';
        emailViewerSection.style.display = 'none';
        emptyState.style.display = 'block';
        totalEmailsSpan.textContent = '0 emails available';
        regionInfo.textContent = 'Select a region to start';
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

function initializeGlobalPatternsQuiz() {
    const quizButtons = document.querySelectorAll('.quiz-btn');
    const quizResult = document.getElementById('quizResult');
    
    if (!quizButtons.length) return; // Quiz section was removed
    
    quizButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedAnswer = this.dataset.answer;
            const correctAnswer = 'africa'; // The lottery scam example is from Africa
            
            // Remove any previous classes
            quizButtons.forEach(btn => {
                btn.classList.remove('correct', 'incorrect');
            });
            
            // Mark correct and incorrect answers
            quizButtons.forEach(btn => {
                if (btn.dataset.answer === correctAnswer) {
                    btn.classList.add('correct');
                } else if (btn.dataset.answer === selectedAnswer && selectedAnswer !== correctAnswer) {
                    btn.classList.add('incorrect');
                }
            });
            
            // Show result
            if (selectedAnswer === correctAnswer) {
                quizResult.innerHTML = `
                    <div class="correct-answer">
                        <i class="bi bi-check-circle-fill"></i>
                        <strong>Correct!</strong> This is a classic African "419 scam" pattern involving lottery winnings and upfront fees.
                    </div>
                `;
                quizResult.style.background = 'rgba(76, 196, 83, 0.1)';
            } else {
                quizResult.innerHTML = `
                    <div class="incorrect-answer">
                        <i class="bi bi-x-circle-fill"></i>
                        <strong>Incorrect.</strong> This is actually a classic African "419 scam" pattern. These scams typically involve lottery winnings, inheritance claims, or business opportunities that require upfront fees.
                    </div>
                `;
                quizResult.style.background = 'rgba(255, 91, 91, 0.1)';
                quizResult.style.color = '#ff5b5b';
            }
            
            quizResult.style.display = 'block';
            
            // Add educational information
            setTimeout(() => {
                const educationalNote = document.createElement('div');
                educationalNote.className = 'educational-note mt-3';
                educationalNote.innerHTML = `
                    <h6><i class="bi bi-lightbulb"></i> Did you know?</h6>
                    <p>The "419 scam" gets its name from Section 419 of the Nigerian Criminal Code. These scams have been around since the 1980s and have evolved from letters to emails and now social media messages.</p>
                `;
                if (!quizResult.querySelector('.educational-note')) {
                    quizResult.appendChild(educationalNote);
                }
            }, 1000);
        });
    });
}
