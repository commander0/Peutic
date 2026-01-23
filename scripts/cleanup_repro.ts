
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SERVICE_KEY = env['VITE_SUPABASE_SERVICE_ROLE_KEY']; // Need Service Role to delete

if (!SERVICE_KEY) {
    console.error("Missing Service Role Key. Cannot cleanup.");
    // Fix: Explicit cast to any for process to resolve exit property error
    (process as any).exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function cleanup() {
    console.log("Searching for Repro Users...");

    // Find users with email containing "test_repro"
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("List Users Failed:", error);
        return;
    }

    const targets = users.users.filter((u: any) => u.email?.includes('test_repro'));
    console.log(`Found ${targets.length} test users.`);

    for (const u of targets) {
        console.log(`Deleting: ${u.email} (${u.id})`);
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
        if (delErr) {
            console.error(`Failed to delete ${u.email}:`, delErr);
        } else {
            console.log(`Deleted ${u.email}`);
            // Also clean public profile if trigger didn't catch it (though cascade usually set up? No, manual clean in gateway)
            await supabase.from('users').delete().eq('id', u.id);
        }
    }
    console.log("Cleanup Complete.");
}

cleanup();