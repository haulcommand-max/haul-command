-- ============================================================
-- HARDEN data_purchases TABLE
-- Addresses: race conditions, missing constraints, FK integrity
-- ============================================================

begin;

-- 1. Add foreign key constraint to prevent orphan purchases
ALTER TABLE public.data_purchases
    ADD CONSTRAINT fk_data_purchases_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add CHECK constraint on status to prevent invalid states
ALTER TABLE public.data_purchases
    ADD CONSTRAINT chk_data_purchases_status
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled'));

-- 3. Prevent duplicate active/pending purchases for the same product+user+country
-- This is the critical race-condition fix: if two requests arrive simultaneously,
-- only one INSERT can succeed for the same (user, product, country) tuple.
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_purchases_unique_active
    ON public.data_purchases (user_id, product_id, country_code)
    WHERE status IN ('pending', 'active');

-- 4. Add corridor_code to the uniqueness check for corridor-scoped products
-- (A user can buy the same product for different corridors)
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_purchases_unique_corridor_active
    ON public.data_purchases (user_id, product_id, country_code, corridor_code)
    WHERE status IN ('pending', 'active') AND corridor_code IS NOT NULL;

-- 5. Drop the generic unique index if the above corridor-specific one covers it
-- (The first index handles NULL corridor_code cases via partial index)

-- 6. Add INSERT policy so authenticated users can create pending purchases
-- (Belt-and-suspenders: the service_role policy already allows ALL,
--  but if client-side Supabase is ever used, this prevents silent failures)
CREATE POLICY data_purchases_insert_own
    ON public.data_purchases
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- 7. Add UPDATE policy so users can cancel their own purchases
CREATE POLICY data_purchases_cancel_own
    ON public.data_purchases
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

commit;
