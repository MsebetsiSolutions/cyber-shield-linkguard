document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const welcomeForm = document.getElementById('welcome-form');
    const joinChatBtn = document.getElementById('join-chat-btn');
    const chatInterface = document.getElementById('chat-interface');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const currentChatAvatar = document.getElementById('current-chat-avatar');
    const currentChatTitle = document.getElementById('current-chat-title');
    const currentChatMembers = document.getElementById('current-chat-members');
    const usernameDisplay = document.getElementById('username');
    const exitChatBtn = document.querySelector('.exit-chat-btn');

    let currentUserFullName = "User";

    //======================================================
    // -------------------- Functions ----------------------
    //======================================================

    
    // Fetch and display current member count
    
    async function updateMemberCount() {
        try {
            const response = await fetch('/api/chats/member_count');
            if (!response.ok) {
                throw new Error('Failed to fetch member count');
            }
            const data = await response.json();
            currentChatMembers.textContent = `${data.member_count} members`;
        } catch (error) {
            console.error('Error fetching member count:', error);
            currentChatMembers.textContent = 'Members count unavailable';
        }
    }

    
    // Initialize page by checking authentication and chat status
    
    async function initializePage() {
        try {
            const userResponse = await fetch('/api/auth/me');
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            const userData = await userResponse.json();

            if (userData.authenticated) {
                currentUserFullName = userData.full_name || "User";
                usernameDisplay.textContent = currentUserFullName;
                document.getElementById('welcome-message').textContent = `Hello ${currentUserFullName}! Welcome to our support community.`;

                try {
                    const chatJoinedResponse = await fetch('/api/chats/check_joined');
                    if (chatJoinedResponse.ok) {
                        const chatJoinedData = await chatJoinedResponse.json();
                        if (chatJoinedData.joined) {
                            showChatInterface();
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking join status:', error);
                }
                
                welcomeForm.style.display = 'flex';
                updateMemberCount();
            } else {
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('Error initializing page:', error);
            document.getElementById('welcome-message').textContent = `Welcome to our support community!`;
            welcomeForm.style.display = 'flex';
            currentChatMembers.textContent = 'Members count unavailable';
        }
    }

    
    // Show the chat interface and hide welcome form
    
    function showChatInterface() {
        welcomeForm.style.display = 'none';
        chatInterface.style.display = 'flex';
        scrollToBottom();
        addHelpIcon();
    }
    
    
    // Add help icon to chat input for user assistance
    
    function addHelpIcon() {
        const chatInput = document.querySelector('.chat-input');
        const helpIcon = document.createElement('div');
        helpIcon.className = 'help-icon';
        helpIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
        helpIcon.title = 'Click for tips on asking questions';
        
        helpIcon.addEventListener('click', showHelpModal);
        chatInput.insertBefore(helpIcon, chatInput.firstChild);
    }
    
    
    // Display modal with question asking tips
    
    function showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h3>How to Ask Questions</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="help-modal-body">
                    <p>For better assistance, try asking about:</p>
                    <ul>
                        <li><strong>Scanner issues:</strong> "Why is my scan not working?"</li>
                        <li><strong>Features:</strong> "What can the QR scanner do?"</li>
                        <li><strong>Subscription:</strong> "What are the subscription plans?"</li>
                    </ul>
                    <p>The support bot can help with technical questions about Cyber Shield LinkGuard features.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.querySelector('.close-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    
    //Send message to chat
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'sent');
            
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${message}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
            messageInput.value = '';
            scrollToBottom();
            simulateResponse(message);
        }
    }

    
    //Simulate bot response based on user message
    
    function simulateResponse(userMessage) {
        setTimeout(() => {
            let response = "I'm here to help! Could you tell me more about your issue?";
            const lowerCaseMessage = userMessage.toLowerCase();

            for (const category of predefinedResponses) {
                if (category.keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
                    response = category.responses[Math.floor(Math.random() * category.responses.length)];
                    break; 
                }
            }
            
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'received');
            
            messageElement.innerHTML = `
                <div class="message-avatar">
                    <img src="../assets/com/TechnicalSupport.png" alt="Support Avatar">
                </div>
                <div class="message-content">
                    <div class="message-sender">Tech Support</div>
                    <div class="message-bubble">
                        <p>${response}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
            scrollToBottom();
        }, 1000 + Math.random() * 2000);
    }
    
    
    // Scroll chat messages to bottom
     
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    //======================================================
    // ---------------- Event Listeners -------------------
    //======================================================

    // Handle joining the chat
    joinChatBtn.addEventListener('click', async function() {
        joinChatBtn.disabled = true;
        joinChatBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
        
        try {
            const response = await fetch('/api/chats/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (data.joined) {
                    showChatInterface();
                    updateMemberCount();
                } else {
                    alert(data.message || 'Failed to join chat');
                }
            } else {
                alert(data.error || 'Failed to join chat. Please try again.');
            }
        } catch (error) {
            console.error('Network error when joining chat:', error);
            alert('Network error. Please check your connection and try again.');
        } finally {
            joinChatBtn.disabled = false;
            joinChatBtn.innerHTML = '<i class="fas fa-comments"></i> Join Support Chat';
        }
    });

    // Send message handlers
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Chat list item selection
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            chatItems.forEach(chat => chat.classList.remove('active'));
            this.classList.add('active');
            
            const chatType = this.getAttribute('data-chat');
            const chatTitle = this.querySelector('h4').textContent;
            
            currentChatTitle.textContent = chatTitle;
            currentChatAvatar.src = `../assets/com/${chatType}.png`;
            
            if (chatType === 'CyberShieldCommunity') {
                updateMemberCount(); 
            } else if (chatType === 'TechnicalSupport') {
                currentChatMembers.textContent = 'Online now';
            } else if (chatType === 'FeatureRequests') {
                currentChatMembers.textContent = '245 suggestions';
            } else if (chatType === 'BugReports') {
                currentChatMembers.textContent = '89 issues reported';
            }
            
            chatMessages.innerHTML = `
                <div class="message-date">TODAY</div>
                <div class="message received">
                    <div class="message-avatar">
                        <img src="../assets/com/${chatType}.png" alt="${chatTitle} Avatar">
                    </div>
                    <div class="message-content">
                        <div class="message-sender">${chatTitle} Admin</div>
                        <div class="message-bubble">
                            <p>Welcome to ${chatTitle}! How can we help you today?</p>
                        </div>
                        <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
            `;
            
            scrollToBottom();
        });
    });

    // Exit chat confirmation
    exitChatBtn.addEventListener('click', function(event) {
        event.preventDefault();
        if (confirm('Are you sure you want to exit the support chat?')) {
            window.location.href = '../ScannerDash/ScannerDash.html';
        }
    });

    //======================================================
    // --------------- Predefined Responses ----------------
    //======================================================

    const predefinedResponses = [
        {
            keywords: ['hello', 'hi', 'hey', 'greetings'],
            responses: [`Hello ${currentUserFullName}! How can I help you today?`, `Hi there! What can I assist you with?`, `Greetings! How can I help?`]
        },
        {
            keywords: ['scanner', 'detect', 'scan', 'verify', 'check'],
            responses: [
                "Our scanner uses the VirusTotal API to check files and URLs for threats. It's very accurate!",
                "To scan something, go to the Scanner Dashboard and use the scan options there.",
                "The scanner works with VirusTotal to keep you safe from malware and phishing."
            ]
        },
        {
            keywords: ['url', 'link', 'website', 'phishing'],
            responses: [
                "We use VirusTotal API to check if URLs are safe. It's great for finding phishing sites!",
                "Paste any suspicious link in our URL scanner to check it with VirusTotal.",
                "Our URL scanner helps protect you from malicious websites and phishing attempts."
            ]
        },
        {
            keywords: ['file', 'upload', 'malware', 'virus'],
            responses: [
                "You can upload files to check them with our VirusTotal-powered scanner.",
                "Our file scanner uses VirusTotal API to find malware in uploaded files.",
                "Just upload a file and our VirusTotal integration will check it for threats."
            ]
        },
        {
            keywords: ['qr code', 'qr scanner', 'malicious qr'],
            responses: [
                "The QR scanner helps you check QR codes before scanning them.",
                "Use our QR scanner to avoid malicious QR codes that might be dangerous.",
                "Scan QR codes safely with our built-in QR code scanner feature."
            ]
        },
        {
            keywords: ['login', 'signup', 'account', 'authentication'],
            responses: [
                "The demo authentication uses localStorage and is for testing only.",
                "For real use, you'll need proper authentication - the demo is just for testing.",
                "Remember: The demo login is not secure for production use."
            ]
        },
        {
            keywords: ['dashboard', 'ui', 'interface'],
            responses: [
                "The dashboard is designed to be easy to use with all features in one place.",
                "You'll find everything you need on the main dashboard interface.",
                "Our UI makes it simple to access all the security features."
            ]
        },
        {
            keywords: ['report', 'issue', 'bug', 'malicious content'],
            responses: [
                "Use the report feature to tell us about problems or malicious content.",
                "Found a bug? Please report it so we can fix it!",
                "Reporting helps us improve Cyber Shield for everyone."
            ]
        },
        {
            keywords: ['responsive', 'mobile', 'desktop', 'pwa'],
            responses: [
                "Cyber Shield works on phones and computers through your browser.",
                "You can install it as an app from your browser for easy access.",
                "It works great on both mobile devices and desktop computers."
            ]
        },
        {
            keywords: ['subscription', 'plan', 'payment'],
            responses: [
                "We have different subscription plans to meet your needs.",
                "Check the Subscription page to see available plans and features.",
                "Subscription plans offer different levels of protection and features."
            ]
        },
        {
            keywords: ['clarity'],
            responses: [
                "The clarity feature helps you understand scan results clearly.",
                "Clarity provides easy-to-understand reports about security scans.",
                "This feature makes security information simple and clear."
            ]
        },
        {
            keywords: ['chats', 'community', 'support'],
            responses: [
                "Welcome to our support community! We're here to help.",
                "This is where you can get help and share with other users.",
                "Our community supports each other with cybersecurity questions."
            ]
        },
        {
            keywords: ['thank you', 'thanks', 'appreciate'],
            responses: [`You're welcome!`, `Happy to help!`, `Glad I could assist!`]
        },
        {
            keywords: ['help', 'support', 'issue', 'problem'],
            responses: [`I'm here to help! What's the problem?`, `Tell me more about your issue.`, `How can I assist you today?`]
        },
        {
            keywords: ['suggestions', 'ideas', 'feedback'],
            responses: [
                "We love hearing your ideas for improvement!",
                "Your feedback helps us make Cyber Shield better.",
                "Please share any suggestions you have with us."
            ]
        },
        {
            keywords: ['error', 'bug'],
            responses: [
                "Sorry you're having trouble! What error are you seeing?",
                "Let me know what's not working so I can help.",
                "Could you describe the problem in more detail?"
            ]
        },
        {
            keywords: ['install', 'download', 'setup'],
            responses: [
                "You can install Cyber Shield directly from your browser as a PWA.",
                "Just use the 'Install' option in your browser to add it to your device.",
                "Setup is easy - the app works right in your browser."
            ]
        },
        {
            keywords: ['demo', 'test', 'trial'],
            responses: [
                "The demo uses localStorage authentication for testing purposes only.",
                "Remember: The demo authentication is not for production use.",
                "This is a trial version with basic authentication for testing."
            ]
        },
        {
            keywords: ['cross-platform', 'windows', 'mac', 'android', 'ios'],
            responses: [
                "Cyber Shield works on all devices through your web browser.",
                "You can use it on Windows, Mac, Android, iOS - any device with a browser.",
                "It's cross-platform, so it works everywhere you need protection."
            ]
        }
    ];

    //======================================================
    // ------------------ Initialize ----------------------
    //======================================================

    initializePage();
});
