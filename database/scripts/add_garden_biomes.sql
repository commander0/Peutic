-- ==============================================================================
-- PEUTIC OS: INNER GARDEN BIOMES PERSISTENCE
-- Purpose: Adds the harvested_plants column to track fully grown trees that
-- the user clips, so they persist in the background biome.
-- Instructions: Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Add array column to store the history of clipped plants
ALTER TABLE public.garden_log ADD COLUMN IF NOT EXISTS harvested_plants TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Update the harvest/clip RPC to append the plant before resetting
DROP FUNCTION IF EXISTS clip_garden(uuid);
CREATE OR REPLACE FUNCTION clip_garden(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_garden public.garden_log;
BEGIN
  -- Append to harvested_plants and Reset Gamification state
  UPDATE public.garden_log
  SET harvested_plants = array_append(harvested_plants, current_plant_type),
      focus_minutes = 0,
      level = 1,
      last_clipped_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_garden;
  
  RETURN jsonb_build_object(
    'success', true, 
    'prize', 50, 
    'quote', 'You have harvested your sanctuary.'
  );
END;
$$;
