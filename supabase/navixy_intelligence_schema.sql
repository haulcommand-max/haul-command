-- ============================================================================
-- NAVIXY INTELLIGENCE LAYER — WAVE 1 SCHEMA
-- Middleware tables that turn raw Navixy telemetry into heavy-haul gold.
-- ============================================================================

-- --------------------------------------------------------------------------
-- ENUMS
-- --------------------------------------------------------------------------
CREATE TYPE navixy_alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');
CREATE TYPE navixy_event_status   AS ENUM ('pending', 'processing', 'resolved', 'escalated', 'false_positive');
CREATE TYPE evidence_packet_status AS ENUM ('collecting', 'assembling', 'complete', 'delivered', 'archived');
CREATE TYPE detention_invoice_status AS ENUM ('accruing', 'pending_approval', 'invoiced', 'paid', 'disputed', 'waived');

-- --------------------------------------------------------------------------
-- TABLE: pole_deflection_events  (System 1 — High Pole Deflection Alert)
-- Tracks speed-induced pole-tip deflection violations for oversize loads.
-- Physics: deflection ∝ wind_drag ∝ speed². Pole stiffness is load-specific.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pole_deflection_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id      TEXT NOT NULL,                          -- Navixy tracker hash
    vehicle_id      UUID REFERENCES vehicles(id),           -- FK to fleet table
    load_id         UUID,                                   -- FK to active load/lead

    -- Telemetry snapshot
    speed_mph       NUMERIC(5,1) NOT NULL,                  -- Speed at trigger moment
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    heading         SMALLINT,                               -- 0-360 degrees
    wind_speed_mph  NUMERIC(5,1),                           -- Weather API cross-ref (optional)
    wind_direction  SMALLINT,                               -- 0-360 (optional)

    -- Deflection calculation (PEVO-Compliant)
    static_set_height_in NUMERIC(5,1),                      -- Driver input (e.g. 192.0 for 16'0")
    load_actual_height_in NUMERIC(5,1),                     -- Measured load height
    pole_stiffness_factor NUMERIC(8,2) DEFAULT 1.0,         -- Material stiffness
    deflection_in        NUMERIC(6,2) NOT NULL,             -- Calculated deflection
    effective_height_in  NUMERIC(6,2),                      -- static - deflection
    safety_margin_in     NUMERIC(6,2),                      -- effective - load_actual
    compliance_status    TEXT,                              -- 'safe', 'marginal', 'critical'
    threshold_in         NUMERIC(6,2) NOT NULL DEFAULT 3.0,

    -- Alert metadata
    severity        navixy_alert_severity NOT NULL DEFAULT 'warning',
    status          navixy_event_status NOT NULL DEFAULT 'pending',
    alert_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_at   TIMESTAMPTZ,
    vapi_call_sid   TEXT,                                    -- VAPI outbound call SID
    driver_phone    TEXT,                                    -- E.164 format

    -- Timestamps
    event_ts        TIMESTAMPTZ NOT NULL,                   -- When Navixy captured the data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Raw payload for forensics
    raw_payload     JSONB
);

-- Indexes for real-time queries
CREATE INDEX idx_pole_deflection_tracker   ON pole_deflection_events(tracker_id, event_ts DESC);
CREATE INDEX idx_pole_deflection_severity  ON pole_deflection_events(severity, status) WHERE status NOT IN ('resolved', 'false_positive');
CREATE INDEX idx_pole_deflection_vehicle   ON pole_deflection_events(vehicle_id, event_ts DESC);

-- --------------------------------------------------------------------------
-- TABLE: active_trips (High Pole Protocol 2 — Compliance Gate)
-- Tracks trip-specific configuration (pole height, load height, stiffness).
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_trips (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         TEXT NOT NULL,                           -- External Trip ID (e.g. Dispatch system)
    tracker_id      TEXT NOT NULL,
    vehicle_id      UUID REFERENCES vehicles(id),
    load_id         UUID,

    -- Configuration
    load_height_in       NUMERIC(5,1) NOT NULL,            -- Measured height of load
    pole_set_height_in   NUMERIC(5,1) NOT NULL,            -- Height pole is set to
    pole_stiffness_factor NUMERIC(8,2) DEFAULT 1.0,
    
    -- Status
    compliance_locked    BOOLEAN NOT NULL DEFAULT FALSE,   -- True if Pre-Trip Gate passed
    status               TEXT NOT NULL DEFAULT 'active',   -- 'active', 'completed', 'paused'
    
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_active_trips_tracker ON active_trips(tracker_id) WHERE status = 'active';

-- --------------------------------------------------------------------------
-- TABLE: infrastructure_assets (Bridge Engineering — Systems 1, 3, 4)
-- Consolidated registry for Bridges, Railroad Crossings, and Tunnels.
-- Stores structural ratings, geometry, and hazard profiles.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS infrastructure_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type      TEXT NOT NULL,                           -- 'bridge', 'railroad_crossing', 'tunnel'
    asset_ref_id    TEXT NOT NULL,                           -- External ID (NBI, DOT, FRA)
    name            TEXT,
    road_name       TEXT,
    
    -- Location
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    state_code      TEXT NOT NULL,
    
    -- Structural & Geometric Data (JSONB for flexibility across asset types)
    -- Bridges: { weight_rating_code, weight_limit_lbs, vertical_clearance_ft, curb_to_curb_width_ft }
    -- Railroads: { fra_id, hump_grade_percent, is_humped }
    attributes      JSONB NOT NULL DEFAULT '{}'::JSONB,
    
    -- Metadata
    source          TEXT NOT NULL DEFAULT 'user_reported',
    last_verified_at TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(asset_type, asset_ref_id)
);

CREATE INDEX idx_infra_assets_geo ON infrastructure_assets(latitude, longitude);
CREATE INDEX idx_infra_assets_type ON infrastructure_assets(asset_type);

-- --------------------------------------------------------------------------
-- TABLE: vehicle_schematics_data (Bridge Engineering — System 2)
-- Stores axle configurations for automated PDF generation.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_schematics_data (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id      UUID REFERENCES vehicles(id),
    load_id         UUID,                                    -- Optional link to specific load
    
    -- Configuration Name
    config_name     TEXT NOT NULL,                           -- e.g. "13-Axle West Coast Heavy"
    
    -- Axle Data
    axle_count      INTEGER NOT NULL,
    spacings_ft     JSONB NOT NULL,                          -- Array of distances [4.5, 4.5, 9.1, ...]
    weights_lbs     JSONB NOT NULL,                          -- Array of weights [20000, 20000, ...]
    tire_sizes      JSONB,                                   -- Array or single value
    suspension_type TEXT,                                    -- 'air', 'spring', 'walking_beam'
    
    -- Dimensions
    overall_width_ft  NUMERIC(4,2),
    overall_length_ft NUMERIC(5,2),
    kingpin_setting_ft NUMERIC(4,2),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- TABLE: low_bridge_registry (DEPRECATED - Use infrastructure_assets)
-- Keeping for migration safety if needed, but logic should point to infrastructure_assets
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- TABLE: tip_strike_events (High Pole Protocol 3 — Emergency Response)
-- Records "Panic Button" presses and system response instructions.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tip_strike_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id      TEXT NOT NULL,
    vehicle_id      UUID REFERENCES vehicles(id),
    trip_id         UUID REFERENCES active_trips(id),
    
    -- Event Context
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    speed_mph       NUMERIC(5,1),
    heading         SMALLINT,
    
    -- Bridge Context (from HERE Maps / Registry)
    nearest_asset_id UUID REFERENCES infrastructure_assets(id),
    bridge_dist_ft   NUMERIC(10,1),
    is_rampable      BOOLEAN,                                -- Can they take an exit?
    exit_number      TEXT,
    
    -- System Response
    driver_instruction TEXT NOT NULL,                        -- 'TAKE_EXIT' or 'STOP_AND_HOLD'
    response_time_ms   INTEGER,                              -- System processing time
    
    -- Alerting
    vapi_call_sid    TEXT,
    alert_sent       BOOLEAN DEFAULT FALSE,
    
    event_ts         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_payload      JSONB
);


-- --------------------------------------------------------------------------
-- TABLE: evidence_packets  (System 2 — Evidence Vault)
-- Automatically assembles legal-grade evidence packets from harsh events.
-- Captures video, speed logs, GPS breadcrumbs, and packages as PDF.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_packets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id      TEXT NOT NULL,
    vehicle_id      UUID REFERENCES vehicles(id),
    load_id         UUID,

    -- Event trigger
    event_type      TEXT NOT NULL,                          -- 'harsh_brake', 'harsh_accel', 'collision', 'rollover'
    navixy_event_id TEXT,                                   -- Navixy's event identifier

    -- Telemetry snapshot at event
    speed_mph       NUMERIC(5,1),
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    heading         SMALLINT,
    g_force         NUMERIC(4,2),                           -- Peak G-force if available

    -- Evidence artifacts
    video_url       TEXT,                                   -- Navixy dashcam video URL
    video_start_ts  TIMESTAMPTZ,
    video_end_ts    TIMESTAMPTZ,
    speed_log_url   TEXT,                                   -- CSV/JSON speed log download
    gps_trail_url   TEXT,                                   -- GPS breadcrumb trail download
    photos          JSONB DEFAULT '[]'::JSONB,              -- Array of photo URLs

    -- Generated artifacts
    pdf_url         TEXT,                                   -- Final assembled PDF
    pdf_generated   BOOLEAN NOT NULL DEFAULT FALSE,
    pdf_generated_at TIMESTAMPTZ,
    pdf_page_count  SMALLINT,

    -- Delivery
    status          evidence_packet_status NOT NULL DEFAULT 'collecting',
    delivered_to    JSONB DEFAULT '[]'::JSONB,              -- [{email, sent_at, opened_at}]
    
    -- Timestamps
    event_ts        TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Raw payload
    raw_payload     JSONB
);

CREATE INDEX idx_evidence_tracker      ON evidence_packets(tracker_id, event_ts DESC);
CREATE INDEX idx_evidence_status       ON evidence_packets(status) WHERE status NOT IN ('archived');
CREATE INDEX idx_evidence_vehicle      ON evidence_packets(vehicle_id, event_ts DESC);

-- --------------------------------------------------------------------------
-- TABLE: curfew_violations  (System 3 — Curfew Guardian)
-- Tracks geo-position vs. state/jurisdiction oversize curfew rules.
-- Alerts drivers BEFORE they violate, not after.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curfew_violations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id      TEXT NOT NULL,
    vehicle_id      UUID REFERENCES vehicles(id),
    load_id         UUID,

    -- Location
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    jurisdiction_id UUID,                                   -- FK to jurisdictions table
    state_code      TEXT NOT NULL,                          -- e.g. 'TX', 'ON'

    -- Curfew rule matched
    rule_id         UUID,                                   -- FK to jurisdiction_rules
    rule_summary    TEXT NOT NULL,                          -- Human-readable rule description
    curfew_start    TIME NOT NULL,                          -- e.g. '30 min before sunset'
    curfew_end      TIME NOT NULL,                          -- e.g. '30 min after sunrise'
    violation_type  TEXT NOT NULL DEFAULT 'approaching',    -- 'approaching', 'active', 'exiting'

    -- Alert metadata
    minutes_until   SMALLINT,                               -- Minutes until curfew begins
    severity        navixy_alert_severity NOT NULL DEFAULT 'warning',
    status          navixy_event_status NOT NULL DEFAULT 'pending',
    alert_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_at   TIMESTAMPTZ,
    vapi_call_sid   TEXT,
    driver_phone    TEXT,

    -- Timestamps
    event_ts        TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    raw_payload     JSONB
);

CREATE INDEX idx_curfew_tracker    ON curfew_violations(tracker_id, event_ts DESC);
CREATE INDEX idx_curfew_state      ON curfew_violations(state_code, status);
CREATE INDEX idx_curfew_active     ON curfew_violations(status) WHERE status NOT IN ('resolved', 'false_positive');

-- --------------------------------------------------------------------------
-- TABLE: detention_invoices  (System 4 — Detention Billing)
-- Tracks ignition-off dwell time at geofenced locations.
-- Auto-generates invoices when dwell > threshold (default 2 hours).
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detention_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id      TEXT NOT NULL,
    vehicle_id      UUID REFERENCES vehicles(id),
    load_id         UUID,

    -- Geofence context
    geofence_id     TEXT,                                   -- Navixy geofence identifier  
    geofence_name   TEXT,                                   -- e.g. "Client XYZ Jobsite"
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,

    -- Dwell time tracking
    ignition_off_at TIMESTAMPTZ NOT NULL,                   -- When truck went idle
    ignition_on_at  TIMESTAMPTZ,                            -- When truck started again (NULL if still idle)
    dwell_minutes   INTEGER NOT NULL DEFAULT 0,             -- Calculated dwell time
    threshold_min   INTEGER NOT NULL DEFAULT 120,           -- Configurable threshold (default 2hr)
    billable_min    INTEGER NOT NULL DEFAULT 0,             -- dwell_minutes - threshold_min

    -- Billing
    hourly_rate     NUMERIC(10,2) NOT NULL DEFAULT 85.00,   -- Default detention rate
    total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,    -- billable_min / 60 * hourly_rate
    currency_code   TEXT NOT NULL DEFAULT 'USD',

    -- External integrations
    ghl_invoice_id  TEXT,                                   -- GoHighLevel invoice ID
    stripe_invoice_id TEXT,                                 -- Stripe invoice ID
    client_id       UUID,                                   -- FK to companies/contacts

    -- Status
    status          detention_invoice_status NOT NULL DEFAULT 'accruing',
    approved_by     UUID,                                   -- User who approved the invoice
    approved_at     TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    raw_payload     JSONB
);

CREATE INDEX idx_detention_tracker     ON detention_invoices(tracker_id, created_at DESC);
CREATE INDEX idx_detention_status      ON detention_invoices(status) WHERE status IN ('accruing', 'pending_approval');
CREATE INDEX idx_detention_client      ON detention_invoices(client_id, status);
CREATE INDEX idx_detention_accruing    ON detention_invoices(status, ignition_off_at) WHERE status = 'accruing';

-- --------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- --------------------------------------------------------------------------
ALTER TABLE pole_deflection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_packets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE curfew_violations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE detention_invoices     ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Functions) can do everything
CREATE POLICY "service_role_full_access" ON pole_deflection_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON evidence_packets       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON curfew_violations      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON detention_invoices     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON active_trips           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON infrastructure_assets    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON vehicle_schematics_data  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON low_bridge_registry      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access" ON tip_strike_events      FOR ALL USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- UPDATED_AT TRIGGER (reusable)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pole_deflection_updated_at BEFORE UPDATE ON pole_deflection_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_evidence_updated_at BEFORE UPDATE ON evidence_packets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_curfew_updated_at BEFORE UPDATE ON curfew_violations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_detention_updated_at BEFORE UPDATE ON detention_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_active_trips_updated_at BEFORE UPDATE ON active_trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_infra_assets_updated_at BEFORE UPDATE ON infrastructure_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vehicle_schematics_updated_at BEFORE UPDATE ON vehicle_schematics_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER trg_low_bridge_updated_at BEFORE UPDATE ON low_bridge_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF NAVIXY INTELLIGENCE LAYER — WAVE 1 SCHEMA
-- ============================================================================
