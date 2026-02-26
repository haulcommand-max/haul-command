-- 🏗️ HAUL COMMAND OS: COORDINATION CONTROL CENTER (v2.0)
-- "The Infrastructure Authority" & "Coordination Pricing Module"

-- 1. POLICE AGENCY DIRECTORY
CREATE TABLE police_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name TEXT NOT NULL,
    jurisdiction_type TEXT CHECK (jurisdiction_type IN ('state', 'county', 'city', 'township')),
    state_code TEXT NOT NULL,
    
    -- Contact & Booking
    dispatch_phone TEXT,
    booking_url TEXT,
    lead_time_hours INTEGER DEFAULT 48,
    
    -- Capacity & Rules
    officers_available INTEGER,
    requires_prepayment BOOLEAN DEFAULT false,
    rating_score NUMERIC(3, 2)
);

-- 2. UTILITY PROVIDER DATABASE
CREATE TABLE utility_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL, -- e.g. "Duke Energy"
    service_type TEXT CHECK (service_type IN ('electric', 'telecom', 'cable', 'fiber')),
    coverage_states TEXT[], -- Array of state codes
    
    -- Lift Support
    has_bucket_trucks BOOLEAN DEFAULT true,
    min_clearance_height NUMERIC(5,2), -- Height where they MUST be called
    
    -- Operational
    emergency_line TEXT,
    standard_rate_hourly NUMERIC(10, 2)
);

-- 3. COORDINATION LOGS & TICKETS
CREATE TABLE coordination_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID, -- Link to main job
    
    ticket_type TEXT CHECK (ticket_type IN ('police_escort', 'bucket_lift', 'route_survey')),
    status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    
    -- Entity Links
    police_agency_id UUID REFERENCES police_agencies(id),
    utility_provider_id UUID REFERENCES utility_providers(id),
    
    -- Schedule
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    
    -- Financials (New in v2.0)
    agency_invoice_amount NUMERIC(10, 2), -- What the police/utility charges us
    coordination_fee NUMERIC(10, 2), -- What we charge the customer (Management Fee)
    rush_surcharge NUMERIC(10, 2) DEFAULT 0, -- Late booking fee
    total_billable NUMERIC(10, 2) GENERATED ALWAYS AS (agency_invoice_amount + coordination_fee + rush_surcharge) STORED,
    
    -- Complexity Factors
    states_count INTEGER DEFAULT 1,
    is_urban_route BOOLEAN DEFAULT false,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRICING MODULE (New in v2.0)
-- -----------------------------------------------------

-- Fee structures for coordination services
CREATE TABLE coordination_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type TEXT CHECK (fee_type IN ('flat_tier', 'percentage_markup', 'hybrid')),
    
    -- Criteria
    min_states INTEGER DEFAULT 0,
    max_states INTEGER,
    complexity_level TEXT CHECK (complexity_level IN ('low', 'medium', 'high', 'extreme')),
    
    -- Pricing
    base_fee NUMERIC(10, 2), -- e.g. $150.00
    markup_pct NUMERIC(5, 4), -- e.g. 0.15 for 15%
    
    is_active BOOLEAN DEFAULT true
);

-- Initial seed for standard tiers
INSERT INTO coordination_fee_rules (fee_type, complexity_level, base_fee) VALUES
('flat_tier', 'low', 150.00), -- Simple 1-state police escort
('flat_tier', 'medium', 350.00), -- Multi-state or simple utility
('flat_tier', 'high', 750.00), -- Superload / Multi-utility
('flat_tier', 'extreme', 1500.00); -- Megaload / Bridge engineering

-- Function to calculate rush surcharge
CREATE OR REPLACE FUNCTION calculate_rush_surcharge(
    base_fee NUMERIC,
    days_notice INTEGER
) RETURNS NUMERIC AS $$
BEGIN
    IF days_notice < 2 THEN
        RETURN base_fee * 0.50; -- 50% surcharge for < 48 hours
    ELSIF days_notice < 5 THEN
        RETURN base_fee * 0.25; -- 25% surcharge for < 5 days
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;
