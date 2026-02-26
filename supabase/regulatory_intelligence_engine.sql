-- ============================================================
-- HAUL COMMAND: REGULATORY INTELLIGENCE ENGINE
-- Global Transport Governance Graph
-- ============================================================
-- Core Principle: Never store rules directly. Store relationships.
-- Rule objects replace hardcoded thresholds.
-- Add a country → connect nodes → no rebuild.
-- ============================================================
-- Extends: data_moat_schema.sql
-- Deploy with: supabase migration apply
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE authority_type AS ENUM (
    'FEDERAL',
    'STATE',
    'PROVINCIAL',
    'MUNICIPAL',
    'PORT',
    'TRIBAL'
);

CREATE TYPE police_escort_likelihood AS ENUM (
    'NEVER',
    'RARE',
    'COMMON',
    'MANDATORY'
);

CREATE TYPE dimension_type AS ENUM (
    'WIDTH',
    'HEIGHT',
    'LENGTH',
    'WEIGHT',
    'AXLE_WEIGHT',
    'OVERHANG'
);

CREATE TYPE threshold_action AS ENUM (
    'PERMIT_REQUIRED',
    'ESCORT_REQUIRED',
    'POLICE_REQUIRED',
    'SURVEY_REQUIRED',
    'SUPERLOAD',
    'ENGINEERING_REVIEW',
    'UTILITY_COORDINATION',
    'NIGHT_RESTRICTION',
    'MULTI_ESCORT'
);

CREATE TYPE restriction_type AS ENUM (
    'NIGHT',
    'WEEKEND',
    'HOLIDAY',
    'SEASONAL',
    'CURFEW',
    'WEATHER',
    'CONSTRUCTION',
    'SPRING_THAW',
    'HURRICANE_SEASON'
);

CREATE TYPE authority_relationship AS ENUM (
    'OVERRIDES',
    'SUPPLEMENTS',
    'DEFERS_TO',
    'COORDINATES_WITH'
);

CREATE TYPE market_tier AS ENUM (
    'TIER_1',
    'TIER_2',
    'TIER_3'
);

-- ============================================================
-- TABLE 1: JURISDICTION MASTER (The Spine)
-- ============================================================
-- One row per authority level. Globally scalable.
-- Every other table references this.
CREATE TABLE jurisdiction_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Geography
    country_code TEXT NOT NULL,              -- ISO 3166-1: US, CA, AU, DE, GB...
    region_code TEXT,                        -- State/province: FL, ON, NSW...
    authority_name TEXT NOT NULL,            -- "Florida DOT", "Ontario MTO"
    authority_type authority_type NOT NULL,

    -- Scoring
    digital_maturity_score INTEGER CHECK (digital_maturity_score BETWEEN 1 AND 5),
    permit_complexity_score INTEGER CHECK (permit_complexity_score BETWEEN 1 AND 5),
    escort_usage BOOLEAN DEFAULT FALSE,
    police_escort_likelihood police_escort_likelihood DEFAULT 'RARE',
    engineering_review_required BOOLEAN DEFAULT FALSE,

    -- Access
    permit_portal_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,

    -- Strategic
    strategic_score NUMERIC(3,1) CHECK (strategic_score BETWEEN 0 AND 10),
    nightmare_state BOOLEAN DEFAULT FALSE,  -- CA, NY, NJ, PA, ON, QC = weapon, not weakness
    premium_pricing_zone BOOLEAN DEFAULT FALSE,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(country_code, region_code, authority_type)
);

-- ============================================================
-- TABLE 2: PERMIT FRAMEWORK (Threshold Rules as Objects)
-- ============================================================
-- Relational — attaches rules to jurisdictions.
-- Never hardcode "Width > 12ft = escort."
-- Store: IF dimension > threshold THEN action WITH authority.
CREATE TABLE permit_framework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,

    -- Rule Object
    dimension_type dimension_type NOT NULL,
    threshold_value NUMERIC(10,2) NOT NULL,
    threshold_unit TEXT NOT NULL DEFAULT 'ft',    -- ft, m, lbs, kg, tons
    result_action threshold_action NOT NULL,
    escort_count INTEGER DEFAULT 0,

    -- Conditions
    applies_to_road_type TEXT,                    -- interstate, state_highway, local, all
    applies_to_load_type TEXT,                    -- any, superload, wind, modular, etc.
    conditional_notes TEXT,

    -- Machine-readable submission advantage
    submission_format TEXT,                       -- online, fax, email, portal
    avg_processing_hours NUMERIC(6,1),
    rush_available BOOLEAN DEFAULT FALSE,
    rush_fee_cents BIGINT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: ESCORT REGULATION (Certification & Reciprocity)
-- ============================================================
-- P/EVO, WITPAC, civilian vs police, reciprocity.
-- Institutional memory at scale — not in people's heads.
CREATE TABLE escort_regulation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,

    -- Escort Rules
    civilian_escort_allowed BOOLEAN DEFAULT TRUE,
    police_required_threshold TEXT,               -- Description of when police required
    certification_required BOOLEAN DEFAULT FALSE,
    certification_name TEXT,                      -- P/EVO, WITPAC, state-specific
    certification_provider TEXT,                  -- ESC, state DOT, etc.
    certification_url TEXT,
    certification_reciprocity BOOLEAN DEFAULT FALSE,
    reciprocity_states TEXT[],                    -- Which states honor this cert
    reciprocity_notes TEXT,

    -- Height Pole
    height_pole_required BOOLEAN DEFAULT FALSE,
    height_pole_threshold_ft NUMERIC(5,2),
    height_pole_certification TEXT,

    -- Lead/Chase
    lead_chase_rules TEXT,
    min_escort_distance_ft INTEGER,
    max_convoy_length TEXT,

    -- Permit Officer Intelligence (Dirty Competitive Advantage)
    officer_preferences JSONB,                   -- Track what officers prefer
    common_rejection_reasons TEXT[],
    avg_response_time_hours NUMERIC(6,1),
    escalation_path TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(jurisdiction_id)
);

-- ============================================================
-- TABLE 4: MOVEMENT RESTRICTION (Friday Night Calculator — Global)
-- ============================================================
-- Every weekend ban, holiday ban, night rule, curfew.
-- European countries restrict heavy vehicles on weekends.
-- This becomes your Friday-night calculator globally.
CREATE TABLE movement_restriction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,

    -- Restriction
    restriction_type restriction_type NOT NULL,
    applies_to TEXT DEFAULT 'all',                -- metro, interstate, all, specific_route
    start_time TIME,
    end_time TIME,
    day_of_week TEXT[],                           -- MONDAY, TUESDAY...
    seasonal_start DATE,
    seasonal_end DATE,
    metro_areas TEXT[],
    specific_routes TEXT[],

    -- Impact
    absolute_ban BOOLEAN DEFAULT FALSE,           -- No movement at all vs conditional
    escort_override BOOLEAN DEFAULT FALSE,        -- Can escorts override this?
    police_override BOOLEAN DEFAULT FALSE,

    notes TEXT,
    source_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: ESCORT EQUIPMENT SPECS (Light & Sign Spec Sheet)
-- ============================================================
-- Eliminates 80% of citation risk.
-- MUTCD reference tracking per jurisdiction.
CREATE TABLE escort_equipment_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,

    -- Sign Specs
    sign_size TEXT,                               -- e.g. "7ft x 18in"
    sign_text TEXT DEFAULT 'OVERSIZE LOAD',
    font_color TEXT,
    background_color TEXT,
    reflectivity_spec TEXT,
    front_sign_required BOOLEAN DEFAULT TRUE,
    rear_sign_required BOOLEAN DEFAULT TRUE,

    -- Flag Specs
    flag_size TEXT,                               -- e.g. "18in x 18in"
    flag_color TEXT DEFAULT 'red/orange',
    flag_positions TEXT,                          -- corners, extremities

    -- Light Specs
    amber_beacon_visibility TEXT,                 -- "500 ft", "1000 ft", "360°"
    roof_mount_required BOOLEAN DEFAULT FALSE,
    dash_mount_allowed BOOLEAN DEFAULT TRUE,
    strobe_pattern_rules TEXT,
    light_color TEXT DEFAULT 'amber',
    light_count INTEGER,

    -- Reference
    mutcd_reference BOOLEAN DEFAULT FALSE,
    mutcd_section TEXT,
    ticket_risk INTEGER CHECK (ticket_risk BETWEEN 1 AND 5),

    -- Marketplace Opportunity (white-label gear)
    gear_bundle_sku TEXT,                         -- Link to store_products

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(jurisdiction_id)
);

-- ============================================================
-- TABLE 6: POLICE ESCORT UNITS (Calendar & Scheduling)
-- ============================================================
-- Police coordination is 3% human work.
-- Track scheduling, blackouts, rates.
CREATE TABLE police_escort_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,

    -- Unit Info
    district TEXT,
    unit_name TEXT,
    scheduling_contact TEXT,
    phone TEXT,
    email TEXT,
    booking_url TEXT,

    -- Scheduling
    lead_time_days INTEGER,
    per_hour_rate_cents BIGINT,
    min_hours INTEGER,
    weekend_available BOOLEAN DEFAULT FALSE,
    night_available BOOLEAN DEFAULT FALSE,
    holiday_available BOOLEAN DEFAULT FALSE,

    -- Calendar Intelligence
    blackout_dates JSONB,                         -- Array of date ranges
    construction_zones JSONB,                     -- Active zones affecting scheduling
    seasonal_restrictions JSONB,

    -- Performance (Darwinism Engine for police units too)
    reliability_score NUMERIC(3,2),               -- 0-5
    avg_wait_time_minutes INTEGER,
    known_delay_issues TEXT,

    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 7: AUTHORITY NODE GRAPH (Multi-Authority Scale Layer)
-- ============================================================
-- Authority → Controls → Rule → Applies_To → Load_Type
-- Enables multi-authority routes (city inside county inside state inside federal).
-- Add country → connect nodes → no rebuild.
CREATE TABLE authority_node_graph (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    parent_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,
    relationship_type authority_relationship NOT NULL,

    -- Scope
    scope TEXT,                                   -- What the relationship governs
    priority_order INTEGER DEFAULT 0,             -- Which authority takes precedence

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(parent_id, child_id),
    CHECK(parent_id != child_id)
);

-- ============================================================
-- TABLE 8: REGULATORY CONFIDENCE (Trust Your Own Data)
-- ============================================================
-- Because global data is messy.
-- System knows when NOT to trust itself.
CREATE TABLE regulatory_confidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,

    source_count INTEGER DEFAULT 0,
    last_verified TIMESTAMPTZ,
    enforcement_history_score NUMERIC(3,1) CHECK (enforcement_history_score BETWEEN 0 AND 10),
    contradiction_detected BOOLEAN DEFAULT FALSE,
    contradiction_details TEXT,
    confidence_score NUMERIC(3,1) CHECK (confidence_score BETWEEN 0 AND 10),
    data_source_urls TEXT[],

    -- Verification tracking
    verified_by TEXT,                             -- system, filer_id, manual
    verification_method TEXT,                     -- web_scrape, phone_call, permit_filing

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(jurisdiction_id)
);

-- ============================================================
-- TABLE 9: GLOBAL CORRIDOR INDEX (Own the Industry Memory)
-- ============================================================
-- Oversized freight moves on repeat corridors.
-- Own the corridors → own the industry memory.
CREATE TABLE global_corridor_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    corridor_name TEXT NOT NULL,                  -- "I-10 FL→TX", "Trans-Canada ON→AB"
    origin_jurisdiction_id UUID REFERENCES jurisdiction_master(id),
    dest_jurisdiction_id UUID REFERENCES jurisdiction_master(id),
    transit_jurisdictions UUID[],                 -- All jurisdictions crossed

    -- Scoring
    project_density_score INTEGER CHECK (project_density_score BETWEEN 1 AND 10),
    enforcement_score INTEGER CHECK (enforcement_score BETWEEN 1 AND 10),
    infrastructure_quality INTEGER CHECK (infrastructure_quality BETWEEN 1 AND 10),
    permit_friction_score INTEGER CHECK (permit_friction_score BETWEEN 1 AND 10),
    corridor_heat_score NUMERIC(5,2),             -- Computed

    -- Usage Intelligence
    times_used INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    top_load_types TEXT[],                        -- wind, modular, tank, transformer
    avg_transit_days NUMERIC(4,1),
    avg_permit_cost_cents BIGINT,

    -- Seasonal
    seasonal_notes TEXT,                          -- Spring thaw, hurricane, winter
    seasonal_risk_months INTEGER[],               -- 1-12

    -- Revenue
    total_revenue_cents BIGINT DEFAULT 0,
    avg_margin_percent NUMERIC(5,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: GLOBAL MARKET READINESS (Expansion Math, Not Emotion)
-- ============================================================
-- Score every country. Expansion becomes mathematical.
CREATE TABLE global_market_readiness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    country_code TEXT NOT NULL UNIQUE,            -- ISO 3166-1
    country_name TEXT NOT NULL,
    market_size_billions NUMERIC(8,2),
    market_share_pct NUMERIC(5,2),
    tier market_tier NOT NULL,

    -- Heat Score Components
    industrial_spend_score INTEGER CHECK (industrial_spend_score BETWEEN 1 AND 10),
    freight_volume_score INTEGER CHECK (freight_volume_score BETWEEN 1 AND 10),
    regulatory_structure_score INTEGER CHECK (regulatory_structure_score BETWEEN 1 AND 10),
    digital_permit_adoption INTEGER CHECK (digital_permit_adoption BETWEEN 1 AND 10),
    enforcement_strength INTEGER CHECK (enforcement_strength BETWEEN 1 AND 10),

    -- Computed
    -- (Industrial Spend × Freight Volume) + Regulatory + Digital + Enforcement
    market_heat_score NUMERIC(6,2),

    -- Strategy
    entry_strategy TEXT,                          -- Direct, Partnership, Monitor
    key_sectors TEXT[],                           -- energy, mining, construction, wind
    primary_challenge TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- MOVEMENT RISK SCORE FUNCTION
-- ============================================================
-- +2 if Friday night
-- +2 if Metro area
-- +2 if Height > jurisdiction threshold
-- +3 if Superload
-- +1 if strict equipment spec state
-- +2 if Police required
-- +1 if low confidence score
-- ≥ 6 → RED ALERT
CREATE OR REPLACE FUNCTION calculate_movement_risk(
    p_jurisdiction_id UUID,
    p_width_ft NUMERIC,
    p_height_ft NUMERIC,
    p_length_ft NUMERIC,
    p_weight_lbs INTEGER,
    p_is_friday BOOLEAN DEFAULT FALSE,
    p_is_metro BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    risk_score INTEGER,
    risk_level TEXT,
    escort_required BOOLEAN,
    police_required BOOLEAN,
    height_pole_required BOOLEAN,
    restrictions TEXT[]
) AS $$
DECLARE
    v_score INTEGER := 0;
    v_escorts BOOLEAN := FALSE;
    v_police BOOLEAN := FALSE;
    v_height_pole BOOLEAN := FALSE;
    v_restrictions TEXT[] := '{}';
    v_confidence NUMERIC;
    v_ticket_risk INTEGER;
BEGIN
    -- Friday night
    IF p_is_friday THEN
        v_score := v_score + 2;
        v_restrictions := array_append(v_restrictions, 'FRIDAY_NIGHT');
    END IF;

    -- Metro area
    IF p_is_metro THEN
        v_score := v_score + 2;
        v_restrictions := array_append(v_restrictions, 'METRO_AREA');
    END IF;

    -- Check permit framework for escort triggers
    IF EXISTS (
        SELECT 1 FROM permit_framework
        WHERE jurisdiction_id = p_jurisdiction_id
          AND dimension_type = 'WIDTH'
          AND p_width_ft >= threshold_value
          AND result_action IN ('ESCORT_REQUIRED', 'MULTI_ESCORT')
    ) THEN
        v_escorts := TRUE;
        v_score := v_score + 2;
    END IF;

    -- Check for police requirement
    IF EXISTS (
        SELECT 1 FROM permit_framework
        WHERE jurisdiction_id = p_jurisdiction_id
          AND result_action = 'POLICE_REQUIRED'
          AND (
            (dimension_type = 'WIDTH' AND p_width_ft >= threshold_value) OR
            (dimension_type = 'HEIGHT' AND p_height_ft >= threshold_value) OR
            (dimension_type = 'LENGTH' AND p_length_ft >= threshold_value) OR
            (dimension_type = 'WEIGHT' AND p_weight_lbs >= threshold_value)
          )
    ) THEN
        v_police := TRUE;
        v_score := v_score + 2;
    END IF;

    -- Superload check
    IF EXISTS (
        SELECT 1 FROM permit_framework
        WHERE jurisdiction_id = p_jurisdiction_id
          AND result_action = 'SUPERLOAD'
          AND (
            (dimension_type = 'WEIGHT' AND p_weight_lbs >= threshold_value) OR
            (dimension_type = 'WIDTH' AND p_width_ft >= threshold_value) OR
            (dimension_type = 'HEIGHT' AND p_height_ft >= threshold_value)
          )
    ) THEN
        v_score := v_score + 3;
        v_restrictions := array_append(v_restrictions, 'SUPERLOAD');
    END IF;

    -- Height pole check
    SELECT height_pole_required, height_pole_threshold_ft
    INTO v_height_pole
    FROM escort_regulation
    WHERE jurisdiction_id = p_jurisdiction_id
      AND height_pole_required = TRUE
      AND p_height_ft >= height_pole_threshold_ft;

    IF v_height_pole THEN
        v_score := v_score + 1;
    END IF;

    -- Equipment spec strictness
    SELECT ticket_risk INTO v_ticket_risk
    FROM escort_equipment_specs
    WHERE jurisdiction_id = p_jurisdiction_id;

    IF v_ticket_risk >= 4 THEN
        v_score := v_score + 1;
        v_restrictions := array_append(v_restrictions, 'STRICT_EQUIPMENT_STATE');
    END IF;

    -- Confidence penalty
    SELECT confidence_score INTO v_confidence
    FROM regulatory_confidence
    WHERE jurisdiction_id = p_jurisdiction_id;

    IF v_confidence IS NOT NULL AND v_confidence < 5 THEN
        v_score := v_score + 1;
        v_restrictions := array_append(v_restrictions, 'LOW_CONFIDENCE_DATA');
    END IF;

    RETURN QUERY SELECT
        v_score,
        CASE
            WHEN v_score >= 6 THEN 'RED_ALERT'
            WHEN v_score >= 4 THEN 'YELLOW_WARNING'
            ELSE 'GREEN_CLEAR'
        END,
        v_escorts,
        v_police,
        v_height_pole,
        v_restrictions;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- INDEXES (Performance)
-- ============================================================
CREATE INDEX idx_jm_country ON jurisdiction_master(country_code);
CREATE INDEX idx_jm_region ON jurisdiction_master(region_code);
CREATE INDEX idx_jm_country_region ON jurisdiction_master(country_code, region_code);
CREATE INDEX idx_jm_type ON jurisdiction_master(authority_type);
CREATE INDEX idx_jm_nightmare ON jurisdiction_master(nightmare_state) WHERE nightmare_state = TRUE;

CREATE INDEX idx_pf_jurisdiction ON permit_framework(jurisdiction_id);
CREATE INDEX idx_pf_dimension ON permit_framework(dimension_type);
CREATE INDEX idx_pf_action ON permit_framework(result_action);

CREATE INDEX idx_er_jurisdiction ON escort_regulation(jurisdiction_id);

CREATE INDEX idx_mr_jurisdiction ON movement_restriction(jurisdiction_id);
CREATE INDEX idx_mr_type ON movement_restriction(restriction_type);
CREATE INDEX idx_mr_day ON movement_restriction USING GIN(day_of_week);

CREATE INDEX idx_ees_jurisdiction ON escort_equipment_specs(jurisdiction_id);

CREATE INDEX idx_peu_jurisdiction ON police_escort_units(jurisdiction_id);
CREATE INDEX idx_peu_district ON police_escort_units(district);

CREATE INDEX idx_ang_parent ON authority_node_graph(parent_id);
CREATE INDEX idx_ang_child ON authority_node_graph(child_id);

CREATE INDEX idx_rc_jurisdiction ON regulatory_confidence(jurisdiction_id);
CREATE INDEX idx_rc_confidence ON regulatory_confidence(confidence_score);

CREATE INDEX idx_gci_origin ON global_corridor_index(origin_jurisdiction_id);
CREATE INDEX idx_gci_dest ON global_corridor_index(dest_jurisdiction_id);
CREATE INDEX idx_gci_heat ON global_corridor_index(corridor_heat_score DESC);

CREATE INDEX idx_gmr_country ON global_market_readiness(country_code);
CREATE INDEX idx_gmr_tier ON global_market_readiness(tier);
CREATE INDEX idx_gmr_heat ON global_market_readiness(market_heat_score DESC);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Regulatory data is shared (part of the moat).
-- Reading is public. Writing is admin-only.

ALTER TABLE jurisdiction_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_framework ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_regulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_restriction ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_equipment_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_escort_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_node_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_confidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_corridor_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_market_readiness ENABLE ROW LEVEL SECURITY;

-- Public read access (intelligence is the moat, not secrecy)
CREATE POLICY jm_public_read ON jurisdiction_master FOR SELECT USING (true);
CREATE POLICY pf_public_read ON permit_framework FOR SELECT USING (true);
CREATE POLICY er_public_read ON escort_regulation FOR SELECT USING (true);
CREATE POLICY mr_public_read ON movement_restriction FOR SELECT USING (true);
CREATE POLICY ees_public_read ON escort_equipment_specs FOR SELECT USING (true);
CREATE POLICY peu_public_read ON police_escort_units FOR SELECT USING (true);
CREATE POLICY ang_public_read ON authority_node_graph FOR SELECT USING (true);
CREATE POLICY rc_public_read ON regulatory_confidence FOR SELECT USING (true);
CREATE POLICY gci_public_read ON global_corridor_index FOR SELECT USING (true);
CREATE POLICY gmr_public_read ON global_market_readiness FOR SELECT USING (true);

-- Admin write access (service_role key only)
-- In production, use: auth.jwt() ->> 'role' = 'service_role'
-- For now, inserts/updates/deletes require service_role key


-- ============================================================
-- VIEWS (Filtered Dashboards — UI Reads These)
-- ============================================================

-- 50-State Escort Trigger Cheat Sheet
CREATE OR REPLACE VIEW v_escort_trigger_cheatsheet AS
SELECT
    jm.country_code,
    jm.region_code,
    jm.authority_name,
    pf.dimension_type,
    pf.threshold_value,
    pf.threshold_unit,
    pf.result_action,
    pf.escort_count,
    er.certification_required,
    er.certification_name,
    er.height_pole_required,
    jm.nightmare_state,
    jm.premium_pricing_zone
FROM jurisdiction_master jm
LEFT JOIN permit_framework pf ON pf.jurisdiction_id = jm.id
LEFT JOIN escort_regulation er ON er.jurisdiction_id = jm.id
WHERE jm.authority_type IN ('STATE', 'PROVINCIAL')
ORDER BY jm.country_code, jm.region_code, pf.dimension_type;

-- Friday Night Movement Lookup
CREATE OR REPLACE VIEW v_friday_night_movement AS
SELECT
    jm.country_code,
    jm.region_code,
    jm.authority_name,
    mr.restriction_type,
    mr.start_time,
    mr.end_time,
    mr.day_of_week,
    mr.metro_areas,
    mr.absolute_ban,
    mr.escort_override,
    mr.police_override,
    mr.notes
FROM jurisdiction_master jm
JOIN movement_restriction mr ON mr.jurisdiction_id = jm.id
WHERE mr.restriction_type IN ('NIGHT', 'WEEKEND', 'CURFEW')
ORDER BY jm.country_code, jm.region_code;

-- FL + GA Quick Reference
CREATE OR REPLACE VIEW v_fl_ga_quick_reference AS
SELECT
    jm.*,
    er.civilian_escort_allowed,
    er.police_required_threshold,
    er.certification_required,
    er.certification_name,
    er.height_pole_required,
    er.height_pole_threshold_ft,
    ees.sign_size,
    ees.amber_beacon_visibility,
    ees.ticket_risk,
    rc.confidence_score
FROM jurisdiction_master jm
LEFT JOIN escort_regulation er ON er.jurisdiction_id = jm.id
LEFT JOIN escort_equipment_specs ees ON ees.jurisdiction_id = jm.id
LEFT JOIN regulatory_confidence rc ON rc.jurisdiction_id = jm.id
WHERE jm.region_code IN ('FL', 'GA')
  AND jm.authority_type = 'STATE';

-- U.S. + Canada Superload Police Matrix
CREATE OR REPLACE VIEW v_superload_police_matrix AS
SELECT
    jm.country_code,
    jm.region_code,
    jm.authority_name,
    pf.threshold_value AS superload_threshold,
    pf.threshold_unit,
    jm.police_escort_likelihood,
    peu.district,
    peu.scheduling_contact,
    peu.lead_time_days,
    peu.per_hour_rate_cents,
    peu.weekend_available,
    peu.night_available,
    peu.reliability_score
FROM jurisdiction_master jm
JOIN permit_framework pf ON pf.jurisdiction_id = jm.id
    AND pf.result_action = 'SUPERLOAD'
LEFT JOIN police_escort_units peu ON peu.jurisdiction_id = jm.id
WHERE jm.country_code IN ('US', 'CA')
ORDER BY jm.country_code, jm.region_code;


-- ============================================================
-- SUPPORT GRID: GOVT & DOT CONTACTS (Step 17)
-- ============================================================
-- Department-specific contact directory for permit offices,
-- bridge divisions, maintenance departments, and emergency services.
-- Enables direct outreach for permit applications, route clearances,
-- and emergency coordination.
-- ============================================================

CREATE TABLE jurisdiction_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID NOT NULL REFERENCES jurisdiction_master(id) ON DELETE CASCADE,
    department_name TEXT, -- PERMITS, ENGINEERING, BRIDGE, MAINTENANCE, EMERGENCY
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jurisdiction_contacts_jurisdiction ON jurisdiction_contacts(jurisdiction_id);
CREATE INDEX idx_jurisdiction_contacts_department ON jurisdiction_contacts(department_name);

-- RLS for jurisdiction_contacts
ALTER TABLE jurisdiction_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY jc_public_read ON jurisdiction_contacts FOR SELECT USING (true);

COMMENT ON TABLE jurisdiction_contacts IS 'Support Grid Step 17: Government and DOT department contacts for permit coordination, engineering review, and emergency services';
