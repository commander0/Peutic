-- COMPREHENSIVE FIX: Admin Role Restoration + RLS INSERT Permissions
-- Run this script in Supabase SQL Editor to fix all issues

-- ============================================================
-- STEP 1: RESTORE ADMIN ROLE
-- The repairUserRecord function accidentally demoted admins to USER.
-- This restores the first user as ADMIN (original system design).
-- ============================================================
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Find the first user (by creation date)
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
-- STEP 2: FIX RLS POLICIES FOR INSERT OPERATIONS
-- The "FOR ALL USING(...)" policies were missing "WITH CHECK"
-- which is required for INSERT operations to work.
-- ============================================================

-- Fix Journals policy
DROP POLICY IF EXISTS "Journals Own Access" ON public.journals;
CREATE POLICY "Journals Own Access" ON public.journals 
FOR ALL 
USING (user_id = (select auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

-- Fix User Art policy
DROP POLICY IF EXISTS "Art Own Access" ON public.user_art;
DROP POLICY IF EXISTS "Art Own Insert" ON public.user_art;
DROP POLICY IF EXISTS "Art Own Delete" ON public.user_art;
DROP POLICY IF EXISTS "Art Full Access" ON public.user_art;

CREATE POLICY "Art Full Access" ON public.user_art 
FOR ALL 
USING (user_id = (select auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

-- Fix Moods policy
DROP POLICY IF EXISTS "Moods Own Access" ON public.moods;
DROP POLICY IF EXISTS "Moods Own Insert" ON public.moods;
DROP POLICY IF EXISTS "Moods Full Access" ON public.moods;

CREATE POLICY "Moods Full Access" ON public.moods 
FOR ALL 
USING (user_id = (select auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

-- ============================================================
-- STEP 3: Notify PostgREST to reload policies
-- ============================================================
NOTIFY pgrst, 'reload config';

-- Done! Your admin role is restored and saves will work again.
