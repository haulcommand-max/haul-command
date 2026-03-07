-- ============================================================================
-- 10x Nuclear Tier — Load DNA + Convoy Telemetry + Handoff Engine
-- Migration: 20260303000005
-- ============================================================================
-- Priority sequence: data capture first → intelligence second
-- These tables create the irreversible data moat.
--
-- Existing: hc_loads (basic), loads (basic), presence_heartbeats
-- New:      hc_load_dimensions, hc_load_legs, hc_load_events,
--           hc_convoy_telemetry, hc_corridor_memory,
--           hc_emergency_dispatch_log
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) LOAD DNA — Structured Dimensions
-- ═══════════════════════════════════════════════════════════════════════════

-- Extend hc_loads with missing fields if not present
ALTER TABLE public.hc_loads
  ADD COLUMN IF NOT EXISTS length_ft NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS overhang_ft NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS axle_count SMALLINT,
  ADD COLUMN IF NOT EXISTS permit_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS escort_count_required SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS origin_place_id UUID,
  ADD COLUMN IF NOT EXISTS destination_place_id UUID,
  ADD COLUMN IF NOT EXISTS corridor_id UUID,
  ADD COLUMN IF NOT EXISTS dna_complete BOOLEAN DEFAULT false;

-- Separate dimensions table for detailed physical profile
CREATE TABLE IF NOT EXISTS public.hc_load_dimensions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id            UUID NOT NULL UNIQUE,  -- one-to-one with hc_loads
  length_ft          NUMERIC(6,2),
  width_ft           NUMERIC(6,2),
  height_ft          NUMERIC(6,2),
  weight_lbs         INT,
  axle_count         SMALLINT,
  overhang_ft        NUMERIC(5,2),
  -- Transport classification
  is_oversize        BOOLEAN DEFAULT false,
  is_overweight      BOOLEAN DEFAULT false,
  is_superload       BOOLEAN DEFAULT false,
  classification     TEXT CHECK (classification IN (
    'legal','oversize','overweight','superload','extra_heavy'
  )),
  -- Raw dimensions JSON (for weird shapes, multi-piece)
  raw_dimensions     JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_load_dim_load ON public.hc_load_dimensions(load_id);
CREATE INDEX IF NOT EXISTS idx_load_dim_class ON public.hc_load_dimensions(classification);

ALTER TABLE public.hc_load_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ld_read ON public.hc_load_dimensions FOR SELECT USING (true);
CREATE POLICY ld_service ON public.hc_load_dimensions FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY ld_owner ON public.hc_load_dimensions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hc_loads l WHERE l.id = load_id AND l.broker_id = auth.uid()
  ));

GRANT SELECT ON public.hc_load_dimensions TO anon, authenticated;
GRANT INSERT, UPDATE ON public.hc_load_dimensions TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2) LOAD DNA — State-to-State Escort Legs
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_load_legs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id            UUID NOT NULL,
  sequence_no        SMALLINT NOT NULL,
  -- Jurisdiction
  state_code         TEXT NOT NULL,          -- US state or CA province
  country_code       CHAR(2) NOT NULL DEFAULT 'US',
  -- Escort requirements per jurisdiction
  escort_required    BOOLEAN NOT NULL DEFAULT true,
  escort_count       SMALLINT NOT NULL DEFAULT 1,
  position_types     TEXT[] DEFAULT '{front}',  -- front, rear, high_pole
  permit_number      TEXT,
  -- Assignment
  assigned_operator_id UUID,
  assignment_status  TEXT DEFAULT 'unassigned' CHECK (assignment_status IN (
    'unassigned','offered','accepted','active','completed','cancelled'
  )),
  -- Handoff
  handoff_point_lat  DOUBLE PRECISION,
  handoff_point_lng  DOUBLE PRECISION,
  handoff_city       TEXT,
  -- Timing
  planned_start      TIMESTAMPTZ,
  planned_end        TIMESTAMPTZ,
  actual_start       TIMESTAMPTZ,
  actual_end         TIMESTAMPTZ,
  -- Distance
  leg_miles          NUMERIC(7,1),
  -- Rate
  rate_amount        NUMERIC(10,2),
  rate_per_mile      NUMERIC(6,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (load_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS idx_load_legs_load ON public.hc_load_legs(load_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_load_legs_operator ON public.hc_load_legs(assigned_operator_id);
CREATE INDEX IF NOT EXISTS idx_load_legs_state ON public.hc_load_legs(state_code);
CREATE INDEX IF NOT EXISTS idx_load_legs_status ON public.hc_load_legs(assignment_status)
  WHERE assignment_status IN ('unassigned','offered','active');

ALTER TABLE public.hc_load_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ll_read ON public.hc_load_legs FOR SELECT USING (true);
CREATE POLICY ll_service ON public.hc_load_legs FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_load_legs TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3) LOAD DNA — Event Timeline (The Real Gold)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_load_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id            UUID NOT NULL,
  leg_id             UUID REFERENCES public.hc_load_legs(id),
  event_type         TEXT NOT NULL CHECK (event_type IN (
    'load_posted','load_matched','permit_issued','escort_assigned',
    'convoy_started','state_line_crossed','checkpoint_passed',
    'incident_reported','route_deviated','delay_started','delay_ended',
    'proof_uploaded','convoy_completed','load_delivered',
    'invoice_submitted','payment_received','dispute_opened','dispute_closed'
  )),
  event_ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Location at time of event
  lat                DOUBLE PRECISION,
  lng                DOUBLE PRECISION,
  -- Actor
  actor_user_id      UUID,
  actor_role         TEXT CHECK (actor_role IN ('broker','operator','system','admin')),
  -- Metadata (flexible)
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Evidence linkage
  evidence_url       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only: block updates/deletes
CREATE OR REPLACE FUNCTION public.hc_block_event_mutations()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Load events are append-only. Cannot modify existing events.';
END;
$$;

DROP TRIGGER IF EXISTS hc_load_events_immutable ON public.hc_load_events;
CREATE TRIGGER hc_load_events_immutable
  BEFORE UPDATE OR DELETE ON public.hc_load_events
  FOR EACH ROW EXECUTE FUNCTION public.hc_block_event_mutations();

CREATE INDEX IF NOT EXISTS idx_load_events_load ON public.hc_load_events(load_id, event_ts);
CREATE INDEX IF NOT EXISTS idx_load_events_type ON public.hc_load_events(event_type, event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_load_events_actor ON public.hc_load_events(actor_user_id);

ALTER TABLE public.hc_load_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY le_read ON public.hc_load_events FOR SELECT USING (true);
CREATE POLICY le_insert ON public.hc_load_events FOR INSERT
  WITH CHECK (actor_user_id = auth.uid() OR auth.role() = 'service_role');

GRANT SELECT ON public.hc_load_events TO anon, authenticated;
GRANT INSERT ON public.hc_load_events TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4) LIVE CONVOY TRACKER — GPS Telemetry
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_convoy_telemetry (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id            UUID NOT NULL,
  operator_id        UUID NOT NULL,
  ts                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat                DOUBLE PRECISION NOT NULL,
  lng                DOUBLE PRECISION NOT NULL,
  speed_mph          NUMERIC(5,1),
  heading_deg        SMALLINT CHECK (heading_deg BETWEEN 0 AND 360),
  gps_accuracy_m     NUMERIC(6,1),
  -- Status
  is_moving          BOOLEAN DEFAULT true,
  leg_id             UUID REFERENCES public.hc_load_legs(id)
);

-- Partitioned by time for efficient cleanup (keep 90 days of raw telemetry)
CREATE INDEX IF NOT EXISTS idx_telemetry_load_ts
  ON public.hc_convoy_telemetry(load_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_operator_ts
  ON public.hc_convoy_telemetry(operator_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_ts
  ON public.hc_convoy_telemetry(ts DESC);

-- Spatial index on latest positions (for live map)
-- Uses the point constructor on lat/lng
ALTER TABLE public.hc_convoy_telemetry
  ADD COLUMN IF NOT EXISTS geo_point GEOGRAPHY(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_telemetry_geo
  ON public.hc_convoy_telemetry USING GIST (geo_point);

-- Auto-populate geo_point from lat/lng
CREATE OR REPLACE FUNCTION public.hc_telemetry_set_geo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.geo_point := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hc_telemetry_geo_trigger ON public.hc_convoy_telemetry;
CREATE TRIGGER hc_telemetry_geo_trigger
  BEFORE INSERT ON public.hc_convoy_telemetry
  FOR EACH ROW EXECUTE FUNCTION public.hc_telemetry_set_geo();

ALTER TABLE public.hc_convoy_telemetry ENABLE ROW LEVEL SECURITY;

-- Only the operator on the load can submit telemetry
CREATE POLICY ct_insert ON public.hc_convoy_telemetry FOR INSERT
  WITH CHECK (operator_id = auth.uid() OR auth.role() = 'service_role');
-- Broker of the load + operator can read
CREATE POLICY ct_read ON public.hc_convoy_telemetry FOR SELECT
  USING (
    operator_id = auth.uid()
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.hc_loads l WHERE l.id = load_id AND l.broker_id = auth.uid()
    )
  );

GRANT SELECT ON public.hc_convoy_telemetry TO authenticated;
GRANT INSERT ON public.hc_convoy_telemetry TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5) CORRIDOR MEMORY (Collective Pain Graph)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_corridor_memory (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id        UUID NOT NULL,
  signal_type        TEXT NOT NULL CHECK (signal_type IN (
    'bottleneck','height_restriction','weight_restriction',
    'construction','closure','enforcement','wind_risk',
    'flood_risk','bridge_issue','turn_difficulty',
    'staging_area','fuel_stop','detention_common',
    'permit_delay','escort_scarcity','incident_pattern'
  )),
  severity           TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN (
    'info','low','medium','high','critical'
  )),
  confidence         SMALLINT NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  -- Location on corridor
  lat                DOUBLE PRECISION,
  lng                DOUBLE PRECISION,
  mile_marker        NUMERIC(7,1),
  description        TEXT,
  -- Source
  source_type        TEXT NOT NULL DEFAULT 'operator_report' CHECK (source_type IN (
    'telemetry_anomaly','operator_report','broker_flag',
    'state_feed','crowd_thread','system_derived'
  )),
  source_ref_id      UUID,                  -- links back to intel_report / load_event / etc.
  -- Lifecycle
  reported_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at         TIMESTAMPTZ,           -- null = permanent knowledge
  confirmed_count    INT NOT NULL DEFAULT 0,
  denied_count       INT NOT NULL DEFAULT 0,
  -- Metadata
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_corridor_memory_corridor
  ON public.hc_corridor_memory(corridor_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_corridor_memory_type
  ON public.hc_corridor_memory(signal_type);
CREATE INDEX IF NOT EXISTS idx_corridor_memory_severity
  ON public.hc_corridor_memory(severity) WHERE severity IN ('high','critical');
CREATE INDEX IF NOT EXISTS idx_corridor_memory_active
  ON public.hc_corridor_memory(corridor_id)
  WHERE expires_at IS NULL OR expires_at > now();

ALTER TABLE public.hc_corridor_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_read ON public.hc_corridor_memory FOR SELECT USING (true);
CREATE POLICY cm_insert ON public.hc_corridor_memory FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');
CREATE POLICY cm_service ON public.hc_corridor_memory FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_corridor_memory TO anon, authenticated;
GRANT INSERT ON public.hc_corridor_memory TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6) EMERGENCY DISPATCH LOG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_emergency_dispatch_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id            UUID NOT NULL,
  triggered_by       UUID NOT NULL,         -- user who triggered
  trigger_reason     TEXT NOT NULL CHECK (trigger_reason IN (
    'escort_no_show','breakdown','compliance_issue',
    'accident','weather','bridge_strike','other'
  )),
  -- Location of emergency
  lat                DOUBLE PRECISION NOT NULL,
  lng                DOUBLE PRECISION NOT NULL,
  geo_point          GEOGRAPHY(Point, 4326),
  -- Search parameters
  radius_miles       INT NOT NULL DEFAULT 50,
  position_needed    TEXT[] DEFAULT '{front}',
  -- Results
  operators_pinged   INT NOT NULL DEFAULT 0,
  operators_responded INT NOT NULL DEFAULT 0,
  fastest_response_seconds INT,
  assigned_operator_id UUID,
  -- Status
  status             TEXT NOT NULL DEFAULT 'searching' CHECK (status IN (
    'searching','responded','assigned','resolved','expired'
  )),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at        TIMESTAMPTZ
);

-- Auto-set geo_point
CREATE OR REPLACE FUNCTION public.hc_emergency_set_geo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.geo_point := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hc_emergency_geo ON public.hc_emergency_dispatch_log;
CREATE TRIGGER hc_emergency_geo
  BEFORE INSERT ON public.hc_emergency_dispatch_log
  FOR EACH ROW EXECUTE FUNCTION public.hc_emergency_set_geo();

CREATE INDEX IF NOT EXISTS idx_emergency_load ON public.hc_emergency_dispatch_log(load_id);
CREATE INDEX IF NOT EXISTS idx_emergency_status ON public.hc_emergency_dispatch_log(status)
  WHERE status IN ('searching','responded');
CREATE INDEX IF NOT EXISTS idx_emergency_geo
  ON public.hc_emergency_dispatch_log USING GIST (geo_point);

ALTER TABLE public.hc_emergency_dispatch_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ed_read ON public.hc_emergency_dispatch_log FOR SELECT USING (true);
CREATE POLICY ed_insert ON public.hc_emergency_dispatch_log FOR INSERT
  WITH CHECK (triggered_by = auth.uid() OR auth.role() = 'service_role');

GRANT SELECT ON public.hc_emergency_dispatch_log TO authenticated;
GRANT INSERT ON public.hc_emergency_dispatch_log TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 7) PUBLIC CORRIDOR LIQUIDITY SCORE (sanitized, anti-gameable)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_corridor_liquidity_public (
  corridor_id        UUID PRIMARY KEY,
  liquidity_score    SMALLINT NOT NULL DEFAULT 50 CHECK (liquidity_score BETWEEN 0 AND 100),
  -- Components
  fill_rate_7d       NUMERIC(5,2),
  response_speed_score NUMERIC(5,2),
  operator_density_score NUMERIC(5,2),
  completion_rate_score NUMERIC(5,2),
  -- Display
  health_band        TEXT NOT NULL DEFAULT 'yellow' CHECK (health_band IN ('green','yellow','red')),
  avg_response_minutes NUMERIC(6,1),
  active_operators   INT NOT NULL DEFAULT 0,
  -- Anti-gaming
  sample_count_7d    INT NOT NULL DEFAULT 0,
  confidence         TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('low','medium','high')),
  min_sample_met     BOOLEAN NOT NULL DEFAULT false,
  -- Timing
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hc_corridor_liquidity_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY clp_read ON public.hc_corridor_liquidity_public FOR SELECT USING (true);
CREATE POLICY clp_service ON public.hc_corridor_liquidity_public FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_corridor_liquidity_public TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 8) RPCs — NUCLEAR OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 8A: Emit Load Event ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_emit_load_event(
  p_load_id      UUID,
  p_event_type   TEXT,
  p_lat          DOUBLE PRECISION DEFAULT NULL,
  p_lng          DOUBLE PRECISION DEFAULT NULL,
  p_metadata     JSONB DEFAULT '{}'::jsonb,
  p_evidence_url TEXT DEFAULT NULL,
  p_leg_id       UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_role     TEXT;
BEGIN
  -- Determine actor role
  v_role := COALESCE(
    (SELECT CASE WHEN l.broker_id = auth.uid() THEN 'broker' ELSE 'operator' END
     FROM public.hc_loads l WHERE l.id = p_load_id),
    'system'
  );

  INSERT INTO public.hc_load_events (
    load_id, leg_id, event_type, lat, lng,
    actor_user_id, actor_role, metadata, evidence_url
  ) VALUES (
    p_load_id, p_leg_id, p_event_type, p_lat, p_lng,
    auth.uid(), v_role, p_metadata, p_evidence_url
  )
  RETURNING id INTO v_event_id;

  -- Mark DNA as having activity
  UPDATE public.hc_loads SET dna_complete = true
  WHERE id = p_load_id AND NOT dna_complete;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_emit_load_event TO authenticated;


-- ── 8B: Find Nearest Verified Operators (Emergency Dispatch) ─────────────

CREATE OR REPLACE FUNCTION public.hc_emergency_find_nearest(
  p_lat            DOUBLE PRECISION,
  p_lng            DOUBLE PRECISION,
  p_radius_miles   INT DEFAULT 50,
  p_position_types TEXT[] DEFAULT '{front}'
)
RETURNS TABLE (
  operator_id      UUID,
  display_name     TEXT,
  distance_miles   NUMERIC,
  trust_tier       SMALLINT,
  verified_level   SMALLINT,
  last_active_at   TIMESTAMPTZ,
  availability     TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id AS operator_id,
    p.display_name,
    ROUND((ST_Distance(
      p.geom,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1609.34)::numeric, 1) AS distance_miles,
    COALESCE(hi.trust_tier, 0) AS trust_tier,
    COALESCE(hi.verified_level, 0) AS verified_level,
    COALESCE(hi.last_active_at, p.updated_at) AS last_active_at,
    p.availability
  FROM public.profiles p
  LEFT JOIN public.hc_identities hi ON hi.user_id = p.user_id
  WHERE p.type = 'escort'
    AND p.availability IN ('available','busy')  -- not offline
    AND p.geom IS NOT NULL
    AND ST_DWithin(
      p.geom,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_miles * 1609.34  -- convert miles to meters
    )
  ORDER BY
    CASE WHEN p.availability = 'available' THEN 0 ELSE 1 END,
    COALESCE(hi.trust_tier, 0) DESC,
    ST_Distance(
      p.geom,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    )
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.hc_emergency_find_nearest TO authenticated;


-- ── 8C: Generate Escort Relay Plan (Handoff Chain) ───────────────────────

CREATE OR REPLACE FUNCTION public.hc_generate_relay_plan(
  p_load_id UUID
)
RETURNS TABLE (
  leg_sequence     SMALLINT,
  state_code       TEXT,
  escort_required  BOOLEAN,
  escort_count     SMALLINT,
  handoff_city     TEXT,
  coverage_confidence TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_load  public.hc_loads%ROWTYPE;
BEGIN
  SELECT * INTO v_load FROM public.hc_loads WHERE id = p_load_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Load not found: %', p_load_id;
  END IF;

  -- Return existing legs if already generated
  RETURN QUERY
  SELECT
    ll.sequence_no AS leg_sequence,
    ll.state_code,
    ll.escort_required,
    ll.escort_count,
    ll.handoff_city,
    CASE
      WHEN ll.assigned_operator_id IS NOT NULL THEN 'assigned'
      WHEN EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.type = 'escort'
          AND p.state = ll.state_code
          AND p.availability = 'available'
          AND p.verified = true
      ) THEN 'high'
      WHEN EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.type = 'escort'
          AND p.state = ll.state_code
      ) THEN 'medium'
      ELSE 'low'
    END AS coverage_confidence
  FROM public.hc_load_legs ll
  WHERE ll.load_id = p_load_id
  ORDER BY ll.sequence_no;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_generate_relay_plan TO authenticated;


-- ── 8D: Compute Public Liquidity Score ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_compute_public_liquidity(
  p_corridor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fill_rate      NUMERIC;
  v_response_speed NUMERIC;
  v_density        NUMERIC;
  v_completion     NUMERIC;
  v_score          SMALLINT;
  v_sample_count   INT;
  v_band           TEXT;
BEGIN
  -- Get latest scarcity snapshot metrics
  SELECT
    COALESCE(ss.fill_rate, 0.5),
    COALESCE(1.0 - LEAST(1.0, ss.avg_response_minutes / 60.0), 0.5),
    COALESCE(LEAST(1.0, ss.supply_active_escorts::numeric / 10.0), 0),
    COALESCE(ss.fill_rate, 0.5),
    COALESCE(ss.demand_open_loads + ss.supply_active_escorts, 0)
  INTO v_fill_rate, v_response_speed, v_density, v_completion, v_sample_count
  FROM public.scarcity_snapshots ss
  WHERE ss.corridor_id = p_corridor_id
  ORDER BY ss.bucket_hour DESC
  LIMIT 1;

  -- Weighted formula
  v_score := ROUND(100 * (
    v_fill_rate * 0.35 +
    v_response_speed * 0.25 +
    v_density * 0.25 +
    v_completion * 0.15
  ))::SMALLINT;

  v_score := GREATEST(0, LEAST(100, v_score));
  v_band := CASE
    WHEN v_score >= 70 THEN 'green'
    WHEN v_score >= 40 THEN 'yellow'
    ELSE 'red'
  END;

  INSERT INTO public.hc_corridor_liquidity_public (
    corridor_id, liquidity_score,
    fill_rate_7d, response_speed_score, operator_density_score, completion_rate_score,
    health_band, active_operators, sample_count_7d,
    confidence, min_sample_met, computed_at
  ) VALUES (
    p_corridor_id, v_score,
    ROUND(v_fill_rate * 100, 1), ROUND(v_response_speed * 100, 1),
    ROUND(v_density * 100, 1), ROUND(v_completion * 100, 1),
    v_band, COALESCE(v_density * 10, 0)::int, v_sample_count,
    CASE WHEN v_sample_count >= 20 THEN 'high'
         WHEN v_sample_count >= 5 THEN 'medium'
         ELSE 'low' END,
    v_sample_count >= 5,
    now()
  )
  ON CONFLICT (corridor_id) DO UPDATE SET
    liquidity_score = EXCLUDED.liquidity_score,
    fill_rate_7d = EXCLUDED.fill_rate_7d,
    response_speed_score = EXCLUDED.response_speed_score,
    operator_density_score = EXCLUDED.operator_density_score,
    completion_rate_score = EXCLUDED.completion_rate_score,
    health_band = EXCLUDED.health_band,
    active_operators = EXCLUDED.active_operators,
    sample_count_7d = EXCLUDED.sample_count_7d,
    confidence = EXCLUDED.confidence,
    min_sample_met = EXCLUDED.min_sample_met,
    computed_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_compute_public_liquidity TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 9) VIEWS — Intelligence Surfaces
-- ═══════════════════════════════════════════════════════════════════════════

-- Load DNA complete view
CREATE OR REPLACE VIEW public.v_hc_load_dna AS
SELECT
  l.id AS load_id,
  l.broker_id,
  l.origin_city,
  l.origin_state,
  l.destination_city,
  l.destination_state,
  l.load_status,
  l.posted_at,
  -- Dimensions
  ld.length_ft,
  ld.width_ft,
  ld.height_ft,
  ld.weight_lbs,
  ld.classification,
  ld.is_superload,
  -- Legs
  (SELECT COUNT(*) FROM public.hc_load_legs ll WHERE ll.load_id = l.id) AS leg_count,
  (SELECT COUNT(*) FROM public.hc_load_legs ll WHERE ll.load_id = l.id AND ll.assignment_status = 'completed') AS legs_completed,
  -- Events
  (SELECT COUNT(*) FROM public.hc_load_events le WHERE le.load_id = l.id) AS event_count,
  (SELECT MAX(le.event_ts) FROM public.hc_load_events le WHERE le.load_id = l.id) AS last_event_at,
  -- Telemetry
  (SELECT COUNT(*) FROM public.hc_convoy_telemetry ct WHERE ct.load_id = l.id) AS telemetry_points,
  -- DNA completeness
  l.dna_complete,
  CASE
    WHEN ld.id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.hc_load_legs ll WHERE ll.load_id = l.id)
      AND EXISTS (SELECT 1 FROM public.hc_load_events le WHERE le.load_id = l.id)
    THEN true
    ELSE false
  END AS has_full_dna
FROM public.hc_loads l
LEFT JOIN public.hc_load_dimensions ld ON ld.load_id = l.id;

GRANT SELECT ON public.v_hc_load_dna TO anon, authenticated;


-- Corridor knowledge card view
CREATE OR REPLACE VIEW public.v_hc_corridor_knowledge_card AS
SELECT
  cm.corridor_id,
  COUNT(*) AS total_signals,
  COUNT(*) FILTER (WHERE cm.severity IN ('high','critical')) AS critical_signals,
  COUNT(*) FILTER (WHERE cm.signal_type = 'bottleneck') AS bottleneck_count,
  COUNT(*) FILTER (WHERE cm.signal_type = 'height_restriction') AS height_restrictions,
  COUNT(*) FILTER (WHERE cm.signal_type = 'construction') AS construction_alerts,
  COUNT(*) FILTER (WHERE cm.signal_type = 'escort_scarcity') AS scarcity_flags,
  MAX(cm.reported_at) AS latest_signal_at,
  AVG(cm.confidence) AS avg_confidence,
  -- Active signals (not expired)
  COUNT(*) FILTER (WHERE cm.expires_at IS NULL OR cm.expires_at > now()) AS active_signals,
  -- Public liquidity
  clp.liquidity_score,
  clp.health_band,
  clp.avg_response_minutes,
  clp.active_operators,
  clp.confidence AS liquidity_confidence
FROM public.hc_corridor_memory cm
LEFT JOIN public.hc_corridor_liquidity_public clp ON clp.corridor_id = cm.corridor_id
GROUP BY cm.corridor_id, clp.liquidity_score, clp.health_band,
         clp.avg_response_minutes, clp.active_operators, clp.confidence;

GRANT SELECT ON public.v_hc_corridor_knowledge_card TO anon, authenticated;

COMMIT;
