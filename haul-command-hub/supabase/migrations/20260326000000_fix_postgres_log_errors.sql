-- ============================================================================
-- MIGRATION: 20260326000000_fix_postgres_log_errors
-- PURPOSE: Remediate continuous Postgres errors caused by broken cron jobs, 
-- missing views/columns, and undefined custom settings (like app.edge_base_url).
-- ============================================================================

-- 1. Disable cron jobs targeting missing materialized views & columns
-- These cause: "relation does not exist" and "column does not exist"
UPDATE cron.job 
SET active = false 
WHERE command ILIKE '%mv_hc_city_operating_scores%'
   OR command ILIKE '%mv_hc_map_pack_readiness_current%'
   OR command ILIKE '%corridors.jurisdiction%'
   OR command ILIKE '%escort_presence.profile_id%'
   OR command ILIKE '%loads.urgency%';

-- 2. Fix the materialized view concurrent refresh error
-- Error: "cannot refresh materialized view public.mv_hc_claim_funnel concurrently"
-- Action: Remove the CONCURRENTLY keyword from the cron job command so it succeeds.
UPDATE cron.job
SET command = REPLACE(command, 'CONCURRENTLY ', '')
WHERE command ILIKE '%CONCURRENTLY%mv_hc_claim_funnel%';

-- 3. Disable HTTP Webhook / Edge Function calls that fail due to missing env variables
-- These cause: null value in column "url" of relation "http_request_queue",
-- unrecognized configuration parameter "app.settings.supabase_url", and
-- invalid input syntax for type json (Token "/" is invalid) due to malformed edge function URLs.
UPDATE cron.job
SET active = false
WHERE command ILIKE '%net.http_post%'
   OR command ILIKE '%app.settings.supabase_url%'
   OR command ILIKE '%app.edge_base_url%';

-- 4. Drop the faulty trigger sending NULL urls to pg_net
-- We know from analysis that `_trg_auto_miles_compute` attempts to use `app.edge_base_url`
-- which is NULL, breaking the http_request_queue. We explicitly drop it from `loads`.
DROP TRIGGER IF EXISTS _trg_auto_miles_compute ON public.loads;
DROP FUNCTION IF EXISTS public._trg_auto_miles_compute() CASCADE;
