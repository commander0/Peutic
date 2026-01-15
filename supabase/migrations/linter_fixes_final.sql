-- 1. FIX COMPANIONS OVERLAP (Detects multiple permissive policies)
-- Problem: 'FOR ALL' includes 'SELECT', which overlaps with 'companions_read_public'.
-- Solution: Avoid 'FOR ALL' and explicitly list write actions only.

DROP POLICY IF EXISTS "companions_admin_all" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_modify" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_iud" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_insert" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_update" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_delete" ON public.companions;

CREATE POLICY "companions_admin_insert" ON public.companions FOR INSERT WITH CHECK ( public.is_admin() );
CREATE POLICY "companions_admin_update" ON public.companions FOR UPDATE USING ( public.is_admin() );
CREATE POLICY "companions_admin_delete" ON public.companions FOR DELETE USING ( public.is_admin() );

-- 2. FIX FUNCTION SEARCH PATH (SECURITY)
-- Problem: 'protect_sensitive_user_columns' has a mutable search_path.
-- Solution: Strictly bind it to public.

ALTER FUNCTION public.protect_sensitive_user_columns() SET search_path = public;

-- Also double check is_admin search_path (already set in previous script, but reinforcing)
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 3. GLOBAL SETTINGS SECURITY POLISH
-- Ensure only admins can modify settings, and no policy overlap.
DROP POLICY IF EXISTS "global_settings_admin_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_update" ON public.global_settings;

CREATE POLICY "global_settings_admin_update" ON public.global_settings FOR UPDATE USING ( public.is_admin() );
CREATE POLICY "global_settings_admin_insert" ON public.global_settings FOR INSERT WITH CHECK ( public.is_admin() );
