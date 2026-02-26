-- =============================================================================
-- Phase 9: Dynamic Surge & Pricing Brain
-- Powers the 4-Layer corridor liquidity intelligence system.
-- =============================================================================

-- ── Layer 1+2: Corridor stress & imbalance snapshots ─────────────────────────
CREATE TABLE IF NOT EXISTS public.corridor_stress_log (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id             text NOT NULL,       -- e.g. "I-10_TX_LA"
    origin_state            text,
    dest_state              text,

    -- Raw inputs
    open_load_count         integer DEFAULT 0,
    available_escort_count  integer DEFAULT 0,
    fill_time_p50_minutes   numeric(6,2),        -- median fill time last 6h
    recent_fill_failures    integer DEFAULT 0,
    time_since_last_match   interval,
    broker_urgency_signals  integer DEFAULT 0,   -- explicit urgency flags from brokers

    -- Computed outputs
    stress_index            numeric(5,2) CHECK (stress_index BETWEEN 0 AND 100),
    liquidity_ratio         numeric(7,4),        -- demand/supply (smoothed)

    -- Metadata
    computed_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridor_stress_corridor  ON public.corridor_stress_log(corridor_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_corridor_stress_time      ON public.corridor_stress_log(computed_at DESC);

-- ── Layer 3: Predictive shortage snapshots ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corridor_shortage_predictions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id                 text NOT NULL,
    prediction_horizon          text NOT NULL CHECK (prediction_horizon IN ('30m', '2h', '24h')),
    shortage_probability        numeric(5,4) CHECK (shortage_probability BETWEEN 0 AND 1),

    -- Supporting signals used at prediction time
    historical_stress_avg       numeric(5,2),
    seasonality_index           numeric(4,2),
    day_of_week                 text,
    recent_growth_rate          numeric(6,4),

    -- Accuracy tracking (filled in after the window passes)
    actual_shortage_occurred    boolean,
    prediction_error            numeric(7,4),

    predicted_at                timestamptz NOT NULL DEFAULT now(),
    window_closes_at            timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shortage_predictions_corridor ON public.corridor_shortage_predictions(corridor_id, predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_shortage_predictions_horizon  ON public.corridor_shortage_predictions(prediction_horizon, predicted_at DESC);

-- ── Layer 4: Surge activations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.surge_activations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id         text NOT NULL,
    surge_type          text NOT NULL CHECK (surge_type IN ('escort_incentive', 'broker_urgency', 'marketplace_revenue')),
    trigger_reason      text,                -- e.g. "stress_index > 75"

    -- Configuration at time of activation
    boost_multiplier    numeric(4,2) DEFAULT 1.0 CHECK (boost_multiplier <= 3.0),  -- sanity cap
    affected_operator_ids uuid[],
    min_trust_required  numeric(5,2),

    -- Lifecycle
    status              text DEFAULT 'active' CHECK (status IN ('active', 'decaying', 'expired')),
    activated_at        timestamptz NOT NULL DEFAULT now(),
    decay_starts_at     timestamptz,
    expires_at          timestamptz,

    -- Outcome tracking
    escorts_mobilized   integer DEFAULT 0,
    fills_during_surge  integer DEFAULT 0,
    revenue_attributed  numeric(10,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_surge_corridor  ON public.surge_activations(corridor_id, status);
CREATE INDEX IF NOT EXISTS idx_surge_active    ON public.surge_activations(status, activated_at DESC);

-- ── Profile flags for surge eligibility ──────────────────────────────────────
-- Add columns to driver_profiles if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'driver_profiles'
                   AND column_name = 'surge_eligible') THEN
        ALTER TABLE public.driver_profiles ADD COLUMN surge_eligible boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'driver_profiles'
                   AND column_name = 'paid_boost_active') THEN
        ALTER TABLE public.driver_profiles ADD COLUMN paid_boost_active boolean DEFAULT false;
    END IF;
END;
$$;

-- ── Surge configuration (tunable without re-deploy) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.surge_brain_config (
    id                          integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
    stress_threshold_activate   numeric(5,2) DEFAULT 65.0,   -- CSI above this triggers surge
    stress_threshold_high       numeric(5,2) DEFAULT 80.0,   -- CSI above this = peak surge
    max_boost_multiplier        numeric(4,2) DEFAULT 2.5,
    decay_period_minutes        integer      DEFAULT 45,
    diversity_window_minutes    integer      DEFAULT 60,
    min_trust_for_boost         numeric(5,2) DEFAULT 45.0,
    updated_at                  timestamptz  DEFAULT now()
);

INSERT INTO public.surge_brain_config DEFAULT VALUES
ON CONFLICT (id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.corridor_stress_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_shortage_predictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_activations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_brain_config               ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access surge tables - stress"
    ON public.corridor_stress_log FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access surge tables - predictions"
    ON public.corridor_shortage_predictions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access surge tables - activations"
    ON public.surge_activations FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access surge config"
    ON public.surge_brain_config FOR ALL
    USING (auth.role() = 'service_role');

-- Public cannot read raw surge internals
CREATE POLICY "No public surge access - stress"
    ON public.corridor_stress_log FOR SELECT USING (false);

CREATE POLICY "No public surge access - predictions"
    ON public.corridor_shortage_predictions FOR SELECT USING (false);
