-- ============================================================
-- Haul Command: Profile Local-Intent Audit Schema
-- Migration: 20261015000000_profile_audit_system.sql
-- Extends: hc_events, hc_skill_runs, hc_surface_effects, dom_scorecards
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────
CREATE TYPE hc_profile_class AS ENUM ('local', 'service_area', 'directory_only');

CREATE TYPE hc_audit_status AS ENUM (
  'pending',
  'running',
  'passed',
  'failed',
  'suppressed',
  'hard_failed'
);

CREATE TYPE hc_confidence_state AS ENUM (
  'verified_current',
  'verified_but_review_due',
  'partially_verified',
  'seeded_needs_review',
  'historical_reference_only'
);

-- ── profile_audit_runs ────────────────────────────────────
-- One row per audit execution. Stores the canonical scored result.
CREATE TABLE IF NOT EXISTS profile_audit_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id             UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
  hc_id                 TEXT,
  profile_class         hc_profile_class NOT NULL,
  audit_version         TEXT NOT NULL DEFAULT 'v1',
  audit_status          hc_audit_status NOT NULL DEFAULT 'pending',
  audit_reason          TEXT,                        -- trigger event key
  workflow_run_id       UUID REFERENCES hc_workflow_runs(id),
  skill_run_id          UUID REFERENCES hc_skill_runs(id),

  -- Composite score
  score_total           NUMERIC(6,2) NOT NULL DEFAULT 0,
  pass_threshold        NUMERIC(6,2) NOT NULL DEFAULT 85,
  hard_fail             BOOLEAN NOT NULL DEFAULT FALSE,

  -- Component scores (0–100 each)
  score_geo_truth               NUMERIC(6,2),
  score_local_intent_packaging  NUMERIC(6,2),
  score_proof_conversion        NUMERIC(6,2),
  score_render_visibility       NUMERIC(6,2),
  score_link_graph              NUMERIC(6,2),
  score_freshness               NUMERIC(6,2),
  -- Class B specific
  score_service_area_truth      NUMERIC(6,2),
  -- Class C specific
  score_identity_completeness   NUMERIC(6,2),
  score_content_depth           NUMERIC(6,2),

  -- Fail reasons (array of HC_AUDIT_* codes)
  fail_reason_codes     TEXT[] NOT NULL DEFAULT '{}',

  -- Repair routing
  repair_actions_json   JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Events emitted
  events_emitted_json   JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Surface effect candidates
  surface_effect_candidates_json JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Geo snapshot at time of audit
  country_code          TEXT,
  region_code           TEXT,
  city_name             TEXT,
  lat                   NUMERIC(10,7),
  lng                   NUMERIC(10,7),
  map_pin_accuracy_score NUMERIC(5,4),

  -- Suppression flags
  suppress_near_me      BOOLEAN NOT NULL DEFAULT FALSE,
  suppress_city_featured BOOLEAN NOT NULL DEFAULT FALSE,
  suppress_region_featured BOOLEAN NOT NULL DEFAULT FALSE,
  suppress_sponsor_pool  BOOLEAN NOT NULL DEFAULT FALSE,

  next_refresh_due_at   TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX par_entity_idx       ON profile_audit_runs (entity_id, audit_status);
CREATE INDEX par_class_status_idx ON profile_audit_runs (profile_class, audit_status, score_total DESC);
CREATE INDEX par_country_city_idx ON profile_audit_runs (country_code, city_name);
CREATE INDEX par_hard_fail_idx    ON profile_audit_runs (hard_fail) WHERE hard_fail = TRUE;

-- ── profile_audit_repairs ─────────────────────────────────
-- One row per repair action queued after a failed audit.
CREATE TABLE IF NOT EXISTS profile_audit_repairs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id    UUID NOT NULL REFERENCES profile_audit_runs(id) ON DELETE CASCADE,
  entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
  worker_key      TEXT NOT NULL,         -- e.g. "page-blueprint-worker"
  repair_reason   TEXT NOT NULL,
  fail_codes      TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'queued',  -- queued, running, done, skipped
  queued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  output_json     JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX repair_entity_idx   ON profile_audit_repairs (entity_id, status);
CREATE INDEX repair_worker_idx   ON profile_audit_repairs (worker_key, status);
CREATE INDEX repair_audit_idx    ON profile_audit_repairs (audit_run_id);

-- ── profile_render_snapshots ──────────────────────────────
-- Stores render-time visibility observation used by audit workers.
-- Feeds score_render_visibility component.
CREATE TABLE IF NOT EXISTS profile_render_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
  audit_run_id    UUID REFERENCES profile_audit_runs(id),

  -- Title / H1
  title_tag       TEXT,
  title_char_len  INTEGER,
  title_has_role  BOOLEAN,
  title_has_geo   BOOLEAN,
  title_is_generic BOOLEAN,

  h1_text         TEXT,
  h1_visible_above_fold BOOLEAN,
  h1_has_role     BOOLEAN,
  h1_has_geo      BOOLEAN,

  -- Opening copy
  opening_copy_text       TEXT,
  opening_copy_user_first BOOLEAN,
  opening_copy_has_proof  BOOLEAN,
  opening_copy_has_local  BOOLEAN,

  -- FAQ
  faq_item_count  INTEGER DEFAULT 0,
  faq_visible_without_click BOOLEAN,
  faq_has_geo_item   BOOLEAN,
  faq_has_proof_item BOOLEAN,
  faq_has_process_item BOOLEAN,

  -- CTA
  cta_above_fold  BOOLEAN,
  cta_mode        TEXT,

  -- Proof visibility
  proof_above_fold         BOOLEAN,
  critical_copy_hidden     BOOLEAN,
  hero_oversized           BOOLEAN,

  -- Computed visibility map (full JSON from render inspection)
  render_visibility_map_json JSONB NOT NULL DEFAULT '{}'::JSONB,

  snapshotted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prs_entity_idx    ON profile_render_snapshots (entity_id, snapshotted_at DESC);
CREATE INDEX prs_audit_idx     ON profile_render_snapshots (audit_run_id);

-- ── profile_surface_candidates ────────────────────────────
-- Tracks which surfaces this profile is a candidate for after passing audit.
-- Feeds near-me clusters, city featured, region featured, sponsor pools.
CREATE TABLE IF NOT EXISTS profile_surface_candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
  audit_run_id    UUID NOT NULL REFERENCES profile_audit_runs(id) ON DELETE CASCADE,
  profile_class   hc_profile_class NOT NULL,

  surface_type    TEXT NOT NULL,    -- 'near_me' | 'city_featured' | 'region_featured' | 'sponsor_pool'
  surface_scope   TEXT,             -- e.g. country_code:city_name for near_me
  eligible        BOOLEAN NOT NULL DEFAULT FALSE,
  suppressed      BOOLEAN NOT NULL DEFAULT FALSE,
  suppression_reason TEXT,

  score_at_eligibility NUMERIC(6,2),
  eligible_since  TIMESTAMPTZ,
  ineligible_since TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (entity_id, surface_type, surface_scope)
);

CREATE INDEX psc_entity_idx   ON profile_surface_candidates (entity_id, eligible);
CREATE INDEX psc_surface_idx  ON profile_surface_candidates (surface_type, eligible);
CREATE INDEX psc_scope_idx    ON profile_surface_candidates (surface_type, surface_scope);

-- ── updated_at triggers ───────────────────────────────────
CREATE TRIGGER set_par_updated_at
  BEFORE UPDATE ON profile_audit_runs
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_repair_updated_at
  BEFORE UPDATE ON profile_audit_repairs
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_prs_updated_at
  BEFORE UPDATE ON profile_render_snapshots
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

CREATE TRIGGER set_psc_updated_at
  BEFORE UPDATE ON profile_surface_candidates
  FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ── Seed: audit workflow definition ─────────────────────
INSERT INTO hc_workflows (workflow_key, name, description, trigger_event_type, priority)
VALUES
  ('profile-local-intent-audit-v1', 'Profile Local-Intent Audit', 
   'Scores profile geo truth, local-intent packaging, proof, render visibility, link graph, and freshness. Routes repairs to the correct worker.',
   'profile.updated', 50)
ON CONFLICT (workflow_key) DO NOTHING;

-- ── View: failing profiles by market ─────────────────────
CREATE OR REPLACE VIEW v_profile_audit_failures AS
SELECT
  par.entity_id,
  par.hc_id,
  par.profile_class,
  par.score_total,
  par.hard_fail,
  par.fail_reason_codes,
  par.country_code,
  par.city_name,
  par.region_code,
  par.next_refresh_due_at,
  par.completed_at
FROM profile_audit_runs par
WHERE par.audit_status IN ('failed', 'hard_failed')
  AND par.id = (
    SELECT id FROM profile_audit_runs par2
    WHERE par2.entity_id = par.entity_id
    ORDER BY par2.created_at DESC
    LIMIT 1
  )
ORDER BY par.score_total ASC;

COMMENT ON VIEW v_profile_audit_failures IS
  'Latest failed audit per entity. Used by repair queue processor and ops dashboard.';
