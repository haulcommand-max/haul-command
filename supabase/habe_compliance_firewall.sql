-- ============================================================================
-- HAUL COMMAND: COMPLIANCE FIREWALL & SUPERLOAD MONOPOLY
-- "Safe & Powerful" Strategy Implementation
-- ============================================================================

-- 🏗️ 1. SUPERLOAD MONOPOLY (Defensible Verification) --
CREATE TABLE IF NOT EXISTS superload_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES directory_profiles(id),
    
    pole_height_ft NUMERIC NOT NULL, -- "16ft"
    ny_cert_uploaded BOOLEAN DEFAULT FALSE,
    
    verified_by_admin UUID, -- Human in the loop
    verified_at TIMESTAMPTZ,
    
    attestation_signed_at TIMESTAMPTZ, -- "I swear this is true"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🏗️ 2. BRIDGE STRIKE PREVENTION (Crowdsourced + Verified) --
CREATE TABLE IF NOT EXISTS clearance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(POINT) NOT NULL,
    reported_height_ft NUMERIC NOT NULL,
    
    reported_by UUID REFERENCES directory_profiles(id),
    confidence_score NUMERIC DEFAULT 1.0, -- Weighted by user trust
    photo_url TEXT,
    
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clearance_reports_geo ON clearance_reports USING GIST (location);

-- 🛡️ 3. COMPLIANCE FIREWALL (Jurisdiction Logging) --
CREATE TABLE IF NOT EXISTS jurisdiction_entry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES directory_profiles(id),
    jurisdiction_code TEXT REFERENCES jurisdictions(code),
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    gps_lat NUMERIC,
    gps_lng NUMERIC,
    
    compliance_prompt_shown BOOLEAN DEFAULT TRUE, -- "Evidence we warned them"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 💰 4. FINTECH LOCK-IN (Financial Memory) --
CREATE TABLE IF NOT EXISTS trip_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES habe_offers(id),
    
    deadhead_miles NUMERIC DEFAULT 0,
    detention_hours NUMERIC DEFAULT 0,
    hotel_cost NUMERIC DEFAULT 0,
    tolls_cost NUMERIC DEFAULT 0,
    misc_fees NUMERIC DEFAULT 0,
    
    total_generated NUMERIC GENERATED ALWAYS AS (hotel_cost + tolls_cost + misc_fees) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🚨 5. BROKER RISK FIREWALL (The "Block List") --
CREATE TABLE IF NOT EXISTS broker_risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_profile_id UUID REFERENCES directory_profiles(id),
    
    avg_payment_days INTEGER,
    cancel_rate NUMERIC, -- %
    dispute_count INTEGER DEFAULT 0,
    
    risk_rating TEXT DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'BLOCKED'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔌 6. ENTERPRISE INTAKE (TMS Hook) --
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES directory_profiles(id),
    key_hash TEXT NOT NULL,
    label TEXT, -- "TMS Integration"
    
    rate_limit_per_min INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS --
ALTER TABLE superload_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
