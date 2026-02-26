-- 20260220_market_aggregates_priors.sql
-- Rolling aggregates, Bayesian priors, quantile bounds, and model calibration.
-- Used by intelligence_recompute_load to compute smoothed stage probabilities.

-- ============================================================
-- A) Market priors (Bayesian defaults for cold-start safety)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_priors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prior_key    text UNIQUE NOT NULL,  -- e.g. 'global.view_rate', 'segment.FL.accept_rate'
  prior_mean   numeric(8,6) NOT NULL,
  prior_weight numeric(6,2) DEFAULT 10.0,  -- equivalent sample size
  description  text,
  updated_at   timestamptz DEFAULT now()
);

-- Seed canonical priors (global defaults per PROB_ENGINE_V2 spec)
INSERT INTO public.market_priors (prior_key, prior_mean, prior_weight, description) VALUES
  ('global.offer_rate',      0.85, 20, 'P(offer sent | load open, supply available)'),
  ('global.view_rate',       0.65, 20, 'P(offer viewed | offer sent)'),
  ('global.accept_rate',     0.40, 20, 'P(offer accepted | offer viewed)'),
  ('global.fill_rate',       0.45, 15, 'P(load fills | load open)'),
  ('global.incident_rate',   0.04, 30, 'P(incident | filled match)'),
  ('global.completion_rate', 0.91, 25, 'P(match completed | accepted)')
ON CONFLICT (prior_key) DO UPDATE SET
  prior_mean   = excluded.prior_mean,
  prior_weight = excluded.prior_weight,
  updated_at   = now();

-- ============================================================
-- B) Per-bucket rolling aggregates (30d window)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_bucket_aggregates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  similar_bucket_key    text NOT NULL,   -- e.g. 'US:FL:miami__US:GA:atlanta__pilot_car'
  geo_key               text,
  window_days           int DEFAULT 30,
  -- Offer stage
  loads_posted          int DEFAULT 0,
  offers_sent           int DEFAULT 0,
  offers_viewed         int DEFAULT 0,
  offers_accepted       int DEFAULT 0,
  loads_filled          int DEFAULT 0,
  -- Derived rates (smoothed in view)
  raw_offer_rate        numeric(8,6),
  raw_view_rate         numeric(8,6),
  raw_accept_rate       numeric(8,6),
  raw_fill_rate         numeric(8,6),
  -- Response timing
  median_time_to_offer_min  numeric(10,2),
  median_time_to_accept_min numeric(10,2),
  median_time_to_fill_min   numeric(10,2),
  p25_time_to_fill_min      numeric(10,2),
  p75_time_to_fill_min      numeric(10,2),
  -- Incident rate
  incident_count        int DEFAULT 0,
  raw_incident_rate     numeric(8,6),
  -- Sample quality
  effective_supply_count int DEFAULT 0,
  last_refreshed_at     timestamptz DEFAULT now(),
  UNIQUE (similar_bucket_key, window_days)
);

CREATE INDEX IF NOT EXISTS bucket_agg_geo_idx
  ON public.market_bucket_aggregates (geo_key, window_days);

-- ============================================================
-- C) Feature quantile bounds (for normalization + Carvenum)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_quantile_bounds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geo_key       text NOT NULL,
  lane_key      text,             -- null = geo-level aggregate
  feature_name  text NOT NULL,   -- e.g. 'rate_competitiveness', 'supply_demand_ratio'
  p10           numeric(14,6),
  p25           numeric(14,6),
  p50           numeric(14,6),
  p75           numeric(14,6),
  p90           numeric(14,6),
  n_samples     int DEFAULT 0,
  computed_at   timestamptz DEFAULT now(),
  UNIQUE (geo_key, feature_name, COALESCE(lane_key, ''))
);

CREATE INDEX IF NOT EXISTS quantile_bounds_geo_feature_idx
  ON public.feature_quantile_bounds (geo_key, feature_name);

-- ============================================================
-- D) Model calibration params (Platt / Isotonic)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.model_calibration_params (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_stage  text NOT NULL,    -- 'p_offer', 'p_view', 'p_accept', 'p_fill'
  horizon_key  text NOT NULL,    -- '15m', '60m', '4h', '24h'
  method       text DEFAULT 'platt' CHECK (method IN ('platt','isotonic','none')),
  a            numeric(10,6),   -- Platt: sigmoid a
  b            numeric(10,6),   -- Platt: sigmoid b
  isotonic_x   numeric[] ,      -- Isotonic: calibration x points
  isotonic_y   numeric[],       -- Isotonic: calibration y points
  brier_score  numeric(8,6),
  log_loss     numeric(8,6),
  n_samples    int,
  trained_at   timestamptz DEFAULT now(),
  UNIQUE (model_stage, horizon_key, method)
);

-- Seed identity calibration (no-op until real calibration runs)
INSERT INTO public.model_calibration_params (model_stage, horizon_key, method, a, b, brier_score) VALUES
  ('p_offer', '60m', 'platt', 1.0, 0.0, NULL),
  ('p_view',  '60m', 'platt', 1.0, 0.0, NULL),
  ('p_accept','60m', 'platt', 1.0, 0.0, NULL),
  ('p_fill',  '60m', 'platt', 1.0, 0.0, NULL)
ON CONFLICT (model_stage, horizon_key, method) DO NOTHING;

-- ============================================================
-- E) Model outcomes (for Brier score / AUC computation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.model_outcomes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id             uuid REFERENCES public.loads(id),
  predicted_p_fill_60m numeric(6,4),
  predicted_p_offer_60m numeric(6,4),
  predicted_p_view_60m  numeric(6,4),
  predicted_p_accept_60m numeric(6,4),
  confidence_at_prediction numeric(6,4),
  actual_filled       bool,
  actual_fill_minutes numeric(10,2),
  predicted_at        timestamptz DEFAULT now(),
  resolved_at         timestamptz
);

-- ============================================================
-- F) Smoothed rates view (used by intelligence_recompute_load)
-- ============================================================
CREATE OR REPLACE VIEW public.v_smoothed_bucket_rates AS
SELECT
  b.similar_bucket_key,
  b.geo_key,
  -- Bayesian-smoothed offer rate: (raw_count + prior*weight) / (total + weight)
  CASE WHEN COALESCE(b.loads_posted,0) = 0 THEN
    (SELECT prior_mean FROM public.market_priors WHERE prior_key = 'global.offer_rate' LIMIT 1)
  ELSE
    (b.offers_sent + mp_offer.prior_mean * mp_offer.prior_weight)
    / (b.loads_posted + mp_offer.prior_weight)
  END AS smoothed_offer_rate,
  -- Smoothed view rate
  CASE WHEN COALESCE(b.offers_sent,0) = 0 THEN
    (SELECT prior_mean FROM public.market_priors WHERE prior_key = 'global.view_rate' LIMIT 1)
  ELSE
    (b.offers_viewed + mp_view.prior_mean * mp_view.prior_weight)
    / (b.offers_sent + mp_view.prior_weight)
  END AS smoothed_view_rate,
  -- Smoothed accept rate
  CASE WHEN COALESCE(b.offers_viewed,0) = 0 THEN
    (SELECT prior_mean FROM public.market_priors WHERE prior_key = 'global.accept_rate' LIMIT 1)
  ELSE
    (b.offers_accepted + mp_accept.prior_mean * mp_accept.prior_weight)
    / (b.offers_viewed + mp_accept.prior_weight)
  END AS smoothed_accept_rate,
  b.median_time_to_offer_min,
  b.median_time_to_accept_min,
  b.median_time_to_fill_min,
  b.raw_incident_rate,
  b.effective_supply_count,
  b.loads_posted     AS n_loads,
  b.offers_viewed    AS n_views,
  b.offers_accepted  AS n_accepts,
  b.last_refreshed_at
FROM public.market_bucket_aggregates b
LEFT JOIN public.market_priors mp_offer  ON mp_offer.prior_key  = 'global.offer_rate'
LEFT JOIN public.market_priors mp_view   ON mp_view.prior_key   = 'global.view_rate'
LEFT JOIN public.market_priors mp_accept ON mp_accept.prior_key = 'global.accept_rate';

-- ============================================================
-- G) Refresh function (called daily by market-aggregates-refresh edge fn)
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_market_bucket_aggregates_30d()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upserted int := 0;
  v_window_start timestamptz := now() - interval '30 days';
BEGIN
  -- Aggregate from match_offers + matches + loads
  INSERT INTO public.market_bucket_aggregates (
    similar_bucket_key, geo_key, window_days,
    loads_posted, offers_sent, offers_viewed, offers_accepted, loads_filled,
    raw_offer_rate, raw_view_rate, raw_accept_rate, raw_fill_rate,
    median_time_to_offer_min, median_time_to_accept_min,
    effective_supply_count, last_refreshed_at
  )
  SELECT
    COALESCE(li.similar_bucket_key, 'global')                AS similar_bucket_key,
    COALESCE(li.geo_key, l.origin_state)                     AS geo_key,
    30                                                        AS window_days,
    COUNT(DISTINCT l.id)                                      AS loads_posted,
    COUNT(mo.id)                                              AS offers_sent,
    COUNT(mo.id) FILTER (WHERE mo.viewed_at IS NOT NULL)     AS offers_viewed,
    COUNT(mo.id) FILTER (WHERE mo.status = 'accepted')       AS offers_accepted,
    COUNT(m.id)                                               AS loads_filled,
    -- rates
    NULLIF(COUNT(mo.id),0)::numeric
      / NULLIF(COUNT(DISTINCT l.id),0) AS raw_offer_rate,
    COUNT(mo.id) FILTER (WHERE mo.viewed_at IS NOT NULL)::numeric
      / NULLIF(COUNT(mo.id),0) AS raw_view_rate,
    COUNT(mo.id) FILTER (WHERE mo.status = 'accepted')::numeric
      / NULLIF(COUNT(mo.id) FILTER (WHERE mo.viewed_at IS NOT NULL), 0) AS raw_accept_rate,
    COUNT(m.id)::numeric / NULLIF(COUNT(DISTINCT l.id),0) AS raw_fill_rate,
    -- medians (approximate via percentile_cont)
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (mo.offered_at - l.created_at))/60
    ) AS median_time_to_offer_min,
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (mo.responded_at - mo.offered_at))/60
    ) FILTER (WHERE mo.status = 'accepted') AS median_time_to_accept_min,
    0  AS effective_supply_count,  -- updated separately
    now() AS last_refreshed_at
  FROM public.loads l
  LEFT JOIN public.load_intel li ON li.load_id = l.id
  LEFT JOIN public.match_offers mo ON mo.load_id = l.id
    AND mo.offered_at >= v_window_start
  LEFT JOIN public.matches m ON m.load_id = l.id
  WHERE l.created_at >= v_window_start
  GROUP BY COALESCE(li.similar_bucket_key, 'global'), COALESCE(li.geo_key, l.origin_state)
  ON CONFLICT (similar_bucket_key, window_days)
  DO UPDATE SET
    loads_posted              = excluded.loads_posted,
    offers_sent               = excluded.offers_sent,
    offers_viewed             = excluded.offers_viewed,
    offers_accepted           = excluded.offers_accepted,
    loads_filled              = excluded.loads_filled,
    raw_offer_rate            = excluded.raw_offer_rate,
    raw_view_rate             = excluded.raw_view_rate,
    raw_accept_rate           = excluded.raw_accept_rate,
    raw_fill_rate             = excluded.raw_fill_rate,
    median_time_to_offer_min  = excluded.median_time_to_offer_min,
    median_time_to_accept_min = excluded.median_time_to_accept_min,
    last_refreshed_at         = now();

  GET DIAGNOSTICS v_upserted = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'buckets_refreshed', v_upserted);
END;
$$;
