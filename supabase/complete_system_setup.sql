-- =============================================================================
-- PEUTIC: COMPLETE SYSTEM SETUP (CONSOLIDATED)
-- =============================================================================
-- Run this ONCE in your Supabase SQL Editor to set up everything.
-- It is idempotent (safe to run multiple times).
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. HELPER FUNCTIONS
-- =============================================================================

-- Secure admin check (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = (select auth.uid());
  RETURN v_role = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  birthday TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER', 'GUEST')),
  balance NUMERIC DEFAULT 0,
  subscription_status TEXT DEFAULT 'ACTIVE',
  provider TEXT DEFAULT 'email',
  avatar_url TEXT,
  email_preferences JSONB DEFAULT '{"marketing": true, "updates": true}',
  theme_preference TEXT DEFAULT 'light',
  language_preference TEXT DEFAULT 'en',
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- GLOBAL SETTINGS
CREATE TABLE IF NOT EXISTS public.global_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  price_per_minute NUMERIC DEFAULT 1.99,
  sale_mode BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_signups BOOLEAN DEFAULT TRUE,
  site_name TEXT DEFAULT 'Peutic',
  broadcast_message TEXT DEFAULT '',
  max_concurrent_sessions INTEGER DEFAULT 15,
  multilingual_mode BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.global_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- COMPANIONS
CREATE TABLE IF NOT EXISTS public.companions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT,
  specialty TEXT,
  status TEXT DEFAULT 'AVAILABLE',
  rating NUMERIC DEFAULT 5.0,
  image_url TEXT,
  bio TEXT,
  replica_id TEXT,
  license_number TEXT,
  degree TEXT,
  state_of_practice TEXT,
  years_experience INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  amount NUMERIC NOT NULL,
  cost NUMERIC DEFAULT 0,
  description TEXT,
  status TEXT CHECK (status IN ('COMPLETED', 'PENDING', 'REFUNDED'))
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- JOURNALS (Global Sync)
CREATE TABLE IF NOT EXISTS public.journals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- MOODS
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  mood TEXT CHECK (mood IN ('confetti', 'rain')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

-- USER ART (Global Sync)
CREATE TABLE IF NOT EXISTS public.user_art (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  image_url TEXT,
  prompt TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;

-- FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  companion_name TEXT,
  rating INTEGER,
  tags TEXT[],
  date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ACTIVE SESSIONS (Concurrency Logic)
CREATE TABLE IF NOT EXISTS public.active_sessions (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- SESSION QUEUE (Waiting Room)
CREATE TABLE IF NOT EXISTS public.session_queue (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.session_queue ENABLE ROW LEVEL SECURITY;

-- SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT,
  event TEXT,
  details TEXT
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. ADD MISSING created_at COLUMNS (Safe Migration)
-- =============================================================================

DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='active_sessions' AND column_name='created_at') THEN
    ALTER TABLE public.active_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='session_queue' AND column_name='created_at') THEN
    ALTER TABLE public.session_queue ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='journals' AND column_name='created_at') THEN
    ALTER TABLE public.journals ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='moods' AND column_name='created_at') THEN
    ALTER TABLE public.moods ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- =============================================================================
-- 4. DROP OLD POLICIES (Prevents Duplicate Errors)
-- =============================================================================

DO $$ 
DECLARE 
  pol RECORD;
BEGIN 
  FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP; 
END $$;

-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- USERS: Own data or Admin
CREATE POLICY "Users Manage Own or Admin" ON public.users 
  FOR ALL 
  USING (id = (select auth.uid()) OR public.is_admin())
  WITH CHECK (id = (select auth.uid()) OR public.is_admin());

-- GLOBAL SETTINGS: Public read, Admin write
CREATE POLICY "Settings Public View" ON public.global_settings 
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Settings Admin Update" ON public.global_settings 
  FOR UPDATE USING (public.is_admin());

-- COMPANIONS: Public read, Admin write
CREATE POLICY "Companions Public View" ON public.companions 
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Companions Admin Insert" ON public.companions 
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Companions Admin Update" ON public.companions 
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Companions Admin Delete" ON public.companions 
  FOR DELETE USING (public.is_admin());

-- TRANSACTIONS: Own data or Admin
CREATE POLICY "Transactions Own Select" ON public.transactions 
  FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY "Transactions Own Insert" ON public.transactions 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- JOURNALS: Full CRUD for own data
CREATE POLICY "Journals Own Select" ON public.journals 
  FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY "Journals Own Insert" ON public.journals 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Journals Own Update" ON public.journals 
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Journals Own Delete" ON public.journals 
  FOR DELETE USING (user_id = (select auth.uid()));

-- MOODS: Full CRUD for own data
CREATE POLICY "Moods Own Select" ON public.moods 
  FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY "Moods Own Insert" ON public.moods 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Moods Own Update" ON public.moods 
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Moods Own Delete" ON public.moods 
  FOR DELETE USING (user_id = (select auth.uid()));

-- USER ART: Full CRUD for own data
CREATE POLICY "Art Own Select" ON public.user_art 
  FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY "Art Own Insert" ON public.user_art 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Art Own Update" ON public.user_art 
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Art Own Delete" ON public.user_art 
  FOR DELETE USING (user_id = (select auth.uid()));

-- FEEDBACK: Users insert, Admin reads all
CREATE POLICY "Feedback Own Insert" ON public.feedback 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Feedback Admin Select" ON public.feedback 
  FOR SELECT USING (public.is_admin());

-- ACTIVE SESSIONS: Own data management
CREATE POLICY "Sessions Own Select" ON public.active_sessions 
  FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY "Sessions Own Insert" ON public.active_sessions 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Sessions Own Update" ON public.active_sessions 
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Sessions Own Delete" ON public.active_sessions 
  FOR DELETE USING (user_id = (select auth.uid()));

-- SESSION QUEUE: Public read (for position calc), own management
CREATE POLICY "Queue Public View" ON public.session_queue 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Queue Own Insert" ON public.session_queue 
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Queue Own Update" ON public.session_queue 
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Queue Own Delete" ON public.session_queue 
  FOR DELETE USING (user_id = (select auth.uid()));

-- SYSTEM LOGS: Admin reads, authenticated inserts
CREATE POLICY "Logs Admin View" ON public.system_logs 
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Logs Authenticated Insert" ON public.system_logs 
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =============================================================================
-- 6. RPC FUNCTIONS (Atomic Operations)
-- =============================================================================

-- Deduct balance (atomic)
CREATE OR REPLACE FUNCTION public.deduct_user_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE v_new NUMERIC;
BEGIN
  UPDATE public.users 
  SET balance = GREATEST(0, balance - p_amount) 
  WHERE id = p_user_id 
  RETURNING balance INTO v_new;
  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add balance (atomic)
CREATE OR REPLACE FUNCTION public.add_user_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE v_new NUMERIC;
BEGIN
  UPDATE public.users 
  SET balance = balance + p_amount 
  WHERE id = p_user_id 
  RETURNING balance INTO v_new;
  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup stale sessions
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_sessions WHERE last_ping < NOW() - INTERVAL '30 seconds';
  DELETE FROM public.session_queue WHERE last_ping < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Join waiting room queue
CREATE OR REPLACE FUNCTION public.join_queue(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE 
  v_pos INTEGER; 
  v_created TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN RETURN -1; END IF;
  
  INSERT INTO public.session_queue (user_id, last_ping) 
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET last_ping = NOW() 
  RETURNING created_at INTO v_created;
  
  SELECT COUNT(*) + 1 INTO v_pos 
  FROM public.session_queue 
  WHERE created_at < v_created;
  
  RETURN v_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Claim active session spot
CREATE OR REPLACE FUNCTION public.claim_active_spot(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE 
  v_cnt INTEGER; 
  v_max INTEGER; 
  v_exists BOOLEAN;
BEGIN
  PERFORM public.cleanup_stale_sessions();
  
  SELECT EXISTS (SELECT 1 FROM public.active_sessions WHERE user_id = p_user_id) INTO v_exists;
  IF v_exists THEN 
    UPDATE public.active_sessions SET last_ping = NOW() WHERE user_id = p_user_id; 
    RETURN TRUE; 
  END IF;
  
  SELECT count(*) INTO v_cnt FROM public.active_sessions;
  SELECT max_concurrent_sessions INTO v_max FROM public.global_settings WHERE id = 1;
  IF v_max IS NULL THEN v_max := 15; END IF;
  
  IF v_cnt >= v_max THEN RETURN FALSE; END IF;
  
  BEGIN
    INSERT INTO public.active_sessions (user_id, created_at, last_ping) 
    VALUES (p_user_id, NOW(), NOW());
    DELETE FROM public.session_queue WHERE user_id = p_user_id;
    RETURN TRUE;
  EXCEPTION WHEN unique_violation THEN
    RETURN TRUE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE is_first BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first;
  
  INSERT INTO public.users (id, email, name, role, balance, provider)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    CASE WHEN is_first THEN 'ADMIN' ELSE 'USER' END, 
    CASE WHEN is_first THEN 999.00 ELSE 0.00 END,
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  ) ON CONFLICT (id) DO NOTHING;
  
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Prevent admin deletion
CREATE OR REPLACE FUNCTION public.prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'ADMIN' THEN
    RAISE EXCEPTION 'Admin accounts cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_prevent_admin_deletion ON public.users;
CREATE TRIGGER tr_prevent_admin_deletion 
  BEFORE DELETE ON public.users 
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_admin_deletion();

-- =============================================================================
-- 8. SEED DATA
-- =============================================================================

INSERT INTO public.companions (id, name, gender, specialty, status, bio) VALUES
  ('c1', 'Ruby', 'Female', 'Anxiety & Panic', 'AVAILABLE', 'Specializing in grounding techniques.'),
  ('c2', 'Carter', 'Male', 'Life Coaching', 'AVAILABLE', 'Success roadmap planning.')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. RELOAD CONFIG
-- =============================================================================

NOTIFY pgrst, 'reload config';

-- =============================================================================
-- SETUP COMPLETE!
-- =============================================================================
-- This script has created:
-- ✅ All required tables with created_at columns
-- ✅ Row Level Security policies for data isolation
-- ✅ Atomic balance management functions
-- ✅ Waiting room & concurrency control functions
-- ✅ Auto user profile creation trigger
-- ✅ Admin protection trigger
-- =============================================================================
