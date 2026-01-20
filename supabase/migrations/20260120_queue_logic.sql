-- 20260120_queue_logic.sql
-- Implements Scalable FIFO Queue & Round-Robin Specialist Matching

-- 1. Add Round-Robin Tracking to Companions
ALTER TABLE public.companions ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMPTZ DEFAULT NOW();

-- 2. The Matching Engine (Atomic Function)
CREATE OR REPLACE FUNCTION public.match_session_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_concurrency INT;
    v_current_active INT;
    v_slots_available INT;
    v_user_id UUID;
    v_companion_id UUID;
    r_user RECORD;
BEGIN
    -- A. Get Limits
    SELECT max_concurrent_sessions INTO v_max_concurrency FROM public.global_settings WHERE id = 1;
    SELECT COUNT(*) INTO v_current_active FROM public.active_sessions;
    
    v_slots_available := v_max_concurrency - v_current_active;

    -- B. If no slots, exit early
    IF v_slots_available <= 0 THEN
        RETURN;
    END IF;

    -- C. Loop through available slots
    -- Lock queue rows to prevent race conditions in highly concurrent environments (FOR UPDATE SKIP LOCKED)
    FOR r_user IN 
        SELECT user_id 
        FROM public.session_queue 
        ORDER BY created_at ASC 
        LIMIT v_slots_available
        FOR UPDATE SKIP LOCKED
    LOOP
        -- D. Find Specialist (Round Robin: Longest time since last assignment, and Available)
        SELECT id INTO v_companion_id
        FROM public.companions
        WHERE status = 'AVAILABLE'
        ORDER BY last_assigned_at ASC NULLS FIRST
        LIMIT 1;

        -- If no specialists available, stop matching for now
        IF v_companion_id IS NULL THEN
            EXIT; 
        END IF;

        -- E. Create Session & Move User
        INSERT INTO public.active_sessions (user_id, companion_id, start_time, last_ping)
        VALUES (r_user.user_id, v_companion_id, NOW(), NOW());

        -- F. Update Specialist (Mark as BUSY and update timestamp for rotation)
        UPDATE public.companions 
        SET status = 'BUSY', last_assigned_at = NOW() 
        WHERE id = v_companion_id;

        -- G. Remove from Queue
        DELETE FROM public.session_queue WHERE user_id = r_user.user_id;
        
    END LOOP;
END;
$$;
