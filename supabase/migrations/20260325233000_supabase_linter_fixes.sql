-- ==============================================================================
-- HAUL COMMAND: SUPABASE SECURITY DEBT REMEDIATION
-- Migration: 20260325233000_supabase_linter_fixes.sql
-- Description: Fixes RLS Disabled warnings and Function Search Path mutable 
--              vulnerabilities detected by Supabase Database Linter.
-- ==============================================================================

-- 1. FIX: Function Search Path Mutable (SECURITY DEFINER Vulnerability)
-- By setting search_path = public, we prevent search path injection attacks.
ALTER FUNCTION public.hc_set_updated_at SET search_path = public;
ALTER FUNCTION public.assess_quickpay_risk SET search_path = public;
ALTER FUNCTION public.hc_days_since SET search_path = public;
ALTER FUNCTION public.touch_updated_at SET search_path = public;
ALTER FUNCTION public.find_triroute_matches SET search_path = public;
ALTER FUNCTION public.hc_pay_write_ledger_entry SET search_path = public;
ALTER FUNCTION public.refresh_competitor_intel SET search_path = public;
ALTER FUNCTION public.is_admin SET search_path = public;
ALTER FUNCTION public.create_wallet_for_new_user SET search_path = public;
ALTER FUNCTION public.recompute_rate_index_cache SET search_path = public;
ALTER FUNCTION public.extract_point_coords SET search_path = public;
ALTER FUNCTION public.block_updates_deletes SET search_path = public;
ALTER FUNCTION public.hc_clamp_01 SET search_path = public;
ALTER FUNCTION public.match_operators_global SET search_path = public;

-- 2. FIX: RLS Disabled in Public (Enable RLS across all unguarded tables)
DO $$ DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'recurring_schedules', 'schedule_occurrences', 'schedule_prefunding', 
            'hc_pay_revenue', 'hc_countries', 'operator_phones', 'road_restrictions', 
            'operator_capabilities', 'corridors', 'coverage_nodes', 'routing_edges', 
            'infrastructure_nodes', 'jobs', 'brokers', 'capability_translations', 
            'country_rate_config', 'country_launch_status', 'hc_broker_tier', 
            'hc_lead_unlocks_v2', 'user_subscriptions', 'competitor_intel', 'operators', 
            'seo_regulatory_audits', 'seo_taxonomies', 'seo_city_pages', 
            'seo_ai_search_audits', 'seo_money_left_audits', 'seo_schema_templates', 
            'seo_scorecards', 'city_nodes', 'seo_content_city_pages', 
            'seo_content_regulatory_pages', 'seo_content_ai_answers', 'permit_routes', 
            'seo_content_corridor_pages', 'seo_content_vertical_pages', 
            'seo_content_acquisition_pages', 'seo_content_entity_pages', 
            'seo_content_multilingual_audits', 'seo_content_strategy_reviews', 
            'vehicle_profiles', 'hc_blog_articles', 'webhook_inbox', 
            'ai_model_performance', 'cron_audit'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
    END LOOP;
END $$;
