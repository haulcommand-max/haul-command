-- Migration: make sponsorship_orders.user_id nullable
-- Rationale: Stripe checkout sessions for sponsored placements may be
-- completed by users who haven't created a Supabase account yet (common
-- for business purchasers). The FK to profiles remains for verified users.
-- Anonymous orders can be linked to a profile later via stripe_customer_id.

ALTER TABLE public.sponsorship_orders ALTER COLUMN user_id DROP NOT NULL;

-- Add index for future anonymous → user linking via customer ID
CREATE INDEX IF NOT EXISTS sponsorship_orders_stripe_customer_idx
    ON public.sponsorship_orders (stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN public.sponsorship_orders.user_id IS
    'Supabase user who purchased — nullable for anonymous/business checkout sessions. Link via stripe_customer_id once user authenticates.';
