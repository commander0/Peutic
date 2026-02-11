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
drop policy if exists "User Read Own" on public.users;
create policy "User Read Own" on public.users for select using (auth.uid() = id);

drop policy if exists "User Update Own" on public.users;
create policy "User Update Own" on public.users for update using (auth.uid() = id);

drop policy if exists "User Insert Own" on public.users;
create policy "User Insert Own" on public.users for insert with check (auth.uid() = id);

drop policy if exists "Admin Read All Users" on public.users;
create policy "Admin Read All Users" on public.users for select using (public.is_admin());

drop policy if exists "Admin Update All Users" on public.users;
create policy "Admin Update All Users" on public.users for update using (public.is_admin());

-- SETTINGS
drop policy if exists "Public Read Settings" on public.global_settings;
create policy "Public Read Settings" on public.global_settings for select using (true);
drop policy if exists "Admin Manage Settings" on public.global_settings;
create policy "Admin Manage Settings" on public.global_settings for all using (public.is_admin());
drop policy if exists "Global Settings are viewable by everyone" on public.global_settings;
drop policy if exists "Global Settings are updatable by admins only" on public.global_settings;

-- COMPANIONS
drop policy if exists "Public Read Companions" on public.companions;
create policy "Public Read Companions" on public.companions for select using (true);
drop policy if exists "Admin Manage Companions" on public.companions;
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
  -- 1. Check if I AM ALREADY Admin (Idempotency)
  if exists (select 1 from public.users where id = p_user_id and role = 'ADMIN') then
    return true;
  end if;

  -- 2. Check if ANY Admin exists
  if exists (select 1 from public.users where role = 'ADMIN') then
    return false;
  end if;

  -- 3. Verify Master Key (Hardcoded or Env-like check)
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

-- Auto Create User Trigger (Restored & Hardened)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  -- Idempotency: ON CONFLICT DO NOTHING prevents errors if self-healing ran first
  -- Metadata Fallback: Check 'name' then 'full_name'
  insert into public.users (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
    case when (select count(*) from public.users) = 0 then 'ADMIN' else 'USER' end
  )
  on conflict (id) do nothing;
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

-- ==============================================================================
-- 9. PERFORMANCE INDEXES (Scalability)
-- ==============================================================================

-- Foreign Key Indexes (Postgres does not create these automatically)
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_journals_user_id on public.journals(user_id);
create index if not exists idx_voice_journals_user_id on public.voice_journals(user_id);
create index if not exists idx_moods_user_id on public.moods(user_id);
create index if not exists idx_user_art_user_id on public.user_art(user_id);
create index if not exists idx_feedback_user_id on public.feedback(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_garden_log_user_id on public.garden_log(user_id);
create index if not exists idx_pocket_pets_user_id on public.pocket_pets(user_id);
create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_active_sessions_user_id on public.active_sessions(user_id);
create index if not exists idx_session_queue_user_id on public.session_queue(user_id);
create index if not exists idx_safety_alerts_user_id on public.safety_alerts(user_id);
create index if not exists idx_system_logs_type on public.system_logs(type);

-- Sorting/Filtering Indexes
create index if not exists idx_transactions_date on public.transactions(date desc);
create index if not exists idx_journals_date on public.journals(date desc);
create index if not exists idx_moods_date on public.moods(date desc);
create index if not exists idx_system_logs_timestamp on public.system_logs(timestamp desc);


-- ==============================================================================
-- 10. SEED DATA (Companions)
-- ==============================================================================
INSERT INTO public.companions (id, name, gender, specialty, status, rating, image_url, bio, replica_id, license_number, degree, state_of_practice, years_experience)
VALUES
  ('c1', 'Ruby', 'Female', 'Anxiety & Panic', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800', 'Specializing in grounding techniques and immediate panic reduction.', 're3a705cf66a', 'LCSW-NY-44021', 'MSW, Columbia University', 'NY', 8),
  ('c2', 'Carter', 'Male', 'Life Coaching', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800', 'Success roadmap planning and career strategy.', 'rca8a38779a8', 'ICF-PCC-9921', 'MBA, Stanford', 'CA', 12),
  ('c3', 'James', 'Male', 'Men''s Health', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800', 'Safe space for men.', 'r92debe21318', 'LMFT-TX-2201', 'PhD, Psychology', 'TX', 15),
  ('c4', 'Scarlett', 'Female', 'Women''s Issues', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800', 'Empowerment and health.', 're3a705cf66a', 'LCSW-NY-1188', 'MSW, Social Work', 'NY', 13),
  ('c5', 'Anna', 'Female', 'Family Dynamics', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=800', 'Navigating complex relationships.', 'r6ae5b6efc9d', 'LMFT-CA-9901', 'MS, Family Therapy', 'CA', 11),
  ('c6', 'Gloria', 'Female', 'Elder Care', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800', 'Support for caregivers.', 'r4317e64d25a', 'BSW-FL-3321', 'BSW, Gerontology', 'FL', 20),
  ('c7', 'Olivia', 'Female', 'Workplace Stress', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1619895862022-09114b41f16f?auto=format&fit=crop&q=80&w=800', 'Burnout prevention strategies.', 'rc2146c13e81', 'PsyD-NY-1102', 'PsyD, Org Psychology', 'NY', 7),
  ('c8', 'Marcus', 'Male', 'Addiction Recovery', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800', 'One day at a time.', 'rca8a38779a8', 'LAC-NJ-8821', 'MA, Addiction Counseling', 'NJ', 14),
  ('c9', 'Elena', 'Female', 'Postpartum Support', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=800', 'Supporting new mothers.', 're3a705cf66a', 'LCSW-TX-3321', 'MSW, Clinical Social Work', 'TX', 6),
  ('c10', 'Dr. Chen', 'Male', 'Executive Burnout', 'BUSY', 5.0, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800', 'High performance sustainability.', 'rca8a38779a8', 'PsyD-CA-9921', 'PsyD, Org Psychology', 'CA', 18),
  ('c11', 'Sarah', 'Female', 'Eating Disorders', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800', 'Building a healthy relationship with food.', 'r6ae5b6efc9d', 'RD-NY-4421', 'MS, Nutrition & Psychology', 'NY', 9),
  ('c12', 'Malik', 'Male', 'Trauma & PTSD', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800', 'Healing the past.', 'r92debe21318', 'LPC-IL-2210', 'PhD, Clinical Psychology', 'IL', 11),
  ('c13', 'Zoey', 'Female', 'LGBTQ+ Issues', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800', 'Affirming and inclusive care.', 're3a705cf66a', 'LMFT-OR-5521', 'MA, Counseling Psychology', 'OR', 5),
  ('c14', 'Liam', 'Male', 'Anger Management', 'AVAILABLE', 4.7, 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=800', 'Constructive expression.', 'rca8a38779a8', 'LCSW-MA-8812', 'MSW, Social Work', 'MA', 13),
  ('c15', 'Avery', 'Female', 'ADHD Support', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800', 'Thriving with neurodiversity.', 'rc2146c13e81', 'PsyD-MA-6622', 'PsyD, Psychology', 'MA', 10),
  ('c16', 'Noah', 'Male', 'Teen Anxiety', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=800', 'Helping teens navigate pressure.', 'r92debe21318', 'LMFT-WA-9921', 'MA, Family Therapy', 'WA', 6),
  ('c17', 'Dr. Patel', 'Female', 'Sleep Insomnia', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800', 'Restoring natural rhythms.', 'rc2146c13e81', 'MD-NY-1102', 'MD, Psychiatry', 'NY', 22),
  ('c18', 'Sofia', 'Female', 'Chronic Pain', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800', 'Mind-body healing.', 're3a705cf66a', 'PhD-CA-1123', 'PhD, Health Psychology', 'CA', 12),
  ('c19', 'Jackson', 'Male', 'Sports Psychology', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800', 'Peak performance mindset.', 'rca8a38779a8', 'PsyD-FL-4421', 'PsyD, Sports Psychology', 'FL', 8),
  ('c20', 'Matthew', 'Male', 'Tech Burnout', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800', 'Restoring digital balance.', 'r92debe21318', 'LMFT-WA-3399', 'MA, Psychology', 'WA', 7),
  ('c21', 'Lucas', 'Male', 'Digital Addiction', 'AVAILABLE', 4.7, 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=800', 'Unplugging for mental health.', 'r92debe21318', 'LCSW-NY-3321', 'MSW, Social Work', 'NY', 6),
  ('c22', 'Isabella', 'Female', 'Grief Counseling', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800', 'Finding light in darkness.', 're3a705cf66a', 'LCSW-NY-1102', 'MSW, Social Work', 'NY', 14),
  ('c23', 'William', 'Male', 'Divorce Recovery', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800', 'Navigating life transitions.', 'rca8a38779a8', 'LMFT-IL-5521', 'MA, Family Therapy', 'IL', 15),
  ('c24', 'Maya', 'Female', 'Cultural Identity', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=800', 'Navigating dual cultures and belonging.', 're3a705cf66a', 'LCSW-CA-1102', 'MSW, Social Work', 'CA', 9),
  ('c25', 'Caleb', 'Male', 'Imposter Syndrome', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800', 'Owning your success with confidence.', 'rca8a38779a8', 'LPC-TX-9921', 'MA, Counseling', 'TX', 7),
  ('c26', 'Chloe', 'Female', 'Pet Loss Grief', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800', 'Honoring the bond with our animal companions.', 'r6ae5b6efc9d', 'LMFT-NY-2210', 'MS, Family Therapy', 'NY', 12),
  ('c27', 'Jordan', 'Male', 'Military Transition', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800', 'From service to civilian life.', 'r92debe21318', 'LCSW-VA-4421', 'MS, Clinical Social Work', 'VA', 16),
  ('c28', 'Layla', 'Female', 'Fertility Support', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800', 'Supporting your path to parenthood.', 're3a705cf66a', 'PhD-CA-8821', 'PhD, Health Psychology', 'CA', 14),
  ('c29', 'Henry', 'Male', 'Retirement Adjustment', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=800', 'Finding purpose in the next chapter.', 'rca8a38779a8', 'LMFT-FL-3321', 'MA, Counseling', 'FL', 25),
  ('c30', 'Nora', 'Female', 'Caregiver Stress', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800', 'Caring for yourself while caring for others.', 'r4317e64d25a', 'LCSW-OH-9912', 'MSW, Social Work', 'OH', 18),
  ('c31', 'Owen', 'Male', 'Gaming Addiction', 'AVAILABLE', 4.7, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800', 'Balancing virtual worlds with reality.', 'r92debe21318', 'LPC-WA-2210', 'MA, Psychology', 'WA', 6),
  ('c32', 'Luna', 'Female', 'Spiritual Crisis', 'AVAILABLE', 5.0, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800', 'Navigating faith transitions and meaning.', 'rc2146c13e81', 'LMFT-OR-5521', 'MA, Transpersonal Psych', 'OR', 11),
  ('c33', 'Gabriel', 'Male', 'Anger Regulation', 'AVAILABLE', 4.8, 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&q=80&w=800', 'Transforming rage into constructive action.', 'rca8a38779a8', 'PsyD-IL-4421', 'PsyD, Clinical Psychology', 'IL', 13),
  ('c34', 'Sophie', 'Female', 'Social Anxiety', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800', 'Building confidence in connection.', 'r6ae5b6efc9d', 'LCSW-NY-3399', 'MSW, Social Work', 'NY', 8),
  ('c35', 'Ethan', 'Male', 'Financial Anxiety', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800', 'Healing your relationship with money.', 'r92debe21318', 'LMFT-CA-2210', 'MA, Financial Therapy', 'CA', 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  gender = EXCLUDED.gender,
  specialty = EXCLUDED.specialty,
  status = EXCLUDED.status,
  rating = EXCLUDED.rating,
  image_url = EXCLUDED.image_url,
  bio = EXCLUDED.bio,
  replica_id = EXCLUDED.replica_id,
  license_number = EXCLUDED.license_number,
  degree = EXCLUDED.degree,
  state_of_practice = EXCLUDED.state_of_practice,
  years_experience = EXCLUDED.years_experience;


-- ==============================================================================
-- 11. SECURITY & ADMIN RPCs
-- ==============================================================================

-- Enable RLS on Global Settings (if not already)
alter table public.global_settings enable row level security;

-- Policy: Allow Read to Everyone
create policy "Global Settings are viewable by everyone"
  on public.global_settings for select
  using (true);

-- Policy: Allow Update to Admins only
create policy "Global Settings are updatable by admins only"
  on public.global_settings for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'ADMIN'
    )
  );

-- RPC: Delete User Account (Security Definer to bypass standard RLS)
-- Note: This deletes from public.users. Auth user deletion requires Service Role or Edge Function.
-- The existing 'on delete cascade' FKs will handle related data.
-- RPC: Delete User Account (Security Definer to bypass standard RLS)
drop function if exists public.delete_user_account(uuid);
create or replace function public.delete_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if requester is ADMIN
  if not exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN') then
    raise exception 'Unauthorized';
  end if;

  -- Prevent Self-Deletion
  if p_user_id = auth.uid() then
    raise exception 'Cannot delete your own admin account.';
  end if;
  
  -- Prevent Deleting other Admins
  if exists (select 1 from public.users where id = p_user_id and role = 'ADMIN') then
     raise exception 'Cannot delete another administrator.';
  end if;

  -- Delete from Public Users (Cascades to content)
  delete from public.users where id = p_user_id;
  
  -- Note: The Auth User (in auth.users) will remain "orphaned" but powerless 
  -- without a public profile, effectively banning them from this app.
  -- Proper cleanup of auth.users requires Supabase Admin API.
end;
$$;


-- RPC: Claim System Access (Master Key Promotion)
drop function if exists public.claim_system_access(uuid, text, text);
create or replace function public.claim_system_access(p_user_id uuid, p_master_key text, p_email text)
returns json
language plpgsql
security definer
as $$
declare
  v_details text;
begin
  -- 1. Validate Master Key (Hardcoded for "Rescue" Mode)
  -- In production, this should check a hashed value in a secure configuration table.
  if p_master_key not in ('PEUTIC_ADMIN_ACCESS_2026', 'peutic-genesis-key') then
    return json_build_object('success', false, 'error', 'Invalid Master Key');
  end if;

  -- 2. Verify User Exists
  if not exists (select 1 from public.users where id = p_user_id) then
     return json_build_object('success', false, 'error', 'User not found in public records');
  end if;

  -- 3. Promote to Admin
  update public.users 
  set role = 'ADMIN' 
  where id = p_user_id;

  -- 4. Log Security Event
  v_details := 'User ' || p_email || ' promoted to ADMIN via Master Key';
  insert into public.system_logs (type, event, details) 
  values ('SECURITY', 'Admin Promoted', v_details);

  return json_build_object('success', true);
end;
$$;

