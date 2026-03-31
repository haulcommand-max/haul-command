-- Backfill from operators + operator_phones (OSOW Haven)
WITH ranked AS (
  SELECT
    o.id, o.company_name, o.email, o.state, o.country_code, o.created_at,
    p.phone,
    lower(
      substring(
        regexp_replace(
          regexp_replace(o.company_name || '-' || coalesce(o.state, 'us'), '[^a-zA-Z0-9]+', '-', 'g'),
          '-+', '-', 'g'
        ),
        1, 120
      )
    ) AS slug_candidate,
    ROW_NUMBER() OVER (
      PARTITION BY lower(
        substring(
          regexp_replace(
            regexp_replace(o.company_name || '-' || coalesce(o.state, 'us'), '[^a-zA-Z0-9]+', '-', 'g'),
            '-+', '-', 'g'
          ),
          1, 120
        )
      )
      ORDER BY o.created_at
    ) AS rn
  FROM operators o
  JOIN operator_phones p ON p.operator_id = o.id AND p.is_primary = true
  WHERE o.company_name IS NOT NULL AND trim(o.company_name) != ''
)
INSERT INTO hc_real_operators (
  display_name, slug, entity_type, phone, phone_e164, email,
  state_code, country_code, source_system, source_table, source_id,
  imported_at, trust_classification, is_public
)
SELECT
  company_name,
  CASE WHEN rn = 1 THEN slug_candidate ELSE slug_candidate || '-' || rn END,
  'pilot_car_operator',
  phone, phone,
  email,
  state::char(2),
  coalesce(nullif(trim(country_code), ''), 'US'),
  'osow_haven', 'operators', id::text, created_at,
  'likely_real_unverified', true
FROM ranked
ON CONFLICT (slug) DO NOTHING;

SELECT count(*) AS osow_inserted FROM hc_real_operators WHERE source_system = 'osow_haven';
