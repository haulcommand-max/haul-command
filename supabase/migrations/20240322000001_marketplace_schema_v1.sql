-- ══════════════════════════════════════════
-- MARKETPLACE CORE SCHEMA v1
-- Implements the core transactional engine: profiles, loads, matching, and events.
-- ══════════════════════════════════════════

-- 1. Base Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    role TEXT NOT NULL DEFAULT 'driver', -- driver | broker | admin
    display_name TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    home_city TEXT,
    home_state TEXT,
    home_country TEXT DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Driver Specifics
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    verified_score INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    insurance_on_file BOOLEAN DEFAULT false,
    twic_on_file BOOLEAN DEFAULT false,
    equipment_tags JSONB DEFAULT '[]'::jsonb,
    service_radius_miles INTEGER DEFAULT 120,
    base_lat NUMERIC,
    base_lng NUMERIC,
    availability_status TEXT DEFAULT 'available', -- available|busy|offline
    response_time_minutes_est INTEGER DEFAULT 30,
    jobs_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Broker Specifics
CREATE TABLE IF NOT EXISTS public.broker_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    mc_or_dot TEXT,
    reputation_score INTEGER DEFAULT 50,
    payment_velocity_score INTEGER DEFAULT 50,
    verified_business BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Loads (The Board)
CREATE TABLE IF NOT EXISTS public.loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    origin_text TEXT NOT NULL,
    origin_lat NUMERIC NOT NULL,
    origin_lng NUMERIC NOT NULL,
    dest_text TEXT NOT NULL,
    dest_lat NUMERIC NOT NULL,
    dest_lng NUMERIC NOT NULL,
    route_polyline TEXT,
    distance_miles NUMERIC,
    states_crossed JSONB DEFAULT '[]'::jsonb,
    load_date DATE NOT NULL,
    load_time_window TEXT,
    width_ft NUMERIC,
    height_ft NUMERIC,
    length_ft NUMERIC,
    weight_lbs NUMERIC,
    escort_front_required BOOLEAN DEFAULT false,
    escort_rear_required BOOLEAN DEFAULT false,
    height_pole_required BOOLEAN DEFAULT false,
    police_escort_risk TEXT DEFAULT 'unknown', -- low|medium|high|unknown
    rate_offer NUMERIC,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'open', -- open|filled|expired|cancelled
    fill_probability NUMERIC DEFAULT 0.0,
    demand_score NUMERIC DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for spatial/time queries on loads
CREATE INDEX IF NOT EXISTS idx_loads_origin ON public.loads(origin_lat, origin_lng);
CREATE INDEX IF NOT EXISTS idx_loads_dest ON public.loads(dest_lat, dest_lng);
CREATE INDEX IF NOT EXISTS idx_loads_status_date ON public.loads(status, load_date);

-- 5. Load Visibility Zones (Liquidity Bleed)
CREATE TABLE IF NOT EXISTS public.load_visibility_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    primary_radius_miles INTEGER DEFAULT 50,
    secondary_radius_miles INTEGER DEFAULT 120,
    tertiary_radius_miles INTEGER DEFAULT 250,
    min_drivers_target INTEGER DEFAULT 3,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Load Matches (The transactional loop)
CREATE TABLE IF NOT EXISTS public.load_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_score NUMERIC DEFAULT 0.0,
    bid_amount NUMERIC,
    status TEXT DEFAULT 'notified', -- notified|viewed|bid|accepted|declined|expired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(load_id, driver_id)
);
CREATE INDEX IF NOT EXISTS idx_matches_load_status ON public.load_matches(load_id, status);

-- 7. Activity Events (Global Ticker)
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, 
    entity_type TEXT NOT NULL,
    entity_id UUID,
    geo JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_type_time ON public.activity_events(event_type, created_at);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_type TEXT NOT NULL, -- driver|broker
    subject_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating_value INTEGER,
    badges JSONB DEFAULT '[]'::jsonb,
    comment TEXT,
    verified_job_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Monetization Events
CREATE TABLE IF NOT EXISTS public.monetization_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_visibility_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_events ENABLE ROW LEVEL SECURITY;

-- High-level policies (simplified for rapid deployment)
CREATE POLICY "Public read directory data" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read driver data" ON public.driver_profiles FOR SELECT USING (true);
CREATE POLICY "Public read broker data" ON public.broker_profiles FOR SELECT USING (true);
CREATE POLICY "Public read open loads" ON public.loads FOR SELECT USING (status = 'open');
CREATE POLICY "Public read activity ticker" ON public.activity_events FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Drivers update own data" ON public.driver_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Brokers update own data" ON public.broker_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Brokers manage own loads" ON public.loads FOR ALL USING (auth.uid() = broker_id);
