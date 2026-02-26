-- 20260220_load_intelligence_stage_columns.sql
-- Upgrades load_intel to support stage-based probabilities (V2 spec).
-- All changes are ADDITIVE — no existing columns removed.
-- Conflict resolution: existing table is `load_intel`; spec calls it `load_intelligence`.
-- Resolution: add new columns to load_intel + create load_intelligence as an aliased view.

-- ============================================================
-- A) Add stage probability columns to load_intel
-- ============================================================
ALTER TABLE public.load_intel
  -- Stage probabilities: 15 minute horizon
  ADD COLUMN IF NOT EXISTS p_offer_15m   numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_view_15m    numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_accept_15m  numeric(6,4),
  ADD COLUMN IF NOT EXISTS fill_probability_15m numeric(6,4),
  -- 60 minute horizon
  ADD COLUMN IF NOT EXISTS p_offer_60m   numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_view_60m    numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_accept_60m  numeric(6,4),
  ADD COLUMN IF NOT EXISTS fill_probability_60m numeric(6,4),
  -- 4 hour horizon
  ADD COLUMN IF NOT EXISTS p_offer_4h    numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_view_4h     numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_accept_4h   numeric(6,4),
  ADD COLUMN IF NOT EXISTS fill_probability_4h  numeric(6,4),
  -- 24 hour horizon
  ADD COLUMN IF NOT EXISTS p_offer_24h   numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_view_24h    numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_accept_24h  numeric(6,4),
  ADD COLUMN IF NOT EXISTS fill_probability_24h numeric(6,4),
  -- Confidence and uncertainty bands (60m as primary)
  ADD COLUMN IF NOT EXISTS confidence    numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_low_60m     numeric(6,4),
  ADD COLUMN IF NOT EXISTS p_high_60m    numeric(6,4),
  -- Bayesian smoothing context
  ADD COLUMN IF NOT EXISTS trials_similar_30d    int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matches_lane_90d      int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_supply_count int DEFAULT 0,
  -- Hard fill predictor columns
  ADD COLUMN IF NOT EXISTS hard_fill_risk_score_01 numeric(6,4),
  ADD COLUMN IF NOT EXISTS hard_fill_label text,
  -- Carvenum (rate benchmark value adjustment)
  ADD COLUMN IF NOT EXISTS carvenum_value_color  text CHECK (
    carvenum_value_color IN ('green','yellow','orange','red','unknown')
  ),
  ADD COLUMN IF NOT EXISTS carvenum_value_score_01 numeric(6,4),
  -- Suggested rate (median_lane * 1.15)
  ADD COLUMN IF NOT EXISTS suggested_rate numeric(10,2),
  -- Stage explanations (replaces explain_top_3 with richer structure)
  ADD COLUMN IF NOT EXISTS explanation_top_factors jsonb,
  -- Expected times
  ADD COLUMN IF NOT EXISTS expected_time_to_first_offer_min numeric(10,2),
  ADD COLUMN IF NOT EXISTS expected_time_to_accept_min      numeric(10,2),
  ADD COLUMN IF NOT EXISTS expected_time_to_fill_min        numeric(10,2),
  -- Lane / geo keys for routing
  ADD COLUMN IF NOT EXISTS lane_key text,
  ADD COLUMN IF NOT EXISTS geo_key  text,
  ADD COLUMN IF NOT EXISTS similar_bucket_key text,
  ADD COLUMN IF NOT EXISTS supply_demand_ratio numeric(10,4);

-- ============================================================
-- B) load_intelligence VIEW — canonical spec name aliased from load_intel
-- ============================================================
CREATE OR REPLACE VIEW public.load_intelligence AS
SELECT
  load_id,
  computed_at,
  lane_key,
  geo_key,
  similar_bucket_key,
  -- Stage probabilities
  p_offer_15m, p_view_15m, p_accept_15m,
  COALESCE(fill_probability_15m, p_offer_15m * p_view_15m * p_accept_15m) AS fill_probability_15m,
  p_offer_60m, p_view_60m, p_accept_60m,
  COALESCE(fill_probability_60m, p_offer_60m * p_view_60m * p_accept_60m) AS fill_probability_60m,
  p_offer_4h,  p_view_4h,  p_accept_4h,
  COALESCE(fill_probability_4h,  p_offer_4h  * p_view_4h  * p_accept_4h)  AS fill_probability_4h,
  p_offer_24h, p_view_24h, p_accept_24h,
  COALESCE(fill_probability_24h, p_offer_24h * p_view_24h * p_accept_24h) AS fill_probability_24h,
  -- Confidence + uncertainty
  confidence, p_low_60m, p_high_60m,
  trials_similar_30d, matches_lane_90d, available_supply_count,
  -- Legacy single-value (kept for backward compat)
  fill_probability_01 AS fill_probability_legacy,
  -- Intelligence labels
  fill_speed_label, load_quality_grade AS quality_grade,
  lane_badges, load_rank,
  -- Hard fill
  hard_fill_risk_score_01, hard_fill_label,
  -- Carvenum
  carvenum_value_color, carvenum_value_score_01,
  -- Suggested rate
  suggested_rate,
  -- Explanations
  explanation_top_factors,
  -- Expected times
  expected_time_to_first_offer_min,
  expected_time_to_accept_min,
  expected_time_to_fill_min,
  -- Supply signal
  supply_demand_ratio,
  -- Rate signal (legacy)
  rate_signal, fill_signal
FROM public.load_intel;

-- ============================================================
-- C) Hard fill intelligence table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hard_fill_intelligence (
  load_id               uuid PRIMARY KEY REFERENCES public.loads(id) ON DELETE CASCADE,
  computed_at           timestamptz DEFAULT now(),
  hard_fill_risk_score_01 numeric(6,4) NOT NULL,
  hard_fill_label       text NOT NULL CHECK (hard_fill_label IN ('Low','Medium','High','Critical')),
  top_reasons           jsonb DEFAULT '[]'::jsonb,
  recommended_fixes     jsonb DEFAULT '[]'::jsonb
);

-- ============================================================
-- D) Carvenum compute function
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_carvenum_value(
  p_rate_amount numeric,
  p_geo_key text
)
RETURNS TABLE(
  value_color text,
  value_score_01 numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_p25 numeric;
  v_p50 numeric;
  v_p75 numeric;
  v_n   int;
  v_color text;
  v_score numeric;
BEGIN
  SELECT p25, p50, p75, n_samples
  INTO v_p25, v_p50, v_p75, v_n
  FROM public.feature_quantile_bounds
  WHERE geo_key = p_geo_key
    AND feature_name = 'rate_competitiveness'
  LIMIT 1;

  -- Fallback: insufficient data
  IF v_n IS NULL OR v_n < 30 OR p_rate_amount IS NULL OR p_rate_amount <= 0 THEN
    RETURN QUERY SELECT 'unknown'::text, NULL::numeric;
    RETURN;
  END IF;

  -- Color assignment
  v_color := CASE
    WHEN p_rate_amount >= v_p75 THEN 'green'
    WHEN p_rate_amount >= v_p50 THEN 'yellow'
    WHEN p_rate_amount >= v_p25 THEN 'orange'
    ELSE 'red'
  END;

  -- Score: 0..1 clamped across p25..p75 range
  v_score := GREATEST(0, LEAST(1,
    (p_rate_amount - v_p25) / GREATEST(1, v_p75 - v_p25)
  ));

  RETURN QUERY SELECT v_color, v_score;
END;
$$;
