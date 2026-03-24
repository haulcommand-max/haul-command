-- ============================================================
-- STEP 2B: Simplified insert if STEP1 dynamic columns fail
-- Run ONLY if STEP1 gives column errors
-- First run: SELECT * FROM operator_listings LIMIT 1;
-- to see actual column names, then edit this accordingly
-- ============================================================

-- Option A: If operator_listings has: id, name, city, state, phone, email, claimed
INSERT INTO listings (id, created_at, full_name, city, state, phone, email, active, claimed, country_code)
SELECT
    id,
    COALESCE(created_at, now()),
    COALESCE(name, 'Escort Operator'),
    city,
    state,
    phone,
    email,
    true,
    COALESCE(claimed, false),
    'us'
FROM operator_listings
ON CONFLICT (id) DO NOTHING;

-- Option B: If operator_listings has: id, company_name, city, state_code, ...
-- Uncomment and adjust:
-- INSERT INTO listings (id, full_name, company_name, city, state, active, country_code)
-- SELECT id, COALESCE(company_name, 'Escort Operator'), company_name, city, state_code, true, 'us'
-- FROM operator_listings ON CONFLICT (id) DO NOTHING;

-- After insert, verify:
SELECT COUNT(*) FROM listings;
