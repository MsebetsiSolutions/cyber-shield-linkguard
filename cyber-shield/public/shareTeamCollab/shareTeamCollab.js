document.addEventListener("DOMContentLoaded", function () {
  // Global state
  let currentState = {
    user: null,
    teams: [],
    channels: [],
    currentTeam: null,
    currentChannel: null,
    currentDMUser: null,
    conversations: new Map(),
    unreadMessages: new Map() // Track unread messages
  };

  // Elements
  const navTabs = document.querySelectorAll(".nav-tab");
  const dashboardContent = document.getElementById("dashboard-content");
  const channelChat = document.getElementById("channel-chat");
  const dmChat = document.getElementById("dm-chat");
  const teamManagementContent = document.getElementById("team-management-content");
  const membersSidebar = document.getElementById("members-sidebar");

  // Initialize the application
  initApplication();

  async function initApplication() {
    try {
      await fetchUserInfo();
      await loadUserTeams();
      setupEventListeners();
      updateDashboardStats();
      
      // Start polling for new messages (every 30 seconds)
      setInterval(pollForNewMessages, 30000);
    } catch (error) {
      console.error("Initialization error:", error);
      showNotification("Error initializing application. Please refresh the page.", "error");
    }
  }

  // Fetch and display user information with better error handling
  async function fetchUserInfo() {
    try {
      console.log("Fetching user info...");
      
      // Add a small delay to ensure the page is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '../login/login.html';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData = await response.json();
      
      if (userData.authenticated) {
        currentState.user = userData.user;
        
        // Display user's initials in the avatar
        const initials = getInitials(userData.user.full_name);
        document.getElementById('user-avatar').textContent = initials;
        
        // Update dropdown info
        document.getElementById('dropdown-user-name').textContent = userData.user.full_name;
        document.getElementById('dropdown-user-email').textContent = userData.user.email;
        
        console.log("User info loaded successfully");
      } else {
        console.log('User not authenticated, redirecting to login');
        window.location.href = '../login/login.html';
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      
      // More specific error handling
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        showNotification('Network error. Please check your internet connection and try again.', 'error');
      } else if (error.message.includes('HTTP error')) {
        showNotification('Server error. Please try again in a few moments.', 'error');
      } else {
        // Don't redirect immediately for network errors
        showNotification('Unable to verify authentication. Please check your connection.', 'warning');
      }
    }
  }

  // Load user's teams and channels with retry logic
  async function loadUserTeams() {
    let retries = 3;
    
    while (retries > 0) {
      try {
        const response = await fetch("/api/user/teams", {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '../login/login.html';
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentState.teams = data.teams || [];

        // Update UI
        updateTeamsUI();
        updateChannelsList();
        updateDMsList();
        
        return; // Success, exit the retry loop
      } catch (error) {
        retries--;
        console.error(`Error loading teams (${retries} retries left):`, error);
        
        if (retries === 0) {
          showNotification("Error loading teams. Please refresh the page.", "error");
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  // Poll for new messages
  async function pollForNewMessages() {
    if (!currentState.user) return;
    
    try {
      // Check for new messages in current channel
      if (currentState.currentChannel) {
        await loadChannelMessages(currentState.currentChannel.id, true);
      }
      
      // Check for new direct messages
      if (currentState.currentDMUser) {
        await loadDirectMessages(currentState.currentDMUser.id, true);
      }
    } catch (error) {
      console.error("Error polling for messages:", error);
    }
  }

  // Helper function to get initials from full name
  function getInitials(fullName) {
    if (!fullName) return "U";

    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Navigation tabs
    navTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        switchTab(this.getAttribute("data-tab"));
      });
    });

    // Channel creation
    document
      .getElementById("add-channel-btn")
      .addEventListener("click", showCreateChannelModal);
    document
      .getElementById("create-channel-form")
      .addEventListener("submit", createChannel);

    // Team creation
    document
      .getElementById("create-team-btn")
      .addEventListener("click", showCreateTeamModal);
    document
      .getElementById("create-first-team")
      .addEventListener("click", showCreateTeamModal);
    document
      .getElementById("create-team-form")
      .addEventListener("submit", createTeam);

    // Message sending
    document
      .getElementById("send-channel-message")
      .addEventListener("click", sendChannelMessage);
    document
      .getElementById("send-dm-message")
      .addEventListener("click", sendDirectMessage);

    // Message input events
    document
      .getElementById("channel-message-input")
      .addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendChannelMessage();
        }
      });

    document
      .getElementById("dm-message-input")
      .addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendDirectMessage();
        }
      });

    // Member management
    document
      .getElementById("add-member-btn")
      .addEventListener("click", showAddMemberModal);
    document
      .getElementById("user-search")
      .addEventListener("input", debounce(searchUsers, 300));
    document
      .getElementById("confirm-add-member")
      .addEventListener("click", addTeamMember);

    // Direct message search
    document
      .getElementById("new-dm-btn")
      .addEventListener("click", showNewDMModal);
    document
      .getElementById("dm-user-search")
      .addEventListener("input", debounce(searchDMUsers, 300));

    // Modal close events
    setupModalEvents();

    // Members sidebar toggle
    document
      .getElementById("channel-members-toggle")
      .addEventListener("click", toggleMembersSidebar);
      
    // Logout functionality
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
      });
    }
  }

  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Logout user
  async function logoutUser() {
    try {
        // Get current session ID before clearing
        const currentSessionId = window.CyberShieldSession?.getCurrentSessionId();
        
        // Call server logout to invalidate sessions
        const logoutResponse = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
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
    } catch (error) {
        console.log('Logout failed, proceeding with client');
    }
    
    // Clear client-side data
    currentState.user = null;
    
    // Clear session storage
    sessionStorage.removeItem('cyberShieldSession');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('plan_mode');
    
    // Redirect to login page without session ID
    window.location.href = '../login/login.html';
}

  // Tab switching functionality
  function switchTab(tabName) {
    try {
      // Remove active class from all tabs and content
      navTabs.forEach((t) => t.classList.remove("active"));
      dashboardContent.classList.remove("active");
      channelChat.classList.remove("active");
      dmChat.classList.remove("active");
      teamManagementContent.classList.remove("active");
      membersSidebar.classList.remove("active");

      // Add active class to clicked tab and show corresponding content
      document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

      switch (tabName) {
        case "dashboard":
          dashboardContent.classList.add("active");
          updateDashboardStats();
          break;
        case "channels":
          if (currentState.channels.length > 0) {
            showChannel(currentState.channels[0].id);
          } else {
            channelChat.classList.add("active");
            document.getElementById("channel-messages").innerHTML = `
              <div class="no-conversation">
                <i class="fas fa-hashtag"></i>
                <h3>No Channels Available</h3>
                <p>Create a channel to start team collaboration</p>
              </div>
            `;
          }
          break;
        case "direct-messages":
          dmChat.classList.add("active");
          break;
        case "team-management":
          teamManagementContent.classList.add("active");
          break;
      }
    } catch (error) {
      console.error("Error switching tab:", error);
      showNotification("Error loading content. Please try again.", "error");
    }
  }

  // Channel management
  async function showCreateChannelModal() {
    if (currentState.teams.length === 0) {
      showNotification("You need to create a team first", "warning");
      return;
    }
    document.getElementById("create-channel-modal").style.display = "block";
  }

  async function createChannel(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const channelData = {
      name: formData.get("name"),
      description: formData.get("description"),
      is_private: formData.get("is_private") === "on",
    };

    // Use the first team for simplicity
    const teamId = currentState.teams[0]?.id;
    if (!teamId) {
      showNotification("No team available", "error");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channelData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      showNotification("Channel created successfully!", "success");
      document.getElementById("create-channel-modal").style.display = "none";
      e.target.reset();

      // Reload teams and channels
      await loadUserTeams();
    } catch (error) {
      showNotification(error.message, "error");
    }
  }

  // Team management
  async function showCreateTeamModal() {
    document.getElementById("create-team-modal").style.display = "block";
  }

  async function createTeam(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const teamData = {
        name: formData.get('name'),
        description: formData.get('description')
    };

    try {
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const result = await response.json();
        showNotification('Team created successfully!', 'success');
        document.getElementById('create-team-modal').style.display = 'none'; 
        e.target.reset();
        
        // Reload teams
        await loadUserTeams();
        switchTab('team-management');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
  }

  // User search and member management
  async function showAddMemberModal() {
    document.getElementById("add-member-modal").style.display = "block";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("selected-users").innerHTML = "";
    document.getElementById("confirm-add-member").disabled = true;
  }

  async function searchUsers() {
    const query = document.getElementById("user-search").value.trim();

    if (query.length < 2) {
      document.getElementById("search-results").innerHTML = "";
      return;
    }

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      displaySearchResults(data.users);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  function displaySearchResults(users) {
    const container = document.getElementById("search-results");

    if (users.length === 0) {
      container.innerHTML =
        '<div class="search-result-item">No users found</div>';
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="user-name">${user.full_name}</div>
                <div class="user-email">${user.email}</div>
            </div>
        `
      )
      .join("");

    // Add click listeners
    container.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", function () {
        const userId = this.getAttribute("data-user-id");
        const userName = this.querySelector(".user-name").textContent;
        addUserToSelection(userId, userName);
      });
    });
  }

  function addUserToSelection(userId, userName) {
    const selectedContainer = document.getElementById("selected-users");

    // Check if already selected
    if (selectedContainer.querySelector(`[data-user-id="${userId}"]`)) {
      return;
    }

    const selectedUser = document.createElement("div");
    selectedUser.className = "selected-user";
    selectedUser.setAttribute("data-user-id", userId);
    selectedUser.innerHTML = `
            ${userName}
            <span class="remove-selected">&times;</span>
        `;

    selectedUser
      .querySelector(".remove-selected")
      .addEventListener("click", function (e) {
        e.stopPropagation();
        selectedUser.remove();
        updateAddMemberButton();
      });

    selectedContainer.appendChild(selectedUser);
    updateAddMemberButton();
  }

  function updateAddMemberButton() {
    const hasSelected =
      document.getElementById("selected-users").children.length > 0;
    document.getElementById("confirm-add-member").disabled = !hasSelected;
  }

  async function addTeamMember() {
    const selectedUsers = Array.from(
      document.getElementById("selected-users").children
    );
    const teamId = currentState.teams[0]?.id; // Use first team for simplicity

    if (!teamId) {
      showNotification("No team selected", "error");
      return;
    }

    try {
      for (const userEl of selectedUsers) {
        const userId = userEl.getAttribute("data-user-id");

        const response = await fetch(`/api/teams/${teamId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: parseInt(userId), role: "member" }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }
      }

      showNotification("Members added successfully!", "success");
      document.getElementById("add-member-modal").style.display = "none";
      await loadUserTeams(); // Reload to see new members
    } catch (error) {
      showNotification(error.message, "error");
    }
  }

  // Direct message functionality
  async function showNewDMModal() {
    document.getElementById("new-dm-modal").style.display = "block";
    document.getElementById("dm-search-results").innerHTML = "";
  }

  async function searchDMUsers() {
    const query = document.getElementById("dm-user-search").value.trim();

    if (query.length < 2) {
      document.getElementById("dm-search-results").innerHTML = "";
      return;
    }

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      displayDMSearchResults(data.users);
    } catch (error) {
      console.error("DM search error:", error);
    }
  }

  function displayDMSearchResults(users) {
    const container = document.getElementById("dm-search-results");

    if (users.length === 0) {
      container.innerHTML =
        '<div class="search-result-item">No users found</div>';
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="user-name">${user.full_name}</div>
                <div class="user-email">${user.email}</div>
            </div>
        `
      )
      .join("");

    // Add click listeners
    container.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", function () {
        const userId = this.getAttribute("data-user-id");
        const userName = this.querySelector(".user-name").textContent;
        startDirectMessage(userId, userName);
      });
    });
  }

  async function startDirectMessage(userId, userName) {
    currentState.currentDMUser = { id: parseInt(userId), name: userName };

    // Update UI
    document.getElementById("current-user").textContent = userName;
    document.getElementById("user-info").innerHTML =
      '<i class="fas fa-circle" style="color: var(--candy-green);"></i> Online';
    document.getElementById(
      "dm-message-input"
    ).placeholder = `Message ${userName}`;
    document.getElementById("dm-message-input").disabled = false;
    document.getElementById("send-dm-message").disabled = false;

    // Load conversation
    await loadDirectMessages(userId);

    // Close modal and switch to DM tab
    document.getElementById("new-dm-modal").style.display = "none";
    switchTab("direct-messages");
  }

  // Message functionality
  async function sendChannelMessage() {
    const input = document.getElementById("channel-message-input");
    const message = input.value.trim();

    if (!message || !currentState.currentChannel) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_text: message,
          channel_id: currentState.currentChannel.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      input.value = "";
      // In a real app, you'd add the message to the UI immediately
      await loadChannelMessages(currentState.currentChannel.id);
    } catch (error) {
      showNotification("Failed to send message", "error");
    }
  }

  async function sendDirectMessage() {
    const input = document.getElementById("dm-message-input");
    const message = input.value.trim();

    if (!message || !currentState.currentDMUser) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_text: message,
          recipient_id: currentState.currentDMUser.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      input.value = "";
      await loadDirectMessages(currentState.currentDMUser.id);
    } catch (error) {
      showNotification("Failed to send message", "error");
    }
  }

  // Enhanced message loading with badge support
  async function loadChannelMessages(channelId, isPolling = false) {
    try {
      const response = await fetch(`/api/messages/channel/${channelId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '../login/login.html';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      displayChannelMessages(data.messages);
      
      // Update unread count badge if polling
      if (isPolling && !isChannelActive()) {
        updateChannelBadge(channelId, data.messages.length);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      if (!isPolling) {
        showNotification("Error loading messages. Please try again.", "error");
      }
    }
  }

  async function loadDirectMessages(userId, isPolling = false) {
    try {
      const response = await fetch(`/api/messages/direct/${userId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '../login/login.html';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      displayDirectMessages(data.messages);
      
      // Update unread count badge if polling (for DMs, you might want a different approach)
      if (isPolling && !isDMActive()) {
        // You could implement DM badge updates here
      }
    } catch (error) {
      console.error("Error loading DM messages:", error);
      if (!isPolling) {
        showNotification("Error loading messages. Please try again.", "error");
      }
    }
  }

  // Check if channel is currently active (visible)
  function isChannelActive() {
    return channelChat.classList.contains('active') && 
           document.querySelector('[data-tab="channels"]').classList.contains('active');
  }

  // Check if DM is currently active (visible)
  function isDMActive() {
    return dmChat.classList.contains('active') && 
           document.querySelector('[data-tab="direct-messages"]').classList.contains('active');
  }

  // Update channel badge with unread count
  function updateChannelBadge(channelId, messageCount) {
    const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
    if (channelItem) {
      // Remove existing badge
      const existingBadge = channelItem.querySelector('.unread-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add new badge if there are unread messages
      if (messageCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'unread-badge badge bg-danger';
        badge.textContent = messageCount > 99 ? '99+' : messageCount;
        channelItem.appendChild(badge);
      }
    }
  }

  function displayChannelMessages(messages) {
    const container = document.getElementById("channel-messages");
    const currentUser = currentState.user;

    container.innerHTML = messages
      .reverse()
      .map(
        (msg) => `
            <div class="message">
                <div class="message-avatar avatar-${msg.sender_name.toLowerCase()}">
                    ${getInitials(msg.sender_name)}
                </div>
                <div class="message-content">
                    <div class="message-sender">
                        ${msg.sender_name} 
                        <span class="message-time">${formatTime(
                          msg.created_at
                        )}</span>
                    </div>
                    <div class="message-text ${
                      msg.sender_id === currentUser.id ? "outgoing" : "incoming"
                    }">
                        ${escapeHtml(msg.message_text)}
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    container.scrollTop = container.scrollHeight;
  }

  function displayDirectMessages(messages) {
    const container = document.getElementById("dm-messages");
    const currentUser = currentState.user;

    if (messages.length === 0) {
      container.innerHTML = `
                <div class="no-conversation">
                    <i class="fas fa-comments"></i>
                    <h3>No messages yet</h3>
                    <p>Start the conversation by sending a message</p>
                </div>
            `;
      return;
    }

    container.innerHTML = messages
      .reverse()
      .map(
        (msg) => `
            <div class="message">
                <div class="message-avatar avatar-${msg.sender_name.toLowerCase()}">
                    ${getInitials(msg.sender_name)}
                </div>
                <div class="message-content">
                    <div class="message-sender">
                        ${msg.sender_name} 
                        <span class="message-time">${formatTime(
                          msg.created_at
                        )}</span>
                    </div>
                    <div class="message-text ${
                      msg.sender_id === currentUser.id ? "outgoing" : "incoming"
                    }">
                        ${escapeHtml(msg.message_text)}
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    container.scrollTop = container.scrollHeight;
  }

  // UI Update functions
  function updateTeamsUI() {
    const container = document.getElementById("teams-container");
    const noTeams = document.getElementById("no-teams");

    if (currentState.teams.length === 0) {
      container.style.display = "none";
      noTeams.style.display = "block";
      return;
    }

    container.style.display = "grid";
    noTeams.style.display = "none";

    container.innerHTML = currentState.teams
      .map(
        (team) => `
            <div class="team-card">
                <div class="team-header">
                    <div class="team-name">${team.name}</div>
                    <div class="team-role">${team.role}</div>
                </div>
                <div class="team-description">${
                  team.description || "No description"
                }</div>
                <div class="team-stats">
                    <span>${team.channels.length} channels</span>
                    <span>${team.members.length} members</span>
                </div>
                <div class="team-actions">
                    <button class="team-action-btn" onclick="manageTeam(${
                      team.id
                    })">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                    <button class="team-action-btn" onclick="viewTeam(${
                      team.id
                    })">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  function updateChannelsList() {
    const container = document.getElementById("channel-list");
    const allChannels = currentState.teams.flatMap((team) => team.channels);
    currentState.channels = allChannels;

    if (allChannels.length === 0) {
      container.innerHTML =
        '<li class="channel-item">No channels available</li>';
      return;
    }

    container.innerHTML = allChannels
      .map(
        (channel) => `
            <li class="channel-item" data-channel-id="${channel.id}">
                <i class="channel-icon fas fa-hashtag"></i>
                <span class="channel-name">${channel.name}</span>
            </li>
        `
      )
      .join("");

    // Add click listeners
    container.querySelectorAll(".channel-item").forEach((item) => {
      item.addEventListener("click", function () {
        const channelId = parseInt(this.getAttribute("data-channel-id"));
        const channel = allChannels.find((c) => c.id === channelId);
        showChannel(channelId);
      });
    });
  }

  function updateDMsList() {
    // This would typically load from recent conversations
    const container = document.getElementById("dm-list");
    container.innerHTML =
      '<li class="dm-item">Click + to start a conversation</li>';
  }

  function updateDashboardStats() {
    const totalMembers = currentState.teams.reduce(
      (sum, team) => sum + team.members.length,
      0
    );

    document.getElementById("stat-teams").textContent =
      currentState.teams.length;
    document.getElementById("stat-channels").textContent =
      currentState.channels.length;
    document.getElementById("stat-members").textContent = totalMembers;
    document.getElementById("stat-messages").textContent = "0"; // Would need message count API
  }

  function showChannel(channelId) {
    const channel = currentState.channels.find((c) => c.id === channelId);
    if (!channel) return;

    currentState.currentChannel = channel;

    // Update UI
    document.getElementById("current-channel").textContent = channel.name;
    document.getElementById("member-count").textContent = "Loading members...";

    // Show channel chat
    switchTab("channels");

    // Load messages
    loadChannelMessages(channelId);

    // Load members (simplified - would need API endpoint)
    updateChannelMembers(channel);
  }

  function updateChannelMembers(channel) {
    // Simplified - in real app, you'd fetch channel members
    const membersContainer = document.getElementById("members-list");
    const team = currentState.teams.find((t) =>
      t.channels.some((c) => c.id === channel.id)
    );

    if (team) {
      membersContainer.innerHTML = team.members
        .map(
          (member) => `
                <div class="member-item">
                    <div class="member-avatar">${getInitials(
                      member.full_name
                    )}</div>
                    <div class="member-info">
                        <div class="member-name">${member.full_name}</div>
                        <div class="member-role">${member.role}</div>
                    </div>
                    ${
                      member.role !== "owner"
                        ? `
                        <div class="member-actions">
                            <button class="remove-member" onclick="removeMember(${member.id})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            `
        )
        .join("");

      document.getElementById(
        "member-count"
      ).textContent = `${team.members.length} members`;
    }
  }

  function toggleMembersSidebar() {
    membersSidebar.classList.toggle("active");
  }

  // Utility functions
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = "info") {
    // Create Bootstrap toast notification
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;
    
    toastContainer.innerHTML += toastHtml;
    
    const toastElement = document.getElementById(toastId);
    
    // Use Bootstrap Toast if available, otherwise fallback to basic notification
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
      });
      toast.show();
      
      // Remove toast from DOM after it's hidden
      toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
      });
    } else {
      // Fallback: basic notification without Bootstrap
      toastElement.style.display = 'block';
      setTimeout(() => {
        if (toastElement.parentElement) {
          toastElement.remove();
        }
      }, 5000);
    }
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  }

  function setupModalEvents() {
    // Close modals when clicking X
    document.querySelectorAll(".close, .btn-secondary").forEach((btn) => {
      btn.addEventListener("click", function () {
        const modal = this.closest(".modal");
        if (modal) {
          // Try Bootstrap modal first
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
              bsModal.hide();
            } else {
              modal.style.display = "none";
            }
          } else {
            // Fallback
            modal.style.display = "none";
          }
        }
      });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          // Try Bootstrap modal first
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const bsModal = bootstrap.Modal.getInstance(this);
            if (bsModal) {
              bsModal.hide();
            }
          } else {
            // Fallback
            this.style.display = "none";
          }
        }
      });
    });
  }

  // Global functions for HTML onclick attributes
  window.manageTeam = function (teamId) {
    showNotification("Team management features coming soon!", "info");
  };

  window.viewTeam = function (teamId) {
    const team = currentState.teams.find((t) => t.id === teamId);
    if (team) {
      showNotification(`Viewing team: ${team.name}`, "info");
    }
  };

  window.removeMember = function (memberId) {
    if (confirm("Are you sure you want to remove this member?")) {
      // This would call the remove member API
      showNotification("Member removal feature coming soon!", "info");
    }
  };
});
