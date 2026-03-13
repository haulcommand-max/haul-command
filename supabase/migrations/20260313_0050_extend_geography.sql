-- 20260313_0050_extend_geography.sql
-- Additive columns on global_countries, geo_regions, corridors, jurisdictions
-- Mode: ADD COLUMN IF NOT EXISTS only. No renames, no drops.
-- Guardrail: 57-country strategic target preserved via target_country_enabled flag.

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. global_countries — add tier/market columns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.global_countries
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS market_mode text,
  ADD COLUMN IF NOT EXISTS market_priority_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS launch_status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS target_country_enabled boolean NOT NULL DEFAULT true;

-- CHECK constraints via DO block (idempotent)
DO $$ BEGIN
  ALTER TABLE public.global_countries
    ADD CONSTRAINT chk_gc_tier CHECK (tier IN ('gold','blue','silver','slate'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.global_countries
    ADD CONSTRAINT chk_gc_market_mode CHECK (
      market_mode IN ('dense_market','growing_market','emerging_market','cold_market')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.global_countries
    ADD CONSTRAINT chk_gc_launch CHECK (
      launch_status IN ('planned','seeded','live','priority_hold')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_global_countries_tier ON public.global_countries(tier);
CREATE INDEX IF NOT EXISTS idx_global_countries_market_mode ON public.global_countries(market_mode);
CREATE INDEX IF NOT EXISTS idx_global_countries_target_enabled ON public.global_countries(target_country_enabled);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. geo_regions — add slug, centroid, market columns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.geo_regions
  ADD COLUMN IF NOT EXISTS region_slug text,
  ADD COLUMN IF NOT EXISTS centroid_lat numeric(10,7),
  ADD COLUMN IF NOT EXISTS centroid_lng numeric(10,7),
  ADD COLUMN IF NOT EXISTS bbox jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS market_mode text,
  ADD COLUMN IF NOT EXISTS priority_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS indexable boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_regions_country_region_slug
  ON public.geo_regions(country, region_slug);
CREATE INDEX IF NOT EXISTS idx_geo_regions_market_mode ON public.geo_regions(market_mode);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. corridors — add slug, anchor, score columns
--    SKIP country_code: corridors already has "country" column (same purpose)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.corridors
  ADD COLUMN IF NOT EXISTS corridor_slug text,
  ADD COLUMN IF NOT EXISTS anchor_city_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS anchor_region_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS priority_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corridor_operating_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS indexable boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_corridors_country_slug
  ON public.corridors(country, corridor_slug);
CREATE INDEX IF NOT EXISTS idx_corridors_priority_score ON public.corridors(priority_score);


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. jurisdictions — add rule summary columns for SEO/display
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.jurisdictions
  ADD COLUMN IF NOT EXISTS jurisdiction_slug text,
  ADD COLUMN IF NOT EXISTS escort_rules_summary text,
  ADD COLUMN IF NOT EXISTS travel_restrictions_summary text,
  ADD COLUMN IF NOT EXISTS permit_basics_summary text,
  ADD COLUMN IF NOT EXISTS route_survey_summary text,
  ADD COLUMN IF NOT EXISTS last_rules_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS indexable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS snippet_priority int NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jurisdictions_slug
  ON public.jurisdictions(jurisdiction_slug);

COMMIT;
