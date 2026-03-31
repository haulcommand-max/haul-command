-- Drop old permissive policies exposing hc_dictionary

DROP POLICY IF EXISTS "hc_dictionary: public read" ON public.hc_dictionary;
DROP POLICY IF EXISTS "hc_dictionary: pro user read" ON public.hc_dictionary;
DROP POLICY IF EXISTS "hc_dictionary: service_role all" ON public.hc_dictionary;

-- Verify
SELECT tablename, policyname, roles FROM pg_policies WHERE tablename = 'hc_dictionary';
