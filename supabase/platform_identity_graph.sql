-- ============================================================
-- HC-GIS PLANE 1: IDENTITY + COMPLIANCE GRAPH
-- The Foundation — Unified Operator ID
-- ============================================================
-- "Without this layer, you don't control the ecosystem.
--  With it, you do."
-- ============================================================
-- Every person or company in the ecosystem gets ONE identity.
-- Everything references this ID.
-- Switching cost = massive. One login. Every document.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE operator_type AS ENUM (
    -- Core Operators
    'CARRIER',
    'ESCORT',
    'SURVEYOR',
    'HIGH_POLE_ESCORT',
    'BUCKET_TRUCK_ESCORT',
    'UTILITY_ESCORT',
    -- Freight Controllers
    'BROKER',
    'PROJECT_CARGO_BROKER',
    'GOVERNMENT_BROKER',
    -- Shippers
    'SHIPPER',
    'EPC_CONTRACTOR',
    'WIND_DEVELOPER',
    'CONSTRUCTION_CORP',
    -- Service Providers (Steps 1-5)
    'PERMIT_SERVICE',
    'POLICE_LIAISON',
    'UTILITY_CREW',
    'FLAGGING_CREW',
    'DISPATCH_CENTER',
    -- Support Grid (Steps 9-15)
    'LODGING_PROVIDER',
    'TRUCK_STOP',
    'PARKING_FACILITY',
    'EQUIPMENT_SUPPLIER',
    'VEHICLE_UPFITTER',
    'RADIO_INSTALLER',
    'TOWING_RECOVERY',
    'ROADSIDE_ASSISTANCE',
    'PORT_STAGING_YARD',
    'LAYDOWN_YARD',
    -- Specialized Support (Step 18)
    'CRANE_RENTAL',
    'EQUIPMENT_RENTAL',
    'JACK_ROLL_CREW',
    'HOUSE_MOVER',
    'LIFT_PLANNER',
    -- Financial (Step 13)
    'FACTORING_COMPANY',
    'INSURANCE_CARRIER',
    'INSURANCE_BROKER',
    'EQUIPMENT_LENDER',
    'PAYMENT_SERVICE',
    -- Training (Steps 6, 16)
    'TRAINING_PROVIDER',
    'TRAINING_SCHOOL',
    'CDL_SCHOOL',
    -- Government (Step 17)
    'DOT_OFFICIAL',
    'PORT_AUTHORITY',
    'GOVERNMENT_AGENCY',
    -- System
    'ADMIN',
    'API_CONSUMER'
);

CREATE TYPE cert_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'PENDING',
    'SUSPENDED',
    'REVOKED',
    'RENEWAL_DUE'
);

CREATE TYPE score_type AS ENUM (
    'COMPLIANCE',
    'RISK',
    'PERFORMANCE',
    'RELIABILITY',
    'COMPOSITE'          -- Haul Command Score™
);

-- ============================================================
-- TABLE 1: OPERATOR PROFILE (The Universal Identity)
-- ============================================================
-- This is the carrier table + escort table + broker table
-- + shipper table + everyone table. ONE TABLE.
-- "Unified Operator ID" — the Uber driver ID equivalent.
CREATE TABLE operator_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    operator_type operator_type NOT NULL,
    company_name TEXT,
    dba_name TEXT,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT NOT NULL,                    -- What shows in marketplace

    -- Regulatory identifiers
    mc_number TEXT,
    dot_number TEXT,
    ein TEXT,
    usdot_active BOOLEAN,

    -- Contact
    email TEXT NOT NULL,
    phone TEXT,
    phone_secondary TEXT,
    website TEXT,

    -- Location
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT DEFAULT 'US',
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    service_radius_miles INTEGER,                  -- How far they operate

    -- Operating regions
    operating_states TEXT[],                       -- States they're authorized in
    preferred_corridors UUID[],                    -- FK to global_corridor_index

    -- Auth
    auth_user_id UUID,                            -- Supabase auth.users reference
    onboarded BOOLEAN DEFAULT FALSE,
    onboarded_at TIMESTAMPTZ,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,                              -- system, manual, api

    -- Audience intelligence
    audience_segment TEXT,                         -- Maps to audience_persona.segment
    persona_code TEXT,                             -- Maps to audience_persona.persona_code
    acquisition_source TEXT,                       -- How they found HC

    -- Subscription (Stream S5)
    subscription_tier TEXT DEFAULT 'FREE',         -- FREE, STARTER, PRO, COMMAND, BROKER_PRO, ENTERPRISE
    subscription_id UUID,                          -- FK to subscription table

    -- HC Score™ (Stream S6)
    hc_score NUMERIC(4,1) DEFAULT 0,              -- 0-100. THE gravity hook.
    hc_score_updated_at TIMESTAMPTZ,

    -- Flags
    whale_account BOOLEAN DEFAULT FALSE,          -- $1M+ annual potential
    nightmare_state_specialist BOOLEAN DEFAULT FALSE,
    wind_certified BOOLEAN DEFAULT FALSE,
    port_certified BOOLEAN DEFAULT FALSE,

    -- Metadata
    notes TEXT,
    metadata JSONB,                               -- Extensible blob
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft uniqueness
    UNIQUE(email)
);

-- ============================================================
-- TABLE 2: OPERATOR CERTIFICATION (Compliance Wallet)
-- ============================================================
-- P/EVO, WITPAC, CDL, state-specific certs.
-- "Store everything here. Switching cost becomes massive."
-- Feeds: S6 (Compliance Scoring), S17 (Training + Certification)
CREATE TABLE operator_certification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- Certification
    cert_type TEXT NOT NULL,                       -- PEVO, WITPAC, CDL_A, CDL_B, HEIGHT_POLE, HAZMAT, TWIC, STATE_ESCORT
    cert_name TEXT NOT NULL,                       -- Human-readable
    issuing_authority TEXT,                        -- ESC, State DOT, FMCSA
    cert_number TEXT,
    state_code TEXT,                               -- Which state issued it

    -- Validity
    status cert_status NOT NULL DEFAULT 'PENDING',
    issued_date DATE,
    expiration_date DATE,
    last_verified TIMESTAMPTZ,
    days_until_expiry INTEGER,                    -- Computed, feeds compliance alerts

    -- Reciprocity
    reciprocity_states TEXT[],                    -- Which states honor this cert
    reciprocity_verified BOOLEAN DEFAULT FALSE,

    -- Document storage
    document_url TEXT,                            -- S3/Supabase Storage URL
    document_verified BOOLEAN DEFAULT FALSE,

    -- Revenue hook
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,
    training_provider_id UUID,                    -- FK to operator_profile (training provider)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: OPERATOR INSURANCE (Risk Layer)
-- ============================================================
-- Policy tracking, expiry alerts, coverage verification.
-- Feeds: S7 (Insurance Rail)
CREATE TABLE operator_insurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- Policy
    policy_type TEXT NOT NULL,                    -- COMMERCIAL_AUTO, GENERAL_LIABILITY, CARGO, WORKERS_COMP, UMBRELLA, EQUIPMENT
    carrier_name TEXT,                            -- Insurance company name
    policy_number TEXT,
    agent_name TEXT,
    agent_phone TEXT,
    agent_email TEXT,

    -- Coverage
    coverage_amount_cents BIGINT,
    deductible_cents BIGINT,
    coverage_territory TEXT[],                    -- States covered

    -- Validity
    effective_date DATE,
    expiration_date DATE,
    status cert_status NOT NULL DEFAULT 'ACTIVE',
    days_until_expiry INTEGER,

    -- Document
    certificate_url TEXT,                         -- COI document URL
    certificate_verified BOOLEAN DEFAULT FALSE,
    last_verified TIMESTAMPTZ,

    -- Revenue hook — insurance referral commission (S7)
    referred_by_hc BOOLEAN DEFAULT FALSE,
    referral_commission_cents BIGINT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: OPERATOR EQUIPMENT (Fleet Registry)
-- ============================================================
-- Vehicle/gear inventory linked to operator.
-- Auto-fill permits. Feeds: S10, S11
CREATE TABLE operator_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- Vehicle / Equipment
    equipment_type TEXT NOT NULL,                 -- PILOT_CAR, ESCORT_VEHICLE, TRACTOR, TRAILER, HEIGHT_POLE, BUCKET_TRUCK, CRANE
    make TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    plate_number TEXT,
    plate_state TEXT,
    unit_number TEXT,

    -- Specs (for permit auto-fill)
    gvwr_lbs INTEGER,
    length_ft NUMERIC(6,2),
    width_ft NUMERIC(6,2),
    height_ft NUMERIC(6,2),
    axle_count INTEGER,
    trailer_type TEXT,                            -- RGN, DOUBLE_DROP, BLADE, FLATBED, LOWBOY, STEP_DECK

    -- Escort-specific
    sign_oversize_load BOOLEAN DEFAULT FALSE,
    amber_beacon BOOLEAN DEFAULT FALSE,
    height_pole BOOLEAN DEFAULT FALSE,
    height_pole_max_ft NUMERIC(5,2),
    cb_radio BOOLEAN DEFAULT FALSE,
    flags_and_banners BOOLEAN DEFAULT FALSE,

    -- Compliance
    registration_expiry DATE,
    inspection_expiry DATE,
    insurance_policy_id UUID REFERENCES operator_insurance(id),

    -- Telematics (S11 — Fleet OS)
    telematics_device_id TEXT,
    gps_enabled BOOLEAN DEFAULT FALSE,
    last_known_lat NUMERIC(10,7),
    last_known_lng NUMERIC(10,7),
    last_ping_at TIMESTAMPTZ,

    -- Status
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: OPERATOR STATE AUTHORIZATION
-- ============================================================
-- Per-state authorization status. Reciprocity tracker.
-- Feeds: S1 (Permit Rail), S20 (Global Expansion)
CREATE TABLE operator_state_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- Authorization
    country_code TEXT NOT NULL DEFAULT 'US',
    state_code TEXT NOT NULL,                     -- FL, GA, TX, ON, AB...
    authorized BOOLEAN DEFAULT FALSE,
    authorization_type TEXT,                      -- PERMIT, REGISTRATION, RECIPROCITY, NONE_REQUIRED
    authorization_number TEXT,

    -- Source
    source_cert_id UUID REFERENCES operator_certification(id),  -- Which cert grants this auth
    reciprocity_based BOOLEAN DEFAULT FALSE,

    -- Validity
    effective_date DATE,
    expiration_date DATE,
    status cert_status DEFAULT 'ACTIVE',

    -- Notes
    restrictions TEXT,                            -- Any restrictions on operations
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(operator_id, country_code, state_code)
);

-- ============================================================
-- TABLE 6: OPERATOR TWIC (Port + TWIC Vertical)
-- ============================================================
-- TWIC card tracking. Port access gate.
-- Feeds: S14 (Port + TWIC Vertical)
CREATE TABLE operator_twic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- TWIC Card
    twic_number TEXT,
    twic_status cert_status DEFAULT 'PENDING',
    issued_date DATE,
    expiration_date DATE,
    issuing_office TEXT,

    -- Port access
    authorized_ports TEXT[],                      -- Port names or codes
    port_access_verified BOOLEAN DEFAULT FALSE,
    last_port_access TIMESTAMPTZ,

    -- Document
    document_url TEXT,
    document_verified BOOLEAN DEFAULT FALSE,

    -- Background check
    background_check_date DATE,
    background_clear BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(operator_id)
);

-- ============================================================
-- TABLE 7: OPERATOR SCORE (Haul Command Score™)
-- ============================================================
-- THE gravity hook. If jobs depend on this score, they won't leave.
-- "Lock #1 — Compliance Score.
--  If escorts rely on Haul Command Score™ to get jobs,
--  they won't leave."
-- Feeds: S6, S7, S12
CREATE TABLE operator_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- Score components
    score_type score_type NOT NULL,
    score_value NUMERIC(5,2) NOT NULL,            -- 0-100
    score_grade TEXT,                              -- A+, A, B+, B, C, D, F

    -- Component breakdown
    certification_score NUMERIC(5,2) DEFAULT 0,   -- Weight: 25%
    insurance_score NUMERIC(5,2) DEFAULT 0,       -- Weight: 20%
    equipment_score NUMERIC(5,2) DEFAULT 0,       -- Weight: 15%
    reliability_score NUMERIC(5,2) DEFAULT 0,     -- Weight: 20% (on-time, completion rate)
    safety_score NUMERIC(5,2) DEFAULT 0,          -- Weight: 20% (incidents, violations)

    -- History
    previous_score NUMERIC(5,2),
    score_trend TEXT,                              -- IMPROVING, STABLE, DECLINING
    scores_history JSONB,                         -- Last 12 months

    -- Marketplace impact
    marketplace_eligible BOOLEAN DEFAULT FALSE,   -- Score > 70 to be in marketplace
    premium_eligible BOOLEAN DEFAULT FALSE,       -- Score > 90 for premium loads
    badge_level TEXT,                              -- BRONZE, SILVER, GOLD, PLATINUM

    -- Calculation
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    next_calculation_at TIMESTAMPTZ,
    calculation_version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(operator_id, score_type)
);

-- ============================================================
-- TABLE 8: COMPLIANCE AUDIT PACKET (DOT Audit Generator)
-- ============================================================
-- "Make audits easy. That's sticky."
-- Auto-generated DOT audit packets, police coordination history,
-- incident logs. Feeds: S19 (Risk & Legal Vault)
CREATE TABLE compliance_audit_packet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,

    -- Audit
    packet_type TEXT NOT NULL,                    -- DOT_AUDIT, POLICE_HISTORY, INCIDENT_LOG, INSURANCE_SUMMARY, ANNUAL_COMPLIANCE
    packet_name TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Coverage period
    period_start DATE,
    period_end DATE,

    -- Content
    document_url TEXT,                            -- Generated PDF URL
    document_data JSONB,                          -- Structured data for the packet

    -- Components included
    includes_certifications BOOLEAN DEFAULT FALSE,
    includes_insurance BOOLEAN DEFAULT FALSE,
    includes_equipment BOOLEAN DEFAULT FALSE,
    includes_movement_history BOOLEAN DEFAULT FALSE,
    includes_incident_history BOOLEAN DEFAULT FALSE,
    includes_police_coordination BOOLEAN DEFAULT FALSE,
    includes_score_history BOOLEAN DEFAULT FALSE,

    -- Status
    status TEXT DEFAULT 'GENERATED',              -- GENERATED, REVIEWED, SUBMITTED, ARCHIVED

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- FUNCTION: CALCULATE OPERATOR SCORE (Haul Command Score™)
-- ============================================================
-- Composites: certs + insurance + equipment + history = HC Score™
-- This is the function that creates the gravity hook.
CREATE OR REPLACE FUNCTION calculate_operator_score(p_operator_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_cert_score NUMERIC := 0;
    v_insurance_score NUMERIC := 0;
    v_equipment_score NUMERIC := 0;
    v_reliability_score NUMERIC := 50;    -- Default mid-range until history builds
    v_safety_score NUMERIC := 50;         -- Default mid-range until history builds
    v_total NUMERIC;
    v_grade TEXT;
    v_cert_count INTEGER;
    v_active_certs INTEGER;
    v_insurance_count INTEGER;
    v_active_insurance INTEGER;
    v_equipment_count INTEGER;
    v_compliant_equipment INTEGER;
BEGIN
    -- CERTIFICATION SCORE (25%)
    -- More active certs = higher score
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'ACTIVE')
    INTO v_cert_count, v_active_certs
    FROM operator_certification WHERE operator_id = p_operator_id;

    IF v_cert_count > 0 THEN
        v_cert_score := (v_active_certs::NUMERIC / v_cert_count) * 100;
    END IF;

    -- INSURANCE SCORE (20%)
    -- All policies active and not expiring soon
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'ACTIVE' AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE + INTERVAL '30 days'))
    INTO v_insurance_count, v_active_insurance
    FROM operator_insurance WHERE operator_id = p_operator_id;

    IF v_insurance_count > 0 THEN
        v_insurance_score := (v_active_insurance::NUMERIC / v_insurance_count) * 100;
    END IF;

    -- EQUIPMENT SCORE (15%)
    -- Active equipment with valid registration/inspection
    SELECT COUNT(*), COUNT(*) FILTER (WHERE active = TRUE AND (registration_expiry IS NULL OR registration_expiry > CURRENT_DATE))
    INTO v_equipment_count, v_compliant_equipment
    FROM operator_equipment WHERE operator_id = p_operator_id;

    IF v_equipment_count > 0 THEN
        v_equipment_score := (v_compliant_equipment::NUMERIC / v_equipment_count) * 100;
    END IF;

    -- COMPOSITE (weighted average)
    v_total := (v_cert_score * 0.25) + (v_insurance_score * 0.20) + (v_equipment_score * 0.15) + (v_reliability_score * 0.20) + (v_safety_score * 0.20);

    -- Grade
    v_grade := CASE
        WHEN v_total >= 95 THEN 'A+'
        WHEN v_total >= 90 THEN 'A'
        WHEN v_total >= 85 THEN 'B+'
        WHEN v_total >= 80 THEN 'B'
        WHEN v_total >= 70 THEN 'C'
        WHEN v_total >= 60 THEN 'D'
        ELSE 'F'
    END;

    -- Upsert the composite score
    INSERT INTO operator_score (operator_id, score_type, score_value, score_grade,
        certification_score, insurance_score, equipment_score, reliability_score, safety_score,
        marketplace_eligible, premium_eligible, badge_level)
    VALUES (p_operator_id, 'COMPOSITE', v_total, v_grade,
        v_cert_score, v_insurance_score, v_equipment_score, v_reliability_score, v_safety_score,
        v_total >= 70, v_total >= 90,
        CASE
            WHEN v_total >= 95 THEN 'PLATINUM'
            WHEN v_total >= 85 THEN 'GOLD'
            WHEN v_total >= 70 THEN 'SILVER'
            ELSE 'BRONZE'
        END)
    ON CONFLICT (operator_id, score_type) DO UPDATE SET
        score_value = EXCLUDED.score_value,
        score_grade = EXCLUDED.score_grade,
        certification_score = EXCLUDED.certification_score,
        insurance_score = EXCLUDED.insurance_score,
        equipment_score = EXCLUDED.equipment_score,
        reliability_score = EXCLUDED.reliability_score,
        safety_score = EXCLUDED.safety_score,
        previous_score = operator_score.score_value,
        marketplace_eligible = EXCLUDED.marketplace_eligible,
        premium_eligible = EXCLUDED.premium_eligible,
        badge_level = EXCLUDED.badge_level,
        score_trend = CASE
            WHEN EXCLUDED.score_value > operator_score.score_value THEN 'IMPROVING'
            WHEN EXCLUDED.score_value < operator_score.score_value THEN 'DECLINING'
            ELSE 'STABLE'
        END,
        calculated_at = NOW(),
        next_calculation_at = NOW() + INTERVAL '24 hours',
        updated_at = NOW();

    -- Update the denormalized score on operator_profile
    UPDATE operator_profile
    SET hc_score = v_total, hc_score_updated_at = NOW(), updated_at = NOW()
    WHERE id = p_operator_id;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_op_type ON operator_profile(operator_type);
CREATE INDEX idx_op_email ON operator_profile(email);
CREATE INDEX idx_op_auth_user ON operator_profile(auth_user_id);
CREATE INDEX idx_op_state ON operator_profile(address_state);
CREATE INDEX idx_op_score ON operator_profile(hc_score DESC);
CREATE INDEX idx_op_whale ON operator_profile(whale_account) WHERE whale_account = TRUE;
CREATE INDEX idx_op_verified ON operator_profile(verified) WHERE verified = TRUE;
CREATE INDEX idx_op_sub_tier ON operator_profile(subscription_tier);
CREATE INDEX idx_op_states ON operator_profile USING GIN(operating_states);
CREATE INDEX idx_op_persona ON operator_profile(persona_code);

CREATE INDEX idx_oc_operator ON operator_certification(operator_id);
CREATE INDEX idx_oc_type ON operator_certification(cert_type);
CREATE INDEX idx_oc_status ON operator_certification(status);
CREATE INDEX idx_oc_expiry ON operator_certification(expiration_date);
CREATE INDEX idx_oc_reciprocity ON operator_certification USING GIN(reciprocity_states);

CREATE INDEX idx_oi_operator ON operator_insurance(operator_id);
CREATE INDEX idx_oi_type ON operator_insurance(policy_type);
CREATE INDEX idx_oi_expiry ON operator_insurance(expiration_date);

CREATE INDEX idx_oe_operator ON operator_equipment(operator_id);
CREATE INDEX idx_oe_type ON operator_equipment(equipment_type);
CREATE INDEX idx_oe_gps ON operator_equipment(last_known_lat, last_known_lng);
CREATE INDEX idx_oe_telematics ON operator_equipment(telematics_device_id) WHERE telematics_device_id IS NOT NULL;

CREATE INDEX idx_osa_operator ON operator_state_auth(operator_id);
CREATE INDEX idx_osa_state ON operator_state_auth(country_code, state_code);
CREATE INDEX idx_osa_authorized ON operator_state_auth(authorized) WHERE authorized = TRUE;

CREATE INDEX idx_ot_operator ON operator_twic(operator_id);

CREATE INDEX idx_os_operator ON operator_score(operator_id);
CREATE INDEX idx_os_type ON operator_score(score_type);
CREATE INDEX idx_os_value ON operator_score(score_value DESC);
CREATE INDEX idx_os_marketplace ON operator_score(marketplace_eligible) WHERE marketplace_eligible = TRUE;
CREATE INDEX idx_os_premium ON operator_score(premium_eligible) WHERE premium_eligible = TRUE;

CREATE INDEX idx_cap_operator ON compliance_audit_packet(operator_id);
CREATE INDEX idx_cap_type ON compliance_audit_packet(packet_type);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Operators can see their own identity data.
-- Marketplace listings are public (verified operators only).

ALTER TABLE operator_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_certification ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_state_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_twic ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_packet ENABLE ROW LEVEL SECURITY;

-- Self-access (operators see their own data)
CREATE POLICY op_self_access ON operator_profile
    FOR ALL USING (auth_user_id = auth.uid());

-- Public marketplace view (only verified operators)
CREATE POLICY op_marketplace_read ON operator_profile
    FOR SELECT USING (verified = TRUE AND onboarded = TRUE);

-- Certification/Insurance/Equipment — owner only
CREATE POLICY oc_owner ON operator_certification
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

CREATE POLICY oi_owner ON operator_insurance
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

CREATE POLICY oe_owner ON operator_equipment
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

CREATE POLICY osa_owner ON operator_state_auth
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

CREATE POLICY ot_owner ON operator_twic
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Score is public read (marketplace transparency), write by system only
CREATE POLICY os_public_read ON operator_score
    FOR SELECT USING (true);

-- Audit packets — owner only
CREATE POLICY cap_owner ON compliance_audit_packet
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));


-- ============================================================
-- VIEW: MARKETPLACE OPERATOR CARD
-- ============================================================
-- What the marketplace shows for each operator.
CREATE OR REPLACE VIEW v_marketplace_operators AS
SELECT
    op.id,
    op.operator_type,
    op.display_name,
    op.address_city,
    op.address_state,
    op.operating_states,
    op.service_radius_miles,
    op.hc_score,
    os.score_grade,
    os.badge_level,
    os.marketplace_eligible,
    os.premium_eligible,
    COUNT(DISTINCT oc.id) FILTER (WHERE oc.status = 'ACTIVE') AS active_certs,
    COUNT(DISTINCT oi.id) FILTER (WHERE oi.status = 'ACTIVE') AS active_policies,
    COUNT(DISTINCT oe.id) FILTER (WHERE oe.active = TRUE) AS active_equipment,
    ARRAY_AGG(DISTINCT osa.state_code) FILTER (WHERE osa.authorized = TRUE) AS authorized_states
FROM operator_profile op
LEFT JOIN operator_score os ON os.operator_id = op.id AND os.score_type = 'COMPOSITE'
LEFT JOIN operator_certification oc ON oc.operator_id = op.id
LEFT JOIN operator_insurance oi ON oi.operator_id = op.id
LEFT JOIN operator_equipment oe ON oe.operator_id = op.id
LEFT JOIN operator_state_auth osa ON osa.operator_id = op.id
WHERE op.verified = TRUE AND op.onboarded = TRUE
GROUP BY op.id, op.operator_type, op.display_name, op.address_city, op.address_state,
    op.operating_states, op.service_radius_miles, op.hc_score,
    os.score_grade, os.badge_level, os.marketplace_eligible, os.premium_eligible;

-- ============================================================
-- VIEW: EXPIRING CREDENTIALS (Proactive Revenue)
-- ============================================================
-- Certs + insurance expiring within 60 days = renewal upsell opportunity.
CREATE OR REPLACE VIEW v_expiring_credentials AS
SELECT
    op.id AS operator_id,
    op.display_name,
    op.email,
    op.phone,
    'CERTIFICATION' AS credential_type,
    oc.cert_type AS credential_name,
    oc.expiration_date,
    oc.expiration_date - CURRENT_DATE AS days_remaining,
    oc.status
FROM operator_profile op
JOIN operator_certification oc ON oc.operator_id = op.id
WHERE oc.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
UNION ALL
SELECT
    op.id,
    op.display_name,
    op.email,
    op.phone,
    'INSURANCE',
    oi.policy_type,
    oi.expiration_date,
    oi.expiration_date - CURRENT_DATE,
    oi.status
FROM operator_profile op
JOIN operator_insurance oi ON oi.operator_id = op.id
WHERE oi.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
ORDER BY days_remaining ASC;
