-- MERGED & FINALIZED SCHEMA
-- Combines current App requirements with robust legacy logic (Auto-Admin, Zombies, Heartbeats)

create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron"; -- Optional, but good for cleanup if available

-- 0. CLEANUP & RESET
drop table if exists public.user_achievements cascade;
drop table if exists public.transactions cascade;
drop table if exists public.journals cascade;
drop table if exists public.voice_journals cascade;
drop table if exists public.moods cascade;
drop table if exists public.user_art cascade;
drop table if exists public.feedback cascade;
drop table if exists public.garden_state cascade;
drop table if exists public.pocket_pets cascade;
drop table if exists public.active_sessions cascade;
drop table if exists public.session_queue cascade;
drop table if exists public.users cascade; -- Canonical table
drop table if exists public.profiles cascade; -- Legacy cleanup
drop table if exists public.companions cascade;
drop table if exists public.achievements cascade;
drop table if exists public.system_logs cascade;
drop table if exists public.global_settings cascade;
drop table if exists public.promo_codes cascade;

-- 1. USERS (The Single Source of Truth)
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
  theme_preference text default 'light',
  language_preference text default 'en',
  game_scores jsonb default '{"match": 0, "cloud": 0}'::jsonb,
  unlocked_rooms text[] default array[]::text[],
  birthday text,
  metadata jsonb default '{}'::jsonb
);

-- 2. COMPANIONS (Verified Roster)
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

-- 3. TRANSACTIONS (Ledger)
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

-- 4. PROMO CODES (Restored from Legacy)
create table public.promo_codes (
    id uuid default uuid_generate_v4() primary key,
    code text unique,
    discount_percentage numeric,
    uses integer default 0,
    active boolean default true
);

-- 5. CONTENT TABLES
create table public.journals (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.voice_journals (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references public.users(id) on delete cascade not null,
  audio_url text not null,
  duration_seconds integer,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  mood text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.user_art (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  title text,
  prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  companion_name text,
  rating integer,
  tags text[],
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  duration integer
);

-- 6. GAMIFICATION
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

-- 7. SESSION MANAGEMENT (Enhanced with Legacy Columns)
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

-- 8. SYSTEM
create table public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null,
  event text not null,
  details text
);

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


-- RLS POLICIES ----------------------------
alter table public.users enable row level security;
alter table public.companions enable row level security;
alter table public.transactions enable row level security;
alter table public.journals enable row level security;
alter table public.voice_journals enable row level security;
alter table public.moods enable row level security;
alter table public.user_art enable row level security;
alter table public.feedback enable row level security;
alter table public.garden_state enable row level security;
alter table public.pocket_pets enable row level security;
alter table public.active_sessions enable row level security;
alter table public.session_queue enable row level security;
alter table public.system_logs enable row level security;
alter table public.global_settings enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.promo_codes enable row level security;

-- Admin Checks (Legacy robust style)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users 
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- Admin Policies
create policy "Admin All" on public.users for all using (public.is_admin());
create policy "Admin Companions" on public.companions for all using (public.is_admin());
create policy "Admin Settings" on public.global_settings for all using (public.is_admin());
create policy "Admin Logs" on public.system_logs for all using (public.is_admin());
create policy "Admin Promo" on public.promo_codes for all using (public.is_admin());
create policy "Admin Achievements" on public.achievements for all using (public.is_admin());

-- Public/User Policies
create policy "Public companions" on public.companions for select using (true);
create policy "Public settings" on public.global_settings for select using (true);
create policy "Public achievements" on public.achievements for select using (true);

create policy "User own profile" on public.users for all using (auth.uid() = id);
create policy "User own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "User own journals" on public.journals for all using (auth.uid() = user_id);
create policy "User own voice" on public.voice_journals for all using (auth.uid() = user_id);
create policy "User own moods" on public.moods for all using (auth.uid() = user_id);
create policy "User own art" on public.user_art for all using (auth.uid() = user_id);
create policy "User own garden" on public.garden_state for all using (auth.uid() = user_id);
create policy "User own pet" on public.pocket_pets for all using (auth.uid() = user_id);
create policy "User own feedback" on public.feedback for insert with check (auth.uid() = user_id);

create policy "User queue self" on public.session_queue for all using (auth.uid() = user_id);
create policy "User session self" on public.active_sessions for all using (auth.uid() = user_id);

create policy "User own achievements" on public.user_achievements for select using (auth.uid() = user_id);
create policy "User unlock achievements" on public.user_achievements for insert with check (auth.uid() = user_id);


-- ADVANCED RPC FUNCTIONS (Merged from Legacy) ----------------

-- 1. SMART USER CREATION (First User = Admin)
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer set search_path = public
as $$
begin
  begin
      insert into public.users (id, email, name, role, balance, subscription_status)
      values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        -- FIRST USER IS ADMIN logic
        case when (select count(*) from public.users) = 0 then 'ADMIN' else 'USER' end,
        0,
        'ACTIVE'
      );
  exception when others then
      -- Safety: If trigger fails, Log it but ALLOW auth.users to be created.
      -- This ensures 'claim_system_access' can self-heal the missing profile.
      raise warning 'handle_new_user trigger failed: %', SQLERRM;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ... (Previous Functions) ...

-- 4. SYSTEM ACCESS (Manual Claim Backup)
create or replace function check_admin_exists()
returns boolean 
language plpgsql 
security definer set search_path = public
as $$
begin
    return exists (select 1 from public.users where role = 'ADMIN');
end;
$$;

create or replace function claim_system_access(p_user_id uuid, p_master_key text, p_email text)
returns boolean 
language plpgsql 
security definer set search_path = public
as $$
begin
    if p_master_key = 'PEUTIC_ADMIN_ACCESS_2026' then
        -- UPSERT / RESTORE Logic (Self-Healing)
        insert into public.users (id, email, name, role, created_at)
        values (
            p_user_id, 
            p_email, 
            'Root Admin',
            'ADMIN',
            now()
        )
        on conflict (id) do update set role = 'ADMIN', email = excluded.email;
        
        return true;
    end if;
    return false;
end;
$$;

create or replace function reset_system_ownership(p_master_key text)
returns boolean as $$
begin
    if p_master_key = 'PEUTIC_ADMIN_ACCESS_2026' then
        update public.users set role = 'USER' where role = 'ADMIN';
        return true;
    end if;
    return false;
end;
$$ language plpgsql security definer;

create or replace function request_account_deletion()
returns void as $$
begin
    delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;


-- SEED DATA -----------------------------------------------

-- Companions
truncate table public.companions;
insert into public.companions (id, name, gender, specialty, status, rating, image_url, bio, replica_id, license_number, degree, state_of_practice, years_experience) 
values 
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
    ('c35', 'Ethan', 'Male', 'Financial Anxiety', 'AVAILABLE', 4.9, 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&q=80&w=800', 'Healing your relationship with money.', 'r92debe21318', 'LMFT-CA-2210', 'MA, Financial Therapy', 'CA', 10);

-- Achievements
insert into public.achievements (id, code, title, icon) values 
  ('ach1', 'FIRST_STEP', 'First Step', 'footprints'),
  ('ach2', 'STREAK_3', '3 Day Streak', 'flame'),
  ('ach3', 'STREAK_7', 'Week Warrior', 'trophy'),
  ('ach4', 'GARDEN_5', 'Green Thumb', 'leaf'),
  ('ach5', 'ANIMA_5', 'Soul Bond', 'heart'),
  ('ach6', 'JOURNAL_5', 'Reflective Mind', 'book');

-- Settings
insert into public.global_settings (id, sale_mode, broadcast_message, maintenance_mode, allow_signups, site_name, max_concurrent_sessions, multilingual_mode) 
values (1, false, null, false, true, 'Peutic', 15, true) 
on conflict (id) do update 
set maintenance_mode = excluded.maintenance_mode, sale_mode = excluded.sale_mode;
