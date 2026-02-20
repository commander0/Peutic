-- 102_garden_focus_minutes.sql
-- Description: Adds 'focus_minutes' to 'garden_log' and an RPC to safely increment it.

-- 1. Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'garden_log' AND column_name = 'focus_minutes') THEN
        ALTER TABLE public.garden_log ADD COLUMN focus_minutes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create RPC to safely add minutes and auto-level the garden
CREATE OR REPLACE FUNCTION public.add_garden_focus_minutes(p_user_id UUID, p_minutes INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_minutes INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Increment minutes
    UPDATE public.garden_log
    SET focus_minutes = focus_minutes + p_minutes
    WHERE user_id = p_user_id
    RETURNING focus_minutes INTO v_current_minutes;

    -- Calculate level based on minutes (Tiered SVG Logic)
    -- Level 1: < 5 mins (Seedling)
    -- Level 2: >= 5 mins (Sapling)
    -- Level 3: >= 15 mins (Full Bloom)
    IF v_current_minutes >= 15 THEN
        v_new_level := 3;
    ELSIF v_current_minutes >= 5 THEN
        v_new_level := 2;
    ELSE
        v_new_level := 1;
    END IF;

    -- Update level if needed, but don't downgrade
    UPDATE public.garden_log
    SET level = GREATEST(level, v_new_level)
    WHERE user_id = p_user_id;

END;
$$;
