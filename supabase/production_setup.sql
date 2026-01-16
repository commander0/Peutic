
-- -----------------------------------------------------------------------------
-- PEUTIC: PRODUCTION DATABASE SETUP SCRIPT (FINAL VALIDATED)
-- -----------------------------------------------------------------------------

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 0. HELPER FUNCTIONS & CLEANUP
-- -----------------------------------------------------------------------------

-- SECURE ADMIN CHECK (Prevents RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Direct select bypassing RLS (SECURITY DEFINER)
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
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

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "users_select_own_optimized" ON public.users;
DROP POLICY IF EXISTS "users_update_own_optimized" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "users_insert_self_optimized" ON public.users;
DROP POLICY IF EXISTS "Unified Users Select" ON public.users;
DROP POLICY IF EXISTS "Unified Users Update" ON public.users;
DROP POLICY IF EXISTS "Unified Users Insert" ON public.users;

-- POLICIES for USERS
CREATE POLICY "Unified Users Select"
  ON public.users FOR SELECT
  USING (
    (select auth.uid()) = id 
    OR 
    public.is_admin()
  );

CREATE POLICY "Unified Users Update"
  ON public.users FOR UPDATE
  USING (
    (select auth.uid()) = id 
    OR 
    public.is_admin()
  );

-- CRITICAL FIX: Allow users to insert THEMSELVES (needed for signup)
CREATE POLICY "Unified Users Insert"
  ON public.users FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- TRIGGER: Handle New User Creation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- SAFETY: Check if system already has users to set ADMIN role
  SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first_user;

  -- 1. Insert into public.users (Critical Step)
  BEGIN
    INSERT INTO public.users (id, email, name, role, balance, provider)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      CASE WHEN is_first_user THEN 'ADMIN' ELSE 'USER' END,
      CASE WHEN is_first_user THEN 999.00 ELSE 0.00 END,
      COALESCE(new.raw_app_meta_data->>'provider', 'email')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- If this fails, we log it but do NOT crash the Auth signup.
    -- Client-side 'repairProfile' will handle it.
    RAISE WARNING 'Public profile creation failed for %: %', new.id, SQLERRM;
  END;

  -- 2. Auto-Confirm Email (Optional Convenience)
  BEGIN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = new.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Auto-confirm failed for %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. GLOBAL SETTINGS
-- -----------------------------------------------------------------------------

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

DROP POLICY IF EXISTS "Global Settings Read" ON public.global_settings;
DROP POLICY IF EXISTS "Global Settings Update" ON public.global_settings;

CREATE POLICY "Global Settings Read"
  ON public.global_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Global Settings Update"
  ON public.global_settings FOR UPDATE
  USING ( public.is_admin() );

-- -----------------------------------------------------------------------------
-- 3. COMPANIONS
-- -----------------------------------------------------------------------------

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

DROP POLICY IF EXISTS "Unified Companions Read" ON public.companions;
DROP POLICY IF EXISTS "Unified Companions Insert" ON public.companions;
DROP POLICY IF EXISTS "Unified Companions Update" ON public.companions;
DROP POLICY IF EXISTS "Unified Companions Delete" ON public.companions;

CREATE POLICY "Unified Companions Read"
  ON public.companions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Unified Companions Insert"
  ON public.companions FOR INSERT
  WITH CHECK ( public.is_admin() );

CREATE POLICY "Unified Companions Update"
  ON public.companions FOR UPDATE
  USING ( public.is_admin() );

CREATE POLICY "Unified Companions Delete"
  ON public.companions FOR DELETE
  USING ( public.is_admin() );

-- -----------------------------------------------------------------------------
-- 4. TRANSACTIONS
-- -----------------------------------------------------------------------------

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

DROP POLICY IF EXISTS "Unified Transactions See Own" ON public.transactions;
DROP POLICY IF EXISTS "Unified Transactions Insert Own" ON public.transactions;

CREATE POLICY "Unified Transactions See Own"
  ON public.transactions FOR SELECT
  USING ((select auth.uid()) = user_id OR public.is_admin());

CREATE POLICY "Unified Transactions Insert Own"
  ON public.transactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 5. USER CONTENT (Journals, Moods, Art, Feedback)
-- -----------------------------------------------------------------------------

-- JOURNALS
CREATE TABLE IF NOT EXISTS public.journals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  content TEXT
);
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unified Journals Read" ON public.journals;
DROP POLICY IF EXISTS "Unified Journals Insert" ON public.journals;
DROP POLICY IF EXISTS "Unified Journals Update" ON public.journals;
DROP POLICY IF EXISTS "Unified Journals Delete" ON public.journals;

CREATE POLICY "Unified Journals Read" ON public.journals FOR SELECT USING ((select auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "Unified Journals Insert" ON public.journals FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Unified Journals Update" ON public.journals FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Unified Journals Delete" ON public.journals FOR DELETE USING ((select auth.uid()) = user_id);

-- MOODS
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  mood TEXT CHECK (mood IN ('confetti', 'rain'))
);
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unified Moods Read" ON public.moods;
DROP POLICY IF EXISTS "Unified Moods Insert" ON public.moods;
DROP POLICY IF EXISTS "Unified Moods Update" ON public.moods;
DROP POLICY IF EXISTS "Unified Moods Delete" ON public.moods;

CREATE POLICY "Unified Moods Read" ON public.moods FOR SELECT USING ((select auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "Unified Moods Insert" ON public.moods FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Unified Moods Update" ON public.moods FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Unified Moods Delete" ON public.moods FOR DELETE USING ((select auth.uid()) = user_id);

-- USER ART
CREATE TABLE IF NOT EXISTS public.user_art (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  image_url TEXT,
  prompt TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unified Art Read" ON public.user_art;
DROP POLICY IF EXISTS "Unified Art Insert" ON public.user_art;
DROP POLICY IF EXISTS "Unified Art Update" ON public.user_art;
DROP POLICY IF EXISTS "Unified Art Delete" ON public.user_art;

CREATE POLICY "Unified Art Read" ON public.user_art FOR SELECT USING ((select auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "Unified Art Insert" ON public.user_art FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Unified Art Update" ON public.user_art FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Unified Art Delete" ON public.user_art FOR DELETE USING ((select auth.uid()) = user_id);

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
DROP POLICY IF EXISTS "Unified Feedback Insert" ON public.feedback;
DROP POLICY IF EXISTS "Unified Feedback Admin View" ON public.feedback;

CREATE POLICY "Unified Feedback Insert" ON public.feedback FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Unified Feedback Admin View" ON public.feedback FOR SELECT 
  USING ( public.is_admin() );

-- -----------------------------------------------------------------------------
-- 6. QUEUE SYSTEM
-- -----------------------------------------------------------------------------

-- ACTIVE SESSIONS
CREATE TABLE IF NOT EXISTS public.active_sessions (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Unified Active Sessions Select" ON public.active_sessions;
DROP POLICY IF EXISTS "Unified Active Sessions Insert" ON public.active_sessions;
DROP POLICY IF EXISTS "Unified Active Sessions Update" ON public.active_sessions;
DROP POLICY IF EXISTS "Unified Active Sessions Delete" ON public.active_sessions;

CREATE POLICY "Unified Active Sessions Select" ON public.active_sessions FOR SELECT 
  USING (
    (select auth.uid()) = user_id 
    OR 
    public.is_admin()
  );

CREATE POLICY "Unified Active Sessions Insert" ON public.active_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Unified Active Sessions Update" ON public.active_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Unified Active Sessions Delete" ON public.active_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- SESSION QUEUE
CREATE TABLE IF NOT EXISTS public.session_queue (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.session_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Unified Queue Select" ON public.session_queue;
DROP POLICY IF EXISTS "Unified Queue Insert" ON public.session_queue;
DROP POLICY IF EXISTS "Unified Queue Update" ON public.session_queue;
DROP POLICY IF EXISTS "Unified Queue Delete" ON public.session_queue;

CREATE POLICY "Unified Queue Select" ON public.session_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Unified Queue Insert" ON public.session_queue FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Unified Queue Update" ON public.session_queue FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Unified Queue Delete" ON public.session_queue FOR DELETE USING ((select auth.uid()) = user_id);

-- CLEANUP FUNCTION (Enhanced)
-- --- ATOMIC BALANCE MANAGEMENT ---
CREATE OR REPLACE FUNCTION public.deduct_user_balance(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.users 
  SET balance = GREATEST(0, balance - p_amount)
  WHERE id = p_user_id 
  RETURNING balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.add_user_balance(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.users 
  SET balance = balance + p_amount 
  WHERE id = p_user_id 
  RETURNING balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --- REFINED CLEANUP ---
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  -- Remove stale active sessions (> 60s no ping for better UX/testing)
  DELETE FROM public.active_sessions WHERE last_ping < NOW() - INTERVAL '60 seconds';
  
  -- Remove stale queue entries (> 60s no ping)
  DELETE FROM public.session_queue WHERE last_ping < NOW() - INTERVAL '60 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ATOMIC QUEUE FUNCTIONS

-- 1. Join Queue
CREATE OR REPLACE FUNCTION public.join_queue(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_pos INTEGER;
  v_created_at TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN RETURN -1; END IF;

  INSERT INTO public.session_queue (user_id, last_ping)
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET last_ping = NOW()
  RETURNING created_at INTO v_created_at;

  SELECT COUNT(*) + 1 INTO v_pos FROM public.session_queue WHERE created_at < v_created_at;
  RETURN v_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Claim Active Spot
CREATE OR REPLACE FUNCTION public.claim_active_spot(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_cnt INTEGER;
  v_max INTEGER;
  v_exists BOOLEAN;
BEGIN
  -- Prevent Race Conditions
  PERFORM pg_advisory_xact_lock(hashtext('active_sessions_lock'));

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

-- -----------------------------------------------------------------------------
-- 7. SYSTEM LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT,
  event TEXT,
  details TEXT
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unified Logs View" ON public.system_logs;
DROP POLICY IF EXISTS "Unified Logs Insert" ON public.system_logs;

CREATE POLICY "Unified Logs View" ON public.system_logs FOR SELECT 
  USING ( public.is_admin() );

CREATE POLICY "Unified Logs Insert" ON public.system_logs FOR INSERT 
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 9. FINAL CHECK
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload config';
