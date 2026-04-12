-- ============================================================================
-- Migration: 20260412_command_layer_roi_engines_v2.sql
-- Purpose: Double Platinum execution. Ingest the three 15x ROI agents 
--          (Push-Reactivation, Broker FOMO Surge, Enterprise API Intel)
--          into the active Command Layer.
-- ============================================================================

BEGIN;

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  (
    'push-reactivation-engine',
    'Content Push Reactivator',
    'Listens for changes in SEO/Docs/Regulations and triggers push notifications to affected state operators instantly (e.g. TxDOT limits).',
    'comms',
    'worker',
    'active',
    '{"push_critical":true, "roi_lever":"reactivation"}'
  ),
  (
    'broker-fomo-surge',
    'Spatial Scarcity Broadcast',
    'Detects low operator liquidity near posted loads and blasts urgency pushes to nearby operators to create premium market tension.',
    'dispatch',
    'worker',
    'active',
    '{"push_critical":true, "revenue_critical":true, "roi_lever":"speed_to_match"}'
  ),
  (
    'enterprise-intel-gateway',
    'B2B Route API Monetizer',
    'Packages corridor hazard intelligence and market density maps for $5k/mo API consumption by external TMS brokers.',
    'monetization',
    'webhook',
    'active',
    '{"revenue_critical":true, "roi_lever":"data_subscription"}'
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;
