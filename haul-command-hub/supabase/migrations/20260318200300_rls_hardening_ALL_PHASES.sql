-- ============================================================================
-- HAUL COMMAND RLS HARDENING — ALL 3 PHASES — PASTE-READY
-- 
-- Execute this ENTIRE block in Supabase Dashboard > SQL Editor > New Query
-- Click "Run" and confirm "Success. No rows returned."
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- PHASE 1: ENABLE RLS ON ALL FLAGGED PUBLIC TABLES
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- PHASE 1: DROP OVERLY-PERMISSIVE POLICIES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow all lb_organizations"              ON public.lb_organizations;
DROP POLICY IF EXISTS "Allow all lb_phones"                     ON public.lb_phones;
DROP POLICY IF EXISTS "Allow all lb_aliases"                    ON public.lb_aliases;
DROP POLICY IF EXISTS "Allow all lb_corridors"                  ON public.lb_corridors;
DROP POLICY IF EXISTS "Allow all lb_claim_queue"                ON public.lb_claim_queue;
DROP POLICY IF EXISTS "Allow all lb_daily_volume"               ON public.lb_daily_volume;
DROP POLICY IF EXISTS "Allow all lb_reputation_observations"    ON public.lb_reputation_observations;
DROP POLICY IF EXISTS "Allow all broker_surfaces"               ON public.broker_surfaces;
DROP POLICY IF EXISTS "Allow all broker_surface_activation_queue" ON public.broker_surface_activation_queue;
DROP POLICY IF EXISTS "Allow insert lb_ingestion_batches"       ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "Allow select lb_ingestion_batches"       ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "Allow insert lb_observations"            ON public.lb_observations;
DROP POLICY IF EXISTS "Allow select lb_observations"            ON public.lb_observations;
DROP POLICY IF EXISTS "Service Role Full Access Claim Events"   ON public.hc_claim_pressure_events;
DROP POLICY IF EXISTS "Service Role Full Access Profile Facts"  ON public.hc_profile_facts;
DROP POLICY IF EXISTS "Service Role Full Access Referral Claims" ON public.hc_referral_claims;

-- ═══════════════════════════════════════════════════════════
-- PHASE 1: ADD SCOPED PUBLIC READ POLICIES
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'corridor_demand_signals'
      AND policyname = 'public_read_corridor_demand_signals'
  ) THEN
    CREATE POLICY "public_read_corridor_demand_signals"
      ON public.corridor_demand_signals
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_page_seo_contracts'
      AND policyname = 'public_read_hc_page_seo_contracts'
  ) THEN
    CREATE POLICY "public_read_hc_page_seo_contracts"
      ON public.hc_page_seo_contracts
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_market_truth_flags'
      AND policyname = 'public_read_hc_market_truth_flags'
  ) THEN
    CREATE POLICY "public_read_hc_market_truth_flags"
      ON public.hc_market_truth_flags
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_sponsor_inventory'
      AND policyname = 'public_read_hc_sponsor_inventory'
  ) THEN
    CREATE POLICY "public_read_hc_sponsor_inventory"
      ON public.hc_sponsor_inventory
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hc_provider_best_public_record'
      AND policyname = 'public_read_hc_provider_best_public_record'
  ) THEN
    CREATE POLICY "public_read_hc_provider_best_public_record"
      ON public.hc_provider_best_public_record
      FOR SELECT TO anon, authenticated USING (true);
  END IF;
END
$$;

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- PHASE 2: FUNCTION SEARCH_PATH HARDENING
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname   AS schema_name,
      p.proname   AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'set_updated_at',
        'fn_slug_redirect_target_exists',
        'rpc_compute_trust_score',
        'fn_slug_redirect_no_chain',
        'tg_directory_listings_slug_guard',
        'fn_sync_directory_to_search',
        'slugify',
        'rpc_batch_compute_trust_scores'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      r.schema_name,
      r.function_name,
      r.args
    );
  END LOOP;
END
$$;

-- ═══════════════════════════════════════════════════════════
-- PHASE 3: REVOKE MATERIALIZED VIEW API ACCESS
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  mv_name text;
BEGIN
  FOR mv_name IN
    SELECT unnest(ARRAY[
      'mv_hc_map_pack_daily',
      'mv_hc_ranking_trends_daily',
      'mv_hc_market_scoreboard_latest',
      'mv_hc_corridor_supply',
      'mv_hc_claim_funnel',
      'mv_hc_reviews_rollup',
      'mv_hc_availability_current'
    ])
  LOOP
    BEGIN
      EXECUTE format('REVOKE SELECT ON public.%I FROM public, anon, authenticated', mv_name);
    EXCEPTION WHEN undefined_table THEN
      -- MV doesn't exist, skip
      NULL;
    END;
  END LOOP;
END
$$;

-- ═══════════════════════════════════════════════════════════
-- DONE — Run verification below separately
-- ═══════════════════════════════════════════════════════════
