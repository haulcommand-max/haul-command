-- Backfill from hc_entity with CTE to dedupe slugs first
WITH ranked AS (
  SELECT
    e.id,
    e.canonical_name,
    e.entity_type,
    e.phone,
    e.email,
    e.website,
    nullif(trim(e.city), '') AS city,
    nullif(trim(e.region), '')::char(2) AS state_code,
    coalesce(nullif(trim(e.country_code), ''), 'US') AS country_code,
    coalesce(e.first_seen_at, e.created_at, now()) AS imported_at,
    e.evidence_score,
    e.trust_score,
    lower(
      substring(
        regexp_replace(
          regexp_replace(e.canonical_name || '-' || coalesce(e.region, 'us'), '[^a-zA-Z0-9]+', '-', 'g'),
          '-+', '-', 'g'
        ),
        1, 120
      )
    ) AS slug_candidate,
    ROW_NUMBER() OVER (
      PARTITION BY lower(
        substring(
          regexp_replace(
            regexp_replace(e.canonical_name || '-' || coalesce(e.region, 'us'), '[^a-zA-Z0-9]+', '-', 'g'),
            '-+', '-', 'g'
          ),
          1, 120
        )
      )
      ORDER BY e.trust_score DESC NULLS LAST, e.created_at
    ) AS rn
  FROM hc_entity e
  WHERE 
    e.entity_type IN ('escort_operator', 'pilot_car_operator', 'pilot_driver')
    AND e.canonical_name IS NOT NULL
    AND trim(e.canonical_name) != ''
    AND length(trim(e.canonical_name)) > 3
)
INSERT INTO hc_real_operators (
  display_name, slug, entity_type, phone, email, website,
  city, state_code, country_code, source_system, source_table, source_id,
  imported_at, trust_classification, evidence_score, trust_score, is_public
)
SELECT
  canonical_name,
  -- Make slug unique by appending row number if needed
  CASE WHEN rn = 1 THEN slug_candidate ELSE slug_candidate || '-' || rn END,
  entity_type, phone, email, website, city, state_code, country_code,
  'uspilotcars_hc_entity', 'hc_entity', id::text, imported_at,
  CASE
    WHEN trust_score >= 0.5 THEN 'confirmed_real_current'
    WHEN trust_score >= 0.2 THEN 'likely_real_unverified'
    ELSE 'confirmed_real_historical'
  END,
  evidence_score, trust_score, true
FROM ranked
ON CONFLICT (slug) DO NOTHING;

SELECT count(*) AS hc_entity_inserted FROM hc_real_operators WHERE source_system = 'uspilotcars_hc_entity';
