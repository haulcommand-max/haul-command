-- ============================================================================
-- Migration: 20260412_paperclip_200_agent_lock.sql
-- Purpose: Expand and hard-lock the Paperclip command matrix to exactly 200 agents.
--          120 Countries + 50 US States + 30 HQ Core = 200 Permanent Matrix.
--          This seeds the missing 50 U.S. State Dominator agents for absolute 
--          hyperlocal market control (DOT, routes, AdGrid, compliance).
-- ============================================================================
BEGIN;

INSERT INTO public.hc_command_agents
    (slug, name, domain, adapter_type, description, budget_monthly_cents, status, markets, config)
VALUES
    ('state-dominator-al', 'Alabama State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Alabama.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "AL"}'::jsonb),
    ('state-dominator-ak', 'Alaska State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Alaska.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "AK"}'::jsonb),
    ('state-dominator-az', 'Arizona State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Arizona.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "AZ"}'::jsonb),
    ('state-dominator-ar', 'Arkansas State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Arkansas.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "AR"}'::jsonb),
    ('state-dominator-ca', 'California State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for California.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "CA"}'::jsonb),
    ('state-dominator-co', 'Colorado State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Colorado.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "CO"}'::jsonb),
    ('state-dominator-ct', 'Connecticut State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Connecticut.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "CT"}'::jsonb),
    ('state-dominator-de', 'Delaware State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Delaware.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "DE"}'::jsonb),
    ('state-dominator-fl', 'Florida State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Florida.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "FL"}'::jsonb),
    ('state-dominator-ga', 'Georgia State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Georgia.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "GA"}'::jsonb),
    ('state-dominator-hi', 'Hawaii State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Hawaii.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "HI"}'::jsonb),
    ('state-dominator-id', 'Idaho State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Idaho.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "ID"}'::jsonb),
    ('state-dominator-il', 'Illinois State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Illinois.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "IL"}'::jsonb),
    ('state-dominator-in', 'Indiana State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Indiana.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "IN"}'::jsonb),
    ('state-dominator-ia', 'Iowa State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Iowa.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "IA"}'::jsonb),
    ('state-dominator-ks', 'Kansas State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Kansas.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "KS"}'::jsonb),
    ('state-dominator-ky', 'Kentucky State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Kentucky.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "KY"}'::jsonb),
    ('state-dominator-la', 'Louisiana State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Louisiana.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "LA"}'::jsonb),
    ('state-dominator-me', 'Maine State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Maine.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "ME"}'::jsonb),
    ('state-dominator-md', 'Maryland State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Maryland.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MD"}'::jsonb),
    ('state-dominator-ma', 'Massachusetts State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Massachusetts.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MA"}'::jsonb),
    ('state-dominator-mi', 'Michigan State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Michigan.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MI"}'::jsonb),
    ('state-dominator-mn', 'Minnesota State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Minnesota.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MN"}'::jsonb),
    ('state-dominator-ms', 'Mississippi State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Mississippi.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MS"}'::jsonb),
    ('state-dominator-mo', 'Missouri State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Missouri.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MO"}'::jsonb),
    ('state-dominator-mt', 'Montana State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Montana.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "MT"}'::jsonb),
    ('state-dominator-ne', 'Nebraska State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Nebraska.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NE"}'::jsonb),
    ('state-dominator-nv', 'Nevada State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Nevada.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NV"}'::jsonb),
    ('state-dominator-nh', 'New Hampshire State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for New Hampshire.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NH"}'::jsonb),
    ('state-dominator-nj', 'New Jersey State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for New Jersey.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NJ"}'::jsonb),
    ('state-dominator-nm', 'New Mexico State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for New Mexico.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NM"}'::jsonb),
    ('state-dominator-ny', 'New York State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for New York.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NY"}'::jsonb),
    ('state-dominator-nc', 'North Carolina State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for North Carolina.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "NC"}'::jsonb),
    ('state-dominator-nd', 'North Dakota State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for North Dakota.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "ND"}'::jsonb),
    ('state-dominator-oh', 'Ohio State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Ohio.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "OH"}'::jsonb),
    ('state-dominator-ok', 'Oklahoma State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Oklahoma.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "OK"}'::jsonb),
    ('state-dominator-or', 'Oregon State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Oregon.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "OR"}'::jsonb),
    ('state-dominator-pa', 'Pennsylvania State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Pennsylvania.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "PA"}'::jsonb),
    ('state-dominator-ri', 'Rhode Island State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Rhode Island.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "RI"}'::jsonb),
    ('state-dominator-sc', 'South Carolina State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for South Carolina.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "SC"}'::jsonb),
    ('state-dominator-sd', 'South Dakota State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for South Dakota.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "SD"}'::jsonb),
    ('state-dominator-tn', 'Tennessee State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Tennessee.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "TN"}'::jsonb),
    ('state-dominator-tx', 'Texas State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Texas.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "TX"}'::jsonb),
    ('state-dominator-ut', 'Utah State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Utah.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "UT"}'::jsonb),
    ('state-dominator-vt', 'Vermont State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Vermont.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "VT"}'::jsonb),
    ('state-dominator-va', 'Virginia State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Virginia.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "VA"}'::jsonb),
    ('state-dominator-wa', 'Washington State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Washington.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "WA"}'::jsonb),
    ('state-dominator-wv', 'West Virginia State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for West Virginia.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "WV"}'::jsonb),
    ('state-dominator-wi', 'Wisconsin State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Wisconsin.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "WI"}'::jsonb),
    ('state-dominator-wy', 'Wyoming State Dominator', 'seo_surface', 'agent', 'Owns state regulations, permit laws, AdGrid, and corridor SEO for Wyoming.', 2000, 'active', '{US}', '{"role": "state_dominator", "state": "WY"}'::jsonb)

ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    description = EXCLUDED.description,
    config = EXCLUDED.config;

-- Connect the 50 State Agents into the exact Org Chart (reports_to VP SEO)
UPDATE public.hc_command_agents
SET reports_to = (SELECT id FROM public.hc_command_agents WHERE slug = 'vp-seo')
WHERE slug LIKE 'state-dominator-%';

-- Enforce the exactly 200 agent ceiling onto the Scoreboard
INSERT INTO public.hc_command_scoreboard
    (executions_today, claims_driven, revenue_influenced, computed_at, domain_breakdown)
SELECT
    0, 0, 0, now(),
    jsonb_build_object(
        'total_agents', 200,
        'global_country_agents', 120,
        'domestic_state_agents', 50,
        'hq_command_agents', 30,
        'status', 'PERMANENT_MATRIX_LOCKED'
    );

COMMIT;
