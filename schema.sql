-- USERS TABLE
create table public.users (
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
  unlocked_rooms jsonb default '[]', -- New: Stores ['observatory', 'dojo', etc.]
  gamification_enabled boolean default true
);

-- JOURNALS
create table public.journals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  content text
);

-- MOODS
create table public.moods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  mood text -- 'confetti', 'rain', etc.
);

-- TRANSACTIONS
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  date timestamp with time zone default timezone('utc'::text, now()),
  amount integer, -- Can be negative for deductions
  cost numeric, -- Real currency cost if applicable
  description text,
  status text default 'COMPLETED'
);

-- USER ART
create table public.user_art (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  image_url text,
  prompt text,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- VOICE JOURNALS
create table public.voice_journals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  audio_url text,
  duration_seconds integer,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- GARDEN STATE
create table public.garden_state (
  user_id uuid references public.users(id) on delete cascade primary key,
  level integer default 1,
  current_plant_type text default 'Lotus',
  water_level integer default 50,
  last_watered_at timestamp with time zone,
  streak_current integer default 0,
  streak_best integer default 0
);

-- POCKET PETS (LUMINA)
create table public.pocket_pets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  species text, -- 'Holo-Hamu', etc.
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

-- ACHIEVEMENTS DEF
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  code text unique,
  title text,
  description text,
  icon_name text,
  xp_reward integer
);

-- USER ACHIEVEMENTS
create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  achievement_id uuid references public.achievements(id) on delete cascade,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, achievement_id)
);

-- FEEDBACK
create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  companion_name text,
  rating integer,
  tags text[],
  date timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security) basics
alter table public.users enable row level security;
create policy "Users can view own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);

-- (Repeat RLS for other tables ideally)
