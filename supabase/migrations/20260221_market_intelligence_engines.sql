-- Migration: 20260221_market_intelligence_engines.sql
-- Scarcity Index + Broker Risk Score + Dynamic Surge Pricing

-- ============================================================
-- 1. SCARCITY INDEX TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_scarcity_index (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id text NOT NULL,
    compute_window_hours integer DEFAULT 24,
    -- Raw inputs
    avg_time_to_fill_minutes numeric DEFAULT 0,
    unfilled_rate numeric DEFAULT 0 CHECK (unfilled_rate >= 0 AND unfilled_rate <= 1),
    response_rate numeric DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 1),
    escorts_available_estimate integer DEFAULT 0,
    jobs_per_hour numeric DEFAULT 0,
    last_minute_fill_rate numeric DEFAULT 0 CHECK (last_minute_fill_rate >= 0 AND last_minute_fill_rate <= 1),
    -- Computed
    scarcity_index numeric DEFAULT 0 CHECK (scarcity_index >= 0 AND scarcity_index <= 1),
    scarcity_tier text DEFAULT 'balanced' CHECK (scarcity_tier IN ('loose_supply','balanced','tightening','critical_shortage')),
    computed_at timestamptz DEFAULT now(),
    UNIQUE(corridor_id)
);

CREATE INDEX IF NOT EXISTS idx_scarcity_corridor ON public.hc_scarcity_index(corridor_id);
CREATE INDEX IF NOT EXISTS idx_scarcity_tier ON public.hc_scarcity_index(scarcity_tier);

-- ============================================================
-- 2. BROKER RISK SCORES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_broker_risk_scores (
    broker_id uuid PRIMARY KEY,
    compute_window_days integer DEFAULT 90,
    -- Raw inputs
    avg_days_to_pay numeric DEFAULT 0,
    slow_pay_rate numeric DEFAULT 0,
    dispute_rate numeric DEFAULT 0,
    cancellation_after_book_rate numeric DEFAULT 0,
    documentation_delay_rate numeric DEFAULT 0,
    job_volume integer DEFAULT 0,
    -- Computed
    raw_risk_score numeric DEFAULT 0 CHECK (raw_risk_score >= 0 AND raw_risk_score <= 1),
    broker_trust_score numeric DEFAULT 0.5 CHECK (broker_trust_score >= 0 AND broker_trust_score <= 1),
    risk_tier text DEFAULT 'watch_list' CHECK (risk_tier IN ('elite_broker','reliable','watch_list','high_risk')),
    computed_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. SURGE PRICING STATE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_surge_pricing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id text NOT NULL,
    -- Component multipliers
    scarcity_multiplier numeric DEFAULT 1.0,
    urgency_multiplier numeric DEFAULT 1.0,
    time_pressure_multiplier numeric DEFAULT 1.0,
    volatility_multiplier numeric DEFAULT 1.0,
    broker_risk_modifier numeric DEFAULT 1.0,
    -- Final
    raw_multiplier numeric DEFAULT 1.0,
    smoothed_multiplier numeric DEFAULT 1.0,
    final_multiplier numeric DEFAULT 1.0 CHECK (final_multiplier >= 0.85 AND final_multiplier <= 2.50),
    surge_flag boolean DEFAULT false,
    fill_probability_estimate numeric DEFAULT 0.5,
    computed_at timestamptz DEFAULT now(),
    UNIQUE(corridor_id)
);

CREATE INDEX IF NOT EXISTS idx_surge_corridor ON public.hc_surge_pricing(corridor_id);
CREATE INDEX IF NOT EXISTS idx_surge_flag ON public.hc_surge_pricing(surge_flag) WHERE surge_flag = true;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.hc_scarcity_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_broker_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_surge_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_only_scarcity" ON public.hc_scarcity_index FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_scarcity" ON public.hc_scarcity_index FOR SELECT USING (true);
CREATE POLICY "service_only_broker_risk" ON public.hc_broker_risk_scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "broker_own_risk" ON public.hc_broker_risk_scores FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY "service_only_surge" ON public.hc_surge_pricing FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_surge" ON public.hc_surge_pricing FOR SELECT USING (true);

-- ============================================================
-- SCARCITY INDEX RPC
-- Weights: time_to_fill(0.30) + unfilled(0.25) + response_inv(0.15)
--        + supply_demand(0.20) + last_minute(0.10)
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_scarcity_index(p_corridor_id text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer := 0;
    rec record;
    v_ttf_norm numeric;
    v_unfilled_norm numeric;
    v_resp_inv_norm numeric;
    v_pressure_norm numeric;
    v_lm_norm numeric;
    v_scarcity numeric;
    v_max_ttf numeric;
    v_max_pressure numeric;
BEGIN
    -- Get normalization bounds from all corridors
    SELECT GREATEST(MAX(avg_time_to_fill_minutes), 120), GREATEST(MAX(jobs_per_hour / GREATEST(escorts_available_estimate, 1)), 5)
    INTO v_max_ttf, v_max_pressure
    FROM public.hc_scarcity_index;
    v_max_ttf := COALESCE(v_max_ttf, 120);
    v_max_pressure := COALESCE(v_max_pressure, 5);

    FOR rec IN
        SELECT DISTINCT corridor_id FROM public.hc_job_lifecycle
        WHERE (p_corridor_id IS NULL OR corridor_id = p_corridor_id)
          AND created_at > now() - interval '24 hours'
    LOOP
        -- Compute raw inputs from hc_job_lifecycle + escort_presence
        WITH corridor_stats AS (
            SELECT
                AVG(jl.time_to_fill_sec / 60.0) as avg_ttf,
                AVG(CASE WHEN jl.unfilled_flag THEN 1.0 ELSE 0.0 END) as unfilled_rate,
                CASE WHEN COUNT(*) > 0 THEN
                    COUNT(CASE WHEN jl.first_response_time IS NOT NULL THEN 1 END)::numeric / COUNT(*)
                ELSE 0 END as response_rate,
                COUNT(*)::numeric / 24.0 as jobs_per_hour,
                AVG(CASE WHEN jl.time_to_fill_sec IS NOT NULL AND jl.time_to_fill_sec / 60.0 > 60 THEN 1.0 ELSE 0.0 END) as lm_fill_rate
            FROM public.hc_job_lifecycle jl
            WHERE jl.corridor_id = rec.corridor_id
              AND jl.created_at > now() - interval '24 hours'
        ),
        supply AS (
            SELECT COUNT(*) as avail
            FROM public.escort_presence
            WHERE status IN ('available','online')
        )
        SELECT
            -- Normalize all inputs to 0..1
            LEAST(1.0, COALESCE(cs.avg_ttf, 0) / v_max_ttf) as ttf_norm,
            COALESCE(cs.unfilled_rate, 0) as unfilled_norm,
            1.0 - COALESCE(cs.response_rate, 0) as resp_inv_norm,
            LEAST(1.0, COALESCE(cs.jobs_per_hour, 0) / GREATEST(s.avail, 1) / v_max_pressure) as pressure_norm,
            COALESCE(cs.lm_fill_rate, 0) as lm_norm,
            COALESCE(cs.avg_ttf, 0) as raw_ttf,
            COALESCE(cs.unfilled_rate, 0) as raw_unfilled,
            COALESCE(cs.response_rate, 0) as raw_response,
            s.avail as raw_escorts,
            COALESCE(cs.jobs_per_hour, 0) as raw_jph,
            COALESCE(cs.lm_fill_rate, 0) as raw_lm
        INTO v_ttf_norm, v_unfilled_norm, v_resp_inv_norm, v_pressure_norm, v_lm_norm,
             rec.raw_ttf, rec.raw_unfilled, rec.raw_response, rec.raw_escorts, rec.raw_jph, rec.raw_lm
        FROM corridor_stats cs, supply s;

        -- Final scarcity index
        v_scarcity := LEAST(1.0, GREATEST(0,
            v_ttf_norm * 0.30 +
            v_unfilled_norm * 0.25 +
            v_resp_inv_norm * 0.15 +
            v_pressure_norm * 0.20 +
            v_lm_norm * 0.10
        ));

        -- Upsert
        INSERT INTO public.hc_scarcity_index (corridor_id, avg_time_to_fill_minutes, unfilled_rate, response_rate, escorts_available_estimate, jobs_per_hour, last_minute_fill_rate, scarcity_index, scarcity_tier, computed_at)
        VALUES (
            rec.corridor_id,
            COALESCE(rec.raw_ttf, 0),
            COALESCE(rec.raw_unfilled, 0),
            COALESCE(rec.raw_response, 0),
            COALESCE(rec.raw_escorts, 0),
            COALESCE(rec.raw_jph, 0),
            COALESCE(rec.raw_lm, 0),
            v_scarcity,
            CASE
                WHEN v_scarcity <= 0.30 THEN 'loose_supply'
                WHEN v_scarcity <= 0.55 THEN 'balanced'
                WHEN v_scarcity <= 0.75 THEN 'tightening'
                ELSE 'critical_shortage'
            END,
            now()
        )
        ON CONFLICT (corridor_id) DO UPDATE SET
            avg_time_to_fill_minutes = EXCLUDED.avg_time_to_fill_minutes,
            unfilled_rate = EXCLUDED.unfilled_rate,
            response_rate = EXCLUDED.response_rate,
            escorts_available_estimate = EXCLUDED.escorts_available_estimate,
            jobs_per_hour = EXCLUDED.jobs_per_hour,
            last_minute_fill_rate = EXCLUDED.last_minute_fill_rate,
            scarcity_index = EXCLUDED.scarcity_index,
            scarcity_tier = EXCLUDED.scarcity_tier,
            computed_at = now();

        v_updated := v_updated + 1;
    END LOOP;

    RETURN v_updated;
END;
$$;

-- ============================================================
-- BROKER RISK SCORE RPC
-- Weights: slow_pay(0.35) + dispute(0.25) + cancel(0.15)
--        + doc_delay(0.10) + days_to_pay(0.10) + low_volume(0.05)
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_broker_risk_score(p_broker_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer := 0;
    rec record;
    v_raw_risk numeric;
    v_trust numeric;
BEGIN
    FOR rec IN
        SELECT DISTINCT broker_id FROM public.hc_broker_payment_facts
        WHERE (p_broker_id IS NULL OR broker_id = p_broker_id)
          AND created_at > now() - interval '90 days'
    LOOP
        WITH broker_stats AS (
            SELECT
                COALESCE(AVG(days_to_pay), 0) as avg_dtp,
                COALESCE(AVG(CASE WHEN days_to_pay > 30 THEN 1.0 ELSE 0.0 END), 0) as slow_pay_rate,
                COALESCE(AVG(CASE WHEN dispute_flag THEN 1.0 ELSE 0.0 END), 0) as dispute_rate,
                COALESCE(AVG(CASE WHEN cancellation_after_book THEN 1.0 ELSE 0.0 END), 0) as cancel_rate,
                0.0 as doc_delay_rate,  -- placeholder until doc tracking exists
                COUNT(*) as job_count
            FROM public.hc_broker_payment_facts
            WHERE broker_id = rec.broker_id
              AND created_at > now() - interval '90 days'
        )
        SELECT
            -- Normalize and weight
            LEAST(1.0, (
                LEAST(1.0, bs.slow_pay_rate) * 0.35 +
                LEAST(1.0, bs.dispute_rate) * 0.25 +
                LEAST(1.0, bs.cancel_rate) * 0.15 +
                LEAST(1.0, bs.doc_delay_rate) * 0.10 +
                LEAST(1.0, bs.avg_dtp / 60.0) * 0.10 +
                CASE WHEN bs.job_count < 10 THEN 0.25 ELSE 0 END * 0.05
            )) as raw_risk,
            bs.avg_dtp, bs.slow_pay_rate, bs.dispute_rate, bs.cancel_rate, bs.doc_delay_rate, bs.job_count
        INTO v_raw_risk, rec.avg_dtp, rec.slow_pay, rec.dispute, rec.cancel, rec.doc_delay, rec.jobs
        FROM broker_stats bs;

        v_trust := 1.0 - v_raw_risk;

        INSERT INTO public.hc_broker_risk_scores (broker_id, avg_days_to_pay, slow_pay_rate, dispute_rate, cancellation_after_book_rate, documentation_delay_rate, job_volume, raw_risk_score, broker_trust_score, risk_tier, computed_at)
        VALUES (
            rec.broker_id,
            COALESCE(rec.avg_dtp, 0),
            COALESCE(rec.slow_pay, 0),
            COALESCE(rec.dispute, 0),
            COALESCE(rec.cancel, 0),
            COALESCE(rec.doc_delay, 0),
            COALESCE(rec.jobs, 0),
            v_raw_risk,
            v_trust,
            CASE
                WHEN v_trust >= 0.85 THEN 'elite_broker'
                WHEN v_trust >= 0.70 THEN 'reliable'
                WHEN v_trust >= 0.50 THEN 'watch_list'
                ELSE 'high_risk'
            END,
            now()
        )
        ON CONFLICT (broker_id) DO UPDATE SET
            avg_days_to_pay = EXCLUDED.avg_days_to_pay,
            slow_pay_rate = EXCLUDED.slow_pay_rate,
            dispute_rate = EXCLUDED.dispute_rate,
            cancellation_after_book_rate = EXCLUDED.cancellation_after_book_rate,
            documentation_delay_rate = EXCLUDED.documentation_delay_rate,
            job_volume = EXCLUDED.job_volume,
            raw_risk_score = EXCLUDED.raw_risk_score,
            broker_trust_score = EXCLUDED.broker_trust_score,
            risk_tier = EXCLUDED.risk_tier,
            computed_at = now();

        v_updated := v_updated + 1;
    END LOOP;

    RETURN v_updated;
END;
$$;

-- ============================================================
-- SURGE PRICING RPC
-- Components: scarcity × urgency × time_pressure × volatility × broker_risk
-- Clamped to [0.85, 2.50], EMA-smoothed (α=0.35)
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_surge_pricing(
    p_corridor_id text,
    p_urgency_level integer DEFAULT 0,
    p_time_to_start_hours numeric DEFAULT 48,
    p_broker_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_scarcity numeric;
    v_scarcity_mult numeric;
    v_urgency_mult numeric;
    v_time_mult numeric;
    v_volatility_mult numeric;
    v_broker_mult numeric;
    v_raw numeric;
    v_prev_smoothed numeric;
    v_smoothed numeric;
    v_final numeric;
    v_fill_prob numeric;
BEGIN
    -- Get scarcity index
    SELECT scarcity_index INTO v_scarcity
    FROM public.hc_scarcity_index WHERE corridor_id = p_corridor_id;
    v_scarcity := COALESCE(v_scarcity, 0.3);

    -- Scarcity multiplier: 1 + (scarcity × 0.90)
    v_scarcity_mult := 1.0 + (v_scarcity * 0.90);

    -- Urgency multiplier
    v_urgency_mult := CASE
        WHEN p_urgency_level >= 4 THEN 1.25
        WHEN p_urgency_level = 3 THEN 1.10
        ELSE 1.00
    END;

    -- Time pressure multiplier
    v_time_mult := CASE
        WHEN p_time_to_start_hours <= 6 THEN 1.30
        WHEN p_time_to_start_hours <= 12 THEN 1.15
        WHEN p_time_to_start_hours <= 24 THEN 1.05
        ELSE 1.00
    END;

    -- Corridor rate volatility (from rate_facts stddev)
    SELECT LEAST(1.25, 1.0 + COALESCE(STDDEV(rate_per_mile), 0) * 0.20)
    INTO v_volatility_mult
    FROM public.hc_rate_facts
    WHERE corridor_id = p_corridor_id
      AND created_at > now() - interval '7 days';
    v_volatility_mult := COALESCE(v_volatility_mult, 1.0);

    -- Broker risk modifier
    v_broker_mult := 1.0;
    IF p_broker_id IS NOT NULL THEN
        SELECT CASE
            WHEN broker_trust_score < 0.50 THEN 1.15
            WHEN broker_trust_score < 0.70 THEN 1.05
            ELSE 1.00
        END INTO v_broker_mult
        FROM public.hc_broker_risk_scores WHERE broker_id = p_broker_id;
        v_broker_mult := COALESCE(v_broker_mult, 1.0);
    END IF;

    -- Raw multiplier
    v_raw := v_scarcity_mult * v_urgency_mult * v_time_mult * v_volatility_mult * v_broker_mult;

    -- EMA smoothing (α=0.35)
    SELECT smoothed_multiplier INTO v_prev_smoothed
    FROM public.hc_surge_pricing WHERE corridor_id = p_corridor_id;
    v_prev_smoothed := COALESCE(v_prev_smoothed, 1.0);
    v_smoothed := 0.35 * v_raw + 0.65 * v_prev_smoothed;

    -- Clamp to [0.85, 2.50]
    v_final := LEAST(2.50, GREATEST(0.85, v_smoothed));

    -- Fill probability estimate (inverse of scarcity + urgency)
    v_fill_prob := LEAST(1.0, GREATEST(0.05, 1.0 - v_scarcity * 0.6 - CASE WHEN p_time_to_start_hours < 12 THEN 0.15 ELSE 0 END));

    -- Upsert
    INSERT INTO public.hc_surge_pricing (corridor_id, scarcity_multiplier, urgency_multiplier, time_pressure_multiplier, volatility_multiplier, broker_risk_modifier, raw_multiplier, smoothed_multiplier, final_multiplier, surge_flag, fill_probability_estimate, computed_at)
    VALUES (p_corridor_id, v_scarcity_mult, v_urgency_mult, v_time_mult, v_volatility_mult, v_broker_mult, v_raw, v_smoothed, v_final, v_final > 1.15, v_fill_prob, now())
    ON CONFLICT (corridor_id) DO UPDATE SET
        scarcity_multiplier = EXCLUDED.scarcity_multiplier,
        urgency_multiplier = EXCLUDED.urgency_multiplier,
        time_pressure_multiplier = EXCLUDED.time_pressure_multiplier,
        volatility_multiplier = EXCLUDED.volatility_multiplier,
        broker_risk_modifier = EXCLUDED.broker_risk_modifier,
        raw_multiplier = EXCLUDED.raw_multiplier,
        smoothed_multiplier = EXCLUDED.smoothed_multiplier,
        final_multiplier = EXCLUDED.final_multiplier,
        surge_flag = EXCLUDED.surge_flag,
        fill_probability_estimate = EXCLUDED.fill_probability_estimate,
        computed_at = now();

    RETURN jsonb_build_object(
        'corridor_id', p_corridor_id,
        'scarcity_index', v_scarcity,
        'scarcity_multiplier', ROUND(v_scarcity_mult::numeric, 3),
        'urgency_multiplier', v_urgency_mult,
        'time_pressure_multiplier', v_time_mult,
        'volatility_multiplier', ROUND(v_volatility_mult::numeric, 3),
        'broker_risk_modifier', v_broker_mult,
        'raw_multiplier', ROUND(v_raw::numeric, 3),
        'smoothed_multiplier', ROUND(v_smoothed::numeric, 3),
        'final_multiplier', ROUND(v_final::numeric, 3),
        'surge_flag', v_final > 1.15,
        'fill_probability', ROUND(v_fill_prob::numeric, 3)
    );
END;
$$;
