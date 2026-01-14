
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
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkQueue() {
    console.log("CHECKING SESSION_QUEUE...");
    const { error } = await supabase.from('session_queue').select('created_at').limit(1);
    if (error) {
        console.log("RESULT: MISSING (" + error.message + ")");
    } else {
        console.log("RESULT: EXISTS");
    }
}

checkQueue();
