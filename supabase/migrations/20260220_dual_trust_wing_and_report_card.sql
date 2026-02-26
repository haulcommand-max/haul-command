-- ============================================================
-- PR #3: REPORT CARD v2.5 & DUAL TRUST WING ENGINE v2.7
-- ============================================================

-- 1. BROKER TRUST WING (BTS) COLUMNS
-- Add trust metrics to the core profiles table (used by brokers)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS broker_trust_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS payment_reliability numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS load_integrity_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS communication_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS volume_credibility numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS dispute_health numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS broker_confidence_multiplier numeric(3,2) DEFAULT 0.55,
  ADD COLUMN IF NOT EXISTS trust_tier text DEFAULT 'Watch List' 
    CHECK (trust_tier IN ('Watch List', 'Standard Broker', 'Verified Broker', 'Gold Broker', 'Platinum Broker')),
  ADD COLUMN IF NOT EXISTS trust_last_calculated_at timestamptz;


-- 2. ESCORT REPORT CARD v2.5 & TRUST WING (ETS) COLUMNS
-- Add report card + ETS overlay to escort_profiles
ALTER TABLE public.escort_profiles
  -- Core Report Card v2.5
  ADD COLUMN IF NOT EXISTS reliability_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS coverage_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS response_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS activity_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS experience_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS trust_score numeric(5,2) DEFAULT 0.0,  -- Base trust
  ADD COLUMN IF NOT EXISTS confidence_multiplier numeric(3,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS final_score numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS rank_tier text DEFAULT 'Standard' 
    CHECK (rank_tier IN ('Standard', 'Verified Escort', 'Preferred Escort')),
  ADD COLUMN IF NOT EXISTS score_last_calculated_at timestamptz,
  
  -- ETS Enhancement Build-outs
  ADD COLUMN IF NOT EXISTS escort_trust_wing numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS broker_favorite_rate numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS onsite_reliability numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS compliance_health numeric(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS professional_signals numeric(5,2) DEFAULT 0.0;


-- 3. SQL FUNCTIONS: COMPUTE ESCORT REPORT CARD
-- This function computes the base Report Card and the ETS overlay.
CREATE OR REPLACE FUNCTION public.compute_escort_report_card(p_escort_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reliability numeric;
  v_coverage numeric;
  v_response numeric;
  v_activity numeric;
  v_experience numeric;
  v_trust numeric;
  
  v_confidence numeric;
  v_final numeric;
  v_rank_tier text;
  
  v_broker_fav numeric;
  v_onsite numeric;
  v_compliance numeric;
  v_professional numeric;
  v_ets numeric;
  
  -- Decay engine vars
  v_last_job_days int;
BEGIN
  -- 1. BASE DATA GATHERING (Mock weights for edge function hookup or direct DB trigger)
  -- In production, these variables would be SELECTs isolating data points
  -- over the trailing 90-180 days. We initialize placeholders for the mathematical structure.
  
  v_reliability := 85.0; -- Default seed
  v_coverage := 70.0;
  v_response := 90.0;
  v_activity := 80.0;
  v_experience := 40.0;
  v_trust := 95.0;
  
  -- 2. ACTIVITY DECAY ENGINE (60-day half-life)
  -- Find days since last completed match
  SELECT EXTRACT(DAY FROM now() - COALESCE(MAX(complete_at), now() - interval '90 days'))
  INTO v_last_job_days
  FROM public.matches
  WHERE escort_id = p_escort_id AND status = 'completed';

  -- Apply decay formula: Score * (0.5 ^ (days/60))
  v_activity := v_activity * POWER(0.5, GREATEST(0, (v_last_job_days / 60.0)));
  
  -- 3. CONFIDENCE MULTIPLIER
  -- Based on volume of signals
  v_confidence := 0.75; -- seed
  
  -- 4. FINAL REPORT CARD SCORE
  v_final := (
    (v_reliability * 0.30) +
    (v_response * 0.20) +
    (v_activity * 0.20) +
    (v_experience * 0.10) +
    (v_trust * 0.20)
  ) * v_confidence;
  
  -- 5. ESCORT TRUST WING (ETS) COMPUTATION
  v_broker_fav := 80.0;
  v_onsite := v_reliability;
  v_compliance := 100.0;
  v_professional := 90.0;
  
  v_ets := (
    (v_trust * 0.25) +          -- Translates to Payment Dispute Rate weight
    (v_broker_fav * 0.25) + 
    (v_onsite * 0.20) +
    (v_compliance * 0.15) +
    (v_professional * 0.15)
  );
  
  -- 6. TIER ASSIGNMENT
  IF v_ets >= 85 AND v_confidence > 0.6 THEN
    v_rank_tier := 'Preferred Escort';
  ELSIF v_ets >= 70 AND v_confidence > 0.6 THEN
    v_rank_tier := 'Verified Escort';
  ELSE
    v_rank_tier := 'Standard';
  END IF;

  -- 7. UPDATE PROFILE
  UPDATE public.escort_profiles
  SET 
    reliability_score = v_reliability,
    coverage_score = v_coverage,
    response_score = v_response,
    activity_score = v_activity,
    experience_score = v_experience,
    trust_score = v_trust,
    confidence_multiplier = v_confidence,
    final_score = v_final,
    
    escort_trust_wing = v_ets,
    broker_favorite_rate = v_broker_fav,
    onsite_reliability = v_onsite,
    compliance_health = v_compliance,
    professional_signals = v_professional,
    
    rank_tier = v_rank_tier,
    score_last_calculated_at = now()
  WHERE escort_id = p_escort_id;

END;
$$;


-- 4. SQL FUNCTIONS: COMPUTE BROKER TRUST (BTS)
CREATE OR REPLACE FUNCTION public.compute_broker_trust_score(p_broker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment numeric;
  v_integrity numeric;
  v_communication numeric;
  v_volume numeric;
  v_dispute numeric;
  v_confidence numeric;
  
  v_bts numeric;
  v_tier text;
BEGIN
  -- 1. BASE DATA GATHERING (Placeholders for logic)
  v_payment := 92.0;    -- High impact
  v_integrity := 88.0;
  v_communication := 75.0;
  v_volume := 60.0;     -- Low initial volume credibility
  v_dispute := 100.0;   -- No disputes
  v_confidence := 0.65; -- Seed confidence

  -- 2. BTS CALCULATION
  v_bts := (
    (v_payment * 0.35) +
    (v_integrity * 0.20) +
    (v_communication * 0.15) +
    (v_volume * 0.15) +
    (v_dispute * 0.15)
  ) * v_confidence;
  
  -- 3. TIER ASSIGNMENT
  IF v_bts >= 90 THEN v_tier := 'Platinum Broker';
  ELSIF v_bts >= 80 THEN v_tier := 'Gold Broker';
  ELSIF v_bts >= 70 THEN v_tier := 'Verified Broker';
  ELSIF v_bts >= 60 THEN v_tier := 'Standard Broker';
  ELSE v_tier := 'Watch List';
  END IF;

  -- 4. UPDATE PROFILE
  UPDATE public.profiles
  SET 
    broker_trust_score = v_bts,
    payment_reliability = v_payment,
    load_integrity_score = v_integrity,
    communication_score = v_communication,
    volume_credibility = v_volume,
    dispute_health = v_dispute,
    broker_confidence_multiplier = v_confidence,
    trust_tier = v_tier,
    trust_last_calculated_at = now()
  WHERE id = p_broker_id;
  
END;
$$;


-- 5. LEADERBOARD VIEW UPDATE
-- Replace the old public_leaderboards view to use the new final_score natively
DROP VIEW IF EXISTS public.public_leaderboards;
CREATE VIEW public.public_leaderboards AS
SELECT 
  'all_time' AS timeframe,
  'us' AS country_code,
  'all' AS region_code,
  'highest_report_card' AS metric,
  'escort' AS actor_type,
  ep.escort_id AS actor_id,
  -- Dense rank by final_score descending
  DENSE_RANK() OVER (ORDER BY ep.final_score DESC NULLS LAST) AS rank,
  ep.final_score AS score,
  ep.rank_tier AS tier_label,
  ep.final_score / 100.0 AS compliance_score, -- Mock normalization
  true AS funds_verified_badge,
  p.display_name,
  ep.score_last_calculated_at AS updated_at
FROM public.escort_profiles ep
JOIN public.profiles p ON ep.escort_id = p.id
WHERE ep.confidence_multiplier >= 0.60
  AND ep.final_score > 0;
