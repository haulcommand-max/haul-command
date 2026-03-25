-- ============================================================
-- HAUL COMMAND — AI ORCHESTRATION SCHEMA
-- Migration: 20260325220000_ai_orchestration_layer.sql
-- 
-- Creates all tables for:
--   - AI task orchestration + model runs
--   - Dispatcher agent (loads + matches)
--   - Enrichment agent (operator intelligence)
--   - Event bus
--   - AI task memory (self-improvement)
-- ============================================================

-- Extensions (already enabled, but safe to re-declare)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── AI Orchestration Runs ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_orchestration_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL,
  prompt_hash     TEXT,
  model_used      TEXT NOT NULL,   -- e.g. 'gemini', 'claude', 'gemini → claude'
  output_length   INT,
  cost_usd        DECIMAL(10,6),
  latency_ms      INT,
  confidence_score DECIMAL(4,3),
  user_id         UUID,
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_task_id ON ai_orchestration_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_model ON ai_orchestration_runs(model_used);
CREATE INDEX IF NOT EXISTS idx_ai_runs_created ON ai_orchestration_runs(created_at DESC);

-- ─── AI Task Memory (Self-Improvement) ─────────────────────────

CREATE TABLE IF NOT EXISTS ai_task_memory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_signature    TEXT NOT NULL,    -- hash of similar prompts
  intent              TEXT,
  model_used          TEXT NOT NULL,
  successful_pattern  TEXT NOT NULL,    -- the actual successful output pattern
  outcome_score       DECIMAL(4,3) DEFAULT 0.7,
  usage_count         INT DEFAULT 1,
  last_used_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_score ON ai_task_memory(outcome_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_intent ON ai_task_memory(intent);

-- ─── Event Bus ───────────────────────────────────────────────────
-- (extends existing events table if it exists — idempotent)

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  source      TEXT DEFAULT 'system',
  payload     JSONB DEFAULT '{}',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- Enable realtime on events
ALTER TABLE events REPLICA IDENTITY FULL;

-- ─── Loads (Dispatch Agent) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS hc_loads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin                TEXT NOT NULL,
  destination           TEXT NOT NULL,
  origin_state          TEXT,
  service_type          TEXT NOT NULL,
  distance_miles        DECIMAL(8,2),
  urgency               TEXT DEFAULT 'normal',
  broker_id             UUID,
  notes                 TEXT,
  status                TEXT DEFAULT 'open',  -- open, matched, completed, cancelled
  recommended_price_mid DECIMAL(10,2),
  surge_active          BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hc_loads_status ON hc_loads(status);
CREATE INDEX IF NOT EXISTS idx_hc_loads_state ON hc_loads(origin_state);
CREATE INDEX IF NOT EXISTS idx_hc_loads_created ON hc_loads(created_at DESC);

-- Enable realtime on loads
ALTER TABLE hc_loads REPLICA IDENTITY FULL;

-- ─── Dispatch Matches ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hc_dispatch_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id      UUID NOT NULL REFERENCES hc_loads(id) ON DELETE CASCADE,
  operator_id  UUID NOT NULL,
  match_score  DECIMAL(5,2),
  status       TEXT DEFAULT 'pending',  -- pending, accepted, rejected, completed
  notified_at  TIMESTAMPTZ,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_load ON hc_dispatch_matches(load_id);
CREATE INDEX IF NOT EXISTS idx_matches_operator ON hc_dispatch_matches(operator_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON hc_dispatch_matches(status);

-- Enable realtime
ALTER TABLE hc_dispatch_matches REPLICA IDENTITY FULL;

-- ─── Operator Intelligence (Enrichment Agent) ────────────────────

CREATE TABLE IF NOT EXISTS hc_operator_intelligence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL UNIQUE,
  capabilities    TEXT[] DEFAULT '{}',
  risk_score      DECIMAL(4,3),
  hc_trust_number TEXT UNIQUE,
  enriched_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_op_intel_trust ON hc_operator_intelligence(hc_trust_number);
CREATE INDEX IF NOT EXISTS idx_op_intel_risk ON hc_operator_intelligence(risk_score);

-- ─── Alter hc_places to add new columns (safe, idempotent) ───────

ALTER TABLE hc_places ADD COLUMN IF NOT EXISTS hc_trust_number TEXT UNIQUE;
ALTER TABLE hc_places ADD COLUMN IF NOT EXISTS source_system TEXT DEFAULT 'manual';
ALTER TABLE hc_places ADD COLUMN IF NOT EXISTS enrichment_version TEXT;

CREATE INDEX IF NOT EXISTS idx_places_trust ON hc_places(hc_trust_number) WHERE hc_trust_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_places_source ON hc_places(source_system);
CREATE INDEX IF NOT EXISTS idx_places_unenriched ON hc_places(id) WHERE hc_trust_number IS NULL AND status = 'published';

-- ─── Model Performance Tracking (for self-improvement) ───────────

CREATE TABLE IF NOT EXISTS ai_model_performance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name    TEXT NOT NULL,
  task_intent   TEXT,
  avg_score     DECIMAL(4,3) DEFAULT 0.0,
  total_runs    INT DEFAULT 0,
  total_cost    DECIMAL(10,4) DEFAULT 0,
  avg_latency   INT DEFAULT 0,
  weight        DECIMAL(5,4) DEFAULT 1.0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_model_perf_unique ON ai_model_performance(model_name, task_intent);

-- Seed initial model weights
INSERT INTO ai_model_performance (model_name, task_intent, avg_score, weight)
VALUES
  ('gemini', 'code_generation',     0.90, 1.0),
  ('gemini', 'enrichment',          0.92, 1.2),
  ('gemini', 'dispatch',            0.88, 1.0),
  ('claude',  'mobile_build',       0.92, 1.3),
  ('claude',  'scraping',           0.91, 1.2),
  ('claude',  'architecture_design', 0.97, 1.1),
  ('gpt',     'structured_reasoning', 0.95, 1.0)
ON CONFLICT (model_name, task_intent) DO NOTHING;

-- ─── Cron Audit Log ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cron_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    TEXT NOT NULL,
  status      TEXT DEFAULT 'completed',
  rows_affected INT,
  error_msg   TEXT,
  ran_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_audit_job ON cron_audit(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_audit_ran ON cron_audit(ran_at DESC);

-- ─── RLS Policies ────────────────────────────────────────────────

ALTER TABLE ai_orchestration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_dispatch_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_operator_intelligence ENABLE ROW LEVEL SECURITY;

-- Service role bypass (API routes use service key, so this is fine)
DO $$
BEGIN
  -- ai_orchestration_runs: service role full access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_orchestration_runs' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON ai_orchestration_runs TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- ai_task_memory: admins + service role
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_task_memory' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON ai_task_memory TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- hc_loads: public read, authenticated write, service full
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_loads' AND policyname='public_read') THEN
    CREATE POLICY public_read ON hc_loads FOR SELECT TO anon, authenticated USING (status = 'open');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_loads' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON hc_loads TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- hc_dispatch_matches: service role only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_dispatch_matches' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON hc_dispatch_matches TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- hc_operator_intelligence: public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_operator_intelligence' AND policyname='public_read') THEN
    CREATE POLICY public_read ON hc_operator_intelligence FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_operator_intelligence' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON hc_operator_intelligence TO service_role USING (true) WITH CHECK (true);
  END IF;
END;
$$;
