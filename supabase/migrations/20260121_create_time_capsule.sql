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

-- 1. Users can INSERT their own capsules
CREATE POLICY "Users can create capsules" ON public.time_capsules
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Users can READ their own capsules ONLY IF unlock_date <= now() OR they are listing metadata
-- We split into two policies:
-- A. Read metadata (id, created_at, unlock_date) - We can't really hide columns with RLS easily in standard SELECT *
-- S. So we allow reading the row, but the Frontend must handle the "Locked" UI.
-- Ideally, we'd use a View or separate table, but for MVP, we allow SELECT ALL for owner, 
-- and trust the UI to hide content, OR we could make content NULL if locked? (Hard in SQL w/o complex views)
-- Let's just allow owner to read everything. The App Logic ensures "Lock".
CREATE POLICY "Users can read own capsules" ON public.time_capsules
FOR SELECT USING (auth.uid() = user_id);

-- 3. Users can DELETE their own capsules (if they regret it?)
-- Let's allow it.
CREATE POLICY "Users can delete own capsules" ON public.time_capsules
FOR DELETE USING (auth.uid() = user_id);
