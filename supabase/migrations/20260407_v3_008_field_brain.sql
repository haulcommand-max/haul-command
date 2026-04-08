-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 008: Field Brain / Offline
-- ============================================================================
-- Prerequisites: block 001 (enums)
-- FK order: packs → skill_packs → sync_jobs → offline_actions
-- Mostly service-managed, minimal RLS exposure
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. hc_offline_packs — Downloadable data packs by country/language
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_offline_packs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_type       TEXT NOT NULL
                    CHECK (pack_type IN ('requirements', 'glossary', 'regulations', 'checklists', 'training', 'rates')),
    country_code    TEXT NOT NULL,
    language_code   TEXT NOT NULL DEFAULT 'en',
    version         TEXT NOT NULL,                               -- semver e.g. '2026.04.07.2'
    content_hash    TEXT NOT NULL,                                -- SHA-256 for cache busting
    file_url        TEXT NOT NULL,                               -- storage path
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    content_summary JSONB NOT NULL DEFAULT '{}',                 -- what's included
    is_published    BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    download_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pack_type, country_code, language_code, version)
);

CREATE INDEX IF NOT EXISTS idx_hcop_country ON hc_offline_packs (country_code, language_code);
CREATE INDEX IF NOT EXISTS idx_hcop_published ON hc_offline_packs (is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_hcop_type ON hc_offline_packs (pack_type);

CREATE TRIGGER hc_offline_packs_updated_at BEFORE UPDATE ON hc_offline_packs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. hc_mobile_skill_packs — Lightweight skill definitions for offline execution
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_mobile_skill_packs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_key       TEXT NOT NULL,
    platform        TEXT NOT NULL DEFAULT 'both'
                    CHECK (platform IN ('ios', 'android', 'both')),
    version         TEXT NOT NULL,
    skill_definition JSONB NOT NULL DEFAULT '{}',               -- simplified skill steps for offline
    requires_connectivity BOOLEAN NOT NULL DEFAULT false,
    file_url        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (skill_key, platform, version)
);

CREATE TRIGGER hc_mobile_skill_packs_updated_at BEFORE UPDATE ON hc_mobile_skill_packs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. hc_device_sync_jobs — Device-level sync tracking
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_device_sync_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       TEXT NOT NULL,
    user_id         UUID NOT NULL,
    sync_type       TEXT NOT NULL DEFAULT 'full'
                    CHECK (sync_type IN ('full', 'incremental', 'packs_only', 'actions_only')),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'syncing', 'completed', 'failed')),
    packs_synced    INTEGER NOT NULL DEFAULT 0,
    actions_uploaded INTEGER NOT NULL DEFAULT 0,
    bytes_transferred BIGINT NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcdsj_device ON hc_device_sync_jobs (device_id, user_id);
CREATE INDEX IF NOT EXISTS idx_hcdsj_status ON hc_device_sync_jobs (status) WHERE status IN ('pending', 'syncing');

CREATE TRIGGER hc_device_sync_jobs_updated_at BEFORE UPDATE ON hc_device_sync_jobs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. hc_offline_actions — Actions performed offline, synced later
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_offline_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       TEXT NOT NULL,
    user_id         UUID NOT NULL,
    action_type     TEXT NOT NULL,                               -- 'inspection.completed', 'availability.updated', 'checklist.submitted'
    payload         JSONB NOT NULL DEFAULT '{}',
    recorded_at     TIMESTAMPTZ NOT NULL,                        -- when it happened on device
    synced_at       TIMESTAMPTZ,                                 -- when server received it
    processing_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (processing_status IN ('pending', 'processed', 'failed', 'duplicate')),
    promoted_to     TEXT,                                        -- target table/event after processing
    promoted_id     UUID,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcoa_device ON hc_offline_actions (device_id, user_id);
CREATE INDEX IF NOT EXISTS idx_hcoa_status ON hc_offline_actions (processing_status) WHERE processing_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_hcoa_recorded ON hc_offline_actions (recorded_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hc_offline_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_mobile_skill_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_device_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_offline_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_offline_packs_service ON hc_offline_packs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_mobile_skill_packs_service ON hc_mobile_skill_packs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_device_sync_jobs_service ON hc_device_sync_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_offline_actions_service ON hc_offline_actions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated: read published offline packs
CREATE POLICY hc_offline_packs_auth_read ON hc_offline_packs FOR SELECT TO authenticated
    USING (is_published = true);

-- Device owner: see own sync jobs and actions
CREATE POLICY hc_device_sync_jobs_self ON hc_device_sync_jobs FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY hc_offline_actions_self ON hc_offline_actions FOR SELECT TO authenticated
    USING (user_id = auth.uid());
