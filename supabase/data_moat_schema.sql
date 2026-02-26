-- ============================================================
-- HAUL COMMAND: DATA MOAT SCHEMA
-- Supabase (Postgres) — Source of Truth
-- ============================================================
-- Deploy with: supabase migration apply
-- This schema is the foundation of the entire BLAST framework.
-- Every table feeds Pinecone for long-term vector memory.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CARRIERS (The Identity Layer)
-- ============================================================
-- Every carrier/fleet that touches the platform.
-- Verified identity = lock-in. TWIC/WITPAC stored here.
CREATE TABLE carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    company_name TEXT NOT NULL,
    dba_name TEXT,
    mc_number TEXT UNIQUE,
    dot_number TEXT UNIQUE,
    ein TEXT,
    
    -- Contact
    owner_first_name TEXT NOT NULL,
    owner_last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    
    -- Verification (Lock-In Layer)
    twic_number TEXT,
    twic_expiry DATE,
    witpac_certified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    
    -- Authority & Insurance
    authority_status TEXT DEFAULT 'PENDING',  -- PENDING, ACTIVE, SUSPENDED, REVOKED
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry DATE,
    insurance_coverage_amount BIGINT,  -- in cents
    
    -- Platform Metrics
    reputation_score NUMERIC(3,2) DEFAULT 0.00,  -- 0.00 to 5.00
    total_permits_processed INTEGER DEFAULT 0,
    total_loads_moved INTEGER DEFAULT 0,
    member_since TIMESTAMPTZ DEFAULT NOW(),
    tier TEXT DEFAULT 'STARTER',  -- STARTER, PRO, ENTERPRISE, ELITE
    
    -- Haul Pay
    haul_pay_account_id TEXT,
    haul_pay_enabled BOOLEAN DEFAULT FALSE,
    factoring_rate NUMERIC(4,2) DEFAULT 3.00,  -- percentage
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. VEHICLES (The Equipment Registry)
-- ============================================================
-- Auto-fill source. Margins expand with every repeat permit.
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    
    -- Identification
    unit_number TEXT NOT NULL,
    vin TEXT UNIQUE,
    plate_number TEXT,
    plate_state TEXT,
    year INTEGER,
    make TEXT,
    model TEXT,
    
    -- Equipment Type
    vehicle_type TEXT NOT NULL,  -- Lowboy, RGN, Blade Trailer, Step Deck, etc.
    axle_config TEXT,            -- 3-axle, 9-axle, 13-axle, etc.
    axle_count INTEGER,
    axle_spacings JSONB,        -- Array of spacing measurements in feet
    
    -- Dimensions (stored for auto-fill)
    height_ft NUMERIC(5,2),
    width_ft NUMERIC(5,2),
    length_ft NUMERIC(5,2),
    empty_weight_lbs INTEGER,
    max_payload_lbs INTEGER,
    gvwr_lbs INTEGER,
    
    -- Compliance
    registration_state TEXT,
    registration_expiry DATE,
    annual_inspection_date DATE,
    insurance_linked BOOLEAN DEFAULT TRUE,
    
    -- Usage Metrics (Data Reuse = Margin Expansion)
    permit_count INTEGER DEFAULT 0,
    last_permit_date TIMESTAMPTZ,
    total_miles_permitted NUMERIC(10,1) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, SOLD, MAINTENANCE
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(carrier_id, unit_number)
);

-- ============================================================
-- 3. PERMITS (The Core Revenue Table)
-- ============================================================
-- Every permit ever processed. This IS the Data Moat.
CREATE TABLE permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    quote_id UUID,  -- Links to the quote that generated this
    
    -- Permit Details
    permit_number TEXT,          -- State-issued number
    permit_type TEXT NOT NULL,   -- SINGLE_TRIP, ANNUAL, SUPERLOAD, BLANKET
    state_code TEXT NOT NULL,
    jurisdiction TEXT,
    
    -- Load Details (snapshot at time of permit)
    load_description TEXT,
    load_height_ft NUMERIC(5,2),
    load_width_ft NUMERIC(5,2),
    load_length_ft NUMERIC(5,2),
    load_weight_lbs INTEGER,
    
    -- Route
    origin_city TEXT,
    origin_state TEXT,
    destination_city TEXT,
    destination_state TEXT,
    route_description TEXT,
    route_segments JSONB,        -- Array of segment names
    
    -- Requirements (captured for future AI training)
    escort_required BOOLEAN DEFAULT FALSE,
    escort_count INTEGER DEFAULT 0,
    law_enforcement_required BOOLEAN DEFAULT FALSE,
    travel_restrictions JSONB,   -- Curfew hours, night rules, etc.
    signage_requirements JSONB,  -- Banner specs, flag counts
    
    -- Financials
    state_fee_cents BIGINT DEFAULT 0,
    platform_fee_cents BIGINT DEFAULT 0,
    escort_fee_cents BIGINT DEFAULT 0,
    le_fee_cents BIGINT DEFAULT 0,
    rush_fee_cents BIGINT DEFAULT 0,
    total_cost_cents BIGINT DEFAULT 0,
    haul_command_revenue_cents BIGINT DEFAULT 0,
    
    -- Timeline
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    processing_hours NUMERIC(5,1),
    effective_date DATE,
    expiration_date DATE,
    
    -- Status
    status TEXT DEFAULT 'DRAFT',  -- DRAFT, SUBMITTED, PROCESSING, APPROVED, DENIED, EXPIRED
    denial_reason TEXT,
    
    -- Automation Tracking
    auto_filled BOOLEAN DEFAULT FALSE,
    fields_auto_filled INTEGER DEFAULT 0,
    portal_automated BOOLEAN DEFAULT FALSE,  -- Did Anti-Gravity submit this?
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ROUTES (The Clearance Intelligence Layer)
-- ============================================================
-- Every route scored. Feeds the 3D clearance moat.
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Route Definition
    route_name TEXT NOT NULL,
    origin_city TEXT,
    origin_state TEXT,
    destination_city TEXT,
    destination_state TEXT,
    states_crossed TEXT[],       -- Array of state codes
    total_distance_miles NUMERIC(8,1),
    
    -- Segments (detailed clearance data)
    segments JSONB NOT NULL,     -- Array: {name, clearance_ft, weight_limit, width_limit, status}
    
    -- Scoring (from Predictive Routing Core)
    viable BOOLEAN,
    avg_risk_score NUMERIC(4,3),
    risk_grade TEXT,              -- A, B, C, D, F
    
    -- HERE API Data (3D Clearance)
    here_route_id TEXT,
    here_geometry JSONB,         -- GeoJSON
    bridge_clearances JSONB,     -- Array of bridge clearance measurements
    tunnel_clearances JSONB,
    
    -- Intelligence (Data Moat)
    times_used INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    known_issues JSONB,          -- Construction, restrictions, seasonal closures
    enforcement_hotspots JSONB,  -- Known DOT enforcement locations on this route
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. QUOTES (Revenue Engine Tracking)
-- ============================================================
-- Every instant quote = revenue opportunity tracked.
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- Quote Details
    quote_number TEXT UNIQUE NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    states_crossed TEXT[],
    
    -- Load
    load_height_ft NUMERIC(5,2),
    load_width_ft NUMERIC(5,2),
    load_length_ft NUMERIC(5,2),
    load_weight_lbs INTEGER,
    equipment_type TEXT,
    
    -- Pricing Breakdown
    platform_fee_cents BIGINT DEFAULT 0,
    state_fees_cents BIGINT DEFAULT 0,
    route_analysis_cents BIGINT DEFAULT 0,
    escort_coord_cents BIGINT DEFAULT 0,
    le_coord_cents BIGINT DEFAULT 0,
    rush_fee_cents BIGINT DEFAULT 0,
    superload_surcharge_cents BIGINT DEFAULT 0,
    passthrough_costs_cents BIGINT DEFAULT 0,
    total_quote_cents BIGINT DEFAULT 0,
    haul_command_margin_cents BIGINT DEFAULT 0,
    
    -- Feasibility
    permit_probability INTEGER,   -- 0-100
    risk_grade TEXT,
    recommended_route TEXT,
    routes_evaluated INTEGER,
    viable_routes INTEGER,
    
    -- Status
    status TEXT DEFAULT 'PENDING',  -- PENDING, ACCEPTED, DECLINED, EXPIRED
    accepted_at TIMESTAMPTZ,
    declined_reason TEXT,
    valid_until TIMESTAMPTZ,
    
    -- Conversion Tracking
    converted_to_permit BOOLEAN DEFAULT FALSE,
    permit_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. ENFORCEMENT DATA (The DOT Intelligence Moat)
-- ============================================================
-- Mirrors to Pinecone for vector search. THIS is the data nobody else has.
CREATE TABLE enforcement_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Location
    state_code TEXT NOT NULL,
    county TEXT,
    city TEXT,
    highway TEXT,
    mile_marker NUMERIC(8,1),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    
    -- Enforcement Details
    enforcement_type TEXT NOT NULL,  -- INSPECTION, CITATION, WARNING, WEIGH_STATION
    violation_type TEXT,             -- OVERWEIGHT, OVERSIZE, SIGNAGE, PERMIT, ESCORT
    violation_code TEXT,
    description TEXT,
    fine_amount_cents BIGINT,
    
    -- Patterns (AI-generated insights)
    day_of_week TEXT,
    time_of_day TEXT,
    season TEXT,
    frequency_score NUMERIC(4,2),   -- How often this location enforces (0-10)
    
    -- Source
    data_source TEXT,  -- DRIVER_REPORT, DOT_FEED, AI_ANALYSIS, MANUAL
    verified BOOLEAN DEFAULT FALSE,
    
    -- Pinecone Sync
    pinecone_id TEXT,
    last_synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. COMPLIANCE ALERTS (Proactive Monetization)
-- ============================================================
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    alert_type TEXT NOT NULL,     -- INSURANCE_EXPIRY, REGISTRATION_EXPIRY, PERMIT_RENEWAL, 
                                 -- AUTHORITY_STATUS, INSPECTION_DUE, TWIC_EXPIRY
    severity TEXT NOT NULL,      -- INFO, WARNING, CRITICAL, EXPIRED
    
    title TEXT NOT NULL,
    description TEXT,
    
    expiration_date DATE,
    days_remaining INTEGER,
    
    -- Action
    action_required TEXT,
    action_url TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. REPUTATION INDEX (Marketplace Control)
-- ============================================================
CREATE TABLE reputation_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who is being rated
    entity_type TEXT NOT NULL,    -- CARRIER, ESCORT, SURVEYOR, SHIPPER
    entity_id UUID NOT NULL,     -- References carrier, escort, or shipper
    
    -- Who is rating
    rated_by_type TEXT NOT NULL,
    rated_by_id UUID NOT NULL,
    
    -- The Rating
    overall_score NUMERIC(3,2) NOT NULL,  -- 0.00 to 5.00
    on_time_score NUMERIC(3,2),
    communication_score NUMERIC(3,2),
    safety_score NUMERIC(3,2),
    compliance_score NUMERIC(3,2),
    
    -- Context
    related_permit_id UUID,
    related_load_description TEXT,
    review_text TEXT,
    
    -- Verification
    verified_transaction BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. STORE / EQUIPMENT MARKETPLACE
-- ============================================================
CREATE TABLE store_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Product Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,        -- SAFETY, ESCORT, SECUREMENT, PPE, TECHNOLOGY, BRANDED
    subcategory TEXT,
    sku TEXT UNIQUE,
    
    -- Pricing
    retail_price_cents BIGINT NOT NULL,
    cost_price_cents BIGINT NOT NULL,
    margin_percent NUMERIC(5,2),
    
    -- Inventory
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    
    -- Media
    image_url TEXT,
    
    -- Flags
    featured BOOLEAN DEFAULT FALSE,
    bundle_eligible BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    
    -- Order
    order_number TEXT UNIQUE NOT NULL,
    items JSONB NOT NULL,            -- Array of {product_id, quantity, price}
    subtotal_cents BIGINT NOT NULL,
    shipping_cents BIGINT DEFAULT 0,
    tax_cents BIGINT DEFAULT 0,
    total_cents BIGINT NOT NULL,
    
    -- Bundle Promo
    bundled_with_permit BOOLEAN DEFAULT FALSE,
    promo_code TEXT,
    discount_cents BIGINT DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'PENDING',   -- PENDING, PAID, SHIPPED, DELIVERED, RETURNED
    
    -- Haul Pay
    paid_via_haul_pay BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. HAUL PAY (Financial Rail)
-- ============================================================
CREATE TABLE haul_pay_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    
    -- Transaction
    transaction_type TEXT NOT NULL,  -- PERMIT_PAYMENT, FACTORING, EWA, FUEL_ADVANCE, STORE_PURCHASE
    amount_cents BIGINT NOT NULL,
    fee_cents BIGINT DEFAULT 0,
    net_amount_cents BIGINT NOT NULL,
    
    -- Factoring (if applicable)
    invoice_number TEXT,
    factoring_rate NUMERIC(4,2),
    days_to_payment INTEGER,
    
    -- Status
    status TEXT DEFAULT 'PENDING',  -- PENDING, COMPLETED, FAILED, REVERSED
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. INDUSTRY DIRECTORY (Self-Updating Data Moat)
-- ============================================================
-- Location-based industry entities (Truck stops, Pilot Cars, Permit Offices).
-- Monthly refreshes via n8n/Outscraper keep this data "living".
CREATE TABLE industry_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    name TEXT NOT NULL,
    category TEXT NOT NULL,         -- PILOT_CAR, TRUCK_STOP, PERMIT_OFFICE, REPAIR_SHOP
    subcategory TEXT,
    
    -- Contact
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Location
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    
    -- Verification
    google_place_id TEXT UNIQUE,
    status TEXT DEFAULT 'ACTIVE',   -- ACTIVE, CLOSED, UNVERIFIED
    last_scraped_at TIMESTAMPTZ,
    data_quality_score NUMERIC(3,2), -- AI-generated score (0-10)
    
    -- Metadata
    tags TEXT[],
    amenities JSONB,               -- Showers, parking slots, overnight rules
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEXES (Performance)
-- ============================================================
CREATE INDEX idx_vehicles_carrier ON vehicles(carrier_id);
CREATE INDEX idx_permits_carrier ON permits(carrier_id);
CREATE INDEX idx_permits_state ON permits(state_code);
CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_permits_created ON permits(created_at);
CREATE INDEX idx_quotes_carrier ON quotes(carrier_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_enforcement_state ON enforcement_data(state_code);
CREATE INDEX idx_enforcement_type ON enforcement_data(enforcement_type);
CREATE INDEX idx_enforcement_location ON enforcement_data(latitude, longitude);
CREATE INDEX idx_alerts_carrier ON compliance_alerts(carrier_id);
CREATE INDEX idx_alerts_severity ON compliance_alerts(severity);
CREATE INDEX idx_reputation_entity ON reputation_entries(entity_type, entity_id);
CREATE INDEX idx_store_category ON store_products(category);
CREATE INDEX idx_haulpay_carrier ON haul_pay_transactions(carrier_id);
CREATE INDEX idx_haulpay_type ON haul_pay_transactions(transaction_type);
CREATE INDEX idx_industry_category ON industry_directory(category);
CREATE INDEX idx_industry_location ON industry_directory(latitude, longitude);


-- ============================================================
-- ROW LEVEL SECURITY (Carrier Data Isolation)
-- ============================================================
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE haul_pay_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;

-- Carriers can only see their own data
CREATE POLICY carrier_isolation ON carriers
    FOR ALL USING (id = auth.uid());

CREATE POLICY vehicle_isolation ON vehicles
    FOR ALL USING (carrier_id = auth.uid());

CREATE POLICY permit_isolation ON permits
    FOR ALL USING (carrier_id = auth.uid());

CREATE POLICY quote_isolation ON quotes
    FOR ALL USING (carrier_id = auth.uid());

CREATE POLICY alert_isolation ON compliance_alerts
    FOR ALL USING (carrier_id = auth.uid());

CREATE POLICY haulpay_isolation ON haul_pay_transactions
    FOR ALL USING (carrier_id = auth.uid());

CREATE POLICY order_isolation ON store_orders
    FOR ALL USING (carrier_id = auth.uid());

-- Routes and enforcement data are shared (part of the moat)
-- Products are public
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY routes_public_read ON routes FOR SELECT USING (true);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_public_read ON store_products FOR SELECT USING (true);

ALTER TABLE enforcement_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY enforcement_public_read ON enforcement_data FOR SELECT USING (true);

ALTER TABLE industry_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY industry_public_read ON industry_directory FOR SELECT USING (true);

