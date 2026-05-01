-- ============================================================
-- 15X DATA PRODUCT MONETIZATION TABLES
-- Turns Haul Command intelligence into audited self-serve exports.
-- ============================================================

begin;

CREATE TABLE IF NOT EXISTS public.data_product_export_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    email text,
    product_id text NOT NULL,
    country_code text NOT NULL DEFAULT 'ALL',
    region_code text,
    corridor_code text,
    geo_kind text,
    export_format text NOT NULL DEFAULT 'csv' CHECK (export_format IN ('csv', 'json', 'geojson')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed', 'expired')),
    row_count integer NOT NULL DEFAULT 0,
    row_limit integer NOT NULL DEFAULT 100,
    download_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
    filters jsonb NOT NULL DEFAULT '{}',
    redaction_policy text NOT NULL DEFAULT 'aggregate_safe',
    confidence_floor numeric(5,4) NOT NULL DEFAULT 0.35,
    source_classes text[] NOT NULL DEFAULT ARRAY['platform','public','derived'],
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error_message text
);

CREATE TABLE IF NOT EXISTS public.data_product_export_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    export_job_id uuid REFERENCES public.data_product_export_jobs(id) ON DELETE CASCADE,
    user_id uuid,
    email text,
    event_type text NOT NULL,
    product_id text,
    country_code text,
    properties jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_product_market_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id text NOT NULL,
    country_code text NOT NULL,
    region_code text,
    city text,
    corridor_code text,
    port_code text,
    border_crossing_code text,
    industrial_zone_code text,
    h3_cell text,
    market_name text NOT NULL,
    maturity_status text NOT NULL DEFAULT 'building' CHECK (maturity_status IN ('live','building','sparse','request_only','blocked')),
    confidence_score numeric(5,4) NOT NULL DEFAULT 0.35,
    confidence_band text NOT NULL DEFAULT 'low' CHECK (confidence_band IN ('verified','high','medium','low')),
    source_class text NOT NULL DEFAULT 'derived',
    privacy_class text NOT NULL DEFAULT 'aggregate_safe',
    freshness_window text NOT NULL DEFAULT 'weekly',
    demand_score numeric(8,3),
    supply_score numeric(8,3),
    scarcity_score numeric(8,3),
    liquidity_score numeric(8,3),
    port_pressure_score numeric(8,3),
    permit_complexity_score numeric(8,3),
    infrastructure_fit_score numeric(8,3),
    broker_activity_density numeric(8,3),
    operator_density numeric(8,3),
    claimed_listing_count integer DEFAULT 0,
    unclaimed_listing_count integer DEFAULT 0,
    active_corridor_count integer DEFAULT 0,
    active_port_count integer DEFAULT 0,
    religious_holiday_flags jsonb NOT NULL DEFAULT '[]',
    cultural_localization jsonb NOT NULL DEFAULT '{}',
    preview_payload jsonb NOT NULL DEFAULT '{}',
    paid_payload jsonb NOT NULL DEFAULT '{}',
    source_summary jsonb NOT NULL DEFAULT '{}',
    last_observed_at timestamptz,
    computed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_product_export_jobs_lookup
    ON public.data_product_export_jobs (product_id, country_code, corridor_code, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_product_market_snapshots_geo
    ON public.data_product_market_snapshots (product_id, country_code, region_code, corridor_code, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_product_market_snapshots_port
    ON public.data_product_market_snapshots (country_code, port_code, computed_at DESC)
    WHERE port_code IS NOT NULL;

ALTER TABLE public.data_product_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_product_export_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_product_market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_product_export_jobs_own
    ON public.data_product_export_jobs FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY data_product_export_jobs_service
    ON public.data_product_export_jobs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY data_product_export_events_own
    ON public.data_product_export_events FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY data_product_export_events_service
    ON public.data_product_export_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY data_product_market_snapshots_public_preview
    ON public.data_product_market_snapshots FOR SELECT TO anon, authenticated
    USING (privacy_class IN ('aggregate_safe','redacted') AND confidence_score >= 0.25);

CREATE POLICY data_product_market_snapshots_service
    ON public.data_product_market_snapshots FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

commit;
