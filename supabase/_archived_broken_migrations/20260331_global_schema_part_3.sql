-- Haul Command Global Intelligence Unit
-- Tasks 11-20: Mass execution of Database Schema and Taxonomy Seeding

-- 11. Tier D & E SQL Seed data
INSERT INTO hc_countries (iso2, name, tier, currency_code, regulatory_density_score, is_active) VALUES
('IL', 'Israel', 'Tier_D', 'ILS', 3, TRUE),
('ZA', 'South Africa', 'Tier_D', 'ZAR', 3, TRUE),
('EG', 'Egypt', 'Tier_D', 'EGP', 2, TRUE),
('KE', 'Kenya', 'Tier_D', 'KES', 2, FALSE),
('NG', 'Nigeria', 'Tier_D', 'NGN', 2, FALSE),
('PE', 'Peru', 'Tier_C', 'PEN', 3, TRUE),
('AR', 'Argentina', 'Tier_C', 'ARS', 3, TRUE),
('DZ', 'Algeria', 'Tier_E', 'DZD', 1, FALSE),
('MA', 'Morocco', 'Tier_E', 'MAD', 2, FALSE);

-- 12. Route Surveys & Bridge Hazards
CREATE TABLE hc_route_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_origin JSONB NOT NULL,
    survey_destination JSONB NOT NULL,
    surveying_company UUID REFERENCES hc_operator_companies(id),
    hazards_logged JSONB, -- Array of {type: 'underpass', height: 4.8, coords: [lat,lng]}
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Training Providers Marketplace
CREATE TABLE hc_training_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(255) NOT NULL,
    country_iso2 CHAR(2) REFERENCES hc_countries(iso2),
    accreditation_body VARCHAR(255), -- E.g., Evergreen Safety Council or WA State Patrol
    website_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT TRUE
);

-- 14. Permit Agencies Registry
CREATE TABLE hc_permit_agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id UUID REFERENCES hc_jurisdictions(id),
    agency_name VARCHAR(255),
    contact_phone VARCHAR(50),
    portal_url VARCHAR(255)
);

-- 15. Insurance Providers Tracking
CREATE TABLE hc_insurance_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(255) UNIQUE NOT NULL,
    discount_tier INT DEFAULT 0 -- Monetization layer for referrals based on Trust Score
);

-- 16. Fraud Flags (Blockchain-inspired audit)
CREATE TABLE hc_fraud_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_company UUID REFERENCES hc_operator_companies(id),
    reporter UUID REFERENCES auth.users(id),
    infraction_type VARCHAR(100) CHECK (infraction_type IN ('double_brokering', 'fake_acord_certificate', 'stolen_identity', 'payment_skip')),
    evidence_url VARCHAR(1024),
    status VARCHAR(50) DEFAULT 'investigating',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Operator Readiness Score Cache
CREATE TABLE hc_operator_readiness_scores (
    company_id UUID REFERENCES hc_operator_companies(id) PRIMARY KEY,
    readiness_score INT CHECK (readiness_score BETWEEN 0 AND 100),
    compliance_factor DECIMAL(5,2),
    historical_fulfillment_rate DECIMAL(5,2),
    last_computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Equipment Inventory
CREATE TABLE hc_equipment_inventory (
    company_id UUID REFERENCES hc_operator_companies(id),
    equipment_type VARCHAR(100) CHECK (equipment_type IN ('high_pole', 'amber_strobe_bar', 'convoi_exceptionnel_sign', 'oversize_load_banner', 'cb_radio')),
    qty INT DEFAULT 1,
    last_verified TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (company_id, equipment_type)
);

-- 19. Carrier Companies (Demand Side)
CREATE TABLE hc_carrier_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usdot_number VARCHAR(100) UNIQUE,
    company_name VARCHAR(255),
    verified_status BOOLEAN DEFAULT FALSE,
    billing_default_currency CHAR(3) DEFAULT 'USD'
);

-- 20. Reciprocity Edges (Directional Logic Graph)
CREATE TABLE hc_reciprocity_edges (
    source_jurisdiction UUID REFERENCES hc_jurisdictions(id),
    target_jurisdiction UUID REFERENCES hc_jurisdictions(id),
    acceptance_logic VARCHAR(50) CHECK (acceptance_logic IN ('full', 'addon_required', 'none')),
    addon_details JSONB,
    PRIMARY KEY (source_jurisdiction, target_jurisdiction)
);
