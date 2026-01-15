
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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in .env");
    throw new Error("Missing Supabase credentials in .env");
}

// --- LOGGING ---
const logs: string[] = [];
function log(msg: string) {
    console.log(msg);
    logs.push(msg);
}

// --- TEST HELPERS ---
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// --- MAIN TEST ---
async function runTest() {
    log("--- STARTING CONCURRENCY LOGIC VERIFICATION (ROBUST) ---");

    let limit = 15;

    // Admin Client (Simulated with Anon key)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const users: { id: string, client: any, email: string }[] = [];

    try {
        log("1. Fetching Global Settings...");
        const { data: settings } = await adminClient.from('global_settings').select('*').single();
        if (settings) {
            limit = settings.max_concurrent_sessions;
            log(`   Current Limit (DB): ${limit}`);
        } else {
            log("   [WARN] Could not fetch settings. Assuming default.");
        }

        // We will try to create Limit + 1 users.
        const numUsers = limit + 1;
        log(`   Target: Create ${numUsers} users to force queueing.`);

        // 2. Create Users (with separate clients)
        for (let i = 0; i < numUsers; i++) {
            const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const tag = `u${Date.now()}_${i}`;
            const email = `${tag}@test.com`;
            const password = 'TestPassword123!';

            const { data, error } = await client.auth.signUp({ email, password });
            if (error || !data.user) {
                log(`   [ERROR] Failed to create User ${i + 1}: ${error?.message}`);
                continue;
            }
            log(`   Created User ${i + 1}: ${data.user.id}`);
            users.push({ id: data.user.id, client, email });
            // Small delay to prevent rate limits or auth race conditions
            await sleep(1000);
        }

        // 3. Claim Spots
        log("3. Claiming Spots...");
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            log(`   User ${i + 1} claiming spot...`);

            // Use the user's own client to call RPC
            // Note: claim_active_spot calls cleanup_stale_sessions inside it.
            const { data: result, error } = await u.client.rpc('claim_active_spot', { p_user_id: u.id });
            log(`      Result: ${result} (Error: ${error?.message})`);

            // Query DB directly to see who is active
            const { count } = await adminClient.from('active_sessions').select('*', { count: 'exact', head: true });
            log(`      Active Sessions Count: ${count}`);
        }

        // 4. Verify Queue for Last User (if enough users created)
        if (users.length > limit) {
            const lastUser = users[users.length - 1];
            log("4. Verifying Queue state for last user...");

            // Check if last user is in active sessions?
            const { data: active } = await adminClient.from('active_sessions').select('*').eq('user_id', lastUser.id).single();
            if (active) {
                log("   [FAIL] Last user IS in active sessions. Limit not enforced?");
            } else {
                log("   [PASS] Last user is NOT in active sessions.");

                // Try Join Queue
                log("   Last user joining queue...");
                const { data: qPos, error: qError } = await lastUser.client.rpc('join_queue', { p_user_id: lastUser.id });
                log(`   Queue Position: ${qPos} (Error: ${qError?.message})`);
            }
        }

    } catch (e: any) {
        log("TEST FAILED: " + e.message);
    } finally {
        log("--- TEARDOWN ---");
        // Cleanup all created users
        for (const u of users) {
            await adminClient.from('active_sessions').delete().eq('user_id', u.id);
            await adminClient.from('session_queue').delete().eq('user_id', u.id);
        }
        log("   Cleanup attempted.");

        fs.writeFileSync('verification_results.json', JSON.stringify({ logs }, null, 2));
    }
}

runTest();
