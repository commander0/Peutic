-- ==========================================================
-- FINAL POLISH: FIX COMPANIONS POLICY OVERLAP
-- ==========================================================

-- Problem: "companions_admin_all" (ALL) and "companions_read_public" (SELECT) overlap on SELECT.
-- Solution: Admin only needs specific policies for WRITE actions (Insert, Update, Delete).
--           Read access is already covered by the public policy.

-- 1. DROP THE BROAD "ALL" POLICY
DROP POLICY IF EXISTS "companions_admin_all" ON public.companions;

-- 2. CREATE SPECIFIC WRITE POLICIES FOR ADMIN
-- SELECT is handled by "companions_read_public" (which exists), so we don't add it here.

CREATE POLICY "companions_admin_insert" ON public.companions FOR INSERT WITH CHECK (
    public.is_admin()
);

CREATE POLICY "companions_admin_update" ON public.companions FOR UPDATE USING (
    public.is_admin()
);

CREATE POLICY "companions_admin_delete" ON public.companions FOR DELETE USING (
    public.is_admin()
);

-- 3. ENSURE PUBLIC READ REMAINS
-- Just in case it was dropped, ensure it exists
DROP POLICY IF EXISTS "companions_read_public" ON public.companions;
CREATE POLICY "companions_read_public" ON public.companions FOR SELECT USING (true);
