-- ============================================================================
-- COMPLIANCE RULES ENGINE (Phase 3.5)
-- ============================================================================
-- Purpose: The "Compliance Sentinel" Logic. Warns drivers BEFORE they hit a trap.
-- Strategy: "Predictive Compliance" vs "Reactive Fees" (WCS Killer).
-- ============================================================================

-- 1. Compliance Rules Table
-- Maps a Jurisdiction (State) to specific Equipment or Permit requirements.
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id TEXT NOT NULL, -- 'US-NY', 'US-FL', etc.
    rule_type TEXT NOT NULL, -- 'EQUIPMENT', 'PERMIT', 'CURFEW', 'INSPECTION'
    trigger_condition JSONB NOT NULL, -- { "load_height_feet": 14.5 } or { "always": true }
    alert_message TEXT NOT NULL, -- "WARNING: Entering NY. 10lb Fire Extinguisher REQUIRED."
    severity_level TEXT DEFAULT 'CRITICAL', -- 'CRITICAL', 'WARNING', 'INFO'
    citation_reference TEXT, -- "NY VTL Section 385"
    fine_estimate_usd INTEGER, -- 500
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Geofence Triggers
-- Defines the polygon or border line where the alert fires.
CREATE TABLE IF NOT EXISTS geofence_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES compliance_rules(id),
    name TEXT NOT NULL, -- "NY State Border - I-95 Entry"
    geography GEOGRAPHY(POLYGON), -- PostGIS polygon
    buffer_meters INTEGER DEFAULT 5000, -- Trigger 5km before border
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Seed Data: The "Kill Shots"
INSERT INTO compliance_rules (jurisdiction_id, rule_type, trigger_condition, alert_message, citation_reference, fine_estimate_usd) VALUES
-- New York: The "Light Bar Trap"
('US-NY', 'EQUIPMENT', '{"always": true}', 'CRITICAL: Entering New York. Compliant Light Bar (43-52 in) & 10lb Fire Extinguisher REQUIRED. NY Insignia must be displayed.', 'NY DOT Regs', 1000),
('US-NY', 'EQUIPMENT', '{"always": true}', 'CRITICAL: Wheelbase Check. Vehicle must be >100 inches.', 'NY DOT Regs', 500),

-- Florida: The "Cone Trap"
('US-FL', 'EQUIPMENT', '{"always": true}', 'COMPLIANCE ALERT: Florida requires 36-inch Reflective Cones. Standard 18-inch cones are ILLEGAL.', 'FL Statute 316', 250),

-- Nevada: The "Permit Trap"
('US-NV', 'PERMIT', '{"always": true}', 'STOP: Amber Light Permit Required ($2/yr). Do not enter without sticker.', 'NV DMV', 500),

-- Louisiana: The "Insurance Trap"
('US-LA', 'PERMIT', '{"always": true}', 'STOP: LA Escort Permit ($10) & $500k Insurance Proof Required on board.', 'LA DOTD', 500),

-- Kansas: The "Trip Trap"
('US-KS', 'PERMIT', '{"always": true}', 'ALERT: Must be registered in K-TRIPS system before operating.', 'KS DOT', 250),

-- Virginia: The "Light Intensity Trap"
('US-VA', 'EQUIPMENT', '{"always": true}', 'LIGHTING CHECK: High-intensity flashers PROHIBITED. Verify Class 2 Amber Lights.', 'VA Code', 250),

-- Massachusetts: The "Height Pole Trap"
('US-MA', 'EQUIPMENT', '{"load_height_feet": 13.92}', 'HEIGHT ALERT: MA requires High Pole at 13ft 11in (Federal is 14ft 6in). Check Pole Height.', 'MA DOT', 1000)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Rules" ON compliance_rules FOR SELECT USING (true);
