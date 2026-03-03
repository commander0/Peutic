-- Removes the moods table from the get_weekly_progress counting function.
CREATE OR REPLACE FUNCTION public.get_weekly_progress(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    start_of_week TIMESTAMP WITH TIME ZONE;
    v_joined_at TIMESTAMP WITH TIME ZONE;
    weeks_since_join INTEGER;
    j_count INTEGER;
    v_count INTEGER;
    b_count INTEGER;
    t_count INTEGER;
BEGIN
    SELECT "joinedAt" INTO v_joined_at FROM public.users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    weeks_since_join := EXTRACT(EPOCH FROM (NOW() - v_joined_at)) / (7 * 24 * 60 * 60);
    start_of_week := v_joined_at + (weeks_since_join * interval '1 week');

    SELECT COUNT(*) INTO j_count FROM public.journals WHERE user_id = p_user_id AND date >= start_of_week;
    SELECT COUNT(*) INTO v_count FROM public.voice_journals WHERE user_id = p_user_id AND created_at >= start_of_week;
    SELECT COUNT(*) INTO b_count FROM public.breath_logs WHERE user_id = p_user_id AND date >= start_of_week;
    
    SELECT COUNT(*) INTO t_count FROM public.transactions WHERE user_id = p_user_id AND date >= start_of_week AND amount < 0;

    RETURN j_count + v_count + b_count + t_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
