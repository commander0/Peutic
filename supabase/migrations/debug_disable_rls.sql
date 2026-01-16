-- ==========================================================
-- DEBUG: DISABLE RLS FOR GLOBAL SETTINGS (TEMPORARY)
-- ==========================================================
-- This disables RLS entirely for this table.
-- If this works, we KNOW 100% it was a policy issue.

ALTER TABLE public.global_settings DISABLE ROW LEVEL SECURITY;

-- Also ensure the row exists (again)
INSERT INTO public.global_settings (id, site_name)
VALUES (1, 'Peutic')
ON CONFLICT (id) DO NOTHING;
