-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  name text not null,
  role text default 'USER'::text,
  balance integer default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  avatar text,
  theme_preference text default 'light',
  language_preference text default 'en',
  unlocked_rooms text[] default array[]::text[],
  metadata jsonb default '{}'::jsonb
);

-- 2. COMPANIONS TABLE
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
  years_experience integer,
  
  -- Constraint to ensure status is valid
  constraint valid_status check (status in ('AVAILABLE', 'BUSY', 'OFFLINE'))
);

-- 3. SESSIONS TABLE
create table public.sessions (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  companion_id text references public.companions(id),
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  duration integer,
  cost integer,
  status text default 'COMPLETED',
  notes text,
  
  -- Constraint for valid status
  constraint valid_session_status check (status in ('COMPLETED', 'CANCELLED', 'FAILED'))
);

-- 4. JOURNAL ENTRIES TABLE (Voice & Text)
create table public.journal_entries (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text default 'text', -- 'text' or 'voice'
  content text, -- text content or voice transcript
  audio_url text, -- for voice entries
  mood text, -- associated mood
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint valid_entry_type check (type in ('text', 'voice'))
);

-- 5. MOOD LOGS TABLE
create table public.mood_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  mood text not null,
  note text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. GARDEN STATE TABLE
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

-- 7. PETS TABLE (Lumina)
create table public.pets (
  user_id uuid references public.users(id) on delete cascade primary key,
  name text default 'Lumina',
  hunger integer default 50,
  happiness integer default 50,
  energy integer default 50,
  level integer default 1,
  last_fed timestamp with time zone,
  last_played timestamp with time zone
);

-- 8. ACHIEVEMENTS TABLE
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_user_achievement unique (user_id, achievement_id)
);

-- 9. SYSTEM LOGS TABLE (For debugging/auditing)
create table public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  level text not null, -- 'INFO', 'WARN', 'ERROR'
  message text not null,
  details jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. GLOBAL SETTINGS TABLE
create table public.global_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.companions enable row level security;
alter table public.sessions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.mood_logs enable row level security;
alter table public.garden_state enable row level security;
alter table public.pets enable row level security;
alter table public.achievements enable row level security;
alter table public.global_settings enable row level security;

-- POLICIES

-- Users
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
-- Admin override (Admins can view all users)
create policy "Admins can view all users" on public.users for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- Companions (Public read, Admin write)
create policy "Everyone can view companions" on public.companions for select using (true);
create policy "Admins can update companions" on public.companions for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- Sessions
create policy "Users can view own sessions" on public.sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.sessions for insert with check (auth.uid() = user_id);

-- Journal Entries
create policy "Users can manage own journal" on public.journal_entries for all using (auth.uid() = user_id);

-- Mood Logs
create policy "Users can manage own mood" on public.mood_logs for all using (auth.uid() = user_id);

-- Garden State
create policy "Users can manage own garden" on public.garden_state for all using (auth.uid() = user_id);

-- Pets
create policy "Users can manage own pet" on public.pets for all using (auth.uid() = user_id);

-- Achievements
create policy "Users can view own achievements" on public.achievements for select using (auth.uid() = user_id);

-- Global Settings (Public read, Admin insert/update)
create policy "Everyone can view settings" on public.global_settings for select using (true);
create policy "Admins can manage settings" on public.global_settings for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- TRIGGER: Handle New User
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  -- Check if this is the very first user
  select count(*) = 0 into is_first_user from public.users;

  insert into public.users (id, email, name, role, balance, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'New Member'),
    case when is_first_user then 'ADMIN' else 'USER' end, -- First user becomes ADMIN
    0, -- Initial balance
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Initialize Garden
  insert into public.garden_state (user_id) values (new.id);
  
  -- Initialize Pet
  insert into public.pets (user_id) values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- FUNCTION: Cleanup Stale Sessions (Maintenance)
create or replace function cleanup_stale_sessions()
returns void as $$
begin
  -- Example: Remove failed sessions older than 24 hours
  delete from public.sessions 
  where status = 'FAILED' and start_time < now() - interval '24 hours';
end;
$$ language plpgsql;

-- SEED DATA: Companions (The Correct 35 Roster including Ruby)
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

-- SEED DATA: Global Settings
insert into public.global_settings (key, value)
values 
  ('maintenance_mode', '{"enabled": false, "message": "System under maintenance"}'::jsonb),
  ('dashboard_broadcast', '{"message": "Welcome to the new streamlined platform!", "active": true}'::jsonb)
on conflict (key) do nothing;
