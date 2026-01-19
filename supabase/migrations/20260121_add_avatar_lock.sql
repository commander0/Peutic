-- Add avatar_locked column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_locked BOOLEAN DEFAULT FALSE;
