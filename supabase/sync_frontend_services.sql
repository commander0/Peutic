-- ============================================================
-- PEUTIC: FRONTEND SERVICE SYNCHRONIZATION SCRIPT
-- Aligning Supabase schema with UserService & AdminService
-- ============================================================

-- 1. SYSTEM LOGS STANDARDIZATION
-- Ensure the table matches AdminService.logSystemEvent structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'type') THEN
        ALTER TABLE public.system_logs RENAME COLUMN level TO type;
    END IF;
END $$;

ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- 2. BREATH SESSIONS TABLE
-- Requirement: UserService.recordBreathSession
CREATE TABLE IF NOT EXISTS public.breath_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.breath_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breath sessions" ON public.breath_sessions;
CREATE POLICY "Users can view own breath sessions" ON public.breath_sessions 
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can record breath sessions" ON public.breath_sessions;
CREATE POLICY "Users can record breath sessions" ON public.breath_sessions 
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 3. GAME SCORES TABLE
-- Requirement: UserService.updateGameScore
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    game TEXT NOT NULL, -- 'Match' or 'CloudHop'
    score INTEGER NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own game scores" ON public.game_scores;
CREATE POLICY "Users can view own game scores" ON public.game_scores 
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can record game scores" ON public.game_scores;
CREATE POLICY "Users can record game scores" ON public.game_scores 
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 4. USER PROFILE EXTENSIONS
-- Support for all fields in api-gateway 'user-update' action
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"marketing": true, "updates": true}';

-- 5. QUEUE SYSTEM ENHANCEMENTS
-- Requirement: VideoRoom Waiting HUD
CREATE OR REPLACE FUNCTION public.get_client_queue_position(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_pos INTEGER;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Get user's join time
  SELECT created_at INTO v_created_at FROM public.session_queue WHERE user_id = p_user_id;
  
  -- If not in queue, check if in active session (position 0)
  IF v_created_at IS NULL THEN 
    IF EXISTS (SELECT 1 FROM public.active_sessions WHERE user_id = p_user_id) THEN
      RETURN 0;
    END IF;
    RETURN -1; -- Not in system
  END IF;

  -- Calculate position based on creation time
  SELECT COUNT(*) + 1 INTO v_pos FROM public.session_queue WHERE created_at < v_created_at;
  RETURN v_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_breath_user_id ON public.breath_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);

-- 7. GRANT PERMISSIONS
GRANT ALL ON public.breath_sessions TO authenticated;
GRANT ALL ON public.game_scores TO authenticated;

DO $$ BEGIN RAISE NOTICE 'Service synchronization complete.'; END $$;
