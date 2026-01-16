-- Add game_scores column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'game_scores') THEN
        ALTER TABLE public.users ADD COLUMN game_scores JSONB DEFAULT '{"match": 0, "cloud": 0}';
    END IF;
END $$;

-- Drop and recreate the Unified Users Update policy to ensure it allows updating game_scores
DROP POLICY IF EXISTS "Unified Users Update" ON public.users;

CREATE POLICY "Unified Users Update"
  ON public.users FOR UPDATE
  USING (
    (select auth.uid()) = id 
    OR 
    public.is_admin()
  );

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
