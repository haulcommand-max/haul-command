-- ============================================================================
-- NICHE ENRICHMENT ENGINE — Oversize Ecosystem Targeted Enrichment v2
-- Stores OERS-scored, deduplicated, pipeline-enriched entities
-- Source of truth for all niche POI candidates discovered via OSM/Google
-- ============================================================================

-- ── 1. ENRICHMENT RESULTS (scored pipeline output) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.enrichment_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id           TEXT NOT NULL UNIQUE,         -- osm_node_12345 / gp_abc123
    source              TEXT NOT NULL,                -- 'osm' | 'google' | 'seed' | 'partner'
    name                TEXT NOT NULL,
    lat                 NUMERIC(10,7),
    lon                 NUMERIC(10,7),
    country_code        VARCHAR(2),
    corridor_slug       TEXT,
    city                TEXT,
    region              TEXT,
    phone               TEXT,
    website             TEXT,
    address             TEXT,

    -- OERS Scoring
    oers_score          NUMERIC(6,4) NOT NULL DEFAULT 0.0,
    oers_verdict        TEXT NOT NULL DEFAULT 'reject',    -- include | review | reject
    matched_tier        TEXT,                              -- tier1_direct_escort, tier2_heavy_haul_core, etc.
    matched_keywords    TEXT[] DEFAULT '{}',
    semantic_hit        BOOLEAN DEFAULT false,
    cross_source_confirmed BOOLEAN DEFAULT false,
    categories          TEXT[] DEFAULT '{}',

    -- Competitor Density Intelligence
    escort_density_score    NUMERIC(8,4) DEFAULT 0.0,
    opportunity_index       NUMERIC(8,4) DEFAULT 0.0,

    -- Lifecycle
    promoted_to_places  BOOLEAN DEFAULT false,        -- true when moved into `places` table
    promoted_at         TIMESTAMPTZ,
    reviewed_by         UUID,                         -- admin who reviewed (if manual)
    reviewed_at         TIMESTAMPTZ,
    review_notes        TEXT,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS er_oers_idx ON public.enrichment_results (oers_score DESC) WHERE oers_verdict = 'include';
CREATE INDEX IF NOT EXISTS er_verdict_idx ON public.enrichment_results (oers_verdict);
CREATE INDEX IF NOT EXISTS er_corridor_idx ON public.enrichment_results (corridor_slug, country_code);
CREATE INDEX IF NOT EXISTS er_source_idx ON public.enrichment_results (source);
CREATE INDEX IF NOT EXISTS er_tier_idx ON public.enrichment_results (matched_tier);
CREATE INDEX IF NOT EXISTS er_geo_idx ON public.enrichment_results (lat, lon);
CREATE INDEX IF NOT EXISTS er_promoted_idx ON public.enrichment_results (promoted_to_places) WHERE promoted_to_places = false AND oers_verdict = 'include';

-- ── 2. ENRICHMENT CACHE (Google Places TTL) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.enrichment_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_lat      NUMERIC(6,2) NOT NULL,   -- rounded for grouping
    center_lon      NUMERIC(6,2) NOT NULL,
    radius_km       INT NOT NULL,
    candidates_json JSONB NOT NULL,
    cached_at       TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    UNIQUE(center_lat, center_lon, radius_km)
);

CREATE INDEX IF NOT EXISTS ec_expires_idx ON public.enrichment_cache (expires_at);

-- ── 3. ENRICHMENT PIPELINE RUNS (audit log) ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.enrichment_pipeline_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_slug       TEXT NOT NULL,
    country_code        VARCHAR(2),
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    status              TEXT DEFAULT 'running',       -- running | completed | failed
    osm_candidates      INT DEFAULT 0,
    google_candidates   INT DEFAULT 0,
    cross_source_matches INT DEFAULT 0,
    total_included      INT DEFAULT 0,
    total_review        INT DEFAULT 0,
    total_rejected      INT DEFAULT 0,
    total_deduped       INT DEFAULT 0,
    saved_to_db         INT DEFAULT 0,
    google_spend_usd    NUMERIC(6,2) DEFAULT 0.0,
    errors              TEXT[] DEFAULT '{}',
    metadata_json       JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS epr_corridor_idx ON public.enrichment_pipeline_runs (corridor_slug, started_at DESC);
CREATE INDEX IF NOT EXISTS epr_status_idx ON public.enrichment_pipeline_runs (status);

-- ── 4. CORRIDOR DENSITY SNAPSHOTS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.corridor_density_snapshots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_slug           TEXT NOT NULL,
    country_code            VARCHAR(2),
    escort_density_score    NUMERIC(8,4) DEFAULT 0.0,
    heavy_haul_density_score NUMERIC(8,4) DEFAULT 0.0,
    saturation_flag         BOOLEAN DEFAULT false,
    opportunity_index       NUMERIC(8,4) DEFAULT 0.0,
    metro_area_km2          NUMERIC(10,2),
    escort_count            INT DEFAULT 0,
    heavy_haul_count        INT DEFAULT 0,
    traffic_score           NUMERIC(5,2) DEFAULT 0.0,
    computed_at             TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(corridor_slug, country_code)
);

CREATE INDEX IF NOT EXISTS cds_opportunity_idx ON public.corridor_density_snapshots (opportunity_index DESC);

-- ── 5. RLS POLICIES ───────────────────────────────────────────────────────

ALTER TABLE public.enrichment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_density_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY er_sr ON public.enrichment_results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ec_sr ON public.enrichment_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY epr_sr ON public.enrichment_pipeline_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY cds_sr ON public.corridor_density_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read for included enrichment results (shows on pages)
CREATE POLICY er_public_read ON public.enrichment_results FOR SELECT USING (oers_verdict = 'include');
CREATE POLICY cds_public_read ON public.corridor_density_snapshots FOR SELECT USING (true);

-- ── 6. UPDATED_AT TRIGGER ─────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_enrichment_results_updated ON public.enrichment_results;
CREATE TRIGGER trg_enrichment_results_updated
BEFORE UPDATE ON public.enrichment_results
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7. AUTO-PURGE EXPIRED CACHE ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.purge_enrichment_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.enrichment_cache WHERE expires_at < NOW();
END;
$$;

-- ── 8. PROMOTE ENRICHED → PLACES (for approved entities) ─────────────────

CREATE OR REPLACE FUNCTION public.promote_enrichment_to_place(p_enrichment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_place_id UUID;
    v_er RECORD;
BEGIN
    SELECT * INTO v_er FROM public.enrichment_results WHERE id = p_enrichment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Enrichment result not found'; END IF;
    IF v_er.promoted_to_places THEN RAISE EXCEPTION 'Already promoted'; END IF;
    IF v_er.oers_verdict != 'include' THEN RAISE EXCEPTION 'Only include-verdict entities can be promoted'; END IF;

    -- Determine place_type from matched_tier
    -- tier1/tier2 → service_area (escort services are operators, not places)
    -- tier3 → industrial_park_services (supporting logistics)
    -- tier4 → scale_weigh_station_public (compliance)
    INSERT INTO public.places (
        place_type, name, country_code, region, city, lat, lon, address, phone, website,
        data_source, claim_status, trust_score_seed, slug
    ) VALUES (
        CASE
            WHEN v_er.matched_tier IN ('tier1_direct_escort', 'tier2_heavy_haul_core') THEN 'service_area'::public.place_type
            WHEN v_er.matched_tier = 'tier3_supporting_logistics' THEN 'industrial_park_services'::public.place_type
            WHEN v_er.matched_tier = 'tier4_compliance_signal' THEN 'scale_weigh_station_public'::public.place_type
            ELSE 'service_area'::public.place_type
        END,
        v_er.name, v_er.country_code, v_er.region, v_er.city, v_er.lat, v_er.lon,
        v_er.address, v_er.phone, v_er.website,
        v_er.source, 'unclaimed', v_er.oers_score * 100,
        lower(replace(replace(v_er.name, ' ', '-'), '''', ''))
    ) RETURNING place_id INTO v_place_id;

    UPDATE public.enrichment_results
    SET promoted_to_places = true, promoted_at = NOW()
    WHERE id = p_enrichment_id;

    RETURN v_place_id;
END;
$$;
