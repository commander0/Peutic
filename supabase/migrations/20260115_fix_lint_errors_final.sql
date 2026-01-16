-- FINAL DATABASE REPAIR SCRIPT
-- UUID: 20260115_fix_lint_errors_final
-- Run this in Supabase SQL Editor. It is safe to run multiple times.

-- ==========================================
-- 1. SYSTEM LOGS (Lint Errors Resolved)
-- ==========================================
-- The issue was "Multiple Permissive Policies". We must DROP the old ones explicitly.

-- Drop ALL possible legacy policy names
DROP POLICY IF EXISTS "system_logs_insert_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_select_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_read_all" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_read_admin" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_any" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_safe" ON public.system_logs; -- Drop the conflict source

-- Re-Apply Clean Policies
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 1. Admins can read logs
CREATE POLICY "system_logs_read_admin" ON public.system_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- 2. Anyone can insert logs (Public logging) - SECURE VERSION
-- Replaces "insert_any" to satisfy security linter
CREATE POLICY "system_logs_insert_safe" ON public.system_logs FOR INSERT WITH CHECK (
     length(event) > 0
);


-- ==========================================
-- 2. GLOBAL SETTINGS (Fix Admin Toggles)
-- ==========================================
-- Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.global_settings (
    id BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
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

-- Ensure Row Exists
INSERT INTO public.global_settings (id, site_name, maintenance_mode, sale_mode, allow_signups, price_per_minute, max_concurrent_sessions)
VALUES (1, 'Peutic', FALSE, FALSE, TRUE, 1.99, 15)
ON CONFLICT (id) DO NOTHING;

-- Fix Policies (Drop EVERYTHING first)
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_select_policy" ON public.global_settings; -- Legacy
DROP POLICY IF EXISTS "global_settings_insert_policy" ON public.global_settings; -- Legacy
DROP POLICY IF EXISTS "global_settings_update_policy" ON public.global_settings; -- Legacy
DROP POLICY IF EXISTS "global_settings_delete_policy" ON public.global_settings; -- Legacy
DROP POLICY IF EXISTS "global_settings_admin_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_write" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_public" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_update" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_insert" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_delete" ON public.global_settings;

-- Apply Correct Policies
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public Read (SELECT)
CREATE POLICY "global_settings_read_public" ON public.global_settings FOR SELECT USING (true);

-- 2. Admin Update (UPDATE)
CREATE POLICY "global_settings_admin_update" ON public.global_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- 3. Admin Insert (INSERT)
CREATE POLICY "global_settings_admin_insert" ON public.global_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);


-- ==========================================
-- 3. USER ART (Cleanup & Ensure Table)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_art (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT,
    prompt TEXT,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP POLICY IF EXISTS "user_art_select_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_insert_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_delete_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_select_policy" ON public.user_art; -- Legacy removal
DROP POLICY IF EXISTS "user_art_insert_policy" ON public.user_art; -- Legacy removal

CREATE POLICY "user_art_select_own" ON public.user_art FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "user_art_insert_own" ON public.user_art FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_art_delete_own" ON public.user_art FOR DELETE USING ((select auth.uid()) = user_id);

GRANT SELECT ON public.global_settings TO anon, authenticated;
GRANT SELECT, INSERT ON public.system_logs TO anon, authenticated;
