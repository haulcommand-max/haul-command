-- ================================================================
-- HAUL COMMAND — GLOBAL COMPLIANCE ENGINE
-- Regulatory intelligence pipeline for 25-country escort coverage
-- ================================================================

-- ── 1. Country Compliance Registry ──
CREATE TABLE IF NOT EXISTS public.country_compliance (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code    text        NOT NULL,   -- ISO 3166-1 alpha-2
    country_name    text        NOT NULL,
    wave            smallint    NOT NULL DEFAULT 5 CHECK (wave BETWEEN 1 AND 5),

    -- Core regulatory fields
    escort_required             boolean     DEFAULT true,
    escort_types                text[]      DEFAULT '{}',   -- lead, rear, high_pole, police
    certification_required      boolean     DEFAULT false,
    certification_details       text,
    vehicle_requirements        text,
    equipment_requirements      text,
    police_required_cases       text,
    permit_authority            text,
    permit_authority_url        text,

    -- Dimension thresholds
    max_width_m                 numeric(6,2),
    max_height_m                numeric(6,2),
    max_length_m                numeric(6,2),
    max_weight_kg               numeric(10,2),

    -- Travel restrictions
    night_travel_rules          text,
    weekend_travel_rules        text,
    holiday_restrictions        text,

    -- Source + confidence
    source_urls                 text[]      DEFAULT '{}',
    confidence_score            smallint    DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
    last_verified_at            timestamptz,
    verified_by                 text,

    -- Quick-start content
    operator_checklist          jsonb       DEFAULT '[]',
    broker_requirements_summary text,
    quick_start_guide           text,

    -- Metadata
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    UNIQUE(country_code)
);

-- ── 2. Role Localization Table ──
CREATE TABLE IF NOT EXISTS public.role_localization (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    global_role     text        NOT NULL,   -- escort_vehicle_operator, lead_escort, etc.
    country_code    text        NOT NULL,
    local_term      text        NOT NULL,   -- "pilot car", "Begleitfahrzeug", etc.
    synonym_keywords text[]     DEFAULT '{}',
    is_primary      boolean     DEFAULT false,
    created_at      timestamptz DEFAULT now(),

    UNIQUE(global_role, country_code, local_term)
);

-- ── 3. Corridor Intelligence Table ──
CREATE TABLE IF NOT EXISTS public.corridor_intelligence (
    id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    corridor_slug       text        NOT NULL,
    corridor_name       text        NOT NULL,
    country_code        text        NOT NULL DEFAULT 'US',

    -- Route data
    highway_number      text,
    start_city          text,
    end_city            text,
    distance_km         numeric(8,1),
    states_traversed    text[]      DEFAULT '{}',

    -- Escort requirements
    escort_requirements text,
    permit_rules        text,
    staging_recommendations text,

    -- Live metrics (updated by cron/function)
    liquidity_score     smallint    DEFAULT 50 CHECK (liquidity_score BETWEEN 0 AND 100),
    active_escorts      int         DEFAULT 0,
    open_loads          int         DEFAULT 0,
    median_match_min    int         DEFAULT 30,
    trend               text        DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),

    -- Monetization
    featured_escort_slots   int     DEFAULT 3,
    sponsor_broker_id       uuid,
    permit_affiliate_url    text,
    insurance_affiliate_url text,
    training_partner_url    text,

    -- SEO content
    overview_content    text,
    seo_title           text,
    seo_description     text,

    -- Metadata
    heat_score          numeric(5,2) DEFAULT 0,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),

    UNIQUE(corridor_slug, country_code)
);

-- ── 4. State/Region Liquidity Scores ──
CREATE TABLE IF NOT EXISTS public.region_liquidity (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code    text        NOT NULL DEFAULT 'US',
    region_code     text        NOT NULL,   -- state/province code (TX, ON, etc.)
    region_name     text        NOT NULL,

    -- Liquidity inputs
    active_escorts      int         DEFAULT 0,
    open_loads          int         DEFAULT 0,
    median_match_min    int         DEFAULT 30,
    fill_rate           numeric(4,3) DEFAULT 0.5 CHECK (fill_rate BETWEEN 0 AND 1),

    -- Computed score
    liquidity_score     smallint    DEFAULT 50 CHECK (liquidity_score BETWEEN 0 AND 100),
    trend               text        DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
    shortage_flag       boolean     DEFAULT false,

    -- Historical baseline (7-day rolling)
    baseline_score      smallint    DEFAULT 50,
    baseline_escorts    int         DEFAULT 0,

    -- Timestamps
    last_computed_at    timestamptz DEFAULT now(),
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),

    UNIQUE(country_code, region_code)
);

-- ── 5. SEO Page Registry (programmatic long-tail tracking) ──
CREATE TABLE IF NOT EXISTS public.seo_page_registry (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    page_type       text        NOT NULL CHECK (page_type IN (
        'country_hub', 'region_hub', 'metro_hub', 'city_page',
        'corridor_page', 'regulation_page', 'glossary_page',
        'comparison_page', 'authority_guide'
    )),
    url_path        text        NOT NULL,
    country_code    text,
    region_code     text,
    city            text,
    corridor_slug   text,

    -- Content quality signals
    word_count      int         DEFAULT 0,
    has_unique_data boolean     DEFAULT false,
    has_local_signals boolean   DEFAULT false,
    internal_links_count int    DEFAULT 0,

    -- SEO metadata
    seo_title       text,
    seo_description text,
    primary_keyword text,
    secondary_keywords text[]   DEFAULT '{}',

    -- Performance tracking
    indexed         boolean     DEFAULT false,
    impressions_30d int         DEFAULT 0,
    clicks_30d      int         DEFAULT 0,
    avg_position    numeric(5,1),

    -- Metadata
    published_at    timestamptz,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    UNIQUE(url_path)
);

-- ── 6. Revenue Capture Tracking ──
CREATE TABLE IF NOT EXISTS public.revenue_streams (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_type     text        NOT NULL CHECK (stream_type IN (
        'permit_affiliate', 'training_referral', 'insurance_referral',
        'featured_operator', 'broker_priority', 'corridor_sponsorship',
        'compliance_report', 'premium_alert', 'api_access'
    )),
    entity_id       uuid,           -- operator/broker/corridor
    entity_type     text,           -- escort, broker, corridor
    country_code    text,
    region_code     text,

    -- Revenue data
    revenue_cents   int         DEFAULT 0,
    currency        text        DEFAULT 'USD',
    status          text        DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),

    -- Attribution
    referral_url    text,
    click_count     int         DEFAULT 0,
    conversion_count int        DEFAULT 0,

    -- Metadata
    starts_at       timestamptz DEFAULT now(),
    expires_at      timestamptz,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ── 7. Engagement / Watchlist ──
CREATE TABLE IF NOT EXISTS public.user_watchlist (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid        NOT NULL,
    entity_type     text        NOT NULL CHECK (entity_type IN ('state', 'corridor', 'country', 'metro')),
    entity_key      text        NOT NULL,   -- "US:TX", "I-10", "AU", etc.
    notify_demand_spike boolean DEFAULT true,
    notify_shortage    boolean  DEFAULT true,
    notify_new_load    boolean  DEFAULT true,

    created_at      timestamptz DEFAULT now(),
    UNIQUE(user_id, entity_type, entity_key)
);

-- ── 8. Credibility Badges ──
CREATE TABLE IF NOT EXISTS public.credibility_badges (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid        NOT NULL,
    badge_type      text        NOT NULL CHECK (badge_type IN (
        'fast_responder', 'corridor_specialist', 'verified_equipment',
        'high_fill_rate', 'top_rated', 'veteran_operator'
    )),
    corridor_slug   text,       -- for corridor_specialist
    earned_at       timestamptz DEFAULT now(),
    expires_at      timestamptz,
    is_active       boolean     DEFAULT true,

    UNIQUE(user_id, badge_type, corridor_slug)
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_compliance_country ON public.country_compliance(country_code);
CREATE INDEX IF NOT EXISTS idx_compliance_wave ON public.country_compliance(wave);
CREATE INDEX IF NOT EXISTS idx_role_localization_country ON public.role_localization(country_code);
CREATE INDEX IF NOT EXISTS idx_role_localization_role ON public.role_localization(global_role);
CREATE INDEX IF NOT EXISTS idx_corridor_intel_country ON public.corridor_intelligence(country_code);
CREATE INDEX IF NOT EXISTS idx_corridor_intel_slug ON public.corridor_intelligence(corridor_slug);
CREATE INDEX IF NOT EXISTS idx_region_liquidity_lookup ON public.region_liquidity(country_code, region_code);
CREATE INDEX IF NOT EXISTS idx_seo_registry_type ON public.seo_page_registry(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_registry_country ON public.seo_page_registry(country_code);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON public.credibility_badges(user_id);

-- ── Grants ──
GRANT SELECT ON public.country_compliance TO anon, authenticated;
GRANT SELECT ON public.role_localization TO anon, authenticated;
GRANT SELECT ON public.corridor_intelligence TO anon, authenticated;
GRANT SELECT ON public.region_liquidity TO anon, authenticated;
GRANT SELECT ON public.seo_page_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.revenue_streams TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_watchlist TO authenticated;
GRANT SELECT ON public.credibility_badges TO anon, authenticated;

-- ── Seed: Wave 1-5 Country Compliance ──
INSERT INTO public.country_compliance (country_code, country_name, wave, escort_required, escort_types, certification_required, permit_authority, max_width_m, max_height_m, max_length_m, confidence_score, source_urls, last_verified_at)
VALUES
    ('US', 'United States', 1, true, ARRAY['lead','rear','high_pole','police'], true, 'State DOTs + FHWA', 2.6, 4.27, 23.0, 90, ARRAY['https://ops.fhwa.dot.gov/freight/sw/permit_report/'], now()),
    ('CA', 'Canada', 1, true, ARRAY['lead','rear','high_pole'], true, 'Provincial Transport Ministries', 2.6, 4.15, 23.0, 85, ARRAY['https://tc.canada.ca/en/road-transportation'], now()),
    ('AU', 'Australia', 1, true, ARRAY['lead','rear','police'], true, 'NHVR + State Transport Authorities', 2.5, 4.3, 19.0, 80, ARRAY['https://www.nhvr.gov.au/road-access/oversize-overmass'], now()),
    ('GB', 'United Kingdom', 2, true, ARRAY['lead','rear','police'], false, 'Highways England / Transport Scotland', 2.9, 4.95, 18.75, 75, ARRAY['https://www.gov.uk/government/publications/abnormal-load-movements'], now()),
    ('NZ', 'New Zealand', 2, true, ARRAY['lead','rear'], true, 'Waka Kotahi NZTA', 2.5, 4.25, 20.0, 70, ARRAY['https://www.nzta.govt.nz/vehicles/vehicle-types/overweight-and-overdimension-vehicles/'], now()),
    ('DE', 'Germany', 2, true, ARRAY['lead','rear','police'], true, 'Straßenverkehrsamt', 2.55, 4.0, 15.5, 70, ARRAY['https://www.gesetze-im-internet.de/stvzo_2012/'], now()),
    ('SE', 'Sweden', 3, true, ARRAY['lead','rear'], false, 'Trafikverket', 2.6, 4.5, 24.0, 60, '{}', null),
    ('NO', 'Norway', 3, true, ARRAY['lead','rear','police'], false, 'Statens vegvesen', 2.55, 4.5, 19.5, 60, '{}', null),
    ('NL', 'Netherlands', 3, true, ARRAY['lead','rear'], false, 'Rijkswaterstaat', 2.55, 4.0, 22.0, 55, '{}', null),
    ('IE', 'Ireland', 3, true, ARRAY['lead','rear','police'], false, 'Transport Infrastructure Ireland', 2.55, 4.65, 18.75, 55, '{}', null),
    ('DK', 'Denmark', 3, true, ARRAY['lead','rear'], false, 'Vejdirektoratet', 2.55, 4.1, 22.0, 50, '{}', null),
    ('FI', 'Finland', 3, true, ARRAY['lead','rear'], false, 'Traficom', 2.6, 4.4, 25.25, 50, '{}', null),
    ('AE', 'UAE', 4, true, ARRAY['lead','rear','police'], true, 'MoI / RTA', 2.5, 4.5, 18.0, 40, '{}', null),
    ('SA', 'Saudi Arabia', 4, true, ARRAY['lead','rear','police'], true, 'MOT', 2.5, 4.5, 18.0, 35, '{}', null),
    ('ZA', 'South Africa', 4, true, ARRAY['lead','rear','police'], true, 'SANRAL / Provincial Roads', 2.5, 4.3, 22.0, 40, '{}', null),
    ('PL', 'Poland', 4, true, ARRAY['lead','rear'], false, 'GDDKiA', 2.55, 4.0, 16.5, 45, '{}', null),
    ('BE', 'Belgium', 4, true, ARRAY['lead','rear','police'], false, 'AWV / SPW', 2.55, 4.0, 15.5, 45, '{}', null),
    ('MX', 'Mexico', 5, true, ARRAY['lead','rear','police'], false, 'SCT', 2.6, 4.25, 21.0, 30, '{}', null),
    ('BR', 'Brazil', 5, true, ARRAY['lead','rear','police'], true, 'DNIT / ANTT', 2.6, 4.4, 19.8, 30, '{}', null),
    ('CL', 'Chile', 5, true, ARRAY['lead','rear'], false, 'Vialidad / MOP', 2.6, 4.2, 18.0, 25, '{}', null),
    ('ES', 'Spain', 5, true, ARRAY['lead','rear','police'], false, 'DGT', 2.55, 4.0, 16.5, 40, '{}', null),
    ('CH', 'Switzerland', 5, true, ARRAY['lead','rear','police'], true, 'ASTRA', 2.55, 4.0, 14.0, 45, '{}', null),
    ('AT', 'Austria', 5, true, ARRAY['lead','rear'], false, 'ASFINAG / BMK', 2.55, 4.0, 16.5, 40, '{}', null)
ON CONFLICT (country_code) DO NOTHING;

-- ── Seed: Role Localization ──
INSERT INTO public.role_localization (global_role, country_code, local_term, synonym_keywords, is_primary)
VALUES
    ('escort_vehicle_operator', 'US', 'pilot car driver', ARRAY['pilot car','escort car','oversize escort','wide load escort'], true),
    ('escort_vehicle_operator', 'CA', 'pilot car operator', ARRAY['pilot vehicle','escort vehicle','wide load pilot'], true),
    ('escort_vehicle_operator', 'AU', 'escort vehicle driver', ARRAY['pilot vehicle','warning vehicle','overmass escort'], true),
    ('escort_vehicle_operator', 'GB', 'abnormal load escort', ARRAY['escort vehicle','wide load escort','convoy escort'], true),
    ('escort_vehicle_operator', 'NZ', 'pilot vehicle operator', ARRAY['escort vehicle','overweight escort'], true),
    ('escort_vehicle_operator', 'DE', 'Begleitfahrzeugfahrer', ARRAY['BF-Fahrer','Schwertransportbegleitung','Großraumtransportbegleitung'], true),
    ('lead_escort', 'US', 'lead pilot car', ARRAY['front escort','lead escort vehicle'], true),
    ('lead_escort', 'CA', 'lead pilot vehicle', ARRAY['front pilot','lead escort'], true),
    ('lead_escort', 'AU', 'lead warning vehicle', ARRAY['lead escort','front escort vehicle'], true),
    ('rear_escort', 'US', 'rear pilot car', ARRAY['chase car','rear escort','trail car'], true),
    ('rear_escort', 'CA', 'rear pilot vehicle', ARRAY['trail vehicle','rear escort'], true),
    ('rear_escort', 'AU', 'rear warning vehicle', ARRAY['trail vehicle','rear escort'], true),
    ('high_pole_escort', 'US', 'height pole operator', ARRAY['high pole car','height clearance vehicle','pole car'], true),
    ('high_pole_escort', 'CA', 'height clearance vehicle', ARRAY['pole car','height pole'], true),
    ('high_pole_escort', 'AU', 'height detector vehicle', ARRAY['overhead clearance vehicle'], true),
    ('police_escort', 'US', 'police escort', ARRAY['law enforcement escort','state trooper escort'], true),
    ('police_escort', 'AU', 'police escort', ARRAY['police vehicle escort','law enforcement escort'], true),
    ('route_survey_driver', 'US', 'route survey driver', ARRAY['route checker','pre-run driver','clearance surveyor'], true),
    ('route_survey_driver', 'AU', 'route assessment driver', ARRAY['route checker','pre-survey vehicle'], true)
ON CONFLICT (global_role, country_code, local_term) DO NOTHING;

-- ── Seed: Top US Corridor Intelligence ──
INSERT INTO public.corridor_intelligence (corridor_slug, corridor_name, country_code, highway_number, start_city, end_city, states_traversed, liquidity_score, active_escorts, open_loads, median_match_min, trend, heat_score)
VALUES
    ('us-i-10', 'Interstate 10', 'US', 'I-10', 'Los Angeles, CA', 'Jacksonville, FL', ARRAY['CA','AZ','NM','TX','LA','MS','AL','FL'], 82, 145, 18, 12, 'up', 88.5),
    ('us-i-35', 'Interstate 35', 'US', 'I-35', 'Laredo, TX', 'Duluth, MN', ARRAY['TX','OK','KS','MO','IA','MN'], 76, 92, 14, 14, 'stable', 74.2),
    ('us-i-95', 'Interstate 95', 'US', 'I-95', 'Miami, FL', 'Houlton, ME', ARRAY['FL','GA','SC','NC','VA','MD','DE','PA','NJ','NY','CT','RI','MA','NH','ME'], 79, 118, 11, 15, 'stable', 80.1),
    ('us-i-5', 'Interstate 5', 'US', 'I-5', 'San Diego, CA', 'Blaine, WA', ARRAY['CA','OR','WA'], 71, 64, 8, 18, 'stable', 62.5),
    ('us-i-40', 'Interstate 40', 'US', 'I-40', 'Barstow, CA', 'Wilmington, NC', ARRAY['CA','AZ','NM','TX','OK','AR','TN','NC'], 68, 78, 12, 19, 'down', 58.3),
    ('us-i-20', 'Interstate 20', 'US', 'I-20', 'Kent, TX', 'Florence, SC', ARRAY['TX','LA','MS','AL','GA','SC'], 65, 52, 9, 21, 'stable', 52.7),
    ('us-i-75', 'Interstate 75', 'US', 'I-75', 'Miami, FL', 'Sault Ste. Marie, MI', ARRAY['FL','GA','TN','KY','OH','MI'], 73, 88, 10, 16, 'up', 69.8),
    ('us-i-80', 'Interstate 80', 'US', 'I-80', 'San Francisco, CA', 'Teaneck, NJ', ARRAY['CA','NV','UT','WY','NE','IA','IL','IN','OH','PA','NJ'], 64, 55, 7, 22, 'down', 48.9),
    ('us-i-70', 'Interstate 70', 'US', 'I-70', 'Cove Fort, UT', 'Baltimore, MD', ARRAY['UT','CO','KS','MO','IL','IN','OH','WV','PA','MD'], 61, 42, 6, 24, 'stable', 44.2),
    ('us-i-90', 'Interstate 90', 'US', 'I-90', 'Seattle, WA', 'Boston, MA', ARRAY['WA','ID','MT','WY','SD','MN','WI','IL','IN','OH','PA','NY','MA'], 58, 38, 5, 26, 'stable', 40.1),
    ('ca-trans-canada', 'Trans-Canada Highway', 'CA', 'TCH-1', 'Victoria, BC', 'St. Johns, NL', ARRAY['BC','AB','SK','MB','ON','QC','NB','NS','PE','NL'], 55, 28, 4, 32, 'up', 35.8),
    ('au-pacific', 'Pacific Motorway', 'AU', 'M1', 'Sydney, NSW', 'Brisbane, QLD', ARRAY['NSW','QLD'], 42, 12, 3, 38, 'stable', 22.5)
ON CONFLICT (corridor_slug, country_code) DO NOTHING;

-- ── Seed: US Region Liquidity ──
INSERT INTO public.region_liquidity (country_code, region_code, region_name, active_escorts, open_loads, median_match_min, fill_rate, liquidity_score, trend, shortage_flag)
VALUES
    ('US', 'TX', 'Texas', 182, 28, 11, 0.87, 78, 'up', false),
    ('US', 'CA', 'California', 124, 15, 14, 0.82, 74, 'stable', false),
    ('US', 'FL', 'Florida', 89, 12, 13, 0.79, 72, 'up', false),
    ('US', 'OH', 'Ohio', 68, 10, 16, 0.74, 66, 'stable', false),
    ('US', 'PA', 'Pennsylvania', 55, 8, 18, 0.71, 63, 'stable', false),
    ('US', 'LA', 'Louisiana', 62, 14, 12, 0.84, 70, 'up', false),
    ('US', 'OK', 'Oklahoma', 45, 9, 15, 0.76, 65, 'stable', false),
    ('US', 'GA', 'Georgia', 48, 7, 17, 0.72, 64, 'down', false),
    ('US', 'IL', 'Illinois', 52, 11, 14, 0.78, 68, 'stable', false),
    ('US', 'NC', 'North Carolina', 38, 6, 19, 0.69, 60, 'down', false),
    ('US', 'WA', 'Washington', 32, 5, 20, 0.68, 58, 'stable', false),
    ('US', 'AZ', 'Arizona', 28, 6, 22, 0.65, 55, 'down', false),
    ('US', 'IN', 'Indiana', 41, 8, 16, 0.73, 65, 'stable', false),
    ('US', 'MO', 'Missouri', 35, 7, 18, 0.71, 62, 'stable', false),
    ('US', 'CO', 'Colorado', 22, 4, 24, 0.62, 56, 'up', false),
    ('CA', 'ON', 'Ontario', 18, 3, 28, 0.55, 48, 'stable', false),
    ('CA', 'AB', 'Alberta', 12, 2, 32, 0.50, 42, 'stable', true),
    ('CA', 'BC', 'British Columbia', 8, 2, 35, 0.48, 38, 'down', true),
    ('AU', 'NSW', 'New South Wales', 10, 2, 34, 0.52, 44, 'stable', true),
    ('AU', 'QLD', 'Queensland', 6, 1, 40, 0.45, 36, 'stable', true)
ON CONFLICT (country_code, region_code) DO NOTHING;
