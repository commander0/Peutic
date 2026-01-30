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
DROP POLICY IF EXISTS "Unified Users Select" ON public.users;
DROP POLICY IF EXISTS "Unified Users Update" ON public.users;

DROP POLICY IF EXISTS "Users view own garden" ON public.garden_log;
DROP POLICY IF EXISTS "Users update own garden" ON public.garden_log;
DROP POLICY IF EXISTS "Users modify own garden" ON public.garden_log;
DROP POLICY IF EXISTS "Admins manage gardens" ON public.garden_log;
DROP POLICY IF EXISTS "User Garden" ON public.garden_log;

DROP POLICY IF EXISTS "Users view own pet" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users create own pet" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users update own pet" ON public.pocket_pets;
DROP POLICY IF EXISTS "Admins manage pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "User Pocket Pets" ON public.pocket_pets;
DROP POLICY IF EXISTS "Users manage own pets" ON public.pocket_pets;

DROP POLICY IF EXISTS "Users view own tx" ON public.transactions;
DROP POLICY IF EXISTS "Admins view all tx" ON public.transactions;
DROP POLICY IF EXISTS "User/Admin Transactions" ON public.transactions;

DROP POLICY IF EXISTS "Admins view logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins create logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin Select Logs" ON public.system_logs;
DROP POLICY IF EXISTS "System Insert Logs" ON public.system_logs;


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
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN';
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

  INSERT INTO public.users (id, email, role)
  VALUES (p_user_id, (SELECT email FROM auth.users WHERE id = p_user_id), 'ADMIN')
  ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';

  RETURN TRUE;
END;
$$;

-- ==========================================
-- 5. OPTIMIZED RLS POLICIES (Fixing "Auth RLS Initialization Plan")
-- ==========================================

-- USERS
CREATE POLICY "Users View Self" ON public.users FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users Update Self" ON public.users FOR UPDATE USING ((select auth.uid()) = id);
CREATE POLICY "Admins Full Access" ON public.users FOR ALL USING (public.is_admin());

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

CREATE POLICY "Users Manage Own Garden" ON public.garden_log FOR ALL USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins Manage All Gardens" ON public.garden_log FOR ALL USING (public.is_admin());

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

CREATE POLICY "Users Manage Own Pets" ON public.pocket_pets FOR ALL USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins Manage All Pets" ON public.pocket_pets FOR ALL USING (public.is_admin());

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

CREATE POLICY "Users View Own Transactions" ON public.transactions FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins View All Transactions" ON public.transactions FOR SELECT USING (public.is_admin());

-- SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type TEXT,
    event TEXT,
    details TEXT
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins Manage Logs" ON public.system_logs FOR ALL USING (public.is_admin());
