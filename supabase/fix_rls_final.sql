-- FIX RLS POLICIES (FINAL)
-- This script resets RLS for all critical user data tables to ensure data saving works.

-- 1. USERS TABLE (Explicit Select/Update)
DROP POLICY IF EXISTS "Unified Users Select" ON public.users;
DROP POLICY IF EXISTS "Unified Users Update" ON public.users;
DROP POLICY IF EXISTS "Unified Users Insert" ON public.users;

CREATE POLICY "Enable Read for Users" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Enable Update for Users" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Enable Insert for Signup" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. JOURNALS
DROP POLICY IF EXISTS "Unified Journals Read" ON public.journals;
DROP POLICY IF EXISTS "Unified Journals Insert" ON public.journals;
DROP POLICY IF EXISTS "Unified Journals Update" ON public.journals;
DROP POLICY IF EXISTS "Unified Journals Delete" ON public.journals;

CREATE POLICY "Journal Select" ON public.journals FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Journal Insert" ON public.journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Journal Update" ON public.journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Journal Delete" ON public.journals FOR DELETE USING (auth.uid() = user_id);

-- 3. USER ART & WISDOM CARDS
DROP POLICY IF EXISTS "Unified Art Read" ON public.user_art;
DROP POLICY IF EXISTS "Unified Art Insert" ON public.user_art;
DROP POLICY IF EXISTS "Unified Art Update" ON public.user_art;
DROP POLICY IF EXISTS "Unified Art Delete" ON public.user_art;

CREATE POLICY "Art Select" ON public.user_art FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Art Insert" ON public.user_art FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Art Update" ON public.user_art FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Art Delete" ON public.user_art FOR DELETE USING (auth.uid() = user_id);

-- 4. MOODS
DROP POLICY IF EXISTS "Unified Moods Read" ON public.moods;
DROP POLICY IF EXISTS "Unified Moods Insert" ON public.moods;
DROP POLICY IF EXISTS "Unified Moods Update" ON public.moods;
DROP POLICY IF EXISTS "Unified Moods Delete" ON public.moods;

CREATE POLICY "Mood Select" ON public.moods FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Mood Insert" ON public.moods FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. GAME SCORES (Ensure column exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'game_scores') THEN
        ALTER TABLE public.users ADD COLUMN game_scores JSONB DEFAULT '{"match": 0, "cloud": 0}';
    END IF;
END $$;
