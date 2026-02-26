-- Initial Schema for Unified North American Haul Command Operating System (HCOS)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Jurisdictions (US States + Canadian Provinces/Territories)
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE, -- AL, ON, TX, etc.
    country TEXT NOT NULL CHECK (country IN ('US', 'CA')),
    is_french_speaking BOOLEAN DEFAULT FALSE, -- For Quebec/NB
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Identity Layer (Universal HCID)
CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hc_id TEXT UNIQUE NOT NULL, -- e.g., 'HC-8273-TX'
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'operator', 'pilot_escort', 'broker', 'shipper', 
        'police_agency', 'provincial_escort', 'survey_crew', 
        'flagging_company', 'permit_agency', 'port_authority'
    )),
    name TEXT NOT NULL,
    base_jurisdiction_id UUID REFERENCES jurisdictions(id),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_audit JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HCOS Score Matrix
CREATE TABLE identity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES identities(id),
    reliability_score INTEGER DEFAULT 0,
    on_time_index INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0,
    comm_response_score INTEGER DEFAULT 0,
    dispute_risk_score INTEGER DEFAULT 0,
    broker_pay_score INTEGER DEFAULT 0,
    permit_accuracy_score INTEGER DEFAULT 0,
    cross_border_compliance_score INTEGER DEFAULT 0,
    unit_conversion_accuracy_score INTEGER DEFAULT 0,
    doc_accuracy_score INTEGER DEFAULT 0, -- English/French accuracy
    overall_trust_score INTEGER GENERATED ALWAYS AS (
        (reliability_score + on_time_index + compliance_score + comm_response_score) / 4
    ) STORED,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Corridor Intelligence Engine
CREATE TABLE corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    corridor_type TEXT NOT NULL CHECK (corridor_type IN (
        'interstate', 'provincial_highway', 'cross_border', 
        'port_to_inland', 'energy_utility', 'resource_extraction'
    )),
    origin_jurisdiction_id UUID REFERENCES jurisdictions(id),
    destination_jurisdiction_id UUID REFERENCES jurisdictions(id),
    revenue_per_mile NUMERIC,
    revenue_per_km NUMERIC,
    permit_volume_annual INTEGER,
    wind_delay_freq NUMERIC,
    police_escort_freq NUMERIC,
    provincial_escort_freq NUMERIC,
    superload_density NUMERIC,
    risk_heatmap JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Escort & Coordination Rail
CREATE TABLE escort_coordination (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES identities(id), -- Coordinator ID
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    coordination_type TEXT NOT NULL CHECK (coordination_type IN (
        'police', 'port', 'utility', 'industrial', 'provincial_transport'
    )),
    authority_structure TEXT, -- e.g., 'RCMP', 'MTO', 'State Patrol'
    certification_reciprocity_json JSONB,
    winter_restriction_logic JSONB,
    rate_benchmark_per_hour NUMERIC,
    lead_time_days INTEGER,
    status TEXT DEFAULT 'active'
);

-- 6. Permit Turnaround Transparency Index
CREATE TABLE permit_turnaround_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    permit_category TEXT NOT NULL CHECK (permit_category IN ('oversize', 'overweight', 'superload', 'municipal', 'port')),
    avg_turnaround_hours NUMERIC,
    resubmission_freq NUMERIC,
    metric_weight_restriction BOOLEAN DEFAULT FALSE,
    seasonal_frost_restriction_logic JSONB,
    spring_road_restriction_logic JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Deadhead Optimization Network
CREATE TABLE deadhead_optimization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_region_id UUID REFERENCES jurisdictions(id),
    destination_region_id UUID REFERENCES jurisdictions(id),
    backhaul_probability_score INTEGER,
    regional_job_density_score INTEGER,
    cross_border_reposition_prob NUMERIC,
    idle_time_avg_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Master Dashboard & Tool Registry
CREATE TABLE master_dashboard_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_name TEXT NOT NULL,
    dashboard_type TEXT NOT NULL, -- 'Identity', 'Corridor', 'Escort', 'Permit', 'Deadhead', 'Revenue', 'Risk', 'Cross-Border', 'Monetization'
    link_url TEXT,
    data_source_listing TEXT[],
    refresh_frequency_minutes INTEGER DEFAULT 60,
    monetization_tier TEXT DEFAULT 'pro',
    risk_flags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Jurisdictions
INSERT INTO jurisdictions (name, code, country, is_french_speaking) VALUES
('Alabama', 'AL', 'US', false), ('Alaska', 'AK', 'US', false), ('Arizona', 'AZ', 'US', false), ('Arkansas', 'AR', 'US', false),
('California', 'CA', 'US', false), ('Colorado', 'CO', 'US', false), ('Connecticut', 'CT', 'US', false), ('Delaware', 'DE', 'US', false),
('Florida', 'FL', 'US', false), ('Georgia', 'GA', 'US', false), ('Hawaii', 'HI', 'US', false), ('Idaho', 'ID', 'US', false),
('Illinois', 'IL', 'US', false), ('Indiana', 'IN', 'US', false), ('Iowa', 'IA', 'US', false), ('Kansas', 'KS', 'US', false),
('Kentucky', 'KY', 'US', false), ('Louisiana', 'LA', 'US', false), ('Maine', 'ME', 'US', false), ('Maryland', 'MD', 'US', false),
('Massachusetts', 'MA', 'US', false), ('Michigan', 'MI', 'US', false), ('Minnesota', 'MN', 'US', false), ('Mississippi', 'MS', 'US', false),
('Missouri', 'MO', 'US', false), ('Montana', 'MT', 'US', false), ('Nebraska', 'NE', 'US', false), ('Nevada', 'NV', 'US', false),
('New Hampshire', 'NH', 'US', false), ('New Jersey', 'NJ', 'US', false), ('New Mexico', 'NM', 'US', false), ('New York', 'NY', 'US', false),
('North Carolina', 'NC', 'US', false), ('North Dakota', 'ND', 'US', false), ('Ohio', 'OH', 'US', false), ('Oklahoma', 'OK', 'US', false),
('Oregon', 'OR', 'US', false), ('Pennsylvania', 'PA', 'US', false), ('Rhode Island', 'RI', 'US', false), ('South Carolina', 'SC', 'US', false),
('South Dakota', 'SD', 'US', false), ('Tennessee', 'TN', 'US', false), ('Texas', 'TX', 'US', false), ('Utah', 'UT', 'US', false),
('Vermont', 'VT', 'US', false), ('Virginia', 'VA', 'US', false), ('Washington', 'WA', 'US', false), ('West Virginia', 'WV', 'US', false),
('Wisconsin', 'WI', 'US', false), ('Wyoming', 'WY', 'US', false),
('Alberta', 'AB', 'CA', false), ('British Columbia', 'BC', 'CA', false), ('Manitoba', 'MB', 'CA', false), ('New Brunswick', 'NB', 'CA', true),
('Newfoundland and Labrador', 'NL', 'CA', false), ('Nova Scotia', 'NS', 'CA', false), ('Ontario', 'ON', 'CA', false),
('Prince Edward Island', 'PE', 'CA', false), ('Quebec', 'QC', 'CA', true), ('Saskatchewan', 'SK', 'CA', false),
('Northwest Territories', 'NT', 'CA', false), ('Nunavut', 'NU', 'CA', false), ('Yukon', 'YT', 'CA', false);
