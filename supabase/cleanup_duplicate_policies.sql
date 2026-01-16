-- =============================================
-- PEUTIC: RLS Policy Cleanup Script
-- =============================================
-- PURPOSE: Remove duplicate/legacy RLS policies to resolve
-- Supabase linter "multiple_permissive_policies" warnings.
-- 
-- RUN THIS ONCE in Supabase SQL Editor to clean up duplicates.
-- This script drops the OLD policies and retains the "Unified" ones.
-- =============================================

-- =====================================
-- 1. USERS TABLE
-- =====================================
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_safe" ON public.users;
DROP POLICY IF EXISTS "users_update_safe" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- =====================================
-- 2. COMPANIONS TABLE
-- =====================================
DROP POLICY IF EXISTS "companions_read_public" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_insert" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_update" ON public.companions;
DROP POLICY IF EXISTS "companions_admin_delete" ON public.companions;
DROP POLICY IF EXISTS "Public read access" ON public.companions;
DROP POLICY IF EXISTS "Admin write access" ON public.companions;

-- =====================================
-- 3. TRANSACTIONS TABLE
-- =====================================
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

-- =====================================
-- 4. FEEDBACK TABLE
-- =====================================
DROP POLICY IF EXISTS "feedback_insert_policy" ON public.feedback;
DROP POLICY IF EXISTS "feedback_select_policy" ON public.feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;

-- =====================================
-- 5. GLOBAL SETTINGS TABLE
-- =====================================
DROP POLICY IF EXISTS "global_settings_read_public" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_admin_update" ON public.global_settings;
DROP POLICY IF EXISTS "Public read access" ON public.global_settings;
DROP POLICY IF EXISTS "Admin update access" ON public.global_settings;

-- =====================================
-- 6. SYSTEM LOGS TABLE
-- =====================================
DROP POLICY IF EXISTS "system_logs_read_admin" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_all" ON public.system_logs;
DROP POLICY IF EXISTS "Admin read access" ON public.system_logs;

-- =====================================
-- 7. JOURNALS TABLE
-- =====================================
DROP POLICY IF EXISTS "journals_select_own" ON public.journals;
DROP POLICY IF EXISTS "journals_insert_own" ON public.journals;
DROP POLICY IF EXISTS "journals_update_own" ON public.journals;
DROP POLICY IF EXISTS "journals_delete_own" ON public.journals;

-- =====================================
-- 8. MOODS TABLE
-- =====================================
DROP POLICY IF EXISTS "moods_select_own" ON public.moods;
DROP POLICY IF EXISTS "moods_insert_own" ON public.moods;
DROP POLICY IF EXISTS "moods_delete_own" ON public.moods;

-- =====================================
-- 9. USER_ART TABLE
-- =====================================
DROP POLICY IF EXISTS "user_art_select_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_insert_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_delete_own" ON public.user_art;

-- =====================================
-- 10. ACTIVE_SESSIONS TABLE
-- =====================================
DROP POLICY IF EXISTS "active_sessions_select_own" ON public.active_sessions;
DROP POLICY IF EXISTS "active_sessions_insert_own" ON public.active_sessions;
DROP POLICY IF EXISTS "active_sessions_update_own" ON public.active_sessions;
DROP POLICY IF EXISTS "active_sessions_delete_own" ON public.active_sessions;

-- =====================================
-- 11. SESSION_QUEUE TABLE
-- =====================================
DROP POLICY IF EXISTS "session_queue_select_own" ON public.session_queue;
DROP POLICY IF EXISTS "session_queue_insert_own" ON public.session_queue;
DROP POLICY IF EXISTS "session_queue_update_own" ON public.session_queue;
DROP POLICY IF EXISTS "session_queue_delete_own" ON public.session_queue;

-- =====================================
-- VERIFICATION: List remaining policies
-- =====================================
-- After running this script, you can verify the cleanup by running:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- =====================================
-- SUCCESS MESSAGE
-- =====================================
DO $$
BEGIN
  RAISE NOTICE 'RLS Policy Cleanup Complete. Only "Unified" policies should remain.';
END $$;
