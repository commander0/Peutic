-- ==========================================================
-- FINAL CLEANUP: FIX USER INSERT OVERLAP
-- ==========================================================

-- Problem: "users_insert_own" (New/Correct) and "users_insert_policy" (Old/Legacy) coexist.
-- Solution: Drop the legacy policy.

DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- Ensure the correct one is definitely there (idempotent check)
-- This matches what we created in fix_user_creation.sql
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

CREATE POLICY "users_insert_own" ON public.users
FOR INSERT WITH CHECK (
    (select auth.uid()) = id
);
