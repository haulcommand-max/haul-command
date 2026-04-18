-- ============================================================================
-- MASS ACTIVATION: US ENTITIES (Pilot Cars, Brokers, Logistics Matrix)
-- ============================================================================
-- Objective: Push all scraped US entities (1.566M+) into live/visible status.
-- Scope: All US records across all primary legacy and next-gen schemas.
-- Action: Sets verified=true, status=active, unlocks visibility filters
-- ============================================================================

BEGIN;

-- 1. Activate next-gen Unified identity Graph (HC-GIS)
-- Covers carriers, escorts, brokers, shippers, support grid
UPDATE public.operator_profile
SET 
  verified = TRUE,
  onboarded = TRUE,
  verified_by = 'system_mass_activation',
  hc_score = GREATEST(hc_score, 70), -- Ensure minimum score for marketplace visibility
  updated_at = NOW()
WHERE 
  address_country = 'US' OR address_country IS NULL;

-- Upsert baseline scores to ensure marketplace_eligible view logic works
INSERT INTO public.operator_score (
  operator_id,
  score_type,
  score_value,
  score_grade,
  marketplace_eligible,
  calculated_at
)
SELECT 
  id,
  'COMPOSITE',
  GREATEST(COALESCE(hc_score, 0), 70.0),
  'C',
  TRUE,
  NOW()
FROM public.operator_profile
WHERE address_country = 'US' OR address_country IS NULL
ON CONFLICT (operator_id, score_type) DO UPDATE SET 
  marketplace_eligible = TRUE,
  score_value = GREATEST(operator_score.score_value, 70.0),
  updated_at = NOW();

-- 2. Activate legacy / v1 Escort Directory Listings
UPDATE public.escort_companies
SET 
  status = 'verified',
  updated_at = NOW()
WHERE 
  hq_country = 'US' OR hq_country IS NULL;

UPDATE public.listings
SET 
  is_public = TRUE,
  updated_at = NOW()
WHERE 
  country = 'US' OR country IS NULL;

-- 3. Activate legacy / v1 Marketplace Profiles
UPDATE public.broker_profiles
SET 
  verified_business = TRUE,
  reputation_score = GREATEST(reputation_score, 70),
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE home_country = 'US' OR home_country IS NULL
);

UPDATE public.driver_profiles
SET 
  verified_score = GREATEST(verified_score, 70),
  availability_status = 'available',
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE home_country = 'US' OR home_country IS NULL
);

-- 4. Mark base profiles as active just in case status exists
UPDATE public.users 
SET status = 'active'
WHERE id IN (
  SELECT id FROM public.profiles WHERE home_country = 'US' OR home_country IS NULL
);

COMMIT;
