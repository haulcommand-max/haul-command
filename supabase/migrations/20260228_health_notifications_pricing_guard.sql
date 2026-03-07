-- Migration: Marketplace Health Monitor snapshots + Notification Intelligence tables

-- ============================================================
-- 1. MARKETPLACE HEALTH SNAPSHOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_health_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL CHECK (entity_type IN ('country', 'corridor', 'metro')),
    entity_id text NOT NULL,
    country_code text NOT NULL,
    display_name text NOT NULL,
    supply_count_7d integer DEFAULT 0,
    supply_trend_7d numeric(6,1) DEFAULT 0,
    demand_count_7d integer DEFAULT 0,
    demand_trend_7d numeric(6,1) DEFAULT 0,
    fill_rate numeric(5,3) DEFAULT 0,
    median_time_to_fill_hours numeric(6,1) DEFAULT 0,
    liquidity_status text CHECK (liquidity_status IN ('undersupplied', 'balanced', 'oversupplied')),
    health_level text CHECK (health_level IN ('healthy', 'warning', 'critical', 'dead')),
    risk_flags jsonb DEFAULT '[]',
    expansion_signals jsonb DEFAULT '[]',
    snapshot_data jsonb DEFAULT '{}',
    snapshot_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mhs_entity ON public.marketplace_health_snapshots(entity_type, entity_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_mhs_country ON public.marketplace_health_snapshots(country_code, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_mhs_health ON public.marketplace_health_snapshots(health_level, snapshot_at DESC);

-- ============================================================
-- 2. NOTIFICATION PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'operator',
    timezone text DEFAULT 'UTC',
    country_code text DEFAULT 'US',
    quiet_hours_start integer DEFAULT 21,
    quiet_hours_end integer DEFAULT 7,
    corridor_preferences text[] DEFAULT '{}',
    channel_preferences jsonb DEFAULT '{"push": true, "email": true, "in_app": true, "sms": false}',
    engagement_score integer DEFAULT 50,
    fatigue_index numeric(3,2) DEFAULT 0,
    last_active_at timestamptz DEFAULT now(),
    opt_out_types text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notification_profiles(user_id);

-- ============================================================
-- 3. NOTIFICATION LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    notification_type text NOT NULL,
    title text,
    body text,
    channel text NOT NULL,
    priority text NOT NULL,
    score numeric(4,2) DEFAULT 0,
    sent_at timestamptz DEFAULT now(),
    opened_at timestamptz,
    dismissed_at timestamptz,
    actioned_at timestamptz,
    batch_group text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nlog_user ON public.notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nlog_type ON public.notification_log(notification_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nlog_channel ON public.notification_log(channel, created_at DESC);

-- ============================================================
-- 4. PRICING SANITY AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pricing_sanity_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type text NOT NULL,
    country_code text NOT NULL,
    original_price numeric(10,2),
    safe_price numeric(10,2),
    safe_price_usd numeric(10,2),
    currency text,
    adjustment_made boolean DEFAULT false,
    adjustment_reason text,
    risk_flag_type text,
    risk_flag_severity text,
    margin_estimate_pct numeric(5,3),
    guards_passed integer DEFAULT 0,
    guards_failed integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_psa_country ON public.pricing_sanity_audit(country_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_psa_risk ON public.pricing_sanity_audit(risk_flag_type, created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.marketplace_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_sanity_audit ENABLE ROW LEVEL SECURITY;

-- Health snapshots: read by all authenticated, write by service
CREATE POLICY "read_health_snapshots" ON public.marketplace_health_snapshots FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "write_health_snapshots" ON public.marketplace_health_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Notification profiles: own data + service
CREATE POLICY "own_notif_profile" ON public.notification_profiles FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Notification log: own data + service
CREATE POLICY "own_notif_log" ON public.notification_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "service_notif_log" ON public.notification_log FOR ALL USING (auth.role() = 'service_role');

-- Pricing audit: service only
CREATE POLICY "service_pricing_audit" ON public.pricing_sanity_audit FOR ALL USING (auth.role() = 'service_role');
