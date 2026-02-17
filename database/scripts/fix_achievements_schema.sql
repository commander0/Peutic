-- Fix Achievements Table Schema
-- 1. Add missing xp_reward column
-- 2. Add default value for ID generation

ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 0;

ALTER TABLE public.achievements 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Re-apply RLS just in case
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'achievements' 
        AND policyname = 'Public Read Achievs'
    ) THEN
        CREATE POLICY "Public Read Achievs" ON public.achievements FOR SELECT USING (true);
    END IF;
END
$$;
