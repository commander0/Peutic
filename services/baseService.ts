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
        const headers = await BaseService.getAuthHeaders();
        const { data, error } = await supabase.functions.invoke('api-gateway', {
            body: { action, payload },
            headers
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
    }
};

