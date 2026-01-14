
-- -----------------------------------------------------------------------------
-- PEUTIC: MANUAL EMAIL CONFIRMATION FIX (v2)
-- -----------------------------------------------------------------------------
-- Run this script to fix "Email not verified" and ensure Admin access.
-- FIX: Includes 'email' in insert to satisfy NOT NULL constraints.
-- -----------------------------------------------------------------------------

-- 1. Confirm all emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Ensure Admin Role for the first user
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the oldest user's ID and Email
  SELECT id, email INTO v_user_id, v_user_email 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Insert or Update public.users
    -- We MUST provide email because the table has a NOT NULL constraint
    INSERT INTO public.users (id, email, role, balance)
    VALUES (v_user_id, v_user_email, 'ADMIN', 999.00)
    ON CONFLICT (id) DO UPDATE
    SET role = 'ADMIN'; 
    
    RAISE NOTICE 'Admin privileges granted to: %', v_user_email;
  END IF;
END $$;
