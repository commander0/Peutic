-- ==========================================================
-- FINAL OPTIMIZATION & CLEANUP
-- Fixes "Multiple Permissive Policies" and "Auth RLS Init Plan" warnings
-- ==========================================================

-- 1. CLEANUP LEGACY POLICIES (COMPANIONS)
-- These were flagged as duplicates in the linter report
DROP POLICY IF EXISTS "companions_select_policy" ON public.companions;
DROP POLICY IF EXISTS "companions_insert_policy" ON public.companions;
DROP POLICY IF EXISTS "companions_update_policy" ON public.companions;
DROP POLICY IF EXISTS "companions_delete_policy" ON public.companions;

-- 2. CLEANUP LEGACY POLICIES (USERS)
-- This was flagged as a duplicate against "users_update_safe"
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- 3. OPTIMIZE USERS POLICIES (Fix "Auth RLS Init Plan")
-- Replacing auth.uid() with (select auth.uid()) prevents per-row re-evaluation

DROP POLICY IF EXISTS "users_select_safe" ON public.users;
DROP POLICY IF EXISTS "users_update_safe" ON public.users;

CREATE POLICY "users_select_safe" ON public.users FOR SELECT USING (
    (select auth.uid()) = id
    OR
    public.is_admin() -- Use the secure function
);

CREATE POLICY "users_update_safe" ON public.users FOR UPDATE USING (
    (select auth.uid()) = id
    OR
    public.is_admin()
);

-- 4. ENSURE COMPANIONS HAS CORRECT POLICIES
-- Re-apply these just to be safe, ensuring no duplicates remain
DROP POLICY IF EXISTS "companions_read_public" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_all" ON public.companions;

CREATE POLICY "companions_read_public" ON public.companions FOR SELECT USING (true);

CREATE POLICY "companions_admin_all" ON public.companions FOR ALL USING (
    public.is_admin()
);

-- 5. FINAL CHECK FOR GLOBAL SETTINGS
-- Just ensuring these are clean too
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_public" ON public.global_settings;

CREATE POLICY "global_settings_read_public" ON public.global_settings FOR SELECT USING (true);
