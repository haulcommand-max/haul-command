-- ============================================================
-- Haul Command: Workflow Infrastructure Schema
-- Migration: 20261016000000_workflow_infrastructure.sql
-- Covers: hc_workflows, hc_workflow_runs, hc_workflow_queues,
--         hc_briefings, hc_gap_tasks, hc_outreach_log,
--         hc_partner_leads, hc_listing_scores (extends)
-- ============================================================

-- ── hc_workflows ──────────────────────────────────────────
-- Registry of all workflow definitions (seeded from WORKFLOW_TEMPLATES.yaml)
CREATE TABLE IF NOT EXISTS hc_workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key    TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  purpose         TEXT,
  trigger_event_type TEXT,
  primary_roles   TEXT[] NOT NULL DEFAULT '{}',
  primary_value_type TEXT[] NOT NULL DEFAULT '{}',
  priority        INTEGER NOT NULL DEFAULT 50,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  config_json     JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── hc_workflow_runs ──────────────────────────────────────
-- Execution log for every workflow invocation
CREATE TABLE IF NOT EXISTS hc_workflow_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key    TEXT NOT NULL REFERENCES hc_workflows(workflow_key) ON DELETE CASCADE,
  trigger_type    TEXT NOT NULL,             -- manual | cron | event | threshold
  trigger_key     TEXT,
  trigger_source  TEXT,
  entity_id       UUID,
  entity_type     TEXT,
  country_code    TEXT,
  market_id       UUID,
  status          TEXT NOT NULL DEFAULT 'running', -- running | completed | failed | cancelled | escalated
  input_json      JSONB NOT NULL DEFAULT '{}'::JSONB,
  output_json     JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_json      JSONB,
  cost_usd        NUMERIC(10,6),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wfr_workflow_key_idx ON hc_workflow_runs (workflow_key, status);
CREATE INDEX wfr_entity_idx       ON hc_workflow_runs (entity_id, status);

-- ── hc_workflow_queues ────────────────────────────────────
-- Async queue items dispatched by workflow steps
CREATE TABLE IF NOT EXISTS hc_workflow_queues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES hc_workflow_runs(id) ON DELETE CASCADE,
  queue_name      TEXT NOT NULL,             -- e.g. "claim.create_packet"
  worker_key      TEXT NOT NULL,             -- e.g. "claim-worker"
  entity_id       UUID,
  payload_json    JSONB NOT NULL DEFAULT '{}'::JSONB,
  status          TEXT NOT NULL DEFAULT 'queued', -- queued | processing | done | failed | skipped
  priority        INTEGER NOT NULL DEFAULT 50,
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  last_error      TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wfq_queue_status_idx ON hc_workflow_queues (queue_name, status, scheduled_at);
CREATE INDEX wfq_worker_idx       ON hc_workflow_queues (worker_key, status);

-- ── hc_briefings ─────────────────────────────────────────
-- Daily personalized briefings for operators and brokers
CREATE TABLE IF NOT EXISTS hc_briefings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
  briefing_type   TEXT NOT NULL,             -- 'operator_opportunity' | 'broker_morning'
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  delivered_at    TIMESTAMPTZ,
  delivery_channel TEXT,                     -- 'push' | 'email' | 'dashboard'
  opened_at       TIMESTAMPTZ,
  engaged_at      TIMESTAMPTZ,
  items_json      JSONB NOT NULL DEFAULT '[]'::JSONB,
  summary_text    TEXT,
  urgent_count    INTEGER NOT NULL DEFAULT 0,
  job_cards_count INTEGER NOT NULL DEFAULT 0,
  credential_nudges_count INTEGER NOT NULL DEFAULT 0,
  workflow_run_id UUID REFERENCES hc_workflow_runs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, briefing_type, date)
);

CREATE INDEX briefings_entity_idx ON hc_briefings (entity_id, date DESC);
CREATE INDEX briefings_type_idx   ON hc_briefings (briefing_type, date);

-- ── hc_gap_tasks ─────────────────────────────────────────
-- Actionable work items emitted by supply_density, listing_rescue, etc.
CREATE TABLE IF NOT EXISTS hc_gap_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type       TEXT NOT NULL,             -- 'claim', 'content', 'hunt', 'partner', 'rescue'
  workflow_key    TEXT,
  market_id       UUID,
  country_code    TEXT,
  region_code     TEXT,
  city_name       TEXT,
  target_entity_id UUID REFERENCES hc_entities(id),
  priority_score  NUMERIC(6,2),
  status          TEXT NOT NULL DEFAULT 'open', -- open | assigned | done | snoozed | cancelled
  assigned_to     UUID,
  context_json    JSONB NOT NULL DEFAULT '{}'::JSONB,
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  workflow_run_id UUID REFERENCES hc_workflow_runs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gap_tasks_status_idx   ON hc_gap_tasks (status, priority_score DESC);
CREATE INDEX gap_tasks_country_idx  ON hc_gap_tasks (country_code, task_type, status);

-- ── hc_outreach_log ───────────────────────────────────────
-- Records all outreach attempts (email, push, SMS) to entities
CREATE TABLE IF NOT EXISTS hc_outreach_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
  workflow_key    TEXT,
  outreach_type   TEXT NOT NULL,             -- 'claim_invite' | 'followup' | 'credential_nudge' | 'urgent_alert'
  channel         TEXT NOT NULL,             -- 'email' | 'push' | 'sms'
  subject         TEXT,
  body_preview    TEXT,
  status          TEXT NOT NULL DEFAULT 'sent', -- sent | delivered | opened | clicked | bounced | suppressed
  suppressed      BOOLEAN NOT NULL DEFAULT FALSE,
  suppression_reason TEXT,
  touch_count     INTEGER NOT NULL DEFAULT 1,
  last_replied_at TIMESTAMPTZ,
  workflow_run_id UUID REFERENCES hc_workflow_runs(id),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX outreach_entity_idx   ON hc_outreach_log (entity_id, workflow_key, sent_at DESC);
CREATE INDEX outreach_type_idx     ON hc_outreach_log (outreach_type, channel, status);

-- ── hc_partner_leads ─────────────────────────────────────
-- Partner Hunt Engine discovered candidates (yards, hotels, etc.)
CREATE TABLE IF NOT EXISTS hc_partner_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type    TEXT NOT NULL,             -- 'yard' | 'hotel' | 'installer' | 'secure_parking' | 'repair'
  business_name   TEXT,
  country_code    TEXT,
  region_code     TEXT,
  city_name       TEXT,
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  contact_email   TEXT,
  contact_phone   TEXT,
  website_url     TEXT,
  partner_score   NUMERIC(6,2),
  market_gap_score NUMERIC(6,2),
  status          TEXT NOT NULL DEFAULT 'discovered', -- discovered | outreach_sent | applied | onboarded | rejected
  source          TEXT,                      -- 'google_places' | 'competitor_scrape' | 'referral'
  claimed_entity_id UUID REFERENCES hc_entities(id),
  outreach_count  INTEGER NOT NULL DEFAULT 0,
  last_outreach_at TIMESTAMPTZ,
  workflow_run_id UUID REFERENCES hc_workflow_runs(id),
  context_json    JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX partner_leads_type_status_idx ON hc_partner_leads (partner_type, status);
CREATE INDEX partner_leads_country_idx     ON hc_partner_leads (country_code, city_name);

-- ── Seed: core workflow registry ─────────────────────────
INSERT INTO hc_workflows (workflow_key, name, description, trigger_event_type, primary_roles, primary_value_type, priority) VALUES
  ('claim_sniper', 'Claim Sniper', 'Find high-value unclaimed listings and build personalized claim packets', 'cron', ARRAY['admin','internal_growth'], ARRAY['conversion','supply_growth','monetization'], 95),
  ('regulation_capture_engine', 'Regulation Capture Engine', 'Create and refresh citation-grade regulation pages', 'cron', ARRAY['seo','content_ops'], ARRAY['authority','SEO','AI_citations'], 85),
  ('corridor_page_generator', 'Corridor Page Generator', 'Build commercial corridor pages with demand, rates, and next actions', 'cron', ARRAY['seo','marketplace_ops'], ARRAY['SEO','commercial_intent'], 80),
  ('broker_morning_briefing', 'Broker Morning Briefing', 'Personalized broker briefings with corridor shortages and standby coverage', 'cron', ARRAY['broker'], ARRAY['retention','demand_capture'], 90),
  ('operator_opportunity_briefing', 'Operator Opportunity Briefing', 'Daily operator brief with jobs, credentials, and profile nudges', 'cron', ARRAY['operator'], ARRAY['retention','app_migration'], 90),
  ('no_show_recovery', 'No-Show Recovery', 'Find qualified standby replacements when operators no-show', 'event', ARRAY['broker','admin'], ARRAY['operational_reliability','marketplace'], 100),
  ('credential_unlock_engine', 'Credential Unlock Engine', 'Show operators credential gaps and unlock paths to better jobs', 'cron', ARRAY['operator','broker'], ARRAY['retention','monetization'], 75),
  ('partner_hunt_engine', 'Partner Hunt Engine', 'Find and recruit infrastructure partners (yards, hotels, installers)', 'cron', ARRAY['admin','partner_ops'], ARRAY['ecosystem_expansion','monetization'], 70),
  ('supply_density_builder', 'Supply Density Builder', 'Detect thin markets and emit tasks to raise supply density', 'cron', ARRAY['admin','growth_ops'], ARRAY['supply_growth','market_dominance'], 80),
  ('ai_answer_builder', 'AI Answer Builder', 'Create answer-first pages for AI citations and snippet capture', 'threshold', ARRAY['seo','content_ops'], ARRAY['authority','SEO','citations'], 75),
  ('listing_rescue_tactic', 'Listing Rescue Tactic', 'Recover weak, stale, or abandoned listings into activation opportunities', 'cron', ARRAY['growth_ops','admin'], ARRAY['claims','activation'], 70)
ON CONFLICT (workflow_key) DO NOTHING;

-- ── Updated_at triggers ───────────────────────────────────
CREATE TRIGGER set_hc_workflows_updated_at
  BEFORE UPDATE ON hc_workflows
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_workflow_runs_updated_at
  BEFORE UPDATE ON hc_workflow_runs
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_workflow_queues_updated_at
  BEFORE UPDATE ON hc_workflow_queues
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_briefings_updated_at
  BEFORE UPDATE ON hc_briefings
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_gap_tasks_updated_at
  BEFORE UPDATE ON hc_gap_tasks
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_outreach_log_updated_at
  BEFORE UPDATE ON hc_outreach_log
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_partner_leads_updated_at
  BEFORE UPDATE ON hc_partner_leads
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ── Views ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_open_gap_tasks AS
SELECT g.*, w.name AS workflow_name
FROM hc_gap_tasks g
LEFT JOIN hc_workflows w ON w.workflow_key = g.workflow_key
WHERE g.status = 'open'
ORDER BY g.priority_score DESC NULLS LAST, g.created_at ASC;

CREATE OR REPLACE VIEW v_workflow_run_summary AS
SELECT
  workflow_key,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'running') AS running,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_duration_secs,
  SUM(cost_usd) AS total_cost_usd,
  MAX(completed_at) AS last_run_at
FROM hc_workflow_runs
GROUP BY workflow_key;
