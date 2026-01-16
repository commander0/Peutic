-- Add game_scores column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS game_scores JSONB DEFAULT '{"match": 0, "cloud": 0}';

-- Update existing users to have default scores if null
UPDATE public.users SET game_scores = '{"match": 0, "cloud": 0}' WHERE game_scores IS NULL;
