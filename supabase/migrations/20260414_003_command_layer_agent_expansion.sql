-- =====================================================================
-- Haul Command Command Layer — Agent and Role Expansion
-- Applies the "Smash Together" rule: combining the existing Paperclip
-- infrastructure with the granular new 15X Command OS agent taxonomy.
-- Mode: ADDITIVE ONLY
-- =====================================================================
begin;

-- =====================================================================
-- 1) HYBRID / AGENT REASONING LAYER SEED
-- =====================================================================

insert into public.hc_command_agents
    (slug, name, domain, adapter_type, description, budget_monthly_cents, status)
values
    -- Board Layer
    ('agt_board_orchestrator', 'Board Orchestrator', 'strategic_operations', 'agent', 'Translate executive-level goals into portfolio-level operating priorities. Oversees all automated operations.', 100000, 'active'),
    ('agt_global_ops_brain', 'Global Operations Brain', 'strategic_operations', 'agent', 'Top-level allocator across markets, functions, budgets, and escalations. Solves resourcing bottlenecks.', 50000, 'active'),
    
    -- Market Growth
    ('agt_market_expansion', 'Market Expansion Agent', 'market_growth', 'agent', 'Analyzes signal density to choose where Haul Command expands next.', 20000, 'active'),
    ('agt_market_seed', 'Market Seed Agent', 'market_growth', 'hybrid', 'Seeds basic listings, local infrastructure, localized glossary, and first surfaces for launch candidates.', 10000, 'active'),
    ('agt_claim_acceleration', 'Claim Acceleration Agent', 'market_growth', 'agent', 'Develops and tests value-before-claim loops to increase profile/listing claim rates.', 5000, 'active'),
    
    -- Broker Side
    ('agt_broker_acquisition', 'Broker Acquisition Agent', 'broker_operations', 'agent', 'Converts parsed load board data into claimed Haul Command broker surfaces using outreach.', 10000, 'active'),
    ('agt_load_ingest', 'Load Ingest Agent', 'broker_operations', 'hybrid', 'Converts unstructured and parsed load observations into structured market intelligence.', 5000, 'active'),
    ('agt_broker_reactivation', 'Broker Reactivation Agent', 'broker_operations', 'agent', 'Re-engages dormant brokers, pushing them toward posting jobs and claiming profiles.', 5000, 'active'),
    
    -- Operator Side
    ('agt_operator_activation', 'Operator Activation Agent', 'operator_operations', 'agent', 'Advances discovered operators through claimed, verified, and trusted stages.', 10000, 'active'),
    ('agt_operator_profile_freshness', 'Operator Freshness Agent', 'operator_operations', 'agent', 'Detects stale profiles and coordinates update routines to keep data actionable.', 5000, 'active'),
    ('agt_operator_reputation', 'Operator Reputation Agent', 'trust_proof', 'agent', 'Compiles historical performance into report-card style trust evidence.', 15000, 'active'),
    
    -- Corridor and Route
    ('agt_corridor_intelligence', 'Corridor Intelligence Agent', 'corridor_demand', 'hybrid', 'Tracks demand, route stress, scarcity, and market changes heavily affecting key routes.', 20000, 'active'),
    ('agt_route_risk', 'Route Risk Agent', 'corridor_demand', 'agent', 'Surfaces route-support requirements, local restrictions, and operational risk parameters.', 15000, 'active'),
    
    -- Trust, Proof, Money
    ('agt_trust_proof', 'Trust and Proof Agent', 'trust_proof', 'agent', 'Validates compile evidence packets and maintains trust signal integrity against fraudulent manipulation.', 50000, 'active'),
    ('agt_invoice_recovery', 'Invoice Recovery Agent', 'payment_recovery', 'agent', 'Opens and advances B2B payment recovery workflows using proof-backed legal/operational pressure.', 20000, 'active'),
    ('agt_monetization_optimizer', 'Monetization Optimizer Agent', 'sponsor_inventory', 'agent', 'Tunes sponsor slot pricing, paid surface yield, and premium tier upgrade paths.', 10000, 'active'),
    
    -- Compliance & Training
    ('agt_training_builder', 'Training Builder Agent', 'permit_compliance', 'agent', 'Expands training modules, designs curriculum logic, and verifies knowledge evidence flow.', 25000, 'active'),
    ('agt_regulation_watch', 'Regulation Watch Agent', 'permit_compliance', 'agent', 'Analyzes government sites to monitor rules and detects physical regulation changes by jurisdiction.', 15000, 'active'),
    
    -- Infrastructure Marketplace
    ('agt_infrastructure_hunter', 'Infrastructure Hunter Agent', 'infrastructure_discovery', 'agent', 'Searches maps, directories, and reviews to identify yards, hotels, and heavy haul support nodes.', 20000, 'active'),
    ('agt_route_ready_marketplace', 'RouteReady Marketplace Agent', 'sponsor_inventory', 'agent', 'Matches physical products, installers, and fleet fitment needs to ecosystem demand.', 10000, 'active'),
    
    -- SEO Content
    ('agt_seo_surface', 'SEO Surface Agent', 'seo_surface', 'hybrid', 'Governs publishing and refreshing high-value public surfaces and entity profiles for indexation.', 20000, 'active'),
    ('agt_glossary_authority', 'Glossary Authority Agent', 'seo_surface', 'agent', 'Maintains taxonomy ownership over terms, industry aliases, and knowledge graph mapping.', 5000, 'active'),
    ('agt_internal_linking', 'Internal Linking Agent', 'seo_surface', 'hybrid', 'Navigates dead-ends, resolves orphan pages, and strengthens crawl paths.', 5000, 'active'),
    
    -- Quality Control
    ('agt_qa_browser', 'QA Browser Agent', 'strategic_operations', 'agent', 'Navigates and clicks through core UI flows to validate front-end changes and attach rendering proof.', 30000, 'active'),
    ('agt_eval_engineer', 'Eval Engineer Agent', 'strategic_operations', 'agent', 'Reviews failure traces from other agents and improves prompts, contracts, and error handling.', 30000, 'active'),
    ('agt_taste_guard', 'Taste Guard Agent', 'seo_surface', 'agent', 'Visual and content auditor checking if UI/content outputs match Haul Command premium standards.', 15000, 'active')

on conflict (slug) do update set
    name = excluded.name,
    domain = excluded.domain,
    adapter_type = excluded.adapter_type,
    description = excluded.description;

-- =====================================================================
-- 2) DETERMINISTIC WORKERS
-- =====================================================================

insert into public.hc_command_agents
    (slug, name, domain, adapter_type, description, status)
values
    ('wrk_entity_dedupe', 'Entity Deduplication Worker', 'strategic_operations', 'worker', 'Deterministic clustering and deduplication logic for entities.', 'active'),
    ('wrk_profile_shell_publisher', 'Profile Shell Publisher', 'seo_surface', 'worker', 'Creates and refreshes rapid profile/listing shells for newly discovered entities.', 'active'),
    ('wrk_surface_publisher', 'Surface Publisher', 'seo_surface', 'worker', 'Pushes internal outcomes to public SSR surfaces (Next.js rendering integration).', 'active'),
    ('wrk_market_score_recalculator', 'Market Score Recalculator', 'market_growth', 'worker', 'Periodically recomputes supply/demand/trust priority signals for UI indicators.', 'active'),
    ('wrk_proof_packet_compiler', 'Proof Packet Compiler', 'trust_proof', 'worker', 'Deterministic evidence JSON bundler preparing state for review (creates PDFs, fetches screenshots).', 'active'),
    ('wrk_notification_dispatcher', 'Notification Dispatcher', 'dispatch_operations', 'worker', 'Routes messages (FCM/Email/SMS) utilizing priority heuristics.', 'active'),
    ('wrk_sponsor_allocator', 'Sponsor Allocator', 'sponsor_inventory', 'worker', 'Manages rotation, pacing, and placement of commercial inventory.', 'active'),
    ('wrk_rule_snapshot_fetcher', 'Rule Snapshot Fetcher', 'permit_compliance', 'worker', 'Runs chron jobs fetching DOT/governmental regulatory sources at specific URLs.', 'active'),
    ('wrk_corridor_signal_aggregator', 'Corridor Signal Aggregator', 'corridor_demand', 'worker', 'Aggregates point geometries to linestrings calculating real-time stress load.', 'active'),
    ('wrk_roi_attributor', 'ROI Attributor Worker', 'strategic_operations', 'worker', 'Batch computes cost and revenue mapping them to agent tasks/runs.', 'active'),
    ('wrk_claim_prompt_router', 'Claim Prompt Router', 'operator_operations', 'worker', 'Dispatches nudges and notifications directly targeting unregistered operator claiming.', 'active')

on conflict (slug) do update set
    name = excluded.name,
    adapter_type = excluded.adapter_type,
    description = excluded.description;

-- =====================================================================
-- 3) HEARTBEAT EXPANSION
-- Integrating the newly proposed specific scopes
-- =====================================================================

insert into public.hc_command_heartbeats
    (slug, name, trigger_type, action_type, can_write, can_notify, can_spend, enabled)
values
    -- Market Truth
    ('hbt_market_truth', 'Market Truth Evaluator', 'schedule', 'analyze', true, false, false, true),
    
    -- Broker Operations
    ('hbt_broker_ingest', 'Broker Data Sync', 'event', 'propose', true, false, false, true),
    
    -- Operator Operations
    ('hbt_operator_activation', 'Operator Activation Escalations', 'schedule', 'execute', true, true, false, true),
    
    -- Surface Freshness
    ('hbt_profile_freshness', 'Profile Shell Decay Scanner', 'schedule', 'scan', false, false, false, true),
    
    -- Corridors
    ('hbt_corridor_watch', 'Corridor Analytics Sweep', 'schedule', 'analyze', true, false, false, true),
    
    -- Finance tracking
    ('hbt_recovery_followup', 'Recovery Work Queue Polling', 'schedule', 'execute', true, true, false, true),
    
    -- Training
    ('hbt_training_expiry', 'Training Expiration Notifier', 'schedule', 'alert', true, true, false, true),
    
    -- Compliance and Law
    ('hbt_regulation_watch', 'Regulation Data Refetching', 'schedule', 'analyze', true, false, false, true),
    
    -- Sponsor & Ads
    ('hbt_sponsor_yield', 'Sponsor Inventory Yield Check', 'schedule', 'analyze', false, true, false, true),
    
    -- SEO Refresh
    ('hbt_seo_refresh', 'Top SEO Pages Refresh', 'schedule', 'publish', true, false, false, true),
    
    -- Geography nodes
    ('hbt_infrastructure_discovery', 'Yard/Hotel Network Mapping', 'schedule', 'execute', true, false, false, true),
    
    -- Agent evals
    ('hbt_agent_eval', 'Agent Cost/Quality Review', 'event', 'alert', false, true, false, true)

on conflict (slug) do update set
    name = excluded.name,
    action_type = excluded.action_type;

-- Tie heartbeats to their appropriate agents (matching slugs)
update public.hc_command_heartbeats hb
set agent_id = a.id
from public.hc_command_agents a
where hb.slug = 'hbt_market_truth' and a.slug = 'agt_market_expansion';

update public.hc_command_heartbeats hb
set agent_id = a.id
from public.hc_command_agents a
where hb.slug = 'hbt_broker_ingest' and a.slug = 'agt_broker_acquisition';

update public.hc_command_heartbeats hb
set agent_id = a.id
from public.hc_command_agents a
where hb.slug = 'hbt_corridor_watch' and a.slug = 'agt_corridor_intelligence';

update public.hc_command_heartbeats hb
set agent_id = a.id
from public.hc_command_agents a
where hb.slug = 'hbt_recovery_followup' and a.slug = 'agt_invoice_recovery';

update public.hc_command_heartbeats hb
set agent_id = a.id
from public.hc_command_agents a
where hb.slug = 'hbt_seo_refresh' and a.slug = 'agt_seo_surface';

update public.hc_command_heartbeats hb
set agent_id = a.id
from public.hc_command_agents a
where hb.slug = 'hbt_agent_eval' and a.slug = 'agt_eval_engineer';

commit;
