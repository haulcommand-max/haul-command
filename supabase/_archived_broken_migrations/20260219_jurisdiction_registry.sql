-- ========================================================================================
-- HAUL COMMAND LOGISTICS OS
-- MIGRATION: 20260219_jurisdiction_registry.sql
-- PURPOSE: Implementation of the First-Class Jurisdiction Registry & Rule Engine DSL
-- ========================================================================================

-- 1. JURISDICTIONS TABLE & SEEDING
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('US_STATE', 'US_DISTRICT', 'CA_PROVINCE', 'CA_TERRITORY', 'UNIVERSAL')),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT NOT NULL CHECK (country IN ('US', 'CA', 'GLOBAL')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    polygon_dataset_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed universal fallback rules
INSERT INTO public.jurisdictions (jurisdiction_type, code, name, country) VALUES
('UNIVERSAL', 'US_UNIVERSAL', 'United States Universal Base Rules', 'US'),
('UNIVERSAL', 'CA_UNIVERSAL', 'Canada Universal Base Rules', 'CA')
ON CONFLICT (code) DO NOTHING;

-- Seed 50 US States + DC
INSERT INTO public.jurisdictions (jurisdiction_type, code, name, country) VALUES
('US_STATE', 'AL', 'Alabama', 'US'),
('US_STATE', 'AK', 'Alaska', 'US'),
('US_STATE', 'AZ', 'Arizona', 'US'),
('US_STATE', 'AR', 'Arkansas', 'US'),
('US_STATE', 'CA', 'California', 'US'),
('US_STATE', 'CO', 'Colorado', 'US'),
('US_STATE', 'CT', 'Connecticut', 'US'),
('US_STATE', 'DE', 'Delaware', 'US'),
('US_STATE', 'FL', 'Florida', 'US'),
('US_STATE', 'GA', 'Georgia', 'US'),
('US_STATE', 'HI', 'Hawaii', 'US'),
('US_STATE', 'ID', 'Idaho', 'US'),
('US_STATE', 'IL', 'Illinois', 'US'),
('US_STATE', 'IN', 'Indiana', 'US'),
('US_STATE', 'IA', 'Iowa', 'US'),
('US_STATE', 'KS', 'Kansas', 'US'),
('US_STATE', 'KY', 'Kentucky', 'US'),
('US_STATE', 'LA', 'Louisiana', 'US'),
('US_STATE', 'ME', 'Maine', 'US'),
('US_STATE', 'MD', 'Maryland', 'US'),
('US_STATE', 'MA', 'Massachusetts', 'US'),
('US_STATE', 'MI', 'Michigan', 'US'),
('US_STATE', 'MN', 'Minnesota', 'US'),
('US_STATE', 'MS', 'Mississippi', 'US'),
('US_STATE', 'MO', 'Missouri', 'US'),
('US_STATE', 'MT', 'Montana', 'US'),
('US_STATE', 'NE', 'Nebraska', 'US'),
('US_STATE', 'NV', 'Nevada', 'US'),
('US_STATE', 'NH', 'New Hampshire', 'US'),
('US_STATE', 'NJ', 'New Jersey', 'US'),
('US_STATE', 'NM', 'New Mexico', 'US'),
('US_STATE', 'NY', 'New York', 'US'),
('US_STATE', 'NC', 'North Carolina', 'US'),
('US_STATE', 'ND', 'North Dakota', 'US'),
('US_STATE', 'OH', 'Ohio', 'US'),
('US_STATE', 'OK', 'Oklahoma', 'US'),
('US_STATE', 'OR', 'Oregon', 'US'),
('US_STATE', 'PA', 'Pennsylvania', 'US'),
('US_STATE', 'RI', 'Rhode Island', 'US'),
('US_STATE', 'SC', 'South Carolina', 'US'),
('US_STATE', 'SD', 'South Dakota', 'US'),
('US_STATE', 'TN', 'Tennessee', 'US'),
('US_STATE', 'TX', 'Texas', 'US'),
('US_STATE', 'UT', 'Utah', 'US'),
('US_STATE', 'VT', 'Vermont', 'US'),
('US_STATE', 'VA', 'Virginia', 'US'),
('US_STATE', 'WA', 'Washington', 'US'),
('US_STATE', 'WV', 'West Virginia', 'US'),
('US_STATE', 'WI', 'Wisconsin', 'US'),
('US_STATE', 'WY', 'Wyoming', 'US'),
('US_DISTRICT', 'DC', 'District of Columbia', 'US')
ON CONFLICT (code) DO NOTHING;

-- Seed CA Provinces & Territories
INSERT INTO public.jurisdictions (jurisdiction_type, code, name, country) VALUES
('CA_PROVINCE', 'AB', 'Alberta', 'CA'),
('CA_PROVINCE', 'BC', 'British Columbia', 'CA'),
('CA_PROVINCE', 'MB', 'Manitoba', 'CA'),
('CA_PROVINCE', 'NB', 'New Brunswick', 'CA'),
('CA_PROVINCE', 'NL', 'Newfoundland and Labrador', 'CA'),
('CA_PROVINCE', 'NS', 'Nova Scotia', 'CA'),
('CA_PROVINCE', 'ON', 'Ontario', 'CA'),
('CA_PROVINCE', 'PE', 'Prince Edward Island', 'CA'),
('CA_PROVINCE', 'QC', 'Quebec', 'CA'),
('CA_PROVINCE', 'SK', 'Saskatchewan', 'CA'),
('CA_TERRITORY', 'NT', 'Northwest Territories', 'CA'),
('CA_TERRITORY', 'NU', 'Nunavut', 'CA'),
('CA_TERRITORY', 'YT', 'Yukon', 'CA')
ON CONFLICT (code) DO NOTHING;


-- 2. ESCORT RULESETS & COVERAGE DASHBOARD
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.escort_rulesets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_code TEXT NOT NULL REFERENCES public.jurisdictions(code) ON DELETE CASCADE,
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'staged', 'deprecated')),
    effective_date DATE,
    last_verified_at TIMESTAMPTZ,
    source_bundle_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escort_rulesets_jur_status ON public.escort_rulesets (jurisdiction_code, status);

CREATE TABLE IF NOT EXISTS public.ruleset_coverage (
    jurisdiction_code TEXT PRIMARY KEY REFERENCES public.jurisdictions(code) ON DELETE CASCADE,
    has_active_ruleset BOOLEAN NOT NULL DEFAULT false,
    active_ruleset_id UUID REFERENCES public.escort_rulesets(id) ON DELETE SET NULL,
    last_verified_at TIMESTAMPTZ,
    coverage_grade VARCHAR(1) CHECK (coverage_grade IN ('A', 'B', 'C', 'D', 'F')),
    missing_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-seed ruleset_coverage to ensure NO silent drops (every mapped jurisdiction must have a row)
INSERT INTO public.ruleset_coverage (jurisdiction_code, has_active_ruleset, coverage_grade, missing_reason)
SELECT code, false, 'F', 'Pending source discovery and ruleset generation'
FROM public.jurisdictions
ON CONFLICT (jurisdiction_code) DO NOTHING;


-- 3. ESCORT RULE SOURCES (CITATIONS LAYER)
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.escort_rule_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_bundle_id UUID NOT NULL, -- Logical grouping that escort_rulesets points to
    title TEXT NOT NULL,
    url TEXT,
    publisher TEXT,
    retrieved_at TIMESTAMPTZ,
    reliability_tier TEXT NOT NULL CHECK (reliability_tier IN ('primary', 'secondary', 'community')),
    citation_key TEXT NOT NULL UNIQUE,
    excerpt_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escort_rule_sources_bundle ON public.escort_rule_sources (source_bundle_id);


-- 4. ESCORT RULES (THE DSL ENGINE LAYER)
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.escort_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruleset_id UUID NOT NULL REFERENCES public.escort_rulesets(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 100,
    applies_when JSONB NOT NULL,
    outputs JSONB NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('must', 'should', 'case_by_case', 'unknown')),
    confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1.0),
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ruleset_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_escort_rules_ruleset ON public.escort_rules (ruleset_id);


-- 5. ESCORT RULE OVERRIDES (HOTFIXES)
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.escort_rule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_code TEXT NOT NULL REFERENCES public.jurisdictions(code) ON DELETE CASCADE,
    rule_id TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    override_outputs JSONB,
    override_applies_when JSONB,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escort_rule_overrides_jur ON public.escort_rule_overrides (jurisdiction_code) WHERE enabled = true;


-- 6. ROUTE STATE SEGMENTS CACHING
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.route_state_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_hash TEXT NOT NULL UNIQUE,
    states JSONB NOT NULL DEFAULT '[]'::jsonb,
    segments JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_state_segments_hash ON public.route_state_segments (route_hash);
