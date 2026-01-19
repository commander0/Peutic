-- POCKET PETS TABLE - OPTIMIZED VERSION
-- Fixes RLS performance warning and adds missing index

-- 1. CREATE TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.pocket_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    health NUMERIC DEFAULT 100,
    hunger NUMERIC DEFAULT 100,
    happiness NUMERIC DEFAULT 100,
    cleanliness NUMERIC DEFAULT 100,
    energy NUMERIC DEFAULT 100,
    is_sleeping BOOLEAN DEFAULT false,
    last_interaction_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ADD INDEX for foreign key (fixes unindexed_foreign_keys warning)
CREATE INDEX IF NOT EXISTS idx_pocket_pets_user_id ON public.pocket_pets(user_id);

-- 3. ENABLE RLS
ALTER TABLE public.pocket_pets ENABLE ROW LEVEL SECURITY;

-- 4. DROP old policy if exists (to replace with optimized version)
DROP POLICY IF EXISTS "Users can manage their own pets" ON public.pocket_pets;

-- 5. CREATE OPTIMIZED RLS POLICY (fixes auth_rls_initplan warning)
-- Uses (select auth.uid()) instead of auth.uid() for better performance
CREATE POLICY "Users can manage their own pets"
    ON public.pocket_pets
    FOR ALL
    USING ((select auth.uid()) = user_id);

-- 6. CLEANUP UNUSED INDEXES (Optional - uncomment if you want to remove them)
-- These are INFO level warnings and may become used in the future
-- Only uncomment if you're confident they won't be needed

-- DROP INDEX IF EXISTS idx_journals_user_id;
-- DROP INDEX IF EXISTS idx_user_art_user_id;
-- DROP INDEX IF EXISTS idx_active_sessions_heartbeat;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_transactions_user_date;
-- DROP INDEX IF EXISTS idx_safety_alerts_user_id;
-- DROP INDEX IF EXISTS idx_time_capsules_user_id;
-- DROP INDEX IF EXISTS idx_public_wisdom_user_id;
-- DROP INDEX IF EXISTS idx_wisdom_approved;
-- DROP INDEX IF EXISTS idx_garden_log_user_id;
