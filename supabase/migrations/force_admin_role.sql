-- ==========================================================
-- EMERGENCY FIX: FORCE ADMIN ROLE
-- ==========================================================
-- Run this script to manually promote your account to ADMIN.
-- REPLACE 'your_email@example.com' with your ACTUAL email address.

UPDATE public.users
SET role = 'ADMIN'
WHERE email = 'REPLACE_WITH_YOUR_EMAIL';  -- <--- EDIT THIS LINE

-- Verify the change
SELECT email, role FROM public.users WHERE role = 'ADMIN';
