-- ═══════════════════════════════════════════════════════════════
-- WAVE 3: SEARCH & DISCOVERY — Typesense Sync Triggers (S3-02)
-- Migration: 20260412_wave3_typesense_sync_triggers.sql
--
-- GROUND TRUTH (verified via REST API 2026-04-11):
--   ✅ search_jobs         — EXISTS
--   ✅ glossary_terms      — EXISTS (was: glo_terms — WRONG)
--   ✅ listings            — EXISTS (was: directory_listings — WRONG)
--   ✅ hc_global_operators — EXISTS
--   ✅ corridors           — EXISTS
--   ✅ loads               — EXISTS
--   ✅ profiles            — EXISTS
--   ❌ driver_profiles     — MISSING (RLS-blocked, skip trigger)
--   ❌ os_event_log        — MISSING (create here)
--
-- Additive only. No destructive changes.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. os_event_log — canonical cross-cluster OS event bus
--    (Wave 2 migration 0045 not yet applied — create here)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_event_log (
    id            bigserial    PRIMARY KEY,
    event_type    text         NOT NULL,
    entity_id     uuid         NULL,
    entity_type   text         NULL,
    payload       jsonb        NOT NULL DEFAULT '{}',
    created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS os_event_log_type_created_idx
    ON os_event_log (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS os_event_log_entity_idx
    ON os_event_log (entity_id, created_at DESC);

ALTER TABLE os_event_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'os_event_log' AND policyname = 'os_event_log_service_insert'
  ) THEN
    CREATE POLICY "os_event_log_service_insert" ON os_event_log
      FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'os_event_log' AND policyname = 'os_event_log_admin_select'
  ) THEN
    CREATE POLICY "os_event_log_admin_select" ON os_event_log
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Extend search_jobs with retry columns (additive)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE search_jobs ADD COLUMN IF NOT EXISTS attempts        integer      NOT NULL DEFAULT 0;
ALTER TABLE search_jobs ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz  NULL;

-- Pending-jobs index
CREATE INDEX IF NOT EXISTS idx_search_jobs_pending
    ON search_jobs (status, created_at)
    WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────
-- 3. Generic enqueue function for all table triggers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_enqueue_search_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO search_jobs (table_name, record_id, operation, status, created_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', 'pending', now())
        ON CONFLICT DO NOTHING;
    ELSE
        INSERT INTO search_jobs (table_name, record_id, operation, status, created_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPSERT', 'pending', now())
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NULL;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. Trust-score change trigger on profiles
--    (Tracks reliability_score which is the verified column on profiles)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_enqueue_trust_score_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF OLD.reliability_score IS DISTINCT FROM NEW.reliability_score THEN
        -- Enqueue Typesense sync
        INSERT INTO search_jobs (table_name, record_id, operation, status, created_at)
        VALUES ('profiles', NEW.id, 'UPSERT', 'pending', now())
        ON CONFLICT DO NOTHING;

        -- OS event bus
        INSERT INTO os_event_log (event_type, entity_id, entity_type, payload, created_at)
        VALUES (
            'trust.updated',
            NEW.id,
            'profile',
            jsonb_build_object(
                'old_score', OLD.reliability_score,
                'new_score', NEW.reliability_score,
                'delta',     NEW.reliability_score - COALESCE(OLD.reliability_score, 0)
            ),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_score_sync ON profiles;
CREATE TRIGGER trg_trust_score_sync
    AFTER UPDATE OF reliability_score ON profiles
    FOR EACH ROW EXECUTE FUNCTION fn_enqueue_trust_score_sync();

-- ─────────────────────────────────────────────────────────────
-- 5. Full-row sync triggers on canonical search tables
-- ─────────────────────────────────────────────────────────────

-- profiles — full row sync on any change
DROP TRIGGER IF EXISTS trg_search_sync_profiles ON profiles;
CREATE TRIGGER trg_search_sync_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION fn_enqueue_search_job();

-- glossary_terms (real table name confirmed)
DROP TRIGGER IF EXISTS trg_search_sync_glossary_terms ON glossary_terms;
CREATE TRIGGER trg_search_sync_glossary_terms
    AFTER INSERT OR UPDATE OR DELETE ON glossary_terms
    FOR EACH ROW EXECUTE FUNCTION fn_enqueue_search_job();

-- (listings is a view, so we skip adding a trigger to it. Its source tables will trigger the sync.)

-- hc_global_operators
DROP TRIGGER IF EXISTS trg_search_sync_hc_global_operators ON hc_global_operators;
CREATE TRIGGER trg_search_sync_hc_global_operators
    AFTER INSERT OR UPDATE OR DELETE ON hc_global_operators
    FOR EACH ROW EXECUTE FUNCTION fn_enqueue_search_job();

-- corridors
DROP TRIGGER IF EXISTS trg_search_sync_corridors ON corridors;
CREATE TRIGGER trg_search_sync_corridors
    AFTER INSERT OR UPDATE OR DELETE ON corridors
    FOR EACH ROW EXECUTE FUNCTION fn_enqueue_search_job();

-- loads
DROP TRIGGER IF EXISTS trg_search_sync_loads ON loads;
CREATE TRIGGER trg_search_sync_loads
    AFTER INSERT OR UPDATE OR DELETE ON loads
    FOR EACH ROW EXECUTE FUNCTION fn_enqueue_search_job();

-- ─────────────────────────────────────────────────────────────
-- 6. COLLECTION_MAP correction log (reference for search-indexer)
-- ─────────────────────────────────────────────────────────────
-- search-indexer COLLECTION_MAP must use these real table names:
--   glossary_terms  → collection: "glossary_terms"
--   listings        → collection: "listings"
--   profiles        → collection: "profiles"
-- (search-indexer was updated separately in codebase)

-- ─────────────────────────────────────────────────────────────
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS trg_search_sync_* ON <table>;
--   DROP TRIGGER IF EXISTS trg_trust_score_sync ON profiles;
--   DROP FUNCTION IF EXISTS fn_enqueue_search_job();
--   DROP FUNCTION IF EXISTS fn_enqueue_trust_score_sync();
--   DROP TABLE IF EXISTS os_event_log;
-- ─────────────────────────────────────────────────────────────
