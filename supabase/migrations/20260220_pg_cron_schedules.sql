-- Migration: 20260220_pg_cron_schedules.sql
-- Schedules all edge function cron jobs.
-- Requires: pg_cron extension, pg_net extension, app_settings rows for EDGE_BASE_URL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─────────────────────────────────────────────────────
-- Ensure required app_settings rows exist
-- ─────────────────────────────────────────────────────
-- These must be set before crons fire:
--   app_settings: 'EDGE_BASE_URL'   = 'https://YOUR_PROJECT.supabase.co'
--   app_settings: 'SERVICE_ROLE_KEY' = your service role key (set via Supabase dashboard)

-- ─────────────────────────────────────────────────────
-- Helper: build edge function invocation via pg_net
-- ─────────────────────────────────────────────────────

-- 1) MORNING PULSE DISPATCH — daily at 07:00 ET (12:00 UTC)
SELECT cron.schedule(
    'morning-pulse-dispatch',
    '0 12 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/morning-pulse-dispatch',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'mode', 'daily')
    );
    $$
);

-- 2) LEADERBOARD SNAPSHOT — hourly
SELECT cron.schedule(
    'leaderboard-snapshot-hourly',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/leaderboard-snapshot-hourly',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'mode', 'hourly')
    );
    $$
);

-- 3) EMAIL WORKER — every 1 minute (drains email_jobs queue)
SELECT cron.schedule(
    'email-worker',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/email-worker',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 4) SEARCH INDEXER — every 2 minutes (drains search_jobs queue)
SELECT cron.schedule(
    'search-indexer',
    '*/2 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/search-indexer',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 5) EMAIL DIGEST BUILDER — 1st of every month at 14:00 UTC
SELECT cron.schedule(
    'email-digest-builder',
    '0 14 1 * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/email-digest-builder',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'mode', 'monthly')
    );
    $$
);

-- 6) EMAIL CLAIM NUDGES — every 6 hours
SELECT cron.schedule(
    'email-claim-nudges',
    '0 */6 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/email-claim-nudges',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 7) COMPLIANCE REMINDERS — daily at 09:00 UTC
SELECT cron.schedule(
    'compliance-reminders-run',
    '0 9 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/compliance-reminders-run',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'mode', 'daily')
    );
    $$
);

-- 8) GEO AGGREGATOR — every 15 minutes
SELECT cron.schedule(
    'geo-aggregator',
    '*/15 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/geo-aggregator',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 9) SEED CLAIM SEQUENCE — every 6 hours (checks launch gate internally)
SELECT cron.schedule(
    'seed-claim-sequence',
    '0 */6 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/seed-claim-sequence',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);
