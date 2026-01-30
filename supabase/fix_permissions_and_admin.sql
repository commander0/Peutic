-- ==========================================
-- 1. CLEANUP OLD POLICIES (Fixing "Multiple Permissive Policies")
-- ==========================================

-- Drop ALL existing policies to ensure a clean slate and avoid duplicates
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins Full Access" ON public.users;
DROP POLICY IF EXISTS "Users View Self" ON public.users;
DROP POLICY IF EXISTS "Users Update Self" ON public.users;
DROP POLICY IF EXISTS "Users view own" ON public.users;
DROP POLICY IF EXISTS "Users update own" ON public.users;
DROP POLICY IF EXISTS "Unified Users Select" ON public.users;
DROP POLICY IF EXISTS "Unified Users Update" ON public.users;
DROP POLICY IF EXISTS "Unified Users Insert" ON public.users;
DROP POLICY IF EXISTS "Unified Users Delete" ON public.users;
DROP POLICY IF EXISTS "Admins Delete Users" ON public.users;
DROP POLICY IF EXISTS "Admins delete users" ON public.users; -- SPECIFIC FIX (lowercase)
DROP POLICY IF EXISTS "Users can delete own users" ON public.users; -- SPECIFIC FIX
DROP POLICY IF EXISTS "Admins view all" ON public.users; -- SPECIFIC FIX
DROP POLICY IF EXISTS "Admins update all" ON public.users; -- SPECIFIC FIX

DROP POLICY IF EXISTS "Users view own garden" ON public.garden_log;
DROP POLICY IF EXISTS "Users update own garden" ON public.garden_log;
DROP POLICY IF EXISTS "Users modify own garden" ON public.garden_log;
DROP POLICY IF EXISTS "Admins manage gardens" ON public.garden_log;
DROP POLICY IF EXISTS "User Garden" ON public.garden_log;
DROP POLICY IF EXISTS "Users Manage Own Garden" ON public.garden_log;
DROP POLICY IF EXISTS "Admins Manage All Gardens" ON public.garden_log;
DROP POLICY IF EXISTS "Unified Garden Access" ON public.garden_log;

DROP POLICY IF EXISTS "Users view own pet" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users create own pet" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users update own pet" ON public.pocket_pets;
DROP POLICY IF EXISTS "Admins manage pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "User Pocket Pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users Manage Own Pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users manage own pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "Admins Manage All Pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "Unified Pet Access" ON public.pocket_pets;

DROP POLICY IF EXISTS "Users view own tx" ON public.transactions;
DROP POLICY IF EXISTS "Admins view all tx" ON public.transactions;
DROP POLICY IF EXISTS "User/Admin Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users View Own Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins View All Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Unified Transaction Access" ON public.transactions;

DROP POLICY IF EXISTS "Admins view logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins create logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin Select Logs" ON public.system_logs;
DROP POLICY IF EXISTS "System Insert Logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins Manage Logs" ON public.system_logs;
DROP POLICY IF EXISTS "Unified System Logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin Delete Logs" ON public.system_logs; -- SPECIFIC FIX
DROP POLICY IF EXISTS "Admin Update Logs" ON public.system_logs; -- SPECIFIC FIX

-- ==========================================
-- 1.1 CLEANUP UNUSED INDEXES
-- ==========================================
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_breath_logs_user_id;
DROP INDEX IF EXISTS public.idx_feedback_user_id;
DROP INDEX IF EXISTS public.idx_session_memories_user_id;
DROP INDEX IF EXISTS public.idx_time_capsules_user_id;
DROP INDEX IF EXISTS public.idx_gift_cards_created_by;
DROP INDEX IF EXISTS public.idx_gift_cards_redeemed_by;
DROP INDEX IF EXISTS public.idx_public_wisdom_user_id;
DROP INDEX IF EXISTS public.idx_safety_alerts_user_id;
DROP INDEX IF EXISTS public.idx_user_achievements_achievement_id;

-- ==========================================
-- 1.2 ADD MISSING INDEXES (Fixing "Unindexed foreign keys")
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_breath_logs_user_id ON public.breath_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON public.gift_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemed_by ON public.gift_cards(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_public_wisdom_user_id ON public.public_wisdom(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_session_memories_user_id ON public.session_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON public.time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);


-- ==========================================
-- 2. HELPER FUNCTIONS (Fixing "Function Search Path Mutable")
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes Security Warning
AS $$
BEGIN
  -- Check if the current user has the ADMIN role
  RETURN EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = (select auth.uid()) 
      AND role = 'ADMIN'
  );
END;
$$;

-- ==========================================
-- 3. PUBLIC.USERS & TRIGGER
-- ==========================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT DEFAULT 'Traveler',
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  balance INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes Security Warning
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, balance)
  VALUES (
    new.id,
    new.email,
    'USER',
    COALESCE(new.raw_user_meta_data->>'full_name', 'Traveler'),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Re-create the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. ADMIN CLAIM RPC
-- ==========================================

CREATE OR REPLACE FUNCTION public.claim_system_access(p_user_id UUID, p_master_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_master_key != 'PEUTIC_ADMIN_ACCESS_2026' THEN
    RETURN FALSE;
  END IF;

  -- Upsert the user as ADMIN. This fixes "Account created but no record" if trigger failed.
  -- FIX: Provide 'name' explicitly to avoid NOT NULL constraint violation if default is missing.
  INSERT INTO public.users (id, email, role, name)
  VALUES (
    p_user_id, 
    (SELECT email FROM auth.users WHERE id = p_user_id), 
    'ADMIN',
    'Root Admin'
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = 'ADMIN',
    name = COALESCE(public.users.name, 'Root Admin'); -- Keep existing name if present

  RETURN TRUE;
END;
$$;

-- ==========================================
-- 4.1 SCHEMA FIXES (Ensure Defaults)
-- ==========================================
-- Ensure 'name' has a default preventing future errors
ALTER TABLE public.users ALTER COLUMN name SET DEFAULT 'Traveler';
-- Optionally drop NOT NULL if it's too strict, but Default is better
-- ALTER TABLE public.users ALTER COLUMN name DROP NOT NULL;

-- ==========================================
-- 5. OPTIMIZED RLS POLICIES (Consolidated)
-- ==========================================

-- USERS Table
-- Allow users to view themselves OR admins to view everyone
CREATE POLICY "Unified Users Select" ON public.users 
FOR SELECT USING (
    (select auth.uid()) = id 
    OR 
    (select public.is_admin())
);

-- Allow users to update themselves OR admins to update everyone
CREATE POLICY "Unified Users Update" ON public.users 
FOR UPDATE USING (
    (select auth.uid()) = id 
    OR 
    (select public.is_admin())
);

-- Allow users to insert their own profile (Critical for UserService self-repair)
CREATE POLICY "Unified Users Insert" ON public.users 
FOR INSERT WITH CHECK (
    (select auth.uid()) = id
);

-- Admins can delete users (Users cannot delete themselves via API for safety, handled by Admin)
CREATE POLICY "Admins Delete Users" ON public.users 
FOR DELETE USING (
    (select public.is_admin())
);

-- GARDEN LOG
CREATE TABLE IF NOT EXISTS public.garden_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    water_level INTEGER DEFAULT 100,
    plant_type TEXT DEFAULT 'Sakura',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.garden_log ENABLE ROW LEVEL SECURITY;

-- Combined policy: Users manage own, Admins manage all
CREATE POLICY "Unified Garden Access" ON public.garden_log 
FOR ALL USING (
    (select auth.uid()) = user_id 
    OR 
    (select public.is_admin())
);

-- POCKET PETS
CREATE TABLE IF NOT EXISTS public.pocket_pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT,
    species TEXT,
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

-- Combined policy: Users manage own, Admins manage all
CREATE POLICY "Unified Pet Access" ON public.pocket_pets 
FOR ALL USING (
    (select auth.uid()) = user_id 
    OR 
    (select public.is_admin())
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    amount INTEGER,
    cost INTEGER,
    description TEXT,
    status TEXT DEFAULT 'COMPLETED'
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Combined policy for viewing transactions
CREATE POLICY "Unified Transaction Access" ON public.transactions 
FOR SELECT USING (
    (select auth.uid()) = user_id 
    OR 
    (select public.is_admin())
);

-- SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type TEXT,
    event TEXT,
    details TEXT
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admins only
CREATE POLICY "Unified System Logs" ON public.system_logs 
FOR ALL USING (
    (select public.is_admin())
);

-- ==========================================
-- 6. ADDITIONAL DATA PERSISTENCE POLICIES
-- ==========================================

-- JOURNALS
create table if not exists public.journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date timestamptz default now(),
  content text
);
alter table public.journals enable row level security;

DROP POLICY IF EXISTS "Unified Journals" ON public.journals;
CREATE POLICY "Unified Journals" ON public.journals
FOR ALL USING (
    (select auth.uid()) = user_id OR (select public.is_admin())
);

-- MOODS
create table if not exists public.moods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date timestamptz default now(),
  mood text
);
alter table public.moods enable row level security;

DROP POLICY IF EXISTS "Unified Moods" ON public.moods;
CREATE POLICY "Unified Moods" ON public.moods
FOR ALL USING (
    (select auth.uid()) = user_id OR (select public.is_admin())
);

-- USER ART
create table if not exists public.user_art (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  image_url text,
  prompt text,
  title text,
  created_at timestamptz default now()
);
alter table public.user_art enable row level security;

DROP POLICY IF EXISTS "Unified User Art" ON public.user_art;
CREATE POLICY "Unified User Art" ON public.user_art
FOR ALL USING (
    (select auth.uid()) = user_id OR (select public.is_admin())
);

-- VOICE JOURNALS
create table if not exists public.voice_journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  audio_url text,
  duration_seconds integer,
  title text,
  created_at timestamptz default now()
);
alter table public.voice_journals enable row level security;

DROP POLICY IF EXISTS "Unified Voice Journals" ON public.voice_journals;
CREATE POLICY "Unified Voice Journals" ON public.voice_journals
FOR ALL USING (
    (select auth.uid()) = user_id OR (select public.is_admin())
);
