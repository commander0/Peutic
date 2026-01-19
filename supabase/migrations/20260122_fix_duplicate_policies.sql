-- -----------------------------------------------------------------------------
-- PEUTIC: FINAL POLICY FIX (Consolidated & Performance Optimized)
-- -----------------------------------------------------------------------------

-- 1. SMART CLEANUP: Drop ALL existing policies specific to these features.
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('voice_journals', 'user_garden', 'garden_log', 'public_wisdom', 'time_capsules')
    ) 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP; 
END $$;

-- 2. APPLY CONSOLIDATED POLICIES
-- Strategy: Use single complex policies instead of multiple simple ones.
-- Optimization: Use (select auth.function()) to ensure single evaluation plan.

-- VOICE JOURNALS
CREATE POLICY "Voice Journals Consolidated" ON public.voice_journals 
FOR ALL TO authenticated
USING (public.is_admin() OR user_id = (select auth.uid()))
WITH CHECK (public.is_admin() OR user_id = (select auth.uid()));

-- GARDEN SYSTEM
CREATE POLICY "Garden Consolidated" ON public.user_garden 
FOR ALL TO authenticated
USING (public.is_admin() OR user_id = (select auth.uid()))
WITH CHECK (public.is_admin() OR user_id = (select auth.uid()));

CREATE POLICY "Garden Log Insert" ON public.garden_log 
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Garden Log Select" ON public.garden_log 
FOR SELECT TO authenticated
USING (public.is_admin() OR user_id = (select auth.uid()));

-- WISDOM CIRCLE
-- Fix: Using (select auth.role()) to prevent row-by-row re-evaluation
CREATE POLICY "Wisdom View Consolidated" ON public.public_wisdom 
FOR SELECT USING (
  (is_approved = true AND exclude_from_feed = false) 
  OR 
  ((select auth.role()) = 'authenticated' AND public.is_admin())
);

CREATE POLICY "Wisdom Insert Consolidated" ON public.public_wisdom 
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()) OR public.is_admin());

CREATE POLICY "Wisdom Admin Write" ON public.public_wisdom 
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Wisdom Admin Delete" ON public.public_wisdom 
FOR DELETE TO authenticated
USING (public.is_admin());

-- TIME CAPSULES
CREATE POLICY "Capsules Consolidated" ON public.time_capsules 
FOR ALL TO authenticated
USING (public.is_admin() OR user_id = (select auth.uid()))
WITH CHECK (public.is_admin() OR user_id = (select auth.uid()));
