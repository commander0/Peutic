-- MASTER FIX: Database Optimization & Lint Cleanup
-- Replaces previous partial fixes. Consolidates RLS policies to single-per-action.
-- Run this in Supabase SQL Editor.

-- SECTION 1: DROP UNUSED/DUPLICATE INDEXES
-- Removing indexes flagged as 'Unused' or 'Duplicate' by the linter
DROP INDEX IF EXISTS public.journals_user_id_idx;
DROP INDEX IF EXISTS public.idx_journals_user_id; -- Explicitly named one if exists
DROP INDEX IF EXISTS public.moods_user_id_idx;
DROP INDEX IF EXISTS public.idx_moods_user_id;
DROP INDEX IF EXISTS public.user_art_user_id_idx;
DROP INDEX IF EXISTS public.idx_user_art_user_id;
DROP INDEX IF EXISTS public.transactions_user_id_idx;
DROP INDEX IF EXISTS public.idx_transactions_user_id;
DROP INDEX IF EXISTS public.idx_active_sessions_heartbeat;
DROP INDEX IF EXISTS public.idx_session_queue_created;


-- SECTION 2: CONSOLIDATE RLS POLICIES
-- Strategy: Use ONE policy per action (Select, Insert, Update, Delete) containing all logic (User OR Admin).
-- This eliminates "Multiple Permissive Policies" warnings.

-- === USERS TABLE ===
-- Drop all known variants of old policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_admin_select" ON public.users;
DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
DROP POLICY IF EXISTS "users_admin_update" ON public.users;
DROP POLICY IF EXISTS "users_admin_delete" ON public.users;

CREATE POLICY "users_select_policy" ON public.users FOR SELECT USING (
    (select auth.uid()) = id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "users_insert_policy" ON public.users FOR INSERT WITH CHECK (
    (select auth.uid()) = id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "users_update_policy" ON public.users FOR UPDATE USING (
    (select auth.uid()) = id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "users_delete_policy" ON public.users FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);


-- === FEEDBACK TABLE ===
DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_select" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_insert" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_update" ON public.feedback;
DROP POLICY IF EXISTS "feedback_admin_delete" ON public.feedback;

CREATE POLICY "feedback_select_policy" ON public.feedback FOR SELECT USING (
    (select auth.uid()) = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "feedback_insert_policy" ON public.feedback FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "feedback_update_policy" ON public.feedback FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "feedback_delete_policy" ON public.feedback FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);


-- === TRANSACTIONS TABLE ===
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_delete" ON public.transactions;

CREATE POLICY "transactions_select_policy" ON public.transactions FOR SELECT USING (
    (select auth.uid()) = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "transactions_insert_policy" ON public.transactions FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "transactions_update_policy" ON public.transactions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

CREATE POLICY "transactions_delete_policy" ON public.transactions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);


-- === SYSTEM LOGS TABLE ===
-- Special case: Public insert, Admin everything else.
DROP POLICY IF EXISTS "system_logs_admin_only" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_any" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_admin_select" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_admin_insert" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_admin_update" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_admin_delete" ON public.system_logs;

-- Consolidated Select: Admin Only
CREATE POLICY "system_logs_select_policy" ON public.system_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- Consolidated Insert: Public (Any authenticated/anon depending on reqs, assuming ANY here based on previous 'insert_any')
-- Actually, the linter warning was "system_logs_insert_any" vs "system_logs_admin_only".
-- If we allow ANY insert, we don't need a separate Admin insert policy.
CREATE POLICY "system_logs_insert_policy" ON public.system_logs FOR INSERT WITH CHECK (
    true 
);

-- Consolidated Update: Admin Only
CREATE POLICY "system_logs_update_policy" ON public.system_logs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- Consolidated Delete: Admin Only
CREATE POLICY "system_logs_delete_policy" ON public.system_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);


-- === COMPANIONS TABLE (Safety Check) ===
-- Ensuring no overlaps here either
DROP POLICY IF EXISTS "companions_admin_all" ON public.companions;
DROP POLICY IF EXISTS "companions_read_all" ON public.companions;
-- READ ALL is public, so Admin doesn't need a separate Select policy.
CREATE POLICY "companions_read_all" ON public.companions FOR SELECT USING (true);

DROP POLICY IF EXISTS "companions_admin_modify" ON public.companions; -- From previous script
-- If distinct insert/update/delete needed
CREATE POLICY "companions_modify_policy" ON public.companions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
-- But 'ALL' conflicts with 'SELECT' (read_all).
-- So we MUST split modify.
DROP POLICY IF EXISTS "companions_modify_policy" ON public.companions;

CREATE POLICY "companions_insert_policy" ON public.companions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "companions_update_policy" ON public.companions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "companions_delete_policy" ON public.companions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);


-- === GLOBAL SETTINGS (Safety Check) ===
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_write" ON public.global_settings; -- Old
DROP POLICY IF EXISTS "global_settings_admin_modify" ON public.global_settings; -- Previous script

CREATE POLICY "global_settings_read_all" ON public.global_settings FOR SELECT USING (true);

CREATE POLICY "global_settings_insert_policy" ON public.global_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "global_settings_update_policy" ON public.global_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "global_settings_delete_policy" ON public.global_settings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
