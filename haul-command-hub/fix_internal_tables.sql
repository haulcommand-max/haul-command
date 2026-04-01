-- Drop overly permissive "p_select_public" from sensitive internal tables

DROP POLICY IF EXISTS "p_select_public" ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_observations;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_organizations;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_contacts;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_phones;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_aliases;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_corridors;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_reputation_observations;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_daily_volume;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_claim_queue;
DROP POLICY IF EXISTS "p_select_public" ON public.broker_surface_activation_queue;

-- Note: We leave p_select_public on state_regulations, jurisdictions, corridors, hc_page_seo_contracts
