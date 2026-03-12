-- =========================================================================
-- HAUL COMMAND — Pilot Car Media + Gear Verification Schema
-- Migration: pilot_car_media_gear_verification
-- =========================================================================

-- ── 1. MEDIA SLOTS ENUM ─────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE media_slot_type AS ENUM (
        'vehicle_front_3qtr', 'vehicle_side', 'vehicle_rear',
        'roof_beacon_setup', 'flags_signs_poles', 'radios_comms_setup',
        'safety_gear_layout', 'optional_night_visibility',
        'optional_support_equipment', 'optional_trailer_or_additional_vehicle'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_state AS ENUM (
        'self_reported', 'photo_backed', 'document_backed', 'haul_command_verified'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_state AS ENUM (
        'pending', 'approved', 'rejected', 'flagged', 'expired'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE media_visibility AS ENUM (
        'public', 'subscriber_only', 'private_owner_only'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE media_source_type AS ENUM (
        'upload', 'camera', 'url_import', 'admin_seed', 'scrape'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE blur_state AS ENUM (
        'none', 'auto_blurred', 'manual_blurred', 'nsfw_blocked'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. OPERATOR MEDIA TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_media (
    media_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL,
    operator_id     UUID,
    slot_type       media_slot_type NOT NULL,
    country_code    TEXT NOT NULL DEFAULT 'US',
    locale          TEXT NOT NULL DEFAULT 'en-US',

    -- Asset URLs (stable, versioned)
    original_url    TEXT NOT NULL,
    optimized_url   TEXT,
    stable_asset_url TEXT GENERATED ALWAYS AS (
        '/media/operators/' || listing_id || '/' || slot_type || '.webp'
    ) STORED,
    seo_filename    TEXT GENERATED ALWAYS AS (
        'haul-command-' || REPLACE(slot_type::text, '_', '-') || '-' || SUBSTRING(listing_id::text, 1, 8)
    ) STORED,

    -- Dimensions
    width           INT,
    height          INT,

    -- Timestamps
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- States
    verification_state  verification_state NOT NULL DEFAULT 'self_reported',
    moderation_state    moderation_state NOT NULL DEFAULT 'pending',
    visibility          media_visibility NOT NULL DEFAULT 'public',
    blur                blur_state NOT NULL DEFAULT 'none',
    source_type         media_source_type NOT NULL DEFAULT 'upload',

    -- Flags
    is_primary      BOOLEAN NOT NULL DEFAULT false,

    -- Freshness (0-100, decays over time)
    freshness_score INT NOT NULL DEFAULT 100
        CHECK (freshness_score >= 0 AND freshness_score <= 100),

    -- Localized metadata (JSONB for flexibility)
    alt_text_by_locale  JSONB NOT NULL DEFAULT '{}'::jsonb,
    caption_by_locale   JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT fk_listing FOREIGN KEY (listing_id)
        REFERENCES directory_entities(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operator_media_listing ON operator_media(listing_id);
CREATE INDEX IF NOT EXISTS idx_operator_media_slot ON operator_media(slot_type);
CREATE INDEX IF NOT EXISTS idx_operator_media_moderation ON operator_media(moderation_state);
CREATE INDEX IF NOT EXISTS idx_operator_media_verification ON operator_media(verification_state);
CREATE INDEX IF NOT EXISTS idx_operator_media_visibility ON operator_media(visibility);
CREATE UNIQUE INDEX IF NOT EXISTS idx_operator_media_primary
    ON operator_media(listing_id) WHERE is_primary = true;

-- ── 3. CAPABILITY CHECKLIST TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_capabilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL,
    capability_key  TEXT NOT NULL,
    capability_label TEXT NOT NULL,
    is_present      BOOLEAN NOT NULL DEFAULT false,
    verification_state verification_state NOT NULL DEFAULT 'self_reported',
    evidence_media_id UUID REFERENCES operator_media(media_id),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_cap_listing FOREIGN KEY (listing_id)
        REFERENCES directory_entities(id) ON DELETE CASCADE,
    CONSTRAINT uq_listing_capability UNIQUE (listing_id, capability_key)
);

-- Seed capability definitions
CREATE TABLE IF NOT EXISTS capability_definitions (
    capability_key  TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL DEFAULT 'general',
    icon_id         TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    is_critical     BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO capability_definitions (capability_key, label, description, category, icon_id, sort_order, is_critical)
VALUES
    ('beacon',              'Roof Beacon',            'Amber/LED roof-mounted beacon bar', 'safety', 'roof_beacon_setup', 1, true),
    ('signs',               'Oversize Signs',         'OVERSIZE LOAD / WIDE LOAD signs', 'safety', 'flags_signs_poles', 2, true),
    ('flags',               'Flags',                  'Red/orange safety flags', 'safety', 'flags_signs_poles', 3, true),
    ('poles',               'Height Poles',            'Adjustable height measurement poles', 'equipment', 'flags_signs_poles', 4, true),
    ('radios',              'Two-Way Radios',          'CB radio and/or handheld radios', 'communication', 'radios_comms_setup', 5, true),
    ('ppe',                 'PPE Kit',                 'Personal protective equipment (vest, hard hat, boots)', 'safety', 'safety_gear_layout', 6, true),
    ('night_capable',       'Night Capable',           'Equipped for nighttime escort operations', 'capability', 'optional_night_visibility', 7, false),
    ('weekend_capable',     'Weekend Available',       'Available for weekend operations', 'availability', NULL, 8, false),
    ('regional_coverage',   'Regional Coverage',       'Multi-state or multi-province coverage', 'capability', NULL, 9, false),
    ('support_equipment',   'Support Equipment',       'Additional safety/support equipment', 'equipment', 'optional_support_equipment', 10, false),
    ('additional_vehicle',  'Additional Escort Vehicle', 'Second escort vehicle available', 'capability', 'optional_trailer_or_additional_vehicle', 11, false),
    ('dot_registered',      'DOT Registered',          'US DOT number on file', 'compliance', NULL, 12, true),
    ('insured',             'Insured ($1M+)',          'Active liability insurance $1M minimum', 'compliance', NULL, 13, true),
    ('twic',                'TWIC Card',               'Transportation Worker Identification Credential', 'compliance', NULL, 14, false),
    ('first_aid',           'First Aid Kit',           'Vehicle-mounted first aid kit', 'safety', 'safety_gear_layout', 15, false),
    ('fire_extinguisher',   'Fire Extinguisher',       'Vehicle-mounted fire extinguisher', 'safety', 'safety_gear_layout', 16, false),
    ('dashcam',             'Dashcam',                 'Forward-facing dashcam or dual-cam', 'equipment', NULL, 17, false)
ON CONFLICT (capability_key) DO NOTHING;

-- ── 4. PROFILE COMPLETENESS SCORES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_completeness (
    listing_id      UUID PRIMARY KEY,
    total_score     INT NOT NULL DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
    media_score     INT NOT NULL DEFAULT 0 CHECK (media_score >= 0 AND media_score <= 100),
    capability_score INT NOT NULL DEFAULT 0 CHECK (capability_score >= 0 AND capability_score <= 100),
    verification_score INT NOT NULL DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
    responsiveness_score INT NOT NULL DEFAULT 0 CHECK (responsiveness_score >= 0 AND responsiveness_score <= 100),
    recency_score   INT NOT NULL DEFAULT 0 CHECK (recency_score >= 0 AND recency_score <= 100),
    missing_items   JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_completeness_listing FOREIGN KEY (listing_id)
        REFERENCES directory_entities(id) ON DELETE CASCADE
);

-- ── 5. REPORT CARDS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_report_cards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL UNIQUE,
    claim_state     TEXT NOT NULL DEFAULT 'unclaimed',
    public_visible  BOOLEAN NOT NULL DEFAULT true,
    subscriber_visible BOOLEAN NOT NULL DEFAULT true,

    -- Score components
    identity_score      INT NOT NULL DEFAULT 0,
    completeness_score  INT NOT NULL DEFAULT 0,
    media_completeness  INT NOT NULL DEFAULT 0,
    gear_presence       INT NOT NULL DEFAULT 0,
    verification_level  verification_state NOT NULL DEFAULT 'self_reported',
    responsiveness_pct  INT NOT NULL DEFAULT 0,
    freshness_pct       INT NOT NULL DEFAULT 0,
    service_area_confidence INT NOT NULL DEFAULT 0,
    trust_flags         JSONB NOT NULL DEFAULT '[]'::jsonb,
    broker_summary      TEXT,

    -- Aggregate trust score
    overall_trust_score INT NOT NULL DEFAULT 0 CHECK (overall_trust_score >= 0 AND overall_trust_score <= 100),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rc_listing FOREIGN KEY (listing_id)
        REFERENCES directory_entities(id) ON DELETE CASCADE
);

-- ── 6. VISIBILITY CONTROLS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_visibility (
    listing_id              UUID PRIMARY KEY,
    public_profile_visible  BOOLEAN NOT NULL DEFAULT true,
    public_report_card_visible BOOLEAN NOT NULL DEFAULT true,
    public_media_visible    BOOLEAN NOT NULL DEFAULT true,
    public_contact_visible  BOOLEAN NOT NULL DEFAULT true,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by              UUID,

    CONSTRAINT fk_vis_listing FOREIGN KEY (listing_id)
        REFERENCES directory_entities(id) ON DELETE CASCADE
);

-- ── 7. STALE MEDIA TRACKING ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_freshness_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id        UUID NOT NULL REFERENCES operator_media(media_id) ON DELETE CASCADE,
    previous_score  INT NOT NULL,
    new_score       INT NOT NULL,
    decay_reason    TEXT NOT NULL DEFAULT 'time_decay',
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. RLS POLICIES ─────────────────────────────────────────────────────
ALTER TABLE operator_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_completeness ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_freshness_log ENABLE ROW LEVEL SECURITY;

-- Public read for public media
CREATE POLICY "Public can view approved public media" ON operator_media
    FOR SELECT USING (moderation_state = 'approved' AND visibility = 'public');

-- Authenticated users can view subscriber media
CREATE POLICY "Authenticated can view subscriber media" ON operator_media
    FOR SELECT TO authenticated
    USING (moderation_state = 'approved' AND visibility IN ('public', 'subscriber_only'));

-- Owners can manage their own media
CREATE POLICY "Owners can manage own media" ON operator_media
    FOR ALL TO authenticated
    USING (operator_id = auth.uid())
    WITH CHECK (operator_id = auth.uid());

-- Public can view public report cards
CREATE POLICY "Public can view public report cards" ON operator_report_cards
    FOR SELECT USING (public_visible = true);

-- Authenticated can view subscriber-visible report cards
CREATE POLICY "Auth can view subscriber report cards" ON operator_report_cards
    FOR SELECT TO authenticated
    USING (subscriber_visible = true);

-- Public read for capabilities
CREATE POLICY "Public can view capabilities" ON operator_capabilities
    FOR SELECT USING (true);

-- Public read for completeness
CREATE POLICY "Public can view completeness" ON profile_completeness
    FOR SELECT USING (true);

-- visibility controls only for owners
CREATE POLICY "Owners manage visibility" ON profile_visibility
    FOR ALL TO authenticated
    USING (updated_by = auth.uid())
    WITH CHECK (updated_by = auth.uid());

-- ── 9. FUNCTIONS ────────────────────────────────────────────────────────

-- Compute profile completeness score
CREATE OR REPLACE FUNCTION compute_profile_completeness(p_listing_id UUID)
RETURNS INT AS $$
DECLARE
    v_media_count INT;
    v_cap_count INT;
    v_total_caps INT;
    v_verified BOOLEAN;
    v_has_photo BOOLEAN;
    v_media_score INT := 0;
    v_cap_score INT := 0;
    v_ver_score INT := 0;
    v_total INT := 0;
BEGIN
    -- Media completeness (max 40 pts)
    SELECT COUNT(*) INTO v_media_count
    FROM operator_media
    WHERE listing_id = p_listing_id AND moderation_state = 'approved';
    v_media_score := LEAST(40, v_media_count * 4);

    -- Capability completeness (max 30 pts)
    SELECT COUNT(*) FILTER (WHERE is_present), COUNT(*)
    INTO v_cap_count, v_total_caps
    FROM operator_capabilities WHERE listing_id = p_listing_id;
    IF v_total_caps > 0 THEN
        v_cap_score := LEAST(30, (v_cap_count * 30) / v_total_caps);
    END IF;

    -- Verification (max 30 pts)
    SELECT EXISTS(
        SELECT 1 FROM operator_media
        WHERE listing_id = p_listing_id
        AND verification_state IN ('photo_backed', 'document_backed', 'haul_command_verified')
    ) INTO v_verified;
    IF v_verified THEN v_ver_score := 30; END IF;

    v_total := v_media_score + v_cap_score + v_ver_score;

    -- Upsert
    INSERT INTO profile_completeness (listing_id, total_score, media_score, capability_score, verification_score, computed_at)
    VALUES (p_listing_id, v_total, v_media_score, v_cap_score, v_ver_score, NOW())
    ON CONFLICT (listing_id) DO UPDATE SET
        total_score = v_total, media_score = v_media_score,
        capability_score = v_cap_score, verification_score = v_ver_score,
        computed_at = NOW();

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decay freshness scores (run daily via cron)
CREATE OR REPLACE FUNCTION decay_media_freshness()
RETURNS INT AS $$
DECLARE
    v_count INT := 0;
BEGIN
    UPDATE operator_media SET
        freshness_score = GREATEST(0, freshness_score - CASE
            WHEN uploaded_at < NOW() - INTERVAL '365 days' THEN 20
            WHEN uploaded_at < NOW() - INTERVAL '180 days' THEN 10
            WHEN uploaded_at < NOW() - INTERVAL '90 days' THEN 5
            WHEN uploaded_at < NOW() - INTERVAL '30 days' THEN 2
            ELSE 0
        END),
        updated_at = NOW()
    WHERE freshness_score > 0;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
