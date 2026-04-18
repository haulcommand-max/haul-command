-- ============================================================================
-- Migration: 20260412_paperclip_120_country_maximum_yield.sql
-- Purpose: MAXIMIZE the Paperclip Control Plane for Haul Command's 120-country
--          ecosystem. Every Edge Function = an employee. Every country = a market.
--          Every domain = a department. Zero orphans. Zero dormant agents.
-- 
-- Architecture: Paperclip (github.com/paperclipai/paperclip) adapted for
--               global logistics with 6-axis trust, 120 jurisdictions,
--               and revenue-proof operations.
--
-- Upgrade-only. Additive. Never downgrade.
-- ============================================================================
BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. EXPAND ALL AGENTS TO 120-COUNTRY COVERAGE
--    Gold tier = immediate execution priority
--    Silver/Blue = next-wave execution
--    Slate/Copper = waitlist/seed mode
-- ════════════════════════════════════════════════════════════════════════════

-- Gold tier countries (10): highest priority, full agent activation
-- US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR
UPDATE public.hc_command_agents
SET markets = '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
    updated_at = now()
WHERE (markets IS NULL OR markets = '{}' OR markets = '{US,CA,AU}')
  AND domain IN (
    'dispatch', 'dispatch_operations', 'growth', 'trust', 'trust_proof',
    'broker_acquisition', 'operator_activation', 'payments', 'payment_recovery',
    'compliance', 'permit_compliance', 'presence', 'pricing', 'monetization',
    'sponsor_inventory', 'adgrid', 'defense', 'telemetry'
  );

-- Content/SEO/Intelligence agents get ALL 120 countries (they scale globally)
UPDATE public.hc_command_agents
SET markets = (
    SELECT array_agg(code ORDER BY code)
    FROM public.countries
),
    updated_at = now()
WHERE domain IN (
    'seo', 'seo_surface', 'content_generation', 'intelligence',
    'market_intelligence', 'corridor_demand', 'map', 'infrastructure_discovery'
);

-- Command/comms/operations get gold+silver (36 countries)
UPDATE public.hc_command_agents
SET markets = '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR,AR,BH,BG,CL,CO,HR,CZ,EE,GR,HU,JP,KW,LV,LT,MY,OM,PE,PH,PL,RO,SG,SK,SI,KR,TR,VN}',
    updated_at = now()
WHERE domain IN ('command', 'comms', 'operations');

-- ════════════════════════════════════════════════════════════════════════════
-- 2. REGISTER MISSING ROLE-SPECIFIC AGENTS
--    Each HC role = an agent responsible for that role's lifecycle
--    Maps to Paperclip's "treat each tool as an employee" principle
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.hc_command_agents
    (slug, name, domain, adapter_type, description, budget_monthly_cents, status, markets, config)
VALUES
    -- === ROLE LIFECYCLE AGENTS (each role = autonomous employee) ===
    ('role-pilot-car-operator',
     'Pilot Car Operator Lifecycle',
     'growth', 'agent',
     'Manages the full lifecycle for pilot car operators: profile seeding, claim activation, training enrollment, certification tracking, availability monitoring, and trust score maintenance across all markets.',
     2000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "pilot_car_operator", "revenue_critical": true}'::jsonb),

    ('role-escort-vehicle-driver',
     'Escort Vehicle Driver Lifecycle',
     'growth', 'agent',
     'Handles escort vehicle driver onboarding, compliance verification, equipment certification, route qualification, and market matching.',
     2000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "escort_vehicle_driver", "revenue_critical": true}'::jsonb),

    ('role-heavy-haul-driver',
     'Heavy Haul Driver Lifecycle',
     'growth', 'agent',
     'Manages oversize/overweight load driver profiles: USDOT/MC verification, permit stacking, route planning authorization, and insurance compliance.',
     2000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "heavy_haul_driver", "revenue_critical": true}'::jsonb),

    ('role-broker',
     'Broker Lifecycle Agent',
     'broker_acquisition', 'agent',
     'Manages freight broker onboarding: authority verification, credit scoring, load posting permissions, escort matching, and settlement custody.',
     5000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "broker", "revenue_critical": true}'::jsonb),

    ('role-shipper',
     'Shipper Lifecycle Agent',
     'broker_acquisition', 'agent',
     'Handles shipper account creation, load intake, permit procurement, route survey requests, and escort dispatch workflows.',
     3000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "shipper", "revenue_critical": true}'::jsonb),

    ('role-dispatcher',
     'Dispatcher Lifecycle Agent',
     'dispatch', 'agent',
     'Manages dispatcher accounts: fleet association, load assignment authority, real-time GPS tracking permissions, and performance metrics.',
     1000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "dispatcher"}'::jsonb),

    ('role-fleet-owner',
     'Fleet Owner Lifecycle Agent',
     'growth', 'agent',
     'Handles fleet company registration, vehicle rostering, insurance bundle management, multi-driver coordination, and enterprise billing.',
     3000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "fleet_owner", "revenue_critical": true}'::jsonb),

    ('role-dot-officer',
     'DOT/Regulatory Officer Agent',
     'compliance', 'agent',
     'Manages regulatory authority accounts: inspection scheduling, compliance verification dashboards, enforcement data feeds, and certification recognition.',
     500, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "dot_officer"}'::jsonb),

    ('role-training-provider',
     'Training Provider Lifecycle Agent',
     'content_generation', 'agent',
     'Handles training organization registration, course catalog management, instructor credentialing, certification issuance, and completion tracking.',
     2000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "training_provider", "revenue_critical": true}'::jsonb),

    ('role-insurance-agent',
     'Insurance Agent Lifecycle',
     'compliance', 'agent',
     'Manages insurance provider accounts: policy verification APIs, coverage monitoring, claims integration, and renewal alerting.',
     1000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "insurance_agent"}'::jsonb),

    ('role-permit-service',
     'Permit Service Provider Agent',
     'permit_compliance', 'agent',
     'Handles permit service company onboarding: jurisdiction mapping, superload permit processing, state-by-state fee calculation, and digital permit delivery.',
     3000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "permit_service", "revenue_critical": true}'::jsonb),

    ('role-surveyor',
     'Route Surveyor Agent',
     'operations', 'agent',
     'Manages route survey personnel: pre-trip inspection assignments, bridge clearance verification, utility crossing coordination, and hazard documentation.',
     1000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "surveyor"}'::jsonb),

    ('role-crane-operator',
     'Crane & Rigging Operator Agent',
     'operations', 'agent',
     'Handles crane/rigging operator profiles: certification tracking (NCCCO, etc.), load chart verification, mobilization scheduling, and insurance validation.',
     1000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "crane_operator"}'::jsonb),

    ('role-flag-person',
     'Flag Person / Traffic Control Agent',
     'operations', 'agent',
     'Manages certified flagger profiles: ATSSA/state certification tracking, work zone safety compliance, availability scheduling, and incident reporting.',
     500, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "flag_person"}'::jsonb),

    -- === ORGANIZATIONAL HIERARCHY (Paperclip CEO/VP/Director model) ===
    ('ceo-paperclip',
     'CEO — Haul Command OS',
     'command', 'agent',
     'Top-level orchestrator. Sets global strategy, approves budget overrides, hires/fires agents, and evaluates quarterly performance across all 120 markets. Reports to William (human board).',
     0, 'active',
     (SELECT array_agg(code ORDER BY code) FROM public.countries),
     '{"role": "ceo", "reports_to": "william", "authority": "full"}'::jsonb),

    ('vp-growth',
     'VP Growth — Global Operator Acquisition',
     'growth', 'agent',
     'Owns the growth funnel across all 120 countries: claim velocity, activation rate, retention, and network density metrics. Manages all role-* agents and the claim engine.',
     10000, 'active',
     (SELECT array_agg(code ORDER BY code) FROM public.countries),
     '{"role": "vp", "department": "growth", "kpis": ["claim_rate", "activation_rate", "30d_retention", "network_density"]}'::jsonb),

    ('vp-revenue',
     'VP Revenue — Monetization & Yield',
     'monetization', 'agent',
     'Owns all revenue streams: AdGrid yield, sponsorship sales, data products, permit fees, training enrollment, and subscription MRR. Zero leakage mandate.',
     15000, 'active',
     (SELECT array_agg(code ORDER BY code) FROM public.countries),
     '{"role": "vp", "department": "revenue", "kpis": ["mrr", "arpu", "adgrid_fill_rate", "leakage_pct"]}'::jsonb),

    ('vp-trust',
     'VP Trust & Compliance',
     'trust', 'agent',
     'Owns the 6-axis trust engine, fraud detection, KYC pipeline, insurance verification, and regulatory compliance across all jurisdictions.',
     5000, 'active',
     (SELECT array_agg(code ORDER BY code) FROM public.countries),
     '{"role": "vp", "department": "trust", "kpis": ["trust_score_avg", "fraud_rate", "kyc_completion", "insurance_coverage"]}'::jsonb),

    ('vp-intelligence',
     'VP Intelligence & Data',
     'intelligence', 'agent',
     'Owns market intelligence, corridor analytics, pricing oracle, demand prediction, and competitive moat data. Feeds all other VPs.',
     8000, 'active',
     (SELECT array_agg(code ORDER BY code) FROM public.countries),
     '{"role": "vp", "department": "intelligence", "kpis": ["corridor_coverage", "pricing_accuracy", "market_signal_freshness"]}'::jsonb),

    ('vp-operations',
     'VP Operations — Global Dispatch',
     'dispatch', 'agent',
     'Owns real-time dispatch, load matching, availability management, and SLA enforcement. Ensures every load finds an escort within 15 minutes in active markets.',
     5000, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "vp", "department": "operations", "kpis": ["fill_rate", "match_time_p50", "sla_compliance", "dispatch_utilization"]}'::jsonb),

    ('vp-seo',
     'VP SEO & Content Authority',
     'seo', 'agent',
     'Owns organic search domination: 120-country page manufacturing, internal link graph health, crawl budget, structured data, and content freshness governance.',
     5000, 'active',
     (SELECT array_agg(code ORDER BY code) FROM public.countries),
     '{"role": "vp", "department": "seo", "kpis": ["indexed_pages", "crawl_health", "organic_traffic", "serp_positions"]}'::jsonb),

    -- === COUNTRY-TIER REGIONAL DIRECTORS ===
    ('director-gold-markets',
     'Director — Gold Tier Markets (US/CA/AU/GB/DE/NL/NZ/ZA/AE/BR)',
     'command', 'agent',
     'Regional director overseeing the 10 gold-tier markets with highest revenue priority. Coordinates all VPs for gold-tier execution.',
     0, 'active',
     '{US,CA,AU,GB,DE,NL,NZ,ZA,AE,BR}',
     '{"role": "director", "tier": "gold", "reports_to": "ceo-paperclip"}'::jsonb),

    ('director-silver-markets',
     'Director — Silver Tier Markets (26 countries)',
     'command', 'agent',
     'Regional director for silver-tier expansion markets. Manages seeding, waitlist conversion, and early monetization across 26 countries.',
     0, 'active',
     '{AR,BH,BG,CL,CO,HR,CZ,EE,GR,HU,JP,KW,LV,LT,MY,OM,PE,PH,PL,RO,SG,SK,SI,KR,TR,VN}',
     '{"role": "director", "tier": "silver", "reports_to": "ceo-paperclip"}'::jsonb),

    ('director-blue-markets',
     'Director — Blue Tier Markets (18 countries)',
     'command', 'agent',
     'Regional director for blue-tier growth markets. Focuses on content seeding, regulation capture, and directory launch across 18 countries.',
     0, 'active',
     '{AT,BE,DK,FI,FR,IN,ID,IE,IT,MX,NO,PT,QA,SA,ES,SE,CH,TH}',
     '{"role": "director", "tier": "blue", "reports_to": "ceo-paperclip"}'::jsonb),

    ('director-emerging-markets',
     'Director — Slate+Copper Tier (66 countries)',
     'command', 'agent',
     'Regional director for emerging markets. Manages content pre-seeding, market-mode evaluation, and readiness gate tracking across 66 countries.',
     0, 'active',
     '{AL,DZ,AO,AZ,BD,BO,BA,BW,BN,KH,CM,CI,CR,CY,DO,EC,EG,SV,ET,GE,GH,GT,GY,HN,IS,IL,IQ,JM,JO,KZ,KE,KG,LA,LU,MG,MW,MT,MD,ME,MN,MA,MZ,NA,NP,NG,NI,MK,PK,PA,PG,PY,RS,RW,SN,LK,SR,TW,TZ,TN,TT,TM,UA,UG,UY,UZ,ZM}',
     '{"role": "director", "tier": "emerging", "reports_to": "ceo-paperclip"}'::jsonb)

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    markets = EXCLUDED.markets,
    config = EXCLUDED.config,
    budget_monthly_cents = EXCLUDED.budget_monthly_cents,
    updated_at = now();

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ADD MISSING PLAYBOOKS — Role Onboarding + Market Launch Templates
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.hc_command_playbooks
    (slug, name, playbook_type, template, version)
VALUES
    ('operator-onboarding',
     'Operator Onboarding Playbook',
     'operator_activation',
     '{
        "description": "Full operator onboarding from signup to first job",
        "steps": [
            {"order": 1, "action": "verify_identity", "agent": "kyc-webhook-handler", "description": "KYC identity verification through vendor"},
            {"order": 2, "action": "verify_insurance", "agent": "insurance-ocr-parse", "description": "OCR parse insurance certificate"},
            {"order": 3, "action": "verify_equipment", "agent": "role-escort-vehicle-driver", "description": "Vehicle + equipment checklist"},
            {"order": 4, "action": "enroll_training", "agent": "role-training-provider", "description": "Auto-enroll in required certification courses"},
            {"order": 5, "action": "activate_availability", "agent": "presence-and-availability-core", "description": "Enable availability toggle"},
            {"order": 6, "action": "seed_trust_score", "agent": "compute-trust-score", "description": "Initialize trust score with Bayesian prior"},
            {"order": 7, "action": "create_directory_listing", "agent": "search-indexer", "description": "Sync to Typesense directory"},
            {"order": 8, "action": "send_welcome_sequence", "agent": "claim-welcome-sequence", "description": "Trigger 7-day welcome email drip"}
        ],
        "estimated_duration_days": 3,
        "roles_supported": ["pilot_car_operator", "escort_vehicle_driver", "heavy_haul_driver", "flag_person", "crane_operator", "surveyor"]
     }'::jsonb,
     1),

    ('broker-onboarding',
     'Broker Onboarding Playbook',
     'broker_acquisition',
     '{
        "description": "Freight broker onboarding: authority → credit → dispatch access",
        "steps": [
            {"order": 1, "action": "verify_authority", "agent": "role-broker", "description": "Verify MC/DOT authority status via FMCSA"},
            {"order": 2, "action": "credit_check", "agent": "role-broker", "description": "Run credit/surety bond verification"},
            {"order": 3, "action": "stripe_connect", "agent": "hc_webhook_stripe", "description": "Set up Stripe Connect for escrow payments"},
            {"order": 4, "action": "enable_load_posting", "agent": "jobs-create-from-offer", "description": "Unlock load board posting"},
            {"order": 5, "action": "match_algorithms", "agent": "match-generate", "description": "Configure matching preferences"},
            {"order": 6, "action": "training_enrollment", "agent": "role-training-provider", "description": "Enroll in broker compliance training"},
            {"order": 7, "action": "activate_adgrid", "agent": "adgrid-yield-core", "description": "Offer sponsorship/featured placement"},
            {"order": 8, "action": "welcome_sequence", "agent": "claim-welcome-sequence", "description": "Broker-specific onboarding emails"}
        ],
        "estimated_duration_days": 5,
        "roles_supported": ["broker", "shipper", "fleet_owner"]
     }'::jsonb,
     1),

    ('gold-market-launch',
     'Gold Tier Market Launch (Full Activation)',
     'market_launch',
     '{
        "description": "Launch a gold-tier market with full monetization, dispatch, and compliance",
        "steps": [
            {"order": 1, "action": "regulation_capture", "agent": "check-regulations", "description": "Scrape and verify jurisdiction-specific regulations"},
            {"order": 2, "action": "corridor_mapping", "agent": "corridor-market-analyzer", "description": "Map top 50 corridors with demand signals"},
            {"order": 3, "action": "operator_seeding", "agent": "assign-seeds", "description": "Import known operators from public registries"},
            {"order": 4, "action": "claim_activation", "agent": "claim-nudge-engine", "description": "Begin claim pressure for seeded profiles"},
            {"order": 5, "action": "training_localization", "agent": "role-training-provider", "description": "Localize training content for jurisdiction"},
            {"order": 6, "action": "pricing_calibration", "agent": "rate-index-recompute", "description": "Set corridor rate benchmarks from market data"},
            {"order": 7, "action": "adgrid_inventory", "agent": "hc_ad_inventory_generator", "description": "Create AdGrid slots for state/region/corridor pages"},
            {"order": 8, "action": "seo_page_factory", "agent": "geo-content-gap-filler", "description": "Generate all city/corridor/regulation pages"},
            {"order": 9, "action": "dispatch_activation", "agent": "dispatch-pulse", "description": "Enable real-time dispatch matching"},
            {"order": 10, "action": "readiness_gate", "agent": "ceo-paperclip", "description": "Evaluate market readiness gate: density, coverage, compliance"}
        ],
        "estimated_duration_days": 14,
        "tier": "gold",
        "agents_required": ["check-regulations", "corridor-market-analyzer", "assign-seeds", "claim-nudge-engine", "rate-index-recompute", "hc_ad_inventory_generator", "geo-content-gap-filler", "dispatch-pulse"],
        "readiness_gates": ["min_3_operators", "regulation_page_published", "min_5_corridors", "adgrid_slots_created"]
     }'::jsonb,
     1),

    ('emerging-market-seed',
     'Emerging Market Pre-Seed (Slate/Copper)',
     'market_launch',
     '{
        "description": "Lightweight market seeding for 66 emerging countries — content-first, zero ops cost",
        "steps": [
            {"order": 1, "action": "country_page_generate", "agent": "content-engine", "description": "Generate localized country landing page"},
            {"order": 2, "action": "regulation_stub", "agent": "check-regulations", "description": "Create regulation stub with confidence_state=unverified"},
            {"order": 3, "action": "glossary_localize", "agent": "docs-init-upload", "description": "Localize glossary terms for local role aliases"},
            {"order": 4, "action": "waitlist_activate", "agent": "role-pilot-car-operator", "description": "Enable operator waitlist signup"},
            {"order": 5, "action": "seo_interlinking", "agent": "seo-governance", "description": "Wire internal links: country→region→global hub pages"}
        ],
        "estimated_duration_days": 45,
        "tier": "emerging",
        "agents_required": ["content-engine", "check-regulations", "docs-init-upload", "seo-governance"],
        "readiness_gates": ["country_page_indexed", "waitlist_live"]
     }'::jsonb,
     1)

ON CONFLICT (slug) DO UPDATE SET
    template = EXCLUDED.template,
    version = EXCLUDED.version + 1,
    updated_at = now();

-- ════════════════════════════════════════════════════════════════════════════
-- 4. ADD HEARTBEATS FOR NEW AGENTS (scheduled execution patterns)
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.hc_command_heartbeats
    (slug, name, agent_id, trigger_type, cron_expression, action_type, can_write, can_notify, can_spend, enabled)
VALUES
    -- CEO daily strategy review
    ('hb-ceo-daily',
     'CEO Daily Strategy Review',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-paperclip'),
     'schedule', '0 6 * * *', 'analyze', false, true, false, true),

    -- VP reports (weekly)
    ('hb-vp-growth-weekly',
     'VP Growth Weekly Report',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-growth'),
     'schedule', '0 14 * * 1', 'analyze', true, true, false, true),

    ('hb-vp-revenue-weekly',
     'VP Revenue Weekly Report',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-revenue'),
     'schedule', '0 14 * * 1', 'analyze', true, true, false, true),

    ('hb-vp-trust-weekly',
     'VP Trust Weekly Report',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-trust'),
     'schedule', '0 14 * * 2', 'analyze', true, true, false, true),

    -- Regional director monthly reviews
    ('hb-director-gold-monthly',
     'Gold Tier Monthly Review',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'director-gold-markets'),
     'schedule', '0 10 1 * *', 'analyze', false, true, false, true),

    ('hb-director-silver-monthly',
     'Silver Tier Monthly Review',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'director-silver-markets'),
     'schedule', '0 10 2 * *', 'analyze', false, true, false, true),

    ('hb-director-blue-monthly',
     'Blue Tier Monthly Review',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'director-blue-markets'),
     'schedule', '0 10 3 * *', 'analyze', false, true, false, true),

    ('hb-director-emerging-monthly',
     'Emerging Tier Monthly Review',
     (SELECT id FROM public.hc_command_agents WHERE slug = 'director-emerging-markets'),
     'schedule', '0 10 4 * *', 'analyze', false, true, false, true)

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    trigger_type = EXCLUDED.trigger_type,
    cron_expression = EXCLUDED.cron_expression;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. AGENT ORG CHART — Wire reports_to hierarchy
--    CEO → VPs → Directors → Domain Agents
-- ════════════════════════════════════════════════════════════════════════════

-- VPs report to CEO
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-paperclip')
WHERE slug LIKE 'vp-%';

-- Directors report to CEO
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-paperclip')
WHERE slug LIKE 'director-%';

-- Growth domain agents → VP Growth
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-growth')
WHERE domain IN ('growth', 'broker_acquisition', 'operator_activation')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'director-%'
  AND slug NOT LIKE 'ceo-%';

-- Revenue domain agents → VP Revenue
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-revenue')
WHERE domain IN ('monetization', 'adgrid', 'sponsor_inventory', 'payments', 'payment_recovery')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'ceo-%';

-- Trust domain agents → VP Trust
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-trust')
WHERE domain IN ('trust', 'trust_proof', 'compliance', 'permit_compliance', 'defense')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'ceo-%';

-- Intelligence domain agents → VP Intelligence
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-intelligence')
WHERE domain IN ('intelligence', 'market_intelligence', 'corridor_demand', 'pricing')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'ceo-%';

-- Operations domain agents → VP Operations
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-operations')
WHERE domain IN ('dispatch', 'dispatch_operations', 'operations', 'presence', 'telemetry', 'map')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'ceo-%';

-- SEO/Content domain agents → VP SEO
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-seo')
WHERE domain IN ('seo', 'seo_surface', 'content_generation', 'infrastructure_discovery')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'ceo-%';

-- Comms/Command agents → CEO directly
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-paperclip')
WHERE domain IN ('comms', 'command')
  AND slug NOT LIKE 'vp-%'
  AND slug NOT LIKE 'director-%'
  AND slug != 'ceo-paperclip';

-- ════════════════════════════════════════════════════════════════════════════
-- 6. INITIAL SCOREBOARD ENTRY — Day Zero baseline
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.hc_command_scoreboard (
    id              uuid primary key default gen_random_uuid(),
    executions_today integer default 0,
    claims_driven   integer default 0,
    revenue_influenced decimal default 0,
    domain_breakdown jsonb default '{}',
    computed_at     timestamptz not null default now()
);

INSERT INTO public.hc_command_scoreboard
    (executions_today, claims_driven, revenue_influenced, computed_at, domain_breakdown)
SELECT
    0, 0, 0, now(),
    jsonb_build_object(
        'total_agents', (SELECT count(*) FROM public.hc_command_agents),
        'total_heartbeats', (SELECT count(*) FROM public.hc_command_heartbeats),
        'total_playbooks', (SELECT count(*) FROM public.hc_command_playbooks),
        'total_countries', (SELECT count(*) FROM public.countries),
        'gold_markets', 10,
        'silver_markets', 26,
        'blue_markets', 18,
        'emerging_markets', 66,
        'edge_functions_deployed', 110,
        'migration_note', 'Paperclip 120-Country Maximum Yield — Day Zero'
    )
WHERE NOT EXISTS (
    SELECT 1 FROM public.hc_command_scoreboard
    WHERE computed_at > now() - interval '1 hour'
);

COMMIT;
