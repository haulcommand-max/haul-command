-- Fix PostgREST PGRST002 schema cache failure
-- The migration revoked SELECT on materialized views from anon, 
-- which breaks PostgREST's schema introspection.
-- Grant usage on the schema and SELECT on all MVs to anon for schema cache.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Re-grant SELECT on materialized views to anon so PostgREST can build its schema cache.
-- RLS does NOT apply to materialized views (they're not tables), so this is safe
-- as long as we don't expose sensitive data through MVs.
DO $$
DECLARE mv_name TEXT;
BEGIN
  FOR mv_name IN
    SELECT relname FROM pg_class
    WHERE relkind = 'm'
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', mv_name);
    RAISE NOTICE 'Granted SELECT on MV: %', mv_name;
  END LOOP;
END;
$$;

-- Force PostgREST to reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
