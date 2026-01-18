-- PEUTIC SYSTEM UPDATE: Cascading Deletion & Cleanup
-- This script ensures that when a user deletes their account, all related metadata is wiped.

-- 0. Ensure Public Users record wipes when Auth User is deleted
ALTER TABLE IF EXISTS public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey,
ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1. Ensure Cascading Deletions for User Metadata

ALTER TABLE IF EXISTS public.journals 
DROP CONSTRAINT IF EXISTS journals_user_id_fkey,
ADD CONSTRAINT journals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_art 
DROP CONSTRAINT IF EXISTS user_art_user_id_fkey,
ADD CONSTRAINT user_art_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.transactions 
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.session_feedback 
DROP CONSTRAINT IF EXISTS session_feedback_user_id_fkey,
ADD CONSTRAINT session_feedback_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.moods 
DROP CONSTRAINT IF EXISTS moods_user_id_fkey,
ADD CONSTRAINT moods_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.active_sessions 
DROP CONSTRAINT IF EXISTS active_sessions_user_id_fkey,
ADD CONSTRAINT active_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.session_queue 
DROP CONSTRAINT IF EXISTS session_queue_user_id_fkey,
ADD CONSTRAINT session_queue_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 2. Create a secure function for account deletion that can be called via Edge Function
-- (To be used with service_role if needed, but RLS allows user to delete own row)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void AS $$
BEGIN
    DELETE FROM public.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions for authenticated users to delete themselves
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;


-- 3. Optimization: Indexing for Speed
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
