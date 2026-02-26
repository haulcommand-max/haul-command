-- ============================================================
-- HC-GIS PLANE 2: MOVEMENT + ORCHESTRATION ENGINE
-- The Uber Layer + Movement Decision AI™
-- ============================================================
-- "This is where you win."
-- Match load → compliant escorts → verified equipment →
-- proper certifications → payment secured → dispatch initiated.
-- Now you're not "information." You're movement control.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE load_status AS ENUM (
    'DRAFT',
    'POSTED',           -- Available for matching
    'MATCHING',         -- Algorithm running
    'MATCHED',          -- Operators assigned
    'CONFIRMED',        -- All parties confirmed
    'IN_TRANSIT',       -- Currently moving
    'COMPLETED',        -- Successfully delivered
    'CANCELLED',
    'DISPUTED'
);

CREATE TYPE coordination_status AS ENUM (
    'NOT_NEEDED',
    'PENDING',
    'REQUESTED',
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
);

-- ============================================================
-- TABLE 1: ACTIVE LOAD (The Movement Request)
-- ============================================================
-- Every load that needs coordination.
-- Feeds: S1, S2, S3, S4 simultaneously.
CREATE TABLE active_load (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id),  -- Who posted this load

    -- Load identity
    load_number TEXT UNIQUE NOT NULL,                -- HC-2025-FL-00001
    load_type TEXT NOT NULL,                         -- OVERSIZE, SUPERLOAD, WIND, MODULAR, BOAT, CRANE, MILITARY, OTHER

    -- Dimensions (the inputs to Movement Decision AI)
    width_ft NUMERIC(6,2),
    height_ft NUMERIC(6,2),
    length_ft NUMERIC(6,2),
    weight_lbs INTEGER,
    overhang_front_ft NUMERIC(5,2),
    overhang_rear_ft NUMERIC(5,2),
    axle_count INTEGER,
    axle_spacing_ft NUMERIC(5,2),

    -- Cargo description
    cargo_description TEXT,
    commodity_code TEXT,
    hazmat BOOLEAN DEFAULT FALSE,
    hazmat_class TEXT,

    -- Route
    origin_city TEXT,
    origin_state TEXT,
    origin_lat NUMERIC(10,7),
    origin_lng NUMERIC(10,7),
    dest_city TEXT,
    dest_state TEXT,
    dest_lat NUMERIC(10,7),
    dest_lng NUMERIC(10,7),
    transit_states TEXT[],                           -- All states crossed
    route_id UUID,                                   -- FK to routes table
    corridor_id UUID,                                -- FK to global_corridor_index
    estimated_miles INTEGER,

    -- Schedule
    requested_pickup_date DATE,
    requested_delivery_date DATE,
    flexible_dates BOOLEAN DEFAULT FALSE,
    movement_window_start TIME,
    movement_window_end TIME,

    -- Requirements (output from Movement Decision AI)
    escorts_required INTEGER DEFAULT 0,
    police_required BOOLEAN DEFAULT FALSE,
    utility_required BOOLEAN DEFAULT FALSE,
    survey_required BOOLEAN DEFAULT FALSE,
    height_pole_required BOOLEAN DEFAULT FALSE,
    permit_required BOOLEAN DEFAULT FALSE,

    -- Movement Decision reference
    movement_decision_id UUID,                       -- FK to movement_decision
    risk_score INTEGER,
    risk_level TEXT,

    -- Budget
    shipper_budget_cents BIGINT,
    estimated_total_cents BIGINT,

    -- Status
    status load_status DEFAULT 'DRAFT',
    posted_at TIMESTAMPTZ,
    matched_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: ESCORT AVAILABILITY (Real-Time Supply)
-- ============================================================
-- "Uber for escorts" — the supply side.
-- Escorts post when and where they're available.
-- Feeds: S2 (Escort Marketplace)
CREATE TABLE escort_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id),

    -- Availability window
    available_date DATE NOT NULL,
    available_start TIME,
    available_end TIME,
    all_day BOOLEAN DEFAULT FALSE,

    -- Location
    current_city TEXT,
    current_state TEXT,
    current_lat NUMERIC(10,7),
    current_lng NUMERIC(10,7),
    willing_to_travel_miles INTEGER DEFAULT 100,

    -- Capabilities
    escort_type TEXT NOT NULL,                      -- PILOT_CAR, HIGH_POLE, BUCKET_TRUCK, POLICE_OFFDUTY
    has_oversize_signs BOOLEAN DEFAULT FALSE,
    has_height_pole BOOLEAN DEFAULT FALSE,
    height_pole_max_ft NUMERIC(5,2),
    has_amber_beacon BOOLEAN DEFAULT FALSE,
    has_cb_radio BOOLEAN DEFAULT FALSE,
    has_flags BOOLEAN DEFAULT FALSE,

    -- Certifications (denormalized for fast matching)
    certified_states TEXT[],                        -- States with active certs
    hc_score NUMERIC(4,1),                          -- Snapshot for matching speed

    -- Pricing
    rate_per_hour_cents BIGINT,
    rate_per_mile_cents BIGINT,
    minimum_charge_cents BIGINT,
    accepts_quick_pay BOOLEAN DEFAULT FALSE,

    -- Status
    booked BOOLEAN DEFAULT FALSE,
    booked_load_id UUID,                            -- FK to active_load when matched

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: UTILITY CREW AVAILABILITY (S4)
-- ============================================================
-- Bucket trucks + powerline lifts + utility coordination.
CREATE TABLE utility_crew_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id),

    -- Availability
    available_date DATE NOT NULL,
    available_start TIME,
    available_end TIME,

    -- Location
    service_area_state TEXT,
    service_area_city TEXT,
    service_lat NUMERIC(10,7),
    service_lng NUMERIC(10,7),
    service_radius_miles INTEGER DEFAULT 50,

    -- Capabilities
    crew_type TEXT NOT NULL,                        -- BUCKET_TRUCK, LINEMAN_CREW, POWERLINE_LIFT, TRAFFIC_CONTROL
    equipment_description TEXT,
    max_height_ft NUMERIC(5,2),
    crew_size INTEGER,

    -- Utility company coordination
    utility_company TEXT,                            -- Which utility they're authorized with
    pre_approved BOOLEAN DEFAULT FALSE,

    -- Pricing
    rate_per_hour_cents BIGINT,
    minimum_hours INTEGER DEFAULT 2,
    minimum_charge_cents BIGINT,

    -- Status
    booked BOOLEAN DEFAULT FALSE,
    booked_load_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: POLICE COORDINATION (S3)
-- ============================================================
-- Police scheduling per load.
-- "If you become the scheduling buffer between carriers and authorities,
--  you become default infrastructure."
CREATE TABLE police_coordination (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES active_load(id) ON DELETE CASCADE,
    police_unit_id UUID REFERENCES police_escort_units(id),

    -- Coordination
    status coordination_status DEFAULT 'PENDING',
    jurisdiction_id UUID REFERENCES jurisdiction_master(id),
    state_code TEXT,
    district TEXT,

    -- Schedule
    requested_date DATE,
    requested_start_time TIME,
    confirmed_date DATE,
    confirmed_start_time TIME,
    estimated_duration_hours NUMERIC(4,1),

    -- Contact
    officer_name TEXT,
    officer_phone TEXT,
    officer_badge TEXT,
    confirmation_number TEXT,

    -- Cost
    quoted_rate_cents BIGINT,
    actual_cost_cents BIGINT,
    admin_fee_cents BIGINT DEFAULT 0,              -- HC revenue on police coordination
    payment_status TEXT DEFAULT 'UNPAID',

    -- Intelligence (data monopoly)
    scheduling_delay_hours NUMERIC(5,1),           -- How long from request to confirmation
    officer_reliability_score NUMERIC(3,2),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: ROUTE SURVEY (S12)
-- ============================================================
-- Route survey team assignments.
CREATE TABLE route_survey (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID REFERENCES active_load(id),
    surveyor_id UUID NOT NULL REFERENCES operator_profile(id),

    -- Survey scope
    route_id UUID,                                  -- FK to routes
    survey_type TEXT NOT NULL,                      -- HEIGHT_CLEARANCE, WEIGHT_BRIDGE, FULL_ROUTE, TURN_RADIUS, CONSTRUCTION
    priority TEXT DEFAULT 'NORMAL',                 -- URGENT, HIGH, NORMAL, LOW

    -- Schedule
    scheduled_date DATE,
    completed_date DATE,
    status coordination_status DEFAULT 'PENDING',

    -- Results
    survey_data JSONB,                              -- Clearances, photos, measurements
    obstacles_found INTEGER DEFAULT 0,
    route_approved BOOLEAN,
    alternative_route_suggested BOOLEAN DEFAULT FALSE,
    alternitive_route_notes TEXT,

    -- Documents
    report_url TEXT,
    photo_urls TEXT[],

    -- Cost
    survey_fee_cents BIGINT,
    payment_status TEXT DEFAULT 'UNPAID',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: LOAD CONTRACT (Binding Agreements)
-- ============================================================
-- Binding agreements between parties.
-- Feeds: S2, S3, S4, S16
CREATE TABLE load_contract (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES active_load(id),

    -- Parties
    shipper_id UUID REFERENCES operator_profile(id),
    carrier_id UUID REFERENCES operator_profile(id),
    escort_ids UUID[],                              -- Multiple escorts possible
    broker_id UUID REFERENCES operator_profile(id),

    -- Contract
    contract_number TEXT UNIQUE,
    contract_type TEXT NOT NULL,                    -- ESCORT_ASSIGNMENT, TRANSPORT, UTILITY_COORDINATION, POLICE_COORDINATION, SURVEY
    terms JSONB,                                    -- Structured contract terms

    -- Financial
    total_value_cents BIGINT,
    hc_fee_cents BIGINT DEFAULT 0,                 -- Haul Command transaction fee
    hc_fee_percent NUMERIC(5,2) DEFAULT 5.00,
    escrow_id UUID,                                 -- FK to escrow_hold

    -- Status
    status TEXT DEFAULT 'DRAFT',                   -- DRAFT, SENT, ACCEPTED, ACTIVE, COMPLETED, DISPUTED, CANCELLED
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Signatures (digital)
    shipper_signed BOOLEAN DEFAULT FALSE,
    carrier_signed BOOLEAN DEFAULT FALSE,
    escort_signed BOOLEAN DEFAULT FALSE,

    -- Document
    document_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 7: DISPATCH LOG (Every Action Logged)
-- ============================================================
-- Feeds the Data Monopoly Layer.
CREATE TABLE dispatch_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES active_load(id),
    operator_id UUID REFERENCES operator_profile(id),

    -- Action
    action TEXT NOT NULL,                           -- POSTED, MATCHED, ESCORT_ASSIGNED, POLICE_SCHEDULED, UTILITY_BOOKED, DISPATCHED, EN_ROUTE, CHECKPOINT, DELAY, COMPLETED, INCIDENT
    action_details JSONB,

    -- Location (if applicable)
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    location_description TEXT,

    -- Timestamp
    occurred_at TIMESTAMPTZ DEFAULT NOW(),

    -- Automated?
    automated BOOLEAN DEFAULT FALSE,               -- Was this action triggered by system
    trigger_source TEXT                             -- VAPI, API, MANUAL, ALGORITHM, WEBHOOK
);

-- ============================================================
-- TABLE 8: MOVEMENT DECISION (Stored AI Outputs)
-- ============================================================
-- Every decision the Movement Decision AI produces.
-- This is the data moat. After 12 months, this is gold.
-- Feeds: S5, S12, S13
CREATE TABLE movement_decision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requested_by UUID REFERENCES operator_profile(id),

    -- Input
    input_width_ft NUMERIC(6,2),
    input_height_ft NUMERIC(6,2),
    input_length_ft NUMERIC(6,2),
    input_weight_lbs INTEGER,
    input_origin_state TEXT,
    input_dest_state TEXT,
    input_transit_states TEXT[],
    input_date DATE,
    input_is_friday BOOLEAN DEFAULT FALSE,
    input_is_metro BOOLEAN DEFAULT FALSE,

    -- Decision output (the full Movement Decision AI™ result)
    risk_score INTEGER,
    risk_level TEXT,                                -- GREEN_CLEAR, YELLOW_WARNING, RED_ALERT

    -- Escorts
    escorts_required INTEGER DEFAULT 0,
    escort_type_needed TEXT[],                     -- PILOT_CAR, HIGH_POLE, BUCKET_TRUCK
    escort_certifications_needed TEXT[],           -- P/EVO, WITPAC, state-specific

    -- Police
    police_required BOOLEAN DEFAULT FALSE,
    police_likelihood TEXT,                        -- NEVER, RARE, COMMON, MANDATORY
    police_lead_time_days INTEGER,
    police_estimated_cost_cents BIGINT,

    -- Utility
    utility_required BOOLEAN DEFAULT FALSE,
    utility_type_needed TEXT[],                    -- BUCKET_TRUCK, POWERLINE_LIFT
    utility_estimated_cost_cents BIGINT,

    -- Movement window
    movement_windows JSONB,                        -- Array of {day, start_time, end_time, restrictions}
    curfew_restrictions TEXT[],
    friday_restricted BOOLEAN DEFAULT FALSE,

    -- Equipment
    equipment_requirements JSONB,                  -- Signs, flags, lights, height pole specs per state

    -- Permits
    permits_needed TEXT[],                         -- State permit types
    estimated_permit_cost_cents BIGINT,
    estimated_processing_hours NUMERIC(6,1),

    -- Total
    estimated_total_cost_cents BIGINT,             -- All-in cost estimate
    confidence_score NUMERIC(3,1),                 -- How confident the AI is (0-10)

    -- Movement Approval Certificate™
    certificate_generated BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    certificate_data JSONB,                        -- Structured PDF data

    -- Subscription tier check
    subscription_tier_required TEXT,                -- Which tier can access this result
    free_check_used BOOLEAN DEFAULT FALSE,         -- Was this one of the 3 free checks

    -- Metadata
    processing_time_ms INTEGER,
    api_version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- FUNCTION: GENERATE MOVEMENT DECISION
-- ============================================================
-- Movement Decision AI™
-- Input: Dimensions + Route + Date
-- Output: Escorts + Police + Utility + Risk + Curfews + Equipment + Cost
CREATE OR REPLACE FUNCTION generate_movement_decision(
    p_operator_id UUID,
    p_width_ft NUMERIC,
    p_height_ft NUMERIC,
    p_length_ft NUMERIC,
    p_weight_lbs INTEGER,
    p_origin_state TEXT,
    p_dest_state TEXT,
    p_transit_states TEXT[],
    p_date DATE,
    p_is_metro BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_decision_id UUID;
    v_risk_score INTEGER := 0;
    v_risk_level TEXT;
    v_escorts INTEGER := 0;
    v_police BOOLEAN := FALSE;
    v_utility BOOLEAN := FALSE;
    v_friday BOOLEAN := FALSE;
    v_escort_types TEXT[] := '{}';
    v_cert_needs TEXT[] := '{}';
    v_curfews TEXT[] := '{}';
    v_permits TEXT[] := '{}';
    v_permit_cost BIGINT := 0;
    v_police_cost BIGINT := 0;
    v_total_cost BIGINT := 0;
    v_confidence NUMERIC := 8.0;
    v_state TEXT;
    v_jurisdiction_id UUID;
    rec RECORD;
BEGIN
    -- Friday check
    v_friday := EXTRACT(DOW FROM p_date) IN (5, 6);  -- Friday or Saturday

    -- Process each state in the route
    FOREACH v_state IN ARRAY (
        SELECT ARRAY(
            SELECT DISTINCT unnest
            FROM unnest(ARRAY[p_origin_state] || COALESCE(p_transit_states, '{}') || ARRAY[p_dest_state])
        )
    )
    LOOP
        -- Find jurisdiction
        SELECT id INTO v_jurisdiction_id
        FROM jurisdiction_master
        WHERE region_code = v_state AND authority_type = 'STATE'
        LIMIT 1;

        IF v_jurisdiction_id IS NULL THEN
            v_confidence := v_confidence - 1.0;
            CONTINUE;
        END IF;

        -- Check escort triggers
        FOR rec IN
            SELECT * FROM permit_framework
            WHERE jurisdiction_id = v_jurisdiction_id
              AND (
                  (dimension_type = 'WIDTH' AND p_width_ft >= threshold_value) OR
                  (dimension_type = 'HEIGHT' AND p_height_ft >= threshold_value) OR
                  (dimension_type = 'LENGTH' AND p_length_ft >= threshold_value) OR
                  (dimension_type = 'WEIGHT' AND p_weight_lbs >= threshold_value)
              )
        LOOP
            IF rec.result_action IN ('ESCORT_REQUIRED', 'MULTI_ESCORT') THEN
                v_escorts := GREATEST(v_escorts, COALESCE(rec.escort_count, 1));
                v_escort_types := array_append(v_escort_types, 'PILOT_CAR');
                v_risk_score := v_risk_score + 2;
            END IF;

            IF rec.result_action = 'POLICE_REQUIRED' THEN
                v_police := TRUE;
                v_risk_score := v_risk_score + 2;
                v_police_cost := v_police_cost + 50000;  -- ~$500 estimate per state
            END IF;

            IF rec.result_action = 'SUPERLOAD' THEN
                v_risk_score := v_risk_score + 3;
                v_permit_cost := v_permit_cost + 25000;  -- ~$250 superload surcharge
            END IF;

            IF rec.result_action = 'UTILITY_COORDINATION' THEN
                v_utility := TRUE;
                v_risk_score := v_risk_score + 1;
            END IF;

            IF rec.result_action = 'PERMIT_REQUIRED' THEN
                v_permits := array_append(v_permits, v_state || '_OVERSIZE');
                v_permit_cost := v_permit_cost + 7500;  -- ~$75 per state permit
            END IF;
        END LOOP;

        -- Check height pole requirement
        IF EXISTS (
            SELECT 1 FROM escort_regulation
            WHERE jurisdiction_id = v_jurisdiction_id
              AND height_pole_required = TRUE
              AND p_height_ft >= height_pole_threshold_ft
        ) THEN
            v_escort_types := array_append(v_escort_types, 'HIGH_POLE');
            v_risk_score := v_risk_score + 1;
        END IF;

        -- Check certification requirements
        IF EXISTS (
            SELECT 1 FROM escort_regulation
            WHERE jurisdiction_id = v_jurisdiction_id AND certification_required = TRUE
        ) THEN
            SELECT certification_name INTO rec
            FROM escort_regulation WHERE jurisdiction_id = v_jurisdiction_id;
            IF rec.certification_name IS NOT NULL THEN
                v_cert_needs := array_append(v_cert_needs, rec.certification_name);
            END IF;
        END IF;

        -- Friday restriction check
        IF v_friday AND EXISTS (
            SELECT 1 FROM movement_restriction
            WHERE jurisdiction_id = v_jurisdiction_id
              AND restriction_type IN ('NIGHT', 'WEEKEND', 'CURFEW')
              AND 'FRIDAY' = ANY(day_of_week)
        ) THEN
            v_risk_score := v_risk_score + 2;
            v_curfews := array_append(v_curfews, v_state || '_FRIDAY_RESTRICTION');
        END IF;

        -- Confidence penalty
        IF EXISTS (
            SELECT 1 FROM regulatory_confidence
            WHERE jurisdiction_id = v_jurisdiction_id AND confidence_score < 5
        ) THEN
            v_confidence := v_confidence - 0.5;
            v_risk_score := v_risk_score + 1;
        END IF;
    END LOOP;

    -- Metro penalty
    IF p_is_metro THEN
        v_risk_score := v_risk_score + 2;
    END IF;

    -- Risk level
    v_risk_level := CASE
        WHEN v_risk_score >= 8 THEN 'RED_ALERT'
        WHEN v_risk_score >= 5 THEN 'YELLOW_WARNING'
        ELSE 'GREEN_CLEAR'
    END;

    -- Total cost estimate
    v_total_cost := v_permit_cost + v_police_cost + (v_escorts * 75000);  -- ~$750 per escort per state

    -- Make escort types unique
    v_escort_types := ARRAY(SELECT DISTINCT unnest(v_escort_types));
    v_cert_needs := ARRAY(SELECT DISTINCT unnest(v_cert_needs));
    v_permits := ARRAY(SELECT DISTINCT unnest(v_permits));

    -- Insert decision
    INSERT INTO movement_decision (
        requested_by, input_width_ft, input_height_ft, input_length_ft, input_weight_lbs,
        input_origin_state, input_dest_state, input_transit_states, input_date,
        input_is_friday, input_is_metro,
        risk_score, risk_level,
        escorts_required, escort_type_needed, escort_certifications_needed,
        police_required, police_estimated_cost_cents,
        utility_required,
        curfew_restrictions, friday_restricted,
        permits_needed, estimated_permit_cost_cents,
        estimated_total_cost_cents, confidence_score
    ) VALUES (
        p_operator_id, p_width_ft, p_height_ft, p_length_ft, p_weight_lbs,
        p_origin_state, p_dest_state, p_transit_states, p_date,
        v_friday, p_is_metro,
        v_risk_score, v_risk_level,
        v_escorts, v_escort_types, v_cert_needs,
        v_police, v_police_cost,
        v_utility,
        v_curfews, v_friday,
        v_permits, v_permit_cost,
        v_total_cost, GREATEST(v_confidence, 1.0)
    ) RETURNING id INTO v_decision_id;

    RETURN v_decision_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- FUNCTION: MATCH LOAD TO OPERATORS
-- ============================================================
-- The Uber matching algorithm.
-- Compliant certs → verified equipment → state auth → highest score → nearest.
CREATE OR REPLACE FUNCTION match_load_to_operators(
    p_load_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    operator_id UUID,
    display_name TEXT,
    operator_type operator_type,
    hc_score NUMERIC,
    distance_miles NUMERIC,
    certified_for_state BOOLEAN,
    has_required_equipment BOOLEAN,
    rate_per_hour_cents BIGINT,
    match_score NUMERIC
) AS $$
DECLARE
    v_load RECORD;
BEGIN
    -- Get the load details
    SELECT * INTO v_load FROM active_load WHERE id = p_load_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Load % not found', p_load_id;
    END IF;

    RETURN QUERY
    SELECT
        op.id AS operator_id,
        op.display_name,
        op.operator_type,
        op.hc_score,
        -- Distance calculation (simple Haversine approximation)
        ROUND(
            (3959 * ACOS(
                COS(RADIANS(v_load.origin_lat)) * COS(RADIANS(ea.current_lat)) *
                COS(RADIANS(ea.current_lng) - RADIANS(v_load.origin_lng)) +
                SIN(RADIANS(v_load.origin_lat)) * SIN(RADIANS(ea.current_lat))
            ))::NUMERIC, 1
        ) AS distance_miles,
        -- Certified for origin state
        v_load.origin_state = ANY(ea.certified_states) AS certified_for_state,
        -- Has required equipment (check against load requirements)
        (CASE
            WHEN v_load.height_pole_required AND ea.has_height_pole THEN TRUE
            WHEN NOT v_load.height_pole_required THEN TRUE
            ELSE FALSE
        END) AS has_required_equipment,
        ea.rate_per_hour_cents,
        -- Composite match score (higher = better match)
        (
            (op.hc_score * 0.4) +                                          -- HC Score weight
            (CASE WHEN v_load.origin_state = ANY(ea.certified_states) THEN 30 ELSE 0 END) +  -- State cert bonus
            (CASE WHEN v_load.height_pole_required AND ea.has_height_pole THEN 20 ELSE 0 END) +   -- Equipment bonus
            (100 - LEAST(
                ROUND(
                    (3959 * ACOS(
                        COS(RADIANS(v_load.origin_lat)) * COS(RADIANS(ea.current_lat)) *
                        COS(RADIANS(ea.current_lng) - RADIANS(v_load.origin_lng)) +
                        SIN(RADIANS(v_load.origin_lat)) * SIN(RADIANS(ea.current_lat))
                    ))::NUMERIC, 1
                ), 100
            )) * 0.1                                                        -- Proximity bonus (closer = better)
        ) AS match_score
    FROM escort_availability ea
    JOIN operator_profile op ON op.id = ea.operator_id
    WHERE
        ea.booked = FALSE
        AND ea.available_date >= COALESCE(v_load.requested_pickup_date, CURRENT_DATE)
        AND op.verified = TRUE
        AND op.hc_score >= 50                                               -- Minimum score threshold
        AND ea.current_lat IS NOT NULL
        AND ea.current_lng IS NOT NULL
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_al_operator ON active_load(operator_id);
CREATE INDEX idx_al_status ON active_load(status);
CREATE INDEX idx_al_load_type ON active_load(load_type);
CREATE INDEX idx_al_origin ON active_load(origin_state);
CREATE INDEX idx_al_dest ON active_load(dest_state);
CREATE INDEX idx_al_pickup ON active_load(requested_pickup_date);
CREATE INDEX idx_al_location ON active_load(origin_lat, origin_lng);
CREATE INDEX idx_al_transit ON active_load USING GIN(transit_states);

CREATE INDEX idx_ea_operator ON escort_availability(operator_id);
CREATE INDEX idx_ea_date ON escort_availability(available_date);
CREATE INDEX idx_ea_state ON escort_availability(current_state);
CREATE INDEX idx_ea_booked ON escort_availability(booked) WHERE booked = FALSE;
CREATE INDEX idx_ea_location ON escort_availability(current_lat, current_lng);
CREATE INDEX idx_ea_type ON escort_availability(escort_type);
CREATE INDEX idx_ea_score ON escort_availability(hc_score DESC);
CREATE INDEX idx_ea_states ON escort_availability USING GIN(certified_states);

CREATE INDEX idx_uca_operator ON utility_crew_availability(operator_id);
CREATE INDEX idx_uca_date ON utility_crew_availability(available_date);
CREATE INDEX idx_uca_type ON utility_crew_availability(crew_type);
CREATE INDEX idx_uca_booked ON utility_crew_availability(booked) WHERE booked = FALSE;

CREATE INDEX idx_pc_load ON police_coordination(load_id);
CREATE INDEX idx_pc_status ON police_coordination(status);
CREATE INDEX idx_pc_unit ON police_coordination(police_unit_id);
CREATE INDEX idx_pc_date ON police_coordination(requested_date);

CREATE INDEX idx_rs_load ON route_survey(load_id);
CREATE INDEX idx_rs_surveyor ON route_survey(surveyor_id);
CREATE INDEX idx_rs_status ON route_survey(status);

CREATE INDEX idx_lc_load ON load_contract(load_id);
CREATE INDEX idx_lc_shipper ON load_contract(shipper_id);
CREATE INDEX idx_lc_carrier ON load_contract(carrier_id);
CREATE INDEX idx_lc_broker ON load_contract(broker_id);
CREATE INDEX idx_lc_status ON load_contract(status);

CREATE INDEX idx_dl_load ON dispatch_log(load_id);
CREATE INDEX idx_dl_operator ON dispatch_log(operator_id);
CREATE INDEX idx_dl_action ON dispatch_log(action);
CREATE INDEX idx_dl_time ON dispatch_log(occurred_at);

CREATE INDEX idx_md_operator ON movement_decision(requested_by);
CREATE INDEX idx_md_risk ON movement_decision(risk_level);
CREATE INDEX idx_md_origin ON movement_decision(input_origin_state);
CREATE INDEX idx_md_date ON movement_decision(created_at);
CREATE INDEX idx_md_tier ON movement_decision(subscription_tier_required);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE active_load ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_contract ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_decision ENABLE ROW LEVEL SECURITY;

-- Active loads — visible to all verified operators (marketplace transparency)
CREATE POLICY al_public_read ON active_load
    FOR SELECT USING (status IN ('POSTED', 'MATCHING'));
CREATE POLICY al_owner_all ON active_load
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Escort availability — public when available, owner for management
CREATE POLICY ea_public_read ON escort_availability
    FOR SELECT USING (booked = FALSE);
CREATE POLICY ea_owner_all ON escort_availability
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Utility availability — similar pattern
CREATE POLICY uca_public_read ON utility_crew_availability
    FOR SELECT USING (booked = FALSE);
CREATE POLICY uca_owner_all ON utility_crew_availability
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Police coordination — parties to the load only
CREATE POLICY pc_party_read ON police_coordination
    FOR SELECT USING (load_id IN (SELECT id FROM active_load WHERE operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid())));

-- Contracts — parties only
CREATE POLICY lc_party_read ON load_contract
    FOR SELECT USING (
        shipper_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()) OR
        carrier_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()) OR
        broker_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid())
    );

-- Dispatch log — parties to the load
CREATE POLICY dl_party_read ON dispatch_log
    FOR SELECT USING (load_id IN (SELECT id FROM active_load WHERE operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid())));

-- Movement decisions — owner only (this is paid intelligence)
CREATE POLICY md_owner_read ON movement_decision
    FOR SELECT USING (requested_by IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));


-- ============================================================
-- VIEWS
-- ============================================================

-- Active loads board (what escorts see)
CREATE OR REPLACE VIEW v_active_loads_board AS
SELECT
    al.id,
    al.load_number,
    al.load_type,
    al.origin_city || ', ' || al.origin_state AS origin,
    al.dest_city || ', ' || al.dest_state AS destination,
    al.width_ft,
    al.height_ft,
    al.length_ft,
    al.weight_lbs,
    al.escorts_required,
    al.police_required,
    al.utility_required,
    al.height_pole_required,
    al.risk_level,
    al.requested_pickup_date,
    al.shipper_budget_cents,
    al.status,
    al.posted_at,
    op.display_name AS posted_by,
    op.hc_score AS poster_score
FROM active_load al
JOIN operator_profile op ON op.id = al.operator_id
WHERE al.status = 'POSTED'
ORDER BY al.posted_at DESC;


-- ============================================================
-- SUPPORT GRID: TRUCK STOPS & PARKING (Step 10)
-- ============================================================
-- Truck stop and secure parking directory with oversize ratings.
-- Enables operators to find verified parking along routes.
-- Powers route planning with stop recommendations.
-- ============================================================

CREATE TABLE parking_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operator_profile(id) ON DELETE SET NULL,
    facility_name TEXT NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    max_load_width_ft NUMERIC(5,2),
    max_load_length_ft NUMERIC(6,2),
    secure_yard BOOLEAN DEFAULT FALSE,
    lighting_rating INTEGER CHECK (lighting_rating BETWEEN 1 AND 5),
    amenities TEXT[], -- FUEL, FOOD, RESTROOMS, SHOWERS, WIFI, TRUCK_WASH
    fee_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parking_location ON parking_directory USING GIST (
    ll_to_earth(latitude::FLOAT8, longitude::FLOAT8)
);
CREATE INDEX idx_parking_operator ON parking_directory(operator_id);

-- RLS for parking_directory
ALTER TABLE parking_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY parking_public_read ON parking_directory FOR SELECT USING (true);

COMMENT ON TABLE parking_directory IS 'Support Grid Step 10: Truck stops and secure parking with oversize capacity ratings';


-- ============================================================
-- SUPPORT GRID: RECOVERY & ROADSIDE (Step 14)
-- ============================================================
-- Emergency recovery and roadside assistance providers.
-- Rotators, heavy tow, hazmat cleanup, and roadside service.
-- Enables rapid response coordination for breakdowns and accidents.
-- ============================================================

CREATE TABLE emergency_response (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,
    service_type TEXT[], -- ROTATOR, HEAVY_TOW, HAZMAT_CLEANUP, ROADSIDE
    response_radius_miles INTEGER,
    max_lift_capacity_lbs BIGINT,
    night_service BOOLEAN DEFAULT TRUE,
    weekend_service BOOLEAN DEFAULT TRUE,
    emergency_contact_phone TEXT NOT NULL,
    avg_response_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_operator ON emergency_response(operator_id);
CREATE INDEX idx_emergency_service_type ON emergency_response USING GIN (service_type);

-- RLS for emergency_response
ALTER TABLE emergency_response ENABLE ROW LEVEL SECURITY;
CREATE POLICY emergency_public_read ON emergency_response FOR SELECT USING (true);

COMMENT ON TABLE emergency_response IS 'Support Grid Step 14: Emergency recovery, rotators, heavy tow, and roadside assistance directory';


-- ============================================================
-- SUPPORT GRID: PORTS, YARDS & STAGING (Step 15)
-- ============================================================
-- Staging areas, ports, rail yards, and assembly facilities.
-- TWIC-required zones, capacity ratings, and contact info.
-- Enables coordination for multi-modal and port-based movements.
-- ============================================================

CREATE TABLE staging_area_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operator_profile(id) ON DELETE SET NULL,
    facility_name TEXT NOT NULL,
    facility_type TEXT, -- PORT, RAIL_YARD, STAGING_AREA, ASSEMBLY_FACILITY
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    capacity_rating TEXT, -- SMALL, MEDIUM, LARGE, UNLIMITED
    max_load_dimensions TEXT, -- "100ft x 20ft x 20ft"
    twic_required BOOLEAN DEFAULT FALSE,
    contact_info JSONB, -- {name, phone, email, hours}
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staging_location ON staging_area_index USING GIST (
    ll_to_earth(latitude::FLOAT8, longitude::FLOAT8)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_staging_type ON staging_area_index(facility_type);
CREATE INDEX idx_staging_twic ON staging_area_index(twic_required);

-- RLS for staging_area_index
ALTER TABLE staging_area_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY staging_public_read ON staging_area_index FOR SELECT USING (true);

COMMENT ON TABLE staging_area_index IS 'Support Grid Step 15: Ports, rail yards, staging areas, and assembly facilities with TWIC requirements';
