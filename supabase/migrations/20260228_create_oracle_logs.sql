CREATE TABLE IF NOT EXISTS oracle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE oracle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own oracle logs" 
ON oracle_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own oracle logs" 
ON oracle_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_oracle_logs_user_id ON oracle_logs(user_id);
