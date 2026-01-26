-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RESET SCHEMA (Use CAUTION in Production)
DROP TABLE IF EXISTS safety_alerts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS garden_states CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS voice_journal CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS companions CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'USER', -- 'USER', 'ADMIN', 'MODERATOR'
    balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    theme_preference TEXT DEFAULT 'light',
    unlocked_rooms TEXT[] DEFAULT '{}', -- Array of room IDs like 'observatory', 'dojo'
    settings JSONB DEFAULT '{}'
);

-- 2. GLOBAL SETTINGS (Admin Control)
CREATE TABLE global_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_mode BOOLEAN DEFAULT FALSE,
    broadcast_message TEXT,
    dashboard_broadcast_message TEXT,
    max_concurrent_sessions INTEGER DEFAULT 15,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COMPANIONS (The Specialists)
CREATE TABLE companions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bio TEXT,
    specialty TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BUSY', 'OFFLINE'
    rating NUMERIC(2,1) DEFAULT 5.0,
    years_experience INTEGER DEFAULT 1,
    degree TEXT
);

-- 4. INTERACTIONS (Session Logs)
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    companion_id UUID REFERENCES companions(id),
    type TEXT NOT NULL, -- 'chat', 'video', 'voice'
    duration_seconds INTEGER DEFAULT 0,
    cost INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 5. JOURNAL ENTRIES (Text)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT TRUE
);

-- 6. VOICE JOURNAL (Audio Blobs/URLs)
CREATE TABLE voice_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MOOD ENTRIES
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood TEXT NOT NULL, -- 'happy', 'sad', 'anxious', 'neutral', 'confetti', 'rain'
    intensity INTEGER DEFAULT 1, -- 1-5 scale
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. GARDEN STATE
CREATE TABLE garden_states (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    water_level INTEGER DEFAULT 50, -- 0-100
    sunlight_level INTEGER DEFAULT 50, -- 0-100
    growth_points INTEGER DEFAULT 0,
    current_plant_type TEXT DEFAULT 'Sprout',
    last_watered_at TIMESTAMP WITH TIME ZONE,
    unlocked_plants TEXT[] DEFAULT '{Sprout}'
);

-- 9. PETS (Lumina / Anima)
CREATE TABLE pets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT DEFAULT 'Holo-Hamu',
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    hunger INTEGER DEFAULT 50, -- 0-100
    happiness INTEGER DEFAULT 50, -- 0-100
    cleanliness INTEGER DEFAULT 50, -- 0-100
    energy INTEGER DEFAULT 100, -- 0-100
    is_sleeping BOOLEAN DEFAULT FALSE,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TRANSACTIONS (Wallet History)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for credit, negative for debit
    description TEXT,
    stripe_payment_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SAFETY ALERTS (Admin Dashboard)
CREATE TABLE safety_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    trigger_keyword TEXT,
    context TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;

-- 1. USERS
CREATE POLICY "Users view own data" ON users FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING ((select auth.uid()) = id);

-- 2. JOURNAL
CREATE POLICY "Users view own journal" ON journal_entries FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own journal" ON journal_entries FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own journal" ON journal_entries FOR DELETE USING ((select auth.uid()) = user_id);

-- 3. GARDEN
CREATE POLICY "Users view own garden" ON garden_states FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users update own garden" ON garden_states FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own garden" ON garden_states FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 4. PETS
CREATE POLICY "Users view own pet" ON pets FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users update own pet" ON pets FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own pet" ON pets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 5. INTERACTIONS
CREATE POLICY "Users view own interactions" ON interactions FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own interactions" ON interactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 6. VOICE JOURNAL
CREATE POLICY "Users view own voice" ON voice_journal FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own voice" ON voice_journal FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own voice" ON voice_journal FOR DELETE USING ((select auth.uid()) = user_id);

-- 7. MOOD ENTRIES
CREATE POLICY "Users view own mood" ON mood_entries FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own mood" ON mood_entries FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 8. TRANSACTIONS
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own transactions" ON transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 9. COMPANIONS (Public Read)
CREATE POLICY "Public view companions" ON companions FOR SELECT USING (true);

-- 10. GLOBAL SETTINGS (Public Read)
CREATE POLICY "Public view settings" ON global_settings FOR SELECT USING (true);

-- 11. SAFETY ALERTS (Admin only usually, but allowing insert for now)
CREATE POLICY "Users insert alerts" ON safety_alerts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_companion ON interactions(companion_id);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_user ON voice_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_user ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_user ON garden_states(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON safety_alerts(user_id);

-- SEED DATA: Global Settings
INSERT INTO global_settings (max_concurrent_sessions, broadcast_message) 
VALUES (15, 'Welcome to the New Era of Digital Wellness.');

-- SEED DATA: Companions
INSERT INTO companions (name, specialty, bio, rating, years_experience, degree, status) VALUES 
('Dr. Aeliana', 'CBT & Mindfulness', 'Specializing in cognitive reframing and grounded presence.', 4.9, 8, 'Ph.D. Psychology', 'AVAILABLE'),
('Kai', 'Life Coaching', 'Focus on actionable goals and momentum building.', 4.8, 5, 'ICF Certified', 'AVAILABLE'),
('Elder Thorne', 'Grief & Trauma', 'A gentle guide through the darker valleys of life.', 5.0, 12, 'LCSW', 'BUSY');

-- SEED DATA: Admin User (Example)
-- INSERT INTO users (email, name, role, balance) VALUES ('admin@peutic.com', 'System Admin', 'ADMIN', 99999);
