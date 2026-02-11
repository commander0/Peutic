-- ==============================================================================
-- PEUTIC OS: UNIFIED MASTER SCHEMA (v3.0)
-- Consolidated from: complete_schema.sql, optimizations.sql, and all migrations.
-- ENSURES: Full Persistence, NO Missing Tables, NO Mock Data.
-- ==============================================================================

-- 0. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- 1. CLEANUP (Safe Drops - Cascade)
drop table if exists public.user_achievements cascade;
drop table if exists public.user_garden cascade;
drop table if exists public.garden_state cascade; -- normalizing to garden_log
drop table if exists public.garden_log cascade;
drop table if exists public.transactions cascade;
drop table if exists public.journals cascade;
drop table if exists public.voice_journals cascade;
drop table if exists public.moods cascade;
drop table if exists public.user_art cascade;
drop table if exists public.feedback cascade;
drop table if exists public.pocket_pets cascade;
drop table if exists public.active_sessions cascade;
drop table if exists public.session_queue cascade;
drop table if exists public.users cascade;
drop table if exists public.companions cascade;
drop table if exists public.achievements cascade;
drop table if exists public.system_logs cascade;
drop table if exists public.global_settings cascade;
drop table if exists public.promo_codes cascade;
drop table if exists public.safety_alerts cascade;

-- 2. CORE TABLES

-- USERS
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  role text default 'USER', -- 'ADMIN', 'USER'
  balance numeric default 0,
  subscription_status text default 'ACTIVE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login_date timestamp with time zone default timezone('utc'::text, now()),
  streak integer default 0,
  provider text default 'email',
  avatar_url text,
  avatar_locked boolean default false,
  email_preferences jsonb default '{"marketing": true, "updates": true}'::jsonb,
  theme_preference text default 'gold-light',
  language_preference text default 'en',
  game_scores jsonb default '{"match": 0, "cloud": 0}'::jsonb,
  unlocked_rooms text[] default array[]::text[],
  birthday text,
  metadata jsonb default '{}'::jsonb
);

-- GLOBAL SETTINGS
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
insert into public.global_settings (id, price_per_minute, site_name) values (1, 1.99, 'Peutic') on conflict (id) do nothing;

-- COMPANIONS
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

-- 3. CONTENT TABLES

-- JOURNALS (Text)
create table public.journals (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VOICE JOURNALS
create table public.voice_journals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  audio_url text not null,
  duration_seconds integer default 0,
  title text default 'Audio Note',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MOODS
create table public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  mood text not null, -- 'confetti', 'rain', etc.
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USER ART
create table public.user_art (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  title text,
  prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FEEDBACK
create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  companion_name text,
  rating integer,
  tags text[],
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  duration integer
);

-- TRANSACTIONS
create table public.transactions (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  user_name text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  cost numeric default 0,
  description text,
  type text, -- 'EARN', 'SPEND'
  status text default 'COMPLETED'
);

-- SAFETY ALERTS
create table public.safety_alerts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id),
    content text,
    content_type text,
    flagged_keywords text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. GAMIFICATION TABLES

-- GARDEN LOG (Unified)
-- Matches GardenService.ts expectations
create table public.garden_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique, -- One garden per user
  level integer default 1,
  water_level integer default 50,
  current_plant_type text default 'Lotus',
  streak_current integer default 0,
  streak_best integer default 0,
  last_watered_at timestamp with time zone default now(),
  last_clipped_at timestamp with time zone
);

-- POCKET PETS
create table public.pocket_pets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade unique, -- One pet per user
  name text default 'Lumina',
  species text default 'Wisp', -- Added species column if needed, assumed default
  level integer default 1,
  experience integer default 0,
  health numeric default 100,
  hunger numeric default 100,
  happiness numeric default 100,
  cleanliness numeric default 100,
  energy numeric default 100,
  is_sleeping boolean default false,
  last_interaction_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ACHIEVEMENTS
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

-- PROMO CODES
create table public.promo_codes (
    id uuid default uuid_generate_v4() primary key,
    code text unique,
    discount_percentage numeric,
    uses integer default 0,
    active boolean default true
);

-- 5. SYSTEM & SESSION TABLES

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
-- 6. RLS POLICIES (Consolidated)
-- ==============================================================================

alter table public.users enable row level security;
alter table public.global_settings enable row level security;
alter table public.companions enable row level security;
alter table public.journals enable row level security;
alter table public.voice_journals enable row level security;
alter table public.moods enable row level security;
alter table public.user_art enable row level security;
alter table public.garden_log enable row level security;
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

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN');
end;
$$ language plpgsql security definer;

-- USERS
create policy "User Read Own" on public.users for select using (auth.uid() = id);
create policy "User Update Own" on public.users for update using (auth.uid() = id);
create policy "User Insert Own" on public.users for insert with check (auth.uid() = id);
create policy "Admin Read All Users" on public.users for select using (public.is_admin());
create policy "Admin Update All Users" on public.users for update using (public.is_admin());

-- SETTINGS
create policy "Public Read Settings" on public.global_settings for select using (true);
create policy "Admin Manage Settings" on public.global_settings for all using (public.is_admin());

-- COMPANIONS
create policy "Public Read Companions" on public.companions for select using (true);
create policy "Admin Manage Companions" on public.companions for all using (public.is_admin());

-- USER CONTENT
create policy "User Manage Journals" on public.journals for all using (auth.uid() = user_id);
create policy "User Manage Voice" on public.voice_journals for all using (auth.uid() = user_id);
create policy "User Manage Moods" on public.moods for all using (auth.uid() = user_id);
create policy "User Manage Art" on public.user_art for all using (auth.uid() = user_id);
create policy "User Create Feedback" on public.feedback for insert with check (auth.uid() = user_id);
create policy "Admin Read Feedback" on public.feedback for select using (public.is_admin());
create policy "User Read Own Tx" on public.transactions for select using (auth.uid() = user_id);
create policy "User Create Tx" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Admin Read Tx" on public.transactions for select using (public.is_admin());

-- GAMIFICATION
create policy "User Manage Garden" on public.garden_log for all using (auth.uid() = user_id);
create policy "User Manage Pets" on public.pocket_pets for all using (auth.uid() = user_id);
create policy "Public Read Achievs" on public.achievements for select using (true);
create policy "User Read Unlocks" on public.user_achievements for select using (auth.uid() = user_id);
create policy "User Unlock Achiev" on public.user_achievements for insert with check (auth.uid() = user_id);

-- SYSTEM
create policy "Admin Access Logs" on public.system_logs for all using (public.is_admin());
create policy "System Insert Logs" on public.system_logs for insert with check (true);
create policy "User Manage Sessions" on public.active_sessions for all using (auth.uid() = user_id);
create policy "User Manage Queue" on public.session_queue for all using (auth.uid() = user_id);
create policy "Admin Manage Alerts" on public.safety_alerts for all using (public.is_admin());

-- ==============================================================================
-- 7. RPC FUNCTIONS (Business Logic)
-- ==============================================================================

-- 7.1 WATER GARDEN
create or replace function public.water_garden(p_user_id uuid, p_intensity int default 1)
returns json
language plpgsql
security definer
as $$
declare
    v_garden public.garden_log%rowtype;
    v_now timestamptz := now();
    v_last_watered timestamptz;
    v_hours_diff numeric;
    v_new_streak int;
    v_new_level int;
    v_effective_streak numeric;
    v_new_water_level int;
begin
    -- Get or Init Garden
    select * into v_garden from public.garden_log where user_id = p_user_id;
    
    if not found then
        insert into public.garden_log (user_id, level, current_plant_type, streak_current, streak_best, water_level)
        values (p_user_id, 1, 'Lotus', 0, 0, 50)
        returning * into v_garden;
    end if;

    v_last_watered := v_garden.last_watered_at;
    
    -- Calculate Time Diff (Hours)
    if v_last_watered is null then
        v_hours_diff := 999;
    else
        v_hours_diff := extract(epoch from (v_now - v_last_watered)) / 3600;
    end if;

    -- Cooldown Check (1 hour)
    if v_hours_diff < 1 and p_intensity = 1 then
        return json_build_object('success', false, 'message', 'Plant is already hydrated', 'garden', row_to_json(v_garden));
    end if;

    -- Logic
    v_new_streak := v_garden.streak_current + p_intensity;
    v_new_level := v_garden.level;
    v_effective_streak := v_new_streak + (v_garden.streak_best * 0.1);

    if v_effective_streak >= 3 and v_new_level < 2 then v_new_level := 2; end if;
    if v_effective_streak >= 10 and v_new_level < 3 then v_new_level := 3; end if;
    if v_effective_streak >= 25 and v_new_level < 4 then v_new_level := 4; end if;
    if v_effective_streak >= 50 and v_new_level < 5 then v_new_level := 5; end if;

    v_new_water_level := least(100, (v_garden.water_level + (10 * p_intensity)));

    update public.garden_log
    set last_watered_at = v_now, streak_current = v_new_streak, streak_best = greatest(v_garden.streak_best, v_new_streak), level = v_new_level, water_level = v_new_water_level
    where user_id = p_user_id
    returning * into v_garden;

    return json_build_object('success', true, 'garden', row_to_json(v_garden));
end;
$$;

-- 7.2 CLIP GARDEN (Reward)
create or replace function public.clip_garden(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_last_clipped timestamptz;
    v_now timestamptz := now();
    v_prize int;
    v_quote text;
    v_quotes text[] := array['Growth takes time.', 'Patience is bitter, but its fruit is sweet.', 'Bloom where you are planted.'];
begin
    select last_clipped_at into v_last_clipped from public.garden_log where user_id = p_user_id;

    if v_last_clipped is not null and v_now - v_last_clipped < interval '12 hours' then
        return json_build_object('error', 'Plant needs rest');
    end if;

    v_prize := floor(random() * 6 + 5)::int;
    v_quote := v_quotes[floor(random() * array_length(v_quotes, 1) + 1)];

    update public.users set balance = balance + v_prize where id = p_user_id;
    update public.garden_log set last_clipped_at = v_now where user_id = p_user_id;
    insert into public.transactions (user_id, amount, description, type, status) values (p_user_id, v_prize, 'Garden Clip Reward', 'EARN', 'COMPLETED');

    return json_build_object('success', true, 'prize', v_prize, 'quote', v_quote, 'new_balance', (select balance from public.users where id = p_user_id));
end;
$$;

-- 7.3 BOOK OF YOU STATS
create or replace function public.get_book_stats(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_joined_at timestamptz;
    v_journal_count int;
    v_mood_count int;
    v_sun_count int;
    v_has_access boolean;
    v_days_wait int;
    v_dominant_weather text;
begin
    select created_at into v_joined_at from public.users where id = p_user_id;
    if v_joined_at is null then return json_build_object('error', 'User not found'); end if;

    if now() - v_joined_at < interval '7 days' then
        v_has_access := false;
        v_days_wait := 7 - extract(day from (now() - v_joined_at))::int;
    else
        v_has_access := true;
        v_days_wait := 0;
    end if;

    select count(*) into v_journal_count from public.journals where user_id = p_user_id;
    select count(*) into v_mood_count from public.moods where user_id = p_user_id;
    select count(*) into v_sun_count from public.moods where user_id = p_user_id and mood in ('Happy', 'Calm', 'confetti', 'sun', 'Excited', 'Grateful');

    if v_mood_count > 0 and (v_sun_count::numeric / v_mood_count::numeric) >= 0.5 then
        v_dominant_weather := 'sun';
    else
        v_dominant_weather := 'rain';
    end if;

    return json_build_object(
        'isLocked', not v_has_access,
        'daysRemaining', v_days_wait,
        'stats', json_build_object('journals', v_journal_count, 'moods', v_mood_count, 'sunRatio', case when v_mood_count > 0 then (v_sun_count::numeric / v_mood_count::numeric) else 0.5 end),
        'weather', v_dominant_weather
    );
end;
$$;

-- 7.4 WEEKLY ACTIVITY COUNT (NEW)
create or replace function public.get_weekly_activity_count(p_user_id uuid)
returns int
language plpgsql
security definer
as $$
declare
    v_start_of_week timestamptz := date_trunc('week', now());
    v_journal_count int;
    v_mood_count int;
    v_voice_count int;
begin
    select count(*) into v_journal_count from public.journals where user_id = p_user_id and date >= v_start_of_week;
    select count(*) into v_mood_count from public.moods where user_id = p_user_id and date >= v_start_of_week;
    select count(*) into v_voice_count from public.voice_journals where user_id = p_user_id and created_at >= v_start_of_week;
    return v_journal_count + v_mood_count + v_voice_count;
end;
$$;

-- 7.5 UPDATE GAME SCORE
create or replace function public.update_game_score(p_user_id uuid, game_type text, new_score int)
returns void
language plpgsql
security definer
as $$
declare
    current_scores jsonb;
    current_val int;
begin
    select game_scores into current_scores from public.users where id = p_user_id;
    current_val := (current_scores->>game_type)::int;
    
    if game_type = 'match' then
        -- Lower is better for match
        if current_val = 0 or new_score < current_val then
            update public.users set game_scores = jsonb_set(game_scores, array[game_type], to_jsonb(new_score)) where id = p_user_id;
        end if;
    else
        -- Higher is better for cloud
        if new_score > current_val then
             update public.users set game_scores = jsonb_set(game_scores, array[game_type], to_jsonb(new_score)) where id = p_user_id;
        end if;
    end if;
end;
$$;

-- 8. TRIGGERS

-- Auto Create User
-- 2. SYSTEM CLAIM (Manual Admin Creation)
-- Matches AdminService.ts: createRootAdmin -> rpc('claim_system_access')
create or replace function public.claim_system_access(p_user_id uuid, p_master_key text, p_email text default null)
returns boolean
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
begin
  -- 1. Check if ANY Admin exists
  if exists (select 1 from public.users where role = 'ADMIN') then
    return false;
  end if;

  -- 2. Verify Master Key (Hardcoded or Env-like check)
  -- Matches AdminLogin.tsx / AdminService.ts expectation
  if p_master_key != 'peutic-genesis-key' and p_master_key != 'PEUTIC_ADMIN_ACCESS_2026' then
      return false;
  end if;

  -- 3. Promote User
  update public.users set role = 'ADMIN' where id = p_user_id;
  
  -- Double check
  if exists (select 1 from public.users where id = p_user_id and role = 'ADMIN') then
      return true;
  end if;

  return false;
end;
$$;

-- 3. CHECK ADMIN EXISTS (Missing RPC)
create or replace function public.check_admin_exists()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (select 1 from public.users where role = 'ADMIN');
end;
$$;

-- Auto Create User Trigger (Restored)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', case when (select count(*) from public.users) = 0 then 'ADMIN' else 'USER' end);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Prevent Admin Deletion
create or replace function public.prevent_admin_deletion()
returns trigger language plpgsql security definer
as $$
begin
  if OLD.role = 'ADMIN' then raise exception 'Cannot delete admin.'; end if;
  return OLD;
end;
$$;

drop trigger if exists tr_prevent_admin_deletion on public.users;
create trigger tr_prevent_admin_deletion before delete on public.users for each row execute procedure public.prevent_admin_deletion();

