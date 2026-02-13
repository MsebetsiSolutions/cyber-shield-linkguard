<<<<<<< HEAD
// public/js/monitoringAPI.js
// SINGLE SOURCE OF TRUTH – NO DUPLICATES EVER AGAIN

const monitoringAPI = {
    base: '/api/monitoring',

    async get(endpoint) {
        try {
            const res = await fetch(`${this.base}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`API ${endpoint} failed → using fallback`, err);
            return null;
        }
    },

    async getHosts() {
        const data = await this.get('/hosts');
        return data?.hosts || data || [];
    },

    async getTraffic() {
        const data = await this.get('/traffic');
        const traffic = data?.traffic || data || [];
        return traffic.length > 0 ? traffic : [
            { time: 'Now', kb_in: 0, kb_out: 0 }
        ];
    },

    async getOverview() {
        const data = await this.get('/overview');
        return data || { active_incidents: 0, avg_mttr: '--', coverage: '0%' };
    }
};

=======
// public/js/monitoringAPI.js
// SINGLE SOURCE OF TRUTH – NO DUPLICATES EVER AGAIN

const monitoringAPI = {
    base: '/api/monitoring',

    async get(endpoint) {
        try {
            const res = await fetch(`${this.base}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`API ${endpoint} failed → using fallback`, err);
            return null;
        }
    },

    async getHosts() {
        const data = await this.get('/hosts');
        return data?.hosts || data || [];
    },

    async getTraffic() {
        const data = await this.get('/traffic');
        const traffic = data?.traffic || data || [];
        return traffic.length > 0 ? traffic : [
            { time: 'Now', kb_in: 0, kb_out: 0 }
        ];
    },

    async getOverview() {
        const data = await this.get('/overview');
        return data || { active_incidents: 0, avg_mttr: '--', coverage: '0%' };
    }
};

>>>>>>> deploy
console.log('monitoringAPI LOADED – FINAL & ONLY VERSION');