-- ============================================================
-- DEFINITIVE SECURITY CLEANUP — Drop all rogue permissive policies
-- Run via: npx supabase db query --linked -f definitive_rls_cleanup.sql
-- ============================================================

-- ── companies: keep only rls_companies_auth_select ──────────
DROP POLICY IF EXISTS "p_select_authenticated" ON public.companies;

-- ── users: keep only rls_users_own_select + rls_users_own_update ──
DROP POLICY IF EXISTS "p_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "IGNORE_MISSING_blog_articles_public_select" ON public.users;
DROP POLICY IF EXISTS "IGNORE_MISSING_identity_scores_auth_select" ON public.users;

-- ── lb_observations: keep only rls_lb_observations_highconf_select ──
-- (the highconf policy allows SELECT only when parse_confidence >= 0.4)
-- No rogue policies found here.

-- ── lb_claim_queue: should have NO public policies ──────────
DROP POLICY IF EXISTS "p_select_public" ON public.lb_claim_queue;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.lb_claim_queue;

-- ── lb_ingestion_batches: should have NO public policies ────
DROP POLICY IF EXISTS "p_select_public" ON public.lb_ingestion_batches;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.lb_ingestion_batches;

-- ── lb_reputation_observations: should have NO public policies ──
DROP POLICY IF EXISTS "p_select_public" ON public.lb_reputation_observations;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.lb_reputation_observations;

-- ── lb_organizations: public read ok but tighten ────────────
-- (leave as-is, public read for directory pages)

-- ── lb_contacts, lb_phones, lb_aliases: internal only ───────
DROP POLICY IF EXISTS "p_select_public" ON public.lb_contacts;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.lb_contacts;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_phones;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.lb_phones;
DROP POLICY IF EXISTS "p_select_public" ON public.lb_aliases;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.lb_aliases;

-- ── broker_surface_activation_queue: internal only ──────────
DROP POLICY IF EXISTS "p_select_public" ON public.broker_surface_activation_queue;
DROP POLICY IF EXISTS "p_select_authenticated" ON public.broker_surface_activation_queue;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- ── VERIFY ──────────────────────────────────────────────────
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('companies','users','lb_observations','lb_claim_queue','lb_ingestion_batches','lb_reputation_observations')
ORDER BY tablename, policyname;
