-- NUCLEAR CLEANUP: Remove ALL duplicate policies and create clean consolidated ones
-- This script fixes the "Multiple Permissive Policies" warnings

-- ============================================================
-- STEP 1: RESTORE ADMIN ROLE (if demoted)
-- ============================================================
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  SELECT id INTO first_user_id 
  FROM public.users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE public.users SET role = 'ADMIN' WHERE id = first_user_id;
    RAISE NOTICE 'Restored ADMIN role for user: %', first_user_id;
  END IF;
END $$;

-- ============================================================
-- STEP 2: DROP ALL EXISTING POLICIES ON AFFECTED TABLES
-- ============================================================

-- JOURNALS: Drop every possible policy name
DROP POLICY IF EXISTS "Journal Delete" ON public.journals;
DROP POLICY IF EXISTS "Journal Insert" ON public.journals;
DROP POLICY IF EXISTS "Journal Select" ON public.journals;
DROP POLICY IF EXISTS "Journal Update" ON public.journals;
DROP POLICY IF EXISTS "Journals Own Access" ON public.journals;
DROP POLICY IF EXISTS "Journals Full Access" ON public.journals;

-- MOODS: Drop every possible policy name
DROP POLICY IF EXISTS "Mood Delete" ON public.moods;
DROP POLICY IF EXISTS "Mood Insert" ON public.moods;
DROP POLICY IF EXISTS "Mood Select" ON public.moods;
DROP POLICY IF EXISTS "Mood Update" ON public.moods;
DROP POLICY IF EXISTS "Moods Own Access" ON public.moods;
DROP POLICY IF EXISTS "Moods Own Insert" ON public.moods;
DROP POLICY IF EXISTS "Moods Full Access" ON public.moods;

-- USER_ART: Drop every possible policy name
DROP POLICY IF EXISTS "Art Delete" ON public.user_art;
DROP POLICY IF EXISTS "Art Insert" ON public.user_art;
DROP POLICY IF EXISTS "Art Select" ON public.user_art;
DROP POLICY IF EXISTS "Art Update" ON public.user_art;
DROP POLICY IF EXISTS "Art Own Access" ON public.user_art;
DROP POLICY IF EXISTS "Art Own Insert" ON public.user_art;
DROP POLICY IF EXISTS "Art Own Delete" ON public.user_art;
DROP POLICY IF EXISTS "Art Full Access" ON public.user_art;

-- ============================================================
-- STEP 3: CREATE SINGLE CONSOLIDATED POLICIES (FOR ALL)
-- Using "FOR ALL" with both USING and WITH CHECK
-- ============================================================

-- Fix: Explicitly drop the NEW policy names first to prevent "already exists" errors
DROP POLICY IF EXISTS "Journals Access" ON public.journals;
CREATE POLICY "Journals Access" ON public.journals 
FOR ALL 
USING (user_id = (select auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Moods Access" ON public.moods;
CREATE POLICY "Moods Access" ON public.moods 
FOR ALL 
USING (user_id = (select auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Art Access" ON public.user_art;
CREATE POLICY "Art Access" ON public.user_art 
FOR ALL 
USING (user_id = (select auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

-- ============================================================
-- STEP 4: CLEAN UP UNUSED INDEXES (Optional Performance)
-- These indexes have never been used according to the linter
-- ============================================================
-- Uncomment below if you want to remove unused indexes:
-- DROP INDEX IF EXISTS idx_journals_user_id;
-- DROP INDEX IF EXISTS idx_user_art_user_id;
-- DROP INDEX IF EXISTS idx_active_sessions_heartbeat;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_transactions_user_date;
-- DROP INDEX IF EXISTS idx_safety_alerts_user_id;

-- ============================================================
-- STEP 5: Notify PostgREST to reload config
-- ============================================================
NOTIFY pgrst, 'reload config';

-- DONE! All duplicate policies removed and clean policies created.
