-- ================================================================
-- Haul Command: Canonical Scoring Architecture — Phase 1 Migration
-- Sprint: Directory Ranking + Profile Trust + Corridor Intelligence
-- Migration: 20261018000000_scoring_architecture_phase1.sql
-- Strategy: ADDITIVE ONLY — no column drops, no table drops
-- ================================================================

-- ── 1. Extend hc_corridors with scoring sub-components ──────────
ALTER TABLE hc_corridors
  ADD COLUMN IF NOT EXISTS operator_density_score  NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authority_score         NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complexity_score        NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signal_freshness_score  NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demand_score_cached     NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scored_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scoring_version         TEXT DEFAULT 'v1';

COMMENT ON COLUMN hc_corridors.operator_density_score IS
  'Scored 0-100. Weighted count of claimed + trusted operators in corridor geography. Updated by corridor-score-job.';
COMMENT ON COLUMN hc_corridors.authority_score IS
  'Scored 0-100. Regulation page links, glossary ties, tool ties, training links. Content authority signal.';
COMMENT ON COLUMN hc_corridors.complexity_score IS
  'Scored 0-100. Permit intensity, bridge/height/weight sensitivity, cross-border complexity.';
COMMENT ON COLUMN hc_corridors.signal_freshness_score IS
  'Scored 0-100. Decays with time since last demand signal. < 30 days = 100, > 180 days = 20.';
COMMENT ON COLUMN hc_corridors.demand_score_cached IS
  'Cached demand score from hc_corridor_demand_signals. Updated by corridor-score-job.';

-- ── 2. New: hc_rank_cache — profile-level rank cache ────────────
CREATE TABLE IF NOT EXISTS hc_rank_cache (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID    NOT NULL,
  profile_source    TEXT    NOT NULL  CHECK (profile_source IN ('hc_operators', 'hc_global_operators', 'hc_places', 'hc_real_operators')),
  country_code      TEXT,
  state_code        TEXT,
  category_key      TEXT,

  -- Component scores (0-100 each)
  geo_score         NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  claim_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  service_fit_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  freshness_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
  completeness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  sponsor_boost     NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (sponsor_boost <= 3),

  -- Composite rank score (generated, immutable formula)
  rank_score NUMERIC(6,2) GENERATED ALWAYS AS (
    geo_score * 0.30
    + trust_score * 0.25
    + claim_score * 0.15
    + service_fit_score * 0.12
    + freshness_score * 0.10
    + completeness_score * 0.05
    + LEAST(sponsor_boost, 3)
  ) STORED,

  -- State
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  decay_applied_at  TIMESTAMPTZ,
  audit_run_id      UUID,   -- FK to profile_audit_runs.id
  watch_flag        BOOLEAN NOT NULL DEFAULT FALSE,
  manual_review_flag BOOLEAN NOT NULL DEFAULT FALSE,
  sponsor_eligible  BOOLEAN GENERATED ALWAYS AS (trust_score >= 45) STORED
);

CREATE UNIQUE INDEX rank_cache_profile_source_uidx
  ON hc_rank_cache (profile_id, profile_source)
  WHERE country_code IS NULL;

CREATE UNIQUE INDEX rank_cache_profile_source_country_uidx
  ON hc_rank_cache (profile_id, profile_source, country_code, state_code)
  WHERE country_code IS NOT NULL;

CREATE INDEX rank_cache_geo_rank_idx
  ON hc_rank_cache (country_code, state_code, rank_score DESC NULLS LAST);

CREATE INDEX rank_cache_profile_lookup_idx
  ON hc_rank_cache (profile_id, profile_source);

CREATE INDEX rank_cache_freshness_decay_idx
  ON hc_rank_cache (freshness_score, computed_at)
  WHERE watch_flag = FALSE;

COMMENT ON TABLE hc_rank_cache IS
  'Profile-level directory rank cache. rank_score is a generated column (formula defined in CHECK).
   Updated by profile-score-job and directory-rank-job.
   sponsor_boost hard-capped at 3 — cannot materially override geo+trust.';

-- ── 3. Extend profile_audit_runs ─────────────────────────────────
ALTER TABLE profile_audit_runs
  ADD COLUMN IF NOT EXISTS decay_applied    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS next_audit_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sponsor_eligible BOOLEAN GENERATED ALWAYS AS (score_total >= 45) STORED;

COMMENT ON COLUMN profile_audit_runs.decay_applied IS
  'Set true by freshness_decay_job when score_freshness is decremented due to staleness.';
COMMENT ON COLUMN profile_audit_runs.next_audit_at IS
  'Scheduled next audit time. Set after each run. Consumed by audit scheduler worker.';
COMMENT ON COLUMN profile_audit_runs.sponsor_eligible IS
  'Auto-computed: profile may appear in paid sponsor slots only if score_total >= 45.
   Truth floor: money cannot buy trust. Trust must be earned.';

-- ── 4. Extend dom_scorecards ─────────────────────────────────────
ALTER TABLE dom_scorecards
  ADD COLUMN IF NOT EXISTS claim_density      NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness_score    NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corridor_count     INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sponsor_slot_count INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_refreshed_at  TIMESTAMPTZ;

COMMENT ON COLUMN dom_scorecards.claim_density IS
  'Ratio of claimed to total profiles in this market scope. 0-100.';
COMMENT ON COLUMN dom_scorecards.freshness_score IS
  'Average freshness of profile_audit_runs in this scope. Rolled up daily by directory-rank-job.';
COMMENT ON COLUMN dom_scorecards.corridor_count IS
  'Number of active corridors passing through this market scope.';
COMMENT ON COLUMN dom_scorecards.sponsor_slot_count IS
  'Number of sponsor-eligible profiles in this scope (trust_score >= 45, geo match).';

-- ── 5. New: hc_corridor_scoring_log — audit trail ────────────────
CREATE TABLE IF NOT EXISTS hc_corridor_scoring_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id     UUID NOT NULL REFERENCES hc_corridors(id) ON DELETE CASCADE,
  previous_score  NUMERIC(5,2),
  new_score       NUMERIC(5,2),
  previous_tier   TEXT,
  new_tier        TEXT,
  score_delta     NUMERIC(5,2) GENERATED ALWAYS AS (new_score - previous_score) STORED,
  trigger_reason  TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (trigger_reason IN ('scheduled', 'demand_signal', 'operator_claim', 'profile_trusted', 'manual')),
  computed_by     TEXT DEFAULT 'corridor-score-job',
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX corridor_score_log_corridor_idx ON hc_corridor_scoring_log (corridor_id, computed_at DESC);
CREATE INDEX corridor_score_log_tier_change_idx ON hc_corridor_scoring_log (previous_tier, new_tier) WHERE previous_tier != new_tier;

COMMENT ON TABLE hc_corridor_scoring_log IS
  'Append-only audit log for corridor tier and score changes.
   Never delete rows. Used to prove scoring is deterministic and auditable.';

-- ── 6. hc_events: ensure index for scoring job consumption ───────
CREATE INDEX IF NOT EXISTS evt_scoring_consumer_idx
  ON hc_events (event_type, status, created_at DESC)
  WHERE status = 'queued'
    AND event_type IN (
      'profile.claimed', 'profile.updated', 'proof.attached',
      'audit.scheduled', 'rank.updated',
      'demand_signal.recorded', 'operator.claimed', 'profile.trusted'
    );

-- ── 7. Helper view: ranked profiles per state ────────────────────
CREATE OR REPLACE VIEW hc_state_directory_ranked AS
SELECT
  rc.profile_id,
  rc.profile_source,
  rc.country_code,
  rc.state_code,
  rc.rank_score,
  rc.geo_score,
  rc.trust_score,
  rc.claim_score,
  rc.freshness_score,
  rc.sponsor_eligible,
  rc.watch_flag,
  rc.computed_at
FROM hc_rank_cache rc
WHERE rc.country_code IS NOT NULL
ORDER BY rc.country_code, rc.state_code, rc.rank_score DESC;

COMMENT ON VIEW hc_state_directory_ranked IS
  'Convenience view: profiles ordered by rank_score per country+state.
   Used by StateDirectory page, directory search API, and TypeSense sync worker.';

-- ── 8. RPC: get_corridor_ranked_by_state ─────────────────────────
CREATE OR REPLACE FUNCTION get_top_corridors_for_state(
  p_state_name TEXT,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (
  id UUID, slug TEXT, name TEXT, short_name TEXT,
  composite_score NUMERIC, commercial_value_estimate NUMERIC,
  distance_km NUMERIC, tier TEXT,
  operator_density_score NUMERIC, demand_score_cached NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id, c.slug, c.name, c.short_name,
    c.composite_score, c.commercial_value_estimate,
    c.distance_km, c.tier,
    c.operator_density_score, c.demand_score_cached
  FROM hc_corridors c
  WHERE c.is_public = true
    AND (
      c.name ILIKE ('%' || p_state_name || '%')
      OR c.origin_city_name ILIKE ('%' || p_state_name || '%')
      OR c.destination_city_name ILIKE ('%' || p_state_name || '%')
    )
  ORDER BY c.composite_score DESC NULLS LAST
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_top_corridors_for_state IS
  'Returns top N corridors relevant to a state by name match.
   Used by StateDirectory page and near-me pages.';
