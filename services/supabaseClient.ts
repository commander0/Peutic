import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables for Production
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if config is missing to allow the app to load (offline mode will activate in Database class)
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) 
    ? createClient(supabaseUrl, supabaseKey) 
    : {
        from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ error: { message: "Supabase not configured", code: '42P01' } }) }) }) }),
        auth: {
            signInWithOAuth: () => Promise.resolve({ error: { message: "Auth not configured" } }),
            signInWithOtp: () => Promise.resolve({ error: { message: "Auth not configured" } }),
            signOut: () => Promise.resolve({ error: null }),
            getUser: () => Promise.resolve({ data: { user: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        rpc: () => Promise.resolve({ error: { message: "Supabase not configured", code: '42P01' } })
    } as any;