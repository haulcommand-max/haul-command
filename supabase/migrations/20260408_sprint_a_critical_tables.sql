-- ================================================================
-- Sprint A: Critical Missing Tables — Consolidated Migration
-- Haul Command Crown Jewel Foundation
-- 2026-04-08
-- ================================================================

-- 1. hc_countries — 120-country engine
CREATE TABLE IF NOT EXISTS hc_countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,          -- ISO 3166-1 alpha-2
    code_alpha3 TEXT,                    -- ISO 3166-1 alpha-3 
    name TEXT NOT NULL,
    native_name TEXT,
    region TEXT,                         -- continent/macro-region
    subregion TEXT,
    currency_code TEXT DEFAULT 'USD',
    phone_prefix TEXT,
    capital TEXT,
    languages TEXT[] DEFAULT '{}',
    market_status TEXT DEFAULT 'planned' CHECK (market_status IN ('live','expanding','planned','restricted')),
    market_maturity_score NUMERIC(3,1) DEFAULT 0,
    has_escort_requirements BOOLEAN DEFAULT false,
    has_pilot_car_laws BOOLEAN DEFAULT false,
    heavy_haul_active BOOLEAN DEFAULT false,
    timezone TEXT,
    flag_emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_countries_code ON hc_countries(code);
CREATE INDEX IF NOT EXISTS idx_hc_countries_market_status ON hc_countries(market_status);

-- 2. hc_country_config — per-country settings
CREATE TABLE IF NOT EXISTS hc_country_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code TEXT NOT NULL REFERENCES hc_countries(code) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (country_code, config_key)
);

-- 3. hc_role_catalog — canonical role taxonomy
CREATE TABLE IF NOT EXISTS hc_role_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    role_family TEXT DEFAULT 'operator' CHECK (role_family IN ('operator','broker','dispatcher','carrier','shipper','authority','vendor','other')),
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 100,
    country_scope TEXT[] DEFAULT '{ALL}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. hc_intent_catalog — intent taxonomy for routing
CREATE TABLE IF NOT EXISTS hc_intent_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    intent_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    applicable_roles TEXT[] DEFAULT '{ALL}',
    priority INT DEFAULT 50,
    route_target TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. hc_operators — core operator entity
CREATE TABLE IF NOT EXISTS hc_operators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    surface_id UUID,
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    website TEXT,
    country_code TEXT DEFAULT 'US',
    state TEXT,
    city TEXT,
    zip TEXT,
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    service_radius_miles INT DEFAULT 200,
    is_verified BOOLEAN DEFAULT false,
    is_claimed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    trust_score NUMERIC(4,2) DEFAULT 0,
    profile_completeness INT DEFAULT 0,
    specialties TEXT[] DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    insurance_verified BOOLEAN DEFAULT false,
    insurance_expiry DATE,
    operating_authority TEXT,
    mc_number TEXT,
    dot_number TEXT,
    years_experience INT,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free','basic','pro','elite')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_operators_user_id ON hc_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_operators_country_code ON hc_operators(country_code);
CREATE INDEX IF NOT EXISTS idx_hc_operators_state ON hc_operators(state);
CREATE INDEX IF NOT EXISTS idx_hc_operators_slug ON hc_operators(slug);
CREATE INDEX IF NOT EXISTS idx_hc_operators_plan ON hc_operators(plan);

-- 6. hc_ad_slots — AdGrid inventory
CREATE TABLE IF NOT EXISTS hc_ad_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_key TEXT NOT NULL,
    slot_type TEXT NOT NULL CHECK (slot_type IN ('banner','sidebar','inline','hero','card','map_pin','leaderboard','sponsor_badge')),
    page_family TEXT NOT NULL,
    geo_scope TEXT DEFAULT 'global',
    country_code TEXT,
    state TEXT,
    city TEXT,
    corridor_id UUID,
    max_sponsors INT DEFAULT 1,
    current_sponsors INT DEFAULT 0,
    base_price_cents INT DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    display_priority INT DEFAULT 100,
    dimensions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (slot_key, page_family, geo_scope)
);

CREATE INDEX IF NOT EXISTS idx_hc_ad_slots_page_family ON hc_ad_slots(page_family);
CREATE INDEX IF NOT EXISTS idx_hc_ad_slots_available ON hc_ad_slots(is_available);

-- 7. hc_notifications — notification events
CREATE TABLE IF NOT EXISTS hc_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    channel TEXT DEFAULT 'push' CHECK (channel IN ('push','email','sms','in_app')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_notifications_user_id ON hc_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_notifications_status ON hc_notifications(status);
CREATE INDEX IF NOT EXISTS idx_hc_notifications_type ON hc_notifications(type);

-- 8. hc_push_subscriptions — web push subscriptions
CREATE TABLE IF NOT EXISTS hc_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_hc_push_subs_user ON hc_push_subscriptions(user_id);

-- 9. stripe_events — payment audit trail
CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    livemode BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- 10. hc_escrow_holds — money path
CREATE TABLE IF NOT EXISTS hc_escrow_holds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID,
    payer_user_id UUID REFERENCES auth.users(id),
    payee_user_id UUID REFERENCES auth.users(id),
    amount_cents INT NOT NULL,
    currency TEXT DEFAULT 'usd',
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'held' CHECK (status IN ('held','released','refunded','disputed','expired')),
    hold_until TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_escrow_job ON hc_escrow_holds(job_id);
CREATE INDEX IF NOT EXISTS idx_hc_escrow_status ON hc_escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_hc_escrow_payer ON hc_escrow_holds(payer_user_id);

-- 11. hc_listing_shells — claim engine
CREATE TABLE IF NOT EXISTS hc_listing_shells (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    surface_id UUID,
    entity_id UUID,
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    website TEXT,
    country_code TEXT DEFAULT 'US',
    state TEXT,
    city TEXT,
    address TEXT,
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    category TEXT DEFAULT 'escort_operator',
    source TEXT DEFAULT 'crawl',
    is_claimed BOOLEAN DEFAULT false,
    claimed_by UUID REFERENCES auth.users(id),
    claimed_at TIMESTAMPTZ,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_listing_shells_slug ON hc_listing_shells(slug);
CREATE INDEX IF NOT EXISTS idx_hc_listing_shells_claimed ON hc_listing_shells(is_claimed);
CREATE INDEX IF NOT EXISTS idx_hc_listing_shells_country ON hc_listing_shells(country_code);

-- 12. training_courses — training engine
CREATE TABLE IF NOT EXISTS training_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
    duration_hours NUMERIC(4,1) DEFAULT 8,
    price_cents INT DEFAULT 0,
    currency TEXT DEFAULT 'usd',
    is_free BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    country_scope TEXT[] DEFAULT '{ALL}',
    prerequisites TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    sort_order INT DEFAULT 100,
    enrollment_count INT DEFAULT 0,
    completion_count INT DEFAULT 0,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_courses_slug ON training_courses(slug);
CREATE INDEX IF NOT EXISTS idx_training_courses_category ON training_courses(category);

-- 13. hc_leaderboard_periods — leaderboard engine
CREATE TABLE IF NOT EXISTS hc_leaderboard_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_key TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily','weekly','monthly','quarterly','yearly','all_time')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    country_code TEXT DEFAULT 'ALL',
    state TEXT,
    is_finalized BOOLEAN DEFAULT false,
    entries JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (board_key, period_type, period_start, country_code)
);

-- 14. saved_searches — retention loop
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    query JSONB NOT NULL DEFAULT '{}',
    alert_enabled BOOLEAN DEFAULT false,
    alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant','hourly','daily','weekly')),
    last_alerted_at TIMESTAMPTZ,
    result_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alert ON saved_searches(alert_enabled);

-- 15. ad_placements — AdGrid placements (active ads)
CREATE TABLE IF NOT EXISTS ad_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID,
    slot_id UUID REFERENCES hc_ad_slots(id),
    advertiser_user_id UUID REFERENCES auth.users(id),
    creative_url TEXT,
    creative_html TEXT,
    target_url TEXT,
    country_code TEXT,
    geo_key TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft','pending_review','active','paused','expired','rejected')),
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    ctr NUMERIC(5,4) DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    daily_budget_cents INT,
    total_spend_cents INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_status ON ad_placements(status);
CREATE INDEX IF NOT EXISTS idx_ad_placements_slot ON ad_placements(slot_id);

-- ================================================================
-- RLS Policies for critical tables 
-- ================================================================

-- Enable RLS on all new tables
ALTER TABLE hc_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_country_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_role_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_intent_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_listing_shells ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_leaderboard_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY "public_read_countries" ON hc_countries FOR SELECT USING (true);
CREATE POLICY "public_read_roles" ON hc_role_catalog FOR SELECT USING (true);
CREATE POLICY "public_read_intents" ON hc_intent_catalog FOR SELECT USING (true);
CREATE POLICY "public_read_courses" ON training_courses FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_ad_slots" ON hc_ad_slots FOR SELECT USING (true);
CREATE POLICY "public_read_leaderboards" ON hc_leaderboard_periods FOR SELECT USING (true);
CREATE POLICY "public_read_listings" ON hc_listing_shells FOR SELECT USING (true);
CREATE POLICY "public_read_operators" ON hc_operators FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_country_config" ON hc_country_config FOR SELECT USING (true);

-- User-specific access
CREATE POLICY "own_notifications" ON hc_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_push_subs" ON hc_push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_saved_searches" ON saved_searches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_operator_profile" ON hc_operators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_escrow_view" ON hc_escrow_holds FOR SELECT USING (auth.uid() = payer_user_id OR auth.uid() = payee_user_id);

-- Service-role only for admin tables
CREATE POLICY "service_stripe_events" ON stripe_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_placements" ON ad_placements FOR ALL USING (auth.role() = 'service_role' OR auth.uid() = advertiser_user_id);

-- ================================================================
-- Done
-- ================================================================
SELECT 'Sprint A migration complete — 15 tables created with RLS' AS result;
