-- 🏗️ HAUL COMMAND OS: RATE INTELLIGENCE LAYER (v2.1)
-- "The Tight Rate Table Override System"

-- 1. RATE VERSIONS
-- Controls the "source of truth" for a given time period.
-- Allows instant rollback and A/B testing of pricing models.
CREATE TABLE rate_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL, -- e.g., "2026 Baseline", "Hurricane Surge Model Oct"
    status TEXT CHECK (status IN ('draft', 'active', 'retired', 'archived')),
    effective_start DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_end DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one ACTIVE version per timeframe is ideal, but application logic handles "Best Match"
CREATE INDEX idx_rate_versions_status ON rate_versions(status);


-- 2. RATE RULES (The Core Pricing Logic)
-- One table to rule them all. No hardcoded logic.
-- Hierarchy: Global < Region < State < Metro < Corridor < Partner < Surge
CREATE TABLE rate_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID REFERENCES rate_versions(id),
    
    -- Priority: Higher wins. 
    -- 0=Global, 10=Region, 20=State, 30=Metro, 40=Corridor, 50=Partner, 99=Surge
    priority INTEGER NOT NULL DEFAULT 0,
    
    -- Scope Definition
    scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'region', 'state', 'metro', 'corridor', 'partner', 'surge')),
    scope_key TEXT NOT NULL, -- 'global', 'FL', 'I-75_GA', 'partner_123'
    
    -- Service Definition
    service_type TEXT NOT NULL CHECK (service_type IN ('pilot_car', 'high_pole', 'bucket_truck', 'police', 'route_survey', 'admin_fee')),
    billing_mode TEXT NOT NULL CHECK (billing_mode IN ('per_mile', 'hourly', 'daily', 'flat', 'multiplier')),
    field TEXT NOT NULL, -- 'base_rate', 'overtime_rate', 'weekend_multiplier', 'deadhead_rate'
    
    -- Pricing Values (Range Support)
    low_value NUMERIC(10, 2) NOT NULL,
    high_value NUMERIC(10, 2) NOT NULL,
    units TEXT NOT NULL DEFAULT '$', -- '$', '$/mi', '$/hr', 'x' (multiplier)
    
    -- Conditional Logic (JSON Logic)
    -- e.g., { "min_width": 16, "night_ops": true, "vertical": "wind_energy" }
    conditions_json JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    updated_by UUID, -- Reference to admin user
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_values CHECK (low_value <= high_value)
);

-- Indexes for the "Best Match" query
CREATE INDEX idx_rate_rules_lookup ON rate_rules(version_id, service_type, billing_mode, field);
CREATE INDEX idx_rate_rules_scope ON rate_rules(scope_type, scope_key);
CREATE INDEX idx_rate_rules_priority ON rate_rules(priority DESC);


-- 3. HELPER VIEW: Active Rules Flat List
-- Simplifies querying the current effective ruleset
CREATE VIEW v_active_rate_rules AS
SELECT 
    r.* 
FROM rate_rules r
JOIN rate_versions v ON r.version_id = v.id
WHERE v.status = 'active'
  AND (v.effective_end IS NULL OR v.effective_end >= CURRENT_DATE)
ORDER BY r.priority DESC;

-- 4. SURGE METRICS (Retained from v2.0 for reference triggers)
CREATE TABLE surge_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    state_code TEXT NOT NULL,
    surge_detected BOOLEAN DEFAULT false,
    surge_level TEXT CHECK (surge_level IN ('none', 'alert', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
