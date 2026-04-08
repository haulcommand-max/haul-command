-- =========================================================================
-- SUPER-CHARGE ADGRID & COUNTRY LOCALIZATION
-- Creates the foundational tracking schema for the 120-country 
-- AdGrid inventory allocations so advertisers can buy by region.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.hc_adgrid_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    surface_level VARCHAR(50) NOT NULL CHECK (surface_level IN ('global', 'country', 'region', 'city', 'corridor', 'tool')),
    target_node text NOT NULL, -- e.g., 'us-tx', 'houston', 'corridor-tx-la'
    slot_name VARCHAR(50) NOT NULL, -- e.g., 'leaderboard', 'claim_gate'
    sponsor_operator_id UUID REFERENCES public.hc_global_operators(id),
    base_price_cents INTEGER NOT NULL DEFAULT 5000,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Compound index for insane API query speed filtering for local map sponsorships
CREATE INDEX IF NOT EXISTS idx_adgrid_country_node 
ON public.hc_adgrid_inventory(country_code, surface_level, target_node);

-- Insert the first batch of default inventory for AU and CA 
-- making sure "localized" monetization is immediately un-locked as instructed.
INSERT INTO public.hc_adgrid_inventory (country_code, surface_level, target_node, slot_name, base_price_cents)
VALUES 
    ('au', 'country', 'australia-main', 'launch_sponsor', 50000),
    ('au', 'region', 'queensland', 'leaderboard', 15000),
    ('ca', 'country', 'canada-main', 'launch_sponsor', 40000),
    ('ca', 'region', 'alberta', 'leaderboard', 20000)
ON CONFLICT DO NOTHING;
