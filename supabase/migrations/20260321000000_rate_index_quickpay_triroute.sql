-- ============================================================================
-- Haul Command — Rate Index Cache + QuickPay + TriRoute
-- Migration: 20260321000000
--
-- Three features in one migration:
-- 1. rate_index_cache — materialized aggregate for the public Rate Index page
-- 2. quickpay_transactions — Stripe Connect instant payout ledger (upgrades factoring_requests)
-- 3. triroute_suggestions — spatial load matching for anti-deadhead routing
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. RATE INDEX CACHE — nightly materialized view for public consumption
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rate_index_cache (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_key            TEXT NOT NULL,
    origin_admin_division   TEXT NOT NULL,
    destination_admin_division TEXT NOT NULL,
    country_code            TEXT NOT NULL DEFAULT 'US',

    -- Aggregated rate data
    avg_rate_per_mile       NUMERIC(8,2),
    median_rate_per_mile    NUMERIC(8,2),
    p10_rate                NUMERIC(8,2),
    p25_rate                NUMERIC(8,2),
    p75_rate                NUMERIC(8,2),
    p90_rate                NUMERIC(8,2),
    sample_count            INTEGER DEFAULT 0,
    currency                TEXT DEFAULT 'USD',

    -- Service breakdown
    avg_rate_lead           NUMERIC(8,2),
    avg_rate_chase          NUMERIC(8,2),
    avg_rate_steer          NUMERIC(8,2),
    avg_rate_survey         NUMERIC(8,2),

    -- Trend data
    rate_7d_ago             NUMERIC(8,2),
    rate_30d_ago            NUMERIC(8,2),
    rate_change_7d_pct      NUMERIC(5,2),
    rate_change_30d_pct     NUMERIC(5,2),
    trend_direction         TEXT DEFAULT 'stable',  -- 'rising', 'stable', 'falling'

    -- Volume/demand signals
    observation_count_7d    INTEGER DEFAULT 0,
    observation_count_30d   INTEGER DEFAULT 0,
    demand_band             TEXT DEFAULT 'emerging', -- 'cold', 'emerging', 'strong', 'dominant'

    -- Metadata
    last_computed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_window_start       DATE,
    data_window_end         DATE,

    UNIQUE (corridor_key, country_code)
);

CREATE INDEX IF NOT EXISTS idx_ric_corridor ON rate_index_cache (corridor_key);
CREATE INDEX IF NOT EXISTS idx_ric_origin ON rate_index_cache (origin_admin_division);
CREATE INDEX IF NOT EXISTS idx_ric_dest ON rate_index_cache (destination_admin_division);
CREATE INDEX IF NOT EXISTS idx_ric_country ON rate_index_cache (country_code);
CREATE INDEX IF NOT EXISTS idx_ric_rate ON rate_index_cache (avg_rate_per_mile DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ric_demand ON rate_index_cache (demand_band);

-- Public read for SEO / public rate index page
ALTER TABLE rate_index_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read rate_index_cache"
    ON rate_index_cache FOR SELECT USING (true);


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. QUICKPAY TRANSACTIONS — Stripe Connect instant payout ledger
-- Upgrades and coexists with existing factoring_requests table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS quickpay_transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id             UUID NOT NULL REFERENCES profiles(id),
    broker_id               UUID NOT NULL REFERENCES profiles(id),
    booking_id              UUID,                          -- FK to loads/bookings

    -- Amounts (all in cents for Stripe precision)
    gross_amount_cents      INTEGER NOT NULL,               -- Full invoice amount
    fee_amount_cents        INTEGER NOT NULL,               -- Platform fee (2-3%)
    net_payout_cents        INTEGER NOT NULL,               -- What operator receives
    fee_percentage          NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    currency                TEXT NOT NULL DEFAULT 'usd',

    -- Stripe IDs
    stripe_transfer_id      TEXT,                           -- Stripe Transfer ID
    stripe_payout_id        TEXT,                           -- Stripe Payout ID (instant)
    stripe_connect_account  TEXT,                           -- Operator's Stripe Connect ID
    stripe_charge_id        TEXT,                           -- Original charge from broker

    -- Status
    status                  TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN (
            'pending',           -- QuickPay requested
            'risk_review',       -- Awaiting risk check
            'approved',          -- Risk cleared, ready to transfer
            'transferring',      -- Stripe transfer initiated
            'completed',         -- Money landed in operator's bank
            'failed',            -- Transfer failed
            'reversed',          -- Clawed back (broker non-payment)
            'cancelled'          -- Operator cancelled
        )),

    -- Risk assessment
    risk_score              NUMERIC(3,2) DEFAULT 0,         -- 0-1 (1 = high risk)
    risk_flags              TEXT[] DEFAULT '{}',
    broker_payment_history_ok BOOLEAN DEFAULT true,
    broker_dispute_count    INTEGER DEFAULT 0,

    -- Timing
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at             TIMESTAMPTZ,
    transferred_at          TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    failed_at               TIMESTAMPTZ,
    failure_reason          TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qp_operator ON quickpay_transactions (operator_id);
CREATE INDEX IF NOT EXISTS idx_qp_broker ON quickpay_transactions (broker_id);
CREATE INDEX IF NOT EXISTS idx_qp_status ON quickpay_transactions (status);
CREATE INDEX IF NOT EXISTS idx_qp_stripe_transfer ON quickpay_transactions (stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_qp_requested ON quickpay_transactions (requested_at DESC);

ALTER TABLE quickpay_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators see their own quickpay transactions"
    ON quickpay_transactions FOR SELECT
    TO authenticated USING (auth.uid() = operator_id);

CREATE POLICY "Operators can request quickpay"
    ON quickpay_transactions FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = operator_id);

-- Admin finance view (service role only — no policy needed, uses service_role key)


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. TRIROUTE — Spatial load matching for anti-deadhead routing
-- Uses PostGIS for proximity queries
-- ══════════════════════════════════════════════════════════════════════════════

-- Ensure PostGIS is available
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add spatial columns to lb_observations if they don't exist
DO $$ BEGIN
    ALTER TABLE lb_observations ADD COLUMN IF NOT EXISTS origin_geom GEOMETRY(Point, 4326);
    ALTER TABLE lb_observations ADD COLUMN IF NOT EXISTS destination_geom GEOMETRY(Point, 4326);
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_lb_obs_origin_geom ON lb_observations USING GIST (origin_geom);
CREATE INDEX IF NOT EXISTS idx_lb_obs_dest_geom ON lb_observations USING GIST (destination_geom);

-- TriRoute search function: find loads near a given delivery point
CREATE OR REPLACE FUNCTION find_triroute_matches(
    p_delivery_lat  DOUBLE PRECISION,
    p_delivery_lng  DOUBLE PRECISION,
    p_radius_miles  INTEGER DEFAULT 75,
    p_depart_after  DATE DEFAULT CURRENT_DATE,
    p_depart_before DATE DEFAULT CURRENT_DATE + INTERVAL '5 days',
    p_exclude_id    UUID DEFAULT NULL,
    p_limit         INTEGER DEFAULT 10
)
RETURNS TABLE (
    load_id         UUID,
    origin_city     TEXT,
    origin_admin    TEXT,
    dest_city       TEXT,
    dest_admin      TEXT,
    service_type    TEXT,
    corridor_key    TEXT,
    deadhead_miles  NUMERIC,
    quoted_amount   NUMERIC,
    derived_ppm     NUMERIC,
    observed_date   DATE,
    parse_confidence NUMERIC,
    match_score     NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_radius_meters DOUBLE PRECISION;
    v_delivery_point GEOMETRY;
BEGIN
    v_radius_meters := p_radius_miles * 1609.34;
    v_delivery_point := ST_SetSRID(ST_MakePoint(p_delivery_lng, p_delivery_lat), 4326);

    RETURN QUERY
    SELECT
        o.id AS load_id,
        o.origin_city,
        o.origin_admin_division AS origin_admin,
        o.destination_city AS dest_city,
        o.destination_admin_division AS dest_admin,
        o.service_type,
        o.corridor_key,
        ROUND(
            (ST_Distance(v_delivery_point::geography, o.origin_geom::geography) / 1609.34)::NUMERIC,
            1
        ) AS deadhead_miles,
        o.quoted_amount,
        o.derived_pay_per_mile AS derived_ppm,
        o.observed_date,
        o.parse_confidence,
        -- Match score: lower deadhead = better, recency bonus, rate bonus
        ROUND(
            (
                (1.0 - LEAST(1.0, (ST_Distance(v_delivery_point::geography, o.origin_geom::geography) / 1609.34) / p_radius_miles::NUMERIC)) * 0.50 +
                CASE WHEN o.observed_date >= CURRENT_DATE - 2 THEN 0.30
                     WHEN o.observed_date >= CURRENT_DATE - 7 THEN 0.15
                     ELSE 0.05 END +
                CASE WHEN o.quoted_amount IS NOT NULL AND o.quoted_amount > 0 THEN 0.20 ELSE 0.05 END
            )::NUMERIC,
            3
        ) AS match_score
    FROM lb_observations o
    WHERE
        o.origin_geom IS NOT NULL
        AND ST_DWithin(v_delivery_point::geography, o.origin_geom::geography, v_radius_meters)
        AND o.observed_date >= p_depart_after
        AND o.observed_date <= p_depart_before
        AND o.parse_confidence >= 0.4
        AND (p_exclude_id IS NULL OR o.id != p_exclude_id)
    ORDER BY match_score DESC, deadhead_miles ASC
    LIMIT p_limit;
END;
$$;

-- QuickPay risk assessment function
CREATE OR REPLACE FUNCTION assess_quickpay_risk(
    p_broker_id UUID,
    p_amount_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_dispute_count INTEGER;
    v_total_bookings INTEGER;
    v_avg_days_to_pay NUMERIC;
    v_risk_score NUMERIC;
    v_flags TEXT[];
    v_approved BOOLEAN;
BEGIN
    -- Count broker disputes
    SELECT COUNT(*) INTO v_dispute_count
    FROM quickpay_transactions
    WHERE broker_id = p_broker_id AND status = 'reversed';

    -- Count total broker bookings (approx from quickpay history)
    SELECT COUNT(*) INTO v_total_bookings
    FROM quickpay_transactions
    WHERE broker_id = p_broker_id;

    v_flags := '{}';
    v_risk_score := 0;

    -- Risk scoring
    IF v_dispute_count > 2 THEN
        v_risk_score := v_risk_score + 0.40;
        v_flags := array_append(v_flags, 'multiple_reversals');
    ELSIF v_dispute_count > 0 THEN
        v_risk_score := v_risk_score + 0.15;
        v_flags := array_append(v_flags, 'prior_reversal');
    END IF;

    IF v_total_bookings < 3 THEN
        v_risk_score := v_risk_score + 0.20;
        v_flags := array_append(v_flags, 'new_broker');
    END IF;

    -- Cap check: $10,000 max
    IF p_amount_cents > 1000000 THEN
        v_risk_score := v_risk_score + 0.30;
        v_flags := array_append(v_flags, 'exceeds_cap');
    END IF;

    v_risk_score := LEAST(v_risk_score, 1.0);
    v_approved := v_risk_score < 0.50;

    RETURN jsonb_build_object(
        'risk_score', v_risk_score,
        'risk_flags', to_jsonb(v_flags),
        'approved', v_approved,
        'dispute_count', v_dispute_count,
        'broker_history_count', v_total_bookings,
        'max_allowed_cents', CASE WHEN p_amount_cents > 1000000 THEN 1000000 ELSE p_amount_cents END
    );
END;
$$;

-- Add stripe_connect_account_id to profiles if missing
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_connect ON profiles (stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- PostGIS helper: extract lat/lng from a geometry point
CREATE OR REPLACE FUNCTION extract_point_coords(p_geom GEOMETRY)
RETURNS TABLE (lat DOUBLE PRECISION, lng DOUBLE PRECISION)
LANGUAGE sql IMMUTABLE AS $$
    SELECT ST_Y(p_geom), ST_X(p_geom);
$$;

-- Rate Index nightly recompute function
CREATE OR REPLACE FUNCTION recompute_rate_index_cache()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Upsert aggregated corridor rates from lb_corridors + lb_observations
    INSERT INTO rate_index_cache (
        corridor_key, origin_admin_division, destination_admin_division,
        country_code, avg_rate_per_mile, sample_count, currency,
        observation_count_7d, observation_count_30d,
        last_computed_at, data_window_start, data_window_end
    )
    SELECT
        c.corridor_key,
        c.origin_admin_division,
        c.destination_admin_division,
        COALESCE(c.country_code, 'US'),
        c.avg_price,
        c.price_observations,
        'USD',
        (SELECT COUNT(*) FROM lb_observations o
         WHERE o.corridor_key = c.corridor_key
           AND o.observed_date >= CURRENT_DATE - 7),
        (SELECT COUNT(*) FROM lb_observations o
         WHERE o.corridor_key = c.corridor_key
           AND o.observed_date >= CURRENT_DATE - 30),
        NOW(),
        CURRENT_DATE - 90,
        CURRENT_DATE
    FROM lb_corridors c
    WHERE c.price_observations > 0
    ON CONFLICT (corridor_key, country_code)
    DO UPDATE SET
        avg_rate_per_mile = EXCLUDED.avg_rate_per_mile,
        sample_count = EXCLUDED.sample_count,
        observation_count_7d = EXCLUDED.observation_count_7d,
        observation_count_30d = EXCLUDED.observation_count_30d,
        last_computed_at = NOW(),
        data_window_start = EXCLUDED.data_window_start,
        data_window_end = EXCLUDED.data_window_end;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Compute trend direction
    UPDATE rate_index_cache
    SET trend_direction = CASE
        WHEN rate_change_7d_pct > 5 THEN 'rising'
        WHEN rate_change_7d_pct < -5 THEN 'falling'
        ELSE 'stable'
    END,
    demand_band = CASE
        WHEN observation_count_30d >= 50 THEN 'dominant'
        WHEN observation_count_30d >= 20 THEN 'strong'
        WHEN observation_count_30d >= 5 THEN 'emerging'
        ELSE 'cold'
    END;

    RETURN v_count;
END;
$$;
