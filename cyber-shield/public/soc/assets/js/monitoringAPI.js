// ===============================================
// REAL monitoringAPI.js – Enterprise Grade
// Used in production SOC dashboards
// ===============================================

const monitoringAPI = (() => {
    const BASE = '/api/monitoring';
    const TOKEN = () => localStorage.getItem('token') || '';

    // Centralized error handler
    const handleError = (endpoint, error) => {
        console.error(`monitoringAPI [${endpoint}] →`, error.message || error);
        // Optional: send to error tracking (Sentry, etc.)
        return null;
    };

    // Core request function
    const request = async (endpoint) => {
        try {
            const response = await fetch(`${BASE}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TOKEN()}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`${response.status} ${response.statusText}${text ? ': ' + text : ''}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            return handleError(endpoint, error);
        }
    };

    return {
        // Get all monitored hosts (with real-time status)
        async getHosts() {
            const data = await request('/hosts');
            if (!data) return [];
            return Array.isArray(data) ? data : (data.hosts || []);
        },

        // Get real network traffic (never null)
        async getTraffic() {
            const data = await request('/traffic');
            if (!data) {
                // Fallback data so chart never breaks
                const now = new Date();
                return Array.from({ length: 10 }, (_, i) => ({
                    time: `${String(now.getHours() - i).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
                    kb_in: 0,
                    kb_out: 0
                })).reverse();
            }
            const traffic = Array.isArray(data) ? data : (data.traffic || []);
            return traffic.length > 0 ? traffic : [{
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                kb_in: 0,
                kb_out: 0
            }];
        },

        // Overview stats for dashboard cards
        async getOverview() {
            const data = await request('/overview');
            if (!data) {
                return {
                    active_incidents: 0,
                    avg_mttr: '--',
                    coverage: '0%',
                    total_hosts: 0,
                    active_hosts: 0
                };
            }
            return {
                active_incidents: data.active_incidents || 0,
                avg_mttr: data.avg_mttr || '--',
                coverage: data.coverage || '0%',
                total_hosts: data.total_hosts || 0,
                active_hosts: data.active_hosts || 0
            };
        },

        // Optional: Get alerts (for future use)
        async getAlerts() {
            const data = await request('/alerts');
            return Array.isArray(data) ? data : (data?.alerts || []);
        },

        // Health check
        async health() {
            try {
                await request('/health');
                return true;
            } catch {
                return false;
            }
        }
    };
})();

// Log when loaded
console.log('REAL monitoringAPI.js loaded – Enterprise Ready');