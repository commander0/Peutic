
-- -----------------------------------------------------------------------------
-- PEUTIC: FULL DATABASE RESTORATION SCRIPT (STRICT RLS)
-- -----------------------------------------------------------------------------

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 0. HELPER FUNCTIONS & CLEANUP
-- -----------------------------------------------------------------------------

-- Safe Admin Check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
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
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  subscription_status TEXT DEFAULT 'ACTIVE',
  provider TEXT DEFAULT 'email',
  avatar_url TEXT,
  avatar_locked BOOLEAN DEFAULT FALSE,
  email_preferences JSONB DEFAULT '{"marketing": true, "updates": true}',
  theme_preference TEXT DEFAULT 'light',
  language_preference TEXT DEFAULT 'en',
  game_scores JSONB DEFAULT '{"match": 0, "cloud": 0}',
  streak INTEGER DEFAULT 0,
  unlocked_rooms TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- POLICIES for USERS
DROP POLICY IF EXISTS "Unified Users Select" ON public.users;
DROP POLICY IF EXISTS "Unified Users Update" ON public.users;
DROP POLICY IF EXISTS "Unified Users Insert" ON public.users;
-- cleanup
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Users can view own users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own users" ON public.users;
DROP POLICY IF EXISTS "Users can update own users" ON public.users;

CREATE POLICY "Unified Users Select" ON public.users FOR SELECT
  USING ((select auth.uid()) = id OR public.is_admin());

CREATE POLICY "Unified Users Update" ON public.users FOR UPDATE
  USING ((select auth.uid()) = id OR public.is_admin());

CREATE POLICY "Unified Users Insert" ON public.users FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- TRIGGER: Handle New User Creation
-- TRIGGER: Handle New User Creation (ROBUST VERSION)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  final_role TEXT;
  final_name TEXT;
BEGIN
  -- 1. Determine Role (First user is ADMIN)
  SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first_user;
  final_role := CASE WHEN is_first_user THEN 'ADMIN' ELSE 'USER' END;

  -- 2. Determine Name (Safe Fallback)
  final_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Buddy');

  -- 3. Log for Debugging
  RAISE LOG 'Handling new user: % (Role: %)', new.email, final_role;

  -- 4. Insert or Update (Robust Upsert)
  INSERT INTO public.users (id, email, name, role, balance, provider)
  VALUES (
    new.id,
    new.email,
    final_name,
    final_role,
    CASE WHEN is_first_user THEN 999.00 ELSE 0.00 END,
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name), -- Keep existing name if set
    role = CASE WHEN public.users.role = 'ADMIN' THEN 'ADMIN' ELSE EXCLUDED.role END; -- Don't demote admins

  -- 5. Initialize Game State (Harmony)
  -- Garden
  INSERT INTO public.garden_log (user_id, level, current_plant_type)
  VALUES (new.id, 1, 'Lotus')
  ON CONFLICT (user_id) DO NOTHING;

  -- Lumina (Pocket Pet)
  INSERT INTO public.pocket_pets (id, user_id, name, species, level, experience)
  VALUES (
    uuid_generate_v4(),
    new.id,
    'Lumina',
    'Neo-Shiba',
    1,
    0
  )
  ON CONFLICT DO NOTHING; -- Assuming user_id might be unique or relying on app logic

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN new; -- Allow auth to proceed even if profile creation fails (handled by UserService repair)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
  dashboard_broadcast_message TEXT DEFAULT '',
  max_concurrent_sessions INTEGER DEFAULT 15,
  multilingual_mode BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.global_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global Settings Read" ON public.global_settings;
DROP POLICY IF EXISTS "Global Settings Update" ON public.global_settings;

CREATE POLICY "Global Settings Read" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Global Settings Update" ON public.global_settings FOR UPDATE USING (public.is_admin());

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

DROP POLICY IF EXISTS "Public Companions Read" ON public.companions;
DROP POLICY IF EXISTS "Admin Companions Manage" ON public.companions;
DROP POLICY IF EXISTS "Admin Companions Update" ON public.companions;
DROP POLICY IF EXISTS "Admin Companions Delete" ON public.companions;

CREATE POLICY "Public Companions Read" ON public.companions FOR SELECT USING (true);
-- STRICT: Admin only needs Write access
CREATE POLICY "Admin Companions Manage" ON public.companions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin Companions Update" ON public.companions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin Companions Delete" ON public.companions FOR DELETE USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. TRANSACTIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  amount INTEGER,
  cost NUMERIC,
  description TEXT,
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User/Admin Transactions" ON public.transactions;
DROP POLICY IF EXISTS "User Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin Transactions" ON public.transactions;

-- Consolidated Policy (SELECT Only for User who owns it OR Admin)
CREATE POLICY "User/Admin Transactions" ON public.transactions FOR ALL 
  USING ((select auth.uid()) = user_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. USER CONTENT TABLES
-- -----------------------------------------------------------------------------

-- Pocket Pets (Lumina)
CREATE TABLE IF NOT EXISTS public.pocket_pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  name TEXT,
  species TEXT DEFAULT 'Neo-Shiba',
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  health INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 100,
  happiness INTEGER DEFAULT 100,
  cleanliness INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  is_sleeping BOOLEAN DEFAULT FALSE,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pocket_pets ENABLE ROW LEVEL SECURITY;

-- Clean up ALL potential legacy/duplicate policies to avoid "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "User Pocket Pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "pocket_pets_owner_optimized" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users can manage own pets" ON public.pocket_pets;

-- Single Consolidated Policy
CREATE POLICY "User Pocket Pets" ON public.pocket_pets FOR ALL USING ((select auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_pocket_pets_user_id ON public.pocket_pets(user_id);

-- User Art
CREATE TABLE IF NOT EXISTS public.user_art (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  image_url TEXT,
  prompt TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_art ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Art" ON public.user_art;
DROP POLICY IF EXISTS "Users can insert own user_art" ON public.user_art;
DROP POLICY IF EXISTS "Users can view own user_art" ON public.user_art;
CREATE POLICY "User Art" ON public.user_art FOR ALL USING ((select auth.uid()) = user_id);

-- Voice Journals
CREATE TABLE IF NOT EXISTS public.voice_journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  audio_url TEXT,
  duration_seconds INTEGER,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.voice_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Voice Journals" ON public.voice_journals;
DROP POLICY IF EXISTS "Users can insert own voice_journals" ON public.voice_journals;
CREATE POLICY "User Voice Journals" ON public.voice_journals FOR ALL USING ((select auth.uid()) = user_id);

-- Breath Logs
CREATE TABLE IF NOT EXISTS public.breath_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.breath_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Breath Logs" ON public.breath_logs;
CREATE POLICY "User Breath Logs" ON public.breath_logs FOR ALL USING ((select auth.uid()) = user_id);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  user_name TEXT,
  companion_name TEXT,
  rating INTEGER,
  tags TEXT[],
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Feedback" ON public.feedback;
-- Remove overlap
DROP POLICY IF EXISTS "Users can delete own feedback" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert_optimized" ON public.feedback;
DROP POLICY IF EXISTS "feedback_select_optimized" ON public.feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;

CREATE POLICY "User Feedback" ON public.feedback FOR ALL USING ((select auth.uid()) = user_id);

-- Garden Log
CREATE TABLE IF NOT EXISTS public.garden_log (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  level INTEGER DEFAULT 1,
  current_plant_type TEXT DEFAULT 'Lotus',
  water_level INTEGER DEFAULT 0,
  last_watered_at TIMESTAMPTZ DEFAULT NOW(),
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0
);
ALTER TABLE public.garden_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Garden" ON public.garden_log;
DROP POLICY IF EXISTS "User Garden Logs" ON public.garden_log;

CREATE POLICY "User Garden" ON public.garden_log FOR ALL USING ((select auth.uid()) = user_id);

-- Session Memories
CREATE TABLE IF NOT EXISTS public.session_memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  companion_name TEXT,
  summary TEXT,
  key_topics TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.session_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Session Memories" ON public.session_memories;
DROP POLICY IF EXISTS "User Memories" ON public.session_memories;

CREATE POLICY "User Session Memories" ON public.session_memories FOR ALL USING ((select auth.uid()) = user_id);

-- Time Capsules
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  content TEXT,
  unlock_date TIMESTAMPTZ,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Time Capsules" ON public.time_capsules;
DROP POLICY IF EXISTS "User Capsules" ON public.time_capsules;

CREATE POLICY "User Time Capsules" ON public.time_capsules FOR ALL USING ((select auth.uid()) = user_id);

-- Gift Cards
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  amount INTEGER,
  created_by UUID REFERENCES public.users(id),
  redeemed_by UUID REFERENCES public.users(id),
  is_redeemed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gift Cards Manage" ON public.gift_cards;
DROP POLICY IF EXISTS "Gift Cards Admin" ON public.gift_cards;

CREATE POLICY "Gift Cards Manage" ON public.gift_cards FOR ALL USING (public.is_admin() OR (select auth.uid()) = created_by);

-- -----------------------------------------------------------------------------
-- 6. PUBLIC WISDOM
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.public_wisdom (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  content TEXT,
  category TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.public_wisdom ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wisdom Select" ON public.public_wisdom;
DROP POLICY IF EXISTS "Wisdom Insert" ON public.public_wisdom;
DROP POLICY IF EXISTS "Wisdom Moderate" ON public.public_wisdom;
DROP POLICY IF EXISTS "Wisdom Delete" ON public.public_wisdom;
-- cleanup
DROP POLICY IF EXISTS "Admin Manage Wisdom" ON public.public_wisdom;
DROP POLICY IF EXISTS "User Submit Wisdom" ON public.public_wisdom;
DROP POLICY IF EXISTS "Public Read Wisdom" ON public.public_wisdom;

-- Consolidated Select: Public Approved OR Admin All
CREATE POLICY "Wisdom Select" ON public.public_wisdom FOR SELECT 
  USING (is_approved = true OR public.is_admin());

-- Consolidated Insert: User Own OR Admin
CREATE POLICY "Wisdom Insert" ON public.public_wisdom FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());

-- Admin Update/Delete
CREATE POLICY "Wisdom Moderate" ON public.public_wisdom FOR UPDATE 
  USING (public.is_admin());
CREATE POLICY "Wisdom Delete" ON public.public_wisdom FOR DELETE 
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. ACHIEVEMENTS & USER ACHIEVEMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  xp_reward INTEGER DEFAULT 50
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read Achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admin Manage Achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admin Update Achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admin Delete Achievements" ON public.achievements;

CREATE POLICY "Read Achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admin Manage Achievements" ON public.achievements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin Update Achievements" ON public.achievements FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin Delete Achievements" ON public.achievements FOR DELETE USING (public.is_admin());


-- User Achievements Join Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  achievement_id UUID REFERENCES public.achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User Unlock Achievements" ON public.user_achievements;
CREATE POLICY "User Unlock Achievements" ON public.user_achievements FOR ALL
  USING ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 8. ACTIVE SESSIONS & QUEUE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.active_sessions (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Active Sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "User Manage Session" ON public.active_sessions;
DROP POLICY IF EXISTS "User Update Session" ON public.active_sessions;
DROP POLICY IF EXISTS "User Delete Session" ON public.active_sessions;

CREATE POLICY "Public Active Sessions" ON public.active_sessions FOR SELECT USING (true);
-- Write only for User/Admin
CREATE POLICY "User Manage Session" ON public.active_sessions FOR INSERT WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "User Update Session" ON public.active_sessions FOR UPDATE USING ((select auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "User Delete Session" ON public.active_sessions FOR DELETE USING ((select auth.uid()) = user_id OR public.is_admin());


CREATE TABLE IF NOT EXISTS public.session_queue (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.session_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read Queue" ON public.session_queue;
DROP POLICY IF EXISTS "User Join Queue" ON public.session_queue;
DROP POLICY IF EXISTS "User Leave Queue" ON public.session_queue;
DROP POLICY IF EXISTS "User Update Queue" ON public.session_queue;

CREATE POLICY "Read Queue" ON public.session_queue FOR SELECT USING (true);
CREATE POLICY "User Join Queue" ON public.session_queue FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "User Leave Queue" ON public.session_queue FOR DELETE USING ((select auth.uid()) = user_id);
CREATE POLICY "User Update Queue" ON public.session_queue FOR UPDATE USING ((select auth.uid()) = user_id);


-- -----------------------------------------------------------------------------
-- 9. SYSTEM & SAFETY (STRICT, NO OVERLAP)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT,
  event TEXT,
  details TEXT
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Logs" ON public.system_logs;
DROP POLICY IF EXISTS "System Insert Logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin Update Logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin Delete Logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin Select Logs" ON public.system_logs;

-- STRICT POLICIES to avoid overlap warnings
-- 1. INSERT: Allow ANY authenticated layer (App or Admin) to insert logs. Single policy.
CREATE POLICY "System Insert Logs" ON public.system_logs FOR INSERT 
  WITH CHECK ((select auth.role()) = 'authenticated');

-- 2. SELECT/UPDATE/DELETE: Restricted to Admins only.
CREATE POLICY "Admin Select Logs" ON public.system_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin Update Logs" ON public.system_logs FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin Delete Logs" ON public.system_logs FOR DELETE USING (public.is_admin());


CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  content TEXT,
  content_type TEXT,
  flagged_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Safety Alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "System Create Alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "Admin Update Alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "Admin Delete Alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "Admin Select Alerts" ON public.safety_alerts;

-- STRICT POLICIES
-- 1. INSERT: Allow ANY authenticated layer. Single policy.
CREATE POLICY "System Create Alerts" ON public.safety_alerts FOR INSERT 
  WITH CHECK ((select auth.role()) = 'authenticated');

-- 2. READ/WRITE: Admins only.
CREATE POLICY "Admin Select Alerts" ON public.safety_alerts FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin Update Alerts" ON public.safety_alerts FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin Delete Alerts" ON public.safety_alerts FOR DELETE USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. INDEXES (PERFORMANCE OPTIMIZATION)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_garden_log_user_id ON public.garden_log(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_art_user_id ON public.user_art(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_journals_user_id ON public.voice_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_breath_logs_user_id ON public.breath_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_session_memories_user_id ON public.session_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON public.time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON public.gift_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemed_by ON public.gift_cards(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_public_wisdom_user_id ON public.public_wisdom(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- -----------------------------------------------------------------------------
-- 11. FUNCTIONS & LOGIC
-- -----------------------------------------------------------------------------

-- Balance Deduction (Atomic)
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

-- Balance Add (Atomic)
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

-- Cleanup Stale Sessions
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_sessions WHERE last_ping < NOW() - INTERVAL '60 seconds';
  DELETE FROM public.session_queue WHERE last_ping < NOW() - INTERVAL '60 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Join Queue
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

-- Claim Active Spot
CREATE OR REPLACE FUNCTION public.claim_active_spot(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_cnt INTEGER;
  v_max INTEGER;
  v_exists BOOLEAN;
BEGIN
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
-- 12. SEED DATA
-- -----------------------------------------------------------------------------

-- Claim System Access (RPC for Admin Login/Claim)
CREATE OR REPLACE FUNCTION public.claim_system_access(p_master_key TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_expected_key TEXT := 'PEUTIC_ADMIN_ACCESS_2026'; -- Default Key
BEGIN
  -- Strict Key Check
  IF p_master_key != v_expected_key THEN
    RETURN FALSE;
  END IF;

  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify user exists in public.users
  INSERT INTO public.users (id, email, role)
  VALUES (
    v_uid, 
    (select email from auth.users where id = v_uid),
    'ADMIN'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'ADMIN';

  RETURN TRUE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 12. SEED DATA
-- -----------------------------------------------------------------------------

-- Seed Achievements
INSERT INTO public.achievements (code, title, description, icon_name, xp_reward) VALUES
('FIRST_STEPS', 'First Steps', 'Complete your first session.', 'Footprints', 50),
('ON_FIRE', 'On Fire', 'Maintain a 3-day streak.', 'Flame', 100),
('ZEN_MASTER', 'Zen Master', 'Unlock the Zen Dojo.', 'Sprout', 200),
('STARRY_EYED', 'Starry Eyed', 'Unlock the Observatory.', 'Star', 200),
('VOICE_WITHIN', 'Voice Within', 'Record your first voice journal.', 'Mic', 75)
ON CONFLICT (code) DO NOTHING;

-- Notifying PostgREST to reload schema
NOTIFY pgrst, 'reload config';
