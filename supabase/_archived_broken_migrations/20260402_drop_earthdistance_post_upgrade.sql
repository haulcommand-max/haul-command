-- ============================================================
-- POST-UPGRADE: Drop unused earthdistance/cube extensions
-- 
-- CONTEXT: The hc_core migration (20260220) created cube + earthdistance 
-- for early geo queries, but the app migrated to PostGIS (20260227).
-- Zero codebase references to ll_to_earth, earth_distance, or earth_box exist.
--
-- PREREQUISITE: Run the 6 diagnostic queries from the runbook to confirm
-- no live database objects depend on these extensions before executing.
-- Only safe AFTER pg_upgrade completes successfully.
-- ============================================================

-- Safety check: abort if any user index depends on ll_to_earth
DO $$
DECLARE
  dep_count int;
BEGIN
  SELECT count(*) INTO dep_count
  FROM pg_class idx
  JOIN pg_index i ON i.indexrelid = idx.oid
  WHERE idx.relkind = 'i'
    AND pg_get_indexdef(idx.oid) ILIKE '%ll_to_earth%';
  
  IF dep_count > 0 THEN
    RAISE EXCEPTION 'ABORT: % user index(es) still reference ll_to_earth. Drop them first.', dep_count;
  END IF;
END $$;

-- Safety check: abort if any user function depends on ll_to_earth
DO $$
DECLARE
  fn_count int;
BEGIN
  SELECT count(*) INTO fn_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND pg_get_functiondef(p.oid) ILIKE '%ll_to_earth%';

  IF fn_count > 0 THEN
    RAISE EXCEPTION 'ABORT: % user function(s) still reference ll_to_earth. Drop them first.', fn_count;
  END IF;
END $$;

-- Drop the extensions (CASCADE is safe here since we verified no deps above)
DROP EXTENSION IF EXISTS earthdistance CASCADE;
DROP EXTENSION IF EXISTS cube CASCADE;

-- Confirm PostGIS is still healthy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension is missing — geo queries will break.';
  END IF;
  RAISE NOTICE 'PostGIS OK. earthdistance/cube removed. Geo queries use PostGIS exclusively.';
END $$;
