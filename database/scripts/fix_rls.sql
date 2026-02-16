-- ENABLE EXTENSION
create extension if not exists "uuid-ossp";

-- 1. GLOBAL SETTINGS - OPEN ACCESS (or Admin Only Write)
alter table public.global_settings enable row level security;

-- Allow EVERYONE to READ settings (needed for Login page, Landing page)
create policy "Public Read Settings"
on public.global_settings for select
using (true);

-- Allow ADMINS to UPDATE settings
create policy "Admin Update Settings"
on public.global_settings for update
using (
  auth.uid() in (
    select id from public.users where role = 'ADMIN'
  )
);

-- Allow ADMINS to INSERT settings (if not exists)
create policy "Admin Insert Settings"
on public.global_settings for insert
with check (
  auth.uid() in (
    select id from public.users where role = 'ADMIN'
  )
);


-- 2. VERIFY USERS TABLE POLICIES
alter table public.users enable row level security;

-- Allow users to read their own data
create policy "Users can read own data"
on public.users for select
using (auth.uid() = id);

-- Allow admins to read ALL data
create policy "Admins can read all data"
on public.users for select
using (
  auth.uid() in (
    select id from public.users where role = 'ADMIN'
  )
);

-- Allow users to update their own data
create policy "Users can update own data"
on public.users for update
using (auth.uid() = id);

-- Allow admins to update all data
create policy "Admins can update all data"
on public.users for update
using (
  auth.uid() in (
    select id from public.users where role = 'ADMIN'
  )
);

-- 3. ENSURE ADMIN EXISTS (Safety Net)
-- Replace with actual Admin ID if known, or rely on manual update
-- update public.users set role = 'ADMIN' where email = 'your_admin_email@example.com';
