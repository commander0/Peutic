-- ==========================================================
-- EMERGENCY CLEANUP: DEMOTE ACCIDENTAL ADMINS
-- ==========================================================

-- Problem: A bug in the self-healing logic granted ADMIN role to users erroneously.
-- Solution: Demote everyone to 'USER' except for the primary admin email(s).

-- WARNING: Update the list of emails below to include your actual admin email!
-- If you are unsure, you can also demote everyone and then use the AdminLogin to re-setup.

UPDATE public.users
SET 
  role = 'USER',
  balance = 0
WHERE 
  -- ADD YOUR PRIMARY ADMIN EMAILS HERE
  email NOT IN ('your-admin-email@example.com', 'admin@peutic.xyz')
  AND role = 'ADMIN';

-- Reset 999 balances for anyone who isn't a confirmed admin
UPDATE public.users
SET balance = 0
WHERE balance = 999 AND role != 'ADMIN';
