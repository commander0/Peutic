-- 100_launch_indexes.sql
-- Description: Adds essential indexes to foreign keys to prevent sequential scans under load.

-- Journals
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);

-- Moods
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);

-- Pocket Pets (Lumina)
CREATE INDEX IF NOT EXISTS idx_pocket_pets_user_id ON pocket_pets(user_id);

-- Garden
CREATE INDEX IF NOT EXISTS idx_garden_log_user_id ON garden_log(user_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- User Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Voice Journals
CREATE INDEX IF NOT EXISTS idx_voice_journals_user_id ON voice_journals(user_id);
