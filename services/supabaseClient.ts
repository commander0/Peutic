import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables for Production, fall back to hardcoded for local dev/demo
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qdnctbupmlqhzubwigjn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FF7py8rGlouj6dGj32TZpg_5bQa7i4g';

export const supabase = createClient(supabaseUrl, supabaseKey);