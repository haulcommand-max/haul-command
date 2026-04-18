-- ============================================================================
-- Migration: 20260412_command_layer_paperclip_maximum_yield.sql
-- Purpose: "No Money/SEO Left on the Table" - Maximize Paperclip Orchestration.
--          Registers critical day-1 and dormant systems (search, CRM sync,
--          permit conversion) into the Command Layer, expanding the total 
--          controlled swarm count to cover all operational gaps.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- MAXIMUM YIELD CLUSTER: SEO, SEARCH & MONETIZATION
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('search-indexer',           'Typesense Search Indexer',   'Ensures 100% parity between Supabase directory entities and Typesense for maximum internal link juice', 'seo', 'worker', 'active', '{"seo_critical":true}'),
  ('kyc-webhook-handler',      'KYC & CRM Trigger',          'Dispatches verified driver entities to Twenty CRM and KYC vendor', 'trust', 'worker', 'active', '{"revenue_critical":true}'),
  ('b2b-permit-order',         'B2B Permit Converter',       'Captures superload/permit calculator hits and converts them to paid B2B orders', 'monetization', 'worker', 'active', '{"revenue_critical":true}'),
  ('directory-claim-submit',   'Directory Claim Intake',     'Processes incoming claim submissions, triggering Stripe billing hooks', 'growth', 'worker', 'active', '{"revenue_critical":true}'),
  ('escort-activation',        'Operator Activation',        'Triggers compliance review & training unlock upon new operator sign-up', 'growth', 'worker', 'active', '{}'),
  ('navixy-evidence-vault',    'GPS Evidence Vault Sync',    'Wires Traccar/Navixy breadcrumbs into permanent unalterable audit trails for disputes', 'operations', 'worker', 'active', '{"cron_expression":"*/30 * * * *"}'),
  ('jobs-create-from-offer',   'Load Board Market Maker',    'Converts accepted automated offers into live, trackable Load Board jobs', 'dispatch', 'worker', 'active', '{"operational_critical":true}'),
  ('docs-init-upload',         'Content OS Upload Trigger',  'Injects new regulation/glossary pages automatically into the index graph', 'seo', 'worker', 'active', '{"seo_critical":true}')
ON CONFLICT (slug) DO NOTHING;

-- HEARTBEAT FOR THE DISCOVERED CRON (EVIDENCE VAULT)


-- Map slightly misnamed references from previous migrations to their actual directory names to avoid orphans
-- UPDATE hc_command_agents SET slug = 'hc_ad_inventory_generator' WHERE slug = 'hc-ad-inventory-gen';
-- UPDATE hc_command_agents SET slug = 'compliance-snapshot-generate' WHERE slug = 'compliance-snapshot-gen';

COMMIT;
