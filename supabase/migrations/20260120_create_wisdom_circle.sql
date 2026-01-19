-- Migration: Create Wisdom Circle Tables
-- Timestamp: 20260120_create_wisdom_circle

CREATE TABLE IF NOT EXISTS public.public_wisdom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable to allow "forgotten" wisdom
    content TEXT NOT NULL CHECK (length(content) < 500),
    category TEXT DEFAULT 'General', -- 'Hope', 'Resilience', 'Calm', 'Love'
    is_approved BOOLEAN DEFAULT FALSE, -- Requires Admin approval
    exclude_from_feed BOOLEAN DEFAULT FALSE, -- Soft delete
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    location_lat FLOAT,
    location_lng FLOAT
);

-- RLS
ALTER TABLE public.public_wisdom ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_wisdom_user_id ON public.public_wisdom(user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_approved ON public.public_wisdom(is_approved, created_at DESC);

-- Policies

-- 1. Public Read: Only approved items
CREATE POLICY "Public Read Wisdom" ON public.public_wisdom
FOR SELECT
USING (is_approved = TRUE AND exclude_from_feed = FALSE);

-- 2. User Create: Authenticated users can insert
CREATE POLICY "User Create Wisdom" ON public.public_wisdom
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

-- 3. User Read Own Wisdom
CREATE POLICY "User Read Own Wisdom" ON public.public_wisdom
FOR SELECT
USING ((select auth.uid()) = user_id);
