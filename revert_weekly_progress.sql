CREATE OR REPLACE FUNCTION get_weekly_progress(p_user_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_journal_count integer;
    v_mood_count integer;
    v_voice_count integer;
    v_breath_count integer;
    v_minutes_spent integer;
    v_free_actions integer;
BEGIN
    SELECT COUNT(*) INTO v_journal_count
    FROM journals
    WHERE user_id = p_user_id
    AND date >= date_trunc('week', current_date);

    SELECT COUNT(*) INTO v_mood_count
    FROM moods
    WHERE user_id = p_user_id
    AND date >= date_trunc('week', current_date);

    SELECT COUNT(*) INTO v_voice_count
    FROM voice_journals
    WHERE user_id = p_user_id
    AND created_at >= date_trunc('week', current_date);

    SELECT COUNT(*) INTO v_breath_count
    FROM breath_logs
    WHERE user_id = p_user_id
    AND date >= date_trunc('week', current_date);

    SELECT COUNT(*) INTO v_minutes_spent
    FROM transactions
    WHERE user_id = p_user_id
    AND amount < 0
    AND date >= date_trunc('week', current_date);

    -- Reverted back to 1 point per action without any multipliers or 0.5 fractions
    v_free_actions := v_journal_count + v_mood_count + v_voice_count + v_breath_count;
    
    RETURN v_free_actions + v_minutes_spent;
END;
$$;
