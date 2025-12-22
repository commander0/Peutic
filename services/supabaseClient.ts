
import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables for Production
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Robust Dummy Client for Offline Mode / Missing Config
const dummyClient = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: { message: "Offline Mode", code: '42P01' } })
                })
            }),
            order: () => ({
                limit: () => Promise.resolve({ data: [], error: { message: "Offline Mode", code: '42P01' } })
            }),
            // Missing methods that caused crashes:
            insert: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } }),
            delete: () => ({
                eq: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } }),
                in: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } })
            })
        }),
        insert: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } }),
        delete: () => ({
            eq: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } })
        }),
        update: () => ({
            eq: () => Promise.resolve({ data: null, error: { message: "Offline Mode", code: '42P01' } })
        })
    }),
    auth: {
        signInWithOAuth: () => Promise.resolve({ error: { message: "Auth not configured" } }),
        signInWithOtp: () => Promise.resolve({ error: { message: "Auth not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    rpc: () => Promise.resolve({ error: { message: "Supabase not configured", code: '42P01' } })
} as any;

// Create client only if config exists, otherwise use dummy to prevent crashes
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) 
    ? createClient(supabaseUrl, supabaseKey) 
    : dummyClient;
