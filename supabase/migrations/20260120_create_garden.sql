-- Migration: Create Inner Garden tables
-- Timestamp: 20260120_create_garden

-- 1. Create the main garden state table
CREATE TABLE IF NOT EXISTS public.user_garden (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1, -- 1=Seed, 2=Sprout, 3=Sapling, 4=Budding, 5=Bloom
    current_plant_type TEXT DEFAULT 'Lotus', -- 'Lotus', 'Rose', 'Sunflower', 'Fern'
    last_watered_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0
);

-- 2. Create a log table for growth events (history)
CREATE TABLE IF NOT EXISTS public.garden_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'WATER', 'LEVEL_UP', 'WITHER'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.user_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_log ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Garden Policies
CREATE POLICY "Garden Own Access" ON public.user_garden 
FOR ALL USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Log Policies
CREATE POLICY "Garden Log Own Access" ON public.garden_log 
FOR ALL USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- 5. Create Indices for performance
CREATE INDEX IF NOT EXISTS idx_garden_user_id ON public.user_garden(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_log_user_id ON public.garden_log(user_id);

-- 6. Trigger to auto-create garden for new users (Optional, but good for consistency)
-- We can handle this in the frontend "getGarden" logic (lazy creation) to be safer.
