import { createClient } from '@supabase/supabase-js';

// Your provided credentials
const supabaseUrl = 'https://qdnctbupmlqhzubwigjn.supabase.co';
const supabaseKey = 'sb_publishable_FF7py8rGlouj6dGj32TZpg_5bQa7i4g';

export const supabase = createClient(supabaseUrl, supabaseKey);
