-- 20260219_fill_engine_v2.sql

-- PHASE 1: Distance Layer Hardening

-- Task 1.1: Ensure trigger exists for active loads requiring miles > 0
CREATE OR REPLACE FUNCTION public.check_active_load_miles()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'active' AND (NEW.miles IS NULL OR NEW.miles <= 0) THEN
    RAISE EXCEPTION 'Active loads must have miles > 0. Calculate distance before activating.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_active_load_miles ON public.loads;
CREATE TRIGGER ensure_active_load_miles
  BEFORE INSERT OR UPDATE OF status, miles ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_active_load_miles();

-- Task 1.3: Distance confidence scoring
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS distance_confidence text;

-- PHASE 2: Fill Probability Engine v2

-- Task 2.1: Required columns (safe add)
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS fill_probability_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS fill_speed_bucket text;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS explain_top_3 text[];
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS freshness_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS broker_trust_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS lane_density_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS backhaul_prob_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS deadhead_risk_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS ghost_score_01 numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS rate_signal text;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS rate_position_01 numeric;

-- PHASE 3: Adaptive Learning Layer

-- Task 3.1: Add outcome tracking to loads
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS first_unlock_at timestamptz;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS filled_at timestamptz;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS unlock_count int default 0;

-- Task 3.2: Derived performance metrics to load_intel
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS time_to_first_unlock_hours numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS time_to_fill_hours numeric;
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS historical_fill_quality numeric;

-- PHASE 4: Sparse Data Protection

-- Task 4.2: Confidence weighting
ALTER TABLE public.load_intel ADD COLUMN IF NOT EXISTS model_confidence text;


-- PHASE 2.2: Math helpers
CREATE OR REPLACE FUNCTION public.clamp01(x numeric)
RETURNS numeric AS $$
BEGIN
  IF x < 0 THEN RETURN 0; END IF;
  IF x > 1 THEN RETURN 1; END IF;
  RETURN x;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.sigmoid(x numeric)
RETURNS numeric AS $$
BEGIN
  RETURN 1.0 / (1.0 + exp(-x));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.freshness_01(posted_at timestamptz)
RETURNS numeric AS $$
DECLARE
  hours_old numeric;
BEGIN
  hours_old := extract(epoch from (now() - posted_at)) / 3600.0;
  IF hours_old <= 0 THEN RETURN 1.0; END IF;
  -- Decay: 1 hour = 0.9, 12 hours = 0.5, 48 hours = 0.1
  RETURN public.clamp01(exp(-hours_old / 18.0));
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.rate_bonus(rate_signal text)
RETURNS numeric AS $$
BEGIN
  IF rate_signal = 'hot' THEN RETURN 0.20; END IF;
  IF rate_signal = 'warm' THEN RETURN 0.10; END IF;
  IF rate_signal = 'fair' THEN RETURN 0.00; END IF;
  IF rate_signal = 'cold' THEN RETURN -0.15; END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.distance_bonus(distance_confidence text)
RETURNS numeric AS $$
BEGIN
  IF distance_confidence = 'high' THEN RETURN 0.05; END IF;
  IF distance_confidence = 'medium' THEN RETURN 0.00; END IF;
  IF distance_confidence = 'low' THEN RETURN -0.20; END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- PHASE 3.3: Adaptive Calibration Function
CREATE OR REPLACE FUNCTION public.compute_fill_calibration_factor(p_region text, p_service_type text)
RETURNS numeric AS $$
DECLARE
  median_fill_hours numeric;
  calibration_factor numeric;
  v_load_count int;
BEGIN
  -- Look at last 60 days
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY li.time_to_fill_hours), count(*)
  INTO median_fill_hours, v_load_count
  FROM public.loads l
  JOIN public.load_intel li ON l.id = li.load_id
  WHERE l.origin_region = p_region AND l.service_type = p_service_type
    AND l.status = 'filled'
    AND l.posted_at >= now() - interval '60 days';

  IF v_load_count < 25 OR median_fill_hours IS NULL OR median_fill_hours <= 0 THEN
    RETURN 1.0; -- Neutral if not enough data
  END IF;

  -- 4 hours is our baseline "normal" fill time. 
  -- Fast (e.g. 2 hrs) > 1 factor; Slow (e.g. 10 hrs) < 1 factor.
  calibration_factor := 4.0 / median_fill_hours;
  
  -- Clamp 0.85 to 1.15 to prevent wild swings
  IF calibration_factor < 0.85 THEN RETURN 0.85; END IF;
  IF calibration_factor > 1.15 THEN RETURN 1.15; END IF;
  
  RETURN calibration_factor;
END;
$$ LANGUAGE plpgsql STABLE;


-- PHASE 2.3 & 4.1 & 5.1: Compute Fill Probability v2
CREATE OR REPLACE FUNCTION public.compute_fill_probability_v2(
  p_load_id uuid,
  p_posted_at timestamptz,
  p_region text,
  p_service_type text,
  p_broker_trust_01 numeric,
  p_lane_density_01 numeric,
  p_backhaul_prob_01 numeric,
  p_rate_signal text,
  p_verified_miles numeric,
  p_ghost_score_01 numeric,
  p_deadhead_risk_01 numeric
)
RETURNS jsonb AS $$
DECLARE
  v_freshness numeric;
  v_dist_conf text;
  v_final_prob numeric;
  v_raw_prob numeric;
  v_explain text[] := '{}';
  v_model_conf text := 'high';
  v_calib numeric;
  
  -- Priors
  v_prior_trust numeric := 0.55;
  v_prior_density numeric := 0.45;
  v_prior_backhaul numeric := 0.35;
  
  v_load_count int;
  v_speed_bucket text;
BEGIN
  -- 1. Low data fallback (Phase 4.1)
  SELECT count(*) INTO v_load_count 
  FROM public.loads 
  WHERE origin_region = p_region AND service_type = p_service_type AND posted_at >= now() - interval '60 days';
  
  IF v_load_count < 25 THEN
    v_model_conf := 'low_data';
    p_broker_trust_01 := COALESCE(nullif(p_broker_trust_01, 0), v_prior_trust);
    p_lane_density_01 := COALESCE(nullif(p_lane_density_01, 0), v_prior_density);
    p_backhaul_prob_01 := COALESCE(nullif(p_backhaul_prob_01, 0), v_prior_backhaul);
  END IF;

  -- 2. Distance Confidence (Phase 1.3)
  IF p_verified_miles IS NULL OR p_verified_miles <= 0 THEN
    v_dist_conf := 'low';
  ELSE
    v_dist_conf := 'high'; -- Medium could be determined by the caller if manually entered
  END IF;

  -- 3. Compute Signals
  v_freshness := public.freshness_01(p_posted_at);
  
  -- Logistic Model base parameters (log-odds)
  v_raw_prob := -2.0; -- Pessimistic base rate
  
  v_raw_prob := v_raw_prob + (v_freshness * 2.0);
  v_raw_prob := v_raw_prob + (COALESCE(p_broker_trust_01, 0) * 1.5);
  v_raw_prob := v_raw_prob + (COALESCE(p_lane_density_01, 0) * 1.0);
  v_raw_prob := v_raw_prob + (COALESCE(p_backhaul_prob_01, 0) * 0.8);
  v_raw_prob := v_raw_prob + public.rate_bonus(p_rate_signal);
  v_raw_prob := v_raw_prob + public.distance_bonus(v_dist_conf);
  
  v_raw_prob := v_raw_prob - (COALESCE(p_ghost_score_01, 0) * 2.0);
  v_raw_prob := v_raw_prob - (COALESCE(p_deadhead_risk_01, 0) * 1.0);
  
  -- Convert to probability 0-1
  v_raw_prob := public.sigmoid(v_raw_prob);
  
  -- 4. Apply Calibration (Phase 3.4)
  v_calib := public.compute_fill_calibration_factor(p_region, p_service_type);
  v_final_prob := public.clamp01(v_raw_prob * v_calib);
  
  -- 5. Explainability Chips (Phase 5.1)
  IF v_freshness > 0.8 THEN v_explain := array_append(v_explain, 'Fresh post'); END IF;
  IF p_rate_signal IN ('hot', 'warm') THEN v_explain := array_append(v_explain, 'Strong rate'); END IF;
  IF p_broker_trust_01 > 0.8 THEN v_explain := array_append(v_explain, 'Trusted broker'); END IF;
  IF p_lane_density_01 > 0.7 AND array_length(v_explain, 1) < 3 THEN v_explain := array_append(v_explain, 'Hot lane'); END IF;
  IF p_backhaul_prob_01 > 0.6 AND array_length(v_explain, 1) < 3 THEN v_explain := array_append(v_explain, 'Return likely'); END IF;
  IF v_dist_conf = 'high' AND array_length(v_explain, 1) < 3 THEN v_explain := array_append(v_explain, 'Verified miles'); END IF;
  IF p_ghost_score_01 > 0.6 AND array_length(v_explain, 1) < 3 THEN v_explain := array_append(v_explain, 'Ghost risk'); END IF;
  IF p_deadhead_risk_01 > 0.7 AND array_length(v_explain, 1) < 3 THEN v_explain := array_append(v_explain, 'Deadhead risk'); END IF;

  IF array_length(v_explain, 1) > 3 THEN
    v_explain := v_explain[1:3];
  END IF;
  
  -- 6. Speed Bucket (Phase 5.2)
  IF v_final_prob >= 0.72 THEN
    v_speed_bucket := 'FAST-FILL';
  ELSIF v_final_prob >= 0.50 THEN
    v_speed_bucket := 'NORMAL';
  ELSE
    v_speed_bucket := 'SLOW';
  END IF;

  RETURN jsonb_build_object(
    'fill_probability_01', v_final_prob,
    'fill_speed_bucket', v_speed_bucket,
    'explain_top_3', v_explain,
    'model_confidence', v_model_conf,
    'calibration_factor', v_calib
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Task 1.2: Distance Quality Penalty Trigger
-- We assume `load_rank` is currently computed dynamically, but if it is stored in `load_intel`
-- we should penalize it upon generating load_intel if distance is missing.
CREATE OR REPLACE FUNCTION public.apply_distance_penalty()
RETURNS trigger AS $$
DECLARE
  v_miles numeric;
BEGIN
  SELECT miles INTO v_miles FROM public.loads WHERE id = NEW.load_id;
  
  IF v_miles IS NULL OR v_miles <= 0 THEN
    NEW.load_rank := COALESCE(NEW.load_rank, 1.0) - 0.35;
    NEW.ghost_score_01 := COALESCE(NEW.ghost_score_01, 0.0) + 0.20;
    NEW.distance_confidence := 'low';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS apply_distance_penalty_load_intel ON public.load_intel;
CREATE TRIGGER apply_distance_penalty_load_intel
  BEFORE INSERT OR UPDATE OF load_rank ON public.load_intel
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_distance_penalty();
