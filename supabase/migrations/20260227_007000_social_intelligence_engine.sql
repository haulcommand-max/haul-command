-- ============================================================================
-- SOCIAL INTELLIGENCE ENGINE — Schema Extension
-- Extends: 20260225_social_reputation_intel.sql, 20260226_0010_claimable_places_engine.sql
-- Version: 1.0
-- Principle: opt_in_only_compliant_growth
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. SOCIAL POST IMPORTS (opt-in sources only)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE public.social_import_source AS ENUM (
    'admin_manual_post_import',
    'user_self_submission',
    'referral_link_capture',
    'csv_bulk_import'
);

CREATE TYPE public.social_intent_class AS ENUM (
    'escort_needed',
    'driver_available',
    'broker_offer',
    'dispute_signal',
    'equipment_sale',
    'general_chat'
);

CREATE TABLE IF NOT EXISTS public.social_post_imports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_source       public.social_import_source NOT NULL,
    imported_by         UUID,                           -- admin user or NULL for system
    raw_text            TEXT NOT NULL,
    raw_author_name     TEXT,
    raw_author_handle   TEXT,
    raw_platform        TEXT DEFAULT 'facebook',        -- facebook | reddit | telegram | other
    raw_group_name      TEXT,
    raw_posted_at       TIMESTAMPTZ,
    raw_metadata        JSONB DEFAULT '{}',

    -- Compliance
    opt_in_verified     BOOLEAN NOT NULL DEFAULT false,
    consent_reference   TEXT,                           -- consent log ID or proof reference
    
    -- Processing state
    processed           BOOLEAN DEFAULT false,
    processed_at        TIMESTAMPTZ,
    classification_id   UUID,                          -- FK to social_classifications

    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spi_source_idx ON public.social_post_imports (import_source, created_at DESC);
CREATE INDEX IF NOT EXISTS spi_unprocessed_idx ON public.social_post_imports (processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS spi_platform_idx ON public.social_post_imports (raw_platform);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. AI CLASSIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.social_classifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id           UUID NOT NULL REFERENCES public.social_post_imports(id) ON DELETE CASCADE,
    model_version       TEXT NOT NULL DEFAULT 'social_intent_v1',
    
    -- Primary classification
    intent_class        public.social_intent_class NOT NULL,
    confidence          NUMERIC(5,4) NOT NULL,          -- 0.0000-1.0000
    
    -- Secondary signals
    secondary_intents   JSONB DEFAULT '[]',             -- [{class, confidence}]
    
    -- Extracted entities
    origin_city         TEXT,
    origin_state        TEXT,
    destination_city    TEXT,
    destination_state   TEXT,
    load_type           TEXT,
    urgency_level       TEXT,                           -- low | medium | high | critical
    escort_count        INT,
    contact_present     BOOLEAN DEFAULT false,
    
    -- Extended extraction
    extracted_phone     TEXT,
    extracted_email     TEXT,
    estimated_date      DATE,
    equipment_type      TEXT,
    rate_mentioned      NUMERIC(10,2),
    
    -- Quality
    extraction_quality  NUMERIC(5,4) DEFAULT 0.0,      -- 0-1 overall quality score
    human_reviewed      BOOLEAN DEFAULT false,
    human_override_class TEXT,

    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sc_import_idx ON public.social_classifications (import_id);
CREATE INDEX IF NOT EXISTS sc_intent_idx ON public.social_classifications (intent_class, confidence DESC);
CREATE INDEX IF NOT EXISTS sc_origin_idx ON public.social_classifications (origin_state, origin_city);
CREATE INDEX IF NOT EXISTS sc_dest_idx ON public.social_classifications (destination_state, destination_city);
CREATE INDEX IF NOT EXISTS sc_urgency_idx ON public.social_classifications (urgency_level) WHERE urgency_level IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS sc_unreviewed_idx ON public.social_classifications (human_reviewed) WHERE human_reviewed = false AND confidence < 0.70;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CLAIM FUNNEL EVENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE public.claim_entry_point AS ENUM (
    'facebook_group_link',
    'bio_link',
    'qr_code',
    'referral_link',
    'seo_organic',
    'vapi_outbound',
    'email_campaign',
    'direct_search'
);

CREATE TYPE public.claim_funnel_step AS ENUM (
    'landed',
    'signup_started',
    'signup_completed',
    'role_selected',
    'profile_started',
    'verification_started',
    'verification_completed',
    'first_action',
    'activated'
);

CREATE TABLE IF NOT EXISTS public.claim_funnel_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          TEXT,                           -- browser session or device ID
    user_id             UUID,                          -- NULL until signup
    entry_point         public.claim_entry_point NOT NULL,
    referral_code       TEXT,
    funnel_step         public.claim_funnel_step NOT NULL,
    
    -- Context
    landing_url         TEXT,
    utm_source          TEXT,
    utm_medium          TEXT,
    utm_campaign        TEXT,
    country_code        VARCHAR(2),
    device_type         TEXT,                          -- mobile | desktop | tablet
    
    -- Role routing
    detected_role       TEXT,                          -- operator | broker | shipper | place_owner
    role_confidence     NUMERIC(5,4),
    
    -- Metadata
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cfe_session_idx ON public.claim_funnel_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS cfe_user_idx ON public.claim_funnel_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cfe_entry_idx ON public.claim_funnel_events (entry_point, created_at DESC);
CREATE INDEX IF NOT EXISTS cfe_step_idx ON public.claim_funnel_events (funnel_step, created_at DESC);
CREATE INDEX IF NOT EXISTS cfe_referral_idx ON public.claim_funnel_events (referral_code) WHERE referral_code IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. AUTHORITY SIGNALS (weekly pulse, response badges, scarcity)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.authority_market_pulses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id         UUID,
    region_code         TEXT,                          -- US-FL, CA-ON, etc.
    pulse_week          DATE NOT NULL,                 -- Monday of the pulse week
    
    -- Supply signals
    active_escorts_count    INT DEFAULT 0,
    new_escorts_count       INT DEFAULT 0,
    avg_response_time_sec   INT,
    
    -- Demand signals
    loads_posted_count      INT DEFAULT 0,
    loads_filled_count      INT DEFAULT 0,
    fill_rate               NUMERIC(5,4) DEFAULT 0.0,
    avg_time_to_fill_hours  NUMERIC(8,2),
    
    -- Market health
    scarcity_score          NUMERIC(5,4) DEFAULT 0.0,  -- 0-1
    price_trend             TEXT,                       -- rising | stable | falling
    corridor_heat           NUMERIC(5,4) DEFAULT 0.0,
    
    -- Computed narrative
    pulse_summary           TEXT,                       -- Human-readable summary
    key_insights            JSONB DEFAULT '[]',         -- [{insight, severity}]
    
    published               BOOLEAN DEFAULT false,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS amp_region_week_idx ON public.authority_market_pulses (region_code, pulse_week);
CREATE INDEX IF NOT EXISTS amp_corridor_idx ON public.authority_market_pulses (corridor_id, pulse_week DESC);
CREATE INDEX IF NOT EXISTS amp_published_idx ON public.authority_market_pulses (published, pulse_week DESC);

-- ── Response Speed Badges ──

CREATE TABLE IF NOT EXISTS public.response_speed_badges (
    user_id             UUID PRIMARY KEY,
    badge_tier          TEXT NOT NULL DEFAULT 'none',    -- none | fast | very_fast | lightning
    avg_response_sec    INT,
    p50_response_sec    INT,
    p90_response_sec    INT,
    sample_size         INT DEFAULT 0,
    qualifying_period   TEXT DEFAULT '90d',
    computed_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Scarcity Alerts ──

CREATE TABLE IF NOT EXISTS public.scarcity_alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id         UUID,
    region_code         TEXT,
    alert_type          TEXT NOT NULL,                  -- low_supply | surge_demand | gap_detected
    severity            TEXT DEFAULT 'medium',          -- low | medium | high | critical
    
    -- Detail
    current_supply      INT,
    current_demand      INT,
    gap_score           NUMERIC(5,4),
    
    -- Notification
    notified            BOOLEAN DEFAULT false,
    notified_count      INT DEFAULT 0,
    
    -- Lifecycle
    active              BOOLEAN DEFAULT true,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sa_active_idx ON public.scarcity_alerts (active, created_at DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS sa_corridor_idx ON public.scarcity_alerts (corridor_id);
CREATE INDEX IF NOT EXISTS sa_region_idx ON public.scarcity_alerts (region_code);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. MONETIZATION TRACKING (phased)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.monetization_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    event_type          TEXT NOT NULL,                  -- boost_purchased | badge_upgrade | featured_listing | lead_routed | subscription_started
    product_key         TEXT NOT NULL,                  -- priority_job_boost | verified_badge | featured_listing | etc.
    phase               INT NOT NULL DEFAULT 1,        -- 1, 2, or 3
    amount_cents        INT DEFAULT 0,
    currency            VARCHAR(3) DEFAULT 'USD',
    stripe_payment_id   TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS me_user_idx ON public.monetization_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS me_product_idx ON public.monetization_events (product_key, created_at DESC);
CREATE INDEX IF NOT EXISTS me_phase_idx ON public.monetization_events (phase);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.social_post_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_market_pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_speed_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scarcity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_events ENABLE ROW LEVEL SECURITY;

-- Social imports: service_role only (admin/system ingestion)
CREATE POLICY spi_sr ON public.social_post_imports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Classifications: service_role only
CREATE POLICY sc_sr ON public.social_classifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Funnel events: service_role write, own-user read
CREATE POLICY cfe_own_read ON public.claim_funnel_events FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY cfe_sr ON public.claim_funnel_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Market pulses: public read when published
CREATE POLICY amp_public_read ON public.authority_market_pulses FOR SELECT USING (published = true);
CREATE POLICY amp_sr ON public.authority_market_pulses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Response badges: public read
CREATE POLICY rsb_public_read ON public.response_speed_badges FOR SELECT USING (true);
CREATE POLICY rsb_sr ON public.response_speed_badges FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Scarcity alerts: public read when active
CREATE POLICY sal_public_read ON public.scarcity_alerts FOR SELECT USING (active = true);
CREATE POLICY sal_sr ON public.scarcity_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Monetization events: own-user read
CREATE POLICY me_own_read ON public.monetization_events FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY me_sr ON public.monetization_events FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
