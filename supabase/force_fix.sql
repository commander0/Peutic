-- FORCE FIX: Self-Healing Profile Function
-- This function allows the user to repair their own profile BYPASSING standard RLS.

CREATE OR REPLACE FUNCTION public.self_repair_profile()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '{"error": "Not authenticated"}'::JSONB;
  END IF;

  -- Check if exists
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) INTO v_exists;

  IF v_exists THEN
     RETURN '{"status": "exists", "id": "' || v_user_id || '"}'::JSONB;
  END IF;

  -- INSERT BYPASSING ALL RLS (Security Definer)
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    v_user_id,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'Repaired User',
    'USER'
  );

  RETURN '{"status": "repaired", "id": "' || v_user_id || '"}'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.self_repair_profile TO authenticated;

-- ALSO RESET RLS ONE LAST TIME TO BE SURE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable Read for Users" ON public.users;
CREATE POLICY "Enable Read for Users" ON public.users FOR SELECT USING (true); -- TEMPORARY OPEN READ
DROP POLICY IF EXISTS "Enable Update for Users" ON public.users;
CREATE POLICY "Enable Update for Users" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Enable Insert for Signup" ON public.users;
CREATE POLICY "Enable Insert for Signup" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
