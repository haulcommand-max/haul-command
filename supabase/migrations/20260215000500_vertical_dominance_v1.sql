-- 🏗️ HAUL COMMAND OS: VERTICAL DOMINANCE PACK (v1.0)
-- "The 10X Modules: Military, Storm, Wind, RFP, Ports"

-- ==========================================
-- MODULE 1: MILITARY CONTRACT QUALIFICATION
-- "From Zero to Prime"
-- ==========================================

CREATE TABLE military_readiness (
    org_id UUID PRIMARY KEY REFERENCES companies(id),
    
    -- Inputs
    cage_code TEXT,
    uei TEXT,
    sam_active BOOLEAN DEFAULT false,
    naics_codes TEXT[], -- Array of strings
    psc_codes TEXT[],
    past_performance TEXT CHECK (past_performance IN ('none', 'some', 'strong')),
    insurance_meets_threshold BOOLEAN DEFAULT false,
    safety_program_doc BOOLEAN DEFAULT false,
    security_level TEXT CHECK (security_level IN ('none', 'base_access', 'controlled', 'classified')),
    subcontract_ready BOOLEAN DEFAULT false,
    regions_supported TEXT[],
    equipment_capabilities JSONB,
    
    -- Computed Score (Stored for perf, updated via trigger is better but Generated works if simple inputs)
    -- Using Generated for simplicity based on spec
    readiness_score INTEGER GENERATED ALWAYS AS (
        (CASE WHEN sam_active THEN 25 ELSE 0 END) +
        (CASE WHEN uei IS NOT NULL AND cage_code IS NOT NULL THEN 15 ELSE 0 END) +
        (CASE WHEN insurance_meets_threshold THEN 15 ELSE 0 END) +
        (CASE 
            WHEN past_performance = 'strong' THEN 20 
            WHEN past_performance = 'some' THEN 10 
            ELSE 0 
        END) +
        (CASE WHEN safety_program_doc THEN 10 ELSE 0 END) +
        (CASE WHEN subcontract_ready THEN 10 ELSE 0 END)
        -- Caps analysis done in app layer or triggers for the +5-15 variable
    ) STORED,
    
    status TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN ((CASE WHEN sam_active THEN 25 ELSE 0 END) + (CASE WHEN uei IS NOT NULL AND cage_code IS NOT NULL THEN 15 ELSE 0 END) + (CASE WHEN insurance_meets_threshold THEN 15 ELSE 0 END) + (CASE WHEN past_performance = 'strong' THEN 20 WHEN past_performance = 'some' THEN 10 ELSE 0 END) + (CASE WHEN safety_program_doc THEN 10 ELSE 0 END) + (CASE WHEN subcontract_ready THEN 10 ELSE 0 END)) >= 80 THEN 'prime_ready'
            WHEN ((CASE WHEN sam_active THEN 25 ELSE 0 END) + (CASE WHEN uei IS NOT NULL AND cage_code IS NOT NULL THEN 15 ELSE 0 END) + (CASE WHEN insurance_meets_threshold THEN 15 ELSE 0 END) + (CASE WHEN past_performance = 'strong' THEN 20 WHEN past_performance = 'some' THEN 10 ELSE 0 END) + (CASE WHEN safety_program_doc THEN 10 ELSE 0 END) + (CASE WHEN subcontract_ready THEN 10 ELSE 0 END)) >= 50 THEN 'bidding_ready'
            ELSE 'subcontract_path'
        END
    ) STORED,
    
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MODULE 2: STORM-RESPONSE PRICING
-- "Speed & Certainty"
-- ==========================================

CREATE TABLE storm_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region_codes TEXT[], -- e.g. ['FL', 'GA', 'NC']
    status TEXT CHECK (status IN ('monitoring', 'active', 'winding_down', 'closed')),
    severity_score INTEGER, -- 1-5
    
    -- Multipliers
    activation_multiplier NUMERIC(3, 2), -- 1.05 - 1.60
    
    -- Add-ons (Override defaults)
    mobilization_fee NUMERIC(10, 2),
    standby_rate_hourly NUMERIC(10, 2),
    mileage_surcharge NUMERIC(10, 2),
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    notes TEXT
);

-- Active Storm View for Rapid Lookup
CREATE VIEW active_storm_rules AS
SELECT 
    id, name, region_codes, activation_multiplier, mobilization_fee, standby_rate_hourly, mileage_surcharge
FROM storm_events
WHERE status IN ('active', 'monitoring');

-- ==========================================
-- MODULE 3: WIND CORRIDOR INTELLIGENCE
-- "Route Risk is Everything"
-- ==========================================

CREATE TABLE wind_corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_name TEXT NOT NULL, -- "I-80 Midwest Wind Alley"
    states_touched TEXT[],
    primary_interstates TEXT[],
    
    -- Intelligence
    risk_score INTEGER, -- 1-100
    confidence_penalty INTEGER DEFAULT 10, -- "Bump confidence down"
    
    common_restrictions TEXT[], 
    seasonality_notes TEXT,
    typical_escort_config JSONB, -- { "lead": 1, "chase": 1, "steer": 1 }
    
    authority_statement_template TEXT -- "This lane commonly runs via..."
);

-- Logic Helper: Find corridors by State
CREATE INDEX idx_wind_states ON wind_corridors USING GIN(states_touched);


-- ==========================================
-- MODULE 4: GOV RFP SCRAPER LAYER
-- "Official API Connector"
-- ==========================================

CREATE TABLE rfp_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system TEXT, -- 'SAM.gov', 'DIBBS'
    external_id TEXT UNIQUE,
    
    title TEXT,
    agency TEXT,
    posted_date DATE,
    due_date DATE,
    
    -- Matching Tags
    naics_codes TEXT[],
    psc_codes TEXT[],
    keywords TEXT[],
    location_state TEXT,
    
    -- Fit Scoring
    fit_score INTEGER, -- Calculated by app ingestion logic usually, but we can store it
    
    route_bucket TEXT CHECK (route_bucket IN ('ignore', 'research', 'subcontract', 'bid')),
    
    -- Metadata
    link_url TEXT,
    security_req TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MODULE 5: PORT PULSE PREDICTIVE MODEL
-- "Timing Intelligence"
-- ==========================================

CREATE TABLE port_pulse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_name TEXT NOT NULL, -- "Port of Houston"
    region TEXT,
    
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Rolling Logic Signals
    delay_index NUMERIC(4, 1), -- 0-100
    inbound_volume_proxy NUMERIC(6, 2),
    trend_7d NUMERIC(4, 2), -- slope
    
    prediction_summary TEXT, -- "High delays likely next 3-7 days"
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE port_signals_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID REFERENCES port_pulse(id),
    signal_type TEXT, -- 'calc_run', 'dispatch_inquiry', 'partner_util'
    value_numeric NUMERIC,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);
