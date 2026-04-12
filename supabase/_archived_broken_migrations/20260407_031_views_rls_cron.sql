-- ═══════════════════════════════════════════════════════════════
-- Haul Command — Migration 031: Views, RLS Policies, pg_cron
-- 
-- Creates:
--   1. v_leaderboard_latest — latest leaderboard snapshot per window
--   2. v_claim_review_queue — admin claim review queue
--   3. RLS policy: leaderboard public read
--   4. RLS policy: saved searches owner-only
--   5. pg_cron job: nightly period stats refresh
-- ═══════════════════════════════════════════════════════════════

-- ── 1. v_leaderboard_latest view ─────────────────────────────

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
  SELECT MAX(ls2.snapshot_date)
  FROM public.hc_leaderboard_snapshots ls2
  WHERE ls2.window_days = ls.window_days
)
ORDER BY ls.window_days, ls.rank_position;

COMMENT ON VIEW public.v_leaderboard_latest IS
  'Latest leaderboard snapshot per window period (30/90/180/365d). Joined with trust profile for badge/verification display.';


-- ── 2. v_claim_review_queue view ─────────────────────────────

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
  'Admin view: pending claim applications. Join with auth.users for claimer email.';


-- ── 3. RLS: leaderboard public read ─────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hc_leaderboard_snapshots'
      AND policyname = 'leaderboard_public_read'
  ) THEN
    CREATE POLICY leaderboard_public_read
      ON public.hc_leaderboard_snapshots
      FOR SELECT
      USING (true);
  END IF;
END; $$;


-- ── 4. RLS: saved searches owner-only ────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hc_saved_searches'
      AND policyname = 'saved_searches_owner'
  ) THEN
    CREATE POLICY saved_searches_owner
      ON public.hc_saved_searches
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END; $$;


-- ── 5. Period stats refresh function ─────────────────────────
-- (safe re-create; handles missing hc_outcomes table gracefully)

CREATE OR REPLACE FUNCTION public.hc_refresh_trust_period_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  UPDATE public.hc_trust_profiles tp SET
    jobs_30d  = COALESCE((SELECT count(*) FROM public.hc_outcomes o WHERE o.operator_user_id = p_user_id AND o.completed_at >= v_now - INTERVAL '30 days' AND o.status = 'completed'), 0),
    jobs_90d  = COALESCE((SELECT count(*) FROM public.hc_outcomes o WHERE o.operator_user_id = p_user_id AND o.completed_at >= v_now - INTERVAL '90 days' AND o.status = 'completed'), 0),
    jobs_180d = COALESCE((SELECT count(*) FROM public.hc_outcomes o WHERE o.operator_user_id = p_user_id AND o.completed_at >= v_now - INTERVAL '180 days' AND o.status = 'completed'), 0),
    jobs_365d = COALESCE((SELECT count(*) FROM public.hc_outcomes o WHERE o.operator_user_id = p_user_id AND o.completed_at >= v_now - INTERVAL '365 days' AND o.status = 'completed'), 0),
    period_stats_refreshed_at = v_now,
    updated_at = v_now
  WHERE tp.user_id = p_user_id;
EXCEPTION WHEN undefined_table THEN
  -- hc_outcomes doesn't exist yet — just stamp the refresh time
  UPDATE public.hc_trust_profiles SET
    period_stats_refreshed_at = v_now,
    updated_at = v_now
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.hc_refresh_trust_period_stats IS
  'Refreshes period stats (30/90/180/365d) for one user. Called by pg_cron nightly batch.';


-- ── 6. Nightly pg_cron job ───────────────────────────────────
-- Runs at 04:00 UTC daily, refreshes all users with trust profiles

-- NOTE: pg_cron must be enabled in Supabase Dashboard > Database > Extensions
-- If pg_cron is not enabled, this block will fail silently

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('hc_nightly_period_stats_refresh');
    PERFORM cron.schedule(
      'hc_nightly_period_stats_refresh',
      '0 4 * * *',
      $$
        DO $inner$
        DECLARE r RECORD;
        BEGIN
          FOR r IN
            SELECT user_id FROM public.hc_trust_profiles
            WHERE user_id IS NOT NULL
            LIMIT 5000
          LOOP
            PERFORM public.hc_refresh_trust_period_stats(r.user_id);
          END LOOP;
        END;
        $inner$
      $$
    );
    RAISE NOTICE 'pg_cron job hc_nightly_period_stats_refresh scheduled at 04:00 UTC daily';
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled. Enable it in Supabase Dashboard > Database > Extensions, then re-run this migration.';
  END IF;
END; $$;
