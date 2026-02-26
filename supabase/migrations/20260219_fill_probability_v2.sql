-- 20260219_fill_probability_v2.sql
-- High-fidelity predictive signals for 'One-Tap Dispatch' and 'Market Pulse'

-- 1) Schema Extensions
ALTER TABLE public.load_intel
ADD COLUMN IF NOT EXISTS fill_probability_01 numeric,
ADD COLUMN IF NOT EXISTS fill_speed_bucket text,         -- 'fast'|'normal'|'slow'
ADD COLUMN IF NOT EXISTS explain_top_3 text[],           -- short reasons
ADD COLUMN IF NOT EXISTS distance_confidence text,       -- 'high'|'medium'|'low'
ADD COLUMN IF NOT EXISTS freshness_01 numeric,
ADD COLUMN IF NOT EXISTS broker_trust_01 numeric,
ADD COLUMN IF NOT EXISTS lane_density_01 numeric,
ADD COLUMN IF NOT EXISTS backhaul_prob_01 numeric,
ADD COLUMN IF NOT EXISTS deadhead_risk_01 numeric,
ADD COLUMN IF NOT EXISTS ghost_score_01 numeric,
ADD COLUMN IF NOT EXISTS rate_signal text,               -- 'below'|'fair'|'strong'|'unknown'
ADD COLUMN IF NOT EXISTS rate_position_01 numeric;       -- 0..1

-- 2) Core Math Helpers
CREATE OR REPLACE FUNCTION public.clamp01(x numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT GREATEST(0, LEAST(1, x)); $$;

CREATE OR REPLACE FUNCTION public.sigmoid(x numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT 1.0 / (1.0 + exp(-x)); $$;

-- 3) Feature Normalization
CREATE OR REPLACE FUNCTION public.freshness_01(p_posted_at timestamptz)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT public.clamp01(
    exp( - (extract(epoch from (now() - p_posted_at)) / 3600.0) / 18.0 )
  );
$$;

CREATE OR REPLACE FUNCTION public.rate_bonus(p_rate_signal text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rate_signal = 'strong' then 0.35
    WHEN p_rate_signal = 'fair' then 0.16
    WHEN p_rate_signal = 'below' then -0.28
    ELSE 0.00
  END;
$$;

CREATE OR REPLACE FUNCTION public.distance_bonus(p_conf text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_conf = 'high' then 0.10
    WHEN p_conf = 'medium' then 0.04
    ELSE -0.06
  END;
$$;

-- 4) Fill Probability v2 function
CREATE OR REPLACE FUNCTION public.compute_fill_probability_v2(
  p_posted_at timestamptz,
  p_broker_trust_01 numeric,
  p_lane_density_01 numeric,
  p_backhaul_prob_01 numeric,
  p_deadhead_risk_01 numeric,
  p_ghost_score_01 numeric,
  p_rate_signal text,
  p_distance_confidence text
)
RETURNS table(fill_probability_01 numeric, fill_speed_bucket text, explain_top_3 text[])
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  f numeric := public.freshness_01(p_posted_at); 
  bt numeric := public.clamp01(COALESCE(p_broker_trust_01, 0.55));
  ld numeric := public.clamp01(COALESCE(p_lane_density_01, 0.45));
  bh numeric := public.clamp01(COALESCE(p_backhaul_prob_01, 0.35));
  dr numeric := public.clamp01(COALESCE(p_deadhead_risk_01, 0.50));
  gh numeric := public.clamp01(COALESCE(p_ghost_score_01, 0.00));

  rb numeric := public.rate_bonus(COALESCE(p_rate_signal, 'unknown'));
  db numeric := public.distance_bonus(COALESCE(p_distance_confidence, 'low'));

  z numeric;
  p numeric;
  reasons text[] := '{}';
BEGIN
  -- Model core: logistic of weighted signals
  z :=
    (-0.25)                       -- base intercept
    + (f  * 1.10)
    + (bt * 0.95)
    + (ld * 0.55)
    + (bh * 0.35)
    + (rb * 1.00)
    + (db * 0.65)
    - (gh * 1.10)
    - (dr * 0.55);

  p := public.clamp01(public.sigmoid(z));

  -- Bucket
  fill_speed_bucket :=
    CASE
      WHEN p >= 0.72 THEN 'fast'
      WHEN p >= 0.50 THEN 'normal'
      ELSE 'slow'
    END;

  -- Top reasons
  IF f >= 0.70 THEN reasons := array_append(reasons, 'Fresh post'); END IF;
  IF bt >= 0.70 THEN reasons := array_append(reasons, 'Trusted broker'); END IF;
  IF ld >= 0.70 THEN reasons := array_append(reasons, 'Hot lane'); END IF;
  IF bh >= 0.70 THEN reasons := array_append(reasons, 'Return likely'); END IF;
  IF p_rate_signal = 'strong' THEN reasons := array_append(reasons, 'Strong rate'); END IF;
  IF p_rate_signal = 'below' THEN reasons := array_append(reasons, 'Below range'); END IF;
  IF gh >= 0.75 THEN reasons := array_append(reasons, 'Ghost risk'); END IF;
  IF dr >= 0.75 THEN reasons := array_append(reasons, 'Deadhead risk'); END IF;
  IF p_distance_confidence = 'high' THEN reasons := array_append(reasons, 'Verified miles'); END IF;

  -- Keep only top 3
  IF array_length(reasons,1) > 3 THEN
    reasons := reasons[1:3];
  END IF;

  RETURN QUERY SELECT p, fill_speed_bucket, reasons;
END;
$$;
