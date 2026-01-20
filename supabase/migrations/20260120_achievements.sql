-- Create Achievements Table
create table if not exists achievements (
  id uuid default gen_random_uuid() primary key,
  code text not null unique, -- e.g., 'STREAK_7', 'GARDEN_5'
  title text not null,
  description text not null,
  icon_name text not null, -- Lucide icon name or internal asset ID
  xp_reward integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table achievements enable row level security;

-- Policy: Everyone can read achievements
create policy "Achievements are viewable by everyone"
on achievements for select
to authenticated
using (true);

-- Create User Achievements (Unlock) Table
create table if not exists user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  achievement_id uuid references achievements(id) not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- Enable RLS
alter table user_achievements enable row level security;

-- Policy: Users can view their own unlocked achievements
-- Optimized with (select auth.uid()) to prevent per-row re-evaluation
create policy "Users can view own achievements"
on user_achievements for select
to authenticated
using ((select auth.uid()) = user_id);

-- Policy: Users can unlock achievements
create policy "Users can unlock achievements"
on user_achievements for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Performance Indexes
create index if not exists idx_user_achievements_achievement_id on user_achievements(achievement_id);
create index if not exists idx_user_achievements_user_id on user_achievements(user_id);

-- Seed Data (Initial Achievements)
insert into achievements (code, title, description, icon_name, xp_reward)
values
  ('FIRST_STEP', 'First Step', 'Log in for the first time.', 'Footprints', 10),
  ('STREAK_3', 'Momentum', 'Login for 3 days in a row.', 'Flame', 50),
  ('STREAK_7', 'Dedicated', 'Login for 7 days in a row.', 'Zap', 100),
  ('GARDEN_5', 'Green Thumb', 'Reach Garden Level 5.', 'Sprout', 150),
  ('ANIMA_5', 'Soul Bond', 'Reach Anima Level 5.', 'Heart', 150),
  ('JOURNAL_5', 'Voice of Truth', 'Record 5 Voice Journals.', 'Mic', 75)
on conflict (code) do nothing;
