-- WAVE-10: AdGrid 120-Country Inventory Seed
-- Automates Launch Sponsorship slot for every country in the 120-country registry.

-- Add unique constraint so ON CONFLICT DO NOTHING works correctly for idempotency
ALTER TABLE public.hc_adgrid_inventory DROP CONSTRAINT IF EXISTS uq_adgrid_slot;
ALTER TABLE public.hc_adgrid_inventory ADD CONSTRAINT uq_adgrid_slot UNIQUE (country_code, surface_level, target_node, slot_name);

-- 1. Insert Launch Sponsor slot for all 120 countries
-- We set a base waitlist / launch sponsor price of $100.00 (10000 cents)
INSERT INTO public.hc_adgrid_inventory (
  country_code, 
  surface_level, 
  target_node, 
  slot_name, 
  base_price_cents
)
SELECT 
  LOWER(iso), 
  'country', 
  LOWER(iso) || '-main', 
  'launch_sponsor', 
  CASE 
    WHEN tier = 'A' THEN 50000
    WHEN tier = 'B' THEN 25000
    WHEN tier = 'C' THEN 10000
    WHEN tier = 'D' THEN 5000
    ELSE 2500
  END
FROM public.country_registry
ON CONFLICT DO NOTHING;

-- 2. Insert Directory Leaderboard slot for all 120 countries
INSERT INTO public.hc_adgrid_inventory (
  country_code, 
  surface_level, 
  target_node, 
  slot_name, 
  base_price_cents
)
SELECT 
  LOWER(iso), 
  'country', 
  LOWER(iso) || '-directory', 
  'leaderboard', 
  CASE 
    WHEN tier = 'A' THEN 20000
    WHEN tier = 'B' THEN 10000
    WHEN tier = 'C' THEN 5000
    WHEN tier = 'D' THEN 2500
    ELSE 1000
  END
FROM public.country_registry
ON CONFLICT DO NOTHING;
