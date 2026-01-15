-- ==========================================================
-- FINAL FIX: INFINITE RECURSION & SECURITY
-- ==========================================================

-- 1. DEFINE SECURE ADMIN CHECK FUNCTION
-- Drop first to ensure no conflicts
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    -- ALLOW SERVICE ROLE & POSTGRES (Supabase Dashboard / SQL Editor)
    -- This ensures cleanup scripts and migrations can actually run.
    IF (current_user = 'service_role' OR current_user = 'postgres' OR current_user = 'supabase_admin') THEN
        RETURN TRUE;
    END IF;

    -- CHECK LOGGED-IN USER SESSION
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (select auth.uid())
        AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- GRANT EXECUTE
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. FIX USERS TABLE POLICIES
DROP POLICY IF EXISTS "users_select_safe" ON public.users;
DROP POLICY IF EXISTS "users_update_safe" ON public.users;
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_read_all" ON public.users;

-- Apply SAFE Policy
CREATE POLICY "users_select_safe" ON public.users FOR SELECT USING (
    (select auth.uid()) = id
    OR
    public.is_admin()
);

CREATE POLICY "users_update_safe" ON public.users FOR UPDATE USING (
    (select auth.uid()) = id
    OR
    public.is_admin()
);

-- 3. FIX GLOBAL SETTINGS
DROP POLICY IF EXISTS "global_settings_read_public" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_update" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_insert" ON public.global_settings;

CREATE POLICY "global_settings_read_public" ON public.global_settings FOR SELECT USING (true);

CREATE POLICY "global_settings_admin_update" ON public.global_settings FOR UPDATE USING (
    public.is_admin()
);

CREATE POLICY "global_settings_admin_insert" ON public.global_settings FOR INSERT WITH CHECK (
    public.is_admin()
);

-- 4. FIX SYSTEM LOGS
DROP POLICY IF EXISTS "system_logs_read_admin" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_safe" ON public.system_logs;

CREATE POLICY "system_logs_read_admin" ON public.system_logs FOR SELECT USING (
    public.is_admin()
);

-- 5. FIX COMPANIONS
DROP POLICY IF EXISTS "companions_read_public" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_all" ON public.companions;

ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companions_read_public" ON public.companions FOR SELECT USING (true);

CREATE POLICY "companions_admin_all" ON public.companions FOR ALL USING (
    public.is_admin()
);
