-- ============================================================================
-- HAUL COMMAND — COUNTRY NORMALIZATION + COMPLIANCE AUTOSEED v2
-- Normalizes regions → discrete ISO countries, reaching the 25-country target.
-- Seeds compliance profiles for all 25. Adds verification + payment columns.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A) REGION → COUNTRY MAP (expand region codes into deployable ISO markets)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.region_country_map (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    region_code     text        NOT NULL,   -- EU, SA_REGION, ME_REGION, AP_REGION, etc.
    country_code    text        NOT NULL,   -- ISO 3166-1 alpha-2
    country_name    text        NOT NULL,
    active          boolean     DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    UNIQUE(region_code, country_code)
);

CREATE INDEX IF NOT EXISTS idx_rcm_region ON public.region_country_map(region_code);
CREATE INDEX IF NOT EXISTS idx_rcm_country ON public.region_country_map(country_code);
CREATE INDEX IF NOT EXISTS idx_rcm_active ON public.region_country_map(active);

ALTER TABLE public.region_country_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "region_country_map_public_read" ON public.region_country_map FOR SELECT USING (true);
CREATE POLICY "region_country_map_service_write" ON public.region_country_map FOR ALL USING (auth.role() = 'service_role');

-- Seed: conservative expansion of region codes into concrete markets
-- These are the countries that bring the total from 16 discovered → 25 target.
INSERT INTO public.region_country_map (region_code, country_code, country_name, active) VALUES
    -- EU region → discrete countries not already covered by global_countries/markets
    ('EU', 'NL', 'Netherlands',  true),
    ('EU', 'BE', 'Belgium',      true),
    ('EU', 'PL', 'Poland',       true),
    ('EU', 'IE', 'Ireland',      true),
    ('EU', 'DK', 'Denmark',      true),
    ('EU', 'FI', 'Finland',      true),
    ('EU', 'ES', 'Spain',        true),
    ('EU', 'CH', 'Switzerland',  true),
    ('EU', 'AT', 'Austria',      true),
    ('EU', 'FR', 'France',       false),  -- false until localization ready
    ('EU', 'IT', 'Italy',        false),  -- false until localization ready
    -- SA_REGION → South America
    ('SA_REGION', 'BR', 'Brazil', true),
    ('SA_REGION', 'CL', 'Chile',  true),
    -- ME_REGION → Middle East / Africa (AE, SA, ZA already discrete)
    ('ME_REGION', 'TR', 'Turkey', true),
    -- AP_REGION → Asia-Pacific (AU, NZ already discrete)
    ('AP_REGION', 'MX', 'Mexico', true)
ON CONFLICT (region_code, country_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- B) AUTHORITATIVE 25-COUNTRY VIEW
-- Union of: discrete countries from global_countries + expanded active regions
-- ═══════════════════════════════════════════════════════════════════════════

-- First ensure global_countries has all 16 base countries
INSERT INTO public.global_countries (iso2, iso3, name, primary_language, currency_code, measurement_system, is_active_market, activation_phase)
VALUES
    ('US', 'USA', 'United States',     'en', 'USD', 'imperial', true,  'immediate'),
    ('CA', 'CAN', 'Canada',            'en', 'CAD', 'metric',   true,  'immediate'),
    ('AU', 'AUS', 'Australia',         'en', 'AUD', 'metric',   true,  'immediate'),
    ('GB', 'GBR', 'United Kingdom',    'en', 'GBP', 'metric',   true,  'immediate'),
    ('NZ', 'NZL', 'New Zealand',       'en', 'NZD', 'metric',   true,  'phase_2'),
    ('DE', 'DEU', 'Germany',           'de', 'EUR', 'metric',   true,  'phase_2'),
    ('SE', 'SWE', 'Sweden',            'sv', 'SEK', 'metric',   true,  'phase_3'),
    ('NO', 'NOR', 'Norway',            'no', 'NOK', 'metric',   true,  'phase_3'),
    ('AE', 'ARE', 'UAE',               'en', 'AED', 'metric',   true,  'phase_3'),
    ('SA', 'SAU', 'Saudi Arabia',      'ar', 'SAR', 'metric',   true,  'phase_3'),
    ('ZA', 'ZAF', 'South Africa',      'en', 'ZAR', 'metric',   true,  'phase_3'),
    ('MX', 'MEX', 'Mexico',            'es', 'MXN', 'metric',   false, 'monitor'),
    ('BR', 'BRA', 'Brazil',            'pt', 'BRL', 'metric',   false, 'monitor'),
    ('CL', 'CHL', 'Chile',             'es', 'CLP', 'metric',   false, 'monitor'),
    ('TR', 'TUR', 'Turkey',            'tr', 'TRY', 'metric',   false, 'monitor'),
    ('NL', 'NLD', 'Netherlands',       'nl', 'EUR', 'metric',   false, 'phase_3')
ON CONFLICT (iso2) DO NOTHING;

-- Add remaining expansion countries to global_countries
INSERT INTO public.global_countries (iso2, iso3, name, primary_language, currency_code, measurement_system, is_active_market, activation_phase)
VALUES
    ('BE', 'BEL', 'Belgium',       'nl', 'EUR', 'metric', false, 'monitor'),
    ('PL', 'POL', 'Poland',        'pl', 'PLN', 'metric', false, 'monitor'),
    ('IE', 'IRL', 'Ireland',       'en', 'EUR', 'metric', false, 'phase_3'),
    ('DK', 'DNK', 'Denmark',       'da', 'DKK', 'metric', false, 'monitor'),
    ('FI', 'FIN', 'Finland',       'fi', 'EUR', 'metric', false, 'monitor'),
    ('ES', 'ESP', 'Spain',         'es', 'EUR', 'metric', false, 'monitor'),
    ('CH', 'CHE', 'Switzerland',   'de', 'CHF', 'metric', false, 'monitor'),
    ('AT', 'AUT', 'Austria',       'de', 'EUR', 'metric', false, 'monitor'),
    ('FR', 'FRA', 'France',        'fr', 'EUR', 'metric', false, 'monitor')
ON CONFLICT (iso2) DO NOTHING;

-- Authoritative view: exactly 25 active target countries
CREATE OR REPLACE VIEW public.enabled_target_countries_v AS
SELECT DISTINCT
    gc.iso2                 AS country_code,
    gc.name                 AS country_name,
    gc.primary_language,
    gc.currency_code,
    gc.measurement_system,
    gc.activation_phase,
    CASE
        WHEN gc.activation_phase IN ('immediate', 'phase_2') THEN 'core'
        WHEN gc.activation_phase = 'phase_3' THEN 'expansion'
        ELSE 'monitor'
    END                     AS market_tier,
    -- Is this a direct country or expanded from a region?
    CASE
        WHEN rcm.region_code IS NOT NULL THEN rcm.region_code
        ELSE NULL
    END                     AS source_region
FROM public.global_countries gc
LEFT JOIN public.region_country_map rcm
    ON gc.iso2 = rcm.country_code AND rcm.active = true
WHERE gc.iso2 IN (
    -- 16 discrete countries
    'US','CA','AU','GB','NZ','DE','SE','NO','AE','SA','ZA','MX','BR','CL','TR','NL',
    -- 9 from region expansion (bringing total to 25)
    'BE','PL','IE','DK','FI','ES','CH','AT','FR'
);

-- ═════════════════════════════════════════════════════════════════════════
-- C) COUNTRY COMPLIANCE PROFILES — AUTO-SEED FOR ALL 25
-- ═════════════════════════════════════════════════════════════════════════

-- Add Vapi/outbound compliance columns to country_compliance
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS outbound_allowed      boolean DEFAULT false;
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS recording_enabled     boolean DEFAULT false;
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS sms_allowed           boolean DEFAULT false;
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS push_allowed          boolean DEFAULT true;
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS verification_status   text    DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'suspended'));
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS disclosure_script_id  text    DEFAULT 'default_conservative';
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS calling_hours_local   text    DEFAULT '09:00-18:00';
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS quiet_hours_local     text    DEFAULT '20:00-08:00';
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS opt_out_handling_tested boolean DEFAULT false;

-- Payment readiness columns
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS payments_enabled      boolean DEFAULT false;
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS stripe_account_region text;
ALTER TABLE public.country_compliance ADD COLUMN IF NOT EXISTS country_currency      text;

-- Seed compliance for countries not yet in country_compliance (from the 25 target)
INSERT INTO public.country_compliance (
    country_code, country_name, wave,
    escort_required, escort_types,
    outbound_allowed, recording_enabled, sms_allowed, push_allowed,
    verification_status, disclosure_script_id,
    calling_hours_local, quiet_hours_local, opt_out_handling_tested,
    payments_enabled, country_currency,
    confidence_score
)
VALUES
    -- These are the countries NOT already seeded (IE, DK, FI are in compliance_engine)
    ('IE', 'Ireland',       3, true,  ARRAY['lead','rear','police'], false, false, false, true, 'unverified', 'default_conservative', '09:00-18:00', '20:00-08:00', false, false, 'EUR', 55),
    ('DK', 'Denmark',       3, true,  ARRAY['lead','rear'],          false, false, false, true, 'unverified', 'default_conservative', '09:00-18:00', '20:00-08:00', false, false, 'DKK', 50),
    ('FI', 'Finland',       3, true,  ARRAY['lead','rear'],          false, false, false, true, 'unverified', 'default_conservative', '09:00-18:00', '21:00-07:00', false, false, 'EUR', 50),
    ('FR', 'France',        5, true,  ARRAY['lead','rear','police'], false, false, false, true, 'unverified', 'default_conservative', '09:00-18:00', '20:00-08:00', false, false, 'EUR', 40),
    ('IT', 'Italy',         5, true,  ARRAY['lead','rear','police'], false, false, false, true, 'unverified', 'default_conservative', '09:00-18:00', '20:00-08:00', false, false, 'EUR', 35)
ON CONFLICT (country_code) DO UPDATE SET
    outbound_allowed = EXCLUDED.outbound_allowed,
    recording_enabled = EXCLUDED.recording_enabled,
    sms_allowed = EXCLUDED.sms_allowed,
    push_allowed = EXCLUDED.push_allowed,
    verification_status = COALESCE(public.country_compliance.verification_status, EXCLUDED.verification_status),
    payments_enabled = EXCLUDED.payments_enabled,
    country_currency = EXCLUDED.country_currency;

-- Update existing compliance rows with new column defaults
UPDATE public.country_compliance SET
    outbound_allowed = false,
    recording_enabled = false,
    sms_allowed = false,
    push_allowed = true,
    verification_status = COALESCE(verification_status, 'unverified'),
    payments_enabled = CASE
        WHEN country_code IN ('US', 'CA', 'AU', 'GB') THEN true
        ELSE false
    END,
    country_currency = COALESCE(country_currency,
        CASE country_code
            WHEN 'US' THEN 'USD' WHEN 'CA' THEN 'CAD' WHEN 'AU' THEN 'AUD'
            WHEN 'GB' THEN 'GBP' WHEN 'NZ' THEN 'NZD' WHEN 'DE' THEN 'EUR'
            WHEN 'SE' THEN 'SEK' WHEN 'NO' THEN 'NOK' WHEN 'AE' THEN 'AED'
            WHEN 'SA' THEN 'SAR' WHEN 'ZA' THEN 'ZAR' WHEN 'MX' THEN 'MXN'
            WHEN 'BR' THEN 'BRL' WHEN 'CL' THEN 'CLP' WHEN 'TR' THEN 'TRY'
            WHEN 'NL' THEN 'EUR' WHEN 'BE' THEN 'EUR' WHEN 'PL' THEN 'PLN'
            WHEN 'ES' THEN 'EUR' WHEN 'CH' THEN 'CHF' WHEN 'AT' THEN 'EUR'
            ELSE 'USD'
        END
    )
WHERE outbound_allowed IS NULL OR payments_enabled IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- D) PLACE OFFERS TABLE — PRICING/PAYMENTS HARDENING
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.place_claims ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE public.place_claims ADD COLUMN IF NOT EXISTS country_currency text;
ALTER TABLE public.place_claims ADD COLUMN IF NOT EXISTS is_checkout_enabled boolean DEFAULT true;

-- ═══════════════════════════════════════════════════════════════════════════
-- E) VAPI OFFER SEQUENCER TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vapi_offer_log (
    id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id           uuid        NOT NULL,
    entity_type         text        NOT NULL,  -- 'place' | 'operator'
    country_code        text        NOT NULL DEFAULT 'US',

    -- Offer tracking
    offer_type          text        NOT NULL CHECK (offer_type IN (
        'free_claim', 'verified_claim', 'premium_placement',
        'adgrid_boost', 'bundle_package', 'starter_cpc', 'short_campaign'
    )),
    offer_tier          text        NOT NULL DEFAULT 'initial' CHECK (offer_tier IN (
        'initial', 'upsell', 'downsell', 'final'
    )),
    outcome             text        CHECK (outcome IN (
        'accepted', 'rejected', 'no_answer', 'callback_scheduled', 'pending'
    )),

    -- Sequencing
    sequence_position   smallint    NOT NULL DEFAULT 1, -- 1st, 2nd, 3rd pitch
    lifetime_attempts   smallint    NOT NULL DEFAULT 1,
    cooldown_until      timestamptz,

    -- Context
    call_id             text,       -- Vapi call ID
    conversation_summary text,
    traffic_proof_met   boolean     DEFAULT false,

    -- Timestamps
    offered_at          timestamptz DEFAULT now(),
    resolved_at         timestamptz,
    created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vapi_offer_entity ON public.vapi_offer_log(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_vapi_offer_cooldown ON public.vapi_offer_log(entity_id, cooldown_until);
CREATE INDEX IF NOT EXISTS idx_vapi_offer_country ON public.vapi_offer_log(country_code);

ALTER TABLE public.vapi_offer_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vapi_offer_service_all" ON public.vapi_offer_log FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- F) DRIVER PLANNING LAYER — PAGE TRACKING
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.driver_planning_pages (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code    text        NOT NULL,
    page_type       text        NOT NULL CHECK (page_type IN (
        'fuel', 'parking', 'lodging', 'services', 'corridor_nearby'
    )),
    slug            text        NOT NULL,
    corridor_slug   text,       -- if linked to a corridor
    
    -- Monetization config
    adgrid_enabled  boolean     DEFAULT false,
    cpc_enabled     boolean     DEFAULT false,
    cpa_enabled     boolean     DEFAULT false,
    subscription_gated boolean  DEFAULT false,

    -- Performance
    impressions_7d  int         DEFAULT 0,
    clicks_7d       int         DEFAULT 0,

    -- SEO
    seo_title       text,
    seo_description text,

    published       boolean     DEFAULT false,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    UNIQUE(country_code, slug)
);

CREATE INDEX IF NOT EXISTS idx_driver_pages_country ON public.driver_planning_pages(country_code);
CREATE INDEX IF NOT EXISTS idx_driver_pages_type ON public.driver_planning_pages(page_type);

ALTER TABLE public.driver_planning_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_pages_public_read" ON public.driver_planning_pages FOR SELECT USING (published = true);
CREATE POLICY "driver_pages_service_write" ON public.driver_planning_pages FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- G) VERIFICATION METHOD EXPANSION
-- ═══════════════════════════════════════════════════════════════════════════

-- Add new verification method enum values if claim_verification_methods exists
-- Otherwise add columns to place_claims
ALTER TABLE public.place_claims ADD COLUMN IF NOT EXISTS verification_method text DEFAULT 'phone_otp'
    CHECK (verification_method IN (
        'phone_otp', 'dns_txt', 'html_meta', 'email_domain',
        'website_contact_email_token', 'voice_callback_verification'
    ));

ALTER TABLE public.place_claims ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE public.place_claims ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz;

-- ============================================================================
-- END: COUNTRY NORMALIZATION + COMPLIANCE AUTOSEED v2
-- ============================================================================
