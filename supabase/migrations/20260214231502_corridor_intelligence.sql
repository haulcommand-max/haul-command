-- 🏗️ HAUL COMMAND OS: LAYER 3 - CORRIDOR INTELLIGENCE
-- The "Route Gravity". Captures the physical reality of the road.

-- 1. CORRIDORS (The Named Routes)
-- Represents a logical shipping lane (e.g., "I-75 GA Southbound", "I-10 TX-W -> TX-E")
-- Used for Rate Overrides and strategic planning.
CREATE TABLE corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    code TEXT UNIQUE NOT NULL, -- 'I-75_GA_SB', 'US-287_TX_NB'
    name TEXT NOT NULL, 
    
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    
    type TEXT NOT NULL CHECK (type IN ('interstate', 'us_highway', 'state_route', 'local_arterial', 'port_connector')),
    
    length_miles INTEGER,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'construction', 'restricted', 'closed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_corridors_code ON corridors(code);


-- 2. CORRIDOR SEGMENTS (The Physical Path)
-- More granular segments for GIS mapping and hazard location.
CREATE TABLE corridor_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID REFERENCES corridors(id) ON DELETE CASCADE,
    
    sequence_order INTEGER NOT NULL, -- 1, 2, 3...
    
    start_point GEOMETRY(POINT, 4326),
    end_point GEOMETRY(POINT, 4326),
    path_linestring GEOMETRY(LINESTRING, 4326),
    
    name TEXT -- 'Mile Marker 10-20'
);


-- 3. CORRIDOR CONSTRAINTS ( The "Hard" Limits)
-- Defines physical limits of the route.
CREATE TABLE corridor_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID REFERENCES corridors(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('vertical_clearance', 'weight_limit', 'width_limit', 'curfew_zone')),
    
    value_amount NUMERIC(10, 2) NOT NULL,
    value_unit TEXT NOT NULL CHECK (value_unit IN ('inches', 'lbs', 'feet')),
    
    is_temporary BOOLEAN DEFAULT false,
    expiry_date DATE,
    
    description TEXT, -- 'Low bridge at Exit 42'
    location GEOMETRY(POINT, 4326),
    
    verified_at TIMESTAMPTZ,
    verified_by UUID -- Admin ID
);


-- 4. CORRIDOR METRICS (The "Soft" Data)
-- Aggregated performance data.
CREATE TABLE corridor_metrics (
    corridor_id UUID PRIMARY KEY REFERENCES corridors(id) ON DELETE CASCADE,
    
    avg_speed_mph INTEGER,
    congestion_score INTEGER, -- 0-100
    police_activity_score INTEGER, -- 0-100 (Risk of inspection)
    
    accident_frequency_rating TEXT CHECK (rating IN ('low', 'medium', 'high')),
    
    last_updated TIMESTAMPTZ DEFAULT NOW()
);


-- 5. CONSTRUCTION ZONES (Temporary Disruptions)
-- Overlays on top of corridors.
CREATE TABLE construction_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID REFERENCES corridors(id),
    
    title TEXT NOT NULL,
    description TEXT,
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    impact_level TEXT CHECK (impact_level IN ('minor_delay', 'lane_closure', 'full_closure', 'width_restriction')),
    
    restriction_details JSONB -- { "max_width": 120 }
);

-- RLS POLICIES
ALTER TABLE corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_zones ENABLE ROW LEVEL SECURITY;

-- Note: Policies will generally allow public read, admin write.
