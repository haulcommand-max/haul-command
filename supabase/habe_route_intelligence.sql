-- ============================================================================
-- HAUL COMMAND: ROUTE INTELLIGENCE SYSTEM (The "100x Waze" Layer)
-- Implements Clearances, Wind, Curfews, and Risk Logs.
-- ============================================================================

-- 🔌 1. TELEMATICS & PROVIDERS (Future Slot) --
CREATE TABLE IF NOT EXISTS telematics_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- 'samsara', 'geotab', 'keep_truckin'
    api_base_url TEXT,
    api_key TEXT,
    is_active BOOLEAN DEFAULT FALSE, -- Feature Flag: DISABLED
    feature_flags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- 'open-meteo', 'here_weather'
    api_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    cost_per_call NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🗺️ 2. ROUTE SEGMENTS (The Map Graph) --
CREATE TABLE IF NOT EXISTS route_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    polyline GEOMETRY(LineString, 4326),
    jurisdiction_code TEXT REFERENCES jurisdictions(code),
    
    road_name TEXT,
    speed_limit INTEGER,
    
    is_bridge BOOLEAN DEFAULT FALSE,
    bridge_clearance_in INTEGER, -- Nullable if not bridge
    bridge_source TEXT DEFAULT 'UNKNOWN', -- 'DOT', 'USER', 'UNKNOWN'
    bridge_last_verified TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_segments_poly ON route_segments USING GIST (polyline);

-- 🏗️ 3. CLEARANCE REPORTING (Refined) --
-- Note: clearance_reports was initialized in `habe_compliance_firewall.sql`
-- extending it or ensuring it links here.
ALTER TABLE clearance_reports ADD COLUMN IF NOT EXISTS route_segment_id UUID REFERENCES route_segments(id);

-- 🌬️ 4. WIND RISK ZONES --
CREATE TABLE IF NOT EXISTS wind_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    polyline GEOMETRY(LineString, 4326),
    is_high_exposure BOOLEAN DEFAULT FALSE,
    exposure_level INTEGER DEFAULT 1, -- 1-5
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⏰ 5. CURFEW RULES --
CREATE TABLE IF NOT EXISTS curfew_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_code TEXT REFERENCES jurisdictions(code),
    
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[], -- [0, 6] for Sun/Sat
    
    applies_to_height_over_in INTEGER,
    applies_to_length_over_ft INTEGER,
    
    notes TEXT
);

-- ⚠️ 6. HAZARD REPORTS (Verified Swarm) --
CREATE TABLE IF NOT EXISTS hazard_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(POINT) NOT NULL,
    type TEXT NOT NULL, -- 'LOW_WIRE', 'NARROW_LANE', 'POLICE_ZONE'
    description TEXT,
    
    reported_by UUID REFERENCES directory_profiles(id),
    verified_by_admin BOOLEAN DEFAULT FALSE,
    weight NUMERIC DEFAULT 1.0, -- Confidence
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hazard_reports_geo ON hazard_reports USING GIST (location);

-- 📊 7. RISK LOGS (Legal Proof) --
CREATE TABLE IF NOT EXISTS route_risk_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES habe_offers(id),
    
    route_polyline GEOMETRY(LineString, 4326),
    
    risk_score NUMERIC, -- 0-100
    risk_breakdown JSONB, -- { "clearance": 80, "wind": 20 }
    
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
