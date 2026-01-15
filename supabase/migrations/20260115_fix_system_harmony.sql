-- FIX: ADMIN TOGGLES, SESSION LEAKS, AND SYSTEM HARMONY
-- UUID: 20260115_fix_system_harmony

-- ==========================================
-- 1. FIX GLOBAL SETTINGS (The Toggles)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.global_settings (
    id BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure only one settings row exists
    site_name TEXT DEFAULT 'Peutic',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    sale_mode BOOLEAN DEFAULT FALSE,
    allow_signups BOOLEAN DEFAULT TRUE,
    price_per_minute NUMERIC DEFAULT 1.99,
    broadcast_message TEXT DEFAULT '',
    max_concurrent_sessions INTEGER DEFAULT 15,
    multilingual_mode BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reset Permissions for fresh start
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.global_settings TO anon, authenticated;
GRANT ALL ON public.global_settings TO service_role;

-- Drop all conflicting policies
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_write" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_public" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_update" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_insert" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_delete" ON public.global_settings;

-- Policy: EVERYONE can READ settings
CREATE POLICY "global_settings_read_public" ON public.global_settings FOR SELECT USING (true);

-- Policy: ONLY ADMINS can WRITE/UPDATE/DELETE (Resolved Overlap)
CREATE POLICY "global_settings_admin_update" ON public.global_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "global_settings_admin_insert" ON public.global_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "global_settings_admin_delete" ON public.global_settings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- Seeding: Ensure the default row exists so Toggles have something to update
INSERT INTO public.global_settings (id, site_name, maintenance_mode, sale_mode, allow_signups, price_per_minute, max_concurrent_sessions, multilingual_mode)
VALUES (1, 'Peutic', FALSE, FALSE, TRUE, 1.99, 15, TRUE)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 2. FIX USER ART TABLE (Wisdom Generator)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_art (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT,
    prompt TEXT,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;

-- Clean up old policies
DROP POLICY IF EXISTS "user_art_select_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_insert_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_delete_own" ON public.user_art;

-- New Optimized Policies
CREATE POLICY "user_art_select_own" ON public.user_art FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "user_art_insert_own" ON public.user_art FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_art_delete_own" ON public.user_art FOR DELETE USING ((select auth.uid()) = user_id);


-- ==========================================
-- 3. FIX SYSTEM LOGS (Admin Dashboard Activity)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    event TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_logs_read_admin" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_any" ON public.system_logs;

-- Admins can read logs
CREATE POLICY "system_logs_read_admin" ON public.system_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- Anyone can INSERT logs (for error tracking, even from anon users)
CREATE POLICY "system_logs_insert_any" ON public.system_logs FOR INSERT WITH CHECK (true);
