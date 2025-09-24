document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const navTabs = document.querySelectorAll('.nav-tab');
    const channelItems = document.querySelectorAll('.channel-item');
    const dmItems = document.querySelectorAll('.dm-item');
    const dashboardContent = document.getElementById('dashboard-content');
    const channelChat = document.getElementById('channel-chat');
    const dmChat = document.getElementById('dm-chat');
    const membersSidebar = document.getElementById('members-sidebar');
    const currentChannel = document.getElementById('current-channel');
    const currentUser = document.getElementById('current-user');
    const channelInfo = document.getElementById('channel-info');
    const userInfo = document.getElementById('user-info');
    const sidebarTitle = document.getElementById('sidebar-title');
    const messageInputs = document.querySelectorAll('.message-input');
    const sendButtons = document.querySelectorAll('.send-button');
    const dmMessages = document.getElementById('dm-messages');
    const userAvatar = document.getElementById('user-avatar');
    
    // Fetch and display user information
    async function fetchUserInfo() {
        try {
            const response = await fetch('/api/auth/me');
            const userData = await response.json();
            
            if (userData.authenticated) {
                // Display user's initials in the avatar
                const initials = getInitials(userData.full_name);
                userAvatar.textContent = initials;
                
                // Store user info for later use
                window.currentUser = userData;
            } else {
                // Default to 'T' if not authenticated (fallback)
                userAvatar.textContent = 'T';
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            // Default to 'T' if there's an error
            userAvatar.textContent = 'T';
        }
    }
    
    // Helper function to get initials from full name
    function getInitials(fullName) {
        if (!fullName) return 'U';
        
        return fullName
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    // Call the function to fetch user info when page loads
    fetchUserInfo();
    
    // Conversation data for each user
    const conversations = {
        'sivu': [
            {
                sender: 'sivu',
                time: 'Yesterday, 3:45 PM',
                text: 'Hey Ted, do you have a moment to review the security assessment I sent you?'
            },
            {
                sender: 'ted',
                time: 'Yesterday, 4:20 PM',
                text: 'Yes, I\'ve looked it over. The encryption implementation looks solid, but we might need to strengthen the key rotation process.'
            },
            {
                sender: 'sivu',
                time: 'Today, 9:15 AM',
                text: 'I\'ve updated the key rotation process as we discussed. Can you take another look?'
            },
            {
                sender: 'ted',
                time: 'Today, 9:30 AM',
                text: 'Perfect! This looks much more robust. Let\'s schedule a deployment for tomorrow.'
            }
        ],
        'sino': [
            {
                sender: 'sino',
                time: 'Yesterday, 2:30 PM',
                text: 'Ted, I need your approval for the new firewall rules I\'ve proposed.'
            },
            {
                sender: 'ted',
                time: 'Yesterday, 3:15 PM',
                text: 'I\'ll review them this afternoon. Can you send me the documentation?'
            },
            {
                sender: 'sino',
                time: 'Today, 8:45 AM',
                text: 'Just sent the documentation. Let me know if you need anything else.'
            }
        ],
        'mihlali': [
            {
                sender: 'mihlali',
                time: 'Monday, 4:10 PM',
                text: 'Ted, when can we schedule the penetration testing for the new module?'
            },
            {
                sender: 'ted',
                time: 'Monday, 4:45 PM',
                text: 'Let\'s aim for Thursday. I\'ll check with the testing team and confirm.'
            },
            {
                sender: 'mihlali',
                time: 'Today, 10:05 AM',
                text: 'Confirmed with the testing team. Thursday at 10 AM works for them.'
            }
        ]
    };

    // Navigation tab functionality
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            const tabName = this.getAttribute('data-tab');
            
            // Hide all content
            dashboardContent.style.display = 'none';
            channelChat.style.display = 'none';
            dmChat.style.display = 'none';
            membersSidebar.style.display = 'none';
            
            // Show appropriate content based on tab
            if (tabName === 'dashboard') {
                dashboardContent.style.display = 'flex';
            } else if (tabName === 'channels') {
                // Show the first channel by default
                showChannel('devsecops');
            } else if (tabName === 'direct-messages') {
                // Show the first DM by default
                showDirectMessage('sivu');
            }
        });
    });
    
    // Channel item functionality
    channelItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            channelItems.forEach(i => i.classList.remove('active'));
            dmItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Switch to channels tab
            navTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="channels"]').classList.add('active');
            
            const channelName = this.getAttribute('data-channel');
            showChannel(channelName);
        });
    });
    
    // DM item functionality
    dmItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            channelItems.forEach(i => i.classList.remove('active'));
            dmItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Switch to direct messages tab
            navTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="direct-messages"]').classList.add('active');
            
            const userName = this.getAttribute('data-user');
            showDirectMessage(userName);
        });
    });
    
    // Show channel function
    function showChannel(channelName) {
        // Hide all content
        dashboardContent.style.display = 'none';
        channelChat.style.display = 'none';
        dmChat.style.display = 'none';
        
        // Show channel chat and members sidebar
        channelChat.style.display = 'flex';
        membersSidebar.style.display = 'block';
        
        // Update channel info
        currentChannel.textContent = channelName;
        sidebarTitle.textContent = 'Channel Members';
        
        // Update based on channel
        if (channelName === 'devsecops') {
            channelInfo.textContent = '4 members';
        }
    }
    
    // Show direct message function
    function showDirectMessage(userName) {
        // Hide all content
        dashboardContent.style.display = 'none';
        channelChat.style.display = 'none';
        dmChat.style.display = 'none';
        
        // Show DM chat and hide members sidebar
        dmChat.style.display = 'flex';
        membersSidebar.style.display = 'none';
        
        // Update user info
        const userNames = {
            'sivu': 'Sivu',
            'sino': 'Sino',
            'mihlali': 'Mihlali'
        };
        
        currentUser.textContent = userNames[userName];
        userInfo.innerHTML = '<i class="fas fa-circle" style="color: var(--candy-green);"></i> Online';
        
        // Update message input placeholder
        document.querySelector('#dm-chat .message-input').placeholder = `Message ${userNames[userName]}`;
        
        // Load conversation for this user
        loadConversation(userName);
    }
    
    // Load conversation for a specific user
    function loadConversation(userName) {
        // Clear current messages
        dmMessages.innerHTML = '';
        
        // Get conversation data
        const conversation = conversations[userName] || [];
        
        // Add messages to the chat
        conversation.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            // Use the current user's name instead of hardcoded "Ted"
            const isOutgoing = msg.sender === 'ted';
            const avatarClass = isOutgoing ? 'avatar-ted' : `avatar-${msg.sender}`;
            const displayName = isOutgoing ? 
                (window.currentUser?.full_name || 'You') : 
                userName.charAt(0).toUpperCase() + userName.slice(1);
            
            // Get initials for avatar
            const avatarInitials = isOutgoing ? 
                getInitials(window.currentUser?.full_name || 'T') : 
                displayName.charAt(0);
            
            messageElement.innerHTML = `
                <div class="message-avatar ${avatarClass}">${avatarInitials}</div>
                <div class="message-content">
                    <div class="message-sender">
                        ${displayName} <span class="message-time">${msg.time}</span>
                    </div>
                    <div class="message-text ${isOutgoing ? 'outgoing' : 'incoming'}">${msg.text}</div>
                </div>
            `;
            
            dmMessages.appendChild(messageElement);
        });
        
        // Scroll to bottom
        dmMessages.scrollTop = dmMessages.scrollHeight;
    }
    
    // Send message functionality
    sendButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            sendMessage(index);
        });
    });
    
    messageInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(index);
            }
        });
    });
    
    function sendMessage(index) {
        const messageInput = messageInputs[index];
        const messagesContainer = index === 0 ? 
            document.getElementById('channel-messages') : 
            document.getElementById('dm-messages');
        
        const message = messageInput.value.trim();
        if (message) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Use the current user's name instead of hardcoded "Ted"
            const userName = window.currentUser?.full_name || 'You';
            const userInitials = getInitials(userName);
            
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <div class="message-avatar avatar-ted">${userInitials}</div>
                <div class="message-content">
                    <div class="message-sender">
                        ${userName} <span class="message-time">${timeString}</span>
                    </div>
                    <div class="message-text outgoing">${message.replace(/\n/g, '<br>')}</div>
                </div>
            `;
            
            messagesContainer.appendChild(messageElement);
            messageInput.value = '';
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
});
