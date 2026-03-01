CREATE OR REPLACE FUNCTION complete_flow_state(
  p_user_id UUID,
  p_duration_seconds INT,
  p_mode TEXT
) RETURNS JSONB AS $$
DECLARE
  v_minutes INT;
  v_xp_gain INT;
BEGIN
  -- Prevent negative durations (cheat check)
  IF p_duration_seconds < 0 THEN
    RAISE EXCEPTION 'Invalid duration';
  END IF;

  v_minutes := p_duration_seconds / 60;
  
  -- 1. Record the session
  INSERT INTO focus_sessions (user_id, duration_seconds, mode, completed_at)
  VALUES (p_user_id, p_duration_seconds, p_mode, NOW());

  -- 2. Update Garden focus minutes atomically
  UPDATE garden_log
  SET focus_minutes = COALESCE(focus_minutes, 0) + v_minutes
  WHERE user_id = p_user_id;

  -- 3. Award XP/Balance (Dojo gives 50 base XP)
  v_xp_gain := 50;
  
  UPDATE users
  SET balance = COALESCE(balance, 0) + v_xp_gain
  WHERE id = p_user_id;

  -- Insert ledger transaction
  INSERT INTO transactions (id, user_id, amount, cost, description, status, date)
  VALUES (
    gen_random_uuid(), 
    p_user_id, 
    v_xp_gain, 
    0, 
    'Focus Session Complete (' || v_minutes || 'm)', 
    'completed',
    NOW()
  );
  
  RETURN json_build_object(
     'success', true,
     'minutes_added', v_minutes,
     'xp_gained', v_xp_gain
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
     'success', false,
     'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
