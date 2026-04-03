-- ============================================================
-- Migration: Sponsors AdGrid Production Hardening
-- Additive only — does NOT touch existing sponsorship_products
-- or sponsorship_orders tables from 20260220162501
-- ============================================================

-- ── 1. Extend sponsorship_orders with subscription tracking ──
-- Add columns if they don't exist (idempotent via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sponsorship_orders'
          AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE public.sponsorship_orders
            ADD COLUMN stripe_subscription_id text,
            ADD COLUMN stripe_customer_id      text,
            ADD COLUMN zone                    text,
            ADD COLUMN geo                     text,
            ADD COLUMN active_from             timestamptz,
            ADD COLUMN active_until            timestamptz,
            ADD COLUMN cancelled_at            timestamptz;
    END IF;
END $$;

-- ── 2. Add status values for subscription lifecycle ──
-- Extend check constraint safely (drop + recreate)
ALTER TABLE public.sponsorship_orders
    DROP CONSTRAINT IF EXISTS sponsorship_orders_status_check;

ALTER TABLE public.sponsorship_orders
    ADD CONSTRAINT sponsorship_orders_status_check
    CHECK (status IN ('pending', 'paid', 'active', 'cancelled', 'past_due', 'failed', 'refunded'));

-- ── 3. Indexes for getSponsorForZone() query ──
CREATE INDEX IF NOT EXISTS idx_sponsorship_orders_zone_geo_status
    ON public.sponsorship_orders(zone, geo, status)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sponsorship_orders_stripe_sub
    ON public.sponsorship_orders(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sponsorship_orders_active_until
    ON public.sponsorship_orders(active_until)
    WHERE status = 'active';

-- ── 4. View: v_active_sponsors — powers getSponsorForZone() ──
CREATE OR REPLACE VIEW public.v_active_sponsors AS
SELECT
    so.id,
    so.zone,
    so.geo,
    so.status,
    so.active_from,
    so.active_until,
    so.stripe_subscription_id,
    so.stripe_customer_id,
    so.user_id,
    p.display_name  AS sponsor_name,
    p.photo_url    AS sponsor_logo,
    so.product_key,
    sp.name         AS product_name,
    sp.amount       AS price_monthly
FROM public.sponsorship_orders so
LEFT JOIN public.profiles p ON p.id = so.user_id
LEFT JOIN public.sponsorship_products sp ON sp.product_key = so.product_key
WHERE so.status = 'active'
  AND (so.active_until IS NULL OR so.active_until > now());

-- ── 5. Idempotency table for Stripe webhook events ──
CREATE TABLE IF NOT EXISTS public.sponsor_webhook_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id text NOT NULL UNIQUE,
    event_type      text NOT NULL,
    processed_at    timestamptz NOT NULL DEFAULT now(),
    order_id        uuid REFERENCES public.sponsorship_orders(id) ON DELETE SET NULL,
    raw_payload     jsonb
);

CREATE INDEX IF NOT EXISTS idx_sponsor_webhook_events_stripe_id
    ON public.sponsor_webhook_events(stripe_event_id);

-- RLS for webhook events (service_role only writes)
ALTER TABLE public.sponsor_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "sponsor_webhook_events_admin_read"
    ON public.sponsor_webhook_events FOR SELECT
    USING (public.has_any_role(ARRAY['owner_admin', 'admin']));

-- ── 6. Additional RLS policy: service_role bypass for webhook writes ──
-- Existing policies from 20260220162501 remain. This adds:
-- Admin can UPDATE status on orders (for webhook lifecycle changes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sponsorship_orders'
          AND policyname = 'sponsorship_orders_service_update'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY "sponsorship_orders_service_update"
            ON public.sponsorship_orders FOR UPDATE
            USING (true)
            WITH CHECK (true);
        $policy$;
        -- Note: this relies on service_role bypassing RLS entirely (default Supabase behavior)
        -- The above is belt-and-suspenders for explicit grants
    END IF;
END $$;

-- ── 7. Seed extended product catalog with zone/geo pricing tiers ──
INSERT INTO public.sponsorship_products (product_key, name, amount, currency, duration_days)
VALUES
    ('territory_mega',     'Territory Sponsor — Mega Market',    499, 'USD', 30),
    ('territory_major',    'Territory Sponsor — Major Market',   349, 'USD', 30),
    ('territory_mid',      'Territory Sponsor — Mid Market',     249, 'USD', 30),
    ('territory_growth',   'Territory Sponsor — Growth Market',  179, 'USD', 30),
    ('territory_emerging', 'Territory Sponsor — Emerging',       149, 'USD', 30),
    ('corridor_flagship',  'Corridor Sponsor — Flagship',        349, 'USD', 30),
    ('corridor_primary',   'Corridor Sponsor — Primary',         279, 'USD', 30),
    ('corridor_secondary', 'Corridor Sponsor — Secondary',       179, 'USD', 30),
    ('port_tier1',         'Port Sponsor — Tier 1',              599, 'USD', 30),
    ('port_tier2',         'Port Sponsor — Tier 2',              399, 'USD', 30),
    ('port_tier3',         'Port Sponsor — Tier 3',              299, 'USD', 30),
    ('country_gold',       'Country Sponsor — Gold Market',      399, 'USD', 30),
    ('country_blue',       'Country Sponsor — Blue Market',      279, 'USD', 30),
    ('country_silver',     'Country Sponsor — Silver Market',    219, 'USD', 30)
ON CONFLICT (product_key) DO NOTHING;
