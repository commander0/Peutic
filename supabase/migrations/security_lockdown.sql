-- ==========================================================
-- SECURITY LOCKDOWN: TRIGGER-BASED COLUMN PROTECTION
-- ==========================================================

-- Problem: RLS allows a user to UPDATE their own row, but RLS works at the ROW level.
--          This means a user could technically craft an API call to update their 'role' to 'ADMIN'.

-- Solution: A BEFORE UPDATE trigger that inspects exactly WHICH columns are changing.
--           It blocks changes to sensitive fields unless the user is confirmed as an Admin.

CREATE OR REPLACE FUNCTION public.protect_sensitive_user_columns()
RETURNS TRIGGER AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Check if the user is an admin
    -- We use the secure function we created earlier
    is_admin := public.is_admin();

    -- IF NOT ADMIN, ENFORCE RESTRICTIONS
    IF NOT is_admin THEN
        -- 1. PREVENT ROLE CHANGE
        -- If the new role is different from the old role, REJECT IT.
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'You are not authorized to change your user role.';
        END IF;

        -- 2. PREVENT BALANCE MANIPULATION
        -- Balance should only be changed by the payment system (service role) or admins.
        -- Note: If your payment webhook uses a service role key, it bypasses RLS/Triggers
        -- if 'ENABLE ROW LEVEL SECURITY' is set but 'FORCE ROW LEVEL SECURITY' is not.
        -- But triggers usually fire for everyone.
        -- We will verify if auth.uid() is present. Service role often has no auth.uid().
        
        IF (auth.uid() IS NOT NULL) AND (NEW.balance IS DISTINCT FROM OLD.balance) THEN
             RAISE EXCEPTION 'Balance updates are restricted to the payment system.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP AND RECREATE TRIGGER
DROP TRIGGER IF EXISTS "enforce_sensitive_columns" ON public.users;

CREATE TRIGGER "enforce_sensitive_columns"
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_sensitive_user_columns();
