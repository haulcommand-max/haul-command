-- PART 4: canonical stats RPC + public views

CREATE OR REPLACE FUNCTION get_canonical_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_real_operators',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE is_public = true 
         AND trust_classification != 'fake_synthetic_generated'
         AND trust_classification != 'test_seed_demo_fixture'),
    'operators_with_phone',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE is_public = true 
         AND phone IS NOT NULL AND phone != ''
         AND trust_classification != 'fake_synthetic_generated'),
    'operators_with_email',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE is_public = true 
         AND email IS NOT NULL AND email != ''
         AND trust_classification != 'fake_synthetic_generated'),
    'claimed_profiles',
      (SELECT count(*)::int FROM hc_real_operators WHERE claim_status != 'unclaimed'),
    'us_operators',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE country_code = 'US' AND is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    'active_countries',
      (SELECT count(DISTINCT country_code)::int FROM hc_real_operators 
       WHERE is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    'jurisdictions',
      (SELECT count(*)::int FROM jurisdictions),
    'infrastructure_locations',
      (SELECT count(*)::int FROM hc_places WHERE status = 'published'),
    'escort_operators',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE entity_type = 'escort_operator' AND is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    'pilot_car_operators',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE entity_type = 'pilot_car_operator' AND is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    'pilot_drivers',
      (SELECT count(*)::int FROM hc_real_operators 
       WHERE entity_type = 'pilot_driver' AND is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    'quarantined_synthetic',
      (SELECT count(*)::int FROM directory_listings 
       WHERE trust_classification = 'fake_synthetic_generated'),
    'sources', jsonb_build_object(
      'uspilotcars_hc_entity', (SELECT count(*)::int FROM hc_real_operators WHERE source_system = 'uspilotcars_hc_entity'),
      'osow_haven', (SELECT count(*)::int FROM hc_real_operators WHERE source_system = 'osow_haven')
    ),
    'computed_at', now()
  )
$$;

-- Public-safe view used by all pages
CREATE OR REPLACE VIEW hc_public_operators AS
SELECT
  id,
  display_name AS name,
  slug,
  entity_type,
  phone,
  email,
  website,
  city,
  state_code,
  country_code,
  trust_classification,
  claim_status,
  evidence_score,
  trust_score,
  source_system,
  created_at,
  updated_at
FROM hc_real_operators
WHERE 
  is_public = true
  AND trust_classification NOT IN ('fake_synthetic_generated', 'test_seed_demo_fixture')
  AND display_name IS NOT NULL;

-- Per-state counts (US only)
CREATE OR REPLACE VIEW hc_real_state_counts AS
SELECT
  state_code,
  count(*)::int AS operator_count,
  count(phone)::int AS with_phone,
  count(email)::int AS with_email
FROM hc_real_operators
WHERE 
  country_code = 'US'
  AND is_public = true
  AND trust_classification != 'fake_synthetic_generated'
GROUP BY state_code;

-- Per entity_type counts
CREATE OR REPLACE VIEW hc_real_category_counts AS
SELECT
  entity_type,
  count(*)::int AS cnt,
  count(phone)::int AS with_phone,
  count(email)::int AS with_email
FROM hc_real_operators
WHERE is_public = true AND trust_classification != 'fake_synthetic_generated'
GROUP BY entity_type;

-- Verify counts
SELECT get_canonical_stats();
