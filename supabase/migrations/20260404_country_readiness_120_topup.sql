-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: hc_country_readiness 120-country top-up
-- Purpose: Insert rows for the 63 new Slate + Copper countries added in
--          the 120-country registry expansion. Existing rows are NOT touched.
--
-- Safe to run multiple times: ON CONFLICT (country_code) DO NOTHING
-- Run order: After the main schema migration
-- ═══════════════════════════════════════════════════════════════════════

-- ── TIER D — SLATE (25 countries added in expansion) ──
INSERT INTO public.hc_country_readiness (
  country_code, tier, market_mode, all_gates_passed,
  readiness_score, notes, created_at, updated_at
) VALUES
  ('IL', 'slate', 'dormant', false, 0, 'Slate expansion — Israel', NOW(), NOW()),
  ('NG', 'slate', 'dormant', false, 0, 'Slate expansion — Nigeria', NOW(), NOW()),
  ('EG', 'slate', 'dormant', false, 0, 'Slate expansion — Egypt', NOW(), NOW()),
  ('KE', 'slate', 'dormant', false, 0, 'Slate expansion — Kenya', NOW(), NOW()),
  ('MA', 'slate', 'dormant', false, 0, 'Slate expansion — Morocco', NOW(), NOW()),
  ('RS', 'slate', 'dormant', false, 0, 'Slate expansion — Serbia', NOW(), NOW()),
  ('UA', 'slate', 'dormant', false, 0, 'Slate expansion — Ukraine', NOW(), NOW()),
  ('KZ', 'slate', 'dormant', false, 0, 'Slate expansion — Kazakhstan', NOW(), NOW()),
  ('TW', 'slate', 'dormant', false, 0, 'Slate expansion — Taiwan', NOW(), NOW()),
  ('PK', 'slate', 'dormant', false, 0, 'Slate expansion — Pakistan', NOW(), NOW()),
  ('BD', 'slate', 'dormant', false, 0, 'Slate expansion — Bangladesh', NOW(), NOW()),
  ('MN', 'slate', 'dormant', false, 0, 'Slate expansion — Mongolia', NOW(), NOW()),
  ('TT', 'slate', 'dormant', false, 0, 'Slate expansion — Trinidad and Tobago', NOW(), NOW()),
  ('JO', 'slate', 'dormant', false, 0, 'Slate expansion — Jordan', NOW(), NOW()),
  ('GH', 'slate', 'dormant', false, 0, 'Slate expansion — Ghana', NOW(), NOW()),
  ('TZ', 'slate', 'dormant', false, 0, 'Slate expansion — Tanzania', NOW(), NOW()),
  ('GE', 'slate', 'dormant', false, 0, 'Slate expansion — Georgia', NOW(), NOW()),
  ('AZ', 'slate', 'dormant', false, 0, 'Slate expansion — Azerbaijan', NOW(), NOW()),
  ('CY', 'slate', 'dormant', false, 0, 'Slate expansion — Cyprus', NOW(), NOW()),
  ('IS', 'slate', 'dormant', false, 0, 'Slate expansion — Iceland', NOW(), NOW()),
  ('LU', 'slate', 'dormant', false, 0, 'Slate expansion — Luxembourg', NOW(), NOW()),
  ('EC', 'slate', 'dormant', false, 0, 'Slate expansion — Ecuador', NOW(), NOW())
ON CONFLICT (country_code) DO NOTHING;

-- ── TIER E — COPPER (41 countries, all new) ──
INSERT INTO public.hc_country_readiness (
  country_code, tier, market_mode, all_gates_passed,
  readiness_score, notes, created_at, updated_at
) VALUES
  ('BO', 'copper', 'dormant', false, 0, 'Copper tier — Bolivia', NOW(), NOW()),
  ('PY', 'copper', 'dormant', false, 0, 'Copper tier — Paraguay', NOW(), NOW()),
  ('GT', 'copper', 'dormant', false, 0, 'Copper tier — Guatemala', NOW(), NOW()),
  ('DO', 'copper', 'dormant', false, 0, 'Copper tier — Dominican Republic', NOW(), NOW()),
  ('HN', 'copper', 'dormant', false, 0, 'Copper tier — Honduras', NOW(), NOW()),
  ('SV', 'copper', 'dormant', false, 0, 'Copper tier — El Salvador', NOW(), NOW()),
  ('NI', 'copper', 'dormant', false, 0, 'Copper tier — Nicaragua', NOW(), NOW()),
  ('JM', 'copper', 'dormant', false, 0, 'Copper tier — Jamaica', NOW(), NOW()),
  ('GY', 'copper', 'dormant', false, 0, 'Copper tier — Guyana', NOW(), NOW()),
  ('SR', 'copper', 'dormant', false, 0, 'Copper tier — Suriname', NOW(), NOW()),
  ('BA', 'copper', 'dormant', false, 0, 'Copper tier — Bosnia and Herzegovina', NOW(), NOW()),
  ('ME', 'copper', 'dormant', false, 0, 'Copper tier — Montenegro', NOW(), NOW()),
  ('MK', 'copper', 'dormant', false, 0, 'Copper tier — North Macedonia', NOW(), NOW()),
  ('AL', 'copper', 'dormant', false, 0, 'Copper tier — Albania', NOW(), NOW()),
  ('MD', 'copper', 'dormant', false, 0, 'Copper tier — Moldova', NOW(), NOW()),
  ('IQ', 'copper', 'dormant', false, 0, 'Copper tier — Iraq', NOW(), NOW()),
  ('NA', 'copper', 'dormant', false, 0, 'Copper tier — Namibia', NOW(), NOW()),
  ('AO', 'copper', 'dormant', false, 0, 'Copper tier — Angola', NOW(), NOW()),
  ('MZ', 'copper', 'dormant', false, 0, 'Copper tier — Mozambique', NOW(), NOW()),
  ('ET', 'copper', 'dormant', false, 0, 'Copper tier — Ethiopia', NOW(), NOW()),
  ('CI', 'copper', 'dormant', false, 0, 'Copper tier — Côte d''Ivoire', NOW(), NOW()),
  ('SN', 'copper', 'dormant', false, 0, 'Copper tier — Senegal', NOW(), NOW()),
  ('BW', 'copper', 'dormant', false, 0, 'Copper tier — Botswana', NOW(), NOW()),
  ('ZM', 'copper', 'dormant', false, 0, 'Copper tier — Zambia', NOW(), NOW()),
  ('UG', 'copper', 'dormant', false, 0, 'Copper tier — Uganda', NOW(), NOW()),
  ('CM', 'copper', 'dormant', false, 0, 'Copper tier — Cameroon', NOW(), NOW()),
  ('KH', 'copper', 'dormant', false, 0, 'Copper tier — Cambodia', NOW(), NOW()),
  ('LK', 'copper', 'dormant', false, 0, 'Copper tier — Sri Lanka', NOW(), NOW()),
  ('UZ', 'copper', 'dormant', false, 0, 'Copper tier — Uzbekistan', NOW(), NOW()),
  ('LA', 'copper', 'dormant', false, 0, 'Copper tier — Laos', NOW(), NOW()),
  ('NP', 'copper', 'dormant', false, 0, 'Copper tier — Nepal', NOW(), NOW()),
  ('DZ', 'copper', 'dormant', false, 0, 'Copper tier — Algeria', NOW(), NOW()),
  ('TN', 'copper', 'dormant', false, 0, 'Copper tier — Tunisia', NOW(), NOW()),
  ('MT', 'copper', 'dormant', false, 0, 'Copper tier — Malta', NOW(), NOW()),
  ('BN', 'copper', 'dormant', false, 0, 'Copper tier — Brunei', NOW(), NOW()),
  ('RW', 'copper', 'dormant', false, 0, 'Copper tier — Rwanda', NOW(), NOW()),
  ('MG', 'copper', 'dormant', false, 0, 'Copper tier — Madagascar', NOW(), NOW()),
  ('PG', 'copper', 'dormant', false, 0, 'Copper tier — Papua New Guinea', NOW(), NOW()),
  ('TM', 'copper', 'dormant', false, 0, 'Copper tier — Turkmenistan', NOW(), NOW()),
  ('KG', 'copper', 'dormant', false, 0, 'Copper tier — Kyrgyzstan', NOW(), NOW()),
  ('MW', 'copper', 'dormant', false, 0, 'Copper tier — Malawi', NOW(), NOW())
ON CONFLICT (country_code) DO NOTHING;

-- ── Verify: count by tier after migration ──
-- SELECT tier, market_mode, COUNT(*) FROM hc_country_readiness GROUP BY tier, market_mode ORDER BY tier;
-- Expected: gold=10, blue=18, silver=26, slate=25, copper=41
