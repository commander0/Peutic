-- Seed Additional Achievements
insert into achievements (code, title, description, icon_name, xp_reward)
values
  ('WEALTHY_100', 'Abundance', 'Accumulate a balance of 100m.', 'Star', 50),
  ('EXPLORER', 'Seeker', 'Unlock a Sanctuary Room.', 'Zap', 25),
  ('SESSION_1', 'Connection', 'Complete your first session.', 'Heart', 20)
on conflict (code) do nothing;
