-- =====================================================================
-- Haul Command Command Layer — Seed Data
-- Registers existing pg_cron jobs, edge functions, and workers
-- as formal Command Layer agents with heartbeat definitions.
-- Mode: ADDITIVE ONLY
-- =====================================================================
begin;

-- =====================================================================
-- AGENT REGISTRY SEED
-- Each agent represents an autonomous function already running in HC.
-- The 15+ pg_cron jobs + edge functions become registered agents.
-- =====================================================================

insert into public.hc_command_agents
    (slug, name, domain, adapter_type, description, budget_monthly_cents, status, markets)
values
    -- === DISPATCH & OPERATIONS ===
    ('dispatch-pulse',
     'Morning Pulse Dispatch',
     'dispatch_operations', 'worker',
     'Daily 07:00 ET dispatch: sends morning briefing digest to active operators with nearby load matches, availability nudges, and market heat strips.',
     0, 'active', '{US,CA,AU}'),

    ('stale-availability-reaper',
     'Stale Availability Reaper',
     'dispatch_operations', 'worker',
     'Runs expire_stale_availability() RPC: marks operators stale after 4h inactivity, offline after 48h. Protects broker trust in availability data.',
     0, 'active', '{US,CA,AU}'),

    ('geo-aggregator',
     'Geo Aggregator',
     'infrastructure_discovery', 'worker',
     'Every 15 minutes: aggregates geospatial data for corridor density, operator positions, and market heat calculations.',
     0, 'active', '{US,CA,AU}'),

    -- === BROKER ACQUISITION ===
    ('claim-nudge-engine',
     'Claim Nudge Engine',
     'broker_acquisition', 'worker',
     'Every 6 hours: identifies unclaimed profiles and sends claim pressure emails with FOMO signals (nearby claimed, market activity).',
     500, 'active', '{US,CA,AU}'),

    ('seed-claim-sequence',
     'Seed Claim Sequence',
     'operator_activation', 'worker',
     'Every 6 hours: checks launch gates and triggers new claim email sequences for recently seeded profiles.',
     500, 'active', '{US,CA,AU}'),

    ('broker-discovery-crawler',
     'Broker Discovery Crawler',
     'broker_acquisition', 'hybrid',
     'Discovers and enriches broker entities from extraction candidates → dispatcher graph edges. Builds the demand-side network graph.',
     2000, 'active', '{US,CA}'),

    -- === COMPLIANCE ===
    ('compliance-reminder',
     'Compliance Reminder Engine',
     'permit_compliance', 'worker',
     'Daily 09:00 UTC: checks permit expiration dates, certifications due for renewal, and sends compliance alerts.',
     200, 'active', '{US,CA,AU}'),

    -- === TRUST & PROOF ===
    ('leaderboard-snapshot',
     'Leaderboard Snapshot Engine',
     'trust_proof', 'worker',
     'Hourly: computes leaderboard rankings from trust scores, job completions, response times. Feeds directory visibility and social gravity.',
     0, 'active', '{US,CA,AU}'),

    ('trust-score-sync',
     'Trust Score Sync Worker',
     'trust_proof', 'worker',
     'Event-triggered via DB trigger: when trust_score changes on profiles, enqueues Typesense sync and logs os_event_log entry.',
     0, 'active', '{US,CA,AU}'),

    -- === SEO & CONTENT ===
    ('seo-governance',
     'Daily SEO Governance',
     'seo_surface', 'worker',
     'Daily 03:30 UTC: audits page freshness, canonical compliance, internal link graph health, and structured data coverage.',
     0, 'active', '{US,CA,AU}'),

    ('search-indexer',
     'Typesense Search Indexer',
     'seo_surface', 'worker',
     'Every 2 minutes: drains search_jobs queue to sync profile/load/entity changes into Typesense for instant search.',
     0, 'active', '{US,CA,AU}'),

    ('content-engine',
     'Autonomous Content Engine',
     'content_generation', 'agent',
     'Generates blog articles, glossary entries, and regulation summaries across 5 pillars. Consumes hc_content_generation_queue.',
     5000, 'active', '{US,CA,AU}'),

    -- === COMMS ===
    ('email-worker',
     'Email Send Worker',
     'dispatch_operations', 'worker',
     'Every 1 minute: drains email_jobs queue. Sends transactional and marketing emails via configured provider.',
     1000, 'active', '{US,CA,AU}'),

    ('email-digest-builder',
     'Monthly Digest Builder',
     'content_generation', 'worker',
     '1st of month 14:00 UTC: compiles monthly digest for all active users with market activity, platform updates, and achievement badges.',
     500, 'active', '{US,CA,AU}'),
    
    -- === MARKET INTELLIGENCE ===
    ('corridor-market-analyzer',
     'Corridor Market Analyzer',
     'corridor_demand', 'hybrid',
     'Computes corridor_market_metrics, scarcity_index, and surge_pricing from load/booking/availability data.',
     1000, 'active', '{US,CA}'),

    ('market-signal-processor',
     'Market Signal Processor',
     'market_intelligence', 'worker',
     'Processes market observations, correction events, and route friction data into actionable market signals.',
     500, 'active', '{US,CA,AU}'),

    -- === MONETIZATION ===
    ('adgrid-impression-tracker',
     'AdGrid Impression Tracker',
     'sponsor_inventory', 'worker',
     'Tracks ad impressions, clicks, and leads across AdGrid slots. Feeds ROI dashboard for sponsors.',
     0, 'active', '{US,CA,AU}'),

    ('stripe-usage-reporter',
     'Stripe Usage Reporter',
     'payment_recovery', 'worker',
     'Reports metered usage to Stripe for data product subscriptions. Drains stripe_usage_batches.',
     0, 'active', '{US,CA,AU}'),

    -- === MATERIALIZED VIEW REFRESHERS ===
    ('mv-refresher',
     'Materialized View Refresher',
     'market_intelligence', 'worker',
     '7 scheduled jobs refreshing materialized views for leaderboards, corridor stats, and market metrics.',
     0, 'active', '{US,CA,AU}')

on conflict (slug) do update set
    name = excluded.name,
    domain = excluded.domain,
    description = excluded.description,
    updated_at = now();

-- =====================================================================
-- HEARTBEAT DEFINITIONS SEED
-- Maps existing pg_cron schedules to formal heartbeat records
-- =====================================================================

insert into public.hc_command_heartbeats
    (slug, name, agent_id, trigger_type, cron_expression, action_type, can_write, can_notify, can_spend, enabled)
values
    ('hb-morning-pulse',
     'Morning Pulse Dispatch',
     (select id from public.hc_command_agents where slug = 'dispatch-pulse'),
     'schedule', '0 12 * * *', 'execute', true, true, false, true),

    ('hb-stale-reaper',
     'Stale Availability Expiry',
     (select id from public.hc_command_agents where slug = 'stale-availability-reaper'),
     'schedule', '*/30 * * * *', 'execute', true, false, false, true),

    ('hb-geo-aggregator',
     'Geo Aggregation Pass',
     (select id from public.hc_command_agents where slug = 'geo-aggregator'),
     'schedule', '*/15 * * * *', 'analyze', true, false, false, true),

    ('hb-claim-nudge',
     'Claim Pressure Nudge',
     (select id from public.hc_command_agents where slug = 'claim-nudge-engine'),
     'schedule', '0 */6 * * *', 'execute', true, true, true, true),

    ('hb-seed-claims',
     'Seed Claim Sequence',
     (select id from public.hc_command_agents where slug = 'seed-claim-sequence'),
     'schedule', '0 */6 * * *', 'execute', true, true, false, true),

    ('hb-compliance',
     'Compliance Reminder',
     (select id from public.hc_command_agents where slug = 'compliance-reminder'),
     'schedule', '0 9 * * *', 'alert', false, true, false, true),

    ('hb-leaderboard',
     'Leaderboard Snapshot',
     (select id from public.hc_command_agents where slug = 'leaderboard-snapshot'),
     'schedule', '0 * * * *', 'analyze', true, false, false, true),

    ('hb-trust-sync',
     'Trust Score Change Event',
     (select id from public.hc_command_agents where slug = 'trust-score-sync'),
     'event', null, 'execute', true, false, false, true),

    ('hb-seo-governance',
     'Daily SEO Governance',
     (select id from public.hc_command_agents where slug = 'seo-governance'),
     'schedule', '30 3 * * *', 'scan', false, false, false, true),

    ('hb-search-indexer',
     'Typesense Sync Drain',
     (select id from public.hc_command_agents where slug = 'search-indexer'),
     'schedule', '*/2 * * * *', 'execute', true, false, false, true),

    ('hb-email-worker',
     'Email Queue Drain',
     (select id from public.hc_command_agents where slug = 'email-worker'),
     'schedule', '* * * * *', 'execute', true, true, true, true),

    ('hb-monthly-digest',
     'Monthly Digest Build',
     (select id from public.hc_command_agents where slug = 'email-digest-builder'),
     'schedule', '0 14 1 * *', 'execute', true, true, true, true),

    ('hb-mv-refresh',
     'Materialized View Refresh',
     (select id from public.hc_command_agents where slug = 'mv-refresher'),
     'schedule', '*/30 * * * *', 'execute', true, false, false, true)

on conflict (slug) do update set
    name = excluded.name,
    trigger_type = excluded.trigger_type,
    cron_expression = excluded.cron_expression,
    action_type = excluded.action_type;

-- =====================================================================
-- PLAYBOOK SEED — Market Launch Template
-- =====================================================================

insert into public.hc_command_playbooks
    (slug, name, playbook_type, template, version)
values
    ('us-state-launch',
     'US State Market Launch',
     'market_launch',
     '{
        "description": "Launch a new US state market with full coverage",
        "steps": [
            {"order": 1, "action": "seed_state_corridors", "description": "Generate corridor pages for all major routes in state"},
            {"order": 2, "action": "seed_city_pages", "description": "Generate city pages for top 20 cities by population"},
            {"order": 3, "action": "seed_regulation_page", "description": "Generate state-specific regulation summary"},
            {"order": 4, "action": "seed_operator_profiles", "description": "Import known operators from USDOT/MC data"},
            {"order": 5, "action": "activate_claim_nudges", "description": "Enable claim nudge emails for seeded profiles"},
            {"order": 6, "action": "activate_adgrid_slots", "description": "Create AdGrid slots for state + top corridors"},
            {"order": 7, "action": "activate_seo_interlinking", "description": "Wire internal links: state→cities, cities→corridors, corridors→operators"},
            {"order": 8, "action": "evaluate_readiness", "description": "Run readiness gate evaluation for the market"}
        ],
        "agents_required": [
            "dispatch-pulse", "claim-nudge-engine", "seo-governance",
            "geo-aggregator", "leaderboard-snapshot", "content-engine"
        ],
        "estimated_duration_days": 14,
        "readiness_gates": ["corridor_health_score_avg", "active_escort_density_met"]
     }'::jsonb,
     1),

    ('country-expansion',
     'Country Market Launch (120-Country)',
     'market_launch',
     '{
        "description": "Launch a new country market with localized coverage",
        "steps": [
            {"order": 1, "action": "validate_country_registry", "description": "Verify country exists in HC 120-country registry"},
            {"order": 2, "action": "seed_country_page", "description": "Generate country landing page with local regulations overview"},
            {"order": 3, "action": "seed_region_pages", "description": "Generate region/state/province pages"},
            {"order": 4, "action": "seed_major_corridors", "description": "Generate top 10 corridor pages for the country"},
            {"order": 5, "action": "localize_terminology", "description": "Map local role aliases (pilot car, escort vehicle, etc.)"},
            {"order": 6, "action": "seed_regulation_summary", "description": "Generate regulation page with confidence_state and official_source"},
            {"order": 7, "action": "activate_adgrid_country", "description": "Create AdGrid country takeover inventory"},
            {"order": 8, "action": "activate_waitlist", "description": "Enable waitlist signup for operators in new market"}
        ],
        "agents_required": [
            "content-engine", "seo-governance", "geo-aggregator"
        ],
        "estimated_duration_days": 30,
        "country_tier_mapping": "Tier A=14d, Tier B=21d, Tier C=30d, Tier D/E=45d"
     }'::jsonb,
     1)

on conflict (slug) do update set
    template = excluded.template,
    version = excluded.version + 1,
    updated_at = now();

commit;
