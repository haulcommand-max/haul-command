-- ============================================================================
-- normalize_region_codes.sql
-- Purpose: Normalize US truck_stop full state names to 2-letter codes
-- Scope: 288 rows in directory_listings where entity_type = 'truck_stop'
--         AND country_code = 'US' AND region_code is a full state name
-- Safety: Only updates truck_stop rows. Does not touch ports or other entities.
--         International port regions (Lagos, KwaZulu-Natal, etc.) are correct
--         for their respective countries and are NOT modified.
-- Rollback: See rollback section at bottom
-- Applied: Pending approval
-- ============================================================================

BEGIN;

-- Pre-check: verify exact counts
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM directory_listings
  WHERE entity_type = 'truck_stop'
    AND country_code = 'US'
    AND LENGTH(region_code) > 2;
  
  RAISE NOTICE 'Rows to normalize: %', v_count;
  
  IF v_count > 500 THEN
    RAISE EXCEPTION 'Safety: found % rows, expected ~288. Aborting.', v_count;
  END IF;
END $$;

-- Normalize full state names → 2-letter ISO codes
UPDATE directory_listings
SET region_code = CASE UPPER(TRIM(region_code))
    WHEN 'ALABAMA' THEN 'AL'
    WHEN 'ALASKA' THEN 'AK'
    WHEN 'ARIZONA' THEN 'AZ'
    WHEN 'ARKANSAS' THEN 'AR'
    WHEN 'CALIFORNIA' THEN 'CA'
    WHEN 'COLORADO' THEN 'CO'
    WHEN 'CONNECTICUT' THEN 'CT'
    WHEN 'DELAWARE' THEN 'DE'
    WHEN 'FLORIDA' THEN 'FL'
    WHEN 'GEORGIA' THEN 'GA'
    WHEN 'HAWAII' THEN 'HI'
    WHEN 'IDAHO' THEN 'ID'
    WHEN 'ILLINOIS' THEN 'IL'
    WHEN 'INDIANA' THEN 'IN'
    WHEN 'IOWA' THEN 'IA'
    WHEN 'KANSAS' THEN 'KS'
    WHEN 'KENTUCKY' THEN 'KY'
    WHEN 'LOUISIANA' THEN 'LA'
    WHEN 'MAINE' THEN 'ME'
    WHEN 'MARYLAND' THEN 'MD'
    WHEN 'MASSACHUSETTS' THEN 'MA'
    WHEN 'MICHIGAN' THEN 'MI'
    WHEN 'MINNESOTA' THEN 'MN'
    WHEN 'MISSISSIPPI' THEN 'MS'
    WHEN 'MISSOURI' THEN 'MO'
    WHEN 'MONTANA' THEN 'MT'
    WHEN 'NEBRASKA' THEN 'NE'
    WHEN 'NEVADA' THEN 'NV'
    WHEN 'NEW HAMPSHIRE' THEN 'NH'
    WHEN 'NEW JERSEY' THEN 'NJ'
    WHEN 'NEW MEXICO' THEN 'NM'
    WHEN 'NEW YORK' THEN 'NY'
    WHEN 'NORTH CAROLINA' THEN 'NC'
    WHEN 'NORTH DAKOTA' THEN 'ND'
    WHEN 'OHIO' THEN 'OH'
    WHEN 'OKLAHOMA' THEN 'OK'
    WHEN 'OREGON' THEN 'OR'
    WHEN 'PENNSYLVANIA' THEN 'PA'
    WHEN 'RHODE ISLAND' THEN 'RI'
    WHEN 'SOUTH CAROLINA' THEN 'SC'
    WHEN 'SOUTH DAKOTA' THEN 'SD'
    WHEN 'TENNESSEE' THEN 'TN'
    WHEN 'TEXAS' THEN 'TX'
    WHEN 'UTAH' THEN 'UT'
    WHEN 'VERMONT' THEN 'VT'
    WHEN 'VIRGINIA' THEN 'VA'
    WHEN 'WASHINGTON' THEN 'WA'
    WHEN 'WEST VIRGINIA' THEN 'WV'
    WHEN 'WISCONSIN' THEN 'WI'
    WHEN 'WYOMING' THEN 'WY'
    -- DC
    WHEN 'DISTRICT OF COLUMBIA' THEN 'DC'
    -- Fallback: leave unchanged if somehow unmatched
    ELSE region_code
END,
updated_at = NOW()
WHERE entity_type = 'truck_stop'
  AND country_code = 'US'
  AND LENGTH(region_code) > 2;

-- Post-check: verify no full-name regions remain for US truck stops
DO $$
DECLARE
  v_remaining INT;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM directory_listings
  WHERE entity_type = 'truck_stop'
    AND country_code = 'US'
    AND LENGTH(region_code) > 2;
  
  IF v_remaining > 0 THEN
    RAISE WARNING 'Still % rows with long region codes after normalization', v_remaining;
  ELSE
    RAISE NOTICE 'SUCCESS: All US truck_stop region codes normalized to 2-letter codes';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (if needed):
-- UPDATE directory_listings
-- SET region_code = CASE region_code
--     WHEN 'AL' THEN 'ALABAMA'  WHEN 'AK' THEN 'ALASKA'
--     WHEN 'AZ' THEN 'ARIZONA'  WHEN 'AR' THEN 'ARKANSAS'
--     WHEN 'CT' THEN 'CONNECTICUT'  WHEN 'DE' THEN 'DELAWARE'
--     WHEN 'MA' THEN 'MASSACHUSETTS'
--     ELSE region_code
-- END
-- WHERE entity_type = 'truck_stop'
--   AND country_code = 'US'
--   AND updated_at > '2026-03-13T13:00:00Z';
-- ============================================================================
