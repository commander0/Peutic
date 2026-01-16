
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- SETUP ENV ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

// --- LOGGING ---
const log = (msg: string) => console.log(`[TEST] ${msg}`);

async function runTest() {
    log("--- STARTING ADMIN DASHBOARD REPRODUCTION ---");

    // 1. Setup Clients
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // We need a known Admin. If we don't have one, we can't fully reproduce RLS check without login.
    // However, I can check if public.users allows ANY reading.
    // Actually, I can try to create a user with anon client, and see if it appears in public.users?
    // No, RLS prevents reading others.

    // Simulation:
    // User A (Admin) logs in.
    // User A calls getAllUsers().
    // Should see User B.

    // I will try to fetch the Global Settings (public) to verify connection.
    try {
        const { data: settings, error: sErr } = await anonClient.from('global_settings').select('*').single();
        if (sErr) throw new Error("Connection Failed: " + sErr.message);
        log("Connection Verified.");

        // 2. Fetch Users (as Anon - unlikely to work, but lists OWN user if logged in)
        // Since I can't login as a specific Admin without password/email knowledge, 
        // I will rely on checking the Public Table Policies via inspection or creating a test user.

        // Create Test User
        const email = `test_repro_${Date.now()}@test.com`;
        const { data: authData, error: authError } = await anonClient.auth.signUp({
            email,
            password: 'Password123!',
            options: { data: { full_name: 'Repro User' } }
        });

        if (authError || !authData.user) {
            log("FAILED to create Auth User: " + authError?.message);
            return;
        }
        log(`Created Auth User: ${authData.user.id}`);

        // Wait for Trigger to populate public.users
        await new Promise(r => setTimeout(r, 2000));

        // Check if user exists in public.users (using same client - should see self)
        const { data: selfProfile, error: selfError } = await anonClient.from('users').select('*').eq('id', authData.user.id).single();

        if (selfError || !selfProfile) {
            log("FAIL: Trigger did not create public profile! OR RLS prevents viewing self.");
            log("Error: " + selfError?.message);
        } else {
            log("PASS: Public Profile created and visible to self.");
        }

        // Cleanup (if possible)
        // anonClient cannot delete itself easily without Gateway.

    } catch (e: any) {
        log("CRITICAL ERROR: " + e.message);
    }
}

runTest();
