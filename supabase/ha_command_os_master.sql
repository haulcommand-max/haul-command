-- ============================================================================
-- HAUL COMMAND OS: MASTER BUILD v3 (Controlled Build)
-- STRICT ADHERENCE TO: "BUILD (CONTROLLED)" Directive
-- ============================================================================

-- 🏁 0. FEATURE FLAGS (Day 1 Requirements) --
CREATE TABLE IF NOT EXISTS feature_flags (
    key TEXT PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}'
);

INSERT INTO feature_flags (key, is_enabled, config) VALUES 
('maps_provider', TRUE, '{"provider": "maplibre", "tile_source": "osm"}'),
('routing_provider', FALSE, '{"provider": "osrm"}'),
('weather_provider', FALSE, '{"provider": "open_meteo"}'),
('vapi_enabled', FALSE, '{}'),
('telematics_enabled', FALSE, '{}'),
('superload_mode', FALSE, '{}'),
('canada_crossborder_mode', FALSE, '{}'),
('enterprise_portal', FALSE, '{}')
ON CONFLICT (key) DO NOTHING;

-- 🔧 1. DIRECTORY & VERIFICATION --

CREATE TYPE verification_status_enum AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE trust_tier_enum AS ENUM ('NEW', 'VERIFIED', 'PRO', 'ELITE', 'VETERAN');

CREATE TABLE IF NOT EXISTS directory_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users,
    type TEXT NOT NULL, -- 'DRIVER', 'COMPANY', 'BROKER'
    
    display_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    home_jurisdiction TEXT,
    service_radius_miles INTEGER,
    
    verification_status verification_status_enum DEFAULT 'UNVERIFIED',
    trust_tier trust_tier_enum DEFAULT 'NEW',
    trust_score NUMERIC DEFAULT 50,
    trust_score_breakdown JSONB, -- Explainable JSON
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES directory_profiles(id),
    type TEXT NOT NULL, -- 'INSURANCE', 'DL', 'EQUIPMENT_PHOTO'
    file_path TEXT NOT NULL, -- Storage Path
    status verification_status_enum DEFAULT 'PENDING',
    verified_by UUID, -- Admin ID
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🚚 2. OFFERS & MATCHING --

CREATE TYPE offer_status_enum AS ENUM ('DRAFT', 'OPEN', 'MATCHING', 'BOOKED', 'COMPLETED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES directory_profiles(id),
    
    origin_geo GEOGRAPHY(POINT, 4326),
    dest_geo GEOGRAPHY(POINT, 4326),
    origin_jurisdiction TEXT,
    dest_jurisdiction TEXT,
    
    load_height_in INTEGER,
    load_width_in INTEGER,
    load_length_ft NUMERIC,
    
    required_equipment TEXT[], -- ['high_pole', 'steerman']
    rate_per_mile NUMERIC,
    
    status offer_status_enum DEFAULT 'DRAFT',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match Results
CREATE TABLE IF NOT EXISTS match_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id),
    algorithm_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_run_id UUID REFERENCES match_runs(id),
    driver_id UUID REFERENCES directory_profiles(id),
    rank INTEGER NOT NULL,
    score_total NUMERIC NOT NULL,
    score_explain JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚠️ 3. HAZARDS (Waze Layer) --

CREATE TYPE hazard_type_enum AS ENUM ('LOW_CLEARANCE', 'LOW_WIRE', 'CLOSURE', 'POLICE', 'CONSTRUCTION', 'WIND_ZONE', 'STAGING_AREA');

CREATE TABLE IF NOT EXISTS hazards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(POINT, 4326),
    type hazard_type_enum NOT NULL,
    severity INTEGER CHECK (severity BETWEEN 1 AND 5),
    description TEXT,
    
    created_by UUID REFERENCES directory_profiles(id),
    trust_weight_applied NUMERIC DEFAULT 1.0,
    
    ttl_hours INTEGER DEFAULT 24,
    expires_at TIMESTAMPTZ,
    
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hazard_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_id UUID REFERENCES hazards(id),
    voter_id UUID REFERENCES directory_profiles(id),
    vote_type INTEGER, -- 1 = Confirm, -1 = Deny
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hazard_id, voter_id)
);

-- 🛡️ 4. COMPLIANCE SHIELD --

CREATE TABLE IF NOT EXISTS compliance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES offers(id),
    
    route_risk_score NUMERIC,
    weather_risk_score NUMERIC,
    
    digital_handshake_json JSONB,
    pdf_export_path TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_risk_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id),
    polyline GEOMETRY(LineString, 4326),
    segment_risks JSONB, -- Detailed array
    total_risk_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 💰 5. PAYMENTS & DISPUTES --

CREATE TYPE dispute_status_enum AS ENUM ('NONE', 'OPENED', 'EVIDENCE_REQUESTED', 'RESOLVED', 'REFUNDED');

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES offers(id),
    
    stripe_payment_intent_id TEXT,
    amount_total NUMERIC,
    platform_fee NUMERIC,
    driver_payout NUMERIC,
    
    status TEXT DEFAULT 'PENDING', -- 'HELD', 'RELEASED'
    dispute_status dispute_status_enum DEFAULT 'NONE',
    
    evidence_packet_path TEXT, -- PDF Logic
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚖️ 6. JURISDICTION RULES (Admin Managed) --
CREATE TABLE IF NOT EXISTS jurisdiction_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_code TEXT UNIQUE, -- 'US-FL'
    rules_json JSONB, -- { "curfews": [...], "equipment": [...] }
    updated_by UUID REFERENCES auth.users,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rules_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_code TEXT,
    old_rules JSONB,
    new_rules JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
