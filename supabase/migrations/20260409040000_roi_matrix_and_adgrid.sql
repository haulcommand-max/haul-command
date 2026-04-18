-- ==============================================================================
-- Haul Command Database Migration: The 10-Point Moat & ROI Matrix
-- Purpose: Hardwiring the 10 un-tapped vectors into the canonical schema.
-- ==============================================================================

-- 1. Broker-Funded "Escrow Rush" (1.5% premium clip)
CREATE TABLE IF NOT EXISTS public.hc_escrow_rush_loads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id uuid NOT NULL,
    broker_id uuid NOT NULL,
    escrow_amount_cents integer NOT NULL,
    rush_premium_fee_cents integer NOT NULL,
    stripe_payment_intent_id text,
    status text DEFAULT 'funded' CHECK (status IN ('funded', 'claimed', 'released', 'disputed')),
    created_at timestamptz DEFAULT now()
);

-- 2. Directory "Featured" Subscriptions ($49/mo)
CREATE TABLE IF NOT EXISTS public.hc_featured_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
    stripe_subscription_id text,
    tier text DEFAULT 'local_featured',
    geo_zone text NOT NULL, -- e.g., 'US-TX', 'CA-AB'
    is_active boolean DEFAULT true,
    expires_at timestamptz
);

-- 3. White-Label DOT Compliance Kits (Digital Products)
CREATE TABLE IF NOT EXISTS public.hc_digital_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name text NOT NULL,
    price_cents integer NOT NULL,
    download_url text NOT NULL,
    purchase_count integer DEFAULT 0
);

-- 4. Sell Geo-Spatial Data Back to Insurers (API Subscriptions)
CREATE TABLE IF NOT EXISTS public.hc_insurance_api_subs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    monthly_fee_cents integer NOT NULL,
    api_key_hash text NOT NULL,
    rate_limit_per_minute integer DEFAULT 1000,
    created_at timestamptz DEFAULT now()
);

-- 5 & 10. Affiliate & Factoring Bounties
CREATE TABLE IF NOT EXISTS public.hc_bounty_referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid REFERENCES public.hc_global_operators(id),
    partner_type text NOT NULL CHECK (partner_type IN ('factoring', 'dashcam', 'insurance', 'equipment')),
    partner_name text NOT NULL, -- e.g., 'Motive', 'Triumph'
    bounty_amount_cents integer,
    status text DEFAULT 'pending_verification'
);

-- 6. The "Backhaul Insurance" Network (Repositioning Broadcast)
CREATE TABLE IF NOT EXISTS public.hc_backhaul_broadcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid REFERENCES public.hc_global_operators(id),
    current_lat double precision NOT NULL,
    current_lng double precision NOT NULL,
    heading_direction text,
    broadcast_fee_cents integer DEFAULT 999,
    brokers_notified_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 7. Escort Dealership AdGrid (Sponsorships)
CREATE TABLE IF NOT EXISTS public.hc_adgrid_sponsors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_name text NOT NULL,
    banner_image_url text NOT NULL,
    target_route text NOT NULL, -- The page family to takeover (e.g., '/directory/us/texas')
    monthly_spend_cents integer NOT NULL,
    impressions_delivered integer DEFAULT 0,
    clicks_delivered integer DEFAULT 0,
    is_active boolean DEFAULT true
);

-- Create aggregated RLS policies (Locked down to Service Role + authenticated owners)
ALTER TABLE public.hc_escrow_rush_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_featured_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_bounty_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_backhaul_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_adgrid_sponsors ENABLE ROW LEVEL SECURITY;
