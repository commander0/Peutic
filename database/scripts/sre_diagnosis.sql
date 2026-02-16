-- =================================================================
-- SRE DIAGNOSTIC REPORT: USER PERSISTENCE & PERMISSIONS
-- Run this script to generate the "Smoking Gun" evidence.
-- =================================================================

DO $$
DECLARE
    v_users_exist boolean;
    v_rls_enabled boolean;
    v_policy_insert boolean;
    v_trigger_exists boolean;
    v_func_exists boolean;
BEGIN
    RAISE NOTICE '--- STARTING DIAGNOSTIC ---';

    -- 1. Check Table Existence
    select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') into v_users_exist;
    RAISE NOTICE 'Public.Users Table Exists: %', v_users_exist;

    -- 2. Check RLS is Enabled
    select relrowsecurity from pg_class where relname = 'users' and relkind = 'r' into v_rls_enabled;
    RAISE NOTICE 'RLS Enabled on Users: %', v_rls_enabled;

    -- 3. Check "User Insert Own" Policy
    select exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'User Insert Own') into v_policy_insert;
    RAISE NOTICE 'Policy [User Insert Own] Exists: %', v_policy_insert;

    -- 4. Check "on_auth_user_created" Trigger
    select exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') into v_trigger_exists;
    RAISE NOTICE 'Trigger [on_auth_user_created] Exists: %', v_trigger_exists;

    -- 5. Check "handle_new_user" Function
    select exists (select 1 from pg_proc where proname = 'handle_new_user') into v_func_exists;
    RAISE NOTICE 'Function [handle_new_user] Exists: %', v_func_exists;

    RAISE NOTICE '--- DIAGNOSTIC COMPLETE ---';
    
    IF v_users_exist AND v_rls_enabled AND v_policy_insert AND v_trigger_exists THEN
        RAISE NOTICE 'CONCLUSION: Infrastructure appears CORRECT. Issue is likely client-side or permissions.';
    ELSE
        RAISE NOTICE 'CONCLUSION: SMOKING GUN FOUND! Database schema is INCOMPLETE. Re-run unified_schema.sql immediately.';
    END IF;
END $$;
