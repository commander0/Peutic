
// Use relative path for API calls.
// In development, Vite proxy directs '/api' -> 'http://localhost:3001/api'
// In production (Vercel), rewrites direct '/api' -> server function.
const BASE_URL = '/api';

export const Api = {
    async request(endpoint: string, method: string = 'GET', body?: any) {
        const config: any = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) config.body = JSON.stringify(body);
        
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, config);
            
            // Handle 503 Over Capacity specially
            if (response.status === 503) {
                const data = await response.json();
                throw new Error(data.error || "Service Busy");
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Network response was not ok');
            }
            return data;
        } catch (e: any) {
            // If fetch fails (server down), throw specific error
            if (e.message.includes('Failed to fetch')) {
                throw new Error("Cannot connect to server.");
            }
            throw e;
        }
    },

    // Auth
    login: (email: string) => Api.request('/auth/login', 'POST', { email }),
    signup: (userData: any) => Api.request('/auth/signup', 'POST', userData),
    updateUser: (user: any) => Api.request('/user/update', 'POST', { user }),
    deleteUser: (userId: string) => Api.request(`/user/${userId}`, 'DELETE'),

    // Admin Auth
    checkAdminExists: () => Api.request('/admin/check'),
    adminLogin: (email: string, password: string) => Api.request('/admin/login', 'POST', { email, password }),
    initAdmin: (data: any) => Api.request('/admin/init', 'POST', data),

    // Queue
    joinQueue: (userId: string) => Api.request('/queue/join', 'POST', { userId }),
    getQueueStatus: (userId: string) => Api.request(`/queue/status/${userId}`),
    endSession: (userId: string) => Api.request('/session/end', 'POST', { userId }),
    sendHeartbeat: (userId: string) => Api.request('/session/heartbeat', 'POST', { userId }),

    // Credits
    topUp: (userId: string, amount: number, cost: number) => Api.request('/credits/topup', 'POST', { userId, amount, cost }),
    deduct: (userId: string, amount: number) => Api.request('/credits/deduct', 'POST', { userId, amount }),
    addTransaction: (transaction: any) => Api.request('/transaction', 'POST', { transaction }),

    // Storage
    getJournals: (userId: string) => Api.request(`/journal/${userId}`),
    saveJournal: (userId: string, entry: any) => Api.request('/journal', 'POST', { userId, entry }),
    getArt: (userId: string) => Api.request(`/art/${userId}`),
    saveArt: (userId: string, entry: any) => Api.request('/art', 'POST', { userId, entry }),
    deleteArt: (userId: string, artId: string) => Api.request(`/art/${userId}/${artId}`, 'DELETE'),
    saveFeedback: (feedback: any) => Api.request('/feedback', 'POST', { feedback }),

    // Video Proxy
    initVideo: (data: any) => Api.request('/video/init', 'POST', data),

    // Admin & Settings
    getAdminData: () => Api.request('/admin/data'),
    saveSettings: (settings: any) => Api.request('/settings', 'POST', { settings })
};