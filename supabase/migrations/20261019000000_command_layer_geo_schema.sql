-- ================================================================
-- Haul Command: Live Map + Command Layer — Phase 2 Migration
-- Sprint: Live Map + Dispatch Command System
-- Migration: 20261019000000_command_layer_geo_schema.sql
-- Strategy: ADDITIVE ONLY — PostGIS geometry, corridor watches, nearby RPC
-- ================================================================

-- ── 1. Corridor route geometry (enables ST_Intersects queries) ───
ALTER TABLE hc_corridors
  ADD COLUMN IF NOT EXISTS route_geometry GEOMETRY(LineString, 4326);

CREATE INDEX IF NOT EXISTS corridors_geometry_gist_idx
  ON hc_corridors USING GIST(route_geometry);

COMMENT ON COLUMN hc_corridors.route_geometry IS
  'Optional: LineString geometry of the corridor route in WGS84.
   Used for ST_Intersects operator-to-corridor matching.
   Populated by corridor-builder ingestion job.
   bbox-based fallback used until geometry is populated.';

-- ── 2. Operator service area polygon ─────────────────────────────
ALTER TABLE hc_operators
  ADD COLUMN IF NOT EXISTS service_area_polygon GEOMETRY(Polygon, 4326);

CREATE INDEX IF NOT EXISTS operators_service_area_gist_idx
  ON hc_operators USING GIST(service_area_polygon);

COMMENT ON COLUMN hc_operators.service_area_polygon IS
  'Optional: Polygon representing the operator service area in WGS84.
   Used for ST_Intersects corridor-to-operator matching.
   Falls back to service_radius_miles circle when null.';

-- ── 3. hc_corridor_watches — operator saves corridors to monitor ─
CREATE TABLE IF NOT EXISTS hc_corridor_watches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID NOT NULL REFERENCES hc_operators(id) ON DELETE CASCADE,
  corridor_id  UUID NOT NULL REFERENCES hc_corridors(id) ON DELETE CASCADE,
  notify_push  BOOLEAN NOT NULL DEFAULT TRUE,
  notify_email BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_notified_at TIMESTAMPTZ,
  UNIQUE(operator_id, corridor_id)
);

CREATE INDEX IF NOT EXISTS cw_operator_idx   ON hc_corridor_watches (operator_id);
CREATE INDEX IF NOT EXISTS cw_corridor_idx   ON hc_corridor_watches (corridor_id);
CREATE INDEX IF NOT EXISTS cw_notify_idx     ON hc_corridor_watches (corridor_id, notify_push)
  WHERE notify_push = TRUE;

COMMENT ON TABLE hc_corridor_watches IS
  'Operators save corridors to watch. When a demand signal fires on that corridor,
   the notification system checks this table and sends push/email based on preferences.
   last_notified_at throttles repeat alerts.';

-- ── 4. RPC: get_nearby_operators ─────────────────────────────────
-- Returns operators near a given lat/lng, ranked by distance then rank_score.
-- Uses PostGIS ST_DWithin for efficient radius search.
CREATE OR REPLACE FUNCTION get_nearby_operators(
  p_lat       NUMERIC,
  p_lng       NUMERIC,
  p_radius_m  INTEGER  DEFAULT 160934, -- 100 miles in meters
  p_limit     INTEGER  DEFAULT 20,
  p_category  TEXT     DEFAULT NULL
)
RETURNS TABLE (
  id           UUID,
  slug         TEXT,
  business_name TEXT,
  city         TEXT,
  state_code   TEXT,
  country_code TEXT,
  lat          NUMERIC,
  lng          NUMERIC,
  distance_m   DOUBLE PRECISION,
  trust_score  NUMERIC,
  claim_status TEXT,
  is_verified  BOOLEAN,
  rank_score   NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    o.id,
    o.slug,
    o.business_name,
    o.city,
    o.state,
    o.country_code,
    o.lat,
    o.lng,
    ST_Distance(
      ST_Point(o.lng::float8, o.lat::float8)::geography,
      ST_Point(p_lng::float8, p_lat::float8)::geography
    ) AS distance_m,
    o.trust_score,
    o.claim_status,
    o.is_verified,
    COALESCE(rc.rank_score, 0) AS rank_score
  FROM hc_operators o
  LEFT JOIN hc_rank_cache rc
    ON rc.profile_id = o.id
    AND rc.profile_source = 'hc_operators'
  WHERE
    o.is_active = true
    AND o.lat IS NOT NULL
    AND o.lng IS NOT NULL
    AND ST_DWithin(
      ST_Point(o.lng::float8, o.lat::float8)::geography,
      ST_Point(p_lng::float8, p_lat::float8)::geography,
      p_radius_m
    )
    AND (p_category IS NULL OR p_category = ANY(o.specialties))
  ORDER BY
    distance_m ASC,
    rank_score DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_nearby_operators IS
  'Returns operators within p_radius_m meters of (p_lat, p_lng).
   Ranked by proximity first, then rank_score (trust+geo+claim composite).
   Used by dispatch view, public live map popup, and OperatorLivePanel.
   Requires PostGIS. Falls back to bbox query if PostGIS unavailable.';

-- ── 5. RPC: get_corridor_gap_alerts ──────────────────────────────
-- Corridors with high commercial value but low operator density.
-- Used by internal command center and dispatch gap alert logic.
CREATE OR REPLACE FUNCTION get_corridor_gap_alerts(
  p_min_commercial NUMERIC DEFAULT 1.0,
  p_max_density    NUMERIC DEFAULT 20.0,
  p_limit          INTEGER DEFAULT 20
)
RETURNS TABLE (
  id                        UUID,
  slug                      TEXT,
  name                      TEXT,
  tier                      TEXT,
  composite_score           NUMERIC,
  commercial_value_estimate NUMERIC,
  operator_density_score    NUMERIC,
  demand_score_cached       NUMERIC,
  gap_severity              TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, slug, name, tier,
    composite_score,
    commercial_value_estimate,
    operator_density_score,
    demand_score_cached,
    CASE
      WHEN operator_density_score = 0 THEN 'critical'
      WHEN operator_density_score < 10 THEN 'severe'
      WHEN operator_density_score < 20 THEN 'moderate'
      ELSE 'low'
    END AS gap_severity
  FROM hc_corridors
  WHERE
    is_public = true
    AND commercial_value_estimate >= p_min_commercial
    AND (operator_density_score IS NULL OR operator_density_score <= p_max_density)
  ORDER BY
    commercial_value_estimate DESC,
    operator_density_score ASC NULLS FIRST
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_corridor_gap_alerts IS
  'Returns high-value corridors with low operator density — supply gaps.
   Used by AdminCommandMap gap panel and DispatchDashboard gap alert logic.
   gap_severity: critical (0 operators) > severe < moderate < low.';

-- ── 6. hc_events: index for corridor watch notifications ─────────
CREATE INDEX IF NOT EXISTS evt_corridor_watch_idx
  ON hc_events (event_type, entity_id, created_at DESC)
  WHERE event_type = 'demand_signal.recorded'
    AND status = 'queued';

-- ── 7. View: command_center_market_health ────────────────────────
-- Internal command center: market health rollup per country+state.
CREATE OR REPLACE VIEW command_center_market_health AS
SELECT
  ds.country_code,
  ds.region_code,
  ds.scope_key,
  ds.operator_count,
  ds.trust_score,
  ds.supply_score,
  ds.demand_score,
  ds.dominance_score,
  ds.claim_density,
  ds.freshness_score,
  ds.corridor_count,
  ds.sponsor_slot_count,
  ds.last_refreshed_at,
  -- Gap classification
  CASE
    WHEN ds.operator_count = 0 THEN 'unserved'
    WHEN ds.operator_count < 3 THEN 'underserved'
    WHEN ds.claim_density < 20 THEN 'low_claim'
    WHEN ds.trust_score < 45 THEN 'low_trust'
    ELSE 'healthy'
  END AS market_status
FROM dom_scorecards ds
WHERE ds.scope_type IN ('country', 'market', 'city')
ORDER BY ds.dominance_score DESC NULLS LAST;

COMMENT ON VIEW command_center_market_health IS
  'Internal command center view. Classifies each market as:
   unserved | underserved | low_claim | low_trust | healthy.
   Used by AdminCommandMap market coverage panel.';
