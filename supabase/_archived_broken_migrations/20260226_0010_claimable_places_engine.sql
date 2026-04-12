-- ============================================================================
-- CLAIMABLE PLACES ENGINE — Generalized POI Claim Flywheel
-- Extends the operator claim model to truck stops, motels, repair shops,
-- parking, scales, washouts, fuel stations, rest areas, tow/rotator, etc.
-- ============================================================================

-- ── 1. CORE PLACES TABLE ───────────────────────────────────────────────────

CREATE TYPE public.place_type AS ENUM (
    'truck_stop',
    'motel',
    'hotel',
    'repair_shop',
    'tire_shop',
    'truck_parking',
    'scale_weigh_station_public',
    'washout',
    'fuel_station_diesel_heavy',
    'rest_area',
    'tow_rotator',
    -- Global extensions
    'service_area',
    'freight_rest_stop',
    'border_facility',
    'port_adjacent_services',
    'industrial_park_services'
);

CREATE TYPE public.place_claim_status AS ENUM (
    'unclaimed',
    'claim_pending',
    'claimed',
    'verified',
    'suspended'
);

CREATE TYPE public.place_verification_status AS ENUM (
    'unverified',
    'pending_otp',
    'pending_dns',
    'pending_email',
    'pending_manual',
    'verified',
    'rejected'
);

CREATE TABLE IF NOT EXISTS public.places (
    place_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_type      public.place_type NOT NULL,
    name            TEXT NOT NULL,
    country_code    VARCHAR(2) NOT NULL,
    region          TEXT,                 -- state / province / county code
    city            TEXT,
    lat             NUMERIC(10,7),
    lon             NUMERIC(10,7),
    address         TEXT,
    phone           TEXT,
    website         TEXT,
    hours_json      JSONB DEFAULT '{}'::JSONB,
    amenities_json  JSONB DEFAULT '[]'::JSONB,   -- ["shower","wifi","atm","scales","parking_oversize"]
    services_json   JSONB DEFAULT '[]'::JSONB,   -- ["alignment","oil_change","24hr_tow"]
    data_source     TEXT DEFAULT 'seed',          -- seed | google_places | user_submit | scrape | partner
    slug            TEXT,

    -- Claim state
    claim_status            public.place_claim_status DEFAULT 'unclaimed',
    claimed_by_account_id   UUID,                     -- FK to profiles.id
    verification_status     public.place_verification_status DEFAULT 'unverified',

    -- Scoring
    trust_score_seed            NUMERIC(5,2) DEFAULT 0.0,
    adgrid_eligibility_score    NUMERIC(5,2) DEFAULT 0.0,   -- 0-100
    page_views_7d               INT DEFAULT 0,
    search_impressions_28d      INT DEFAULT 0,

    -- SEO
    meta_title          TEXT,
    meta_description    TEXT,

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for place queries
CREATE UNIQUE INDEX IF NOT EXISTS places_slug_country_idx ON public.places (country_code, slug);
CREATE INDEX IF NOT EXISTS places_type_country_idx ON public.places (place_type, country_code);
CREATE INDEX IF NOT EXISTS places_claim_status_idx ON public.places (claim_status);
CREATE INDEX IF NOT EXISTS places_geo_idx ON public.places (country_code, region, city);
CREATE INDEX IF NOT EXISTS places_lat_lon_idx ON public.places (lat, lon);
CREATE INDEX IF NOT EXISTS places_adgrid_elig_idx ON public.places (adgrid_eligibility_score DESC) WHERE claim_status = 'verified';

-- ── 2. PLACE CLAIMS TABLE ──────────────────────────────────────────────────

CREATE TYPE public.place_verification_method AS ENUM (
    'phone_otp',
    'website_dns',
    'website_html_tag',
    'email_domain_match',
    'manual_pending',
    'auto_bypass_seed'
);

CREATE TABLE IF NOT EXISTS public.place_claims (
    claim_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id                UUID NOT NULL REFERENCES public.places(place_id) ON DELETE CASCADE,
    claimant_account_id     UUID NOT NULL,            -- FK to profiles.id
    claimant_role           TEXT DEFAULT 'owner',     -- owner | manager | marketing | other
    verification_method     public.place_verification_method,
    verification_status     public.place_verification_status DEFAULT 'unverified',
    verification_evidence_ref TEXT,                   -- URL or reference ID to evidence
    otp_code                TEXT,                     -- hashed OTP if phone verification
    otp_expires_at          TIMESTAMPTZ,
    started_at              TIMESTAMPTZ DEFAULT NOW(),
    completed_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pc_place_idx ON public.place_claims (place_id);
CREATE INDEX IF NOT EXISTS pc_claimant_idx ON public.place_claims (claimant_account_id);
CREATE INDEX IF NOT EXISTS pc_status_idx ON public.place_claims (verification_status);

-- ── 3. PLACE OFFERS (MONETIZATION LADDER) ──────────────────────────────────

CREATE TYPE public.place_offer_tier AS ENUM (
    'free_claim',
    'verified_claim',
    'premium_placement',
    'adgrid_boost',
    'bundle_package'
);

CREATE TABLE IF NOT EXISTS public.place_offers (
    offer_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_type          public.place_type NOT NULL,
    country_code        VARCHAR(2) NOT NULL,
    offer_tier          public.place_offer_tier NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    price               NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_period      TEXT DEFAULT 'monthly',   -- monthly | annual | one_time
    benefits_json       JSONB DEFAULT '[]'::JSONB,
    eligibility_rules_json JSONB DEFAULT '{}'::JSONB,
    stripe_price_id     TEXT,                      -- wired to Stripe
    is_active           BOOLEAN DEFAULT true,
    sort_order          INT DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS po_type_country_tier_idx ON public.place_offers (place_type, country_code, offer_tier, name);
CREATE INDEX IF NOT EXISTS po_active_idx ON public.place_offers (is_active, place_type, country_code);

-- ── 4. PLACE ↔ ADGRID LINK ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.place_adgrid_links (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id                    UUID NOT NULL REFERENCES public.places(place_id) ON DELETE CASCADE,
    advertiser_account_id       UUID REFERENCES public.advertiser_accounts(advertiser_id) ON DELETE SET NULL,
    default_campaign_template_id TEXT,
    last_campaign_activity_at   TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(place_id)
);

-- ── 5. NEW AD SLOTS FOR PLACE PAGES ───────────────────────────────────────

INSERT INTO public.ad_slots (slot_id, description, intent_tier, floor_price, ceiling_price) VALUES
    ('place_profile_hero',      'Hero banner on place profile page',                           'tier_1', 5.00, 35.00),
    ('place_city_sidebar',      'Sidebar ad on city places listing pages',                     'tier_2', 3.00, 20.00),
    ('corridor_nearby_places',  'Nearby places module within corridor pages',                  'tier_2', 4.00, 25.00),
    ('driver_planning_fuel',    'Fuel/parking/lodging planning page ads',                      'tier_1', 5.00, 30.00),
    ('place_category_sponsor',  'Sponsored placement at top of category result pages',         'tier_1', 6.00, 40.00)
ON CONFLICT (slot_id) DO NOTHING;

-- ── 6. VAPI OUTBOUND ELIGIBILITY SCORING TABLE ────────────────────────────

CREATE TABLE IF NOT EXISTS public.vapi_outbound_eligibility (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type         TEXT NOT NULL,           -- 'place' | 'operator'
    entity_id           UUID NOT NULL,
    country_code        VARCHAR(2) NOT NULL,
    corridor_heat_score NUMERIC(5,2) DEFAULT 0.0,
    page_views_7d       INT DEFAULT 0,
    search_impressions_28d INT DEFAULT 0,
    competitor_density  NUMERIC(5,2) DEFAULT 0.0,
    missing_fields_count INT DEFAULT 0,
    phone_valid         BOOLEAN DEFAULT false,
    prior_contact_attempts INT DEFAULT 0,
    last_contact_at     TIMESTAMPTZ,
    eligibility_score   NUMERIC(5,4) DEFAULT 0.0,  -- 0.0 to 1.0
    program_type        TEXT,                       -- unclaimed_place_claim | adgrid_upgrade | operator_cross_sell
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, program_type)
);

CREATE INDEX IF NOT EXISTS voe_score_idx ON public.vapi_outbound_eligibility (eligibility_score DESC) WHERE eligibility_score >= 0.72;
CREATE INDEX IF NOT EXISTS voe_country_idx ON public.vapi_outbound_eligibility (country_code, program_type);

-- ── 7. GLOBAL THROUGHPUT OPTIMIZER ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vapi_throughput_allocations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code        VARCHAR(2) NOT NULL,
    time_window_start   TIME NOT NULL,          -- e.g. 09:00
    time_window_end     TIME NOT NULL,          -- e.g. 17:00
    timezone            TEXT NOT NULL,
    weight              NUMERIC(5,4) DEFAULT 0.0,  -- allocation weight 0.0 to 1.0
    max_concurrency     INT DEFAULT 1,
    daily_budget_cap    NUMERIC(10,2) DEFAULT 0.00,
    entity_type_weights JSONB DEFAULT '{}'::JSONB,  -- {"truck_stop": 0.4, "motel": 0.3, ...}
    pickup_rate_30d     NUMERIC(5,4) DEFAULT 0.0,
    complaint_rate_30d  NUMERIC(5,4) DEFAULT 0.0,
    cost_per_connected  NUMERIC(10,4) DEFAULT 0.0,
    last_rebalanced_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code, time_window_start)
);

-- ── 8. RLS POLICIES ───────────────────────────────────────────────────────

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_adgrid_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_outbound_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_throughput_allocations ENABLE ROW LEVEL SECURITY;

-- Public read for places and offers (SEO pages need this)
CREATE POLICY places_public_read ON public.places FOR SELECT USING (true);
CREATE POLICY place_offers_public_read ON public.place_offers FOR SELECT USING (is_active = true);

-- Claimants can read their own claims
CREATE POLICY place_claims_own_read ON public.place_claims FOR SELECT TO authenticated
    USING (claimant_account_id = auth.uid());

-- Service role full access on all
CREATE POLICY places_sr ON public.places FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY place_claims_sr ON public.place_claims FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY place_offers_sr ON public.place_offers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY place_adgrid_links_sr ON public.place_adgrid_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY vapi_outbound_elig_sr ON public.vapi_outbound_eligibility FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY vapi_throughput_sr ON public.vapi_throughput_allocations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Claimed place owners can update their own place
CREATE POLICY places_owner_update ON public.places FOR UPDATE TO authenticated
    USING (claimed_by_account_id = auth.uid() AND claim_status IN ('claimed', 'verified'))
    WITH CHECK (claimed_by_account_id = auth.uid());

-- ── 9. SEO TRIGGER: AUTO-REGISTER PLACE PAGES IN SITEMAP ──────────────────

CREATE OR REPLACE FUNCTION public.seo_on_place_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    place_url TEXT;
    city_url TEXT;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (COALESCE(OLD.claim_status::TEXT,'') = COALESCE(NEW.claim_status::TEXT,'')) THEN
            RETURN NEW;
        END IF;
    END IF;

    IF LOWER(COALESCE(NEW.claim_status::TEXT,'')) NOT IN ('claimed','verified') THEN
        RETURN NEW;
    END IF;

    place_url := '/' || LOWER(NEW.country_code) || '/places/' || NEW.place_type::TEXT || '/' || COALESCE(NEW.slug, NEW.place_id::TEXT);
    city_url := '/' || LOWER(NEW.country_code) || '/places/' || NEW.place_type::TEXT || '/' || LOWER(COALESCE(NEW.region,'')) || '/' || LOWER(REPLACE(COALESCE(NEW.city,''),  ' ', '-'));

    PERFORM public.sitemap_url_upsert(place_url, 'place');
    PERFORM public.sitemap_url_upsert(city_url, 'place_city');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_on_place_claim ON public.places;
CREATE TRIGGER trg_seo_on_place_claim
AFTER INSERT OR UPDATE OF claim_status ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.seo_on_place_claim();

-- ── 10. UPDATED_AT TRIGGER ────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_places_updated ON public.places;
CREATE TRIGGER trg_places_updated
BEFORE UPDATE ON public.places
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_place_offers_updated ON public.place_offers;
CREATE TRIGGER trg_place_offers_updated
BEFORE UPDATE ON public.place_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 11. SEED MONETIZATION LADDER OFFERS (US defaults) ─────────────────────

INSERT INTO public.place_offers (place_type, country_code, offer_tier, name, price, currency, billing_period, benefits_json, sort_order) VALUES
    -- Truck Stop tiers
    ('truck_stop', 'US', 'free_claim',          'Free Claim',            0.00,  'USD', 'one_time', '["edit_hours","edit_phone_website","respond_to_reviews"]'::JSONB, 1),
    ('truck_stop', 'US', 'verified_claim',      'Verified Claim',       19.00,  'USD', 'monthly',  '["verified_badge","higher_rank_weight","lead_capture_form"]'::JSONB, 2),
    ('truck_stop', 'US', 'premium_placement',   'Premium Placement',    49.00,  'USD', 'monthly',  '["top_of_city_region_results","featured_on_corridor_pages","category_sponsored_spot"]'::JSONB, 3),
    ('truck_stop', 'US', 'adgrid_boost',        'AdGrid Boost',         99.00,  'USD', 'monthly',  '["ad_campaign_templates","corridor_targeting","seasonal_promos"]'::JSONB, 4),
    ('truck_stop', 'US', 'bundle_package',      'Truck Stop Bundle',   129.00,  'USD', 'monthly',  '["premium_placement","adgrid_boost","featured_corridor","call_tracking"]'::JSONB, 5),

    -- Motel tiers
    ('motel', 'US', 'free_claim',               'Free Claim',            0.00,  'USD', 'one_time', '["edit_hours","edit_phone_website","respond_to_reviews"]'::JSONB, 1),
    ('motel', 'US', 'verified_claim',           'Verified Claim',       19.00,  'USD', 'monthly',  '["verified_badge","higher_rank_weight","lead_capture_form"]'::JSONB, 2),
    ('motel', 'US', 'premium_placement',        'Premium Placement',    39.00,  'USD', 'monthly',  '["top_of_city_region_results","featured_on_corridor_pages"]'::JSONB, 3),
    ('motel', 'US', 'bundle_package',           'Motel Bundle',         89.00,  'USD', 'monthly',  '["premium_placement","adgrid_boost","driver_discount_banner"]'::JSONB, 5),

    -- Repair Shop tiers
    ('repair_shop', 'US', 'free_claim',         'Free Claim',            0.00,  'USD', 'one_time', '["edit_hours","edit_phone_website","respond_to_reviews"]'::JSONB, 1),
    ('repair_shop', 'US', 'verified_claim',     'Verified Claim',       19.00,  'USD', 'monthly',  '["verified_badge","higher_rank_weight","lead_capture_form"]'::JSONB, 2),
    ('repair_shop', 'US', 'premium_placement',  'Premium Placement',    39.00,  'USD', 'monthly',  '["top_of_city_region_results","featured_on_corridor_pages","call_tracking"]'::JSONB, 3),
    ('repair_shop', 'US', 'bundle_package',     'Repair Bundle',        99.00,  'USD', 'monthly',  '["premium_placement","adgrid_boost","call_tracking"]'::JSONB, 5),

    -- Tire Shop tiers
    ('tire_shop', 'US', 'free_claim',           'Free Claim',            0.00,  'USD', 'one_time', '["edit_hours","edit_phone_website","respond_to_reviews"]'::JSONB, 1),
    ('tire_shop', 'US', 'verified_claim',       'Verified Claim',       14.00,  'USD', 'monthly',  '["verified_badge","higher_rank_weight"]'::JSONB, 2),

    -- Tow / Rotator tiers
    ('tow_rotator', 'US', 'free_claim',         'Free Claim',            0.00,  'USD', 'one_time', '["edit_hours","edit_phone_website","respond_to_reviews"]'::JSONB, 1),
    ('tow_rotator', 'US', 'verified_claim',     'Verified Claim',       19.00,  'USD', 'monthly',  '["verified_badge","higher_rank_weight","lead_capture_form"]'::JSONB, 2),
    ('tow_rotator', 'US', 'premium_placement',  'Premium Placement',    49.00,  'USD', 'monthly',  '["top_of_city_region_results","featured_on_corridor_pages","24hr_emergency_badge"]'::JSONB, 3),

    -- Truck Parking tiers
    ('truck_parking', 'US', 'free_claim',       'Free Claim',            0.00,  'USD', 'one_time', '["edit_hours","edit_capacity_info"]'::JSONB, 1),
    ('truck_parking', 'US', 'verified_claim',   'Verified Claim',       14.00,  'USD', 'monthly',  '["verified_badge","live_availability_toggle"]'::JSONB, 2),
    ('truck_parking', 'US', 'premium_placement','Premium Placement',    29.00,  'USD', 'monthly',  '["top_of_corridor_results","featured_on_rest_stop_pages"]'::JSONB, 3)

ON CONFLICT DO NOTHING;

-- ── 12. SEED THROUGHPUT ALLOCATIONS FOR INITIAL MARKETS ───────────────────

INSERT INTO public.vapi_throughput_allocations (country_code, time_window_start, time_window_end, timezone, weight, max_concurrency, daily_budget_cap) VALUES
    ('US', '09:00', '17:00', 'America/New_York',     0.40, 5, 50.00),
    ('US', '09:00', '17:00', 'America/Los_Angeles',  0.20, 3, 30.00),
    ('CA', '09:00', '17:00', 'America/Toronto',      0.15, 2, 20.00),
    ('AU', '09:00', '17:00', 'Australia/Sydney',     0.10, 1, 15.00),
    ('GB', '09:00', '17:00', 'Europe/London',        0.05, 1, 10.00),
    ('NZ', '09:00', '17:00', 'Pacific/Auckland',     0.03, 1,  5.00),
    ('DE', '09:00', '17:00', 'Europe/Berlin',        0.02, 1,  5.00),
    ('ZA', '09:00', '17:00', 'Africa/Johannesburg',  0.02, 1,  5.00),
    ('AE', '09:00', '17:00', 'Asia/Dubai',           0.02, 1,  5.00),
    ('SE', '09:00', '17:00', 'Europe/Stockholm',     0.01, 1,  3.00)
ON CONFLICT DO NOTHING;
