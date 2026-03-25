-- ============================================================================
-- RLS Hardening Phase 1 — Enable RLS + Scoped Policies + Drop Redundant
--
-- WHAT THIS DOES:
--   1. Enables RLS on every flagged public table (idempotent).
--   2. Adds narrow SELECT policies only for tables that truly need
--      public/anon/authenticated read access.
--   3. Drops the overly-permissive "Allow all ..." / "Service Role Full
--      Access ..." policies. Service role bypasses RLS by design;
--      these policies only widen access for non-service roles.
--
-- SAFE TO RE-RUN: uses IF EXISTS / IF NOT EXISTS throughout.
-- ============================================================================

BEGIN;

-- =========================================================
-- 1) ENABLE RLS ON ALL FLAGGED PUBLIC TABLES
--    Already-enabled tables are a no-op.
-- =========================================================

ALTER TABLE IF EXISTS public.broker_surfaces               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.broker_surface_activation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.corridor_demand_signals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_page_seo_contracts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_market_truth_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_observations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_sponsor_inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_provider_best_public_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_organizations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_phones                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_aliases                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_corridors                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_reputation_observations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_daily_volume                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_contacts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_claim_queue                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.slug_audit_log                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_ingestion_batches           ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 2) DROP OVERLY-PERMISSIVE "ALLOW ALL" POLICIES
--    These grant INSERT/UPDATE/DELETE to anon+authenticated,
--    which is not the intent. Service role bypasses RLS anyway.
-- =========================================================

-- From combined_lb_migration.sql broad policies
DROP POLICY IF EXISTS "Allow all lb_organizations"
  ON public.lb_organizations;
DROP POLICY IF EXISTS "Allow all lb_phones"
  ON public.lb_phones;
DROP POLICY IF EXISTS "Allow all lb_aliases"
  ON public.lb_aliases;
DROP POLICY IF EXISTS "Allow all lb_corridors"
  ON public.lb_corridors;
DROP POLICY IF EXISTS "Allow all lb_claim_queue"
  ON public.lb_claim_queue;
DROP POLICY IF EXISTS "Allow all lb_daily_volume"
  ON public.lb_daily_volume;
DROP POLICY IF EXISTS "Allow all lb_reputation_observations"
  ON public.lb_reputation_observations;
DROP POLICY IF EXISTS "Allow all broker_surfaces"
  ON public.broker_surfaces;
DROP POLICY IF EXISTS "Allow all broker_surface_activation_queue"
  ON public.broker_surface_activation_queue;

-- Also drop the overly-broad ingestion insert/select policies
-- (we'll replace with properly scoped ones below)
DROP POLICY IF EXISTS "Allow insert lb_ingestion_batches"
  ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "Allow select lb_ingestion_batches"
  ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "Allow insert lb_observations"
  ON public.lb_observations;
DROP POLICY IF EXISTS "Allow select lb_observations"
  ON public.lb_observations;

-- Service Role Full Access policies (created outside migrations)
DROP POLICY IF EXISTS "Service Role Full Access Claim Events"
  ON public.hc_claim_pressure_events;
DROP POLICY IF EXISTS "Service Role Full Access Profile Facts"
  ON public.hc_profile_facts;
DROP POLICY IF EXISTS "Service Role Full Access Referral Claims"
  ON public.hc_referral_claims;

-- =========================================================
-- 3) ADD SCOPED SELECT POLICIES FOR PUBLIC-FACING TABLES
--    Only tables that truly feed public pages / API responses.
--    Everything else stays closed (RLS on, no policy = deny all).
-- =========================================================

-- broker_surfaces: already has a conditional policy from
-- 20260317170000_broker_surfaces.sql ("Public read broker_surfaces"
-- with USING (public_surface_eligibility = TRUE)).
-- We do NOT add a blanket USING(true) policy here — the existing
-- conditional policy is correct.

DO $$
BEGIN

  -- corridor_demand_signals: feeds public corridor pages
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'corridor_demand_signals'
      AND policyname = 'public_read_corridor_demand_signals'
  ) THEN
    CREATE POLICY "public_read_corridor_demand_signals"
      ON public.corridor_demand_signals
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- hc_page_seo_contracts: feeds SEO/meta on all public pages
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_page_seo_contracts'
      AND policyname = 'public_read_hc_page_seo_contracts'
  ) THEN
    CREATE POLICY "public_read_hc_page_seo_contracts"
      ON public.hc_page_seo_contracts
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- hc_market_truth_flags: gates metric rendering on public surfaces
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_market_truth_flags'
      AND policyname = 'public_read_hc_market_truth_flags'
  ) THEN
    CREATE POLICY "public_read_hc_market_truth_flags"
      ON public.hc_market_truth_flags
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- hc_sponsor_inventory: feeds labeled sponsor slots on public pages
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_sponsor_inventory'
      AND policyname = 'public_read_hc_sponsor_inventory'
  ) THEN
    CREATE POLICY "public_read_hc_sponsor_inventory"
      ON public.hc_sponsor_inventory
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- hc_provider_best_public_record: powers public provider profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_provider_best_public_record'
      AND policyname = 'public_read_hc_provider_best_public_record'
  ) THEN
    CREATE POLICY "public_read_hc_provider_best_public_record"
      ON public.hc_provider_best_public_record
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- lb_corridors: already has "Public read lb_corridors" from
  -- load_board_ingestion_v2.sql with USING (TRUE) — keep it.

  -- lb_daily_volume: already has "Public read lb_daily_volume" from
  -- load_board_ingestion_v2.sql with USING (TRUE) — keep it.

  -- lb_organizations: already has "Public read lb_organizations" from
  -- load_board_ingestion_v2.sql with USING (public_display_ok = TRUE)
  -- — conditional, keep it.

  -- lb_observations: already has "Public read lb_observations" from
  -- load_board_ingestion_v2.sql with USING (parse_confidence >= 0.4)
  -- — conditional, keep it.

END
$$;

-- =========================================================
-- 4) TABLES THAT STAY CLOSED (RLS enabled, no read policy)
--    These are backend-only / internal tables:
--
--    • lb_ingestion_batches         (internal ingest metadata)
--    • lb_phones                    (internal dedup)
--    • lb_aliases                   (internal dedup)
--    • lb_contacts                  (internal dedup)
--    • lb_reputation_observations   (internal-only, has USING(FALSE))
--    • lb_claim_queue               (internal-only, has USING(FALSE))
--    • broker_surface_activation_queue (internal, has USING(FALSE))
--    • slug_audit_log               (internal audit)
--
--    Service role writes work by bypassing RLS.
--    No policy = deny all for anon/authenticated → correct.
-- =========================================================

COMMIT;
