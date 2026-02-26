-- 20260220_boost_sla_log.sql
-- Boost guarantee SLA telemetry table + guaranteed window compute function.
-- Per HAUL_COMMAND_BUILD_PACK_V3 spec: every boosted load logs full SLA timeline.
-- Missing telemetry = auto-refund (system failure).

CREATE TABLE IF NOT EXISTS public.boost_sla_log (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id                   uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  broker_id                 uuid NOT NULL,
  boost_purchased_at        timestamptz DEFAULT now(),
  -- Computed guarantee window (stored at purchase time)
  guaranteed_window_minutes int NOT NULL,
  guaranteed_window_expires_at timestamptz GENERATED ALWAYS AS (
    boost_purchased_at + (guaranteed_window_minutes * interval '1 minute')
  ) STORED,
  -- Eligibility gate results (stored at purchase time)
  p_fill_60m_at_purchase    numeric(6,4),
  confidence_at_purchase    numeric(6,4),
  supply_count_at_purchase  int,
  supply_demand_at_purchase numeric(10,4),
  x_rate_fit_at_purchase    numeric(6,4),
  eligibility_passed        bool NOT NULL DEFAULT false,
  eligibility_gate_results  jsonb DEFAULT '{}'::jsonb,
  -- SLA telemetry (filled in as events occur)
  first_offer_at            timestamptz,
  first_view_at             timestamptz,
  first_accept_at           timestamptz,
  total_offers_sent         int DEFAULT 0,
  wave_count                int DEFAULT 0,
  sms_fallback_triggered    bool DEFAULT false,
  dispatcher_called         bool DEFAULT false,
  -- Outcome
  sla_window_elapsed        bool DEFAULT false,
  sla_met                   bool,
  refund_eligible           bool DEFAULT false,
  refund_issued             bool DEFAULT false,
  refund_amount             numeric(10,2),
  refund_type               text CHECK (refund_type IN ('credit','cash',NULL)),
  refund_reason             text,
  -- Void conditions
  broker_cancelled_early    bool DEFAULT false,
  broker_changed_requirements bool DEFAULT false,
  rate_below_floor_at_post  bool DEFAULT false,
  -- Audit
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boost_sla_load_idx ON public.boost_sla_log (load_id);
CREATE INDEX IF NOT EXISTS boost_sla_broker_idx ON public.boost_sla_log (broker_id, boost_purchased_at DESC);

-- RLS: broker reads own SLA logs; admin reads all
ALTER TABLE public.boost_sla_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boost_sla_broker_read" ON public.boost_sla_log
  FOR SELECT USING (auth.uid() = broker_id);

-- ============================================================
-- Guarantee window compute function
-- Formula from Build Pack V3:
-- clamp(15 + 45*(1-p_fill_60m) + 20*(1-confidence)
--           + 25*(1-x_supply_demand_ratio) + 20*(1-x_rate_fit)
--           + 15*(1-x_simplicity), 15, 120)
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_guaranteed_window_minutes(
  p_fill_60m            numeric,
  confidence            numeric,
  x_supply_demand_ratio numeric,
  x_rate_fit            numeric,
  x_simplicity          numeric DEFAULT 0.7
)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(15, LEAST(120, ROUND(
    15
    + 45 * (1 - COALESCE(p_fill_60m, 0.5))
    + 20 * (1 - COALESCE(confidence, 0.5))
    + 25 * (1 - COALESCE(x_supply_demand_ratio, 0.5))
    + 20 * (1 - COALESCE(x_rate_fit, 0.5))
    + 15 * (1 - COALESCE(x_simplicity, 0.7))
  )::int));
$$;

-- ============================================================
-- Eligibility check function (returns passed bool + reasons)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_boost_eligibility(
  p_fill_60m            numeric,
  confidence            numeric,
  available_supply_count int,
  x_supply_demand_ratio numeric,
  x_rate_fit            numeric,
  geo_key               text
)
RETURNS TABLE(
  eligible      bool,
  gate_results  jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_prob_ok   bool := COALESCE(p_fill_60m, 0) >= 0.55 AND COALESCE(confidence, 0) >= 0.50;
  v_supply_ok bool := COALESCE(available_supply_count, 0) >= 12
                      AND COALESCE(x_supply_demand_ratio, 0) >= 0.70;
  v_rate_ok   bool := COALESCE(x_rate_fit, 0) >= 0.70;
  v_geo_ok    bool; -- geo whitelist check
BEGIN
  -- Geo whitelist: for now FL/GA are supported; expand via config table later
  v_geo_ok := (geo_key ILIKE '%FL%' OR geo_key ILIKE '%GA%' OR geo_key ILIKE '%TX%');

  RETURN QUERY SELECT
    (v_prob_ok AND v_supply_ok AND v_rate_ok AND v_geo_ok),
    jsonb_build_object(
      'probability_gate', jsonb_build_object('passed', v_prob_ok,
        'p_fill_60m', p_fill_60m, 'confidence', confidence),
      'supply_gate', jsonb_build_object('passed', v_supply_ok,
        'supply_count', available_supply_count, 'ratio', x_supply_demand_ratio),
      'rate_gate', jsonb_build_object('passed', v_rate_ok, 'x_rate_fit', x_rate_fit),
      'geo_gate', jsonb_build_object('passed', v_geo_ok, 'geo_key', geo_key)
    );
END;
$$;

-- Seed: ensure the loads table has a 'boosted' flag column
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS is_boosted bool DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_sla_log_id uuid REFERENCES public.boost_sla_log(id);
