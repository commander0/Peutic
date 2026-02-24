-- Supabase Schema Sync
-- Run this in your Supabase SQL Editor to ensure all tables are up to date for V3

-- 1. Ensure pocket_pets exists for Lumina
CREATE TABLE IF NOT EXISTS pocket_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    health FLOAT DEFAULT 100,
    hunger FLOAT DEFAULT 100,
    happiness FLOAT DEFAULT 100,
    cleanliness FLOAT DEFAULT 100,
    energy FLOAT DEFAULT 100,
    is_sleeping BOOLEAN DEFAULT false,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- 2. Ensure voice_journal exists
CREATE TABLE IF NOT EXISTS voice_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Ensure users table has game_scores JSONB column
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_scores JSONB DEFAULT '{"cloud": 0, "match": 0}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_achievements TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS garden_state JSONB;

-- 4. Enable RLS on pocket_pets
ALTER TABLE pocket_pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own pets" ON pocket_pets;
CREATE POLICY "Users can manage their own pets" ON pocket_pets
    FOR ALL USING (auth.uid() = user_id);

-- 5. Enable RLS on voice_journal
ALTER TABLE voice_journal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own voice journals" ON voice_journal;
CREATE POLICY "Users can manage their own voice journals" ON voice_journal
    FOR ALL USING (auth.uid() = user_id);
