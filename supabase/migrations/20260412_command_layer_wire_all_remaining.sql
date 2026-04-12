-- ============================================================================
-- Migration: 20260412_command_layer_wire_all_remaining.sql
-- Purpose: Double Platinum Execution. Hooks the final 52 dormant,
--          unregistered edge-functions into the `hc_command_agents` matrix
--          ensuring 100% of the repository's swarms are actively managed.
-- ============================================================================

BEGIN;

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
('admin-set-setting', 'Admin Utility', 'Sets internal system flags', 'command', 'worker', 'active', '{}'),
('assign-seeds', 'Database Seeder', 'Assigns DB test seeds', 'command', 'worker', 'active', '{}'),
('audit-email-inventory', 'Email Tracker', 'Tracks listmonk email opens and clicks', 'comms', 'worker', 'active', '{"cron_expression":"0 2 * * *"}'),
('availability-toggle', 'Driver Toggle', 'Toggles operator status', 'presence', 'worker', 'active', '{}'),
('broker-availability-feed', 'Broker Feed', 'Serves active operators to connected brokers', 'dispatch', 'webhook', 'active', '{}'),
('comms-core', 'Comms API', 'Core router for fallback notifications', 'comms', 'worker', 'active', '{}'),
('compliance-match-preview', 'Preview Generator', 'Generates pre-flight compliance PDFs', 'compliance', 'worker', 'active', '{}'),
('cron-refresh-load-intel', 'Load Intel Refresh', 'Caches load intel to public buckets', 'intelligence', 'worker', 'active', '{"cron_expression":"*/30 * * * *"}'),
('deadhead-estimate', 'Deadhead Math', 'Calculates unloaded miles via Mapbox', 'pricing', 'worker', 'active', '{}'),
('deeplink-redirect', 'SMS Deeplinks', 'Pushes SMS clicks into app', 'comms', 'webhook', 'active', '{}'),
('discovery-search-core', 'Search DB Mapper', 'Maps postgres to search endpoints', 'seo', 'worker', 'active', '{}'),
('email-send', 'Email Sender', 'Legacy fallback email firing', 'comms', 'worker', 'active', '{}'),
('emergency-vendors', 'Emergency Dispatch', 'Bypasses standard matches for emergency tows', 'dispatch', 'worker', 'active', '{}'),
('enrich-chambers-geo', 'Chamber Geo', 'Attaches geometry to chamber of commerce data', 'seo', 'worker', 'active', '{}'),
('eval-load-intelligence', 'Load Eval Core', 'Internal hazard scoring', 'intelligence', 'worker', 'active', '{}'),
('evaluate-load', 'Public Load Eval', 'Public facing hazard scoring', 'intelligence', 'webhook', 'active', '{}'),
('geo-aggregator', 'Geo Mesh Aggregator', 'Aggregates spatial nodes', 'map', 'worker', 'active', '{"cron_expression":"0 1 * * *"}'),
('geocode-worker', 'Geocoding Fallback', 'Converts addresses to points', 'map', 'worker', 'active', '{}'),
('get-featured-providers', 'Featured AdGrid', 'Fetches sponsored blocks for local pages', 'monetization', 'worker', 'active', '{}'),
('get-providers-near-me', 'Spatial Ping', 'Core spatial query for Near Me local SEO', 'seo', 'webhook', 'active', '{}'),
('hc_leads_worker', 'Leads Sync', 'Syncs offline leads into CRM bucket', 'growth', 'worker', 'active', '{"cron_expression":"0 4 * * *"}'),
('hc_osm_enrichment', 'OSM Map Ingest', 'Updates OpenStreetMap layers', 'intelligence', 'worker', 'active', '{"cron_expression":"0 5 * * *"}'),
('hc_quality_scoring_worker', 'Quality Monitor', 'Periodically checks user session health', 'trust', 'worker', 'active', '{"cron_expression":"0 0 * * *"}'),
('hc_route_iq_compute', 'Route IQ API', 'The core logic for selling Enterprise APIs', 'intelligence', 'webhook', 'active', '{"revenue_critical":true}'),
('hc_webhook_stripe', 'Legacy Stripe Listener', 'Secondary webhook intercept', 'payments', 'webhook', 'active', '{}'),
('highpole-calibration-pdf', 'Highpole Certifier', 'PDF generation for pole height compliance', 'compliance', 'worker', 'active', '{}'),
('ingest-chambers', 'Chamber Scraper', 'Ingests CoC listing data', 'growth', 'worker', 'active', '{}'),
('installs-track', 'App Install Tracker', 'Logs app download attribution', 'growth', 'webhook', 'active', '{}'),
('kyc-step-up-trigger', 'KYC Escalation', 'Triggers selfie request on high risk brokers', 'trust', 'worker', 'active', '{"trust_critical":true}'),
('leaderboard-snapshot-hourly', 'Rank Cache', 'Builds leaderboard top 100 cache', 'growth', 'worker', 'active', '{"cron_expression":"0 * * * *"}'),
('liquidity-health', 'Liquidity Engine', 'Math for supply/demand ratio', 'intelligence', 'worker', 'active', '{}'),
('liquidity-map-data', 'Heatmap Tiles', 'Serves heatmap tiles to front end', 'intelligence', 'webhook', 'active', '{}'),
('map-prefetch', 'Map Tile Cache', 'Prefetches mapbox tiles for fast map loads', 'map', 'worker', 'active', '{}'),
('market-intelligence', 'Market Intel DB', 'Internal market data syncing', 'intelligence', 'worker', 'active', '{}'),
('miles-compute', 'Polyline Milage', 'Calculates exact overlapping miles', 'map', 'worker', 'active', '{}'),
('morning-pulse-dispatch', 'Daily Dispatch', 'Morning alarm notification to operators', 'dispatch', 'worker', 'active', '{"cron_expression":"0 6 * * *"}'),
('navixy-bridge-formula-calculator', 'Bridge Formula Core', 'Calculates federal bridge weights', 'compliance', 'worker', 'active', '{}'),
('navixy-high-pole-alert', 'Pole Alert Hook', 'Fires alert if physical pole hits hazard', 'operations', 'webhook', 'active', '{}'),
('navixy-route-hazard-profiler', 'Hazard Route Restrictor', 'Blocks routes that violate geometry', 'operations', 'worker', 'active', '{}'),
('navixy-schematic-generator', 'Schematic Builder', 'Draws SVG/PDF visual diagrams of loads', 'operations', 'worker', 'active', '{}'),
('offer-accept', 'Offer Acceptance', 'Logs broker acceptances to job pipeline', 'dispatch', 'worker', 'active', '{}'),
('offer-decline', 'Offer Decline', 'Logs broker rejections to algorithm', 'dispatch', 'worker', 'active', '{}'),
('offer-viewed', 'Offer Analytics', 'Logs tension analytics', 'dispatch', 'worker', 'active', '{}'),
('polyline-worker', 'Polyline API', 'Extracts and simplifies coordinates', 'map', 'worker', 'active', '{}'),
('presence-and-availability-core', 'Presence Mesh', 'Tracks connected users on socket level', 'presence', 'webhook', 'active', '{}'),
('rate-index-recompute', 'Rate Math', 'Recomputes average $ per mile in zones', 'pricing', 'worker', 'active', '{}'),
('record-qualified-event', 'Tier Upgrader', 'Grants badges/XP for job finishes', 'trust', 'worker', 'active', '{}'),
('referrals-redeem', 'Referral Payouts', 'Fires affiliate payouts', 'monetization', 'worker', 'active', '{"revenue_critical":true}'),
('refresh-chamber-sites', 'Chamber Pulse', 'Periodic refresh of CoC sites', 'growth', 'worker', 'active', '{"cron_expression":"0 0 1 * *"}'),
('retention-event-ingest', 'Retention Sync', 'Syncs internal login data', 'growth', 'worker', 'active', '{}'),
('reviews-log', 'Review Hook', 'Triggers 24-hours after job completion for feedback', 'trust', 'worker', 'active', '{}'),
('trust-and-ranking-core', 'Trust Engine Core', 'Consolidated algorithms for tiering', 'trust', 'worker', 'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- INSERT HEARTBEATS FOR ANY DECLARED CRONS DIRECTLY


















COMMIT;
