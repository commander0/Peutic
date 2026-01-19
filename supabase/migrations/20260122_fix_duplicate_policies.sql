-- -----------------------------------------------------------------------------
-- PEUTIC: POLICY CLEANUP & FIX (Resolves "Multiple Permissive Policies" Errors)
-- -----------------------------------------------------------------------------

-- 1. SMART CLEANUP: Drop ALL existing policies for the affected tables to ensure a clean slate.
-- This handles any conflicting naming conventions from previous runs.
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

-- 2. RE-APPLY POLICIES (Consolidated & Clean)

-- VOICE JOURNALS
-- One policy to rule them all (Select, Insert, Delete for Owner; All for Admin)
CREATE POLICY "Voice Journals Own Access" ON public.voice_journals 
FOR ALL USING (user_id = (select auth.uid()) OR public.is_admin());

-- GARDEN SYSTEM
CREATE POLICY "Garden Own Access" ON public.user_garden 
FOR ALL USING (user_id = (select auth.uid()) OR public.is_admin());

CREATE POLICY "Garden Log Own Insert" ON public.garden_log 
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Garden Log Own Select" ON public.garden_log 
FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());

-- WISDOM CIRCLE
-- Public can view approved items
CREATE POLICY "Wisdom Public View Approved" ON public.public_wisdom 
FOR SELECT USING (is_approved = true AND exclude_from_feed = false);

-- Users can submit (but not approve)
CREATE POLICY "Wisdom Own Insert" ON public.public_wisdom 
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Admins can do everything (Approve, Delete, View Unapproved)
CREATE POLICY "Wisdom Admin Manage" ON public.public_wisdom 
FOR ALL USING (public.is_admin());

-- TIME CAPSULES
CREATE POLICY "Capsules Own Access" ON public.time_capsules 
FOR ALL USING (user_id = (select auth.uid()) OR public.is_admin());
