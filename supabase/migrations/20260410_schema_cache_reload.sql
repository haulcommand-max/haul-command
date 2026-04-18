-- ============================================================
-- Migration: 20260410_schema_cache_reload.sql
-- Purpose: Force PostgREST schema cache reload to fix PGRST205
--          errors on newly created tables/views.
-- NOTE: This uses NOTIFY which is the official method to trigger
--       PostgREST schema cache reloads on Supabase.
-- ============================================================

-- Notify PostgREST to reload its schema cache
-- This resolves PGRST205 errors on tables created in recent migrations
NOTIFY pgrst, 'reload schema';

-- Also ensure key views used by the API are accessible
-- (Views sometimes need explicit schema cache reload)
DO $$
BEGIN
  -- Verify critical views exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'trust_profile_view' AND table_schema = 'public') THEN
    RAISE NOTICE 'trust_profile_view not found - may need recreation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_providers_seo' AND table_schema = 'public') THEN
    RAISE NOTICE 'v_providers_seo not found - may need recreation';
  END IF;

  -- Grant usage on key tables to anon/authenticated roles
  -- This ensures the REST API can access them
  GRANT SELECT ON public.glo_terms TO anon, authenticated;
  GRANT SELECT ON public.rate_index TO anon, authenticated;
  GRANT SELECT ON public.hc_global_operators TO anon, authenticated;
  GRANT SELECT ON public.seo_pages TO anon, authenticated;

  RAISE NOTICE 'Schema cache reload triggered + grants applied';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Some tables not yet created - grants skipped for missing tables';
END $$;
