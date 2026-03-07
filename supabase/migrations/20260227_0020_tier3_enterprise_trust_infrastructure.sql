-- Migration: 20260227_0020_tier3_enterprise_trust_infrastructure.sql
-- Tier 3 (Enterprise-Grade Trusted Infrastructure)
-- Data confidence, SLA enforcement, anti-extraction, geo credibility,
-- contract readiness, executive observability

-- ============================================================
-- 1. DATA CONFIDENCE SNAPSHOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.data_confidence_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,       -- 'corridor', 'place', 'broker', 'rate'
    entity_id text NOT NULL,         -- corridor_id, place_id, etc.
    confidence_score numeric(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    confidence_band text NOT NULL
        CHECK (confidence_band IN ('verified','high','medium','low')),
    freshness_seconds integer NOT NULL DEFAULT 0,
    source_count integer DEFAULT 1,
    source_blend jsonb DEFAULT '{}',      -- { "cron_enrichment": 0.4, "user_report": 0.3, "api_feed": 0.3 }
    geo_precision text DEFAULT 'corridor'
        CHECK (geo_precision IN ('exact','city','county','corridor','state','region','country')),
    cross_signal_agreement numeric(3,2) DEFAULT 0,
    last_verified_at timestamptz,
    computed_at timestamptz DEFAULT now(),
    UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_confidence_entity ON public.data_confidence_snapshots(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_confidence_band ON public.data_confidence_snapshots(confidence_band);
CREATE INDEX IF NOT EXISTS idx_confidence_score ON public.data_confidence_snapshots(confidence_score DESC);

ALTER TABLE public.data_confidence_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_confidence" ON public.data_confidence_snapshots FOR SELECT USING (true);
CREATE POLICY "service_write_confidence" ON public.data_confidence_snapshots FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. API SLA TRACKING WINDOWS (5-minute grain)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_sla_windows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    window_start timestamptz NOT NULL,
    window_end timestamptz NOT NULL,
    endpoint_family text NOT NULL,
    request_count integer DEFAULT 0,
    error_count integer DEFAULT 0,
    p50_latency_ms integer DEFAULT 0,
    p95_latency_ms integer DEFAULT 0,
    p99_latency_ms integer DEFAULT 0,
    uptime_percent numeric(5,2) DEFAULT 100.00,
    degraded boolean DEFAULT false,
    incident_id uuid,
    created_at timestamptz DEFAULT now(),
    UNIQUE(window_start, endpoint_family)
);

CREATE INDEX IF NOT EXISTS idx_sla_windows_time ON public.api_sla_windows(window_start DESC);
CREATE INDEX IF NOT EXISTS idx_sla_degraded ON public.api_sla_windows(degraded) WHERE degraded = true;

ALTER TABLE public.api_sla_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_sla" ON public.api_sla_windows FOR SELECT USING (true);
CREATE POLICY "service_write_sla" ON public.api_sla_windows FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. ENTERPRISE INCIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type text NOT NULL
        CHECK (incident_type IN ('sla_breach','degradation','outage','security','data_quality')),
    severity text NOT NULL DEFAULT 'low'
        CHECK (severity IN ('low','medium','high','critical')),
    title text NOT NULL,
    description text,
    affected_endpoints text[] DEFAULT '{}',
    affected_regions text[] DEFAULT '{}',
    started_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    duration_minutes integer,
    root_cause text,
    credit_eligible boolean DEFAULT false,
    credit_amount_cents integer DEFAULT 0,
    status text DEFAULT 'investigating'
        CHECK (status IN ('investigating','identified','monitoring','resolved','postmortem')),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.enterprise_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_incidents" ON public.enterprise_incidents FOR SELECT USING (true);
CREATE POLICY "service_write_incidents" ON public.enterprise_incidents FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 4. GEO CREDIBILITY SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.geo_credibility_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code text NOT NULL,
    country_code text,
    corridor_density_score numeric(5,4) DEFAULT 0,
    escort_supply_score numeric(5,4) DEFAULT 0,
    market_observability_score numeric(5,4) DEFAULT 0,
    freshness_index numeric(5,4) DEFAULT 0,
    confidence_weighted_coverage numeric(5,4) DEFAULT 0,
    composite_score numeric(5,4) DEFAULT 0,
    readiness_band text NOT NULL DEFAULT 'tier_d'
        CHECK (readiness_band IN ('tier_a','tier_b','tier_c','tier_d')),
    suppress_in_api boolean DEFAULT false,
    last_computed_at timestamptz DEFAULT now(),
    UNIQUE(region_code)
);

CREATE INDEX IF NOT EXISTS idx_geo_cred_band ON public.geo_credibility_scores(readiness_band);

ALTER TABLE public.geo_credibility_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_geo_cred" ON public.geo_credibility_scores FOR SELECT USING (true);
CREATE POLICY "service_write_geo_cred" ON public.geo_credibility_scores FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. ENTERPRISE CHANGELOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_changelog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version text NOT NULL,
    change_type text NOT NULL
        CHECK (change_type IN ('feature','improvement','fix','deprecation','breaking','security')),
    title text NOT NULL,
    description text,
    affected_products text[] DEFAULT '{}',
    published boolean DEFAULT false,
    published_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.enterprise_changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_changelog" ON public.enterprise_changelog FOR SELECT USING (published = true);
CREATE POLICY "service_write_changelog" ON public.enterprise_changelog FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 6. CONFIDENCE SCORING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_confidence_score(
    p_entity_type text,
    p_entity_id text,
    p_source_quality numeric DEFAULT 0.5,
    p_seconds_since_update integer DEFAULT 3600,
    p_geo_density numeric DEFAULT 0.5,
    p_cross_signal numeric DEFAULT 0.5,
    p_source_count integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score numeric;
    v_band text;
    v_freshness_weight numeric;
BEGIN
    -- Recency decay: exponential decay with 24h half-life
    v_freshness_weight := GREATEST(0.1, EXP(-0.693 * p_seconds_since_update / 86400.0));

    -- Composite confidence: weighted blend
    v_score := LEAST(1.0,
        0.30 * p_source_quality +
        0.25 * v_freshness_weight +
        0.20 * p_geo_density +
        0.15 * p_cross_signal +
        0.10 * LEAST(1.0, p_source_count / 5.0)
    );

    -- Band classification
    v_band := CASE
        WHEN v_score >= 0.90 THEN 'verified'
        WHEN v_score >= 0.75 THEN 'high'
        WHEN v_score >= 0.55 THEN 'medium'
        ELSE 'low'
    END;

    -- Upsert snapshot
    INSERT INTO public.data_confidence_snapshots (
        entity_type, entity_id, confidence_score, confidence_band,
        freshness_seconds, source_count, geo_precision, cross_signal_agreement, computed_at
    ) VALUES (
        p_entity_type, p_entity_id, v_score, v_band,
        p_seconds_since_update, p_source_count, 'corridor', p_cross_signal, now()
    )
    ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        confidence_score = v_score,
        confidence_band = v_band,
        freshness_seconds = p_seconds_since_update,
        source_count = p_source_count,
        cross_signal_agreement = p_cross_signal,
        computed_at = now();

    RETURN jsonb_build_object(
        'entity_type', p_entity_type,
        'entity_id', p_entity_id,
        'confidence_score', v_score,
        'confidence_band', v_band,
        'freshness_weight', v_freshness_weight,
        'computed_at', now()
    );
END;
$$;

-- ============================================================
-- 7. SLA WINDOW AGGREGATION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_sla_window(
    p_endpoint_family text,
    p_window_start timestamptz,
    p_request_count integer,
    p_error_count integer,
    p_p50_ms integer,
    p_p95_ms integer,
    p_p99_ms integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uptime numeric;
    v_degraded boolean;
BEGIN
    v_uptime := CASE
        WHEN p_request_count = 0 THEN 100.00
        ELSE ROUND((1.0 - p_error_count::numeric / p_request_count) * 100, 2)
    END;

    v_degraded := v_uptime < 99.9 OR p_p95_ms > 450;

    INSERT INTO public.api_sla_windows (
        window_start, window_end, endpoint_family,
        request_count, error_count, p50_latency_ms, p95_latency_ms, p99_latency_ms,
        uptime_percent, degraded
    ) VALUES (
        p_window_start, p_window_start + interval '5 minutes', p_endpoint_family,
        p_request_count, p_error_count, p_p50_ms, p_p95_ms, p_p99_ms,
        v_uptime, v_degraded
    )
    ON CONFLICT (window_start, endpoint_family) DO UPDATE SET
        request_count = p_request_count,
        error_count = p_error_count,
        p50_latency_ms = p_p50_ms,
        p95_latency_ms = p_p95_ms,
        p99_latency_ms = p_p99_ms,
        uptime_percent = v_uptime,
        degraded = v_degraded;

    -- Auto-create incident if SLA breached
    IF v_degraded AND v_uptime < 99.5 THEN
        INSERT INTO public.enterprise_incidents (
            incident_type, severity, title, description,
            affected_endpoints, started_at
        ) VALUES (
            'sla_breach',
            CASE WHEN v_uptime < 95.0 THEN 'critical' WHEN v_uptime < 99.0 THEN 'high' ELSE 'medium' END,
            'SLA breach detected: ' || p_endpoint_family,
            'Uptime dropped to ' || v_uptime || '% in 5-min window starting ' || p_window_start,
            ARRAY[p_endpoint_family],
            p_window_start
        );
    END IF;
END;
$$;

-- ============================================================
-- 8. GEO CREDIBILITY COMPUTE FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_geo_credibility(p_region text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corridor_density numeric;
    v_supply numeric;
    v_observability numeric;
    v_freshness numeric;
    v_composite numeric;
    v_band text;
BEGIN
    -- Corridor density: count of corridors with recent data
    SELECT LEAST(1.0, COUNT(*)::numeric / 20.0) INTO v_corridor_density
    FROM public.hc_corridor_market_metrics
    WHERE corridor_id LIKE '%' || p_region || '%'
      AND created_at > now() - interval '7 days';

    -- Escort supply: count of active escorts in region
    SELECT LEAST(1.0, COUNT(*)::numeric / 50.0) INTO v_supply
    FROM public.profiles
    WHERE service_area_states @> ARRAY[p_region]
      AND profile_complete = true;

    -- Market observability: count of data points in last 7 days
    SELECT LEAST(1.0, COUNT(*)::numeric / 100.0) INTO v_observability
    FROM public.enterprise_usage_events
    WHERE geo_scope = p_region
      AND created_at > now() - interval '7 days';

    -- Freshness: most recent corridor update age
    SELECT LEAST(1.0, GREATEST(0,
        1.0 - EXTRACT(EPOCH FROM (now() - MAX(created_at))) / 604800.0
    )) INTO v_freshness
    FROM public.hc_corridor_market_metrics
    WHERE corridor_id LIKE '%' || p_region || '%';

    v_corridor_density := COALESCE(v_corridor_density, 0);
    v_supply := COALESCE(v_supply, 0);
    v_observability := COALESCE(v_observability, 0);
    v_freshness := COALESCE(v_freshness, 0);

    -- Composite
    v_composite := 0.30 * v_corridor_density + 0.25 * v_supply + 0.25 * v_observability + 0.20 * v_freshness;

    v_band := CASE
        WHEN v_composite >= 0.80 THEN 'tier_a'
        WHEN v_composite >= 0.55 THEN 'tier_b'
        WHEN v_composite >= 0.30 THEN 'tier_c'
        ELSE 'tier_d'
    END;

    -- Upsert
    INSERT INTO public.geo_credibility_scores (
        region_code, corridor_density_score, escort_supply_score,
        market_observability_score, freshness_index, composite_score,
        readiness_band, suppress_in_api, last_computed_at
    ) VALUES (
        p_region, v_corridor_density, v_supply, v_observability, v_freshness,
        v_composite, v_band, v_band = 'tier_d', now()
    )
    ON CONFLICT (region_code) DO UPDATE SET
        corridor_density_score = v_corridor_density,
        escort_supply_score = v_supply,
        market_observability_score = v_observability,
        freshness_index = v_freshness,
        composite_score = v_composite,
        readiness_band = v_band,
        suppress_in_api = v_band = 'tier_d',
        last_computed_at = now();

    RETURN jsonb_build_object(
        'region', p_region,
        'composite', v_composite,
        'band', v_band,
        'corridor_density', v_corridor_density,
        'supply', v_supply,
        'observability', v_observability,
        'freshness', v_freshness
    );
END;
$$;

-- ============================================================
-- 9. EVIDENCE VAULT RECORDS (FP-C1 — persistence fix)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evidence_vault_records (
    id text PRIMARY KEY,
    entity_id text NOT NULL,
    field_name text NOT NULL,
    value jsonb,
    source_url text,
    fetch_timestamp timestamptz NOT NULL DEFAULT now(),
    content_hash text NOT NULL,
    snapshot_pointer text,
    confidence_score numeric(5,4) DEFAULT 0,
    verification_method text NOT NULL
        CHECK (verification_method IN ('SCRAPE_MATCH','USER_SUBMISSION','GOV_API','MANUAL_DEPUTY')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_entity ON public.evidence_vault_records(entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_entity_field ON public.evidence_vault_records(entity_id, field_name);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON public.evidence_vault_records(content_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_confidence ON public.evidence_vault_records(confidence_score DESC);

ALTER TABLE public.evidence_vault_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_evidence" ON public.evidence_vault_records FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 10. ANTI-EXTRACTION FINGERPRINTS (Phase 3 abuse defense)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.extraction_fingerprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id uuid NOT NULL,
    fingerprint_type text NOT NULL
        CHECK (fingerprint_type IN (
            'graph_walk','low_entropy_query','rotating_key','distributed_scrape',
            'geo_impossible_travel','bulk_sequential','time_pattern'
        )),
    risk_score numeric(5,4) DEFAULT 0,
    evidence jsonb DEFAULT '{}',
    detected_at timestamptz DEFAULT now(),
    action_taken text DEFAULT 'none'
        CHECK (action_taken IN ('none','rate_clamp','response_blur','shadow_ban','quarantine','suspended'))
);

CREATE INDEX IF NOT EXISTS idx_extraction_fp_key ON public.extraction_fingerprints(api_key_id);
CREATE INDEX IF NOT EXISTS idx_extraction_fp_type ON public.extraction_fingerprints(fingerprint_type);
CREATE INDEX IF NOT EXISTS idx_extraction_fp_risk ON public.extraction_fingerprints(risk_score DESC);

ALTER TABLE public.extraction_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_extraction" ON public.extraction_fingerprints FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 11. HONEYFIELD MARKERS (silent leak detection)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.honeyfield_markers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id uuid NOT NULL,
    marker_type text NOT NULL DEFAULT 'synthetic_row'
        CHECK (marker_type IN ('synthetic_row','watermark_value','precision_fingerprint','timing_marker')),
    marker_value text NOT NULL,
    injected_in_endpoint text,
    injected_at timestamptz DEFAULT now(),
    detected boolean DEFAULT false,
    detected_at timestamptz,
    detection_source text,
    UNIQUE(marker_value)
);

CREATE INDEX IF NOT EXISTS idx_honeyfield_key ON public.honeyfield_markers(api_key_id);
CREATE INDEX IF NOT EXISTS idx_honeyfield_value ON public.honeyfield_markers(marker_value);

ALTER TABLE public.honeyfield_markers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_honeyfield" ON public.honeyfield_markers FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 12. ENTERPRISE CONTRACT ARTIFACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_contract_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_type text NOT NULL
        CHECK (artifact_type IN (
            'dpa_template','security_whitepaper','sla_document','rate_limit_policy',
            'data_retention_policy','subprocessor_registry','methodology_doc'
        )),
    title text NOT NULL,
    version text NOT NULL DEFAULT '1.0',
    content_md text,
    content_url text,
    plan_scope text[] DEFAULT '{}', -- which plans this applies to
    public_visible boolean DEFAULT false,
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.enterprise_contract_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_contracts" ON public.enterprise_contract_artifacts
    FOR SELECT USING (public_visible = true);
CREATE POLICY "service_all_contracts" ON public.enterprise_contract_artifacts
    FOR ALL USING (auth.role() = 'service_role');
