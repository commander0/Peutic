-- ============================================================
-- PEUTIC COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- Last Updated: 2026-01-14
-- ============================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING OBJECTS (Clean Slate)
-- ============================================================

-- Drop existing triggers (ignore errors if they don't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS prevent_admin_delete ON public.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS prevent_admin_deletion() CASCADE;
DROP FUNCTION IF EXISTS cleanup_stale_sessions() CASCADE;
DROP FUNCTION IF EXISTS deduct_user_balance(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS add_user_balance(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS join_queue(UUID) CASCADE;
DROP FUNCTION IF EXISTS claim_active_spot(UUID) CASCADE;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'User',
  birthday DATE,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  balance INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
  avatar_url TEXT,
  provider TEXT DEFAULT 'email',
  email_preferences JSONB DEFAULT '{"marketing": true, "updates": true}'::jsonb,
  theme_preference TEXT DEFAULT 'light',
  language_preference TEXT DEFAULT 'en',
  last_login_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companions Table
CREATE TABLE IF NOT EXISTS public.companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  replica_id TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journals Table
CREATE TABLE IF NOT EXISTS public.journals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moods Table
CREATE TABLE IF NOT EXISTS public.moods (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  mood TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Art / Wisdom Cards
CREATE TABLE IF NOT EXISTS public.user_art (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  prompt TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID,
  user_name TEXT,
  amount INTEGER NOT NULL,
  cost NUMERIC(10,2),
  description TEXT,
  status TEXT DEFAULT 'COMPLETED',
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY,
  user_id UUID,
  user_name TEXT,
  companion_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[],
  duration INTEGER,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR')),
  event TEXT NOT NULL,
  details TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global Settings Table
CREATE TABLE IF NOT EXISTS public.global_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode BOOLEAN DEFAULT false,
  max_concurrent_sessions INTEGER DEFAULT 5,
  sale_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Sessions Table (Concurrency Control)
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Session Queue Table (Waiting Room)
CREATE TABLE IF NOT EXISTS public.session_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- Users table columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Active sessions columns
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Session queue columns
ALTER TABLE public.session_queue ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.session_queue ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Transactions user_id
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID;

-- Journals columns
ALTER TABLE public.journals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Moods columns
ALTER TABLE public.moods ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- User art columns
ALTER TABLE public.user_art ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- INDEXES (Performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON public.moods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_art_user_id ON public.user_art(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat ON public.active_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_session_queue_created ON public.session_queue(created_at);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES (Clean)
-- ============================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Users: Own profile + Admin access
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_admin_all" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Companions: Public read
CREATE POLICY "companions_read_all" ON public.companions FOR SELECT USING (true);
CREATE POLICY "companions_admin_all" ON public.companions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Journals: Own data only
CREATE POLICY "journals_select_own" ON public.journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journals_insert_own" ON public.journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journals_update_own" ON public.journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "journals_delete_own" ON public.journals FOR DELETE USING (auth.uid() = user_id);

-- Moods: Own data only
CREATE POLICY "moods_select_own" ON public.moods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "moods_insert_own" ON public.moods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moods_delete_own" ON public.moods FOR DELETE USING (auth.uid() = user_id);

-- User Art: Own data only
CREATE POLICY "user_art_select_own" ON public.user_art FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_art_insert_own" ON public.user_art FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_art_delete_own" ON public.user_art FOR DELETE USING (auth.uid() = user_id);

-- Transactions: Own data + Admin
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_admin_all" ON public.transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Feedback: Own data + Admin
CREATE POLICY "feedback_select_own" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_insert_own" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_admin_all" ON public.feedback FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- System Logs: Admin only + any insert
CREATE POLICY "system_logs_admin_only" ON public.system_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "system_logs_insert_any" ON public.system_logs FOR INSERT WITH CHECK (true);

-- Global Settings: Public read, Admin write
CREATE POLICY "global_settings_read_all" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "global_settings_admin_write" ON public.global_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Active Sessions: Own data
CREATE POLICY "active_sessions_select_own" ON public.active_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "active_sessions_insert_own" ON public.active_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "active_sessions_update_own" ON public.active_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "active_sessions_delete_own" ON public.active_sessions FOR DELETE USING (auth.uid() = user_id);

-- Session Queue: Own data
CREATE POLICY "session_queue_select_own" ON public.session_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "session_queue_insert_own" ON public.session_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "session_queue_update_own" ON public.session_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "session_queue_delete_own" ON public.session_queue FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ATOMIC BALANCE FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_user_balance(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    UPDATE public.users
    SET balance = GREATEST(balance - p_amount, 0)
    WHERE id = p_user_id
    RETURNING balance INTO new_balance;
    
    RETURN COALESCE(new_balance, 0);
END;
$$;

CREATE OR REPLACE FUNCTION add_user_balance(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    UPDATE public.users
    SET balance = balance + p_amount
    WHERE id = p_user_id
    RETURNING balance INTO new_balance;
    
    RETURN COALESCE(new_balance, 0);
END;
$$;

-- ============================================================
-- SESSION MANAGEMENT FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.active_sessions WHERE last_heartbeat < NOW() - INTERVAL '15 seconds';
    DELETE FROM public.session_queue WHERE last_heartbeat < NOW() - INTERVAL '30 seconds';
END;
$$;

CREATE OR REPLACE FUNCTION join_queue(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    queue_position INTEGER;
    max_queue INTEGER := 100; -- Increased from 50
    current_queue_size INTEGER;
BEGIN
    PERFORM cleanup_stale_sessions();
    
    SELECT COUNT(*) INTO current_queue_size FROM public.session_queue;
    IF current_queue_size >= max_queue THEN
        RETURN -1;
    END IF;
    
    INSERT INTO public.session_queue (user_id, last_heartbeat, created_at)
    VALUES (p_user_id, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET last_heartbeat = NOW();
    
    SELECT COUNT(*) INTO queue_position
    FROM public.session_queue sq
    WHERE sq.created_at <= (SELECT created_at FROM public.session_queue WHERE user_id = p_user_id);
    
    RETURN queue_position;
END;
$$;

CREATE OR REPLACE FUNCTION get_client_queue_position(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    queue_pos INTEGER;
BEGIN
    -- Aggressive cleanup for accuracy
    PERFORM cleanup_stale_sessions();
    
    -- If active, return 0 immediately
    IF EXISTS (SELECT 1 FROM public.active_sessions WHERE user_id = p_user_id) THEN
        RETURN 0;
    END IF;

    -- Calculate position
    SELECT COUNT(*) INTO queue_pos
    FROM public.session_queue sq
    WHERE sq.created_at <= (SELECT created_at FROM public.session_queue WHERE user_id = p_user_id);
    
    RETURN COALESCE(queue_pos, 0);
END;
$$;

CREATE OR REPLACE FUNCTION claim_active_spot(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    max_sessions INTEGER;
    current_count INTEGER;
BEGIN
    PERFORM cleanup_stale_sessions();
    
    IF EXISTS (SELECT 1 FROM public.active_sessions WHERE user_id = p_user_id) THEN
        UPDATE public.active_sessions SET last_heartbeat = NOW() WHERE user_id = p_user_id;
        RETURN TRUE;
    END IF;
    
    SELECT COALESCE(max_concurrent_sessions, 5) INTO max_sessions FROM public.global_settings WHERE id = 1;
    SELECT COUNT(*) INTO current_count FROM public.active_sessions;
    
    IF current_count >= max_sessions THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO public.active_sessions (user_id, last_heartbeat, created_at)
    VALUES (p_user_id, NOW(), NOW());
    
    DELETE FROM public.session_queue WHERE user_id = p_user_id;
    
    RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
    RETURN TRUE;
END;
$$;

-- ============================================================
-- AUTO USER PROFILE CREATION
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    SELECT NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) INTO is_first_user;
    
    INSERT INTO public.users (id, email, name, role, balance, subscription_status, provider, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE WHEN is_first_user THEN 'ADMIN' ELSE 'USER' END,
        CASE WHEN is_first_user THEN 999 ELSE 0 END,
        'ACTIVE',
        COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ADMIN DELETION PROTECTION
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.role = 'ADMIN' THEN
        RAISE EXCEPTION 'Admin accounts cannot be deleted';
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_admin_delete
    BEFORE DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION prevent_admin_deletion();

-- ============================================================
-- INITIALIZE DEFAULT DATA
-- ============================================================

INSERT INTO public.global_settings (id, maintenance_mode, max_concurrent_sessions, sale_mode)
VALUES (1, false, 5, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- SUCCESS!
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Peutic database setup complete!'; END $$;
