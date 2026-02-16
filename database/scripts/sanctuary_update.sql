
-- ==============================================================================
-- SANCTUARY PATCH (Run this if unified_schema.sql fails on storage permissions)
-- ==============================================================================

-- 11.1 ZEN DOJO SESSIONS (Persistent Focus)
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  duration_seconds int not null,
  completed_at timestamptz default now(),
  mode text check (mode in ('FOCUS', 'BREAK')) default 'FOCUS'
);

-- RLS
alter table public.focus_sessions enable row level security;

-- SAFE POLICY CREATION (Idempotent)
do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'focus_sessions' and policyname = 'User Manage Focus') then
    create policy "User Manage Focus" on public.focus_sessions for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_focus_sessions_completed_at on public.focus_sessions(completed_at desc);


-- 11.2 DREAM LOGS (Observatory Archives)
create table if not exists public.dream_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  lucidity_level int check (lucidity_level between 1 and 5),
  sleep_quality text check (sleep_quality in ('Restful', 'Average', 'Poor')),
  created_at timestamptz default now()
);

-- RLS
alter table public.dream_logs enable row level security;

-- SAFE POLICY CREATION (Idempotent)
do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'dream_logs' and policyname = 'User Manage Dreams') then
    create policy "User Manage Dreams" on public.dream_logs for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_dream_logs_user_id on public.dream_logs(user_id);
create index if not exists idx_dream_logs_created_at on public.dream_logs(created_at desc);
