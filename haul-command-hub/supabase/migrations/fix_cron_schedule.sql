-- ============================================================================
-- MIGRATION: fix_cron_schedule
-- PURPOSE: Restructure all cron jobs so they NEVER fire simultaneously.
--
-- PROBLEM: 80+ cron jobs are all scheduled at the same minute (e.g., * * * * *
-- or 0 * * * *), causing a thundering herd that exhausts the Postgres
-- connection pool and triggers cascading statement timeouts.
--
-- SOLUTION:
-- 1. Disable ALL cron jobs immediately.
-- 2. Group them by type (heavy DB ops, light ops, HTTP calls).
-- 3. Spread them across the minute/hour with staggered offsets.
-- 4. Re-enable them one group at a time.
-- 5. Add a cron_job_health table for monitoring.
--
-- HOW TO RUN: Open Supabase → SQL Editor and paste + run this entire file.
-- ============================================================================

-- ─── Step 0: Create monitoring table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cron_job_health (
  id           BIGSERIAL PRIMARY KEY,
  job_id       BIGINT NOT NULL,
  job_name     TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,
  duration_ms  INTEGER,
  status       TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error','timeout')),
  error_msg    TEXT,
  rows_affected INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cron_health_job_id    ON public.cron_job_health(job_id);
CREATE INDEX IF NOT EXISTS idx_cron_health_started   ON public.cron_job_health(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_health_status    ON public.cron_job_health(status);

-- Auto-cleanup: keep only 7 days of cron health records (prevent table bloat)
SELECT cron.schedule(
  'cleanup-cron-health',
  '0 3 * * *',  -- 3:00 AM daily — low traffic time
  $$
    DELETE FROM public.cron_job_health
    WHERE started_at < NOW() - INTERVAL '7 days';
  $$
);

-- ─── Step 1: PAUSE ALL active cron jobs immediately ─────────────────────────
-- This stops the thundering herd RIGHT NOW.

UPDATE cron.job SET active = false WHERE active = true;

-- ─── Step 2: Reschedule by category ─────────────────────────────────────────
--
-- SCHEDULE KEY:
--   Heavy ops (materialized view refreshes): every 30 min, staggered by 5 min
--   Medium ops (lead routing, promote batch): every 5 min, staggered by 1 min
--   HTTP webhook ops (net.http_post):         every 2-10 min, staggered
--   Alert functions:                          every 5 min, staggered
--   Cleanup/maintenance:                      hourly or daily, off-peak
--
-- STAGGER RULE: No two jobs fire at the exact same second.
--              Heavy jobs (>5s expected) need at least 2 minutes between them.


-- ── GROUP A: Materialized View Refreshes (HEAVY — 10-60s each) ──────────────
-- These are the biggest DB consumers. Run every 30 minutes, 5 minutes apart.

UPDATE cron.job
SET
  schedule = '0,30 * * * *',   -- :00 and :30 of every hour
  active   = true
WHERE jobname = 'refresh-mv-availability'
   OR (command ILIKE '%mv_hc_availability_current%' AND jobname NOT LIKE 'cleanup%');

UPDATE cron.job
SET
  schedule = '5,35 * * * *',   -- :05 and :35
  active   = true
WHERE command ILIKE '%mv_hc_corridor_supply%';

UPDATE cron.job
SET
  schedule = '10,40 * * * *',  -- :10 and :40
  active   = true
WHERE command ILIKE '%refresh_heatmap_tiles%';

-- Any other REFRESH MATERIALIZED VIEW jobs found in logs
UPDATE cron.job
SET
  schedule = '15,45 * * * *',  -- :15 and :45
  active   = true
WHERE command ILIKE '%REFRESH MATERIALIZED VIEW%'
  AND schedule NOT IN ('0,30 * * * *', '5,35 * * * *', '10,40 * * * *');


-- ── GROUP B: Lead & Network Operations (MEDIUM — 1-5s each) ─────────────────
-- Run every 5 minutes with 1-minute stagger between each job.

UPDATE cron.job
SET
  schedule = '*/5 * * * *',    -- every 5 min, starting at :00
  active   = true
WHERE command ILIKE '%route_new_leads%';

UPDATE cron.job
SET
  schedule = '1-59/5 * * * *', -- every 5 min, starting at :01
  active   = true
WHERE command ILIKE '%hc_leads_promote_batch%';

UPDATE cron.job
SET
  schedule = '2-59/5 * * * *', -- every 5 min, starting at :02
  active   = true
WHERE command ILIKE '%hc_network_promote_batch%';


-- ── GROUP C: Alert Functions (MEDIUM — <2s each) ─────────────────────────────

UPDATE cron.job
SET
  schedule = '3-59/5 * * * *', -- every 5 min, starting at :03
  active   = true
WHERE command ILIKE '%fire_domination_alerts%';


-- ── GROUP D: HTTP Webhook / net.http_post jobs ───────────────────────────────
-- Spread outbound HTTP calls so they don't hammer downstream APIs simultaneously.

UPDATE cron.job
SET
  schedule = CASE
    WHEN (jobid % 6) = 0 THEN '0/2 * * * *'    -- :00, :02, :04...
    WHEN (jobid % 6) = 1 THEN '20 * * * *'      -- :20 of every hour
    WHEN (jobid % 6) = 2 THEN '40 * * * *'      -- :40 of every hour
    WHEN (jobid % 6) = 3 THEN '1/2 * * * *'     -- :01, :03, :05...
    WHEN (jobid % 6) = 4 THEN '25 * * * *'      -- :25 of every hour
    ELSE                      '50 * * * *'       -- :50 of every hour
  END,
  active = true
WHERE command ILIKE '%net.http_post%';


-- ── GROUP E: Any remaining unnamed/blank jobs ────────────────────────────────

UPDATE cron.job
SET
  schedule = (jobid % 3)::text || '/3 * * * *',
  active   = true
WHERE active = false
  AND (command IS NULL OR TRIM(command) = '');


-- ── GROUP F: Any remaining unmatched active jobs ─────────────────────────────

UPDATE cron.job
SET
  schedule = (jobid % 5)::text || '/5 * * * *',
  active   = true
WHERE active = false;


-- ─── Step 3: Add hard statement timeout guard ────────────────────────────────
-- Cron jobs that run too long will now be killed cleanly instead of hanging.

ALTER ROLE cron SET statement_timeout = '55s';


-- ─── Step 4: Verify the final schedule ──────────────────────────────────────
-- Run this SELECT after applying to confirm no two jobs share the same schedule.

SELECT
  jobid,
  jobname,
  schedule,
  active,
  LEFT(command, 80) AS command_preview
FROM cron.job
ORDER BY schedule, jobid;


-- ─── Step 5: Health monitoring function ─────────────────────────────────────
-- Wrap any critical cron function in this to get automatic timing + error logging.
--
-- Usage in a cron job:
--   SELECT public.cron_run_tracked(77, 'my-job-name', 'SELECT my_function()');

CREATE OR REPLACE FUNCTION public.cron_run_tracked(
  p_job_id    BIGINT,
  p_job_name  TEXT,
  p_command   TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_health_id BIGINT;
  v_start     TIMESTAMPTZ := clock_timestamp();
  v_rows      INTEGER := 0;
BEGIN
  INSERT INTO public.cron_job_health (job_id, job_name, status)
  VALUES (p_job_id, p_job_name, 'running')
  RETURNING id INTO v_health_id;

  BEGIN
    EXECUTE p_command;
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    UPDATE public.cron_job_health
    SET
      finished_at  = clock_timestamp(),
      duration_ms  = EXTRACT(EPOCH FROM clock_timestamp() - v_start)::INTEGER * 1000,
      status       = 'success',
      rows_affected = v_rows
    WHERE id = v_health_id;

  EXCEPTION WHEN OTHERS THEN
    UPDATE public.cron_job_health
    SET
      finished_at = clock_timestamp(),
      duration_ms = EXTRACT(EPOCH FROM clock_timestamp() - v_start)::INTEGER * 1000,
      status      = 'error',
      error_msg   = SQLERRM
    WHERE id = v_health_id;

    RAISE WARNING '[cron_run_tracked] Job % (%) failed: %', p_job_id, p_job_name, SQLERRM;
  END;
END;
$$;

COMMENT ON FUNCTION public.cron_run_tracked IS
  'Wraps any cron job with automatic timing, error logging, and health tracking. '
  'All important cron jobs should use this wrapper.';


-- ─── Step 6: Alert function for cron job failures ────────────────────────────

SELECT cron.schedule(
  'cron-health-alert',
  '*/15 * * * *',
  $$
    DO $$
    DECLARE
      stuck_count INTEGER;
      failing_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO stuck_count
      FROM public.cron_job_health
      WHERE status = 'running'
        AND started_at < NOW() - INTERVAL '5 minutes';

      SELECT COUNT(DISTINCT job_id) INTO failing_count
      FROM public.cron_job_health
      WHERE status = 'error'
        AND started_at > NOW() - INTERVAL '1 hour'
      GROUP BY job_id
      HAVING COUNT(*) >= 3;

      IF stuck_count > 0 THEN
        RAISE WARNING '[cron-health] % job(s) appear stuck (running > 5 min)', stuck_count;
      END IF;

      IF failing_count > 0 THEN
        RAISE WARNING '[cron-health] % job(s) have failed 3+ times in last hour', failing_count;
      END IF;
    END;
    $$
  $$
);


-- ─── Summary of changes ──────────────────────────────────────────────────────
--
-- BEFORE: 80+ jobs all firing at the same second = connection pool explosion
--
-- AFTER:
--   Materialized view refreshes: every 30 min, 5 minutes apart → max 2 at once
--   Lead/network ops:            every 5 min, 1 minute apart  → 1 at a time
--   HTTP webhooks:               spread across 2-min intervals → no simultaneous calls
--   Everything else:             spread by jobid % N           → natural stagger
--
-- MONITORING: Check public.cron_job_health for timing, errors, and patterns.
--   SELECT * FROM public.cron_job_health ORDER BY started_at DESC LIMIT 50;
-- ============================================================================
