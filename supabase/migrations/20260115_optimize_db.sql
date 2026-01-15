-- Database Optimization & Security Hardening
-- Run this in Supabase SQL Editor

-- 1. DROP DUPLICATE INDEXES
-- These indexes are redundant as `idx_*` versions already exist or are primary keys
DROP INDEX IF EXISTS public.journals_user_id_idx;
DROP INDEX IF EXISTS public.moods_user_id_idx;
DROP INDEX IF EXISTS public.user_art_user_id_idx;
DROP INDEX IF EXISTS public.transactions_user_id_idx;

-- 2. OPTIMIZE RLS POLICIES (Use (select auth.uid()) for caching)

-- USERS
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- COMPANIONS (Split to avoid permissive overlap with 'companions_read_all')
DROP POLICY IF EXISTS "companions_admin_all" ON public.companions;
-- 'companions_read_all' covers SELECT for everyone covering the 'admin read' case efficienty
CREATE POLICY "companions_admin_modify" ON public.companions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "companions_admin_update" ON public.companions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "companions_admin_delete" ON public.companions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- JOURNALS
DROP POLICY IF EXISTS "journals_select_own" ON public.journals;
CREATE POLICY "journals_select_own" ON public.journals FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "journals_insert_own" ON public.journals;
CREATE POLICY "journals_insert_own" ON public.journals FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "journals_update_own" ON public.journals;
CREATE POLICY "journals_update_own" ON public.journals FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "journals_delete_own" ON public.journals;
CREATE POLICY "journals_delete_own" ON public.journals FOR DELETE USING ((select auth.uid()) = user_id);

-- MOODS
DROP POLICY IF EXISTS "moods_select_own" ON public.moods;
CREATE POLICY "moods_select_own" ON public.moods FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "moods_insert_own" ON public.moods;
CREATE POLICY "moods_insert_own" ON public.moods FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "moods_delete_own" ON public.moods;
CREATE POLICY "moods_delete_own" ON public.moods FOR DELETE USING ((select auth.uid()) = user_id);

-- USER ART
DROP POLICY IF EXISTS "user_art_select_own" ON public.user_art;
CREATE POLICY "user_art_select_own" ON public.user_art FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_art_insert_own" ON public.user_art;
CREATE POLICY "user_art_insert_own" ON public.user_art FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_art_delete_own" ON public.user_art;
CREATE POLICY "user_art_delete_own" ON public.user_art FOR DELETE USING ((select auth.uid()) = user_id);

-- TRANSACTIONS
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;
CREATE POLICY "transactions_admin_all" ON public.transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- FEEDBACK
DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
CREATE POLICY "feedback_select_own" ON public.feedback FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
CREATE POLICY "feedback_insert_own" ON public.feedback FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
CREATE POLICY "feedback_admin_all" ON public.feedback FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- SYSTEM LOGS
DROP POLICY IF EXISTS "system_logs_admin_only" ON public.system_logs;
CREATE POLICY "system_logs_admin_only" ON public.system_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
-- Note: 'system_logs_insert_any' is intentionally left as is for public logging.

-- GLOBAL SETTINGS (Split to avoid permissive overlap)
DROP POLICY IF EXISTS "global_settings_admin_write" ON public.global_settings;
-- 'global_settings_read_all' covers SELECT
CREATE POLICY "global_settings_admin_modify" ON public.global_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "global_settings_admin_update" ON public.global_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "global_settings_admin_delete" ON public.global_settings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- ACTIVE SESSIONS
DROP POLICY IF EXISTS "active_sessions_select_own" ON public.active_sessions;
CREATE POLICY "active_sessions_select_own" ON public.active_sessions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "active_sessions_insert_own" ON public.active_sessions;
CREATE POLICY "active_sessions_insert_own" ON public.active_sessions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "active_sessions_update_own" ON public.active_sessions;
CREATE POLICY "active_sessions_update_own" ON public.active_sessions FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "active_sessions_delete_own" ON public.active_sessions;
CREATE POLICY "active_sessions_delete_own" ON public.active_sessions FOR DELETE USING ((select auth.uid()) = user_id);

-- SESSION QUEUE
DROP POLICY IF EXISTS "session_queue_select_own" ON public.session_queue;
CREATE POLICY "session_queue_select_own" ON public.session_queue FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "session_queue_insert_own" ON public.session_queue;
CREATE POLICY "session_queue_insert_own" ON public.session_queue FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "session_queue_update_own" ON public.session_queue;
CREATE POLICY "session_queue_update_own" ON public.session_queue FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "session_queue_delete_own" ON public.session_queue;
CREATE POLICY "session_queue_delete_own" ON public.session_queue FOR DELETE USING ((select auth.uid()) = user_id);
