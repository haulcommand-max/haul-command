-- ============================================================
-- P0 PHASE 3: Convert views to security_invoker
-- + Revoke API access on materialized views
-- Applied: 2026-03-07
-- ============================================================

-- Convert all flagged views to security_invoker
ALTER VIEW IF EXISTS public.v_market_pulse_live SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_market_pulse SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_corridor_demand_signals SET (security_invoker = true);
ALTER VIEW IF EXISTS public.hc_country_registry SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_live_market_feed SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_state_load_activity SET (security_invoker = true);
ALTER VIEW IF EXISTS public.hc_country_coverage SET (security_invoker = true);

-- ============================================================
-- Move pg_net extension out of public schema  
-- ============================================================

CREATE SCHEMA IF NOT EXISTS extensions;

-- pg_net move (may fail if already moved or not installed)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_net SET SCHEMA extensions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_net schema move skipped: %', SQLERRM;
END $$;

-- ============================================================
-- Revoke API access on materialized views
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='mv_corridor_activity') THEN
    REVOKE ALL ON public.mv_corridor_activity FROM anon, authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='mv_indexable_page_counts') THEN
    REVOKE ALL ON public.mv_indexable_page_counts FROM anon, authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
