-- 🏗️ HAUL COMMAND OS: LAYER 2 - COMPLIANCE ENGINE
-- The "Legal Gravity". Defines the rules of the road.

-- 1. JURISDICTIONS (The Legal Zones)
-- Represents States, Provinces, or unique legal zones (e.g., NY Thruway).
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID, -- Link to Global Market (e.g., 'North America')
    
    name TEXT NOT NULL, -- 'Texas', 'Ontario'
    code TEXT NOT NULL, -- 'TX', 'ON'
    country_code TEXT NOT NULL, -- 'US', 'CA', 'MX'
    
    type TEXT NOT NULL CHECK (type IN ('state', 'province', 'country', 'city', 'super_corridor')),
    
    -- Geometric bounds for rough geo-fencing
    boundary_polygon GEOMETRY(POLYGON, 4326), 
    
    timezone TEXT DEFAULT 'UTC',
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jurisdictions_code ON jurisdictions(code);
CREATE INDEX idx_jurisdictions_country ON jurisdictions(country_code);


-- 2. JURISDICTION RULES (The Rulebook)
-- Defines constraints for each zone.
CREATE TABLE jurisdiction_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE CASCADE,
    
    -- Category of Rule
    category TEXT NOT NULL CHECK (category IN (
        'dimensions', -- Max legal dimensions without permit
        'escorts',    -- When escorts are required
        'curfews',    -- Travel time restrictions
        'equipment',  -- Required signs, lights, flags
        'permits',    -- Permit types and costs
        'superloads'  -- Superload definitions
    )),
    
    -- Examples: 
    -- { "width": 102 (inches), "height": 162 (inches) }
    -- { "trigger": { "width": 144 }, "requirement": "1_front_escort" }
    rule_def JSONB NOT NULL, 
    
    description TEXT, -- Human readable summary
    reference_url TEXT, -- Link to official state DOT code
    
    effective_from DATE,
    effective_to DATE, -- NULL = Indefinite
    
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID -- Admin ID
);


-- 3. BORDER CROSSINGS (Choke Points)
-- Manages specialized logic for crossing borders.
CREATE TABLE border_crossings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name TEXT NOT NULL, -- 'Ambassador Bridge'
    origin_jurisdiction_id UUID REFERENCES jurisdictions(id),
    dest_jurisdiction_id UUID REFERENCES jurisdictions(id),
    
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'restricted', 'congestion_warning')),
    
    -- Specific constraints for the crossing
    max_weight_lbs INTEGER,
    max_width_inches INTEGER,
    max_height_inches INTEGER,
    
    wait_time_minutes INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. COMPLIANCE ALERTS (Sentinel System)
-- Real-time alerts for active loads.
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical', 'blocker')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Impact Scope
    affected_load_types JSONB, -- e.g., ["superload", "overheight"]
    
    active_from TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    source TEXT -- 'manual', 'dot_feed', 'community_report'
);


-- 5. PERMIT REQUIREMENTS (Granular Permit Logic)
-- Links loads to specific permit needs.
CREATE TABLE permit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    
    name TEXT NOT NULL, -- 'Single Trip Oversize', 'Annual Overweight'
    code TEXT, -- State internal code
    
    base_cost NUMERIC(10, 2),
    cost_formula JSONB, -- Logic for calculating variable costs
    
    validity_days INTEGER DEFAULT 5,
    
    is_superload BOOLEAN DEFAULT false,
    processing_time_hours INTEGER -- Est. turnaround
);

-- RLS POLICIES
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE border_crossings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_types ENABLE ROW LEVEL SECURITY;

-- Note: Policies to allow public read, admin write.
