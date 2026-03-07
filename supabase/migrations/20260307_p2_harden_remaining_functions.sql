-- ============================================================
-- P2: Harden ALL remaining functions with search_path
-- Batch fix for pipeline, utility, identity, scoring functions  
-- Applied: 2026-03-07
-- ============================================================

-- ── Pipeline / Ingest ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_pipeline_run_country SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_surface_ingest SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_surface_ingest_batch SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_lead_ingest SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_leads_promote_batch SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_lead_promote_to_entity SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_entity_upsert SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_entity_upsert_from_parsed SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_entity_merge SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_entity_neighbors SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Identity / Deduplication ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_identity_find_duplicates SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_identity_explode_entity SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_identity_explode_batch SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_identity_neighbors SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_identifier_upsert SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_company_merge_cluster SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_company_dedupe_hash SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_normalize_company_name SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_suppression_match SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Scoring / Trust ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_trust_compute SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_trust_compute_batch SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_scores_recompute_entity SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_scores_recalc_country SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_coverage_compute SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_corridor_liquidity_compute SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_phantom_demand_compute SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Publishing / SEO ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_publish_enqueue_for_entity SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_pages_refresh_country SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_sitemap_refresh SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_internal_links_build SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_canonical_hash SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Discovery / Network ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_discovery_job_push SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_discovery_job_pop SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_discovery_job_done SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_network_promote_batch SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_edge_upsert SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Utility functions ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_slugify SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_sha256 SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_phone_edit_distance SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.jsonb_deep_merge SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_touch_updated_at SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Country / Jurisdiction ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_get_allowed_countries SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_is_country_allowed SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_assert_country_allowed SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_assert_country_program_cap SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_country_program_status SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_get_country_tier_locked SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.check_crypto_legality SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_list_all_jurisdictions SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_get_jurisdiction_requirements SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Profile / Stats / Games ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_profile_view_record SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_profile_view_stats SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_global_stats_get SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_governor_get SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_calculate_route_escorts SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_project_predict_equipment SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Notifications / Push / Api ──
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_push_send SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION IF EXISTS public.hc_api_usage_record SET search_path = ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
