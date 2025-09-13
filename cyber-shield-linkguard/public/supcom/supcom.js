document.addEventListener('DOMContentLoaded', function() {
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
    const exitChatBtn = document.querySelector('.exit-chat-btn'); // Select the exit chat button

    let currentUserFullName = "User"; // Default for unauthenticated

    // Function to fetch and display member count
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

    // Check user authentication and chat joined status on load
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
                    // Continue to show welcome form if check fails
                }
                
                welcomeForm.style.display = 'flex';
                updateMemberCount();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error initializing page:', error);
            // Fallback to showing welcome form if API calls fail
            document.getElementById('welcome-message').textContent = `Welcome to our support community!`;
            welcomeForm.style.display = 'flex';
            currentChatMembers.textContent = 'Members count unavailable';
        }
    }

    // Show the chat interface (sidebar and main chat)
    function showChatInterface() {
        welcomeForm.style.display = 'none'; // Hide welcome form
        chatInterface.style.display = 'flex'; // Show chat interface
        scrollToBottom();
    }
    
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
            credentials: 'include' // Important for sending session cookies
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

// Update the check_joined function call
async function checkChatJoined() {
    try {
        const response = await fetch('/api/chats/check_joined', {
            credentials: 'include' // Important for session cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.joined;
        }
        return false;
    } catch (error) {
        console.error('Error checking join status:', error);
        return false;
    }
}

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // Create new message element
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
            
            // Simulate a response after a short delay
            simulateResponse(message);
        }
    }
    
    const predefinedResponses = [
        {
            keywords: ['hello', 'hi', 'hey', 'greetings'],
            responses: [`Hello ${currentUserFullName}! How can I assist you today?`, `Hi there! What can I help you with?`, `Greetings! How may I be of service?`]
        },
        {
            keywords: ['scanner', 'detect', 'scan', 'verify', 'check'],
            responses: [
                "Our scanner uses advanced algorithms to detect threats by integrating with VirusTotal. Make sure you're using the latest version for best results.",
                "To scan a file or URL, simply navigate to the Scanner Dashboard and use the respective input fields. Our system will analyze it against known malware signatures.",
                "The QR code scanner feature helps identify malicious QR codes. Just use your device's camera through the app to scan them safely.",
                "Are you experiencing issues with the scanner's detection capabilities? Please provide more details about what you're trying to scan."
            ]
        },
        {
            keywords: ['url', 'link', 'website', 'phishing'],
            responses: [
                "For URL security checks, LinkGuard analyzes suspicious URLs using the VirusTotal API. This helps identify phishing attempts and malicious sites.",
                "If you've encountered a suspicious link, you can paste it into our URL Security Check feature on the dashboard for immediate analysis.",
                "Our anti-phishing capabilities are designed to protect you from malicious links. Always be cautious before clicking unfamiliar URLs."
            ]
        },
        {
            keywords: ['file', 'upload', 'malware', 'virus'],
            responses: [
                "You can upload and verify files against malware signatures using our File Scanning feature. This ensures your downloads are safe.",
                "If a file is flagged, it means it might contain malware. We recommend not opening such files and deleting them immediately.",
                "Our file scanner integrates with VirusTotal, providing comprehensive threat intelligence for uploaded files."
            ]
        },
        {
            keywords: ['qr code', 'qr scanner', 'malicious qr'],
            responses: [
                "The QR Code Scanner feature helps you identify and flag malicious QR codes before they can harm your device.",
                "To use the QR scanner, simply open the app and select the QR scanning option, then point your camera at the code.",
                "Be careful with QR codes from unknown sources! Our scanner provides an extra layer of protection."
            ]
        },
        {
            keywords: ['login', 'signup', 'account', 'authentication'],
            responses: [
                "Our user authentication system provides secure login and sign-up. If you're having trouble logging in, please check your credentials.",
                "For account creation, use the sign-up system. Remember, the demo authentication is localStorage-based and not for production use without enhancements.",
                "If you forgot your password, please use the 'Forgot Password' link on the login page to reset it."
            ]
        },
        {
            keywords: ['dashboard', 'ui', 'interface', 'candy-themed'],
            responses: [
                "The Dashboard Interface offers a simple and intuitive candy-themed UI, making it easy to navigate and use our features.",
                "All key features like URL checks, file scanning, and QR code scanning are accessible from your main dashboard.",
                "We designed the UI to be user-friendly and aesthetically pleasing, enhancing your cybersecurity experience."
            ]
        },
        {
            keywords: ['report', 'issue', 'bug', 'malicious content'],
            responses: [
                "Our Reporting System allows you to report malicious content to authorities directly through the application.",
                "If you've found a bug or an issue, please use the Bug Reports section in the support community or the dedicated reporting feature.",
                "Your reports help us improve Cyber Shield LinkGuard and keep the internet safer for everyone."
            ]
        },
        {
            keywords: ['responsive', 'mobile', 'desktop', 'pwa'],
            responses: [
                "Cyber Shield LinkGuard is a PWA (Progressive Web App) with responsive design, meaning it works seamlessly on both mobile and desktop devices.",
                "You can install it as an app directly from your browser, giving you a native-like experience on any platform.",
                "Whether you're on your phone or computer, you'll get the same consistent and protected experience."
            ]
        },
        {
            keywords: ['deploy', 'vps', 'heroku', 'gunicorn'],
            responses: [
                "Cyber Shield LinkGuard can be deployed on any VPS or Platform-as-a-Service.",
                "For platforms using a Procfile, you can use `web: gunicorn -w 2 -b 0.0.0.0:$PORT app:app`.",
                "Ensure your environment variables, especially the VirusTotal key, are correctly configured for deployment."
            ]
        },
        {
            keywords: ['subscription', 'plan', 'payment'],
            responses: [
                "You can manage your subscription in the Account section. We offer various plans like Free, Pro, Team, and Enterprise to suit different needs.",
                "Our subscription page allows you to view details, upgrade your plan, and manage payment methods.",
                "We provide different subscription tiers to offer varying levels of features and support, ensuring you get the protection you need."
            ]
        },
        {
            keywords: ['clarity'],
            responses: [
                "The 'clarity' feature or section within Cyber Shield LinkGuard might refer to a specific functionality for clear threat analysis or reporting. Could you provide more context?",
                "If you're looking for clearer insights into scan results, our dashboard provides detailed reports.",
                "What exactly are you trying to achieve with 'clarity'?"
            ]
        },
        {
            keywords: ['chats', 'community', 'support'],
            responses: [
                "Welcome to the Cyber Shield Support Community! This is a place where users can help each other, share tips, and get support from our team.",
                "You can access different chat categories like Technical Support, Feature Requests, and Bug Reports from the sidebar.",
                "Our community is here to provide assistance, gather feedback, and ensure you have the best experience with Cyber Shield LinkGuard."
            ]
        },
        {
            keywords: ['thank you', 'thanks', 'appreciate'],
            responses: [`You're most welcome! Is there anything else I can help you with?`, `Glad I could assist! Don't hesitate to ask if you have more questions.`, `No problem at all! Have a great day.`]
        },
        {
            keywords: ['help', 'support', 'issue', 'problem'],
            responses: [`I'm here to help! Could you provide more details about your issue?`, `Please describe your problem in more detail so I can assist you better.`, `What seems to be the problem? I'll do my best to guide you.`]
        },
        {
            keywords: ['suggestions', 'ideas', 'feedback'],
            responses: [
                "We love hearing your ideas! You can share your suggestions in the 'Feature Requests' chat.",
                "Your feedback is invaluable in helping us improve Cyber Shield LinkGuard.",
                "Feel free to share any ideas you have to make our product even better!"
            ]
        },
        {
            keywords: ['error', 'bug'],
            responses: [
                "If you've encountered an error or a bug, please provide specific details like error messages or steps to reproduce it. You can also report it in the 'Bug Reports' chat.",
                "Our team is always working to fix issues. Your detailed report will greatly assist us.",
                "Could you tell me more about the error you're seeing?"
            ]
        },
        {
            keywords: ['requirements', 'dependencies'],
            responses: [
                "The project dependencies are listed in `requirements.txt`. You can install them using `pip install -r requirements.txt`.",
                "Make sure you've activated your virtual environment before installing dependencies to avoid conflicts.",
                "If you're having trouble with specific dependencies, please let me know which one."
            ]
        },
        {
            keywords: ['procfile', 'gunicorn'],
            responses: [
                "The `Procfile` is used for deployment on platforms like Heroku. It specifies the command to run your web application, such as `web: gunicorn -w 2 -b 0.0.0.0:$PORT app:app`.",
                "Gunicorn is a WSGI HTTP server that handles requests to your Python application in a production environment.",
                "If you're deploying, ensure your `Procfile` is correctly configured to start your app."
            ]
        },
        {
            keywords: ['guest', 'demo authentication'],
            responses: [
                "The build includes simple localStorage-based demo authentication for Login/Sign Up/Guest access.",
                "Please note that this demo authentication is NOT for production use and lacks proper security enhancements. It's intended for testing and development purposes.",
                "If you're setting up for production, you'll need to implement a more robust authentication system."
            ]
        },
        {
            keywords: ['cross-platform'],
            responses: [
                "Cyber Shield LinkGuard is a cross-platform tool, meaning it's designed to work across various operating systems and devices, including desktop and mobile, thanks to its PWA nature.",
                "This ensures you can stay protected no matter what device you're using.",
                "Our goal is to provide consistent cybersecurity protection across all your platforms."
            ]
        }
        // Add more specific responses as needed
    ];

    function simulateResponse(userMessage) {
        setTimeout(() => {
            let response = "I'm here to help! Could you provide more details about your issue?"; // Default response

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
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Chat list item click handler
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            chatItems.forEach(chat => chat.classList.remove('active'));
            this.classList.add('active');
            
            // Get the chat data
            const chatType = this.getAttribute('data-chat');
            const chatTitle = this.querySelector('h4').textContent;
            
            // Update the chat header
            currentChatTitle.textContent = chatTitle;
            currentChatAvatar.src = `../assets/com/${chatType}.png`;
            
            // Update member count based on chat type 
            if (chatType === 'CyberShieldCommunity') {
                updateMemberCount(); 
            } else if (chatType === 'TechnicalSupport') {
                currentChatMembers.textContent = 'Online now';
            } else if (chatType === 'FeatureRequests') {
                currentChatMembers.textContent = '245 suggestions';
            } else if (chatType === 'BugReports') {
                currentChatMembers.textContent = '89 issues reported';
            }
            
            // Clear messages and add appropriate ones
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

    // Initialize the page on load
    initializePage();

    // Exit chat button handler
    exitChatBtn.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        if (confirm('Are you sure you want to exit the support chat?')) {
            window.location.href = '../ScannerDash/ScannerDash.html';
        }
    });
});

