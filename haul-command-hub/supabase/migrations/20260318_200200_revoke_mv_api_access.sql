-- ============================================================================
-- RLS Hardening Phase 3 — Revoke Materialized View API Access
--
-- ⚠️  ONLY RUN THIS IF the materialized views listed below should NOT be
--     directly queryable by frontend / Data API callers (anon, authenticated).
--
--     If any of these MVs are used by client-side components or RPCs
--     called via anon/authenticated, REMOVE those lines before running.
--
-- Backend service_role access is unaffected by these revocations.
-- ============================================================================

REVOKE SELECT ON public.mv_hc_map_pack_daily           FROM public, anon, authenticated;
REVOKE SELECT ON public.mv_hc_ranking_trends_daily     FROM public, anon, authenticated;
REVOKE SELECT ON public.mv_hc_market_scoreboard_latest FROM public, anon, authenticated;
REVOKE SELECT ON public.mv_hc_corridor_supply          FROM public, anon, authenticated;
REVOKE SELECT ON public.mv_hc_claim_funnel             FROM public, anon, authenticated;
REVOKE SELECT ON public.mv_hc_reviews_rollup           FROM public, anon, authenticated;
REVOKE SELECT ON public.mv_hc_availability_current     FROM public, anon, authenticated;
