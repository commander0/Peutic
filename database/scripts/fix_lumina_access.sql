-- FIX: Enable access to pocket_pets table
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS (just in case)
alter table public.pocket_pets enable row level security;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Users can create their own pets" on public.pocket_pets;
drop policy if exists "Users can view their own pets" on public.pocket_pets;
drop policy if exists "Users can update their own pets" on public.pocket_pets;

-- 3. Create Policy for Users to INSERT their own pets
create policy "Users can create their own pets"
on public.pocket_pets
for insert
with check ((select auth.uid()) = user_id);

-- 4. Create Policy for Users to SELECT their own pets
create policy "Users can view their own pets"
on public.pocket_pets
for select
using ((select auth.uid()) = user_id);

-- 5. Create Policy for Users to UPDATE their own pets
create policy "Users can update their own pets"
on public.pocket_pets
for update
using ((select auth.uid()) = user_id);
