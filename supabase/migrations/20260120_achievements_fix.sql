-- OPTIMIZATION PATCH: 20260120_achievements_fix.sql
-- Run this to fix the RLS warnings and add the missing index without losing data.

-- 1. Drop old inefficient policies
drop policy if exists "Users can view own achievements" on user_achievements;
drop policy if exists "Users can unlock achievements" on user_achievements;

-- 2. Re-create optimized policies using (select auth.uid())
-- This prevents the database from re-evaluating the user ID Function for every single row.
create policy "Users can view own achievements"
on user_achievements for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can unlock achievements"
on user_achievements for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- 3. Add Missing Index for Foreign Key
-- This was flagged as "Unindexed foreign keys"
create index if not exists idx_user_achievements_achievement_id on user_achievements(achievement_id);
create index if not exists idx_user_achievements_user_id on user_achievements(user_id);
