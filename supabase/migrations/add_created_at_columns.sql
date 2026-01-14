-- Migration: Add created_at columns for waiting room logic
-- Used for seniority-based queue positioning

-- 1. Update active_sessions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='active_sessions' AND column_name='created_at') THEN
        ALTER TABLE public.active_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Update session_queue
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='session_queue' AND column_name='created_at') THEN
        ALTER TABLE public.session_queue ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
