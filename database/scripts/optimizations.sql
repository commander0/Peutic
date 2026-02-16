-- OPTIMIZATION: Move Core Logic to Database (RPCs)
-- Reason: Reduces client-side CPU usage and network payloads.

-- 1. GARDEN EVOLUTION LOGIC
create or replace function public.water_garden(p_user_id uuid, p_intensity int default 1)
returns json
language plpgsql
security definer
as $$
declare
    v_garden public.garden_log%rowtype;
    v_now timestamptz := now();
    v_last_watered timestamptz;
    v_hours_diff numeric;
    v_new_streak int;
    v_new_level int;
    v_effective_streak numeric;
    v_new_water_level int;
    v_result json;
begin
    -- Get or Init Garden
    select * into v_garden from public.garden_log where user_id = p_user_id;
    
    if not found then
        insert into public.garden_log (user_id, level, current_plant_type, streak_current, streak_best, water_level)
        values (p_user_id, 1, 'Lotus', 0, 0, 50)
        returning * into v_garden;
    end if;

    v_last_watered := v_garden.last_watered_at;
    
    -- Calculate Time Diff (Hours)
    if v_last_watered is null then
        v_hours_diff := 999;
    else
        v_hours_diff := extract(epoch from (v_now - v_last_watered)) / 3600;
    end if;

    -- Cooldown Check (1 hour), allow overload if high intensity/dev
    if v_hours_diff < 1 and p_intensity = 1 then
        -- No update, just return current
        return json_build_object(
            'success', false, 
            'message', 'Plant is already hydrated', 
            'garden', row_to_json(v_garden)
        );
    end if;

    -- Logic: Streak & Level
    v_new_streak := v_garden.streak_current + p_intensity;
    v_new_level := v_garden.level;
    v_effective_streak := v_new_streak + (v_garden.streak_best * 0.1);

    if v_effective_streak >= 3 and v_new_level < 2 then v_new_level := 2; end if;
    if v_effective_streak >= 10 and v_new_level < 3 then v_new_level := 3; end if;
    if v_effective_streak >= 25 and v_new_level < 4 then v_new_level := 4; end if;
    if v_effective_streak >= 50 and v_new_level < 5 then v_new_level := 5; end if;

    v_new_water_level := least(100, (v_garden.water_level + (10 * p_intensity)));

    -- Update DB
    update public.garden_log
    set 
        last_watered_at = v_now,
        streak_current = v_new_streak,
        streak_best = greatest(v_garden.streak_best, v_new_streak),
        level = v_new_level,
        water_level = v_new_water_level
    where user_id = p_user_id
    returning * into v_garden;

    -- Log Audit (Fire and Forget flavor)
    insert into public.audit_logs (user_id, action, details)
    values (p_user_id, 'garden_water', json_build_object('intensity', p_intensity, 'new_level', v_new_level));

    return json_build_object(
        'success', true,
        'garden', row_to_json(v_garden)
    );
end;
$$;

-- 2. BOOK OF YOU AGGREGATION
create or replace function public.get_book_stats(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_joined_at timestamptz;
    v_journal_count int;
    v_mood_count int;
    v_sun_count int;
    v_has_access boolean;
    v_days_wait int;
    v_dominant_weather text;
begin
    -- Check User & Access
    select created_at into v_joined_at from public.users where id = p_user_id;
    
    if v_joined_at is null then
        return json_build_object('error', 'User not found');
    end if;

    -- Logic: 7 Day Lock
    if now() - v_joined_at < interval '7 days' then
        v_has_access := false;
        v_days_wait := 7 - extract(day from (now() - v_joined_at))::int;
    else
        v_has_access := true;
        v_days_wait := 0;
    end if;

    -- Counts
    select count(*) into v_journal_count from public.journals where user_id = p_user_id;
    select count(*) into v_mood_count from public.moods where user_id = p_user_id;
    
    -- Mood Analysis (Sun vs Rain)
    -- Assuming moods: 'Happy', 'Calm', 'confetti', 'sun' are "Sun"
    select count(*) into v_sun_count 
    from public.moods 
    where user_id = p_user_id 
    and mood in ('Happy', 'Calm', 'confetti', 'sun', 'Excited', 'Grateful');

    if v_mood_count > 0 and (v_sun_count::numeric / v_mood_count::numeric) >= 0.5 then
        v_dominant_weather := 'sun';
    else
        v_dominant_weather := 'rain';
    end if;

    return json_build_object(
        'isLocked', not v_has_access,
        'daysRemaining', v_days_wait,
        'stats', json_build_object(
            'journals', v_journal_count,
            'moods', v_mood_count,
            'sunRatio', case when v_mood_count > 0 then (v_sun_count::numeric / v_mood_count::numeric) else 0.5 end
        ),
        'weather', v_dominant_weather
    );
end;
$$;

-- 3. GARDEN CLIP (Atomic Reward)
create or replace function public.clip_garden(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_last_clipped timestamptz;
    v_now timestamptz := now();
    v_prize int;
    v_quote text;
    v_quotes text[] := array[
        'Growth takes time.',
        'Patience is bitter, but its fruit is sweet.',
        'Bloom where you are planted.',
        'Peace is a practice.',
        'The garden does not hurry, yet everything is accomplished.'
    ];
begin
    -- Check Cooldown (12 Hours) using garden_log metadata or a new column
    -- For simplicity, we'll store last_clipped_at in garden_log
    -- If column missing, add it: alter table public.garden_log add column if not exists last_clipped_at timestamptz;
    
    -- Ensure column exists (idempotent-ish check not possible easily in function, assumes migration run)
    
    select last_clipped_at into v_last_clipped from public.garden_log where user_id = p_user_id;

    if v_last_clipped is not null and v_now - v_last_clipped < interval '12 hours' then
        return json_build_object('error', 'Plant needs rest');
    end if;

    -- Randomize Prize (5-10)
    v_prize := floor(random() * 6 + 5)::int;
    v_quote := v_quotes[floor(random() * array_length(v_quotes, 1) + 1)];

    -- Update Balance
    update public.users 
    set balance = balance + v_prize 
    where id = p_user_id;

    -- Update Garden Log
    update public.garden_log 
    set last_clipped_at = v_now 
    where user_id = p_user_id;

    -- Log Transaction
    insert into public.transactions (user_id, amount, description, type, status)
    values (p_user_id, v_prize, 'Garden Clip Reward', 'EARN', 'COMPLETED');

    return json_build_object(
        'success', true,
        'prize', v_prize,
        'quote', v_quote,
        'new_balance', (select balance from public.users where id = p_user_id)
    );
end;
$$;
