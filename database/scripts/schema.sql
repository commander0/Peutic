-- ==========================================
-- PEUTIC CORE SCHEMA - 2026 RESTORATION (OPTIMIZED)
-- ==========================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  name text,
  email text,
  birthday date,
  role text default 'USER',
  balance integer default 0,
  subscription_status text default 'ACTIVE',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_login_date timestamp with time zone,
  streak integer default 0,
  provider text,
  avatar_url text,
  avatar_locked boolean default false,
  email_preferences jsonb default '{"marketing": true, "updates": true}',
  theme_preference text,
  language_preference text,
  game_scores jsonb default '{"match": 0, "cloud": 0}',
  unlocked_rooms jsonb default '[]',
  gamification_enabled boolean default true
);

-- 2. GLOBAL SETTINGS
create table if not exists public.global_settings (
    id integer primary key default 1,
    price_per_minute numeric default 1.99,
    sale_mode boolean default false,
    maintenance_mode boolean default false,
    allow_signups boolean default true,
    site_name text default 'Peutic',
    broadcast_message text default '',
    dashboard_broadcast_message text default '',
    max_concurrent_sessions integer default 15,
    multilingual_mode boolean default true,
    constraint single_row check (id = 1)
);

-- 3. COMPANIONS
create table if not exists public.companions (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    gender text,
    specialty text,
    status text default 'AVAILABLE',
    rating numeric default 5.0,
    image_url text,
    bio text,
    replica_id text,
    license_number text,
    degree text,
    state_of_practice text,
    years_experience integer,
    created_at timestamp with time zone default now()
);

-- 4. ACTIVE SESSIONS & QUEUE
create table if not exists public.active_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade unique,
    companion_id uuid references public.companions(id),
    started_at timestamp with time zone default now(),
    last_ping timestamp with time zone default now()
);

create table if not exists public.session_queue (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade unique,
    joined_at timestamp with time zone default now(),
    last_ping timestamp with time zone default now()
);

-- 5. JOURNALS & CONTENT
create table if not exists public.journals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  content text
);

create table if not exists public.voice_journals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  audio_url text,
  duration_seconds integer,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.user_art (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  image_url text,
  prompt text,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. MOODS & PROGRESS
create table if not exists public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  mood text
);

-- 7. TRANSACTIONS
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  amount integer,
  cost numeric,
  description text,
  status text default 'COMPLETED'
);

-- 8. SYSTEM MONITORING
create table if not exists public.system_logs (
    id uuid default uuid_generate_v4() primary key,
    timestamp timestamp with time zone default now(),
    type text,
    event text,
    details text
);

create table if not exists public.safety_alerts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade,
    content_type text,
    content text,
    flagged_keywords text[],
    created_at timestamp with time zone default now()
);

-- 9. GARDEN & PETS
create table if not exists public.garden_state (
  user_id uuid references public.users(id) on delete cascade primary key,
  level integer default 1,
  current_plant_type text default 'Lotus',
  water_level integer default 50,
  last_watered_at timestamp with time zone,
  streak_current integer default 0,
  streak_best integer default 0
);

create table if not exists public.pocket_pets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  species text,
  level integer default 1,
  experience integer default 0,
  health integer default 100,
  hunger integer default 50,
  happiness integer default 50,
  cleanliness integer default 50,
  energy integer default 100,
  is_sleeping boolean default false,
  last_interaction_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. ACHIEVEMENTS
create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  code text unique,
  title text,
  description text,
  icon_name text,
  xp_reward integer
);

create table if not exists public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  achievement_id uuid references public.achievements(id) on delete cascade,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, achievement_id)
);

-- 11. FEEDBACK
create table if not exists public.feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  companion_name text,
  rating integer,
  tags text[],
  date timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- INDEXES (PERFORMANCE)
-- ==========================================
create index if not exists idx_safety_alerts_user_id on public.safety_alerts(user_id);
create index if not exists idx_user_achievements_achievement_id on public.user_achievements(achievement_id);
create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_journals_user_id on public.journals(user_id);

-- ==========================================
-- FUNCTIONS & TRIGGERS (SECURITY HARDENED)
-- ==========================================

-- SET search_path is critical for security definer functions to prevent hijacking.

-- AUTH TRIGGER: handle_new_user
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  -- Check if this is the first user in the system
  select not exists (select 1 from public.users) into is_first_user;

  insert into public.users (id, email, name, avatar_url, provider, role, balance, subscription_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider',
    case when is_first_user then 'ADMIN' else 'USER' end,
    case when is_first_user then 999 else 0 end,
    'ACTIVE'
  );
  
  -- Initialize Garden
  insert into public.garden_state (user_id) values (new.id);
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- RPC FUNCTIONS (SECURITY HARDENED)
-- ==========================================

-- User balance management
create or replace function public.add_user_balance(p_user_id uuid, p_amount integer)
returns integer as $$
declare
  v_new_balance integer;
begin
  update public.users
  set balance = balance + p_amount
  where id = p_user_id
  returning balance into v_new_balance;
  return v_new_balance;
end;
$$ language plpgsql security definer set search_path = public;

-- Cleanup stale sessions
create or replace function public.cleanup_stale_sessions()
returns void as $$
begin
    delete from public.active_sessions where last_ping < (now() - interval '2 minutes');
    delete from public.session_queue where last_ping < (now() - interval '2 minutes');
end;
$$ language plpgsql security definer set search_path = public;

-- Matchmaking engine
create or replace function public.match_session_queue()
returns void as $$
declare
    v_active_count integer;
    v_max_sessions integer;
    v_next_user uuid;
begin
    select count(*) into v_active_count from public.active_sessions;
    select max_concurrent_sessions into v_max_sessions from public.global_settings where id = 1;
    
    if v_active_count < v_max_sessions then
        -- Get next in queue
        select user_id into v_next_user from public.session_queue order by joined_at asc limit 1;
        if v_next_user is not null then
            insert into public.active_sessions (user_id) values (v_next_user)
            on conflict do nothing;
            delete from public.session_queue where user_id = v_next_user;
        end if;
    end if;
end;
$$ language plpgsql security definer set search_path = public;

-- Account deletion
create or replace function public.request_account_deletion()
returns void as $$
begin
    delete from auth.users where id = (select auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

-- Queue Position helper
create or replace function public.get_client_queue_position(p_user_id uuid)
returns integer as $$
declare
    v_pos integer;
begin
    select count(*) + 1 into v_pos
    from public.session_queue
    where joined_at < (select joined_at from public.session_queue where user_id = p_user_id);
    return coalesce(v_pos, 1);
end;
$$ language plpgsql security definer set search_path = public;

-- Join Queue
create or replace function public.join_queue(p_user_id uuid)
returns integer as $$
begin
    insert into public.session_queue (user_id) values (p_user_id)
    on conflict (user_id) do update set last_ping = now();
    return public.get_client_queue_position(p_user_id);
end;
$$ language plpgsql security definer set search_path = public;

-- Claim Spot
create or replace function public.claim_active_spot(p_user_id uuid)
returns boolean as $$
declare
    v_exists boolean;
begin
    select exists(select 1 from public.active_sessions where user_id = p_user_id) into v_exists;
    return v_exists;
end;
$$ language plpgsql security definer set search_path = public;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) - OPTIMIZED
-- ==========================================
-- Wrap auth.uid() in (select auth.uid()) for significant performance boost at scale.

alter table public.users enable row level security;
alter table public.global_settings enable row level security;
alter table public.companions enable row level security;
alter table public.active_sessions enable row level security;
alter table public.session_queue enable row level security;
alter table public.journals enable row level security;
alter table public.moods enable row level security;
alter table public.transactions enable row level security;
alter table public.user_art enable row level security;
alter table public.safety_alerts enable row level security;
alter table public.system_logs enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- USERS POLICIES (Deduplicated)
drop policy if exists "Users Access" on public.users;
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users for select using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users for update using ((select auth.uid()) = id);

-- COMPANIONS POLICIES (Deduplicated)
drop policy if exists "Companions Public Select" on public.companions;
drop policy if exists "Anyone can view companions" on public.companions;
create policy "Anyone can view companions" on public.companions for select using (true);

-- SETTINGS POLICIES (Deduplicated)
drop policy if exists "Settings View" on public.global_settings;
drop policy if exists "Anyone can view settings" on public.global_settings;
create policy "Anyone can view settings" on public.global_settings for select using (true);

-- SAFETY ALERTS POLICIES
drop policy if exists "Admins view all alerts" on public.safety_alerts;
create policy "Admins view all alerts" on public.safety_alerts for select using (
  exists (select 1 from public.users where id = (select auth.uid()) and role = 'ADMIN')
);

-- ACHIEVEMENTS POLICIES
drop policy if exists "Everyone can view achievements" on public.achievements;
create policy "Everyone can view achievements" on public.achievements for select using (true);

drop policy if exists "Users view own achievements" on public.user_achievements;
create policy "Users view own achievements" on public.user_achievements for select using ((select auth.uid()) = user_id);

-- SEED SETTINGS (Initial Row)
insert into public.global_settings (id, site_name) values (1, 'Peutic') on conflict do nothing;
