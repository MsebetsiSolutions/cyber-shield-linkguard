<<<<<<< HEAD
// public/js/monitoringAPI.js
const monitoringAPI = {
    base: '/api/monitoring',  // ← CORRECT

    async getHosts() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`${this.base}/hosts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to load hosts:', err);
            throw err;
        }
    },

    async getTraffic() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`${this.base}/traffic`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to load traffic:', err);
            throw err;
        }
    }
};

=======
// public/js/monitoringAPI.js
const monitoringAPI = {
    base: '/api/monitoring',  // ← CORRECT

    async getHosts() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`${this.base}/hosts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to load hosts:', err);
            throw err;
        }
    },

    async getTraffic() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`${this.base}/traffic`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to load traffic:', err);
            throw err;
        }
    }
};

>>>>>>> deploy
console.log('monitoringAPI loaded');