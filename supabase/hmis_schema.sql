-- =====================================================
-- HAUL COMMAND MILEAGE INTELLIGENCE SYSTEM (HMIS)
-- Escort Revenue Protection System
-- =====================================================
-- 
-- PURPOSE: Protect escort revenue through intelligent mileage tracking
-- - Prevent revenue leakage (unbilled deadhead/reposition miles)
-- - Automate tax deduction tracking (IRS compliance)
-- - Generate broker dispute files (professional resolution)
-- - Capture Tier 2-3 data intelligence (behavioral + economic)
--
-- ARCHITECTURE: hmis_architecture.md
-- INTEGRATION: Feeds hall_score, movement_event_log, corridor_pricing_index
-- =====================================================

-- =====================================================
-- I. CORE TRIP INTELLIGENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS hmis_trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id TEXT NOT NULL, -- Links to hall_score table
    
    -- Job Metadata
    job_id TEXT, -- Links to movement_records if dispatch job
    broker_name TEXT,
    route_origin TEXT NOT NULL,
    route_destination TEXT NOT NULL,
    trip_date DATE NOT NULL,
    trip_purpose TEXT DEFAULT 'escort_service', -- escort_service, deadhead, reposition, pre_run
    
    -- INPUT LAYER (4 Sources)
    permit_miles NUMERIC(8,2), -- Official permit route mileage
    gps_planned_miles NUMERIC(8,2), -- Garmin/InRoute/HERE pre-planned route
    odometer_start INT, -- Starting odometer reading
    odometer_end INT, -- Ending odometer reading
    auto_tracked_miles NUMERIC(8,2), -- GPS breadcrumb auto-capture (Everlance/custom)
    
    -- OUTPUT LAYER (5 Intelligence Reports)
    billing_miles NUMERIC(8,2) NOT NULL, -- What broker owes
    actual_driven_miles NUMERIC(8,2) NOT NULL, -- Ground truth (odometer or GPS)
    deductible_miles NUMERIC(8,2) NOT NULL, -- IRS-eligible business miles
    extra_unbilled_miles NUMERIC(8,2) DEFAULT 0.00, -- Revenue leak
    variance_percentage NUMERIC(5,2) DEFAULT 0.00, -- (actual - permit) / permit * 100
    
    -- Mile Type Breakdown
    deadhead_miles NUMERIC(8,2) DEFAULT 0.00, -- Unpaid miles from home to pickup
    reposition_miles NUMERIC(8,2) DEFAULT 0.00, -- Unpaid miles from dropoff to home
    pre_run_miles NUMERIC(8,2) DEFAULT 0.00, -- Pre-trip route survey miles
    
    -- Revenue Intelligence
    billing_rate_per_mile NUMERIC(6,2), -- Rate charged to broker
    revenue_leak_amount NUMERIC(10,2) GENERATED ALWAYS AS (
        extra_unbilled_miles * COALESCE(billing_rate_per_mile, 0)
    ) STORED,
    
    -- GPS Data (for permit overlay + dispute files)
    gps_breadcrumb_json JSONB, -- [{lat, lng, timestamp}, ...]
    permit_route_json JSONB, -- Permit-designated route coordinates
    
    -- Report Generation Status
    broker_invoice_generated BOOLEAN DEFAULT FALSE,
    irs_tax_log_generated BOOLEAN DEFAULT FALSE,
    dispute_file_generated BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT hmis_trips_valid_miles CHECK (
        billing_miles >= 0 
        AND actual_driven_miles >= 0
        AND deductible_miles >= actual_driven_miles -- Can't deduct more than driven
    )
);

CREATE INDEX idx_hmis_trips_hall_id ON hmis_trips(hall_id);
CREATE INDEX idx_hmis_trips_job_id ON hmis_trips(job_id);
CREATE INDEX idx_hmis_trips_date ON hmis_trips(trip_date);
CREATE INDEX idx_hmis_trips_broker ON hmis_trips(broker_name);
CREATE INDEX idx_hmis_trips_variance ON hmis_trips(variance_percentage);

COMMENT ON TABLE hmis_trips IS 'Core mileage intelligence: 4 input layers (permit, GPS planned, odometer, auto-tracking) → 5 output reports (billing, actual, deductible, unbilled, variance). Protects escort revenue and captures Tier 2-3 data.';

-- =====================================================
-- II. MILEAGE VARIANCE INTELLIGENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS hmis_mileage_variance (
    variance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES hmis_trips(trip_id) ON DELETE CASCADE,
    
    -- Variance Detection
    variance_type TEXT NOT NULL, -- 'permit_vs_actual', 'planned_vs_actual', 'odometer_vs_gps'
    variance_miles NUMERIC(8,2) NOT NULL,
    variance_percentage NUMERIC(5,2) NOT NULL,
    
    -- Variance Classification
    variance_category TEXT NOT NULL, -- 'normal', 'moderate', 'severe', 'dispute_worthy'
    variance_reason TEXT, -- 'detour', 'construction', 'weather', 'broker_routing_error', 'unknown'
    
    -- Revenue Impact
    unbilled_revenue_impact NUMERIC(10,2), -- Lost revenue from variance
    
    -- Alert Status
    alert_triggered BOOLEAN DEFAULT FALSE,
    alert_type TEXT, -- 'revenue_leak', 'deadhead_detected', 'severe_variance'
    
    -- Metadata
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT variance_valid_type CHECK (
        variance_type IN ('permit_vs_actual', 'planned_vs_actual', 'odometer_vs_gps')
    ),
    CONSTRAINT variance_valid_category CHECK (
        variance_category IN ('normal', 'moderate', 'severe', 'dispute_worthy')
    )
);

CREATE INDEX idx_variance_trip ON hmis_mileage_variance(trip_id);
CREATE INDEX idx_variance_type ON hmis_mileage_variance(variance_type);
CREATE INDEX idx_variance_category ON hmis_mileage_variance(variance_category);
CREATE INDEX idx_variance_alert ON hmis_mileage_variance(alert_triggered);

COMMENT ON TABLE hmis_mileage_variance IS 'Variance intelligence: Automatically detect and classify mileage discrepancies. Trigger revenue leak alerts. Feed HallScore for broker payment behavior and escort logging accuracy.';

-- =====================================================
-- III. REPORT GENERATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS hmis_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES hmis_trips(trip_id) ON DELETE CASCADE,
    
    -- Report Type
    report_type TEXT NOT NULL, -- 'broker_invoice', 'irs_tax_log', 'dispute_file', 'dot_compliance'
    
    -- Report Data
    report_pdf_url TEXT, -- S3/storage URL
    report_json JSONB, -- Structured report data
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    downloaded_at TIMESTAMPTZ,
    
    CONSTRAINT report_valid_type CHECK (
        report_type IN ('broker_invoice', 'irs_tax_log', 'dispute_file', 'dot_compliance')
    )
);

CREATE INDEX idx_reports_trip ON hmis_reports(trip_id);
CREATE INDEX idx_reports_type ON hmis_reports(report_type);
CREATE INDEX idx_reports_generated ON hmis_reports(generated_at);

COMMENT ON TABLE hmis_reports IS 'Report generation tracking: Broker invoices, IRS tax logs, dispute files, DOT compliance reports. PDFs stored for audit trail.';

-- =====================================================
-- IV. SUBSCRIPTION & MONETIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS hmis_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id TEXT UNIQUE NOT NULL,
    
    -- Tier System
    subscription_tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'fleet'
    
    -- Tier Limits
    monthly_job_limit INT, -- NULL = unlimited
    jobs_used_this_month INT DEFAULT 0,
    
    -- Feature Access
    irs_export_enabled BOOLEAN DEFAULT FALSE,
    dispute_file_enabled BOOLEAN DEFAULT FALSE,
    fleet_mode_enabled BOOLEAN DEFAULT FALSE,
    api_access_enabled BOOLEAN DEFAULT FALSE,
    white_label_reports_enabled BOOLEAN DEFAULT FALSE,
    
    -- Billing
    monthly_price NUMERIC(8,2), -- $0, $29, $79
    stripe_subscription_id TEXT,
    billing_status TEXT DEFAULT 'active', -- 'active', 'past_due', 'cancelled'
    
    -- Metadata
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    
    CONSTRAINT subscription_valid_tier CHECK (
        subscription_tier IN ('free', 'pro', 'fleet')
    ),
    CONSTRAINT subscription_valid_billing CHECK (
        billing_status IN ('active', 'past_due', 'cancelled')
    )
);

CREATE INDEX idx_subscriptions_hall_id ON hmis_subscriptions(hall_id);
CREATE INDEX idx_subscriptions_tier ON hmis_subscriptions(subscription_tier);
CREATE INDEX idx_subscriptions_billing ON hmis_subscriptions(billing_status);

COMMENT ON TABLE hmis_subscriptions IS 'Monetization layer: Free (3 jobs/mo), Pro $29 (unlimited + IRS export), Fleet $79 (multi-escort + white-label). Feeds MRR and user segmentation for upsells.';

-- =====================================================
-- V. DATA INTELLIGENCE FEEDS (TIER 2-3)
-- =====================================================

-- Function: Auto-populate movement_event_log with HMIS intelligence
CREATE OR REPLACE FUNCTION hmis_capture_tier2_intelligence()
RETURNS TRIGGER AS $$
BEGIN
    -- Capture Tier 2: Behavioral + Risk Data
    IF NEW.variance_percentage > 10.0 THEN
        INSERT INTO movement_event_log (
            movement_record_id,
            data_tier,
            behavioral_data,
            event_type
        ) VALUES (
            (SELECT movement_record_id FROM movement_records WHERE ghl_opportunity_id = NEW.job_id LIMIT 1),
            2, -- Tier 2
            jsonb_build_object(
                'broker_name', NEW.broker_name,
                'variance_percentage', NEW.variance_percentage,
                'extra_unbilled_miles', NEW.extra_unbilled_miles,
                'revenue_leak_amount', NEW.revenue_leak_amount,
                'route_origin', NEW.route_origin,
                'route_destination', NEW.route_destination
            ),
            'mileage_variance_detected'
        );
    END IF;
    
    -- Capture Tier 3: Financial + Economic Intelligence
    IF NEW.billing_rate_per_mile IS NOT NULL THEN
        INSERT INTO movement_event_log (
            movement_record_id,
            data_tier,
            economic_data,
            event_type
        ) VALUES (
            (SELECT movement_record_id FROM movement_records WHERE ghl_opportunity_id = NEW.job_id LIMIT 1),
            3, -- Tier 3
            jsonb_build_object(
                'corridor', NEW.route_origin || ' → ' || NEW.route_destination,
                'billing_rate_per_mile', NEW.billing_rate_per_mile,
                'actual_driven_miles', NEW.actual_driven_miles,
                'deadhead_miles', NEW.deadhead_miles,
                'reposition_miles', NEW.reposition_miles,
                'total_cost_corridor', NEW.actual_driven_miles * NEW.billing_rate_per_mile
            ),
            'true_corridor_cost_captured'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hmis_tier2_tier3_capture
    AFTER INSERT OR UPDATE ON hmis_trips
    FOR EACH ROW
    EXECUTE FUNCTION hmis_capture_tier2_intelligence();

COMMENT ON FUNCTION hmis_capture_tier2_intelligence IS 'Auto-capture Tier 2 (broker variance patterns) and Tier 3 (true corridor costs) from HMIS data into movement_event_log for Heavy Haul Economic Index.';

-- =====================================================
-- VI. HALLSCORE INTEGRATION
-- =====================================================

-- Function: Update HallScore based on HMIS logging accuracy
CREATE OR REPLACE FUNCTION hmis_update_hall_score()
RETURNS TRIGGER AS $$
DECLARE
    total_trips INT;
    accurate_trips INT;
    logging_accuracy NUMERIC(5,2);
BEGIN
    -- Calculate logging accuracy for escorts
    SELECT COUNT(*) INTO total_trips
    FROM hmis_trips
    WHERE hall_id = NEW.hall_id;
    
    SELECT COUNT(*) INTO accurate_trips
    FROM hmis_trips
    WHERE hall_id = NEW.hall_id
    AND ABS(variance_percentage) <= 5.0; -- Within 5% = accurate
    
    IF total_trips > 0 THEN
        logging_accuracy := (accurate_trips::NUMERIC / total_trips::NUMERIC) * 100.0;
        
        -- Update HallScore compliance accuracy
        UPDATE hall_score
        SET escort_compliance_accuracy = logging_accuracy,
            last_updated = NOW()
        WHERE hall_id = NEW.hall_id
        AND entity_type = 'escort';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hmis_hall_score_update
    AFTER INSERT ON hmis_trips
    FOR EACH ROW
    EXECUTE FUNCTION hmis_update_hall_score();

COMMENT ON FUNCTION hmis_update_hall_score IS 'Update HallScore based on HMIS logging accuracy. Escorts with variance ≤5% get compliance accuracy boost. Feeds credit scoring system.';

-- =====================================================
-- VII. ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE hmis_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hmis_mileage_variance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hmis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hmis_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY admin_all_hmis_trips ON hmis_trips FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_hmis_variance ON hmis_mileage_variance FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_hmis_reports ON hmis_reports FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_all_hmis_subscriptions ON hmis_subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Escorts can only see their own trips
CREATE POLICY escort_own_trips ON hmis_trips FOR ALL USING (
    hall_id = auth.jwt() ->> 'hall_id'
);

CREATE POLICY escort_own_reports ON hmis_reports FOR ALL USING (
    trip_id IN (SELECT trip_id FROM hmis_trips WHERE hall_id = auth.jwt() ->> 'hall_id')
);

-- =====================================================
-- VIII. INITIAL SEED DATA (Tier Definitions)
-- =====================================================

-- Note: User subscriptions created on signup via application logic
-- Tier pricing reference:
-- free: $0, 3 jobs/month, basic variance report
-- pro: $29/month, unlimited jobs, IRS export, dispute files
-- fleet: $79/month, multi-escort, white-label, API access

-- =====================================================
-- END OF HMIS SCHEMA
-- =====================================================
