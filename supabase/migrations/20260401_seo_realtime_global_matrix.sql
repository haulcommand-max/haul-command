-- ═══════════════════════════════════════════════════════════════════════
-- HAUL COMMAND — Programmatic SEO Matrix & Supabase Realtime Hub
-- 120-Country Global Routing SEO & Live Dispatch Traffic Architecture
-- ═══════════════════════════════════════════════════════════════════════

-- This table acts as the massive origin-to-destination SEO routing engine
-- designed to generate up to 14,000+ permutations across all 12 देशों (120 countries).
CREATE TABLE IF NOT EXISTS public.hc_seo_route_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origin
  origin_country_code TEXT NOT NULL,
  origin_region_code TEXT,       -- e.g., 'TX', 'QLD', 'ON' (Nullable for country-to-country)
  origin_name TEXT NOT NULL,     -- e.g., 'Texas', 'Germany'
  
  -- Destination
  dest_country_code TEXT NOT NULL,
  dest_region_code TEXT,
  dest_name TEXT NOT NULL,
  
  -- SEO & Traffic Data
  seo_slug TEXT NOT NULL UNIQUE, -- e.g., 'us-texas-to-us-louisiana-oversize-permits'
  h1_title TEXT NOT NULL,
  meta_description TEXT,
  
  -- Estimated Search Volume & Traffic Potential
  monthly_search_vol_est INT DEFAULT 0,
  
  -- Realtime Hub / Live Operations Data
  -- These metrics update dynamically as real loads or quotes hit the system
  active_live_dispatches INT DEFAULT 0,
  avg_market_rate_usd NUMERIC(10,2),
  last_live_event_at TIMESTAMPTZ,
  
  -- Control
  is_live BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure we don't have duplicate matrices
  UNIQUE(origin_country_code, origin_region_code, dest_country_code, dest_region_code)
);

-- Turn on Row Level Security
ALTER TABLE public.hc_seo_route_matrix ENABLE ROW LEVEL SECURITY;

-- Allow public read access (essential for SEO fetching and Realtime)
CREATE POLICY "Public read seo_route_matrix" ON public.hc_seo_route_matrix FOR SELECT USING (true);

-- Index for explosive querying speed on Edge Functions
CREATE INDEX IF NOT EXISTS idx_seo_route_origin ON public.hc_seo_route_matrix(origin_country_code, origin_region_code);
CREATE INDEX IF NOT EXISTS idx_seo_route_dest ON public.hc_seo_route_matrix(dest_country_code, dest_region_code);
CREATE INDEX IF NOT EXISTS idx_seo_route_slug ON public.hc_seo_route_matrix(seo_slug);
CREATE INDEX IF NOT EXISTS idx_seo_route_live_ops ON public.hc_seo_route_matrix(last_live_event_at DESC) WHERE last_live_event_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- SUPABASE REALTIME HUB ACTIVATION
-- ═══════════════════════════════════════════════════════════════════════
-- By adding this table to the supabase_realtime publication, the Next.js 
-- frontend can subscribe to live dispatch events globally.
-- As operators accept jobs, the active_live_dispatches number shifts in real-time,
-- forcing Google to recognize these SEO pages as localized live logistics dashboards.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'hc_seo_route_matrix'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hc_seo_route_matrix;
    END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- INITIAL 120-COUNTRY SEED SCRIPT (Example Cross-Border & Highway Corridors)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO public.hc_seo_route_matrix 
(origin_country_code, origin_region_code, origin_name, dest_country_code, dest_region_code, dest_name, seo_slug, h1_title) 
VALUES
-- US Domestic Cross-State
('US', 'TX', 'Texas', 'US', 'LA', 'Louisiana', 'us-texas-to-us-louisiana-oversize-permits', 'Texas to Louisiana Oversize Load & Permit Transport'),
('US', 'CA', 'California', 'US', 'NV', 'Nevada', 'us-california-to-us-nevada-oversize-permits', 'California to Nevada Heavy Haul Escort & Routing'),

-- Canada Cross-Province
('CA', 'AB', 'Alberta', 'CA', 'BC', 'British Columbia', 'ca-alberta-to-ca-british-columbia-heavy-haul', 'Alberta to British Columbia Heavy Haul Routing'),

-- Australia Cross-State
('AU', 'QLD', 'Queensland', 'AU', 'NSW', 'New South Wales', 'au-queensland-to-nsw-osom-transport', 'Queensland to NSW OSOM Pilot & Permit Regulations'),

-- Cross-Border NAFTA/USMCA
('US', 'TX', 'Texas', 'MX', 'NL', 'Nuevo León', 'us-texas-to-mx-nuevo-leon-cross-border', 'Texas to Nuevo León (Mexico) Cross-Border Heavy Haul'),
('US', 'MI', 'Michigan', 'CA', 'ON', 'Ontario', 'us-michigan-to-ca-ontario-cross-border', 'Michigan to Ontario Oversize Cross-Border Clearance'),

-- Europe / Trans-National
('DE', NULL, 'Germany', 'NL', NULL, 'Netherlands', 'de-germany-to-nl-netherlands-schwertransport', 'Germany to Netherlands Schwertransport & Exceptioneel Vervoer'),
('FR', NULL, 'France', 'ES', NULL, 'Spain', 'fr-france-to-es-spain-convoi-exceptionnel', 'France to Spain Convoi Exceptionnel Permits'),
('GB', NULL, 'United Kingdom', 'IE', NULL, 'Ireland', 'gb-united-kingdom-to-ie-ireland-abnormal-load', 'UK to Ireland Abnormal Load Roll-On Roll-Off Transport'),

-- Middle East Cross-Border
('AE', 'DU', 'Dubai', 'SA', 'RI', 'Riyadh', 'ae-dubai-to-sa-riyadh-oversize-logistics', 'Dubai (UAE) to Riyadh (Saudi Arabia) Heavy Transport Logistics'),

-- Africa Trans-National Corridors
('ZA', 'GP', 'Gauteng', 'MZ', 'MP', 'Maputo', 'za-gauteng-to-mz-maputo-abnormal-load', 'Gauteng (SA) to Maputo (Mozambique) Abnormal Load Border Crossing')
ON CONFLICT DO NOTHING;
