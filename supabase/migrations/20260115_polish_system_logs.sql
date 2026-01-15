-- FINAL POLISH: Optimize System Logs Policy
-- Resolves "Auth RLS Initialization Plan" warning by wrapping auth.role() in (select ...).

-- 1. Optimize system_logs insert policy
DROP POLICY IF EXISTS "system_logs_insert_policy" ON public.system_logs;

CREATE POLICY "system_logs_insert_policy" ON public.system_logs FOR INSERT WITH CHECK (
    -- Use (select ...) to allow Postgres to cache the result (InitPlan) instead of checking every row
    (select auth.role()) IN ('anon', 'authenticated')
);

-- Note on Indexes:
-- The linter may flag "Unused Index" for the FK indexes we just restored (journals, moods, etc).
-- We are intentionally keeping these indexes because they are required to prevent locking issues 
-- during foreign key updates/deletes in a production environment. 
-- "Unused Index" is an INFO level notice that is expected in a low-traffic/dev environment.
