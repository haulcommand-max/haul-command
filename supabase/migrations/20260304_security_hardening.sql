-- ===========================
-- HAUL COMMAND: Security Hardening Migration
-- Fixes: RLS-disabled tables, SECURITY DEFINER views, mutable search_path,
--        extensions in public, overly permissive RLS policies
-- ===========================

-- ═══ PART 1: RLS on exposed tables + SECURITY INVOKER views ═══

-- 1a) hc_reputation_rollups — policies exist but RLS wasn't enabled
ALTER TABLE public.hc_reputation_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_reputation_rollups FORCE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.hc_reputation_rollups TO anon, authenticated;

-- 1b) hc_tier_caps — public table, RLS disabled
ALTER TABLE public.hc_tier_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_tier_caps FORCE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.hc_tier_caps TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='hc_tier_caps'
      AND policyname='hc_tier_caps_read'
  ) THEN
    CREATE POLICY hc_tier_caps_read
    ON public.hc_tier_caps
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- 1c) Views: convert to security_invoker (Postgres 15+)
ALTER VIEW public.hc_loads_v                    SET (security_invoker = true);
ALTER VIEW public.hc_public_page_directory      SET (security_invoker = true);
ALTER VIEW public.v_operators                   SET (security_invoker = true);
ALTER VIEW public.hc_admin_moderation_actions_v SET (security_invoker = true);
ALTER VIEW public.v_loads                       SET (security_invoker = true);


-- ═══ PART 2: Fix mutable search_path on all functions ═══

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public','hc','canon','ingest')
      AND p.prokind = 'f'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, %I;',
      r.schema_name, r.func_name, r.args, r.schema_name
    );
  END LOOP;
END $$;


-- ═══ PART 3: Move extensions out of public ═══

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'ltree') THEN
    EXECUTE 'ALTER EXTENSION ltree SET SCHEMA extensions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    EXECUTE 'ALTER EXTENSION pg_net SET SCHEMA extensions';
  END IF;
END $$;


-- ═══ PART 4: Lock down media/provenance tables — service_role only ═══

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY[
    'public.hc_media_job',
    'public.hc_media_metrics_daily',
    'public.hc_media_publish',
    'public.hc_media_render',
    'public.hc_media_research_digest',
    'public.hc_media_script',
    'public.hc_media_series',
    'public.hc_media_topic',
    'public.hc_provenance_log'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %s FORCE  ROW LEVEL SECURITY;', t);
    EXECUTE format('REVOKE ALL ON TABLE %s FROM anon;', t);
    EXECUTE format('REVOKE ALL ON TABLE %s FROM authenticated;', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %s TO service_role;', t);

    IF t = 'public.hc_media_job' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_job_auth_all ON public.hc_media_job;';
    ELSIF t = 'public.hc_media_metrics_daily' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_metrics_auth_all ON public.hc_media_metrics_daily;';
    ELSIF t = 'public.hc_media_publish' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_publish_auth_all ON public.hc_media_publish;';
    ELSIF t = 'public.hc_media_render' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_render_auth_all ON public.hc_media_render;';
    ELSIF t = 'public.hc_media_research_digest' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_research_digest_auth_all ON public.hc_media_research_digest;';
    ELSIF t = 'public.hc_media_script' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_script_auth_all ON public.hc_media_script;';
    ELSIF t = 'public.hc_media_series' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_series_auth_all ON public.hc_media_series;';
    ELSIF t = 'public.hc_media_topic' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_media_topic_auth_all ON public.hc_media_topic;';
    ELSIF t = 'public.hc_provenance_log' THEN
      EXECUTE 'DROP POLICY IF EXISTS hc_provenance_auth_all ON public.hc_provenance_log;';
    END IF;
  END LOOP;
END $$;


-- ═══ PART 5: Explicit service_role-only on internal tables ═══

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY[
    'hc.ad_campaigns',
    'hc.audit_events',
    'hc.leads',
    'hc.surface_spawn_runs',
    'hc.verifications',
    'public.hc_capacity_auction_bids',
    'public.hc_deadhead_opportunities',
    'public.hc_dedupe_candidates',
    'public.hc_entities_norm',
    'public.hc_entities_raw',
    'public.hc_geo_aliases',
    'public.hc_identity_channels',
    'public.hc_listmonk_outbox',
    'public.hc_merge_audit_log',
    'public.hc_page_render_cache',
    'public.hc_publish_queue',
    'public.hc_referral_edges',
    'public.hc_schema_cache'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('REVOKE ALL ON TABLE %s FROM anon;', t);
    EXECUTE format('REVOKE ALL ON TABLE %s FROM authenticated;', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %s TO service_role;', t);
  END LOOP;
END $$;
