-- Sprint A: Genuinely missing tables (verified against 1,933 existing tables)
-- Tables that exist under variant names are NOT recreated.

-- 1. Role catalog
CREATE TABLE IF NOT EXISTS hc_role_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    role_family TEXT DEFAULT 'operator',
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 100,
    country_scope TEXT[] DEFAULT '{ALL}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Intent catalog
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

-- 3. Push subscriptions
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

-- 4. Stripe events audit trail
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

-- 5. Training courses
CREATE TABLE IF NOT EXISTS training_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'beginner',
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

-- 6. Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    query JSONB NOT NULL DEFAULT '{}',
    alert_enabled BOOLEAN DEFAULT false,
    alert_frequency TEXT DEFAULT 'daily',
    last_alerted_at TIMESTAMPTZ,
    result_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE hc_role_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_intent_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_training_courses_slug ON training_courses(slug);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON hc_push_subscriptions(user_id);

-- RLS Policies
DO $$
BEGIN
    -- Public reads on reference tables
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_role_catalog' AND policyname='public_read_roles') THEN
        CREATE POLICY public_read_roles ON hc_role_catalog FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_intent_catalog' AND policyname='public_read_intents') THEN
        CREATE POLICY public_read_intents ON hc_intent_catalog FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_courses' AND policyname='public_read_courses') THEN
        CREATE POLICY public_read_courses ON training_courses FOR SELECT USING (is_published = true);
    END IF;
    
    -- User-owns-their-data policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_push_subscriptions' AND policyname='own_push_subs') THEN
        CREATE POLICY own_push_subs ON hc_push_subscriptions FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_searches' AND policyname='own_saved_searches') THEN
        CREATE POLICY own_saved_searches ON saved_searches FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- Service-role only for stripe events
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stripe_events' AND policyname='service_stripe_events') THEN
        CREATE POLICY service_stripe_events ON stripe_events FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

SELECT 'Sprint A: 6 tables + RLS + indexes deployed' AS result;
