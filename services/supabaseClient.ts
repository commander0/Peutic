
import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables for Production
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Strict Dummy Client for Offline/Missing Config - Throws Errors
const strictDummyClient = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys")),
                order: () => ({
                    limit: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys"))
                })
            }),
            order: () => ({
                limit: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys"))
            }),
            insert: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys")),
            delete: () => ({
                eq: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys")),
                in: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys"))
            })
        }),
        insert: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys")),
        delete: () => ({
            eq: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys"))
        }),
        update: () => ({
            eq: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys"))
        })
    }),
    auth: {
        signInWithOAuth: () => Promise.reject(new Error("Supabase Auth Not Configured")),
        signInWithOtp: () => Promise.reject(new Error("Supabase Auth Not Configured")),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    rpc: () => Promise.reject(new Error("Supabase Not Configured"))
} as any;

// Create client only if config exists, otherwise use strict dummy
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) 
    ? createClient(supabaseUrl, supabaseKey) 
    : strictDummyClient;
