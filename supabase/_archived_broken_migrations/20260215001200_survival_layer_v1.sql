-- 🏗️ HAUL COMMAND OS: SURVIVAL LAYER (v1.0)
-- "The Infrastructure Revenue Engine: Bed, Bank, Badge, Data"

-- ==========================================
-- 1. LIFE SUPPORT REVENUE (Hotels & Parking)
-- "Don't just route them, tell them where to sleep."
-- ==========================================

CREATE TABLE lodging_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand_chain TEXT, -- 'Motel 6', 'Red Roof', etc.
    
    -- Location
    address_full TEXT,
    city TEXT,
    state TEXT,
    highway_exit_ref TEXT, -- "I-80 Exit 242"
    geo_lat NUMERIC,
    geo_long NUMERIC,
    
    -- Pilot Specifics
    has_truck_parking BOOLEAN DEFAULT false,
    parking_spots_count INTEGER,
    accepts_clc BOOLEAN DEFAULT true,
    pilot_rate_nightly NUMERIC(10, 2), -- Negotiated rate
    
    -- Affiliate Data
    booking_link_template TEXT, -- "booking.com/ref=haulcommand..."
    commission_pct NUMERIC(4, 3), -- 0.05 (5%)
    
    is_verified_pilot_friendly BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lodging_geo ON lodging_partners(state, highway_exit_ref);

-- Track the money
CREATE TABLE affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES companies(id), -- Who booked
    partner_id UUID REFERENCES lodging_partners(id),
    transaction_amount NUMERIC(10, 2),
    commission_earned NUMERIC(10, 2),
    status TEXT CHECK (status IN ('pending', 'paid', 'disputed')),
    booked_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 2. "VERIFIED PROFESSIONAL" UPSELL (Elite Tier)
-- "Killing the Ghetto Pilot Car"
-- ==========================================

CREATE TABLE fleet_verification_standards (
    company_id UUID PRIMARY KEY REFERENCES companies(id),
    
    -- Vetting Inputs
    vehicle_avg_age_years NUMERIC(4,1), -- Newness check
    navixy_safety_score INTEGER, -- Telematics Driving Score (0-100)
    has_professional_signage BOOLEAN DEFAULT false, -- Image analysis check
    insurance_verified_tier TEXT, -- 'minimal', 'standard', 'excess_liability'
    
    -- Elite Status
    is_elite_fleet BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN vehicle_avg_age_years <= 7 
             AND navixy_safety_score >= 85 
             AND has_professional_signage 
             AND insurance_verified_tier IN ('standard', 'excess_liability')
            THEN true
            ELSE false
        END
    ) STORED,
    
    last_audit_date DATE
);

-- Pricing Markup Rule for Elite
-- (This would hook into the Rate Engine)
CREATE VIEW active_elite_fleets AS
SELECT c.id, c.company_name, f.navixy_safety_score
FROM companies c
JOIN fleet_verification_standards f ON c.id = f.company_id
WHERE f.is_elite_fleet = true;


-- ==========================================
-- 3. UTILITY RESPONSE "911 LAYER"
-- "Bucket Trucks on Demand"
-- ==========================================

-- Extension to existing `utility_providers`
CREATE TABLE utility_emergency_status (
    provider_id UUID REFERENCES utility_providers(id),
    
    is_on_call BOOLEAN DEFAULT false,
    current_lat NUMERIC,
    current_long NUMERIC,
    
    response_radius_miles INTEGER DEFAULT 100,
    emergency_callout_fee NUMERIC(10, 2) DEFAULT 1500.00, -- High ticket
    
    last_heartbeat TIMESTAMPTZ
);


-- ==========================================
-- 4. DATA EXHAUST MONETIZATION
-- "Selling the Road to the State"
-- ==========================================

CREATE TABLE route_intelligence_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name TEXT, -- "I-80 Bridge Obstruction Report Q1"
    target_buyer_type TEXT CHECK (target_buyer_type IN ('engineering_firm', 'state_dot', 'insurance_carrier')),
    price_license_annual NUMERIC(10, 2),
    
    data_parameters JSONB, -- { "corridor": "I-80", "type": "clearance_issue" }
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE data_license_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_org_name TEXT,
    package_id UUID REFERENCES route_intelligence_packages(id),
    license_key TEXT UNIQUE,
    valid_until DATE,
    contract_value NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 5. BUSINESS-IN-A-BOX FINANCING
-- "The Bank"
-- ==========================================

CREATE TABLE equipment_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_name TEXT, -- "Starter Pilot Kit"
    description TEXT, -- "Lightbar, 2 High Poles, Magnetic Signs"
    total_cost NUMERIC(10, 2),
    finance_term_months INTEGER DEFAULT 24
);

CREATE TABLE financing_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id UUID REFERENCES companies(id),
    kit_id UUID REFERENCES equipment_kits(id),
    
    principal_amount NUMERIC(10, 2),
    interest_rate_annual NUMERIC(4, 3), -- 0.12 = 12%
    monthly_payment NUMERIC(10, 2),
    
    outstanding_balance NUMERIC(10, 2),
    status TEXT CHECK (status IN ('active', 'paid_off', 'defaulted')),
    
    -- The Lock-In
    lock_in_clause_agreed BOOLEAN DEFAULT true, -- "Must use Haul Command"
    
    start_date DATE,
    next_payment_due DATE
);


-- ==========================================
-- 6. COMPLIANCE VAULT
-- "The Digital Badge"
-- ==========================================

CREATE TABLE compliance_vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    
    document_type TEXT NOT NULL, -- 'TWIC', 'Utah Light', 'California Amber', 'NY Certification'
    issuing_state TEXT,
    
    document_number TEXT,
    expiry_date DATE,
    
    digital_copy_url TEXT,
    verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    auto_renew_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Link creation
-- (handled via logic to ensure they have the "Vault" plan in operator_subscriptions)
