-- ============================================================
-- Migration: 20260410_wave2_marketplace_cron_schedules.sql
-- Purpose: Add pg_cron schedules for Wave 2 marketplace-critical
--          edge functions that are currently unscheduled.
-- Depends: pg_cron, pg_net, app_settings (EDGE_BASE_URL, SERVICE_ROLE_KEY)
-- ============================================================

-- Helper macro: all cron HTTP invocations use same pattern
-- Uses app_settings table for URL/key (same pattern as 20260220_pg_cron_schedules.sql)

-- ═══════════════════════════════════════════════════════════════
-- PRESENCE CLUSTER
-- ═══════════════════════════════════════════════════════════════

-- 1) AVAILABILITY TRUTH TICK — every 5 minutes
-- Expires stale availability, computes market liquidity, evaluates readiness gates
SELECT cron.schedule(
    'availability-truth-tick',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/availability-truth-tick',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 2) PRESENCE TIMEOUT OFFLINE — every 10 minutes
-- Sets offline for stale heartbeats, cleans expired availability windows + match offers
SELECT cron.schedule(
    'presence-timeout-offline',
    '*/10 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/presence-timeout-offline',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 3) AVAILABILITY PING — every 4 hours
-- Pushes confirmation requests to operators with stale availability
SELECT cron.schedule(
    'availability-ping',
    '0 */4 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/availability-ping',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- ═══════════════════════════════════════════════════════════════
-- RISK & PAYMENTS CLUSTER
-- ═══════════════════════════════════════════════════════════════

-- 4) PANIC FILL ESCALATION — every 5 minutes
-- 4-stage load rescue: soft nudge → supply expansion → priority rescue → last chance (Vapi voice)
SELECT cron.schedule(
    'panic-fill-escalation',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/panic-fill-escalation',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 5) DISPUTE AUTO RESOLVE — every 30 minutes
-- Tier 1 auto-resolution using GPS proof chain
SELECT cron.schedule(
    'dispute-auto-resolve',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/dispute-auto-resolve',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- ═══════════════════════════════════════════════════════════════
-- AD YIELD CLUSTER (Wave 4 pre-wire)
-- ═══════════════════════════════════════════════════════════════

-- 6) AD DECISION ENGINE — every 15 minutes
-- Quality scores, fraud detection, pacing recompute, advertiser trust
SELECT cron.schedule(
    'ad-decision-engine',
    '*/15 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/ad-decision-engine',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 7) PREMIUM AUCTION TICK — every 5 minutes
-- Real-time auction for premium placement slots
SELECT cron.schedule(
    'premium-auction-tick',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/premium-auction-tick',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 8) BILL SPONSORS DAILY — daily at 00:30 UTC
SELECT cron.schedule(
    'bill-sponsors-daily',
    '30 0 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/bill-sponsors-daily',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'mode', 'daily')
    );
    $$
);

-- ═══════════════════════════════════════════════════════════════
-- TRUST CLUSTER
-- ═══════════════════════════════════════════════════════════════

-- 9) COMPUTE TRUST SCORE (batch mode) — nightly at 03:00 UTC
-- Recomputes all operator trust scores using real aggregation queries
SELECT cron.schedule(
    'compute-trust-score-nightly',
    '0 3 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/compute-trust-score',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'mode', 'batch')
    );
    $$
);

-- 10) IDEMPOTENCY KEY PURGE — daily at 04:00 UTC
-- Cleans expired idempotency keys to keep table lean
SELECT cron.schedule(
    'purge-idempotency-keys',
    '0 4 * * *',
    $$
    SELECT public.purge_expired_idempotency_keys();
    $$
);

-- ═══════════════════════════════════════════════════════════════
-- ROUTE INTELLIGENCE CLUSTER
-- ═══════════════════════════════════════════════════════════════

-- 11) CORRIDOR STRESS REFRESH — every 30 minutes
SELECT cron.schedule(
    'corridor-stress-refresh',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/corridor-stress-refresh',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 12) MONITOR DEAD ZONES — daily at 05:00 UTC
SELECT cron.schedule(
    'monitor-dead-zones',
    '0 5 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/monitor-dead-zones',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);

-- 13) COVERAGE CELLS PRECOMPUTE — daily at 01:00 UTC
SELECT cron.schedule(
    'coverage-cells-precompute',
    '0 1 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM public.app_settings WHERE key = 'EDGE_BASE_URL') || '/functions/v1/coverage-cells-precompute',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'SERVICE_ROLE_KEY'),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron')
    );
    $$
);
