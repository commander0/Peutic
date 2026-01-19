-- ==========================================================
-- UNIFIED DATABASE UPDATE: FEATURES & OPTIMIZATIONS
-- Includes: Voice Journals, Time Capsules, Wisdom Circle, 
--           Inner Garden, and RLS Performance Fixes.
-- ==========================================================

-- 1. VOICE JOURNALS (Feature #5)
CREATE TABLE IF NOT EXISTS public.voice_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  title TEXT DEFAULT 'Audio Note',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.voice_journals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_voice_journals_user_id ON public.voice_journals(user_id);

DROP POLICY IF EXISTS "Users can view own voice journals" ON public.voice_journals;
CREATE POLICY "Users can view own voice journals" ON public.voice_journals FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own voice journals" ON public.voice_journals;
CREATE POLICY "Users can insert own voice journals" ON public.voice_journals FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own voice journals" ON public.voice_journals;
CREATE POLICY "Users can delete own voice journals" ON public.voice_journals FOR DELETE USING ((select auth.uid()) = user_id);


-- 2. TIME CAPSULES
CREATE TABLE IF NOT EXISTS public.time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    unlock_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_revealed BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON public.time_capsules(user_id);

DROP POLICY IF EXISTS "Users can create capsules" ON public.time_capsules;
CREATE POLICY "Users can create capsules" ON public.time_capsules FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own capsules" ON public.time_capsules;
CREATE POLICY "Users can read own capsules" ON public.time_capsules FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own capsules" ON public.time_capsules;
CREATE POLICY "Users can delete own capsules" ON public.time_capsules FOR DELETE USING ((select auth.uid()) = user_id);


-- 3. WISDOM CIRCLE
CREATE TABLE IF NOT EXISTS public.public_wisdom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL CHECK (length(content) < 500),
    category TEXT DEFAULT 'General',
    is_approved BOOLEAN DEFAULT FALSE,
    exclude_from_feed BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    location_lat FLOAT,
    location_lng FLOAT
);

ALTER TABLE public.public_wisdom ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_public_wisdom_user_id ON public.public_wisdom(user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_approved ON public.public_wisdom(is_approved, created_at DESC);

-- Consolidate SELECT policies to avoid "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "Public Read Wisdom" ON public.public_wisdom;
DROP POLICY IF EXISTS "User Read Own Wisdom" ON public.public_wisdom;
CREATE POLICY "Wisdom Select Access" ON public.public_wisdom 
FOR SELECT USING (
    (is_approved = TRUE AND exclude_from_feed = FALSE)
    OR
    ((select auth.uid()) = user_id)
);

DROP POLICY IF EXISTS "User Create Wisdom" ON public.public_wisdom;
CREATE POLICY "User Create Wisdom" ON public.public_wisdom FOR INSERT WITH CHECK ((select auth.uid()) = user_id);


-- 4. INNER GARDEN
CREATE TABLE IF NOT EXISTS public.user_garden (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    current_plant_type TEXT DEFAULT 'Lotus',
    last_watered_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.garden_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_garden_user_id ON public.user_garden(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_log_user_id ON public.garden_log(user_id);

DROP POLICY IF EXISTS "Garden Own Access" ON public.user_garden;
CREATE POLICY "Garden Own Access" ON public.user_garden FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Garden Log Own Access" ON public.garden_log;
CREATE POLICY "Garden Log Own Access" ON public.garden_log FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));


-- 5. GLOBAL PERFORMANCE & CLEANUP (Auth RLS & Multiple Policies)
-- Clean up legacy policy names that cause linter warnings
DROP POLICY IF EXISTS "Enable Read for Users" ON public.users;
DROP POLICY IF EXISTS "Enable Update for Users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- Consolidated "Safe" policies
DROP POLICY IF EXISTS "users_select_safe" ON public.users;
CREATE POLICY "users_select_safe" ON public.users FOR SELECT USING ((select auth.uid()) = id OR public.is_admin());

DROP POLICY IF EXISTS "users_update_safe" ON public.users;
CREATE POLICY "users_update_safe" ON public.users FOR UPDATE USING ((select auth.uid()) = id OR public.is_admin());

-- Reload configuration
NOTIFY pgrst, 'reload config';
