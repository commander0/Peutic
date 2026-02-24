-- ==============================================================================
-- PEUTIC OS: PRODUCTION SCALE OPTIMIZATIONS
-- Purpose: B-Tree Composite Indexing & RLS Hardening for 1M+ MAUs
-- Instructions: Run this script in the Supabase SQL Editor BEFORE public launch.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HIGH-PERFORMANCE COMPOSITE INDEXES
-- Native foreign key indexes exist, but queries sort by date. 
-- Composite indexes prevent memory-heavy sorts during large `SELECT` operations.
-- ------------------------------------------------------------------------------

-- Journals & Voice Journals (Heavy Read/Write, always sorted by date)
CREATE INDEX IF NOT EXISTS idx_journals_user_date ON public.journals (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_voice_journals_user_date ON public.voice_journals (user_id, created_at DESC);

-- Moods & Art (Dashboard frequently queries the latest records)
CREATE INDEX IF NOT EXISTS idx_moods_user_date ON public.moods (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_art_user_date ON public.user_art (user_id, created_at DESC);

-- Transactions (Financial ledgers grow infinitely, must be quickly paginated)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);

-- Gamification Logs (Frequently updated, specifically needs to find single rows fast)
CREATE INDEX IF NOT EXISTS idx_garden_log_user_level ON public.garden_log (user_id, level);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON public.focus_sessions (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pocket_pets_user_health on public.pocket_pets (user_id, health DESC);

-- ------------------------------------------------------------------------------
-- 2. RLS HARDENING (PREVENTING OWNERSHIP TRANSFER ATTACKS)
-- The current `FOR ALL USING (auth.uid() = user_id)` is good, but explicit
-- `WITH CHECK` clauses ensure no tricky JSON payload can change the `user_id` 
-- of an existing row during an update.
-- ------------------------------------------------------------------------------

-- Journals
DROP POLICY IF EXISTS "User Manage Journals" ON public.journals;
CREATE POLICY "journals_select" ON public.journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journals_insert" ON public.journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journals_update" ON public.journals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journals_delete" ON public.journals FOR DELETE USING (auth.uid() = user_id);

-- Garden Logs
DROP POLICY IF EXISTS "User Manage Garden" ON public.garden_log;
CREATE POLICY "garden_select" ON public.garden_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "garden_insert" ON public.garden_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "garden_update" ON public.garden_log FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pocket Pets
DROP POLICY IF EXISTS "User Manage Pets" ON public.pocket_pets;
CREATE POLICY "pets_select" ON public.pocket_pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pets_insert" ON public.pocket_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pets_update" ON public.pocket_pets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "User Create Tx" ON public.transactions;
DROP POLICY IF EXISTS "User Read Own Tx" ON public.transactions;
CREATE POLICY "tx_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tx_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Note: Transactions should NEVER be updatable or deletable by the user, only system/admin.
CREATE POLICY "tx_update_admin" ON public.transactions FOR UPDATE USING (public.is_admin());
CREATE POLICY "tx_delete_admin" ON public.transactions FOR DELETE USING (public.is_admin());

-- Users Table Identity Assertion
-- Ensure users cannot update their role to 'ADMIN' or alter their own balance freely through client.
DROP POLICY IF EXISTS "User Update Own" ON public.users;
CREATE POLICY "users_safe_update" ON public.users FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.users WHERE id = auth.uid()) -- Prevents mutating role
    -- Depending on architecture, you might want to prevent mutating `balance` here too,
    -- allowing only securely signed RPCs to alter balances.
);

-- ==============================================================================
-- END OF OPTIMIZATIONS
-- ==============================================================================
