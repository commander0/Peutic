-- FIX ADMIN DASHBOARD TOGGLES & RESOLVE LINT OVERLAPS
-- UUID: 20260115_fix_global_settings_final_v2

-- 1. Create table & Enforce Singleton Pattern
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

-- 2. Insert Default Row
INSERT INTO public.global_settings (id, site_name, maintenance_mode, sale_mode, allow_signups, price_per_minute, max_concurrent_sessions, multilingual_mode)
VALUES (1, 'Peutic', FALSE, FALSE, TRUE, 1.99, 15, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. CLEANUP & OPTIMIZE POLICIES
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Drop ALL conflicting legacy policies (Comprehensive List)
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_select_policy" ON public.global_settings;

DROP POLICY IF EXISTS "global_settings_admin_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_write" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_modify" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_update" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_insert_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_delete_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_public" ON public.global_settings;

-- 4. CREATE NEW POLICIES (No Overlap)

-- Policy A: READ (Applies to everyone, including Admins)
-- Conflict Resolved: Admins use THIS policy for reading, not their own special one.
CREATE POLICY "global_settings_read_public" ON public.global_settings
FOR SELECT USING (true);

-- Policy B: WRITE (Applies ONLY to Admins, ONLY for modify actions)
-- We split these to be explicit and avoid "FOR ALL" overlapping with "FOR SELECT"

CREATE POLICY "global_settings_admin_insert" ON public.global_settings
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "global_settings_admin_update" ON public.global_settings
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "global_settings_admin_delete" ON public.global_settings
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- 5. Grant Permissions
GRANT SELECT ON public.global_settings TO anon, authenticated;
GRANT ALL ON public.global_settings TO service_role;
