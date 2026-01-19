-- Create table for Voice Journals
create table if not exists public.voice_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  audio_url text not null,
  duration_seconds integer not null default 0,
  title text default 'Audio Note',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.voice_journals enable row level security;

-- Index for performance
create index if not exists idx_voice_journals_user_id on public.voice_journals(user_id);

-- Policies
create policy "Users can view own voice journals"
  on public.voice_journals for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own voice journals"
  on public.voice_journals for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own voice journals"
  on public.voice_journals for delete
  using ((select auth.uid()) = user_id);
