-- ==========================================================
-- FIX: WISDOM ART & THEME
-- Relies on: public.is_admin() (created in previous fix)
-- ==========================================================

-- 1. ENSURE USER ART TABLE EXISTS (With Correct Schema)
-- We use IF NOT EXISTS to be safe, but we also ensure columns are correct.
CREATE TABLE IF NOT EXISTS public.user_art (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    prompt TEXT,
    title TEXT DEFAULT 'Wisdom Card',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 2. ENABLE RLS
ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;

-- 3. RESET POLICIES (Fix "Doesn't Save" Issue)
-- Drop any potentially broken or "Nuclear" affected policies
DROP POLICY IF EXISTS "user_art_select_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_insert_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_delete_own" ON public.user_art;
DROP POLICY IF EXISTS "user_art_select_policy" ON public.user_art; -- Legacy check

-- 4. CREATE SIMPLE, ROBUST POLICIES
-- Allow users to see and create ONLY their own art.

CREATE POLICY "user_art_select_own" ON public.user_art
FOR SELECT USING (
    (select auth.uid()) = user_id
);

CREATE POLICY "user_art_insert_own" ON public.user_art
FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
);

CREATE POLICY "user_art_delete_own" ON public.user_art
FOR DELETE USING (
    (select auth.uid()) = user_id
);

-- 5. GRANT PERMISSIONS (Often overlooked)
GRANT ALL ON public.user_art TO authenticated;
GRANT ALL ON public.user_art TO service_role;
