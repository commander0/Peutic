-- Migration: Create Time Capsules
-- Timestamp: 20260121_create_time_capsule

CREATE TABLE IF NOT EXISTS public.time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    unlock_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_revealed BOOLEAN DEFAULT FALSE -- Status tracking
);

-- RLS
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON public.time_capsules(user_id);

-- 1. Users can INSERT their own capsules
CREATE POLICY "Users can create capsules" ON public.time_capsules
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 2. Users can READ their own capsules
CREATE POLICY "Users can read own capsules" ON public.time_capsules
FOR SELECT USING ((select auth.uid()) = user_id);

-- 3. Users can DELETE their own capsules
CREATE POLICY "Users can delete own capsules" ON public.time_capsules
FOR DELETE USING ((select auth.uid()) = user_id);
