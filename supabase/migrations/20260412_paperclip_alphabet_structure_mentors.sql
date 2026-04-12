-- ============================================================================
-- Migration: 20260412_paperclip_alphabet_structure_mentors.sql
-- Purpose: Restructures Paperclip from an "Uber Monolith" to an "Alphabet
--          Holding Company" structure. Injects 15 Mentor-Lens operational
--          optimizations (Hormozi, Cole Gordon, Billy Gene, Julian Goldie, Jobs).
--          Preps agents for Agent Fabric capabilities and Fly.io Anycast runs.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. SUBTRACT: Eliminate monolithic VPs in favor of Subsidiary CEOs
-- ════════════════════════════════════════════════════════════════════════════
UPDATE public.hc_command_agents
SET status = 'terminated', updated_at = now()
WHERE slug IN ('vp-growth', 'vp-revenue', 'vp-trust', 'vp-intelligence', 'vp-operations', 'vp-seo');

-- ════════════════════════════════════════════════════════════════════════════
-- 2. ALPHABET STRUCTURE: Create Subsidiary Companies & Holding Board
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_command_agents (slug, name, domain, adapter_type, description, budget_monthly_cents, status, markets, config)
VALUES
    ('alphabet-board-william', 'Alphabet Holding Board', 'command', 'human', 'Human oversight and ultimate capital allocator for the holding structure.', 0, 'active', '{}', '{"tier": "holding"}'),
    
    ('ceo-haul-command-logistics', 'CEO - Haul Command Logistics Inc.', 'dispatch', 'agent', 'Runs the core marketplace P&L. Manages all matching, routing, and fleet operators.', 25000, 'active', '{}', '{"tier": "subsidiary", "focus": "logistics_pnl"}'),
    
    ('ceo-adgrid-media', 'CEO - AdGrid Media Network', 'adgrid', 'agent', 'Runs the B2B advertising and sponsorship P&L. Focuses entirely on fill rates and yield.', 15000, 'active', '{}', '{"tier": "subsidiary", "focus": "ad_revenue"}'),
    
    ('ceo-trust-oracle', 'CEO - Trust & Compliance Oracle', 'trust', 'agent', 'Runs the KYC, insurance verification, and 6-axis trust scoring. B2B data product P&L.', 10000, 'active', '{}', '{"tier": "subsidiary", "focus": "data_revenue"}'),
    
    ('ceo-permit-engine', 'CEO - Permit Engine Corp', 'permit_compliance', 'agent', 'Runs the superload and municipal permit aggregation SaaS.', 10000, 'active', '{}', '{"tier": "subsidiary", "focus": "saas_revenue"}'),
    
    ('ceo-x-moonshot', 'CEO - Haul X Labs', 'intelligence', 'agent', 'Cross-pollinates data between subsidiaries to find high-upside moonshot opportunities.', 5000, 'active', '{}', '{"tier": "subsidiary", "focus": "innovation"}')
ON CONFLICT (slug) DO UPDATE SET status = 'active';

-- Re-parent the holding CEO
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'alphabet-board-william'),
    name = 'CEO - Alphabet Holding Manager'
WHERE slug = 'ceo-paperclip';

-- Re-parent the subsidiaries to the holding CEO
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-paperclip')
WHERE slug IN ('ceo-haul-command-logistics', 'ceo-adgrid-media', 'ceo-trust-oracle', 'ceo-permit-engine', 'ceo-x-moonshot');

-- Re-map existing agents to their new subsidiary CEOs
UPDATE public.hc_command_agents SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-haul-command-logistics') WHERE domain IN ('dispatch', 'dispatch_operations', 'growth', 'operator_activation') AND slug NOT LIKE 'ceo-%';
UPDATE public.hc_command_agents SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-adgrid-media') WHERE domain IN ('adgrid', 'sponsor_inventory', 'monetization') AND slug NOT LIKE 'ceo-%';
UPDATE public.hc_command_agents SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-trust-oracle') WHERE domain IN ('trust', 'trust_proof', 'defense') AND slug NOT LIKE 'ceo-%';
UPDATE public.hc_command_agents SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'ceo-permit-engine') WHERE domain IN ('compliance', 'permit_compliance') AND slug NOT LIKE 'ceo-%';

-- ════════════════════════════════════════════════════════════════════════════
-- 3. INJECT THE MENTOR-LENS AGENTS (Optimizing Skills & Agent Fabric)
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_command_agents (slug, name, domain, adapter_type, description, budget_monthly_cents, status, config)
VALUES
    -- Alex Hormozi (Grand Slam Offers)
    ('hormozi-offer-optimizer', 'Hormozi Grand Slam Offer Engine', 'growth', 'agent', 'Dynamically reconstructs pricing tiers and waitlists into risk-reversed, scarcity-driven Grand Slam Offers.', 5000, 'active', 
     '{"skills": ["copywriting", "conversion_rate_optimization"], "fabric_role": "optimizer", "runtime": "fly.io"}'::jsonb),

    -- Cole Gordon (Tri-Line Sales: Setter/Closer/Success)
    ('gordon-setter-agent', 'Gordon Tri-Line: SDR Setter', 'broker_acquisition', 'agent', 'Aggressively prospects brokers, qualifies trust scores, and sets appointments for the closer.', 2000, 'active', 
     '{"skills": ["outbound_email", "lead_scoring"], "fabric_role": "prospector"}'::jsonb),
    ('gordon-closer-agent', 'Gordon Tri-Line: Closer', 'broker_acquisition', 'agent', 'Handles objections dynamically and closes high-ticket API access deals.', 2000, 'active', 
     '{"skills": ["negotiation", "objection_handling"], "fabric_role": "closer", "runtime": "fly.io"}'::jsonb),

    -- Billy Gene (Attention Marketing)
    ('billy-gene-ad-creative', 'Billy Gene Disruptive Creative AI', 'growth', 'agent', 'Spins up controversial, highly polarizing video and image ad creatives for operator recruitment.', 5000, 'active', 
     '{"skills": ["video_generation", "controversial_copy"], "fabric_role": "creative_director", "runtime": "fly.io"}'::jsonb),

    -- Julian Goldie (Parasite SEO & Backlink Dominator)
    ('goldie-parasite-seo', 'Goldie Parasite SEO & Links', 'seo', 'agent', 'Hunts high-DR targets (Reddit, Quora, Medium) to inject programmatic parasite links back to Haul Command.', 5000, 'active', 
     '{"skills": ["puppeteer_crawler", "serp_analysis"], "fabric_role": "link_builder", "runtime": "fly.io"}'::jsonb),
    ('goldie-content-sniper', 'Goldie Freshness Sniper', 'seo', 'agent', 'Monitors SERPs. If HC drops to #2, automatically refreshes content and bumps "Last Updated" timestamp to regain #1.', 3000, 'active', 
     '{"skills": ["serp_tracking", "content_refresh"], "fabric_role": "auditor"}'::jsonb),

    -- Steve Jobs (Product Simplicity)
    ('jobs-ux-auditor', 'Jobs Ruthless Simplicity Auditor', 'seo_surface', 'agent', 'Audits all UIs. If cognitive load is too high (too many buttons), it aggressively prunes elements.', 2000, 'active', 
     '{"skills": ["lighthouse", "ui_analysis_vision"], "fabric_role": "design_critic"}'::jsonb),

    -- CFO / Unit Economics
    ('cfo-ltv-cac-enforcer', 'Unit Economics CFO', 'monetization', 'agent', 'Tracks budget_spent_cents vs revenue_generated_cents per agent. Terminates ROI-negative agents automatically.', 2000, 'active', 
     '{"skills": ["financial_analysis", "sql_analytics"], "fabric_role": "allocator"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET config = EXCLUDED.config, status = 'active';

-- ════════════════════════════════════════════════════════════════════════════
-- 4. MAXIMIZE EXISTING COMPUTE FOR FLY.IO & AGENT FABRIC
-- ════════════════════════════════════════════════════════════════════════════
-- Assign Fly.io specifically to agents doing deep-compute (Search, Geo, OCR)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{runtime}', '"fly.io"')
WHERE slug IN ('search-indexer', 'geo-aggregator', 'navixy-route-hazard-profiler', 'insurance-ocr-parse', 'corridor-market-analyzer');

-- Bind Agent Fabric schemas to content generators
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{fabric_integration}', '"true"')
WHERE domain IN ('content_generation', 'seo', 'seo_surface');

COMMIT;
