-- ============================================================
-- HC-GIS: STREAM REGISTRY
-- 20 Revenue Streams — Built Day One, Activated Later
-- ============================================================
-- Infrastructure ≠ Activation.
-- Uber's code supported expansion. They didn't expand day one.
-- ============================================================

CREATE TYPE stream_status AS ENUM (
    'DORMANT',      -- Schema exists, no activation code
    'BETA',         -- Testing with select operators
    'ACTIVE',       -- Live revenue generation
    'ENTERPRISE'    -- Custom contracts only
);

CREATE TYPE stream_plane AS ENUM (
    'IDENTITY_COMPLIANCE',
    'MOVEMENT_ORCHESTRATION',
    'FINANCIAL_DATA'
);

-- ============================================================
-- STREAM REGISTRY
-- ============================================================
-- Every revenue stream mapped. Activation is a business decision.
CREATE TABLE revenue_stream (
    id SERIAL PRIMARY KEY,
    stream_code TEXT NOT NULL UNIQUE,               -- S1, S2, ... S20
    name TEXT NOT NULL,
    description TEXT,
    plane stream_plane NOT NULL,

    -- Activation
    status stream_status NOT NULL DEFAULT 'DORMANT',
    activation_date TIMESTAMPTZ,
    deactivation_date TIMESTAMPTZ,

    -- Revenue model
    revenue_model TEXT,                             -- PER_TRANSACTION, SUBSCRIPTION, MARKUP, COMMISSION, API_CALL, PROJECT_MARGIN
    pricing_floor_cents BIGINT,
    pricing_ceiling_cents BIGINT,

    -- Dependencies
    tables_required TEXT[],                         -- Which tables power this stream
    streams_dependent_on TEXT[],                    -- Which other streams must be active first
    external_integrations TEXT[],                   -- VAPI, GHL, 11Labs, Rapid, Navixy, etc.

    -- Metrics
    monthly_revenue_target_cents BIGINT DEFAULT 0,
    lifetime_revenue_cents BIGINT DEFAULT 0,
    active_customers INTEGER DEFAULT 0,

    -- Geo scope
    active_jurisdictions TEXT[],                    -- Which regions this stream serves

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIENCE TAXONOMY
-- ============================================================
-- 13 ecosystem segments, 100+ persona types.
-- "The heavy haul world is not a trucking industry.
--  It is a project logistics industry."

CREATE TYPE audience_segment AS ENUM (
    'CORE_OPERATORS',           -- Drivers, escorts, field decision makers
    'FREIGHT_CONTROLLERS',      -- Brokers, project cargo, government
    'CORPORATE_SHIPPERS',       -- Construction, wind, oil, mining, rail, bridge
    'INTERNAL_DECISION',        -- Transport managers, procurement, fleet directors, risk managers
    'PERMIT_COMPLIANCE',        -- Permit cos, DOT, bridge engineers, traffic planners
    'EQUIPMENT_GRAVITY',        -- Manufacturers, dealers, upfitters, rental
    'INFORMATION_LAYER',        -- Load boards, tech, telematics, ELD, routing, weather, AI
    'FINANCIAL_ARTERIES',       -- Factoring, lenders, leasing, fuel cards, insurance, surety
    'LABOR_PIPELINE',           -- CDL schools, training, military transition, workforce boards
    'EMERGENCY_FAILURE',        -- Rotator towing, heavy recovery, hazmat, cargo salvage
    'GOVERNMENT_PUBLIC',        -- State DOT, FHWA, port authority, Army Corps, defense
    'ADJACENT_BLUECOLLAR',      -- Crane ops, linemen, pipeline, steel, millwrights, riggers
    'PREMOVE_INTELLIGENCE'      -- Civil engineering, site selection, environmental, surveying
);

CREATE TABLE audience_persona (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    segment audience_segment NOT NULL,
    persona_name TEXT NOT NULL,                     -- "Oversize load driver", "Project cargo broker"
    persona_code TEXT NOT NULL UNIQUE,              -- OVERSIZE_DRIVER, PROJECT_CARGO_BROKER

    -- Strategic value
    daily_demand_score INTEGER CHECK (daily_demand_score BETWEEN 1 AND 10),
    referral_power_score INTEGER CHECK (referral_power_score BETWEEN 1 AND 10),
    network_effect_score INTEGER CHECK (network_effect_score BETWEEN 1 AND 10),
    revenue_per_relationship_cents BIGINT,          -- One relationship = how much $/year
    loads_per_year_estimate INTEGER,                -- How many loads this persona touches

    -- Acquisition
    capture_strategy TEXT,                          -- EARLY_CAREER, WHALE_TARGETING, COMPLIANCE_HOOK, DATA_HOOK
    primary_pain_point TEXT,
    switching_cost_mechanism TEXT,

    -- Streams they power
    primary_streams TEXT[],                         -- Which revenue streams this persona feeds
    secondary_streams TEXT[],

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED: 20 REVENUE STREAMS
-- ============================================================
INSERT INTO revenue_stream (stream_code, name, description, plane, status, revenue_model, tables_required, active_jurisdictions) VALUES
    ('S1',  'Permit Rail',              'Automated oversize permit engine — API integration, white-label submission, instant pricing, auto routing', 'MOVEMENT_ORCHESTRATION', 'BETA', 'PER_TRANSACTION', ARRAY['permits','permit_framework','movement_decision'], ARRAY['US-FL','US-GA']),
    ('S2',  'Escort Marketplace',       'Uber for escorts — transaction-based matching', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'PER_TRANSACTION', ARRAY['escort_availability','active_load','load_contract','dispatch_log'], NULL),
    ('S3',  'Police Coordination Rail', 'Police scheduling layer — admin fee per coordination', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'PER_TRANSACTION', ARRAY['police_coordination','police_escort_units'], NULL),
    ('S4',  'Utility Coordination Rail','Bucket trucks + powerline lifts — coordination markup', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'MARKUP', ARRAY['utility_crew_availability'], NULL),
    ('S5',  'Regulatory SaaS',         'Movement intelligence subscription — Friday checker, escort triggers, police matrix', 'MOVEMENT_ORCHESTRATION', 'BETA', 'SUBSCRIPTION', ARRAY['subscription','movement_decision','jurisdiction_master'], ARRAY['US-FL','US-GA']),
    ('S6',  'Compliance Scoring',       'Haul Command Score™ — verification badge, jobs depend on score', 'IDENTITY_COMPLIANCE', 'BETA', 'SUBSCRIPTION', ARRAY['operator_score','operator_certification'], ARRAY['US-FL','US-GA']),
    ('S7',  'Insurance Rail',           'Commercial auto + liability referral — commission + risk scoring API', 'FINANCIAL_DATA', 'DORMANT', 'COMMISSION', ARRAY['operator_insurance','risk_prediction'], NULL),
    ('S8',  'Fuel + Payment Rail',      'Fuel card + escrow + instant payout — interchange + float', 'FINANCIAL_DATA', 'DORMANT', 'PER_TRANSACTION', ARRAY['fuel_transaction','escrow_hold','payout'], NULL),
    ('S9',  'Factoring / Quick Pay',    'Embedded factoring — fee percentage', 'FINANCIAL_DATA', 'DORMANT', 'PER_TRANSACTION', ARRAY['factoring_deal','payout'], NULL),
    ('S10', 'Equipment Marketplace',    'White-label Amazon for pilot gear — markup + financing', 'FINANCIAL_DATA', 'DORMANT', 'MARKUP', ARRAY['store_products','store_orders'], NULL),
    ('S11', 'Fleet Operating System',   'Telematics + tracking — monthly per vehicle', 'IDENTITY_COMPLIANCE', 'DORMANT', 'SUBSCRIPTION', ARRAY['operator_equipment'], NULL),
    ('S12', 'Route Intelligence API',   'Sell to insurance, brokers, government — enterprise API', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'API_CALL', ARRAY['routes','global_corridor_index','risk_prediction'], NULL),
    ('S13', 'Data Intelligence Reports','Risk maps, delay patterns, wind modeling — annual subscription', 'FINANCIAL_DATA', 'DORMANT', 'SUBSCRIPTION', ARRAY['event_log','performance_metric','intelligence_report'], NULL),
    ('S14', 'Port + TWIC Vertical',     'Premium compliance rail — enterprise contracts', 'IDENTITY_COMPLIANCE', 'DORMANT', 'PROJECT_MARGIN', ARRAY['operator_twic'], NULL),
    ('S15', 'Wind + Energy Vertical',   'High-pole + turbine orchestration — enterprise contracts', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'PROJECT_MARGIN', ARRAY['global_corridor_index'], NULL),
    ('S16', 'Government Contracting',   'Military / infrastructure projects — project margin', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'PROJECT_MARGIN', ARRAY['load_contract','invoice'], NULL),
    ('S17', 'Training + Certification', 'P/EVO + height pole + compliance — affiliate + white label', 'IDENTITY_COMPLIANCE', 'DORMANT', 'COMMISSION', ARRAY['operator_certification'], NULL),
    ('S18', 'Financing Rail',           'Equipment loans — APR spread', 'FINANCIAL_DATA', 'DORMANT', 'PER_TRANSACTION', ARRAY['equipment_financing'], NULL),
    ('S19', 'Risk & Legal Vault',       'AI accident + documentation archive — subscription', 'FINANCIAL_DATA', 'DORMANT', 'SUBSCRIPTION', ARRAY['compliance_audit_packet','event_log'], NULL),
    ('S20', 'Global Expansion Rail',    'Canada → Mexico → EU → Australia — geographic scaling', 'MOVEMENT_ORCHESTRATION', 'DORMANT', 'SUBSCRIPTION', ARRAY['global_market_readiness','jurisdiction_master'], NULL);

-- ============================================================
-- SEED: AUDIENCE PERSONAS (Key strategic personas)
-- ============================================================
INSERT INTO audience_persona (segment, persona_name, persona_code, daily_demand_score, referral_power_score, network_effect_score, revenue_per_relationship_cents, loads_per_year_estimate, capture_strategy, primary_pain_point, switching_cost_mechanism, primary_streams) VALUES
    -- CORE OPERATORS
    ('CORE_OPERATORS', 'Oversize Load Driver', 'OVERSIZE_DRIVER', 9, 7, 8, 1500000, 200, 'EARLY_CAREER', 'Permit confusion + compliance risk', 'Compliance Wallet + HC Score', ARRAY['S1','S5','S6']),
    ('CORE_OPERATORS', 'Superload Driver', 'SUPERLOAD_DRIVER', 7, 8, 7, 5000000, 80, 'COMPLIANCE_HOOK', 'Engineering review delays + police scheduling', 'Movement Decision AI + Police scheduling', ARRAY['S1','S3','S5']),
    ('CORE_OPERATORS', 'Pilot Car Operator', 'PILOT_CAR_OP', 10, 9, 9, 800000, 300, 'EARLY_CAREER', 'Finding loads + certification tracking', 'Escort Marketplace + HC Score', ARRAY['S2','S6','S17']),
    ('CORE_OPERATORS', 'High-Pole Escort', 'HIGH_POLE_ESCORT', 8, 7, 7, 1200000, 150, 'COMPLIANCE_HOOK', 'Height clearance data + specialist demand', 'Equipment verification + availability', ARRAY['S2','S5','S15']),
    ('CORE_OPERATORS', 'Wind Component Hauler', 'WIND_HAULER', 6, 8, 6, 10000000, 50, 'WHALE_TARGETING', 'Multi-state permit complexity + corridor planning', 'Corridor intelligence + wind module', ARRAY['S1','S4','S15']),
    ('CORE_OPERATORS', 'Route Survey Driver', 'ROUTE_SURVEYOR', 7, 6, 5, 600000, 200, 'DATA_HOOK', 'Clearance data reliability', 'Route intelligence feedback loop', ARRAY['S12','S5']),

    -- FREIGHT CONTROLLERS (Whale territory)
    ('FREIGHT_CONTROLLERS', 'Heavy Haul Freight Broker', 'HH_BROKER', 8, 10, 9, 25000000, 500, 'WHALE_TARGETING', 'Escort availability + compliance verification', 'Escrow + marketplace + data', ARRAY['S2','S3','S8','S9']),
    ('FREIGHT_CONTROLLERS', 'Project Cargo Broker', 'PROJECT_CARGO_BROKER', 5, 10, 8, 100000000, 200, 'WHALE_TARGETING', 'Multi-modal coordination + insurance', 'Movement certificates + risk reports', ARRAY['S1','S7','S12','S13']),
    ('FREIGHT_CONTROLLERS', 'Government Contract Broker', 'GOV_BROKER', 3, 9, 7, 50000000, 100, 'WHALE_TARGETING', 'Security clearance + compliance documentation', 'Audit packets + legal vault', ARRAY['S16','S19']),

    -- CORPORATE SHIPPERS
    ('CORPORATE_SHIPPERS', 'Wind Farm Developer', 'WIND_DEVELOPER', 4, 9, 7, 200000000, 300, 'WHALE_TARGETING', 'Multi-corridor turbine logistics', 'Wind module + corridor ownership', ARRAY['S15','S1','S4']),
    ('CORPORATE_SHIPPERS', 'Construction Conglomerate', 'CONSTRUCTION_CORP', 5, 9, 8, 150000000, 400, 'WHALE_TARGETING', 'Crane + heavy equipment transport coordination', 'Enterprise API + movement certificates', ARRAY['S1','S3','S12','S16']),

    -- PERMIT + COMPLIANCE
    ('PERMIT_COMPLIANCE', 'Permit Service Company', 'PERMIT_SERVICE', 8, 8, 7, 5000000, 1000, 'DATA_HOOK', 'State portal variability + processing delays', 'API integration + auto-fill', ARRAY['S1','S5','S12']),
    ('PERMIT_COMPLIANCE', 'Bridge Analysis Engineer', 'BRIDGE_ENGINEER', 3, 6, 4, 2000000, 100, 'DATA_HOOK', 'Load analysis turnaround time', 'Route intelligence data', ARRAY['S12','S1']),

    -- EQUIPMENT GRAVITY
    ('EQUIPMENT_GRAVITY', 'Crane Rental Executive', 'CRANE_RENTAL_EXEC', 4, 9, 8, 30000000, 200, 'WHALE_TARGETING', 'Logistics coordination for crane mobilization', 'Pre-move intelligence — cranes predict freight', ARRAY['S2','S3','S4']),
    ('EQUIPMENT_GRAVITY', 'Equipment Rental Company', 'EQUIP_RENTAL', 5, 8, 7, 10000000, 300, 'DATA_HOOK', 'Transport coordination for rental fleet', 'They know about moves before brokers', ARRAY['S2','S1']),

    -- FINANCIAL ARTERIES
    ('FINANCIAL_ARTERIES', 'Factoring Company', 'FACTORING_CO', 3, 7, 6, 20000000, NULL, 'DATA_HOOK', 'Carrier default risk assessment', 'HC Score as underwriting signal', ARRAY['S9','S7','S13']),
    ('FINANCIAL_ARTERIES', 'Insurance Carrier', 'INSURANCE_CARRIER', 2, 8, 7, 50000000, NULL, 'DATA_HOOK', 'Risk scoring for oversized transport', 'HC Risk Engine API', ARRAY['S7','S13','S12']),

    -- LABOR PIPELINE
    ('LABOR_PIPELINE', 'CDL School', 'CDL_SCHOOL', 6, 7, 8, 500000, NULL, 'EARLY_CAREER', 'Student career direction', 'Capture operators at start of career', ARRAY['S17','S6']),
    ('LABOR_PIPELINE', 'Pilot Escort Cert Program', 'PEVO_CERT_PROGRAM', 7, 8, 9, 300000, NULL, 'EARLY_CAREER', 'Certification tracking + job placement', 'Compliance Wallet from day one', ARRAY['S17','S6','S2']),

    -- EMERGENCY + FAILURE
    ('EMERGENCY_FAILURE', 'Rotator Towing Company', 'ROTATOR_TOWING', 5, 7, 5, 3000000, 100, 'DATA_HOOK', 'Incident coordination speed', 'They know about catastrophic events before insurers', ARRAY['S19','S7']),

    -- PRE-MOVE INTELLIGENCE
    ('PREMOVE_INTELLIGENCE', 'Civil Engineering Firm', 'CIVIL_ENGINEERING', 2, 8, 6, 20000000, NULL, 'WHALE_TARGETING', 'Transport planning for mega-projects', 'They see projects months before transport', ARRAY['S12','S13','S16']),
    ('PREMOVE_INTELLIGENCE', 'EPC Contractor', 'EPC_CONTRACTOR', 3, 10, 8, 500000000, NULL, 'WHALE_TARGETING', 'Creates oversized freight demand at source', 'Projects → freight → escorts → ecosystems', ARRAY['S1','S15','S16','S12']);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_rs_status ON revenue_stream(status);
CREATE INDEX idx_rs_plane ON revenue_stream(plane);
CREATE INDEX idx_ap_segment ON audience_persona(segment);
CREATE INDEX idx_ap_persona_code ON audience_persona(persona_code);
CREATE INDEX idx_ap_capture ON audience_persona(capture_strategy);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE revenue_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_persona ENABLE ROW LEVEL SECURITY;
CREATE POLICY rs_admin_read ON revenue_stream FOR SELECT USING (true);
CREATE POLICY ap_public_read ON audience_persona FOR SELECT USING (true);
