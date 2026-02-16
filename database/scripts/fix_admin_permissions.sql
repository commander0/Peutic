-- EMERGENCY ADMIN FIX SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR IMMEDIATELY

-- 1. FORCE ADMIN ROLE (Replace with your email)
update public.users
set role = 'ADMIN'
where email = 'admin@peutic.com'; -- <<< CHANGE THIS TO YOUR EMAIL

-- 2. ENSURE RLS IS NOT BLOCKING (The "Golden Policy" Re-Apply)
drop policy if exists "User Update Self" on public.users;
create policy "User Update Self" on public.users for update using (auth.uid() = id);

drop policy if exists "User Read Self" on public.users;
create policy "User Read Self" on public.users for select using (auth.uid() = id);

-- 3. FIX ART SAVING
drop policy if exists "User insert own art" on public.user_art;
create policy "User insert own art" on public.user_art for insert with check (auth.uid() = user_id);

drop policy if exists "User select own art" on public.user_art;
create policy "User select own art" on public.user_art for select using (auth.uid() = user_id);

-- 4. FIX JOURNAL SAVING
drop policy if exists "User All Journals" on public.journals;
create policy "User All Journals" on public.journals for all using (auth.uid() = user_id);

-- 5. VERIFY
select id, email, role from public.users where role = 'ADMIN';
