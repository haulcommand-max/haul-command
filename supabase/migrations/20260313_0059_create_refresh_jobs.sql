-- 20260313_0059_create_refresh_jobs.sql
-- 7 pg_cron scheduled jobs for materialized view refresh.
-- All use REFRESH MATERIALIZED VIEW CONCURRENTLY (requires UNIQUE index — present on each MV).
--
-- Schedule strategy:
--   - Availability: every 15 min (highest frequency — real-time signal)
--   - Reviews/Claims/MapPack/Cities: hourly (staggered at :00, :05, :15, :20)
--   - Scoreboards/PageElig: daily at 02:15 / 02:45 (low-frequency, heavy queries)

-- Wrap in DO block for idempotency (skip if already scheduled)

DO $$
BEGIN
  -- 1. Availability current — every 15 minutes
  PERFORM cron.schedule(
    'refresh_mv_avail_current',
    '*/15 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_availability_current'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 2. Reviews rollup — top of every hour
  PERFORM cron.schedule(
    'refresh_mv_reviews_rollup',
    '0 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_reviews_rollup'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 3. Map-pack readiness — :15 every hour
  PERFORM cron.schedule(
    'refresh_mv_mappack_current',
    '15 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_map_pack_readiness_current'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 4. Claim funnel — :20 every hour
  PERFORM cron.schedule(
    'refresh_mv_claim_funnel',
    '20 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_claim_funnel'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 5. City operating scores — :05 every hour
  PERFORM cron.schedule(
    'refresh_mv_city_ops',
    '5 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_city_operating_scores'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 6. Market scoreboards — daily at 02:15 UTC
  PERFORM cron.schedule(
    'refresh_mv_scoreboards',
    '15 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_market_scoreboards_current'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- 7. Programmatic page eligibility — daily at 02:45 UTC
  PERFORM cron.schedule(
    'refresh_mv_page_elig',
    '45 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hc_programmatic_page_eligibility'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
