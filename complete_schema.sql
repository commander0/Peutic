-- ==============================================================================
-- PEUTIC OS: COMPLETE CONSOLIDATED SCHEMA
-- Version: 2.0 (Merged & Fixed)
-- Includes: Core Tables, RLS Policies, Storage, System Functions
-- ==============================================================================

-- 0. EXTENSIONS & SETUP
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron"; -- Optional

-- 1. CLEANUP (WARNING: Destructive Reset)
drop table if exists public.user_achievements cascade;
drop table if exists public.transactions cascade;
drop table if exists public.journals cascade;
drop table if exists public.voice_journals cascade;
drop table if exists public.moods cascade; -- Correct name
drop table if exists public.user_art cascade;
drop table if exists public.feedback cascade;
drop table if exists public.garden_state cascade;
drop table if exists public.pocket_pets cascade; -- Correct name
drop table if exists public.active_sessions cascade;
drop table if exists public.session_queue cascade;
drop table if exists public.users cascade;
drop table if exists public.profiles cascade; -- Legacy
drop table if exists public.companions cascade;
drop table if exists public.achievements cascade;
drop table if exists public.system_logs cascade;
drop table if exists public.global_settings cascade;
drop table if exists public.promo_codes cascade;
drop table if exists public.safety_alerts cascade;

-- 2. USERS (Identity & Preferences)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  role text default 'USER', -- 'ADMIN', 'USER'
  balance integer default 0,
  subscription_status text default 'ACTIVE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login_date timestamp with time zone default timezone('utc'::text, now()),
  streak integer default 0,
  provider text default 'email',
  avatar_url text,
  avatar_locked boolean default false,
  email_preferences jsonb default '{"marketing": true, "updates": true}'::jsonb,
  theme_preference text default 'gold-light', -- Updated default
  language_preference text default 'en',
  game_scores jsonb default '{"match": 0, "cloud": 0}'::jsonb,
  unlocked_rooms text[] default array[]::text[],
  birthday text,
  metadata jsonb default '{}'::jsonb
);

-- 3. GLOBAL SETTINGS (System Config)
create table public.global_settings (
  id integer primary key default 1,
  price_per_minute numeric default 1.99,
  sale_mode boolean default false,
  allow_signups boolean default true,
  site_name text default 'Peutic',
  broadcast_message text,
  dashboard_broadcast_message text,
  max_concurrent_sessions integer default 15,
  multilingual_mode boolean default true,
  maintenance_mode boolean default false
);

-- Seed Default Settings
insert into public.global_settings (id, price_per_minute, site_name)
values (1, 1.99, 'Peutic')
on conflict (id) do nothing;

-- 4. COMPANIONS (AI Personas)
create table public.companions (
  id text primary key,
  name text not null,
  gender text,
  specialty text not null,
  status text default 'AVAILABLE',
  rating numeric(3, 1),
  image_url text,
  bio text,
  replica_id text,
  license_number text,
  degree text,
  state_of_practice text,
  years_experience integer
);

-- 5. CONTENT & USER DATA

-- Journals
create table public.journals (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Voice Journals
create table public.voice_journals (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  audio_url text not null,
  duration_seconds integer,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Moods
create table public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  mood text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Art (Wisdom Art)
create table public.user_art (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  title text,
  prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feedback
create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  companion_name text,
  rating integer,
  tags text[],
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  duration integer
);

-- Transactions
create table public.transactions (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  user_name text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  amount integer not null,
  cost numeric(10, 2) default 0,
  description text,
  status text default 'COMPLETED'
);

-- Safety Alerts
create table public.safety_alerts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id),
    content text,
    content_type text,
    flagged_keywords text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. DISCOVERY & GAMIFICATION

-- Garden State
create table public.garden_state (
  user_id uuid references public.users(id) on delete cascade primary key,
  level integer default 1,
  water_level integer default 50,
  growth_stage integer default 0,
  current_plant_type text default 'Bonsai',
  streak_current integer default 0,
  streak_max integer default 0,
  last_watered timestamp with time zone
);

-- Pocket Pets
create table public.pocket_pets (
  user_id uuid references public.users(id) on delete cascade primary key,
  name text default 'Lumina',
  level integer default 1,
  hunger integer default 50,
  happiness integer default 50,
  energy integer default 50,
  last_interaction_at timestamp with time zone,
  last_fed timestamp with time zone,
  last_played timestamp with time zone
);

-- Achievements
create table public.achievements (
  id text primary key,
  code text unique not null,
  title text not null,
  description text,
  icon text
);

create table public.user_achievements (
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_id text references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, achievement_id)
);

-- Promo Codes
create table public.promo_codes (
    id uuid default uuid_generate_v4() primary key,
    code text unique,
    discount_percentage numeric,
    uses integer default 0,
    active boolean default true
);

-- 7. SYSTEM LOGGING & SESSION
create table public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null,
  event text not null,
  details text
);

create table public.active_sessions (
  user_id uuid references public.users(id) on delete cascade primary key,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_ping timestamp with time zone default timezone('utc'::text, now())
);

create table public.session_queue (
  user_id uuid references public.users(id) on delete cascade primary key,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_ping timestamp with time zone default timezone('utc'::text, now())
);


-- ==============================================================================
-- 8. SECURITY POLICIES (RLS)
-- ==============================================================================

-- Enable RLS on ALL tables
alter table public.users enable row level security;
alter table public.global_settings enable row level security;
alter table public.companions enable row level security;
alter table public.journals enable row level security;
alter table public.voice_journals enable row level security;
alter table public.moods enable row level security;
alter table public.user_art enable row level security;
alter table public.garden_state enable row level security;
alter table public.pocket_pets enable row level security;
alter table public.transactions enable row level security;
alter table public.feedback enable row level security;
alter table public.safety_alerts enable row level security;
alter table public.system_logs enable row level security;
alter table public.active_sessions enable row level security;
alter table public.session_queue enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.promo_codes enable row level security;

-- Helper Function: Check if Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users 
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;


-- --- USERS ---
-- Owner can read/update/delete their own
create policy "User Read Own" on public.users for select using (auth.uid() = id);
create policy "User Update Own" on public.users for update using (auth.uid() = id);
-- Admin can read/update all
create policy "Admin Read All Users" on public.users for select using (public.is_admin());
create policy "Admin Update All Users" on public.users for update using (public.is_admin());

-- --- GLOBAL SETTINGS ---
-- Public Read
create policy "Public Read Settings" on public.global_settings for select using (true);
-- Admin Write
create policy "Admin Update Settings" on public.global_settings for update using (public.is_admin());
create policy "Admin Insert Settings" on public.global_settings for insert with check (public.is_admin());

-- --- USER CONTENT (Journals, Voice, Moods, Art) ---
-- Journals
create policy "User All Journals" on public.journals for all using (auth.uid() = user_id);
-- Voice
create policy "User All Voice" on public.voice_journals for all using (auth.uid() = user_id);
-- Moods
create policy "User All Moods" on public.moods for all using (auth.uid() = user_id);
-- Art
create policy "User All Art" on public.user_art for all using (auth.uid() = user_id);

-- --- GAMIFICATION (Garden, Pets) ---
create policy "User All Garden" on public.garden_state for all using (auth.uid() = user_id);
create policy "User All Pets" on public.pocket_pets for all using (auth.uid() = user_id);

-- --- COMPANIONS ---
create policy "Public Read Companions" on public.companions for select using (true);
create policy "Admin Manage Companions" on public.companions for all using (public.is_admin());

-- --- TRANSACTIONS ---
create policy "User Read Own Tx" on public.transactions for select using (auth.uid() = user_id);
create policy "User Create Tx" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Admin Read All Tx" on public.transactions for select using (public.is_admin());

-- --- SYSTEM LOGS ---
create policy "Admin Read Logs" on public.system_logs for select using (public.is_admin());
-- Allow system to insert (no user check usually, but for client logs allow null or user)
create policy "Insert Logs" on public.system_logs for insert with check (true);

-- --- SAFETY ALERTS ---
create policy "Admin Manage Alerts" on public.safety_alerts for all using (public.is_admin());
create policy "System Create Alerts" on public.safety_alerts for insert with check (auth.uid() = user_id);

-- --- SESSIONS ---
create policy "User All Sessions" on public.active_sessions for all using (auth.uid() = user_id);
create policy "User All Queue" on public.session_queue for all using (auth.uid() = user_id);

-- --- ACHIEVEMENTS ---
create policy "Public Read Achievs" on public.achievements for select using (true);
create policy "User Read My Unlocks" on public.user_achievements for select using (auth.uid() = user_id);
create policy "User Unlock Achiev" on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "Admin Manage Achievs" on public.achievements for all using (public.is_admin());


-- ==============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Auto-User Creation Trigger
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    -- First user is Admin, others User
    case when (select count(*) from public.users) = 0 then 'ADMIN' else 'USER' end
  );
  return new;
end;
$$;

-- Trigger Re-bind
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SYSTEM CLAIM (Manual Admin Creation)
create or replace function public.claim_system_ownership(admin_secret text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  target_user_id uuid;
begin
  -- 1. Check if ANY Admin exists
  if exists (select 1 from public.users where role = 'ADMIN') then
    return false;
  end if;

  -- 2. Simple Secret Check (Hardcoded for emergency, or check env var if possible)
  -- For now, we trust the caller IF no admin exists. 
  -- Ideally, passed secret should match a server-side config, but in SQL-only context:
  if admin_secret != 'peutic-genesis-key' then
      return false;
  end if;

  -- 3. Promote Caller
  target_user_id := auth.uid();
  if target_user_id is null then
    return false;
  end if;

  update public.users set role = 'ADMIN' where id = target_user_id;
  return true;
end;
$$;


-- ==============================================================================
-- 10. STORAGE BUCKETS (If 'storage' schema exists)
-- ==============================================================================
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
      -- Voice Journals Bucket
      insert into storage.buckets (id, name, public) 
      values ('voice-journals', 'voice-journals', false)
      on conflict (id) do nothing;

      -- Wisdom Art Bucket
      insert into storage.buckets (id, name, public) 
      values ('wisdom-art', 'wisdom-art', true)
      on conflict (id) do nothing;
      
      -- Policies could be added here if storage.policies exists, 
      -- but usually configured via UI or separate calls.
      -- Simplified Policy Grants for SQL Editor:
      -- (These might fail if run as non-superuser depending on setup, but worth including)
  end if;
end $$;

-- End of Schema
