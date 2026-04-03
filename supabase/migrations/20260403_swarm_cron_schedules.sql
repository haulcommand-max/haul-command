-- Supabase cron schedule for swarm trigger pack D
-- Run via pg_cron or Supabase Dashboard → Database → Extensions → pg_cron

-- ═══════════════════════════════════════════════════════════════
-- EVERY 15 MINUTES: Process agent queue
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-orchestration-tick',
  '*/15 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"orchestration_tick"}'::jsonb
  );$$
);

-- ═══════════════════════════════════════════════════════════════
-- NIGHTLY: Market mode evaluation (2:00 AM UTC)
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-market-mode-eval',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"nightly_market_mode_eval"}'::jsonb
  );$$
);

-- ═══════════════════════════════════════════════════════════════
-- DAILY: Supply gap scan (3:00 AM UTC)
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-supply-gap-scan',
  '0 3 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"daily_supply_gap_scan"}'::jsonb
  );$$
);

-- ═══════════════════════════════════════════════════════════════
-- DAILY: Claim batch (4:00 AM UTC)
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-daily-claim-batch',
  '0 4 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"daily_claim_batch"}'::jsonb
  );$$
);

-- ═══════════════════════════════════════════════════════════════
-- WEEKLY: Trust/freshness recompute (Sundays 5:00 AM UTC)
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-weekly-trust-freshness',
  '0 5 * * 0',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"weekly_trust_freshness"}'::jsonb
  );$$
);

-- ═══════════════════════════════════════════════════════════════
-- DAILY: Revenue leak scan (1:00 AM UTC)
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-daily-leak-scan',
  '0 1 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"daily_leak_scan"}'::jsonb
  );$$
);

-- ═══════════════════════════════════════════════════════════════
-- DAILY: Scoreboard rollup (6:00 AM UTC)
-- ═══════════════════════════════════════════════════════════════
SELECT cron.schedule(
  'swarm-daily-scoreboard',
  '0 6 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/swarm-cron-executor',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'), 'Content-Type', 'application/json'),
    body := '{"job":"daily_scoreboard_rollup"}'::jsonb
  );$$
);
