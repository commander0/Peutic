-- Migration: Create safety_alerts table
CREATE TABLE IF NOT EXISTS safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'JOURNAL', 'WISDOM_INPUT', 'AI_PROMPT'
    content TEXT NOT NULL,
    flagged_keywords TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for foreign key performance
CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON safety_alerts(user_id);

-- Enable RLS
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;

-- Only Admins can view safety alerts (Optimized for performance)
DROP POLICY IF EXISTS "Admins can view safety alerts" ON safety_alerts;
CREATE POLICY "Admins can view safety alerts" 
ON safety_alerts FOR SELECT 
TO authenticated 
USING (
    (SELECT role FROM users WHERE id = (SELECT auth.uid())) = 'ADMIN'
);

-- Users can trigger their own alerts (Security hardened)
DROP POLICY IF EXISTS "Users can trigger their own alerts (for gateway)" ON safety_alerts;
CREATE POLICY "Users can trigger their own alerts (for gateway)" 
ON safety_alerts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (SELECT auth.uid()));
