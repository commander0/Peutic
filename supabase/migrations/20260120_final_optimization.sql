-- 20260120_final_optimization.sql
-- COMBINED FIXES FOR ALL REPORTED LINT WARNINGS
-- Run this single script in Supabase SQL Editor to resolve the issues.

-- -----------------------------------------------------------------------------
-- 1. FIX: function_search_path_mutable
-- Issue: Function `match_session_queue` had a mutable search path.
-- Remediation: Explicitly set search_path to 'public' to prevent hijacking.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_session_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_concurrency INT;
    v_current_active INT;
    v_slots_available INT;
    v_user_id UUID;
    v_companion_id UUID;
    r_user RECORD;
BEGIN
    -- A. Get Limits
    SELECT max_concurrent_sessions INTO v_max_concurrency FROM public.global_settings WHERE id = 1;
    SELECT COUNT(*) INTO v_current_active FROM public.active_sessions;
    
    v_slots_available := v_max_concurrency - v_current_active;

    -- B. If no slots, exit early
    IF v_slots_available <= 0 THEN
        RETURN;
    END IF;

    -- C. Loop through available slots (Locking to prevent race conditions)
    FOR r_user IN 
        SELECT user_id 
        FROM public.session_queue 
        ORDER BY created_at ASC 
        LIMIT v_slots_available
        FOR UPDATE SKIP LOCKED
    LOOP
        -- D. Find Specialist (Round Robin)
        SELECT id INTO v_companion_id
        FROM public.companions
        WHERE status = 'AVAILABLE'
        ORDER BY last_assigned_at ASC NULLS FIRST
        LIMIT 1;

        IF v_companion_id IS NULL THEN
            EXIT; 
        END IF;

        -- E. Move User & Update Specialist
        INSERT INTO public.active_sessions (user_id, companion_id, start_time, last_ping)
        VALUES (r_user.user_id, v_companion_id, NOW(), NOW());

        UPDATE public.companions 
        SET status = 'BUSY', last_assigned_at = NOW() 
        WHERE id = v_companion_id;

        -- F. Remove from Queue
        DELETE FROM public.session_queue WHERE user_id = r_user.user_id;
        
    END LOOP;
END;
$$;


-- -----------------------------------------------------------------------------
-- 2. FIX: auth_rls_initplan & unindexed_foreign_keys
-- Issue: `user_achievements` RLS policies were inefficient & foreign key unindexed.
-- Remediation: Use `(select auth.uid())` and create index.
-- -----------------------------------------------------------------------------

-- Drop potentially inefficient policies if they exist
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can unlock achievements" ON public.user_achievements;

-- Re-create Optimized Policies
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlock achievements"
ON public.user_achievements FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Create Missing Index
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);


-- -----------------------------------------------------------------------------
-- NOTE ON OTHER WARNINGS:
-- 1. "auth_leaked_password_protection": Enable this in Supabase Dashboard > Authentication > Security.
-- 2. "unused_index": These are normal for new tables with low traffic. Ignore for now.
-- -----------------------------------------------------------------------------
