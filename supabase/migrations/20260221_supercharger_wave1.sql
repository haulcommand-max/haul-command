-- Supercharger Wave 1 Migration: Fill Speed + Trust
-- Covers: Proof Bundles, Broker Risk Radar, Near-Miss Capture, Readiness Score

-- ============================================================
-- 1. PROOF BUNDLE ENGINE (30x multiplier)
-- Auto-generated professional proof packets after every job
-- ============================================================

CREATE TABLE public.proof_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,                        -- references the completed load/booking
    escort_id UUID NOT NULL REFERENCES public.profiles(id),
    broker_id UUID REFERENCES public.profiles(id),

    -- Timeline data
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    duration_minutes INT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 60
    ) STORED,

    -- Geo evidence
    origin_coords JSONB,                         -- {lat, lng}
    destination_coords JSONB,                    -- {lat, lng}
    route_waypoints JSONB DEFAULT '[]'::JSONB,   -- [{lat, lng, ts, label}]

    -- Photo evidence
    photos JSONB DEFAULT '[]'::JSONB,            -- [{url, caption, ts}]

    -- Incident log
    incidents JSONB DEFAULT '[]'::JSONB,         -- [{type, description, ts, severity}]

    -- Generated output
    pdf_url TEXT,                                 -- Supabase Storage URL
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'sent')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proof_bundles_escort ON public.proof_bundles(escort_id);
CREATE INDEX idx_proof_bundles_job ON public.proof_bundles(job_id);

-- ============================================================
-- 2. BROKER RISK RADAR (20x multiplier)
-- Rank brokers the same way escorts are ranked
-- ============================================================

CREATE TABLE public.broker_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES public.profiles(id),

    -- Core trust signals
    payment_velocity_score NUMERIC DEFAULT 50 CHECK (payment_velocity_score BETWEEN 0 AND 100),
    dispute_frequency_score NUMERIC DEFAULT 50 CHECK (dispute_frequency_score BETWEEN 0 AND 100),
    cancellation_behavior_score NUMERIC DEFAULT 50 CHECK (cancellation_behavior_score BETWEEN 0 AND 100),
    ghosting_reports INT DEFAULT 0,

    -- Aggregated
    composite_trust_score NUMERIC GENERATED ALWAYS AS (
        (payment_velocity_score * 0.40) +
        (dispute_frequency_score * 0.25) +
        (cancellation_behavior_score * 0.25) +
        (GREATEST(0, 10 - ghosting_reports) * 1.0)    -- -1 pt per ghost, floor 0
    ) STORED,

    -- Metadata
    total_jobs_posted INT DEFAULT 0,
    total_jobs_filled INT DEFAULT 0,
    avg_payment_days NUMERIC,
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_broker_score UNIQUE (broker_id)
);

CREATE INDEX idx_broker_scores_composite ON public.broker_scores(composite_trust_score DESC);

-- ============================================================
-- 3. NEAR-MISS CAPTURE (25x multiplier)
-- When a load fails to fill, capture why
-- ============================================================

CREATE TABLE public.fill_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL,
    corridor TEXT,                                 -- e.g. 'I-75', 'I-10'
    origin_state TEXT,
    dest_state TEXT,

    -- Failure classification
    failure_reason TEXT NOT NULL CHECK (failure_reason IN (
        'no_response', 'rate_too_low', 'no_available_escorts',
        'timing_conflict', 'equipment_mismatch', 'broker_canceled',
        'weather_event', 'permit_delay', 'unknown'
    )),

    -- Intelligence capture
    offered_rate_usd NUMERIC,
    market_rate_usd NUMERIC,                      -- What the system thinks is fair
    rate_gap_pct NUMERIC GENERATED ALWAYS AS (
        CASE WHEN market_rate_usd > 0
             THEN ((market_rate_usd - COALESCE(offered_rate_usd, 0)) / market_rate_usd) * 100
             ELSE 0 END
    ) STORED,

    escorts_contacted INT DEFAULT 0,
    escorts_declined INT DEFAULT 0,
    escorts_available_in_region INT DEFAULT 0,     -- Supply snapshot at time of failure

    -- Auto-generated suggestion
    suggested_rate_usd NUMERIC,
    supply_gap_flagged BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fill_failures_corridor ON public.fill_failures(corridor);
CREATE INDEX idx_fill_failures_reason ON public.fill_failures(failure_reason);
CREATE INDEX idx_fill_failures_gap ON public.fill_failures(supply_gap_flagged) WHERE supply_gap_flagged = TRUE;

-- ============================================================
-- 4. READINESS SCORE (20x multiplier)
-- Composite column: availability + recency + response latency + equipment
-- ============================================================

-- Add readiness columns to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS readiness_score NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS avg_response_seconds INT,
    ADD COLUMN IF NOT EXISTS equipment_completeness_pct NUMERIC DEFAULT 0;

-- RPC to recompute readiness score for a single profile
CREATE OR REPLACE FUNCTION public.recompute_readiness_score(target_profile_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_availability NUMERIC := 0;
    v_recency NUMERIC := 0;
    v_response NUMERIC := 0;
    v_equipment NUMERIC := 0;
    v_last_active TIMESTAMPTZ;
    v_avg_resp INT;
    v_equip_pct NUMERIC;
    v_is_available BOOLEAN;
    v_final NUMERIC;
BEGIN
    -- Fetch current values
    SELECT
        COALESCE(is_available, FALSE),
        last_active_at,
        avg_response_seconds,
        equipment_completeness_pct
    INTO v_is_available, v_last_active, v_avg_resp, v_equip_pct
    FROM public.profiles WHERE id = target_profile_id;

    -- Component 1: Availability (0 or 25)
    IF v_is_available THEN v_availability := 25; END IF;

    -- Component 2: Recency (0-25, decays over 7 days)
    IF v_last_active IS NOT NULL THEN
        v_recency := GREATEST(0, 25 - (EXTRACT(EPOCH FROM (NOW() - v_last_active)) / 3600 / 24) * 3.57);
    END IF;

    -- Component 3: Response speed (0-25, <60s = 25, >300s = 0)
    IF v_avg_resp IS NOT NULL THEN
        v_response := GREATEST(0, 25 - (GREATEST(0, v_avg_resp - 60) * 0.104));
    END IF;

    -- Component 4: Equipment completeness (0-25)
    v_equipment := COALESCE(v_equip_pct, 0) * 0.25;

    v_final := ROUND(v_availability + v_recency + v_response + v_equipment, 1);

    UPDATE public.profiles SET readiness_score = v_final WHERE id = target_profile_id;
    RETURN v_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. LOAD ENRICHMENT (50x multiplier)
-- Add fill-speed fields to the loads table
-- ============================================================

ALTER TABLE public.loads
    ADD COLUMN IF NOT EXISTS estimated_fill_time_min INT,
    ADD COLUMN IF NOT EXISTS nearby_available_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS first_response_seconds INT;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.proof_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fill_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escorts view own proof bundles"
    ON public.proof_bundles FOR SELECT TO authenticated
    USING (auth.uid() = escort_id);

CREATE POLICY "Brokers view bundles for their loads"
    ON public.proof_bundles FOR SELECT TO authenticated
    USING (auth.uid() = broker_id);

CREATE POLICY "Broker scores visible to all authenticated"
    ON public.broker_scores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Fill failures visible to admins"
    ON public.fill_failures FOR SELECT TO authenticated USING (true);
