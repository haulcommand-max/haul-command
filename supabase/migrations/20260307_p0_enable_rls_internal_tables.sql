-- ============================================================
-- P0 PHASE 1: Enable RLS on ALL internal/pipeline/queue tables
-- These should NEVER be client-accessible via PostgREST
-- Applied: 2026-03-07
-- ============================================================

-- Country/Surface Pipeline
ALTER TABLE IF EXISTS public.hc_country_ingest_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_rollups_country ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_rollups_corridor ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_city_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_category_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_clusters_nearby ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_surface_leads ENABLE ROW LEVEL SECURITY;

-- Corridor/Demand
ALTER TABLE IF EXISTS public.hc_corridor_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_corridor_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_corridor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_corridor_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_demand_predictions ENABLE ROW LEVEL SECURITY;

-- Feature Gates / AI / System
ALTER TABLE IF EXISTS public.hc_feature_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_system_setting ENABLE ROW LEVEL SECURITY;

-- Vapi (call logs, campaigns, ROI — business-sensitive)
ALTER TABLE IF EXISTS public.vapi_call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vapi_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vapi_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vapi_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vapi_roi_weekly ENABLE ROW LEVEL SECURITY;

-- GPS / Signals / Hotspots
ALTER TABLE IF EXISTS public.hc_gps_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_event_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_rollups_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_profile_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_report_card_edges ENABLE ROW LEVEL SECURITY;

-- AdGrid Internal
ALTER TABLE IF EXISTS public.adgrid_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.adgrid_promo_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_ad_corridor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_ad_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_adgrid_page_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_adgrid_signal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_adgrid_inventory ENABLE ROW LEVEL SECURITY;

-- Compliance / Credentials
ALTER TABLE IF EXISTS public.hc_credential_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_operator_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_credential_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_credential_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_operator_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_entity_evidence ENABLE ROW LEVEL SECURITY;

-- Training
ALTER TABLE IF EXISTS public.hc_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_training_enrollments ENABLE ROW LEVEL SECURITY;

-- Publish / SEO Pipeline
ALTER TABLE IF EXISTS public.hc_page_publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_sitemap_url ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_page_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_indexability_thresholds ENABLE ROW LEVEL SECURITY;

-- Alert Pipeline
ALTER TABLE IF EXISTS public.hc_alert_ingest_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_alert_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_alert_entity_aliases ENABLE ROW LEVEL SECURITY;

-- Risk / Reports / Stories
ALTER TABLE IF EXISTS public.hc_risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_operator_report_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_escort_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_job_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_story_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_broker_risk_signals ENABLE ROW LEVEL SECURITY;

-- Convoy
ALTER TABLE IF EXISTS public.hc_convoy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_convoy_networks ENABLE ROW LEVEL SECURITY;

-- Localization / Crypto
ALTER TABLE IF EXISTS public.hc_country_localization ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_crypto_legality ENABLE ROW LEVEL SECURITY;
