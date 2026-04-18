-- ============================================================================
-- Migration: 20260412_command_layer_maxout_agents.sql
-- Purpose: Register ALL 40+ edge functions and cron jobs as Command Layer
--          agents + heartbeat definitions. This closes the gap from 19 → 60+
--          registered agents and ensures 100% visibility on the Board API.
-- Depends: 20260412_command_layer_schema.sql, 20260412_command_layer_seed.sql
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 1: AD YIELD / MONETIZATION CLUSTER (Revenue-Critical)
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('ad-decision-engine',       'Ad Decision Engine',         'Quality scores, fraud detection, pacing recompute, advertiser trust scoring',                   'adgrid',           'worker',          'active', '{"cron_expression":"*/15 * * * *","revenue_critical":true}'),
  ('premium-auction-tick',     'Premium Auction Engine',     'Real-time auction for premium placement slots on directory/corridor/map pages',                 'adgrid',           'worker',          'active', '{"cron_expression":"*/5 * * * *","revenue_critical":true}'),
  ('bill-sponsors-daily',      'Sponsor Billing Agent',      'Daily sponsor invoice generation and Stripe charge execution',                                  'adgrid',           'worker',          'active', '{"cron_expression":"30 0 * * *","revenue_critical":true}'),
  ('rtb-ad-serve',             'RTB Ad Server',              'Real-time bidding ad serve for programmatic AdGrid inventory',                                  'adgrid',           'worker',         'active', '{"revenue_critical":true}'),
  ('ad-impression-confirm',    'Impression Confirmation',    'Validates and logs confirmed ad impressions for billing',                                       'adgrid',           'worker',         'active', '{"revenue_critical":true}'),
  ('adgrid-yield-core',        'AdGrid Yield Core',          'Core yield optimization logic for ad inventory pricing',                                        'adgrid',           'worker',         'active', '{"revenue_critical":true}'),
  ('hc-ad-inventory-gen',      'Ad Inventory Generator',     'Generates ad inventory slots for new pages/markets/corridors',                                  'adgrid',           'worker',          'active', '{"cron_expression":"0 2 * * *"}'),
  ('recompute-ad-models',      'Ad Model Recompute',         'Recomputes ad ranking and fraud detection models',                                              'adgrid',           'worker',          'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 2: PAYMENTS / STRIPE CLUSTER
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('stripe-webhook',           'Stripe Webhook Handler',     'Processes all Stripe events: payments, subscriptions, disputes, refunds',                       'payments',         'webhook',       'active', '{"revenue_critical":true}'),
  ('payments-capture',         'Payment Capture Agent',      'Captures authorized payments after job completion',                                             'payments',         'worker',         'active', '{"revenue_critical":true}'),
  ('payments-preauth',         'Payment Pre-Auth Agent',     'Pre-authorizes payments before dispatch',                                                       'payments',         'worker',         'active', '{}'),
  ('pricing-quote',            'Pricing Quote Engine',       'Generates quotes using rate intelligence and market data',                                      'pricing',          'worker',         'active', '{}'),
  ('invoice-generate-pdf',     'Invoice PDF Generator',      'Generates branded PDF invoices for completed jobs',                                             'payments',         'worker',         'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 3: TRUST / DEFENSE CLUSTER
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('compute-trust-score',      'Trust Score Computer',       'Computes composite trust scores for all claimed operators using real aggregation',              'trust',            'worker',          'active', '{"cron_expression":"0 3 * * *","trust_critical":true}'),
  ('trust-score-recompute',    'Trust Score Recompute',      'Batch trust score recompute for changed profiles',                                             'trust',            'worker',         'active', '{"trust_critical":true}'),
  ('trust-event-ingest',       'Trust Event Ingestor',       'Processes trust-relevant events (reviews, completions, disputes) into scoring pipeline',        'trust',            'worker',         'active', '{"trust_critical":true}'),
  ('broker-score-recompute',   'Broker Score Recompute',     'Recomputes broker risk scores based on payment history and dispute rate',                       'trust',            'worker',         'active', '{}'),
  ('fraud-score-recompute',    'Fraud Score Engine',         'Detects and scores fraudulent behavior patterns across operators and brokers',                  'defense',          'worker',          'active', '{"trust_critical":true}'),
  ('dispute-auto-resolve',     'Dispute Auto-Resolver',      'Tier 1 automated dispute resolution using GPS proof chain',                                    'trust',            'worker',          'active', '{"cron_expression":"*/30 * * * *"}'),
  ('rank-system-worker',       'Rank System Worker',         'Processes rank tier changes and badge assignments',                                             'trust',            'worker',         'active', '{}'),
  ('score-recompute',          'Score Recompute',            'General-purpose score recomputation for leaderboards',                                          'trust',            'worker',         'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 4: DISPATCH / PRESENCE / OPERATIONS CLUSTER
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('panic-fill-escalation',    'Panic Fill Escalator',       '4-stage load rescue: soft nudge → supply expansion → priority rescue → last chance (Vapi)',     'dispatch',         'worker',          'active', '{"cron_expression":"*/5 * * * *","operational_critical":true}'),
  ('match-generate',           'Match Generator',            'Load-to-operator matching engine using corridor, trust, and proximity signals',                 'dispatch',         'worker',         'active', '{"operational_critical":true}'),
  ('route-matcher-agent',      'Route Matcher Agent',        'Advanced route-based matching using polyline overlap analysis',                                 'dispatch',         'worker',         'active', '{}'),
  ('availability-truth-tick',  'Availability Truth Tick',    'Expires stale availability, computes market liquidity, evaluates readiness gates',              'presence',         'worker',          'active', '{"cron_expression":"*/5 * * * *"}'),
  ('presence-timeout-offline', 'Presence Timeout Agent',     'Sets operators offline when heartbeat goes stale, cleans expired match offers',                 'presence',         'worker',          'active', '{"cron_expression":"*/10 * * * *"}'),
  ('availability-ping',        'Availability Ping Agent',    'Pushes confirmation requests to operators with stale availability windows',                     'presence',         'worker',          'active', '{"cron_expression":"0 */4 * * *"}'),
  ('presence-heartbeat',       'Presence Heartbeat',         'Processes real-time operator presence heartbeat pings',                                         'presence',         'worker',         'active', '{}'),
  ('driver-presence-update',   'Driver Presence Update',     'Updates driver location from GPS breadcrumbs into presence layer',                              'presence',         'worker',         'active', '{}'),
  ('gps-breadcrumb-ingest',    'GPS Breadcrumb Ingestor',    'Ingests GPS breadcrumb data from Motive/Navixy/direct feeds',                                  'telemetry',        'worker',         'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 5: SEO / CONTENT / INTELLIGENCE CLUSTER
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('geo-content-gap-filler',   'Geo Content Gap Filler',     'Detects and fills content gaps in local/corridor/city SEO coverage',                            'seo',              'worker',          'active', '{}'),
  ('corridor-metrics-ingest',  'Corridor Metrics Ingestor',  'Ingests corridor traffic, demand, and stress data for intelligence pages',                     'intelligence',     'worker',          'active', '{}'),
  ('corridor-stress-refresh',  'Corridor Stress Refresh',    'Refreshes corridor stress scores every 30 minutes',                                            'intelligence',     'worker',          'active', '{"cron_expression":"*/30 * * * *"}'),
  ('coverage-cells-precompute','Coverage Cells Precompute',  'Precomputes H3 coverage cells for map surface and gap detection',                              'map',              'worker',          'active', '{"cron_expression":"0 1 * * *"}'),
  ('monitor-dead-zones',       'Dead Zone Monitor',          'Detects coverage dead zones with demand but zero supply',                                      'map',              'worker',          'active', '{"cron_expression":"0 5 * * *"}'),
  ('hazard-score-rollup',      'Hazard Score Rollup',        'Rolls up route hazard reports into corridor safety scores',                                    'intelligence',     'worker',          'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 6: GROWTH / CLAIMS / EMAIL CLUSTER
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('email-worker',             'Email Worker',               'Transactional email delivery (SendGrid/Resend) for all system emails',                         'comms',            'worker',          'active', '{"cron_expression":"* * * * *"}'),
  ('email-digest-builder',     'Email Digest Builder',       'Monthly digest email compilation and send',                                                    'comms',            'worker',          'active', '{"cron_expression":"0 8 1 * *"}'),
  ('email-claim-nudges',       'Claim Nudge Emailer',        'Sends claim pressure emails to unclaimed high-view operators',                                 'growth',           'worker',          'active', '{"cron_expression":"0 */6 * * *"}'),
  ('seed-claim-sequence',      'Claim Sequence Seeder',      'Seeds claim drip sequences for newly discovered operators',                                    'growth',           'worker',          'active', '{"cron_expression":"0 */6 * * *"}'),
  ('claim-growth-core',        'Claim Growth Core',          'Core claim acceleration logic: scoring, prioritization, outreach routing',                     'growth',           'worker',         'active', '{}'),
  ('claim-welcome-sequence',   'Claim Welcome Sequence',     'Post-claim onboarding drip: profile completion, trust building, first booking',                'growth',           'worker',         'active', '{}'),
  ('auto-recruit',             'Auto Recruiter',             'Automated recruiter outreach for high-demand markets with low supply',                         'growth',           'worker',          'active', '{}'),
  ('recruiter-mission-run',    'Recruiter Mission Runner',   'Executes targeted recruiter missions in specific markets',                                     'growth',           'worker',         'active', '{}'),
  ('fcm-push-worker',          'FCM Push Worker',            'Firebase Cloud Messaging push notification delivery',                                          'comms',            'worker',         'active', '{"push_critical":true}'),
  ('notification-dispatch',    'Notification Dispatcher',    'Routes notifications to correct channel: push, email, SMS, in-app',                            'comms',            'worker',         'active', '{}'),
  ('notify-orchestrator',      'Notification Orchestrator',  'Dedupes, throttles, and orchestrates multi-channel notifications',                             'comms',            'worker',         'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 7: COMPLIANCE / ROUTE INTELLIGENCE CLUSTER
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('compliance-reminders-run', 'Compliance Reminder Agent',  'Sends compliance expiry reminders to operators (insurance, permits, certs)',                    'compliance',       'worker',          'active', '{"cron_expression":"0 9 * * *"}'),
  ('compliance-snapshot-gen',  'Compliance Snapshot Gen',    'Generates compliance snapshots for enterprise audit trails',                                   'compliance',       'worker',         'active', '{}'),
  ('check-regulations',        'Regulation Checker',         'Validates route compliance against jurisdiction regulations',                                  'compliance',       'worker',         'active', '{}'),
  ('reciprocity-check',        'Reciprocity Checker',        'Checks cross-state permit reciprocity for multi-state routes',                                 'compliance',       'worker',         'active', '{}'),
  ('insurance-ocr-parse',      'Insurance OCR Parser',       'Parses uploaded insurance documents via OCR for auto-verification',                            'compliance',       'worker',         'active', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- WAVE 8: SWARM LEGACY MERGE — add swarm agents to Command Layer
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_command_agents (slug, name, description, domain, adapter_type, status, config) VALUES
  ('market-mode-governor',     'Market Mode Governor',       'Nightly evaluation of market modes (seeding/live/rescue/shortage/waitlist/demand_capture)',      'command',          'worker',          'active', '{"cron_expression":"0 2 * * *","legacy_swarm":"nightly_market_mode_eval"}'),
  ('supply-gap-alerter',       'Supply Gap Alerter',         'Daily scan for markets with demand but insufficient supply',                                   'command',          'worker',          'active', '{"cron_expression":"0 3 * * *","legacy_swarm":"daily_supply_gap_scan"}'),
  ('claim-acceleration',       'Claim Acceleration Agent',   'Batch claim nudge processing for unclaimed high-view profiles',                                'growth',           'worker',          'active', '{"cron_expression":"0 4 * * *","legacy_swarm":"daily_claim_batch"}'),
  ('leakage-detection',        'Revenue Leak Detector',      'Daily scan for revenue leaks: unmonetized pages, broken sponsor slots, orphaned billing',      'monetization',     'worker',          'active', '{"cron_expression":"0 1 * * *","legacy_swarm":"daily_leak_scan"}'),
  ('swarm-scoreboard',         'Swarm Scoreboard Rollup',    'Daily aggregation of all agent activity into scoreboard metrics',                              'command',          'worker',          'active', '{"cron_expression":"0 6 * * *","legacy_swarm":"daily_scoreboard_rollup"}')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- HEARTBEAT DEFINITIONS for all new cron-cron_expressiond agents
-- ════════════════════════════════════════════════════════════════════════════







































COMMIT;
