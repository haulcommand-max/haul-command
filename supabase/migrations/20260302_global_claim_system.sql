-- ═══════════════════════════════════════════════════════════════════════
-- GLOBAL CLAIM SYSTEM — Phase 1: Schema + Data Layer
-- Covers: surfaces claim fields, claims table, outreach events,
-- audit log, and priority scoring RPC.
--
-- Supports 52 countries, 6 verification routes, multi-channel outreach,
-- anti-fraud controls, and dispute workflow.
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1) CLAIM STATUS TYPE
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE claim_status_enum AS ENUM (
        'unclaimed',
        'claimable',
        'pending_verification',
        'claimed',
        'disputed',
        'locked'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_verification_route AS ENUM (
        'dns',
        'website_token',
        'email_otp',
        'sms_otp',
        'document',
        'manual'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_step_status AS ENUM (
        'initiated',
        'otp_sent',
        'otp_verified',
        'review',
        'approved',
        'rejected',
        'disputed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE outreach_channel AS ENUM (
        'email',
        'sms',
        'whatsapp',
        'in_app',
        'voice'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE outreach_event_status AS ENUM (
        'queued',
        'sent',
        'delivered',
        'opened',
        'clicked',
        'bounced',
        'failed',
        'replied'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2) SURFACES — Add claim columns to existing surfaces
-- ────────────────────────────────────────────────────────────
-- If a unified surfaces table doesn't exist yet, create it.
-- Otherwise, ALTER TABLE to add claim columns.

CREATE TABLE IF NOT EXISTS surfaces (
    id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code                text NOT NULL DEFAULT 'US',
    surface_type                text NOT NULL,  -- operator_profile, port, hotel, motel, facility, service_provider, etc.
    name                        text NOT NULL,
    slug                        text,
    address                     text,
    city                        text,
    state_region                text,
    postal_code                 text,
    geo                         geography(POINT, 4326),
    phone                       text,
    email                       text,
    website                     text,
    socials                     jsonb DEFAULT '{}',

    -- Claim fields
    claim_status                text NOT NULL DEFAULT 'unclaimed',
    claim_priority_score        numeric(5,2) DEFAULT 0,
    claim_priority_tier         text DEFAULT 'D',   -- A/B/C/D
    claim_owner_id              uuid REFERENCES auth.users(id),
    claim_methods_available     text[] DEFAULT '{}',

    -- Scoring inputs
    data_confidence_score       numeric(3,2) DEFAULT 0.5,
    monetization_score          numeric(3,2) DEFAULT 0.3,
    liquidity_score             numeric(3,2) DEFAULT 0.3,
    contactability_score        numeric(3,2) DEFAULT 0.0,
    freshness_score             numeric(3,2) DEFAULT 0.5,
    risk_score                  numeric(3,2) DEFAULT 0.1,

    -- Outreach tracking
    last_outreach_at            timestamptz,
    next_outreach_at            timestamptz,
    outreach_attempts_30d       int DEFAULT 0,
    outreach_step               int DEFAULT 0,

    -- Activity
    last_seen_activity_at       timestamptz,
    audit_hash                  text,

    -- Metadata
    source                      text,           -- how this surface was created (import, scrape, user_created, etc.)
    source_id                   text,           -- ID in the source system for dedup
    metadata                    jsonb DEFAULT '{}',

    created_at                  timestamptz DEFAULT now(),
    updated_at                  timestamptz DEFAULT now()
);

-- Indexes for claim system queries
CREATE INDEX IF NOT EXISTS idx_surfaces_claim_status ON surfaces (claim_status);
CREATE INDEX IF NOT EXISTS idx_surfaces_priority ON surfaces (claim_priority_score DESC) WHERE claim_status IN ('unclaimed', 'claimable');
CREATE INDEX IF NOT EXISTS idx_surfaces_country ON surfaces (country_code);
CREATE INDEX IF NOT EXISTS idx_surfaces_type ON surfaces (surface_type);
CREATE INDEX IF NOT EXISTS idx_surfaces_owner ON surfaces (claim_owner_id) WHERE claim_owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_surfaces_next_outreach ON surfaces (next_outreach_at) WHERE claim_status IN ('unclaimed', 'claimable') AND next_outreach_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_surfaces_slug ON surfaces (slug);

-- GiST for geo queries
CREATE INDEX IF NOT EXISTS idx_surfaces_geo ON surfaces USING GIST (geo);

-- ────────────────────────────────────────────────────────────
-- 3) CLAIMS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claims (
    id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    surface_id                  uuid NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
    claimant_user_id            uuid NOT NULL REFERENCES auth.users(id),
    country_code                text NOT NULL,
    status                      text NOT NULL DEFAULT 'initiated',
    verification_route          text NOT NULL DEFAULT 'email_otp',
    verification_token          text,                -- OTP or token value (hashed)
    verification_token_expires  timestamptz,
    verification_evidence       text,                -- pointer to stored proof (URL or storage path)
    verification_attempts       int DEFAULT 0,

    created_at                  timestamptz DEFAULT now(),
    updated_at                  timestamptz DEFAULT now(),
    approved_at                 timestamptz,
    rejected_at                 timestamptz,
    rejected_reason             text,
    dispute_id                  uuid
);

CREATE INDEX IF NOT EXISTS idx_claims_surface ON claims (surface_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims (claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims (status);
CREATE INDEX IF NOT EXISTS idx_claims_pending ON claims (status, verification_token_expires)
    WHERE status IN ('initiated', 'otp_sent');

-- ────────────────────────────────────────────────────────────
-- 4) OUTREACH EVENTS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outreach_events (
    id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    surface_id                  uuid NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
    channel                     text NOT NULL DEFAULT 'email',
    template_id                 text NOT NULL,
    status                      text NOT NULL DEFAULT 'queued',
    provider_message_id         text,
    sent_at                     timestamptz,
    delivered_at                timestamptz,
    opened_at                   timestamptz,
    clicked_at                  timestamptz,
    replied_at                  timestamptz,
    metadata                    jsonb DEFAULT '{}',
    created_at                  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_surface ON outreach_events (surface_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_events (status);
CREATE INDEX IF NOT EXISTS idx_outreach_queued ON outreach_events (created_at)
    WHERE status = 'queued';

-- ────────────────────────────────────────────────────────────
-- 5) CLAIM AUDIT LOG (Immutable)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claim_audit_log (
    id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    surface_id                  uuid NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
    claim_id                    uuid REFERENCES claims(id),
    actor                       text NOT NULL DEFAULT 'system',  -- system|user|admin
    action                      text NOT NULL,
    payload                     jsonb DEFAULT '{}',
    created_at                  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_audit_surface ON claim_audit_log (surface_id);
CREATE INDEX IF NOT EXISTS idx_claim_audit_claim ON claim_audit_log (claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_audit_action ON claim_audit_log (action);

-- ────────────────────────────────────────────────────────────
-- 6) DISPUTES TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claim_disputes (
    id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    surface_id                  uuid NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
    initiated_by                uuid NOT NULL REFERENCES auth.users(id),
    against_claim_id            uuid REFERENCES claims(id),
    status                      text NOT NULL DEFAULT 'open',  -- open|evidence_collection|admin_review|resolved
    resolution                  text,  -- restore_owner|transfer_owner|split_admins|reject_claim
    evidence_plaintiff          jsonb DEFAULT '[]',
    evidence_defendant          jsonb DEFAULT '[]',
    admin_notes                 text,
    resolved_by                 uuid REFERENCES auth.users(id),
    created_at                  timestamptz DEFAULT now(),
    resolved_at                 timestamptz
);

CREATE INDEX IF NOT EXISTS idx_disputes_surface ON claim_disputes (surface_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON claim_disputes (status);

-- ────────────────────────────────────────────────────────────
-- 7) OUTREACH SUPPRESSION LIST
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outreach_suppressions (
    id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_value               text NOT NULL,  -- email or phone
    contact_type                text NOT NULL,   -- email|phone
    reason                      text NOT NULL DEFAULT 'opt_out',
    source                      text,            -- user_request|bounce|complaint
    created_at                  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppression_unique ON outreach_suppressions (contact_value, contact_type);

-- ────────────────────────────────────────────────────────────
-- 8) GOVERNOR / KILL SWITCHES TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claim_governor (
    id                          text PRIMARY KEY,  -- e.g., 'outreach_global_pause', 'country_pause_list'
    enabled                     boolean DEFAULT false,
    value                       jsonb DEFAULT '{}',
    updated_at                  timestamptz DEFAULT now(),
    updated_by                  text DEFAULT 'system'
);

-- Seed governor defaults
INSERT INTO claim_governor (id, enabled, value) VALUES
    ('outreach_global_pause', false, '{}'),
    ('country_pause_list', false, '[]'),
    ('surface_type_pause_list', false, '[]'),
    ('rate_limit_outreach_per_hour', true, '{"global": 4000, "per_country": 300}'),
    ('rate_limit_otp_per_hour', true, '{"global": 2500}')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 9) CLAIM PRIORITY SCORING RPC
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_claim_priority_score(p_surface_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE surfaces SET
        -- Contactability derived from available contact channels
        contactability_score = CASE
            WHEN phone IS NOT NULL AND email IS NOT NULL AND website IS NOT NULL THEN 1.0
            WHEN phone IS NOT NULL AND email IS NOT NULL THEN 0.8
            WHEN email IS NOT NULL AND website IS NOT NULL THEN 0.7
            WHEN phone IS NOT NULL THEN 0.5
            WHEN email IS NOT NULL THEN 0.4
            WHEN website IS NOT NULL THEN 0.3
            ELSE 0.0
        END,

        -- Available claim methods
        claim_methods_available = ARRAY(
            SELECT unnest FROM unnest(
                ARRAY[
                    CASE WHEN website IS NOT NULL THEN 'dns' ELSE NULL END,
                    CASE WHEN website IS NOT NULL THEN 'website_token' ELSE NULL END,
                    CASE WHEN email IS NOT NULL THEN 'email_otp' ELSE NULL END,
                    CASE WHEN phone IS NOT NULL THEN 'sms_otp' ELSE NULL END,
                    'document',
                    'manual'
                ]
            ) WHERE unnest IS NOT NULL
        ),

        -- Freshness from last_seen_activity_at
        freshness_score = CASE
            WHEN last_seen_activity_at IS NULL THEN 0.3
            WHEN last_seen_activity_at > now() - interval '7 days' THEN 1.0
            WHEN last_seen_activity_at > now() - interval '30 days' THEN 0.7
            WHEN last_seen_activity_at > now() - interval '90 days' THEN 0.4
            ELSE 0.2
        END,

        -- Priority score = weighted sum - penalties
        claim_priority_score = GREATEST(0, LEAST(100,
            (monetization_score * 30) +
            (liquidity_score * 30) +
            (data_confidence_score * 15) +
            -- Use computed contactability inline
            (CASE
                WHEN phone IS NOT NULL AND email IS NOT NULL AND website IS NOT NULL THEN 15.0
                WHEN phone IS NOT NULL AND email IS NOT NULL THEN 12.0
                WHEN email IS NOT NULL AND website IS NOT NULL THEN 10.5
                WHEN phone IS NOT NULL THEN 7.5
                WHEN email IS NOT NULL THEN 6.0
                WHEN website IS NOT NULL THEN 4.5
                ELSE 0.0
            END) +
            -- Freshness inline
            (CASE
                WHEN last_seen_activity_at IS NULL THEN 3.0
                WHEN last_seen_activity_at > now() - interval '7 days' THEN 10.0
                WHEN last_seen_activity_at > now() - interval '30 days' THEN 7.0
                WHEN last_seen_activity_at > now() - interval '90 days' THEN 4.0
                ELSE 2.0
            END) -
            -- Penalties
            (risk_score * 25) -
            (outreach_attempts_30d * 3)
        )),

        -- Tier
        claim_priority_tier = CASE
            WHEN claim_priority_score >= 80 THEN 'A'
            WHEN claim_priority_score >= 65 THEN 'B'
            WHEN claim_priority_score >= 45 THEN 'C'
            ELSE 'D'
        END,

        -- Set claimable if unclaimed and has at least one contact method
        claim_status = CASE
            WHEN claim_status = 'unclaimed' AND (phone IS NOT NULL OR email IS NOT NULL OR website IS NOT NULL)
                THEN 'claimable'
            ELSE claim_status
        END,

        updated_at = now()

    WHERE claim_status IN ('unclaimed', 'claimable')
      AND (p_surface_id IS NULL OR id = p_surface_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 10) CLAIM KPI VIEW
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW claim_kpi_summary AS
SELECT
    country_code,
    surface_type,
    COUNT(*) AS total_surfaces,
    COUNT(*) FILTER (WHERE claim_status = 'claimed') AS claimed,
    COUNT(*) FILTER (WHERE claim_status = 'claimable') AS claimable,
    COUNT(*) FILTER (WHERE claim_status = 'pending_verification') AS pending,
    COUNT(*) FILTER (WHERE claim_status = 'disputed') AS disputed,
    COUNT(*) FILTER (WHERE claim_status = 'locked') AS locked,
    ROUND(
        COUNT(*) FILTER (WHERE claim_status = 'claimed')::numeric /
        NULLIF(COUNT(*), 0) * 100, 1
    ) AS claimed_pct,
    ROUND(AVG(claim_priority_score), 1) AS avg_priority_score,
    COUNT(*) FILTER (WHERE claim_priority_tier = 'A') AS tier_a_count,
    COUNT(*) FILTER (WHERE claim_priority_tier = 'B') AS tier_b_count,
    COUNT(*) FILTER (WHERE claim_priority_tier = 'C') AS tier_c_count,
    COUNT(*) FILTER (WHERE claim_priority_tier = 'D') AS tier_d_count
FROM surfaces
GROUP BY country_code, surface_type;

-- ────────────────────────────────────────────────────────────
-- 11) RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE surfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_disputes ENABLE ROW LEVEL SECURITY;

-- Public can read surfaces
CREATE POLICY "surfaces_public_read" ON surfaces FOR SELECT USING (true);

-- Only claim owner can update their claimed surface
CREATE POLICY "surfaces_owner_update" ON surfaces FOR UPDATE
    USING (claim_owner_id = auth.uid())
    WITH CHECK (claim_owner_id = auth.uid());

-- Users can read their own claims
CREATE POLICY "claims_own_read" ON claims FOR SELECT
    USING (claimant_user_id = auth.uid());

-- Users can create claims
CREATE POLICY "claims_create" ON claims FOR INSERT
    WITH CHECK (claimant_user_id = auth.uid());

-- Users can read their own outreach events
CREATE POLICY "outreach_read" ON outreach_events FOR SELECT USING (true);

-- Audit log is read-only for everyone (insert via RPC only)
CREATE POLICY "audit_log_read" ON claim_audit_log FOR SELECT USING (true);

-- Disputes: can view own
CREATE POLICY "disputes_own_read" ON claim_disputes FOR SELECT
    USING (initiated_by = auth.uid());

-- Disputes: can create
CREATE POLICY "disputes_create" ON claim_disputes FOR INSERT
    WITH CHECK (initiated_by = auth.uid());
