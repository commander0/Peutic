
import { createClient } from '@supabase/supabase-js';

// Robust Environment Variable Retrieval
const getEnv = (key: string) => {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) return import.meta.env[key];
    return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Strict Dummy Client for Offline/Missing Config - Throws Errors
const strictDummyClient = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys")),
                maybeSingle: () => Promise.reject(new Error("Supabase Client Not Configured: Missing API Keys")),
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
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
    },
    functions: {
        invoke: () => Promise.reject(new Error("Supabase Functions Not Configured: Missing API Keys"))
    },
    rpc: () => Promise.reject(new Error("Supabase Not Configured"))
} as any;

// Create client only if config exists, otherwise use strict dummy
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'))
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    })
    : strictDummyClient;
