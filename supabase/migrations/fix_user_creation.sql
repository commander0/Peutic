-- ==========================================================
-- FIX: USER CREATION (Allow Insert)
-- ==========================================================

-- Problem: The "Nuclear" fix for RLS removed the ability for users to INSERT themselves.
--          This blocks new user signups if the app creates the profile client-side.

-- Solution: Re-enable INSERT policy for public.users, strictly scoped to their own ID.

CREATE POLICY "users_insert_own" ON public.users
FOR INSERT WITH CHECK (
    (select auth.uid()) = id
);

-- Also ensure UPDATE is robust (already done, but verifying scope)
-- Users should be able to update their own basic info.
-- Note: 'role' and 'balance' columns should be protected by Trigger or Column-level security,
--       but for RLS, we just allow the row update.
