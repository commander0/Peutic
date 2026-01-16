-- Fix Remaining Permissive Policy Warnings
-- Splitting Admin "ALL" policies into action-specific policies to avoid performance penalties from policy overlap.

-- 1. FEEDBACK
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;

CREATE POLICY "feedback_admin_select" ON public.feedback FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "feedback_admin_insert" ON public.feedback FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "feedback_admin_update" ON public.feedback FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "feedback_admin_delete" ON public.feedback FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- 2. TRANSACTIONS
DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;

CREATE POLICY "transactions_admin_select" ON public.transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "transactions_admin_insert" ON public.transactions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "transactions_admin_update" ON public.transactions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "transactions_admin_delete" ON public.transactions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- 3. USERS
DROP POLICY IF EXISTS "users_admin_all" ON public.users;

CREATE POLICY "users_admin_select" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "users_admin_insert" ON public.users FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "users_admin_update" ON public.users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "users_admin_delete" ON public.users FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);

-- 4. SYSTEM LOGS
DROP POLICY IF EXISTS "system_logs_admin_only" ON public.system_logs;

CREATE POLICY "system_logs_admin_select" ON public.system_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "system_logs_admin_insert" ON public.system_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "system_logs_admin_update" ON public.system_logs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
CREATE POLICY "system_logs_admin_delete" ON public.system_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'ADMIN')
);
