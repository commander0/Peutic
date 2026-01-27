-- ==========================================
-- PEUTIC UNIFIED SCHEMA - COMPLETE STABILIZATION
-- ==========================================

-- cleanup
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- USERS TABLE
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

-- GLOBAL SETTINGS
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

-- COMPANIONS
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

-- ACTIVE SESSIONS & QUEUE
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

-- JOURNALS & CONTENT
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

-- MOODS & PROGRESS
create table if not exists public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  mood text
);

-- TRANSACTIONS
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  amount integer,
  cost numeric,
  description text,
  status text default 'COMPLETED'
);

-- SYSTEM MONITORING
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

-- GARDEN & PETS
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

-- ACHIEVEMENTS
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

-- FEEDBACK
create table if not exists public.feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  companion_name text,
  rating integer,
  tags text[],
  date timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- POWERFUL NEW TRIGGER (FIRST USER = ADMIN)
-- ==========================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_exists boolean;
  is_first boolean;
begin
  -- Robust check for first user
  select count(*) > 0 into user_exists from public.users;
  is_first := NOT user_exists;

  insert into public.users (
    id, email, name, avatar_url, provider, role, balance, subscription_status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    case when is_first then 'ADMIN' else 'USER' end,
    case when is_first then 999 else 0 end,
    'ACTIVE'
  );
  
  -- Initialize Garden
  insert into public.garden_state (user_id) values (new.id);
  
  return new;
exception when others then
  -- Prevent trigger failure from blocking Auth
  raise notice 'Error in handle_new_user for %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- RLS & SEEDING (Idempotent)
-- ==========================================
alter table public.users enable row level security;
alter table public.global_settings enable row level security;
alter table public.companions enable row level security;

-- Robust Policy Reset (Drops all existing policies on these tables)
do $$ 
declare
    pol record;
begin
    -- Reset USERS policies
    for pol in (select policyname from pg_policies where tablename = 'users' and schemaname = 'public') loop
        execute format('drop policy %I on public.users', pol.policyname);
    end loop;
    
    -- Reset SETTINGS policies
    for pol in (select policyname from pg_policies where tablename = 'global_settings' and schemaname = 'public') loop
        execute format('drop policy %I on public.global_settings', pol.policyname);
    end loop;

    -- Reset COMPANIONS policies
    for pol in (select policyname from pg_policies where tablename = 'companions' and schemaname = 'public') loop
        execute format('drop policy %I on public.companions', pol.policyname);
    end loop;
end $$;

-- Recreate Policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Public view settings" on public.global_settings for select using (true);
create policy "Public view companions" on public.companions for select using (true);

insert into public.global_settings (id, site_name) values (1, 'Peutic') on conflict do nothing;
