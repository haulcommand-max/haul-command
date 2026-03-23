-- Sprint 1: Rapid RLS Hardening for recent Revenue & Intelligence tables
-- Enforces structured read/write access and ensures no money is left on the table
-- from data scraping or unauthorized edits.

-- 1. Enable RLS on Revenue Tables
ALTER TABLE IF EXISTS ad_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS corridor_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS adgrid_campaigns ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on Routing & Infrastructure
ALTER TABLE IF EXISTS state_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS route_intelligence_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS escort_booking_holds ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on Standing Orders & Events
ALTER TABLE IF EXISTS recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS escort_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_prefunding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS route_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS motive_fuel_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS motive_vehicle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hc_events ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════
-- Policies: Revenue features (Read freely, Write restricted)
-- ══════════════════════════════════════════════════════════

-- Ad Boosts: Everyone can see active boosts, only system/stripe edits
CREATE POLICY "Public Read Ad Boosts" ON ad_boosts
    FOR SELECT USING (status = 'active');
CREATE POLICY "System Edit Ad Boosts" ON ad_boosts
    FOR ALL USING (current_user = 'postgres');

-- Corridor Sponsors
CREATE POLICY "Public Read Sponsors" ON corridor_sponsors
    FOR SELECT USING (status = 'active');
CREATE POLICY "System Edit Sponsors" ON corridor_sponsors
    FOR ALL USING (current_user = 'postgres');

-- AdGrid Campaigns
CREATE POLICY "Public Read Campaigns" ON adgrid_campaigns
    FOR SELECT USING (status = 'active');
CREATE POLICY "System Edit Campaigns" ON adgrid_campaigns
    FOR ALL USING (current_user = 'postgres');

-- ══════════════════════════════════════════════════════════
-- Policies: Routing & Infrastructure
-- ══════════════════════════════════════════════════════════

-- State Regulations: Public read, System write
CREATE POLICY "Public Read Regulations" ON state_regulations
    FOR SELECT USING (true);
CREATE POLICY "System Edit Regulations" ON state_regulations
    FOR ALL USING (current_user = 'postgres');

-- Checkpoints: Authenticated read
CREATE POLICY "Auth Read Checkpoints" ON route_intelligence_checkpoints
    FOR SELECT USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════
-- Policies: Telematics & Fuel Data
-- ══════════════════════════════════════════════════════════

-- Telematics are highly sensitive, auth.uid() based reads or system.
CREATE POLICY "Restrict Motive Positions Read" ON motive_vehicle_positions
    FOR SELECT USING (current_user = 'postgres'); -- Restricted to backend jobs unless explicitly matched to auth ID

CREATE POLICY "Public Aggregate Fuel Reads" ON motive_fuel_observations
    FOR SELECT USING (true); -- Useful for public estimator tools

-- ══════════════════════════════════════════════════════════
-- Analytics
-- ══════════════════════════════════════════════════════════
CREATE POLICY "System Write Events" ON hc_events
    FOR ALL USING (current_user = 'postgres');
