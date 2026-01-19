-- -----------------------------------------------------------------------------
-- PEUTIC: COMPREHENSIVE FEATURE UPDATE (Voice, Garden, Wisdom, Time Capsule)
-- -----------------------------------------------------------------------------
-- FIX: Added DROP POLICY IF EXISTS to prevent "already exists" errors.

-- 1. VOICE JOURNALS
CREATE TABLE IF NOT EXISTS public.voice_journals (
  id TEXT PRIMARY KEY, -- Can be UUID or Path String
  user_id UUID REFERENCES public.users(id) NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.voice_journals ENABLE ROW LEVEL SECURITY;

-- Policies for Voice Journals
DROP POLICY IF EXISTS "Voice Journals Own Access" ON public.voice_journals;
CREATE POLICY "Voice Journals Own Access" ON public.voice_journals 
FOR ALL USING (user_id = (select auth.uid()) OR public.is_admin());

-- 2. GARDEN SYSTEM
CREATE TABLE IF NOT EXISTS public.user_garden (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  level INTEGER DEFAULT 1,
  current_plant_type TEXT DEFAULT 'Lotus',
  last_watered_at TIMESTAMPTZ DEFAULT NOW(),
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_garden ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.garden_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  event_type TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.garden_log ENABLE ROW LEVEL SECURITY;

-- Policies for Garden
DROP POLICY IF EXISTS "Garden Own Access" ON public.user_garden;
CREATE POLICY "Garden Own Access" ON public.user_garden 
FOR ALL USING (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Garden Log Own Insert" ON public.garden_log;
CREATE POLICY "Garden Log Own Insert" ON public.garden_log 
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Garden Log Own Select" ON public.garden_log;
CREATE POLICY "Garden Log Own Select" ON public.garden_log 
FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());

-- 3. WISDOM CIRCLE
CREATE TABLE IF NOT EXISTS public.public_wisdom (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  content TEXT,
  category TEXT DEFAULT 'General',
  is_approved BOOLEAN DEFAULT FALSE,
  exclude_from_feed BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.public_wisdom ENABLE ROW LEVEL SECURITY;

-- Policies for Wisdom
DROP POLICY IF EXISTS "Wisdom Public View Approved" ON public.public_wisdom;
CREATE POLICY "Wisdom Public View Approved" ON public.public_wisdom 
FOR SELECT USING (is_approved = true AND exclude_from_feed = false);

DROP POLICY IF EXISTS "Wisdom Own Insert" ON public.public_wisdom;
CREATE POLICY "Wisdom Own Insert" ON public.public_wisdom 
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Wisdom Admin Manage" ON public.public_wisdom;
CREATE POLICY "Wisdom Admin Manage" ON public.public_wisdom 
FOR ALL USING (public.is_admin());

-- 4. TIME CAPSULES
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT, -- Encrypted client-side ideally, but basic text for now
  unlock_date TIMESTAMPTZ NOT NULL,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- Policies for Time Capsules
DROP POLICY IF EXISTS "Capsules Own Access" ON public.time_capsules;
CREATE POLICY "Capsules Own Access" ON public.time_capsules 
FOR ALL USING (user_id = (select auth.uid()) OR public.is_admin());

-- 5. UPDATE MOODS CONSTRAINT
-- Dropping the strict check to allow for flexible mood logging (e.g. 'Anxious', 'Sad' for prediction risk)
DO $$ BEGIN
  ALTER TABLE public.moods DROP CONSTRAINT IF EXISTS moods_mood_check;
  -- We can add a new broader constraint or just leave it open. 
  -- For now, let's leave it open to support future mood types without migration.
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
