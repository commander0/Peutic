-- ==========================================================
-- NUCLEAR FIX: ADMIN TOGGLES & GLOBAL SETTINGS
-- ==========================================================

-- 1. DROP EVERYTHING RELATED TO GLOBAL SETTINGS
-- We destroy the table to remove any stuck locks, bad policies, or hidden triggers.
DROP TABLE IF EXISTS public.global_settings CASCADE;

-- 2. RE-CREATE THE TABLE (Clean Slate)
CREATE TABLE public.global_settings (
    id BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Enforce Singleton
    site_name TEXT DEFAULT 'Peutic',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    sale_mode BOOLEAN DEFAULT FALSE,
    allow_signups BOOLEAN DEFAULT TRUE,
    price_per_minute NUMERIC DEFAULT 1.99,
    broadcast_message TEXT DEFAULT '',
    max_concurrent_sessions INTEGER DEFAULT 15,
    multilingual_mode BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SEED THE DEFAULT ROW (Critical for 'Upsert' to work)
INSERT INTO public.global_settings (id, site_name, maintenance_mode, sale_mode, allow_signups, price_per_minute, max_concurrent_sessions)
VALUES (1, 'Peutic', FALSE, FALSE, TRUE, 1.99, 15)
ON CONFLICT (id) DO NOTHING;

-- 4. ENABLE RLS (Security)
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 5. APPLY PERMISSIVE POLICIES (Guaranteed Access)

-- Policy 1: EVERYONE can READ settings
CREATE POLICY "global_settings_read_all" 
ON public.global_settings FOR SELECT 
USING (true);

-- Policy 2: ADMINS can UPDATE (The Fix)
-- We check against the users table.
CREATE POLICY "global_settings_admin_update" 
ON public.global_settings FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND role = 'ADMIN'
    )
);

-- Policy 3: ADMINS can INSERT (Just in case)
CREATE POLICY "global_settings_admin_insert" 
ON public.global_settings FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (select auth.uid()) 
        AND role = 'ADMIN'
    )
);

-- 6. GRANT PERMISSIONS (Low level grants)
GRANT SELECT ON public.global_settings TO anon, authenticated;
GRANT ALL ON public.global_settings TO authenticated;
GRANT ALL ON public.global_settings TO service_role;

-- 7. FORCE ADMIN CHECK (Optional but Recommended)
-- Uncomment the line below and replace with your email to FORCE yourself to be admin if you are locked out.
-- UPDATE public.users SET role = 'ADMIN' WHERE email = 'your_email@gmail.com';
