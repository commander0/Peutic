-- ==============================================================================
-- PEUTIC OS: INNER GARDEN GAMIFICATION REPAIR
-- Purpose: Adds the missing `focus_minutes` tracking column and necessary RPC
-- functions to ensure the garden actually grows and shrinks correctly.
-- Instructions: Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Ensure the Gamification Column exists
ALTER TABLE public.garden_log ADD COLUMN IF NOT EXISTS focus_minutes integer default 0;

-- 2. Create the exact RPC called by the frontend to accumulate visual growth
DROP FUNCTION IF EXISTS add_garden_focus_minutes(uuid, integer);
CREATE OR REPLACE FUNCTION add_garden_focus_minutes(p_user_id uuid, p_minutes integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.garden_log
  SET focus_minutes = GREATEST(0, focus_minutes + p_minutes) -- Prevent negatives if they water too much? Wait, frontend deducts balance but adds focus minutes.
  WHERE user_id = p_user_id;
END;
$$;

-- 3. Create the water plant RPC
DROP FUNCTION IF EXISTS water_garden(uuid, integer);
CREATE OR REPLACE FUNCTION water_garden(p_user_id uuid, p_intensity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_garden public.garden_log;
BEGIN
  UPDATE public.garden_log
  SET water_level = LEAST(100, water_level + (p_intensity * 20)),
      last_watered_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_garden;
  
  RETURN jsonb_build_object('garden', row_to_json(v_garden));
END;
$$;

-- 4. Create the harvest/clip RPC
DROP FUNCTION IF EXISTS clip_garden(uuid);
CREATE OR REPLACE FUNCTION clip_garden(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_garden public.garden_log;
BEGIN
  -- Reset Gamification state
  UPDATE public.garden_log
  SET focus_minutes = 0,
      level = 1,
      last_clipped_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_garden;
  
  RETURN jsonb_build_object(
    'success', true, 
    'prize', 50, 
    'quote', 'You have harvest your sanctuary. The seeds return to the earth.'
  );
END;
$$;
