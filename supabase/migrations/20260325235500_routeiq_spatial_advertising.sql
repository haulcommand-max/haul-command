-- Migration: 20260325235500_routeiq_spatial_advertising.sql
-- Subagent: Launch Dominance Setup
-- Purpose: Implements the 'Waze for Heavy Haul' monetization layer and SaaS Pro Tier

-- 1. RouteIQ Map Billboards (Spatial Advertising)
CREATE TABLE IF NOT EXISTS public.routeiq_spatial_ads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    business_type text NOT NULL CHECK (business_type IN ('TRUCK_STOP', 'MECHANIC', 'TOWING', 'LAYOVER_YARD')),
    business_name text NOT NULL,
    location geometry(Point, 4326) NOT NULL, -- The physical GPS point of the business
    display_radius_meters numeric DEFAULT 50000, -- Show pin on the HUD when convoy is within 50km
    cpc_bid_amount numeric NOT NULL DEFAULT 1.50, -- Cost per click when driver hits 'Route to Location'
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routeiq_ads_location ON public.routeiq_spatial_ads USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_routeiq_ads_active ON public.routeiq_spatial_ads(is_active);

-- 2. RouteIQ Pro Subscription Tier ($14.99/mo)
CREATE TABLE IF NOT EXISTS public.routeiq_pro_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id text UNIQUE,
    status text NOT NULL DEFAULT 'active',
    features jsonb DEFAULT '{"turn_by_turn": true, "bridge_clearance": true, "superload_mode": true}'::jsonb,
    renewed_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routeiq_pro_users ON public.routeiq_pro_subscriptions(user_id, status);

-- 3. Progressive Insurance / Liability Mitigation Logs
-- Tracks every time a broker specifically uses RouteIQ to safely navigate a mega-load
CREATE TABLE IF NOT EXISTS public.routeiq_liability_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id uuid REFERENCES auth.users(id),
    load_id uuid NOT NULL,
    load_type text NOT NULL, -- 'MOBILE_HOME', 'BLADE', 'SUPERLOAD'
    route_polyline text NOT NULL,
    hazards_avoided integer DEFAULT 0,
    insurance_discount_sent boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- RLS Enforcement
ALTER TABLE public.routeiq_spatial_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routeiq_pro_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routeiq_liability_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_can_view_active_ads" ON public.routeiq_spatial_ads FOR SELECT USING (is_active = true);
CREATE POLICY "users_read_own_subs" ON public.routeiq_pro_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "brokers_read_own_liability" ON public.routeiq_liability_logs FOR SELECT USING (auth.uid() = broker_id);
