-- Migration: 20260221_liquidity_prediction_guarantee.sql
-- Fill Probability Predictor + Coverage Guarantee + Market Liquidity Score

-- ============================================================
-- 1. CORRIDOR MARKET METRICS (rolling computed metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_corridor_market_metrics (
    corridor_id text PRIMARY KEY,
    window_start timestamptz,
    window_end timestamptz,
    jobs_count integer DEFAULT 0,
    filled_count integer DEFAULT 0,
    unfilled_count integer DEFAULT 0,
    fill_rate numeric DEFAULT 0 CHECK (fill_rate >= 0 AND fill_rate <= 1),
    median_time_to_fill_minutes numeric DEFAULT 0,
    p90_time_to_fill_minutes numeric DEFAULT 0,
    response_rate numeric DEFAULT 0,
    median_first_response_minutes numeric DEFAULT 0,
    escorts_available_estimate numeric DEFAULT 0,
    demand_per_escort numeric DEFAULT 0,
    scarcity_index numeric DEFAULT 0,
    corridor_rate_per_mile_median numeric DEFAULT 0,
    corridor_rate_per_mile_p90 numeric DEFAULT 0,
    corridor_rate_volatility numeric DEFAULT 0,
    broker_risk_avg numeric DEFAULT 0,
    route_risk_avg numeric DEFAULT 0,
    liquidity_score numeric DEFAULT 0.5 CHECK (liquidity_score >= 0 AND liquidity_score <= 1),
    liquidity_band text DEFAULT 'thin' CHECK (liquidity_band IN ('illiquid','thin','healthy','deep_liquid')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridor_metrics_window ON public.hc_corridor_market_metrics(window_end DESC);

-- ============================================================
-- 2. FILL MODEL SNAPSHOT (versioned model params)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_fill_model_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version text NOT NULL,
    trained_window_start timestamptz,
    trained_window_end timestamptz,
    feature_schema_hash text,
    coefficients jsonb DEFAULT '{}'::jsonb,
    calibration jsonb DEFAULT '{}'::jsonb,
    quality_metrics jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fill_model_version ON public.hc_fill_model_snapshot(model_version);

-- ============================================================
-- 3. LIQUIDITY SCORE HISTORY (time-series)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_liquidity_score_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id text NOT NULL,
    score_time timestamptz NOT NULL DEFAULT now(),
    liquidity_score numeric NOT NULL,
    components jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liq_hist_corridor ON public.hc_liquidity_score_history(corridor_id, score_time DESC);

-- ============================================================
-- 4. GUARANTEE POLICY (configurable without code deploy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_guarantee_policy (
    policy_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name text NOT NULL,
    active boolean DEFAULT true,
    effective_start timestamptz DEFAULT now(),
    effective_end timestamptz,
    min_fill_probability numeric DEFAULT 0.70,
    max_expected_time_to_fill_minutes numeric DEFAULT 60,
    min_liquidity_score numeric DEFAULT 0.55,
    max_broker_risk_allowed numeric DEFAULT 0.60,
    corridor_exclusions jsonb DEFAULT '[]'::jsonb,
    refund_type text DEFAULT 'boost_refund' CHECK (refund_type IN ('boost_refund','partial_credit','full_credit')),
    refund_cap_amount numeric DEFAULT 50.00,
    refund_cap_percent numeric DEFAULT 0.25,
    margin_multiplier numeric DEFAULT 1.6,
    min_fee numeric DEFAULT 2.00,
    max_fee_percent_of_booking numeric DEFAULT 0.25,
    abuse_rules jsonb DEFAULT '{"disqualifiers":["broker_changes_pickup","broker_changes_route","cancels_reposts","incomplete_details","force_majeure","permit_rejection"]}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. GUARANTEE CLAIMS (outcomes + anti-abuse)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_guarantee_claims (
    claim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id uuid REFERENCES public.hc_guarantee_policy(policy_id),
    job_id uuid,
    broker_id uuid,
    corridor_id text,
    claim_time timestamptz DEFAULT now(),
    expected_fill_minutes numeric,
    actual_fill_minutes numeric,
    expected_fill_probability numeric,
    liquidity_score_at_booking numeric,
    broker_risk_at_booking numeric,
    guarantee_fee_cents integer DEFAULT 0,
    claim_reason text,
    eligible boolean DEFAULT false,
    decision text DEFAULT 'pending' CHECK (decision IN ('pending','approved','denied','partial')),
    refund_amount numeric DEFAULT 0,
    denial_reason text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_policy ON public.hc_guarantee_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_broker ON public.hc_guarantee_claims(broker_id);
CREATE INDEX IF NOT EXISTS idx_claims_decision ON public.hc_guarantee_claims(decision);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.hc_corridor_market_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_fill_model_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_liquidity_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_guarantee_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_guarantee_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_write_metrics" ON public.hc_corridor_market_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_metrics" ON public.hc_corridor_market_metrics FOR SELECT USING (true);
CREATE POLICY "service_only_model" ON public.hc_fill_model_snapshot FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_write_liq_hist" ON public.hc_liquidity_score_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_liq_hist" ON public.hc_liquidity_score_history FOR SELECT USING (true);
CREATE POLICY "service_only_policy" ON public.hc_guarantee_policy FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_policy" ON public.hc_guarantee_policy FOR SELECT USING (active = true);
CREATE POLICY "service_write_claims" ON public.hc_guarantee_claims FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "broker_own_claims" ON public.hc_guarantee_claims FOR SELECT USING (broker_id = auth.uid());

-- ============================================================
-- COMPUTE MARKET LIQUIDITY SCORE RPC
-- Weights: conversion(0.30) + responsiveness(0.20) + speed(0.20) + stability(0.15) + depth(0.15)
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_market_liquidity_score(p_corridor_id text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer := 0;
    rec record;
    v_conv numeric; v_resp numeric; v_speed numeric; v_stab numeric; v_depth numeric;
    v_liq numeric;
    v_max_ttf numeric := 120; v_max_resp numeric := 60; v_max_vol numeric := 5;
BEGIN
    FOR rec IN
        SELECT DISTINCT corridor_id FROM public.hc_job_lifecycle
        WHERE (p_corridor_id IS NULL OR corridor_id = p_corridor_id)
          AND created_at > now() - interval '7 days'
    LOOP
        WITH stats AS (
            SELECT
                AVG(CASE WHEN NOT unfilled_flag THEN 1.0 ELSE 0.0 END) as fill_rate,
                CASE WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN first_response_time IS NOT NULL THEN 1 END)::numeric / COUNT(*) ELSE 0 END as response_rate,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(time_to_fill_sec/60.0, 999)) as med_ttf,
                PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY COALESCE(time_to_fill_sec/60.0, 999)) as p90_ttf,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(time_to_first_response_sec/60.0, 999)) as med_resp,
                COUNT(*) as jobs_count,
                COUNT(CASE WHEN NOT unfilled_flag THEN 1 END) as filled_count,
                COUNT(CASE WHEN unfilled_flag THEN 1 END) as unfilled_count
            FROM public.hc_job_lifecycle
            WHERE corridor_id = rec.corridor_id AND created_at > now() - interval '7 days'
        ),
        rate_stats AS (
            SELECT
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(rate_per_mile, 0)) as med_rpm,
                PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY COALESCE(rate_per_mile, 0)) as p90_rpm,
                COALESCE(STDDEV(rate_per_mile), 0) as vol
            FROM public.hc_rate_facts
            WHERE corridor_id = rec.corridor_id AND created_at > now() - interval '7 days'
        ),
        supply AS (
            SELECT COUNT(*) as avail FROM public.escort_presence WHERE status IN ('available','online')
        )
        SELECT
            -- Conversion: fill_rate (0..1)
            COALESCE(s.fill_rate, 0) as conv,
            -- Responsiveness: 0.7*response_rate + 0.3*(1 - norm(median_response))
            COALESCE(0.7 * s.response_rate + 0.3 * (1.0 - LEAST(1.0, COALESCE(s.med_resp, v_max_resp) / v_max_resp)), 0) as resp,
            -- Speed: 0.6*(1-norm(med_ttf)) + 0.4*(1-norm(p90_ttf))
            COALESCE(0.6 * (1.0 - LEAST(1.0, COALESCE(s.med_ttf, v_max_ttf) / v_max_ttf)) + 0.4 * (1.0 - LEAST(1.0, COALESCE(s.p90_ttf, v_max_ttf) / v_max_ttf)), 0) as spd,
            -- Stability: 1 - norm(volatility)
            COALESCE(1.0 - LEAST(1.0, r.vol / v_max_vol), 0.5) as stab,
            -- Depth: 1 - norm(demand_per_escort)
            COALESCE(1.0 - LEAST(1.0, s.jobs_count::numeric / (7.0 * 24.0) / GREATEST(sup.avail, 1)), 0.5) as dpth,
            s.jobs_count, s.filled_count, s.unfilled_count, s.fill_rate, s.med_ttf, s.p90_ttf, s.response_rate, s.med_resp,
            sup.avail, r.med_rpm, r.p90_rpm, r.vol
        INTO v_conv, v_resp, v_speed, v_stab, v_depth,
             rec.jc, rec.fc, rec.uc, rec.fr, rec.mttf, rec.p90ttf, rec.rr, rec.mresp,
             rec.avail, rec.mrpm, rec.p90rpm, rec.vol
        FROM stats s, rate_stats r, supply sup;

        -- Final liquidity score
        v_liq := LEAST(1.0, GREATEST(0,
            v_conv * 0.30 + v_resp * 0.20 + v_speed * 0.20 + v_stab * 0.15 + v_depth * 0.15
        ));

        -- Upsert corridor market metrics
        INSERT INTO public.hc_corridor_market_metrics (
            corridor_id, window_start, window_end, jobs_count, filled_count, unfilled_count,
            fill_rate, median_time_to_fill_minutes, p90_time_to_fill_minutes, response_rate,
            median_first_response_minutes, escorts_available_estimate, demand_per_escort,
            corridor_rate_per_mile_median, corridor_rate_per_mile_p90, corridor_rate_volatility,
            liquidity_score, liquidity_band
        ) VALUES (
            rec.corridor_id, now() - interval '7 days', now(),
            COALESCE(rec.jc, 0), COALESCE(rec.fc, 0), COALESCE(rec.uc, 0),
            COALESCE(rec.fr, 0), COALESCE(rec.mttf, 0), COALESCE(rec.p90ttf, 0),
            COALESCE(rec.rr, 0), COALESCE(rec.mresp, 0), COALESCE(rec.avail, 0),
            CASE WHEN COALESCE(rec.avail, 0) > 0 THEN COALESCE(rec.jc, 0)::numeric / rec.avail ELSE 0 END,
            COALESCE(rec.mrpm, 0), COALESCE(rec.p90rpm, 0), COALESCE(rec.vol, 0),
            v_liq,
            CASE WHEN v_liq <= 0.30 THEN 'illiquid' WHEN v_liq <= 0.55 THEN 'thin' WHEN v_liq <= 0.75 THEN 'healthy' ELSE 'deep_liquid' END
        )
        ON CONFLICT (corridor_id) DO UPDATE SET
            window_start = EXCLUDED.window_start, window_end = EXCLUDED.window_end,
            jobs_count = EXCLUDED.jobs_count, filled_count = EXCLUDED.filled_count, unfilled_count = EXCLUDED.unfilled_count,
            fill_rate = EXCLUDED.fill_rate, median_time_to_fill_minutes = EXCLUDED.median_time_to_fill_minutes,
            p90_time_to_fill_minutes = EXCLUDED.p90_time_to_fill_minutes, response_rate = EXCLUDED.response_rate,
            median_first_response_minutes = EXCLUDED.median_first_response_minutes,
            escorts_available_estimate = EXCLUDED.escorts_available_estimate, demand_per_escort = EXCLUDED.demand_per_escort,
            corridor_rate_per_mile_median = EXCLUDED.corridor_rate_per_mile_median,
            corridor_rate_per_mile_p90 = EXCLUDED.corridor_rate_per_mile_p90,
            corridor_rate_volatility = EXCLUDED.corridor_rate_volatility,
            liquidity_score = EXCLUDED.liquidity_score, liquidity_band = EXCLUDED.liquidity_band,
            created_at = now();

        -- Write to history
        INSERT INTO public.hc_liquidity_score_history (corridor_id, score_time, liquidity_score, components)
        VALUES (rec.corridor_id, now(), v_liq, jsonb_build_object(
            'conversion', ROUND(v_conv::numeric, 4), 'responsiveness', ROUND(v_resp::numeric, 4),
            'speed', ROUND(v_speed::numeric, 4), 'stability', ROUND(v_stab::numeric, 4), 'depth', ROUND(v_depth::numeric, 4)
        ));

        v_updated := v_updated + 1;
    END LOOP;
    RETURN v_updated;
END;
$$;

-- ============================================================
-- FILL PROBABILITY PREDICTOR RPC (logistic-based)
-- ============================================================
CREATE OR REPLACE FUNCTION public.predict_fill_probability(
    p_corridor_id text,
    p_escorts_required integer DEFAULT 1,
    p_urgency_level integer DEFAULT 0,
    p_time_to_start_hours numeric DEFAULT 48,
    p_miles numeric DEFAULT 100,
    p_broker_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metrics record;
    v_broker_trust numeric := 0.7;
    v_route_risk numeric := 0.1;
    v_time_pressure numeric;
    v_escort_penalty numeric;
    v_rate_delta numeric := 0;
    v_z30 numeric; v_z60 numeric; v_z120 numeric;
    v_p30 numeric; v_p60 numeric; v_p120 numeric;
    v_expected_ttf numeric;
BEGIN
    -- Get corridor metrics
    SELECT * INTO v_metrics FROM public.hc_corridor_market_metrics WHERE corridor_id = p_corridor_id;

    -- Defaults if no data
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'p_fill_30m', 0.50, 'p_fill_60m', 0.60, 'p_fill_120m', 0.75,
            'expected_time_to_fill_minutes', 45, 'model_version', 'fallback_v1',
            'guarantee_eligible', false
        );
    END IF;

    -- Get broker trust
    IF p_broker_id IS NOT NULL THEN
        SELECT broker_trust_score INTO v_broker_trust FROM public.hc_broker_risk_scores WHERE broker_id = p_broker_id;
        v_broker_trust := COALESCE(v_broker_trust, 0.7);
    END IF;

    -- Time pressure
    v_time_pressure := CASE
        WHEN p_time_to_start_hours <= 6 THEN 1.0
        WHEN p_time_to_start_hours <= 12 THEN 0.6
        WHEN p_time_to_start_hours <= 24 THEN 0.3
        ELSE 0.0
    END;

    -- Escort penalty: log(1 + escorts_required) normalized
    v_escort_penalty := LEAST(1.0, LN(1 + p_escorts_required) / LN(5));

    -- Logistic model (coefficients calibrated for each horizon)
    -- z = b0 + b1*scarcity + b2*liquidity + b3*response + b4*speed + b5*rate_delta + b6*urgency + b7*time_pressure + b8*broker_trust + b9*route_safety + b10*escort_penalty

    -- 60min baseline
    v_z60 := 0.5
        - 1.5 * COALESCE(v_metrics.scarcity_index, 0.3)
        + 2.0 * COALESCE(v_metrics.liquidity_score, 0.5)
        + 1.2 * COALESCE(v_metrics.response_rate, 0.5)
        + 0.8 * (1.0 - LEAST(1.0, COALESCE(v_metrics.median_time_to_fill_minutes, 30) / 120.0))
        + 0.3 * v_rate_delta
        + 0.4 * LEAST(1.0, p_urgency_level / 5.0)
        - 0.6 * v_time_pressure
        + 0.7 * v_broker_trust
        + 0.3 * (1.0 - v_route_risk)
        - 0.9 * v_escort_penalty;

    -- Adjust for 30min (harder) and 120min (easier)
    v_z30 := v_z60 - 0.8;
    v_z120 := v_z60 + 0.6;

    -- Sigmoid
    v_p30 := LEAST(0.99, GREATEST(0.01, 1.0 / (1.0 + EXP(-v_z30))));
    v_p60 := LEAST(0.99, GREATEST(0.01, 1.0 / (1.0 + EXP(-v_z60))));
    v_p120 := LEAST(0.99, GREATEST(0.01, 1.0 / (1.0 + EXP(-v_z120))));

    -- Expected time to fill (quantile blend)
    v_expected_ttf := COALESCE(v_metrics.median_time_to_fill_minutes, 30) * (1.0 - COALESCE(v_metrics.liquidity_score, 0.5))
                    + COALESCE(v_metrics.p90_time_to_fill_minutes, 90) * COALESCE(v_metrics.liquidity_score, 0.5);

    RETURN jsonb_build_object(
        'p_fill_30m', ROUND(v_p30::numeric, 3),
        'p_fill_60m', ROUND(v_p60::numeric, 3),
        'p_fill_120m', ROUND(v_p120::numeric, 3),
        'expected_time_to_fill_minutes', ROUND(v_expected_ttf::numeric, 1),
        'model_version', 'logistic_v1',
        'guarantee_eligible', v_p60 >= 0.70 AND COALESCE(v_metrics.liquidity_score, 0) >= 0.55,
        'components', jsonb_build_object(
            'scarcity', COALESCE(v_metrics.scarcity_index, 0.3),
            'liquidity', COALESCE(v_metrics.liquidity_score, 0.5),
            'response_rate', COALESCE(v_metrics.response_rate, 0.5),
            'broker_trust', v_broker_trust,
            'time_pressure', v_time_pressure,
            'escort_penalty', v_escort_penalty
        )
    );
END;
$$;

-- ============================================================
-- GUARANTEE ELIGIBILITY + FEE PRICING RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_guarantee_offer(
    p_corridor_id text,
    p_escorts_required integer DEFAULT 1,
    p_urgency_level integer DEFAULT 0,
    p_time_to_start_hours numeric DEFAULT 48,
    p_miles numeric DEFAULT 100,
    p_broker_id uuid DEFAULT NULL,
    p_booking_fee_cents integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prediction jsonb;
    v_policy record;
    v_p_fill numeric;
    v_expected_ttf numeric;
    v_liq_score numeric;
    v_broker_risk numeric;
    v_q numeric; v_refund numeric; v_el numeric; v_fee numeric;
    v_eligible boolean;
    v_promised_minutes numeric;
BEGIN
    -- Get prediction
    v_prediction := public.predict_fill_probability(p_corridor_id, p_escorts_required, p_urgency_level, p_time_to_start_hours, p_miles, p_broker_id);
    v_p_fill := (v_prediction->>'p_fill_60m')::numeric;
    v_expected_ttf := (v_prediction->>'expected_time_to_fill_minutes')::numeric;

    -- Get liquidity
    SELECT liquidity_score INTO v_liq_score FROM public.hc_corridor_market_metrics WHERE corridor_id = p_corridor_id;
    v_liq_score := COALESCE(v_liq_score, 0.3);

    -- Get broker risk
    v_broker_risk := 0.3;
    IF p_broker_id IS NOT NULL THEN
        SELECT raw_risk_score INTO v_broker_risk FROM public.hc_broker_risk_scores WHERE broker_id = p_broker_id;
        v_broker_risk := COALESCE(v_broker_risk, 0.3);
    END IF;

    -- Get active policy
    SELECT * INTO v_policy FROM public.hc_guarantee_policy
    WHERE active = true AND now() BETWEEN effective_start AND COALESCE(effective_end, now() + interval '100 years')
    ORDER BY created_at DESC LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'no_active_policy');
    END IF;

    -- Check eligibility
    v_eligible := v_p_fill >= v_policy.min_fill_probability
        AND v_expected_ttf <= v_policy.max_expected_time_to_fill_minutes
        AND v_liq_score >= v_policy.min_liquidity_score
        AND v_broker_risk <= v_policy.max_broker_risk_allowed;

    IF NOT v_eligible THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', CASE
                WHEN v_p_fill < v_policy.min_fill_probability THEN 'fill_probability_too_low'
                WHEN v_expected_ttf > v_policy.max_expected_time_to_fill_minutes THEN 'expected_fill_too_slow'
                WHEN v_liq_score < v_policy.min_liquidity_score THEN 'liquidity_too_low'
                ELSE 'broker_risk_too_high'
            END,
            'prediction', v_prediction
        );
    END IF;

    -- Promise time: round up to nearest 5 min, capped by policy
    v_promised_minutes := LEAST(v_policy.max_expected_time_to_fill_minutes, CEIL(v_expected_ttf / 5.0) * 5);

    -- Expected loss: q * refund + ops
    v_q := 1.0 - v_p_fill;
    v_refund := LEAST(v_policy.refund_cap_amount, v_policy.refund_cap_percent * p_booking_fee_cents / 100.0);
    v_el := v_q * v_refund + 1.50; -- $1.50 ops cost buffer

    -- Fee: EL * margin_multiplier, clamped
    v_fee := GREATEST(v_policy.min_fee, LEAST(v_policy.max_fee_percent_of_booking * p_booking_fee_cents / 100.0, v_el * v_policy.margin_multiplier));

    RETURN jsonb_build_object(
        'eligible', true,
        'promised_fill_minutes', v_promised_minutes,
        'guarantee_fee_cents', CEIL(v_fee * 100)::integer,
        'expected_loss_cents', CEIL(v_el * 100)::integer,
        'fill_probability', ROUND(v_p_fill::numeric, 3),
        'liquidity_score', ROUND(v_liq_score::numeric, 3),
        'broker_risk', ROUND(v_broker_risk::numeric, 3),
        'policy_id', v_policy.policy_id,
        'prediction', v_prediction
    );
END;
$$;

-- ============================================================
-- PROCESS GUARANTEE CLAIM RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_guarantee_claim(
    p_job_id uuid,
    p_broker_id uuid,
    p_corridor_id text,
    p_expected_fill_minutes numeric,
    p_actual_fill_minutes numeric,
    p_policy_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy record;
    v_eligible boolean := true;
    v_denial text;
    v_decision text;
    v_refund numeric := 0;
BEGIN
    SELECT * INTO v_policy FROM public.hc_guarantee_policy WHERE policy_id = p_policy_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'policy_not_found');
    END IF;

    -- Check if actually unfilled/late
    IF p_actual_fill_minutes <= p_expected_fill_minutes THEN
        RETURN jsonb_build_object('success', false, 'error', 'filled_within_promise');
    END IF;

    -- Check disqualifiers from event stream
    DECLARE
        v_route_change boolean := false;
        v_cancelled boolean := false;
    BEGIN
        SELECT EXISTS(SELECT 1 FROM public.hc_event_stream WHERE job_id = p_job_id AND event_type IN ('broker_changed_route','broker_changed_pickup')) INTO v_route_change;
        SELECT EXISTS(SELECT 1 FROM public.hc_event_stream WHERE job_id = p_job_id AND event_type = 'broker_cancel_repost') INTO v_cancelled;

        IF v_route_change THEN v_eligible := false; v_denial := 'broker_changed_requirements'; END IF;
        IF v_cancelled THEN v_eligible := false; v_denial := 'broker_cancel_repost'; END IF;
    END;

    IF v_eligible THEN
        v_decision := 'approved';
        v_refund := LEAST(v_policy.refund_cap_amount, v_policy.refund_cap_percent * 100); -- simplified; real would reference booking amount
    ELSE
        v_decision := 'denied';
    END IF;

    INSERT INTO public.hc_guarantee_claims (policy_id, job_id, broker_id, corridor_id, expected_fill_minutes, actual_fill_minutes, eligible, decision, refund_amount, denial_reason)
    VALUES (p_policy_id, p_job_id, p_broker_id, p_corridor_id, p_expected_fill_minutes, p_actual_fill_minutes, v_eligible, v_decision, v_refund, v_denial);

    RETURN jsonb_build_object('success', true, 'decision', v_decision, 'refund_amount', v_refund, 'denial_reason', v_denial);
END;
$$;

-- ============================================================
-- SEED DEFAULT GUARANTEE POLICY
-- ============================================================
INSERT INTO public.hc_guarantee_policy (policy_name, min_fill_probability, max_expected_time_to_fill_minutes, min_liquidity_score, max_broker_risk_allowed)
VALUES ('standard_coverage_v1', 0.70, 60, 0.55, 0.60)
ON CONFLICT DO NOTHING;
