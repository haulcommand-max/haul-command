-- 20260313_0057_create_registry_scoreboards.sql
-- New tables: hc_programmatic_page_registry, hc_market_scoreboard_snapshots

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. hc_programmatic_page_registry — programmatic SEO page eligibility
--    Different purpose from premium_pages (which is auction/monetization).
--    This tracks page defensibility + indexability for the entire page family.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_programmatic_page_registry (
  page_registry_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type           text NOT NULL,                  -- city_service, corridor_hub, state_rules, problem_page, glossary_hub, metro_hub, country_hub
  country_code        text,
  region_geo_key      text,
  metro_id            uuid REFERENCES public.hc_metros(metro_id) ON DELETE SET NULL,
  city_id             uuid REFERENCES public.hc_cities(city_id) ON DELETE SET NULL,
  corridor_id         uuid REFERENCES public.corridors(id) ON DELETE SET NULL,
  category_slug       text,
  problem_slug        text,
  canonical_url       text NOT NULL UNIQUE,
  -- Defensibility scores (0.0 - 1.0)
  unique_data_score   numeric(6,3) NOT NULL DEFAULT 0,
  cross_surface_value_score numeric(6,3) NOT NULL DEFAULT 0,
  no_dead_end_score   numeric(6,3) NOT NULL DEFAULT 0,
  -- Page control
  indexable           boolean NOT NULL DEFAULT false,
  render_mode         text NOT NULL DEFAULT 'no_dead_end_beachhead',
  last_evaluated_at   timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.hc_programmatic_page_registry ADD CONSTRAINT chk_ppr_render_mode
    CHECK (render_mode IN (
      'full_authority','partial_data','no_dead_end_beachhead','gateway_redirect','noindex_staging'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_hc_page_reg_indexable ON public.hc_programmatic_page_registry(indexable);
CREATE INDEX IF NOT EXISTS idx_hc_page_reg_mode ON public.hc_programmatic_page_registry(render_mode);
CREATE INDEX IF NOT EXISTS idx_hc_page_reg_country ON public.hc_programmatic_page_registry(country_code);
CREATE INDEX IF NOT EXISTS idx_hc_page_reg_type ON public.hc_programmatic_page_registry(page_type);
CREATE INDEX IF NOT EXISTS idx_hc_page_reg_city ON public.hc_programmatic_page_registry(city_id);
CREATE INDEX IF NOT EXISTS idx_hc_page_reg_corridor ON public.hc_programmatic_page_registry(corridor_id);

ALTER TABLE public.hc_programmatic_page_registry ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: SEO strategy (defensibility scores, render modes, indexability decisions).
CREATE POLICY hc_pagereg_service ON public.hc_programmatic_page_registry
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. hc_market_scoreboard_snapshots — market health snapshots
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_market_scoreboard_snapshots (
  market_scoreboard_snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at         timestamptz NOT NULL DEFAULT now(),
  scope_type          text NOT NULL,                  -- country, region, metro, city, corridor
  scope_id            uuid,                           -- FK varies by scope_type
  country_code        text,
  listing_density     numeric(8,3) NOT NULL DEFAULT 0,
  verified_density    numeric(8,3) NOT NULL DEFAULT 0,
  availability_density numeric(8,3) NOT NULL DEFAULT 0,
  claim_rate          numeric(8,3) NOT NULL DEFAULT 0,
  response_health     numeric(8,3) NOT NULL DEFAULT 0,
  recommendation_volume numeric(8,3) NOT NULL DEFAULT 0,
  route_support_completeness numeric(8,3) NOT NULL DEFAULT 0,
  infrastructure_completeness numeric(8,3) NOT NULL DEFAULT 0,
  enterprise_readiness numeric(8,3) NOT NULL DEFAULT 0,
  monetization_readiness numeric(8,3) NOT NULL DEFAULT 0,
  overall_market_score numeric(8,3) NOT NULL DEFAULT 0
);

DO $$ BEGIN
  ALTER TABLE public.hc_market_scoreboard_snapshots ADD CONSTRAINT chk_mss_scope_type
    CHECK (scope_type IN ('country','region','metro','city','corridor'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_hc_scoreboard_scope_time
  ON public.hc_market_scoreboard_snapshots(scope_type, scope_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_scoreboard_country_time
  ON public.hc_market_scoreboard_snapshots(country_code, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_scoreboard_overall
  ON public.hc_market_scoreboard_snapshots(overall_market_score DESC);

ALTER TABLE public.hc_market_scoreboard_snapshots ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: market intelligence (enterprise_readiness, monetization_readiness).
CREATE POLICY hc_scoreboard_service ON public.hc_market_scoreboard_snapshots
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.

COMMIT;
