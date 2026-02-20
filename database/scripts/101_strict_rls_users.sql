-- 101_strict_rls_users.sql
-- Description: Enforces strict Row Level Security (RLS) on the `users` table to prevent data scraping.

-- 1. Ensure RLS is enabled on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any overly permissive SELECT policies that might exist
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Public can view users" ON users;
DROP POLICY IF EXISTS "Allow public SELECT on users" ON users;

-- 3. Re-create the STRICT SELECT policy
-- A user can only view their own row.
CREATE POLICY "Users can only view their own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- (Optional) If we have a system where users NEED to see each other's basic info (like for a community feature),
-- we would create a separate "public_profiles" view that only exposes safe fields (name, avatar).
-- Since Peutic is currently strictly personal, strict isolation is best.

-- 4. Admins bypass RLS naturally if they use the Service Role key, 
-- but if they are an auth.uid() based admin, we might need a specific admin policy.
-- Note: Assuming AdminService uses Service Role Key, this strict policy is fine.
