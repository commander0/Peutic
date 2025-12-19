import { createClient } from '@supabase/supabase-js';

// Configuration injected directly to ensure live connection works immediately.
// Note: We use the Publishable Key (safe for client-side).
const supabaseUrl = process.env.SUPABASE_URL || 'https://qdnctbupmlqhzubwigjn.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_FF7py8rGlouj6dGj32TZpg_5bQa7i4g';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase configuration is missing. Ensure credentials are set correctly.");
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseKey
);