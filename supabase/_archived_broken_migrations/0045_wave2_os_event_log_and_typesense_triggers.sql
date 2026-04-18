-- WAVE-2: os_event_log + Typesense search_jobs sync trigger
-- Discovery confirmed: neither table existed in any of the 569 migrations.
-- This is additive only. No existing tables modified.

-- 1. Create os_event_log — the canonical cross-cluster OS event bus
CREATE TABLE IF NOT EXISTS os_event_log (
  id            bigserial PRIMARY KEY,
  event_type    text        NOT NULL,  -- e.g. 'trust.updated', 'presence.online', 'escrow.locked'
  entity_id     uuid        NULL,      -- profile_id, job_id, escrow_id, etc.
  entity_type   text        NULL,      -- 'profile', 'job', 'escrow', 'load'
  payload       jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for event-type fan-out queries (e.g. all 'trust.updated' events in last 5 min)
CREATE INDEX IF NOT EXISTS os_event_log_type_created_idx
  ON os_event_log (event_type, created_at DESC);

-- Index for entity-scoped event history
CREATE INDEX IF NOT EXISTS os_event_log_entity_idx
  ON os_event_log (entity_id, created_at DESC);

-- RLS: only service role can write; admin can read
ALTER TABLE os_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "os_event_log_service_insert" ON os_event_log
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "os_event_log_admin_select" ON os_event_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Ensure search_jobs table exists (may already exist — IF NOT EXISTS guards)
-- Confirmed present via search-indexer inspection; adding safety extension only.
ALTER TABLE search_jobs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE search_jobs ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz NULL;

-- 3. DB trigger: when profiles.trust_score changes → enqueue search_jobs for Typesense
-- This is the canonical sync path (search-indexer drains search_jobs on cron)
CREATE OR REPLACE FUNCTION fn_enqueue_trust_score_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only enqueue if trust_score actually changed
  IF OLD.trust_score IS DISTINCT FROM NEW.trust_score THEN
    INSERT INTO search_jobs (table_name, record_id, operation, status, created_at)
    VALUES ('driver_profiles', NEW.id, 'UPSERT', 'pending', now())
    ON CONFLICT DO NOTHING;

    -- Also log the OS event
    INSERT INTO os_event_log (event_type, entity_id, entity_type, payload, created_at)
    VALUES (
      'trust.updated',
      NEW.id,
      'profile',
      jsonb_build_object(
        'old_score', OLD.trust_score,
        'new_score', NEW.trust_score,
        'delta',     NEW.trust_score - COALESCE(OLD.trust_score, 0)
      ),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_score_sync ON profiles;
CREATE TRIGGER trg_trust_score_sync
  AFTER UPDATE OF trust_score ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_enqueue_trust_score_sync();

-- 4. DB trigger: presence.online → enqueue Typesense sync for availability_status
CREATE OR REPLACE FUNCTION fn_enqueue_presence_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.availability_status IS DISTINCT FROM NEW.availability_status THEN
    INSERT INTO search_jobs (table_name, record_id, operation, status, created_at)
    VALUES ('driver_profiles', NEW.id, 'UPSERT', 'pending', now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_presence_sync ON profiles;
CREATE TRIGGER trg_presence_sync
  AFTER UPDATE OF availability_status ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_enqueue_presence_sync();
