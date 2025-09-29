// SESSION MANAGEMENT FOR CYBER SHIELD LINKGUARD
const SESSION_EXPIRY_MINUTES = 30; // 30 minutes for security app
const CHARSET = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Generate a random session ID
function generateSessionId() {
    let result = '';
    const charactersLength = CHARSET.length;
    
    for (let i = 0; i < 32; i++) {
        result += CHARSET.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return 'cs_sess_' + result;
}

// Validate and manage session
function initSession() {
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('session');
    const storedSession = sessionStorage.getItem('cyberShieldSession');

    if (storedSession) {
        const { id, expiry } = JSON.parse(storedSession);

        if (new Date().getTime() > expiry) {
            // Session expired, generate new one
            sessionId = generateSessionId();
            const newExpiry = new Date().getTime() + (SESSION_EXPIRY_MINUTES * 60 * 1000);
            sessionStorage.setItem('cyberShieldSession', JSON.stringify({
                id: sessionId,
                expiry: newExpiry
            }));

            // Update URL with new session ID
            updateUrlWithSession(sessionId);
            console.log('New session generated:', sessionId);
        } else {
            sessionId = id;
            // Ensure session ID is in URL
            if (!window.location.search.includes('session=')) {
                updateUrlWithSession(sessionId);
            }
        }
    } else {
        // No existing session
        sessionId = generateSessionId();
        const expiry = new Date().getTime() + (SESSION_EXPIRY_MINUTES * 60 * 1000);
        sessionStorage.setItem('cyberShieldSession', JSON.stringify({
            id: sessionId,
            expiry: expiry
        }));

        // Add session to URL
        if (!window.location.search.includes('session=')) {
            updateUrlWithSession(sessionId);
        }
        
        console.log('Initial session generated:', sessionId);
    }

    // Set up session expiry check
    setupSessionExpiryCheck();
    
    return sessionId;
}

// Update URL with session ID
function updateUrlWithSession(sessionId) {
    const newUrl = window.location.pathname + 
        (window.location.search.includes('session=') 
            ? window.location.search.replace(/session=[^&]*/, 'session=' + sessionId)
            : (window.location.search ? '&session=' + sessionId : '?session=' + sessionId));
    
    window.history.replaceState({}, '', newUrl);
}

// Set up periodic session expiry check
function setupSessionExpiryCheck() {
    setInterval(() => {
        const storedSession = sessionStorage.getItem('cyberShieldSession');
        if (storedSession) {
            const { expiry } = JSON.parse(storedSession);
            if (new Date().getTime() > expiry) {
                const newSessionId = generateSessionId();
                const newExpiry = new Date().getTime() + (SESSION_EXPIRY_MINUTES * 60 * 1000);
                
                sessionStorage.setItem('cyberShieldSession', JSON.stringify({
                    id: newSessionId,
                    expiry: newExpiry
                }));

                // Update URL
                updateUrlWithSession(newSessionId);
                console.log('Session refreshed:', newSessionId);
                
                // Update all internal links with new session ID
                modifyInternalLinks();
            }
        }
    }, 60000); 
}

// Get current session ID
function getCurrentSessionId() {
    const storedSession = sessionStorage.getItem('cyberShieldSession');
    if (storedSession) {
        const { id, expiry } = JSON.parse(storedSession);
        if (new Date().getTime() > expiry) {
            return null; 
        }
        return id;
    }
    return null;
}

// Modify internal links to include session ID
function modifyInternalLinks() {
    const sessionId = getCurrentSessionId();
    if (!sessionId) return;

    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');

        if (!href ||
            href.startsWith('http') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('#') ||
            href.includes('session=')) {
            return;
        }

        // Add session parameter
        if (href.includes('?')) {
            link.setAttribute('href', href + '&session=' + sessionId);
        } else {
            link.setAttribute('href', href + '?session=' + sessionId);
        }
    });
}

// Initialize session when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initSession();
    modifyInternalLinks();
    
    // Observe DOM changes for dynamically added links
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                modifyInternalLinks();
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

// Export for use in other modules
window.CyberShieldSession = {
    getCurrentSessionId,
    generateSessionId,
    initSession
};