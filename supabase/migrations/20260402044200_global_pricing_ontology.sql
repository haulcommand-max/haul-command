-- ==============================================================================
-- HAUL COMMAND: GLOBAL PRICING & ONTOLOGY SCHEMA
-- Migration: 20260402_global_pricing_observation.sql
-- ==============================================================================

-- 1. PRICING OBSERVATIONS (Tracks actual RFQs, Closed Jobs, and Quotes)
CREATE TABLE IF NOT EXISTS hc_pricing_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    region VARCHAR(100),
    city_corridor VARCHAR(255),
    
    -- Request context
    service_type VARCHAR(100) NOT NULL, -- canonical role ID
    load_type VARCHAR(100),
    width_ft NUMERIC,
    height_ft NUMERIC,
    weight_lbs NUMERIC,
    
    -- Complexity Triggers
    permit_complexity_score INT DEFAULT 1,
    escort_count INT DEFAULT 1,
    police_required BOOLEAN DEFAULT false,
    utility_required BOOLEAN DEFAULT false,
    
    -- Financials 
    quoted_amount NUMERIC(10,2),
    actual_accepted_amount NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_layer VARCHAR(50) NOT NULL, -- 'official_fee', 'public_commercial', 'rfq_capture', 'closed_job'
    
    -- Status & Analytics
    won_lost VARCHAR(20),
    confidence_score VARCHAR(50), -- 'Verified official', 'Multi-source commercial', 'Internal median'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GLOBAL ONTOLOGY & ALIAS MAP (For indexing dynamic foreign terms)
CREATE TABLE IF NOT EXISTS hc_global_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_role_id VARCHAR(100) NOT NULL, -- e.g., 'pilot_car_operator'
    local_title VARCHAR(255) NOT NULL, -- e.g., 'Begleitfahrzeug'
    country_code VARCHAR(2) NOT NULL,
    
    -- Rule mapping
    is_regulated BOOLEAN DEFAULT false,
    police_only BOOLEAN DEFAULT false,
    cert_required BOOLEAN DEFAULT false,
    permit_triggered BOOLEAN DEFAULT false,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(canonical_role_id, local_title, country_code)
);

-- Indices for rapid quote engine generation
CREATE INDEX idx_pricing_geo ON hc_pricing_observations(country_code, region, service_type);
CREATE INDEX idx_global_aliases ON hc_global_aliases(local_title, country_code);
