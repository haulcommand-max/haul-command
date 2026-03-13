-- 20260313_0052_create_metros_cities.sql
-- New tables: hc_metros, hc_cities (geography spine)
-- Then adds FK constraints from surfaces → hc_metros, hc_cities

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. hc_metros — metro-level geography entity
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_metros (
  metro_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    text NOT NULL,
  region_geo_key  text,                               -- FK to geo_regions.geo_key
  metro_name      text NOT NULL,
  metro_slug      text NOT NULL,
  bbox            jsonb NOT NULL DEFAULT '{}'::jsonb,
  centroid_lat    numeric(10,7),
  centroid_lng    numeric(10,7),
  market_mode     text NOT NULL DEFAULT 'cold_market',
  priority_score  numeric(6,3) NOT NULL DEFAULT 0,
  indexable       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code, metro_slug)
);

CREATE INDEX IF NOT EXISTS idx_hc_metros_region ON public.hc_metros(region_geo_key);
CREATE INDEX IF NOT EXISTS idx_hc_metros_market_mode ON public.hc_metros(market_mode);
CREATE INDEX IF NOT EXISTS idx_hc_metros_country ON public.hc_metros(country_code);

ALTER TABLE public.hc_metros ENABLE ROW LEVEL SECURITY;
CREATE POLICY hc_metros_public_read ON public.hc_metros FOR SELECT USING (true);
CREATE POLICY hc_metros_service_write ON public.hc_metros
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.hc_metros TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. hc_cities — city-level geography entity, FK → hc_metros
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_cities (
  city_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    text NOT NULL,
  region_geo_key  text,                               -- FK to geo_regions.geo_key
  metro_id        uuid REFERENCES public.hc_metros(metro_id) ON DELETE SET NULL,
  city_name       text NOT NULL,
  city_slug       text NOT NULL,
  lat             numeric(10,7),
  lng             numeric(10,7),
  bbox            jsonb NOT NULL DEFAULT '{}'::jsonb,
  market_mode     text NOT NULL DEFAULT 'cold_market',
  priority_score  numeric(6,3) NOT NULL DEFAULT 0,
  city_operating_score numeric(6,3) NOT NULL DEFAULT 0,
  indexable       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code, city_slug)
);

CREATE INDEX IF NOT EXISTS idx_hc_cities_region ON public.hc_cities(region_geo_key);
CREATE INDEX IF NOT EXISTS idx_hc_cities_metro ON public.hc_cities(metro_id);
CREATE INDEX IF NOT EXISTS idx_hc_cities_market_mode ON public.hc_cities(market_mode);
CREATE INDEX IF NOT EXISTS idx_hc_cities_priority ON public.hc_cities(priority_score);
CREATE INDEX IF NOT EXISTS idx_hc_cities_country ON public.hc_cities(country_code);

ALTER TABLE public.hc_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY hc_cities_public_read ON public.hc_cities FOR SELECT USING (true);
CREATE POLICY hc_cities_service_write ON public.hc_cities
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.hc_cities TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Add FK constraints on surfaces → hc_metros, hc_cities
--    (columns metro_id, city_id were added in migration 0051)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.surfaces
    ADD CONSTRAINT fk_surfaces_metro FOREIGN KEY (metro_id)
    REFERENCES public.hc_metros(metro_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.surfaces
    ADD CONSTRAINT fk_surfaces_city FOREIGN KEY (city_id)
    REFERENCES public.hc_cities(city_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
