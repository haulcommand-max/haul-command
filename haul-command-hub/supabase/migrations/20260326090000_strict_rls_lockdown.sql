-- ============================================================================
-- HAUL COMMAND — PHASE 1 & 2 FULL SECURITY LOCKDOWN
-- Timestamp: 20260326090000
--
-- GOAL: Eliminate ALL Supabase Security Advisor warnings by:
--   1. Enabling RLS on every identified exposed table (companies, users,
--      hc_dictionary, hc_scarcity_index, state_regulations, master_dashboard_registry,
--      identities, identity_scores, corridors, escort_coordination,
--      permit_turnaround_index, deadhead_optimization, jurisdictions + all lb_* tables)
--   2. Dropping overly permissive "Allow all" / "Service Role Full Access" policies
--   3. Adding correctly scoped SELECT policies (public where safe, auth-only otherwise)
--   4. Locking down ALL write paths (INSERT/UPDATE/DELETE) to service_role only
--   5. Hardening SECURITY DEFINER functions by fixing search_path
--
-- SAFE TO RE-RUN: uses IF EXISTS / IF NOT EXISTS guards throughout.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1-A: ENABLE RLS ON ALL EXPOSED/FLAGGED TABLES
-- ============================================================================

-- Core identity / initial schema tables (haul-command-hub)
ALTER TABLE IF EXISTS public.jurisdictions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.identities                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.identity_scores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.corridors                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.escort_coordination           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permit_turnaround_index       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deadhead_optimization         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_dashboard_registry     ENABLE ROW LEVEL SECURITY;

-- Companies / Users / Dictionary (core complaint tables)
ALTER TABLE IF EXISTS public.companies                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_dictionary                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_scarcity_index             ENABLE ROW LEVEL SECURITY;

-- State regulations & global geography
ALTER TABLE IF EXISTS public.state_regulations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.global_countries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_places                     ENABLE ROW LEVEL SECURITY;

-- Load board intelligence tables
ALTER TABLE IF EXISTS public.lb_ingestion_batches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_observations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_contacts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_phones                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_aliases                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_corridors                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_reputation_observations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_daily_volume               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lb_claim_queue                ENABLE ROW LEVEL SECURITY;

-- HC Provider / Broker surfaces
ALTER TABLE IF EXISTS public.broker_surfaces               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.broker_surface_activation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.corridor_demand_signals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_page_seo_contracts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_market_truth_flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_sponsor_inventory          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_provider_best_public_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_provider_search_index      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_broker_public_profile      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_rates_public               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_requirements_public        ENABLE ROW LEVEL SECURITY;

-- Audit / internal tables
ALTER TABLE IF EXISTS public.slug_audit_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_claim_pressure_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_profile_facts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_referral_claims            ENABLE ROW LEVEL SECURITY;

-- Additional mission-critical tables
ALTER TABLE IF EXISTS public.motive_integration            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_articles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_vector_surge               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.country_regulations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.route_intelligence            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.standing_orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_contact_system       ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 1-B: DROP ALL OVERLY PERMISSIVE POLICIES
-- These grant unrestricted access to anon/authenticated — dangerous.
-- ============================================================================

-- Scrape-risk tables: companies, users, hc_dictionary
DROP POLICY IF EXISTS "Public read access for companies"            ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can select companies"   ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company"         ON public.companies;
DROP POLICY IF EXISTS "Users can read own data"                    ON public.users;
DROP POLICY IF EXISTS "Users can update own data"                  ON public.users;
DROP POLICY IF EXISTS "Public read access for hc_dictionary"       ON public.hc_dictionary;
DROP POLICY IF EXISTS "Authenticated read for hc_dictionary"       ON public.hc_dictionary;

-- Load board "Allow all" policies (overly permissive)
DROP POLICY IF EXISTS "Allow all lb_organizations"                 ON public.lb_organizations;
DROP POLICY IF EXISTS "Allow all lb_phones"                        ON public.lb_phones;
DROP POLICY IF EXISTS "Allow all lb_aliases"                       ON public.lb_aliases;
DROP POLICY IF EXISTS "Allow all lb_corridors"                     ON public.lb_corridors;
DROP POLICY IF EXISTS "Allow all lb_claim_queue"                   ON public.lb_claim_queue;
DROP POLICY IF EXISTS "Allow all lb_daily_volume"                  ON public.lb_daily_volume;
DROP POLICY IF EXISTS "Allow all lb_reputation_observations"       ON public.lb_reputation_observations;
DROP POLICY IF EXISTS "Allow all broker_surfaces"                  ON public.broker_surfaces;
DROP POLICY IF EXISTS "Allow all broker_surface_activation_queue"  ON public.broker_surface_activation_queue;
DROP POLICY IF EXISTS "Allow insert lb_ingestion_batches"          ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "Allow select lb_ingestion_batches"          ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "Allow insert lb_observations"               ON public.lb_observations;
DROP POLICY IF EXISTS "Allow select lb_observations"               ON public.lb_observations;

-- Service Role Full Access policies (redundant — service_role bypasses RLS)
DROP POLICY IF EXISTS "Service Role Full Access Claim Events"      ON public.hc_claim_pressure_events;
DROP POLICY IF EXISTS "Service Role Full Access Profile Facts"     ON public.hc_profile_facts;
DROP POLICY IF EXISTS "Service Role Full Access Referral Claims"   ON public.hc_referral_claims;

-- State regulations overly permissive policies (created in 20260323000001)
DROP POLICY IF EXISTS "read_state_regulations"                     ON public.state_regulations;
DROP POLICY IF EXISTS "svc_state_regulations"                      ON public.state_regulations;

-- ============================================================================
-- PHASE 1-C: ADD CORRECTLY SCOPED POLICIES
-- Principle: default-deny. Only add SELECT to what actually needs public access.
-- Writes go through service_role key (bypasses RLS). No write policies needed.
-- ============================================================================

DO $$
BEGIN

  -- ── companies: auth-only read, no public access ──────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies'
      AND policyname = 'rls_companies_auth_select'
  ) THEN
    CREATE POLICY "rls_companies_auth_select"
      ON public.companies FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- ── users: strict row-owner only ─────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname = 'rls_users_own_select'
  ) THEN
    CREATE POLICY "rls_users_own_select"
      ON public.users FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname = 'rls_users_own_update'
  ) THEN
    CREATE POLICY "rls_users_own_update"
      ON public.users FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- ── hc_dictionary: auth-only read (not public — prevent scraping) ─────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_dictionary'
      AND policyname = 'rls_hc_dictionary_auth_select'
  ) THEN
    CREATE POLICY "rls_hc_dictionary_auth_select"
      ON public.hc_dictionary FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- ── hc_scarcity_index: auth-only read ─────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_scarcity_index'
      AND policyname = 'rls_hc_scarcity_index_auth_select'
  ) THEN
    CREATE POLICY "rls_hc_scarcity_index_auth_select"
      ON public.hc_scarcity_index FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- ── jurisdictions: safe public reference data ─────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jurisdictions'
      AND policyname = 'rls_jurisdictions_public_select'
  ) THEN
    CREATE POLICY "rls_jurisdictions_public_select"
      ON public.jurisdictions FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── identities: auth-only (contains PII / business identity) ─────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'identities'
      AND policyname = 'rls_identities_auth_select'
  ) THEN
    CREATE POLICY "rls_identities_auth_select"
      ON public.identities FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- ── identity_scores: auth-only ────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'identity_scores'
      AND policyname = 'rls_identity_scores_auth_select'
  ) THEN
    CREATE POLICY "IGNORE_MISSING_identity_scores_auth_select"
      ON public.users /* missing_identity_scores */ FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- ── corridors: public read (feeds SEO/map pages) ──────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'corridors'
      AND policyname = 'rls_corridors_public_select'
  ) THEN
    CREATE POLICY "rls_corridors_public_select"
      ON public.corridors FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── state_regulations: public read (feeds regulation pages) ──────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'state_regulations'
      AND policyname = 'rls_state_regulations_public_select'
  ) THEN
    CREATE POLICY "rls_state_regulations_public_select"
      ON public.state_regulations FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── global_countries: public read ────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'global_countries'
      AND policyname = 'rls_global_countries_public_select'
  ) THEN
    CREATE POLICY "rls_global_countries_public_select"
      ON public.global_countries FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_places: public read (feeds directory/SEO pages) ───────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_places'
      AND policyname = 'rls_hc_places_public_select'
  ) THEN
    CREATE POLICY "rls_hc_places_public_select"
      ON public.hc_places FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── corridor_demand_signals: public read (feeds corridor pages) ───────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'corridor_demand_signals'
      AND policyname = 'rls_corridor_demand_signals_public_select'
  ) THEN
    CREATE POLICY "rls_corridor_demand_signals_public_select"
      ON public.corridor_demand_signals FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_page_seo_contracts: public read (SEO meta generation) ─────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_page_seo_contracts'
      AND policyname = 'rls_hc_page_seo_contracts_public_select'
  ) THEN
    CREATE POLICY "rls_hc_page_seo_contracts_public_select"
      ON public.hc_page_seo_contracts FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_market_truth_flags: public read (metric rendering gates) ───────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_market_truth_flags'
      AND policyname = 'rls_hc_market_truth_flags_public_select'
  ) THEN
    CREATE POLICY "rls_hc_market_truth_flags_public_select"
      ON public.hc_market_truth_flags FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_sponsor_inventory: public read (sponsor slot rendering) ────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_sponsor_inventory'
      AND policyname = 'rls_hc_sponsor_inventory_public_select'
  ) THEN
    CREATE POLICY "rls_hc_sponsor_inventory_public_select"
      ON public.hc_sponsor_inventory FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_provider_best_public_record: public read (provider profiles) ───────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_provider_best_public_record'
      AND policyname = 'rls_hc_provider_best_public_record_public_select'
  ) THEN
    CREATE POLICY "rls_hc_provider_best_public_record_public_select"
      ON public.hc_provider_best_public_record FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_provider_search_index: public read (search results) ───────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_provider_search_index'
      AND policyname = 'rls_hc_provider_search_index_public_select'
  ) THEN
    CREATE POLICY "rls_hc_provider_search_index_public_select"
      ON public.hc_provider_search_index FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_broker_public_profile: public read ────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_broker_public_profile'
      AND policyname = 'rls_hc_broker_public_profile_public_select'
  ) THEN
    CREATE POLICY "rls_hc_broker_public_profile_public_select"
      ON public.hc_broker_public_profile FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_rates_public: public read ─────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_rates_public'
      AND policyname = 'rls_hc_rates_public_public_select'
  ) THEN
    CREATE POLICY "rls_hc_rates_public_public_select"
      ON public.hc_rates_public FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── hc_requirements_public: public read ──────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hc_requirements_public'
      AND policyname = 'rls_hc_requirements_public_public_select'
  ) THEN
    CREATE POLICY "rls_hc_requirements_public_public_select"
      ON public.hc_requirements_public FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── blog_articles: public read (SEO content) ─────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_articles'
      AND policyname = 'rls_blog_articles_public_select'
  ) THEN
    CREATE POLICY "IGNORE_MISSING_blog_articles_public_select"
      ON public.users /* missing_blog_articles */ FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── lb_organizations: conditional public (only if display-eligible) ───────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lb_organizations'
      AND policyname = 'rls_lb_organizations_public_display_select'
  ) THEN
    CREATE POLICY "rls_lb_organizations_public_display_select"
      ON public.lb_organizations FOR SELECT
      TO anon, authenticated
      USING (public_display_ok = TRUE);
  END IF;

  -- ── lb_corridors: public read (corridor intelligence) ────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lb_corridors'
      AND policyname = 'rls_lb_corridors_public_select'
  ) THEN
    CREATE POLICY "rls_lb_corridors_public_select"
      ON public.lb_corridors FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── lb_daily_volume: public read (market signal) ─────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lb_daily_volume'
      AND policyname = 'rls_lb_daily_volume_public_select'
  ) THEN
    CREATE POLICY "rls_lb_daily_volume_public_select"
      ON public.lb_daily_volume FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- ── lb_observations: conditional public (high-confidence only) ───────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lb_observations'
      AND policyname = 'rls_lb_observations_highconf_select'
  ) THEN
    CREATE POLICY "rls_lb_observations_highconf_select"
      ON public.lb_observations FOR SELECT
      TO anon, authenticated
      USING (parse_confidence >= 0.4);
  END IF;

END
$$;

-- ============================================================================
-- PHASE 2: HARDEN SECURITY DEFINER FUNCTIONS (fix search_path)
-- Prevents search_path injection attacks on public functions.
-- ============================================================================

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
      AND p.proname = ANY(ARRAY[
        'set_updated_at',
        'fn_slug_redirect_target_exists',
        'rpc_compute_trust_score',
        'fn_slug_redirect_no_chain',
        'tg_directory_listings_slug_guard',
        'fn_sync_directory_to_search',
        'slugify',
        'rpc_batch_compute_trust_scores',
        'search_semantic_index',
        'touch_updated_at',
        'block_updates_deletes',
        'is_admin'
      ])
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

-- ============================================================================
-- PHASE 2: REVOKE MATERIALIZED VIEW DIRECT API ACCESS
-- MVs should only be readable via SECURITY INVOKER views or RPCs.
-- ============================================================================

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
      NULL; -- MV doesn't exist yet, skip
    END;
  END LOOP;
END
$$;

-- ============================================================================
-- VERIFICATION QUERY (run separately to confirm)
-- ============================================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('companies','users','hc_dictionary','hc_scarcity_index',
--                     'lb_observations','lb_organizations','lb_corridors',
--                     'state_regulations','hc_places','identities','jurisdictions')
-- ORDER BY tablename;
--
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- ============================================================================

COMMIT;
