-- ============================================================
-- Haul Command: Core Event Bus + Effects + Scorecards
-- Migration: 20261017000000_core_event_infrastructure.sql
-- Tables: hc_events, hc_surface_effects, dom_scorecards,
--         hc_job_states, push_subscriptions
-- ============================================================

-- ── hc_events — the central event bus ────────────────────
CREATE TABLE IF NOT EXISTS hc_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  event_source    TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  actor_type      TEXT,              -- 'user' | 'worker' | 'system' | 'webhook'
  actor_id        UUID,
  country_code    TEXT,
  market_id       UUID,
  payload_json    JSONB NOT NULL DEFAULT '{}'::JSONB,
  status          TEXT NOT NULL DEFAULT 'queued', -- queued | delivered | failed | suppressed
  processed_at    TIMESTAMPTZ,
  error_text      TEXT,
  idempotency_key TEXT UNIQUE,       -- prevent duplicate event firing
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX evt_type_status_idx   ON hc_events (event_type, status, created_at DESC);
CREATE INDEX evt_entity_idx        ON hc_events (entity_id, event_type, created_at DESC);
CREATE INDEX evt_source_idx        ON hc_events (event_source, created_at DESC);
CREATE INDEX evt_country_type_idx  ON hc_events (country_code, event_type);

COMMENT ON TABLE hc_events IS 
  'Central event bus. All workflows, workers, and surfaces write and consume events here. 
   Use idempotency_key to prevent duplicate processing.';

-- ── hc_surface_effects ────────────────────────────────────
-- Tracks measurable effects of workflow repairs on SEO/trust/monetization
CREATE TABLE IF NOT EXISTS hc_surface_effects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type           TEXT NOT NULL,    -- 'profile_audit_run' | 'workflow_run' | 'skill_run'
  source_id             UUID NOT NULL,
  affected_surface_type TEXT NOT NULL,    -- 'profile' | 'city_page' | 'corridor' | 'near_me'
  affected_surface_id   UUID,
  effect_type           TEXT NOT NULL,    -- 'seo_lift_candidate' | 'trust_boost' | 'monetization_improvement'
  effect_value          NUMERIC(8,4),     -- 0.0–1.0 normalized signal strength
  measured_at           TIMESTAMPTZ,
  confirmed             BOOLEAN DEFAULT FALSE,
  metadata_json         JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX surface_effects_source_idx   ON hc_surface_effects (source_type, source_id);
CREATE INDEX surface_effects_surface_idx  ON hc_surface_effects (affected_surface_type, affected_surface_id);
CREATE INDEX surface_effects_type_idx     ON hc_surface_effects (effect_type, confirmed);

COMMENT ON TABLE hc_surface_effects IS
  'Attribution table. Measures whether a repair or workflow action actually moved SEO/trust/monetization signals.
   Confirmed = true when a before/after measurement validates the effect.';

-- ── dom_scorecards ────────────────────────────────────────
-- Rolls up market/country coverage quality into a single scorecard
CREATE TABLE IF NOT EXISTS dom_scorecards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type      TEXT NOT NULL,         -- 'country' | 'market' | 'city' | 'corridor'
  scope_key       TEXT NOT NULL,         -- e.g. 'US' | 'US:TX:Houston'
  country_code    TEXT,
  region_code     TEXT,
  city_name       TEXT,

  -- Rolled up scores (0–100)
  supply_score        NUMERIC(6,2),
  demand_score        NUMERIC(6,2),
  trust_score         NUMERIC(6,2),
  seo_score           NUMERIC(6,2),
  monetization_score  NUMERIC(6,2),
  dominance_score     NUMERIC(6,2),      -- weighted composite

  -- Counts
  operator_count      INTEGER DEFAULT 0,
  claimed_count       INTEGER DEFAULT 0,
  verified_count      INTEGER DEFAULT 0,
  page_count          INTEGER DEFAULT 0,
  active_job_count    INTEGER DEFAULT 0,

  component_json  JSONB NOT NULL DEFAULT '{}'::JSONB,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (scope_type, scope_key)
);

CREATE INDEX dom_scorecards_scope_idx    ON dom_scorecards (scope_type, dominance_score DESC);
CREATE INDEX dom_scorecards_country_idx  ON dom_scorecards (country_code, scope_type);

COMMENT ON TABLE dom_scorecards IS
  'Market dominance scorecards. Rolled up from audit runs, workflow outcomes, and surface effects.
   Powers the Control Tower admin overview.';

-- ── hc_job_states ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_job_states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL,
  state           TEXT NOT NULL,         -- 'open' | 'assigned' | 'in_transit' | 'completed' | 'no_show_recovery' | 'cancelled' | 'disputed'
  previous_state  TEXT,
  metadata_json   JSONB NOT NULL DEFAULT '{}'::JSONB,
  actor_type      TEXT,
  actor_id        UUID,
  workflow_run_id UUID REFERENCES hc_workflow_runs(id),
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX job_states_job_idx    ON hc_job_states (job_id, transitioned_at DESC);
CREATE INDEX job_states_state_idx  ON hc_job_states (state, transitioned_at DESC);

-- ── push_subscriptions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  -- Web Push (VAPID / browser push)
  endpoint        TEXT,
  p256dh_key      TEXT,
  auth_key        TEXT,
  -- Firebase Cloud Messaging
  fcm_token       TEXT,
  -- Metadata
  role            TEXT,                  -- 'operator' | 'broker' | 'dispatcher'
  geo             TEXT,                  -- state/region code
  device_type     TEXT,                  -- 'ios' | 'android' | 'web'
  user_agent      TEXT,
  last_active_at  TIMESTAMPTZ,
  bad_token       BOOLEAN DEFAULT FALSE,
  bad_token_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint),
  UNIQUE (user_id, fcm_token)
);

CREATE INDEX push_subs_user_idx    ON push_subscriptions (user_id, bad_token);
CREATE INDEX push_subs_role_geo_idx ON push_subscriptions (role, geo) WHERE bad_token = FALSE;
CREATE INDEX push_subs_fcm_idx     ON push_subscriptions (fcm_token) WHERE bad_token = FALSE;

-- RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access push subs" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ── hc_notifications ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS hc_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  image_url       TEXT,
  data_json       JSONB NOT NULL DEFAULT '{}'::JSONB,
  channel         TEXT NOT NULL DEFAULT 'push', -- 'push' | 'email' | 'sms' | 'in_app'
  status          TEXT NOT NULL DEFAULT 'queued', -- queued | sent | delivered | failed | cancelled
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  error_text      TEXT,
  workflow_run_id UUID REFERENCES hc_workflow_runs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notif_user_idx    ON hc_notifications (user_id, status, created_at DESC);
CREATE INDEX notif_status_idx  ON hc_notifications (status, channel, created_at);

-- RLS
ALTER TABLE hc_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON hc_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON hc_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- ── Updated_at triggers ───────────────────────────────────
CREATE TRIGGER set_hc_surface_effects_updated_at
  BEFORE UPDATE ON hc_surface_effects
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_dom_scorecards_updated_at
  BEFORE UPDATE ON dom_scorecards
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_push_subs_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_hc_notifications_updated_at
  BEFORE UPDATE ON hc_notifications
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ── v_audit_dashboard — admin view ────────────────────────
CREATE OR REPLACE VIEW v_audit_dashboard AS
SELECT
  par.entity_id,
  par.hc_id,
  par.profile_class,
  par.audit_status,
  par.score_total,
  par.hard_fail,
  par.fail_reason_codes,
  par.score_geo_truth,
  par.score_local_intent_packaging,
  par.score_proof_conversion,
  par.score_render_visibility,
  par.score_link_graph,
  par.score_freshness,
  par.country_code,
  par.city_name,
  par.region_code,
  par.next_refresh_due_at,
  par.completed_at,
  ARRAY_LENGTH(par.repair_actions_json::text[]::text[], 1) AS repair_count,
  par.suppress_near_me,
  par.suppress_city_featured
FROM profile_audit_runs par
WHERE par.id IN (
  SELECT DISTINCT ON (entity_id) id
  FROM profile_audit_runs
  ORDER BY entity_id, completed_at DESC NULLS LAST
)
ORDER BY
  par.hard_fail DESC,
  par.score_total ASC;

COMMENT ON VIEW v_audit_dashboard IS
  'One row per entity (latest audit). Sorted worst-first for triage.
   Used by /dashboard/admin/audits.';

-- ── Seed: dom_scorecards for US/CA/AU ───────────────────
INSERT INTO dom_scorecards (scope_type, scope_key, country_code, supply_score, demand_score, seo_score, dominance_score)
VALUES
  ('country', 'US',  'US',  65, 85, 70, 73),
  ('country', 'CA',  'CA',  50, 55, 55, 53),
  ('country', 'AU',  'AU',  45, 50, 48, 47),
  ('country', 'GB',  'GB',  30, 40, 35, 35),
  ('country', 'ZA',  'ZA',  20, 25, 22, 22)
ON CONFLICT (scope_type, scope_key) DO NOTHING;
