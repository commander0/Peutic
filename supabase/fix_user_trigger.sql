-- FIX: Enhance handle_new_user trigger to capture all metadata and ensure Admin promotion logic is robust.
-- This replaces the existing trigger function.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_count int;
begin
  -- 1. Determine Role (Admin if first user)
  select count(*) into v_count from public.users;
  if v_count = 0 then
    v_role := 'ADMIN';
  else
    v_role := 'USER';
  end if;

  -- 2. Insert with Metadata Mapping
  insert into public.users (
    id, 
    email, 
    name, 
    role, 
    avatar_url, 
    metadata,
    birthday
  )
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
    v_role,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data,
    new.raw_user_meta_data->>'birthday'
  )
  on conflict (id) do update set
    -- If user exists (Client Race), we only update metadata if it's missing/null
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
    metadata = coalesce(public.users.metadata, excluded.metadata),
    birthday = coalesce(public.users.birthday, excluded.birthday);
    
  return new;
end;
$$;

-- Ensure Trigger is bound
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created 
  after insert on auth.users 
  for each row execute procedure public.handle_new_user();
