import { supabase } from './supabaseClient';

export const BaseService = {
    withTimeout: <T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> => {
        let timeoutId: any;
        const timeoutPromise = new Promise<T>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
        });
        return Promise.race([
            promise.then(res => { clearTimeout(timeoutId); return res; }),
            timeoutPromise
        ]);
    },

    getAuthHeaders: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return {};
        return {
            'Authorization': `Bearer ${session.access_token}`
        };
    },

    invokeGateway: async (action: string, payload: any = {}) => {
        // DEBUG: Trace all Gateway calls
        console.log(`[BaseService] Gateway Call: ${action}`, { payloadKeys: Object.keys(payload || {}) });

        const headers = await BaseService.getAuthHeaders();
        const { data, error } = await supabase.functions.invoke('api-gateway', {
            body: { action, payload },
            headers
        });

        if (error) {
            console.error(`[BaseService] Gateway Transport Error (${action})`, error);
            throw error;
        }
        if (data?.error) {
            console.error(`[BaseService] Gateway Logic Error (${action}):`, data.error);
            throw new Error(data.error);
        }
        return data;
    }
};

