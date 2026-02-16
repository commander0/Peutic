-- ==========================================
-- PEUTIC RLS REPAIR SCRIPT (COMPREHENSIVE)
-- ==========================================

-- 1. USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Data" ON public.users;
CREATE POLICY "Users Own Data" ON public.users USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins Read All Users" ON public.users;
CREATE POLICY "Admins Read All Users" ON public.users FOR SELECT USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 2. JOURNALS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Journals" ON public.journals;
CREATE POLICY "Users Own Journals" ON public.journals USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. USER ART (Wisdom Art)
ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Art" ON public.user_art;
CREATE POLICY "Users Own Art" ON public.user_art USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. MOOD LOGS
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Moods" ON public.moods;
CREATE POLICY "Users Own Moods" ON public.moods USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User Delete Own Moods" ON public.moods;
CREATE POLICY "User Delete Own Moods" ON public.moods FOR DELETE USING (auth.uid() = user_id);

-- 5. VOICE JOURNALS
ALTER TABLE public.voice_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Voice" ON public.voice_journals;
CREATE POLICY "Users Own Voice" ON public.voice_journals USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User Delete Own Voice" ON public.voice_journals;
CREATE POLICY "User Delete Own Voice" ON public.voice_journals FOR DELETE USING (auth.uid() = user_id);

-- 6. GARDEN STATE
ALTER TABLE public.garden_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Garden" ON public.garden_state;
CREATE POLICY "Users Own Garden" ON public.garden_state USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. LUMINA (PETS)
ALTER TABLE public.pocket_pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Own Pets" ON public.pocket_pets;
CREATE POLICY "Users Own Pets" ON public.pocket_pets USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. COMPANIONS (Read Only for Users, Admin Edit)
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Companions" ON public.companions;
CREATE POLICY "Public Read Companions" ON public.companions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Companions" ON public.companions;
CREATE POLICY "Admin Manage Companions" ON public.companions USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 9. TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users See Own Tx" ON public.transactions;
CREATE POLICY "Users See Own Tx" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 10. SYSTEM LOGS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins View Logs" ON public.system_logs;
CREATE POLICY "Admins View Logs" ON public.system_logs FOR SELECT USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
-- Allow system/functions to insert logs (usually happens via service role, but good to have)
-- If client-side logging is needed:
-- CREATE POLICY "Insert Logs" ON public.system_logs FOR INSERT WITH CHECK (true);

-- 11. GLOBAL SETTINGS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Settings" ON public.global_settings;
CREATE POLICY "Public Read Settings" ON public.global_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Update Settings" ON public.global_settings;
CREATE POLICY "Admin Update Settings" ON public.global_settings USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 12. SAFETY ALERTS
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id),
    content text,
    content_type text,
    flagged_keywords text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins Manage Alerts" ON public.safety_alerts;
CREATE POLICY "Admins Manage Alerts" ON public.safety_alerts USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
-- Allow creation of alerts by validated users (back-end trigger preferred, but client-side safety net)
DROP POLICY IF EXISTS "System Create Alerts" ON public.safety_alerts;
CREATE POLICY "System Create Alerts" ON public.safety_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
