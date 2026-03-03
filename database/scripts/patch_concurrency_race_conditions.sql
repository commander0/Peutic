-- ==============================================================================
-- PRODUCTION READINESS: CONCURRENCY & RACE CONDITION PATCH
-- File: patch_concurrency_race_conditions.sql
-- Description: Ensures critical transactions strictly occur structurally on the database 
--              level rather than via explicit relative updates from the client, securing 
--              the application from 'double-spend' exploits while mathematically clamping to 0.
-- ==============================================================================

-- 1. Atomic User Balance Deduction (Double-Spend Protection)
-- Overrides any existing deduct_user_balance with one that returns TRUE/FALSE 
-- safely verifying the user actually had enough funds IN REAL TIME on the server.
DROP FUNCTION IF EXISTS public.deduct_user_balance(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.deduct_user_balance(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.deduct_user_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  -- Obtain a Row-Level Lock specifically for this user to queue simultaneous requests 
  -- (This completely nullifies double-spend spamming exploits)
  SELECT balance INTO v_current_balance 
  FROM public.users 
  WHERE id = p_user_id 
  FOR UPDATE;

  -- Ensure they still have enough funds at the exact millisecond of the transaction
  IF v_current_balance >= p_amount THEN
    -- If valid, atomic deduction applying mathematical zero-floor
    UPDATE public.users 
    SET balance = GREATEST(0, balance - p_amount) 
    WHERE id = p_user_id;

    RETURN TRUE;
  ELSE
    -- Rejection triggers if they spammed and ran out of funds midway
    RETURN FALSE;
  END IF;
END;
$$;


-- 2. Atomic Garden Harvest (Harvest Exploitation Protection)
-- Secures the Inner Garden from rapid harvest clicks bypassing requirements.
CREATE OR REPLACE FUNCTION public.harvest_garden_focus_minutes(p_user_id UUID, p_cost INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_minutes INTEGER;
BEGIN
  -- Row-level lock for concurrent spam
  SELECT focus_minutes INTO v_current_minutes
  FROM public.garden_log
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Verify enough focus minutes exist at execution time
  IF COALESCE(v_current_minutes, 0) >= p_cost THEN
    UPDATE public.garden_log
    SET focus_minutes = GREATEST(0, focus_minutes - p_cost)
    WHERE user_id = p_user_id;

    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
