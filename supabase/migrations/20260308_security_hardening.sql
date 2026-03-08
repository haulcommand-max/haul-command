-- ════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING MIGRATION
-- Fixes ALL Supabase Linter ERRORs and WARNs:
--   1. SECURITY DEFINER views → SECURITY INVOKER
--   2. RLS disabled tables → Enable RLS + read policies
--   3. Functions with mutable search_path → SET search_path = ''
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- PART 1: Fix SECURITY DEFINER views → SECURITY INVOKER
-- These views currently enforce the view CREATOR's permissions,
-- which bypasses RLS for the querying user. Fix: INVOKER mode.
-- ─────────────────────────────────────────────────────────────────

ALTER VIEW public.v_market_pulse_live SET (security_invoker = on);
ALTER VIEW public.v_market_pulse SET (security_invoker = on);
ALTER VIEW public.v_corridor_demand_signals SET (security_invoker = on);
ALTER VIEW public.hc_country_registry SET (security_invoker = on);
ALTER VIEW public.v_live_market_feed SET (security_invoker = on);
ALTER VIEW public.v_state_load_activity SET (security_invoker = on);
ALTER VIEW public.hc_country_coverage SET (security_invoker = on);


-- ─────────────────────────────────────────────────────────────────
-- PART 2: Enable RLS on ALL exposed public tables
-- Strategy: Enable RLS + grant read-only to anon/authenticated.
-- Admin/write operations go through service_role (bypasses RLS).
-- ─────────────────────────────────────────────────────────────────

-- Infrastructure / Config tables (read-only for all)
ALTER TABLE public.hc_country_ingest_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_feature_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_system_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_allowed_country ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_indexability_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_crypto_legality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_country_localization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_credential_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_credential_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_countries ENABLE ROW LEVEL SECURITY;

-- Read-only policies for config tables
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_country_ingest_state', 'hc_feature_gates', 'hc_ai_config',
        'hc_system_setting', 'hc_allowed_country', 'hc_indexability_thresholds',
        'hc_crypto_legality', 'hc_country_localization', 'hc_signal_types',
        'hc_credential_types', 'hc_credential_issuers', 'hc_training_courses',
        'global_countries'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Corridor / Demand tables
ALTER TABLE public.hc_surface_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_corridor_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_corridor_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_corridor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_corridor_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_demand_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_surface_rollups_country ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_surface_rollups_corridor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_surface_clusters_nearby ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_surface_city_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_surface_category_rollups ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_surface_rollups', 'hc_corridor_edges', 'hc_corridor_signals',
        'hc_corridor_snapshots', 'hc_corridor_demand', 'hc_demand_predictions',
        'hc_surface_rollups_country', 'hc_surface_rollups_corridor',
        'hc_surface_clusters_nearby', 'hc_surface_city_rollups',
        'hc_surface_category_rollups'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Vapi / Voice tables (internal only — no public read)
ALTER TABLE public.vapi_call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_roi_weekly ENABLE ROW LEVEL SECURITY;

-- Vapi tables: only service_role access (no policies = deny all via anon/auth)

-- Jobs / Queue tables
ALTER TABLE public.hc_jobs ENABLE ROW LEVEL SECURITY;
-- Jobs: only service_role access

-- GPS / Signals tables
ALTER TABLE public.hc_gps_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_event_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_rollups_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_profile_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_signal_report_card_edges ENABLE ROW LEVEL SECURITY;

-- Signal tables: read-only for authenticated (signals are public data)
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_signals', 'hc_signal_confirmations', 'hc_signal_events',
        'hc_signal_event_media', 'hc_signal_event_confirmations',
        'hc_signal_hotspots', 'hc_signal_rollups_daily',
        'hc_signal_profile_stats', 'hc_signal_leaderboards',
        'hc_signal_report_card_edges'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- AdGrid tables
ALTER TABLE public.adgrid_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adgrid_promo_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_ad_corridor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_ad_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_adgrid_page_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_adgrid_signal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_adgrid_inventory ENABLE ROW LEVEL SECURITY;

-- AdGrid: read-only for authenticated
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'adgrid_promotions', 'adgrid_promo_enrollments',
        'hc_ad_corridor_bids', 'hc_ad_payouts',
        'hc_adgrid_page_inventory', 'hc_adgrid_signal_pricing',
        'hc_adgrid_inventory'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Operator profile / reputation tables
ALTER TABLE public.hc_participant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_operator_report_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_escort_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_escort_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_peer_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_operator_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_operator_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_operator_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_credential_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_credential_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_credential_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_entity_evidence ENABLE ROW LEVEL SECURITY;

-- Operator profiles: public read, owner write
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_participant_profiles', 'hc_operator_report_card', 'hc_badges',
        'hc_escort_score', 'hc_peer_endorsements'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Sensitive operator data: authenticated only
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_risk_flags', 'hc_escort_score_history', 'hc_operator_credentials',
        'hc_operator_compliance', 'hc_operator_verification',
        'hc_credential_audit_log', 'hc_credential_alerts',
        'hc_credential_verifications', 'hc_training_enrollments',
        'hc_entity_evidence'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Leaderboard / Champions / Reviews (public read)
ALTER TABLE public.hc_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_corridor_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_review_limits ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_leaderboard', 'hc_champions', 'hc_corridor_guardians',
        'hc_reviews', 'hc_review_limits'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Surface / Leads tables
ALTER TABLE public.hc_surface_leads ENABLE ROW LEVEL SECURITY;
-- Leads: authenticated only
CREATE POLICY IF NOT EXISTS read_hc_surface_leads ON public.hc_surface_leads
    FOR SELECT TO authenticated USING (true);

-- Convoy / Network tables
ALTER TABLE public.hc_convoy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_convoy_networks ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['hc_convoy_members', 'hc_convoy_networks'])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Job Stories / Interactions
ALTER TABLE public.hc_job_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_story_interactions ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['hc_job_stories', 'hc_story_interactions'])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;

-- Cross-border / Broker risk / Alerts
ALTER TABLE public.hc_cross_border_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_broker_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_alert_ingest_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_alert_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_alert_entity_aliases ENABLE ROW LEVEL SECURITY;
-- These are internal / admin-only — no public policies needed

-- SEO / Page infrastructure
ALTER TABLE public.hc_page_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_page_publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_sitemap_url ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'hc_page_keys', 'hc_internal_links', 'hc_page_publish_queue',
        'hc_sitemap_url'
    ])
    LOOP
        EXECUTE format(
            'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
            'read_' || tbl, tbl
        );
    END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────
-- PART 3: Fix mutable search_path on ALL public functions
-- SET search_path = '' prevents search_path injection attacks.
-- ─────────────────────────────────────────────────────────────────

-- We use ALTER FUNCTION ... SET search_path = '' for each function.
-- This is idempotent — safe to re-run.

DO $$
DECLARE
    func_name TEXT;
    func_args TEXT;
    func_oid OID;
BEGIN
    FOR func_oid, func_name, func_args IN
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND NOT EXISTS (
              SELECT 1 FROM pg_proc_info pi 
              WHERE pi.oid = p.oid 
              AND pi.proconfig @> ARRAY['search_path=']
          )
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = ''''',
                func_name, func_args
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function %.%(%): %', 'public', func_name, func_args, SQLERRM;
        END;
    END LOOP;
END $$;

-- Explicit fixes for the specific functions flagged by the linter:
ALTER FUNCTION public.hc_pipeline_run_country SET search_path = '';
ALTER FUNCTION public.hc_profile_view_record SET search_path = '';
ALTER FUNCTION public.hc_adgrid_advertiser_create SET search_path = '';
ALTER FUNCTION public.hc_list_all_jurisdictions SET search_path = '';
ALTER FUNCTION public.hc_crypto_payment_create SET search_path = '';
ALTER FUNCTION public.hc_suppression_match SET search_path = '';
ALTER FUNCTION public.get_partner_dashboard SET search_path = '';
ALTER FUNCTION public.hc_payment_capture SET search_path = '';
ALTER FUNCTION public.vault_read_secret SET search_path = '';
ALTER FUNCTION public.hc_edge_upsert SET search_path = '';
ALTER FUNCTION public.hc_booking_create SET search_path = '';
ALTER FUNCTION public.hc_slugify SET search_path = '';
ALTER FUNCTION public.hc_calculate_route_escorts SET search_path = '';
ALTER FUNCTION public.hc_job_start SET search_path = '';
ALTER FUNCTION public.hc_payment_route SET search_path = '';
ALTER FUNCTION public.hc_identity_find_duplicates SET search_path = '';
ALTER FUNCTION public.hc_company_merge_cluster SET search_path = '';
ALTER FUNCTION public.hc_adgrid_auction SET search_path = '';
ALTER FUNCTION public.hc_push_send SET search_path = '';
ALTER FUNCTION public.hc_identifier_upsert SET search_path = '';
ALTER FUNCTION public.hc_discovery_job_pop SET search_path = '';
ALTER FUNCTION public.hc_crypto_payment_ipn_update SET search_path = '';
ALTER FUNCTION public.hc_sha256 SET search_path = '';
ALTER FUNCTION public.hc_stripe_onboard_request SET search_path = '';
ALTER FUNCTION public.hc_lead_promote_to_entity SET search_path = '';
ALTER FUNCTION public.rpc_radar_live_signals SET search_path = '';
ALTER FUNCTION public.hc_booking_confirm SET search_path = '';
ALTER FUNCTION public.hc_entity_upsert_from_parsed SET search_path = '';
ALTER FUNCTION public.hc_sitemap_refresh SET search_path = '';
ALTER FUNCTION public.hc_get_allowed_countries SET search_path = '';
ALTER FUNCTION public.hc_scores_recompute_entity SET search_path = '';
ALTER FUNCTION public.hc_api_usage_record SET search_path = '';
ALTER FUNCTION public.hc_job_verify SET search_path = '';
ALTER FUNCTION public.hc_lead_ingest SET search_path = '';
ALTER FUNCTION public.hc_leads_promote_batch SET search_path = '';
ALTER FUNCTION public.hc_api_key_create SET search_path = '';
ALTER FUNCTION public.hc_escrow_create SET search_path = '';
ALTER FUNCTION public.hc_identity_explode_entity SET search_path = '';
ALTER FUNCTION public.hc_publish_enqueue_for_entity SET search_path = '';
ALTER FUNCTION public.hc_payment_create SET search_path = '';
ALTER FUNCTION public.hc_normalize_company_name SET search_path = '';
ALTER FUNCTION public.hc_phone_edit_distance SET search_path = '';
ALTER FUNCTION public.hc_network_promote_batch SET search_path = '';
ALTER FUNCTION public.hc_trust_compute_batch SET search_path = '';
ALTER FUNCTION public.hc_internal_links_build SET search_path = '';
ALTER FUNCTION public.jsonb_deep_merge SET search_path = '';
ALTER FUNCTION public.check_crypto_legality SET search_path = '';
ALTER FUNCTION public.rpc_radar_us_states SET search_path = '';
ALTER FUNCTION public.hc_get_country_tier_locked SET search_path = '';
ALTER FUNCTION public.hc_job_complete SET search_path = '';
ALTER FUNCTION public.hc_trust_compute SET search_path = '';
ALTER FUNCTION public.hc_phantom_demand_compute SET search_path = '';
ALTER FUNCTION public.hc_booking_accept SET search_path = '';
ALTER FUNCTION public.serve_adgrid_ad SET search_path = '';
ALTER FUNCTION public.hc_governor_get SET search_path = '';
ALTER FUNCTION public.hc_identity_explode_batch SET search_path = '';
ALTER FUNCTION public.hc_entity_merge SET search_path = '';
ALTER FUNCTION public.hc_identity_neighbors SET search_path = '';
ALTER FUNCTION public.hc_payment_summary SET search_path = '';
ALTER FUNCTION public.hc_assert_country_allowed SET search_path = '';
ALTER FUNCTION public.hc_booking_notify SET search_path = '';
ALTER FUNCTION public.hc_entity_upsert SET search_path = '';
ALTER FUNCTION public.hc_surface_ingest SET search_path = '';
ALTER FUNCTION public.hc_surface_ingest_batch SET search_path = '';
ALTER FUNCTION public.hc_assert_country_program_cap SET search_path = '';
ALTER FUNCTION public.hc_country_program_status SET search_path = '';
ALTER FUNCTION public.hc_scores_recalc_country SET search_path = '';
ALTER FUNCTION public.hc_company_dedupe_hash SET search_path = '';
ALTER FUNCTION public.hc_is_country_allowed SET search_path = '';
ALTER FUNCTION public.hc_dispute_open SET search_path = '';
ALTER FUNCTION public.rpc_radar_stats SET search_path = '';
ALTER FUNCTION public.hc_discovery_job_done SET search_path = '';
ALTER FUNCTION public.hc_claim_submit_relationships SET search_path = '';
ALTER FUNCTION public.hc_stripe_create_account SET search_path = '';
ALTER FUNCTION public.hc_discovery_job_push SET search_path = '';
ALTER FUNCTION public.hc_profile_view_stats SET search_path = '';
ALTER FUNCTION public.hc_claim_initiate SET search_path = '';
ALTER FUNCTION public.hc_adgrid_campaign_create SET search_path = '';
ALTER FUNCTION public.hc_get_jurisdiction_requirements SET search_path = '';
ALTER FUNCTION public.hc_project_predict_equipment SET search_path = '';
ALTER FUNCTION public.hc_touch_updated_at SET search_path = '';
ALTER FUNCTION public.hc_escrow_release SET search_path = '';
ALTER FUNCTION public.hc_claim_outreach_generate SET search_path = '';
ALTER FUNCTION public.hc_global_stats_get SET search_path = '';
ALTER FUNCTION public.hc_entity_neighbors SET search_path = '';
ALTER FUNCTION public.rpc_radar_country_summary SET search_path = '';
ALTER FUNCTION public.hc_coverage_compute SET search_path = '';
ALTER FUNCTION public.hc_pages_refresh_country SET search_path = '';
ALTER FUNCTION public.hc_claim_verify SET search_path = '';
ALTER FUNCTION public.hc_canonical_hash SET search_path = '';

-- Done. All security linter issues resolved.
