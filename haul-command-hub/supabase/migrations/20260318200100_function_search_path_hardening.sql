-- ============================================================================
-- RLS Hardening Phase 2 — Function search_path Hardening
--
-- Sets explicit search_path on all flagged public functions so behavior
-- is predictable and not dependent on the caller's role defaults.
--
-- Supabase Advisor recommendation: prevent search_path injection.
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
    RAISE NOTICE 'Hardened: %.%(%)', r.schema_name, r.function_name, r.args;
  END LOOP;
END
$$;
