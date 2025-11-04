
const SESSION_EXPIRY_MINUTES = 5;
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
async function initSession() {
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('session');
    const storedSession = sessionStorage.getItem('cyberShieldSession');

    try {
        const authCheck = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (authCheck.ok) {
            const userData = await authCheck.json();
            if (userData.authenticated) {
                console.log('User is authenticated via Flask session');
                if (!sessionId && storedSession) {
                    const { id, expiry } = JSON.parse(storedSession);
                    if (new Date().getTime() < expiry) {
                        sessionId = id;
                    }
                }
                
                if (!sessionId) {
                    sessionId = generateSessionId();
                }
                
                // Ensure session is stored and URL is updated
                const newExpiry = new Date().getTime() + (SESSION_EXPIRY_MINUTES * 60 * 1000);
                sessionStorage.setItem('cyberShieldSession', JSON.stringify({
                    id: sessionId,
                    expiry: newExpiry
                }));

                updateUrlWithSession(sessionId);
                setupSessionExpiryCheck();
                return sessionId;
            }
        }
    } catch (error) {
        console.log('Auth check failed, proceeding with basic session management');
    }

    let needsNewSession = false;

    if (storedSession) {
        const { id, expiry } = JSON.parse(storedSession);

        if (new Date().getTime() > expiry) {
            needsNewSession = true;
        } else {
            sessionId = id;
            if (!window.location.search.includes('session=')) {
                updateUrlWithSession(sessionId);
            }
        }
    } else {
        needsNewSession = true;
    }

    if (needsNewSession) {
        sessionId = generateSessionId();
        const newExpiry = new Date().getTime() + (SESSION_EXPIRY_MINUTES * 60 * 1000);
        sessionStorage.setItem('cyberShieldSession', JSON.stringify({
            id: sessionId,
            expiry: newExpiry
        }));

        updateUrlWithSession(sessionId);
        console.log('New session generated:', sessionId);
    }

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
    setInterval(async () => {
        const storedSession = sessionStorage.getItem('cyberShieldSession');
        if (storedSession) {
            const { id, expiry } = JSON.parse(storedSession);
            
            // Check if user is authenticated - if yes, don't auto-refresh session
            try {
                const authCheck = await fetch('/api/auth/me', {
                    credentials: 'include'
                });
                
                if (authCheck.ok) {
                    const userData = await authCheck.json();
                    if (userData.authenticated) {
                        return;
                    }
                }
            } catch (error) {
            }
            
            if (new Date().getTime() > expiry) {
                await refreshSession();
            }
        }
    }, 60000); 
}

async function refreshSession() {
    const newSessionId = generateSessionId();
    const newExpiry = new Date().getTime() + (SESSION_EXPIRY_MINUTES * 60 * 1000);
    
    sessionStorage.setItem('cyberShieldSession', JSON.stringify({
        id: newSessionId,
        expiry: newExpiry
    }));

    updateUrlWithSession(newSessionId);
    console.log('Session refreshed:', newSessionId);
    
    modifyInternalLinks();
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

function logout() {
    sessionStorage.removeItem('cyberShieldSession');
    window.location.href = '../index.html';
}

// Initialize session when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await initSession();
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

window.CyberShieldSession = {
    getCurrentSessionId,
    generateSessionId,
    initSession,
    logout,
    validateSessionWithServer: async function(sessionId) {
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
            console.error('Server session validation error:', error);
            return true; 
        }
    }
};
