-- Haul Command Global Taxonomy Seed
-- Purpose: Supports the 120-Country Expansion Model 
-- Contains setup for Universal Roles, Countries by Tier, and localized capability naming.

-- 1. Create Universal Capabilities Enum
CREATE TYPE hc_escort_capability AS ENUM (
    'front_escort',
    'rear_escort',
    'steer',
    'high_pole',
    'route_survey',
    'port_access',
    'military_base_access',
    'hazmat'
);

-- 2. Create the 120-Country Directory
CREATE TABLE hc_countries (
    iso2 CHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('Tier_A', 'Tier_B', 'Tier_C', 'Tier_D', 'Tier_E')),
    currency_code CHAR(3) NOT NULL,
    regulatory_density_score INT CHECK (regulatory_density_score BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT FALSE
);

-- 3. Create the Localized Capability Mapping Table
-- Example: 'port_access' in 'US' -> 'TWIC'
CREATE TABLE hc_localized_capabilities (
    country_iso2 CHAR(2) REFERENCES hc_countries(iso2),
    universal_capability hc_escort_capability NOT NULL,
    local_term VARCHAR(255) NOT NULL,
    local_slug VARCHAR(255) NOT NULL,
    description TEXT,
    PRIMARY KEY (country_iso2, universal_capability)
);

-- 4. Create Jurisdictions (States/Provinces)
CREATE TABLE hc_jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_iso2 CHAR(2) REFERENCES hc_countries(iso2),
    code VARCHAR(50) NOT NULL, -- e.g. TX, NSW, BY
    name VARCHAR(255) NOT NULL,
    UNIQUE (country_iso2, code)
);

-- 5. Create Numeric Requirement Table for Routing Calculators (NTS Extracted)
CREATE TABLE hc_jurisdiction_requirements (
    jurisdiction_id UUID REFERENCES hc_jurisdictions(id),
    highway_type VARCHAR(100) DEFAULT 'Interstate', -- Divided, 2-Lane, etc.
    threshold_width_meters DECIMAL(10,2),
    threshold_height_meters DECIMAL(10,2),
    threshold_length_meters DECIMAL(10,2),
    threshold_weight_kg DECIMAL(15,2),
    rule_type VARCHAR(50) CHECK (rule_type IN ('requires_front', 'requires_rear', 'requires_both', 'requires_police', 'requires_high_pole', 'time_restriction')),
    rule_json_details JSONB, -- For holiday curfews or daylight-only flags
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA - Tier A Priority Targets 
INSERT INTO hc_countries (iso2, name, tier, currency_code, regulatory_density_score, is_active) VALUES
('US', 'United States', 'Tier_A', 'USD', 5, TRUE),
('AU', 'Australia', 'Tier_A', 'AUD', 5, TRUE),
('CA', 'Canada', 'Tier_A', 'CAD', 5, TRUE),
('GB', 'United Kingdom', 'Tier_A', 'GBP', 5, TRUE),
('DE', 'Germany', 'Tier_A', 'EUR', 5, TRUE),
('NL', 'Netherlands', 'Tier_A', 'EUR', 4, TRUE),
('AE', 'United Arab Emirates', 'Tier_A', 'AED', 4, TRUE),
('ZA', 'South Africa', 'Tier_A', 'ZAR', 3, TRUE),
('NZ', 'New Zealand', 'Tier_A', 'NZD', 4, TRUE),
('BR', 'Brazil', 'Tier_A', 'BRL', 3, TRUE);

-- SEED DATA - Localized Capability Terms (Glossary Mappings)
INSERT INTO hc_localized_capabilities (country_iso2, universal_capability, local_term, local_slug) VALUES
-- US Examples
('US', 'front_escort', 'Lead Pilot Car', 'lead-pilot-car'),
('US', 'rear_escort', 'Chase Pilot Car', 'chase-pilot-car'),
('US', 'high_pole', 'High Pole Escort', 'high-pole'),
('US', 'port_access', 'TWIC Authorized', 'twic-port-escort'),
('US', 'route_survey', 'Route Survey', 'route-survey'),

-- AU Examples 
('AU', 'front_escort', 'Level 1 Pilot Vehicle', 'level-1-pilot-vehicle'),
('AU', 'rear_escort', 'Level 2 Pilot Vehicle', 'level-2-pilot-vehicle'),
('AU', 'port_access', 'MSIC Authorized', 'msic-port-access'),

-- GB Examples
('GB', 'front_escort', 'Abnormal Load Escort', 'abnormal-load-escort'),
('GB', 'route_survey', 'Abnormal Load Route Feasibility', 'abnormal-load-route-feasibility'),

-- DE Examples
('DE', 'front_escort', 'BF3 Begleitfahrzeug', 'bf3-begleitfahrzeug'),
('DE', 'rear_escort', 'BF4 Begleitfahrzeug (Polizeiersatz)', 'bf4-begleitfahrzeug'),
('DE', 'route_survey', 'Streckenprüfung', 'streckenpruefung');

-- SEED DATA - Jurisdictions (Small sample for proof of concept)
INSERT INTO hc_jurisdictions (country_iso2, code, name) VALUES
('US', 'TX', 'Texas'),
('US', 'FL', 'Florida'),
('AU', 'NSW', 'New South Wales'),
('AU', 'QLD', 'Queensland'),
('DE', 'BW', 'Baden-Württemberg');

-- Example Reciprocity Table (Evergreen Extracted)
CREATE TABLE hc_certification_reciprocity (
    cert_origin_jurisdiction_id UUID REFERENCES hc_jurisdictions(id),
    cert_target_jurisdiction_id UUID REFERENCES hc_jurisdictions(id),
    status VARCHAR(50) CHECK (status IN ('full_acceptance', 'requires_add_on', 'not_accepted')),
    add_on_requirements JSONB, -- e.g. {"course": "Defensive Driving", "state": "FL"}
    PRIMARY KEY (cert_origin_jurisdiction_id, cert_target_jurisdiction_id)
);
