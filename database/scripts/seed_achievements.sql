-- Seed Achievements
-- Run this in your Supabase SQL Editor

INSERT INTO public.achievements (code, title, description, icon, xp_reward)
VALUES
    ('FIRST_STEP', 'First Step', 'Begin your journey.', 'Flag', 10),
    ('STREAK_3', 'Consistency is Key', 'Login for 3 days in a row.', 'Zap', 50),
    ('STREAK_7', 'Unstoppable', 'Login for 7 days in a row.', 'Zap', 150),
    ('GARDEN_5', 'Green Thumb', 'Reach Garden Level 5.', 'Leaf', 100),
    ('ANIMA_5', 'Soul Bond', 'Reach Pet Level 5.', 'Heart', 100),
    ('JOURNAL_5', 'Dear Diary', 'Write 5 Journal Entries.', 'BookOpen', 50),
    ('WEALTHY_100', 'Abundance', 'Accumulate 100 minutes.', 'Crown', 100),
    ('EXPLORER', 'Explorer', 'Unlock a new Sanctuary room.', 'MapPin', 75),
    ('CLEAR_MIND', 'Clear Mind', 'Shred a negative thought.', 'Wind', 25)
ON CONFLICT (code) DO NOTHING;
