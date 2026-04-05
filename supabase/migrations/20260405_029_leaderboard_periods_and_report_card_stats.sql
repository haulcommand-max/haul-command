-- ═══════════════════════════════════════════════════════════════
-- Haul Command — Master Pending SQL Block
-- Run this entire block in Supabase SQL Editor (one paste, one Run)
-- Covers:
--   [021] Claim flow fields on hc_trust_profiles
--   [029] Leaderboard period windows (30/90/180/365 days)
--   [029b] Report card period stats on hc_trust_profiles
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- BLOCK 1: Migration 021 — Claim flow fields
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS claim_pending        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_submitted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS claim_company_name   text,
  ADD COLUMN IF NOT EXISTS claim_phone          text,
  ADD COLUMN IF NOT EXISTS claim_user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hc_trust_profiles_claim_pending
  ON public.hc_trust_profiles (claim_pending, claim_submitted_at DESC)
  WHERE claim_pending = true;

CREATE INDEX IF NOT EXISTS idx_hc_trust_profiles_claim_user_id
  ON public.hc_trust_profiles (claim_user_id)
  WHERE claim_user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hc_trust_profiles'
      AND policyname = 'trust_profiles_claimer_select'
  ) THEN
    CREATE POLICY trust_profiles_claimer_select
      ON public.hc_trust_profiles
      FOR SELECT
      TO authenticated
      USING (claim_user_id = auth.uid());
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- BLOCK 2: Migration 029 — Report card period stats
-- Adds per-window aggregates directly on hc_trust_profiles
-- Windows: 30 / 90 / 180 / 365 days
-- Never fake: all NULL until real data exists
-- ─────────────────────────────────────────────────────────────────

-- Jobs completed per window
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS jobs_30d   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jobs_90d   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jobs_180d  int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jobs_365d  int DEFAULT 0;

-- Miles / km driven per window
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS km_30d     numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_90d     numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_180d    numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_365d    numeric(12,2) DEFAULT 0;

-- Earnings (cents) per window — service-role only
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS earnings_cents_30d   bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_cents_90d   bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_cents_180d  bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_cents_365d  bigint DEFAULT 0;

-- Average broker rating per window
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS avg_rating_30d   numeric(3,2),
  ADD COLUMN IF NOT EXISTS avg_rating_90d   numeric(3,2),
  ADD COLUMN IF NOT EXISTS avg_rating_180d  numeric(3,2),
  ADD COLUMN IF NOT EXISTS avg_rating_365d  numeric(3,2);

-- Review count per window
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS reviews_30d   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_90d   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_180d  int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_365d  int DEFAULT 0;

-- Response time (minutes) per window
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS avg_response_min_30d   int,
  ADD COLUMN IF NOT EXISTS avg_response_min_90d   int,
  ADD COLUMN IF NOT EXISTS avg_response_min_180d  int,
  ADD COLUMN IF NOT EXISTS avg_response_min_365d  int;

-- Timestamp of last window refresh
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS period_stats_refreshed_at timestamptz;

-- ─────────────────────────────────────────────────────────────────
-- BLOCK 3: Migration 029 — Leaderboard snapshots table
-- Materialised nightly per window so the /leaderboards page
-- can load fast without scanning all job history
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_leaderboard_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date   date NOT NULL DEFAULT CURRENT_DATE,
  window_days     int  NOT NULL CHECK (window_days IN (30, 90, 180, 365)),
  rank_position   int  NOT NULL,

  -- Identity
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id       uuid,           -- links to hc_trust_profiles.entity_id (for non-user entities)
  display_name    text NOT NULL,
  location_label  text,           -- "Dallas, TX" or "Ontario, CA"
  country_code    char(2),
  tier_label      text,           -- Vanguard / Centurion / Sentinel / Rising

  -- Period aggregates (all truth-first, NULL until real)
  jobs_completed  int    NOT NULL DEFAULT 0,
  km_total        numeric(12,2) NOT NULL DEFAULT 0,
  avg_rating      numeric(3,2),
  review_count    int    NOT NULL DEFAULT 0,
  avg_response_min int,
  hc_index_score  numeric(6,2) NOT NULL DEFAULT 0,  -- composite rank score

  -- Meta
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (snapshot_date, window_days, rank_position)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_window
  ON public.hc_leaderboard_snapshots (window_days, snapshot_date DESC, rank_position);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user
  ON public.hc_leaderboard_snapshots (user_id, snapshot_date DESC);

ALTER TABLE public.hc_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hc_leaderboard_snapshots'
      AND policyname = 'leaderboard_public_read'
  ) THEN
    CREATE POLICY leaderboard_public_read
      ON public.hc_leaderboard_snapshots FOR SELECT USING (true);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- BLOCK 4: View — latest leaderboard by window
-- Used by /api/v1/leaderboard?window=30|90|180|365
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_leaderboard_latest AS
SELECT
  ls.*,
  tp.trust_score,
  tp.identity_verified,
  tp.insurance_verified,
  tp.claimed,
  tp.badges
FROM public.hc_leaderboard_snapshots ls
LEFT JOIN public.hc_trust_profiles tp ON tp.user_id = ls.user_id
WHERE ls.snapshot_date = (
  SELECT MAX(snapshot_date)
  FROM public.hc_leaderboard_snapshots ls2
  WHERE ls2.window_days = ls.window_days
)
ORDER BY ls.window_days, ls.rank_position;

COMMENT ON VIEW public.v_leaderboard_latest IS
  'Latest leaderboard snapshot per window (30/90/180/365 days). Refreshed nightly by pg_cron.';

-- ─────────────────────────────────────────────────────────────────
-- BLOCK 5: Function to refresh period stats on trust profiles
-- Called nightly by pg_cron or on-demand by service-role API
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_refresh_trust_period_stats(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  -- Refresh from hc_outcomes (job completions) if that table exists
  -- Pattern: additive aggregation, never overwrites real data with zeroes
  UPDATE public.hc_trust_profiles tp
  SET
    jobs_30d   = COALESCE((
      SELECT count(*) FROM public.hc_outcomes o
      WHERE o.operator_user_id = p_user_id
        AND o.completed_at >= v_now - INTERVAL '30 days'
        AND o.status = 'completed'
    ), 0),
    jobs_90d   = COALESCE((
      SELECT count(*) FROM public.hc_outcomes o
      WHERE o.operator_user_id = p_user_id
        AND o.completed_at >= v_now - INTERVAL '90 days'
        AND o.status = 'completed'
    ), 0),
    jobs_180d  = COALESCE((
      SELECT count(*) FROM public.hc_outcomes o
      WHERE o.operator_user_id = p_user_id
        AND o.completed_at >= v_now - INTERVAL '180 days'
        AND o.status = 'completed'
    ), 0),
    jobs_365d  = COALESCE((
      SELECT count(*) FROM public.hc_outcomes o
      WHERE o.operator_user_id = p_user_id
        AND o.completed_at >= v_now - INTERVAL '365 days'
        AND o.status = 'completed'
    ), 0),
    period_stats_refreshed_at = v_now,
    updated_at = v_now
  WHERE tp.user_id = p_user_id;

EXCEPTION WHEN undefined_table THEN
  -- hc_outcomes doesn't exist yet — skip silently, don't error
  UPDATE public.hc_trust_profiles
  SET period_stats_refreshed_at = v_now, updated_at = v_now
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.hc_refresh_trust_period_stats IS
  'Refreshes 30/90/180/365-day job aggregates on hc_trust_profiles. Safe to call on-demand or via pg_cron nightly.';

-- ─────────────────────────────────────────────────────────────────
-- BLOCK 6: Admin claim queue view (from migration 021)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_claim_review_queue AS
SELECT
  tp.id,
  tp.entity_id,
  tp.entity_type,
  tp.claimed,
  tp.claim_pending,
  tp.claim_submitted_at,
  tp.claim_company_name,
  tp.claim_phone,
  tp.claim_user_id,
  au.email AS claimer_email
FROM public.hc_trust_profiles tp
LEFT JOIN auth.users au ON au.id = tp.claim_user_id
WHERE tp.claim_pending = true
ORDER BY tp.claim_submitted_at DESC;

COMMENT ON VIEW public.v_claim_review_queue IS
  'Admin review queue for pending operator profile claims. Service-role only.';

COMMIT;
