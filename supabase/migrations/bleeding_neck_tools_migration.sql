-- ============================================================================
-- ANTIGRAVITY: BLEEDING NECK TOOLS MIGRATION (T-33 through T-37)
-- ============================================================================
-- Rule 0: Additive only. Zero destructive changes.
-- Covers: Geo-Fenced Compliance, Railroad Grade Crossings, CRC Black Box,
--         Axle-Loading Bridge Weight, Dynamic Terminology Switching
-- Depends on: global_markets_migration.sql
-- ============================================================================


-- ===================== NEW ENUMS =====================

CREATE TYPE compliance_alert_severity AS ENUM (
  'info',          -- FYI: entering new jurisdiction
  'warning',       -- approaching zone with different rules
  'critical',      -- actively violating or about to violate
  'emergency'      -- immediate stop required
);

CREATE TYPE compliance_alert_type AS ENUM (
  'escort_count',         -- wrong number of escorts for load dimensions
  'permit_mismatch',      -- permit doesn't cover current jurisdiction
  'curfew_violation',     -- moving during restricted hours
  'speed_violation',      -- exceeding oversize speed limit
  'dimension_exceeded',   -- load exceeds jurisdiction max dimensions
  'certification_gap',    -- pilot cert not valid in this jurisdiction
  'border_clearance',     -- approaching border without pre-clearance
  'weight_violation',     -- exceeding axle or gross weight limits
  'equipment_missing',    -- missing required equipment (flags, lights, signs)
  'height_clearance'      -- approaching structure with insufficient clearance
);

CREATE TYPE recording_type AS ENUM (
  'radio_command',        -- standard operational radio command
  'safety_critical',      -- emergency or safety-critical communication
  'bridge_approach',      -- bridge/Structure approach callout
  'lane_change',          -- lane change coordination
  'intersection_hold',    -- intersection hold command
  'emergency_stop',       -- emergency stop command
  'general'               -- general communication
);

CREATE TYPE recording_status AS ENUM (
  'recording',
  'completed',
  'transcribed',
  'flagged',
  'archived'
);

CREATE TYPE terminology_context AS ENUM (
  'ui_label',        -- button/menu/header label
  'notification',    -- push notification or alert text
  'document',        -- permit/report/invoice wording
  'voice_command',   -- VAPI voice assistant terminology
  'seo_content'      -- website/marketing content
);


-- ===================== T-33: GEO-FENCED COMPLIANCE SENTINEL =====================
-- Real-time GPS-based compliance monitoring. Cross-references vehicle position
-- against jurisdiction rules to detect violations BEFORE they trigger fines.

CREATE TABLE public.compliance_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID REFERENCES public.assignments(id),
  provider_id         UUID REFERENCES public.providers(id),
  jurisdiction_id     UUID REFERENCES public.jurisdictions(id),
  alert_type          compliance_alert_type NOT NULL,
  severity            compliance_alert_severity NOT NULL DEFAULT 'warning',
  -- GPS snapshot at alert trigger
  trigger_lat         NUMERIC(10,7),
  trigger_lng         NUMERIC(10,7),
  trigger_speed_mph   NUMERIC(5,1),
  -- What was violated
  rule_id             UUID REFERENCES public.jurisdiction_rules(id),
  violation_detail    JSONB DEFAULT '{}',
  -- e.g. {"current_escorts":1,"required_escorts":2,"load_width_ft":14.5}
  -- e.g. {"permit_covers":"US-TX","current_jurisdiction":"US-OK"}
  -- Resolution
  acknowledged_at     TIMESTAMPTZ,
  acknowledged_by     UUID,
  resolved_at         TIMESTAMPTZ,
  resolution_action   TEXT,                -- 'stopped', 'added_escort', 'obtained_permit', 'false_alarm'
  -- Audit trail
  suppressed          BOOLEAN DEFAULT FALSE,
  suppressed_reason   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_alerts_assignment ON public.compliance_alerts(assignment_id);
CREATE INDEX idx_compliance_alerts_provider   ON public.compliance_alerts(provider_id);
CREATE INDEX idx_compliance_alerts_severity   ON public.compliance_alerts(severity);
CREATE INDEX idx_compliance_alerts_type       ON public.compliance_alerts(alert_type);
CREATE INDEX idx_compliance_alerts_created    ON public.compliance_alerts(created_at DESC);

COMMENT ON TABLE public.compliance_alerts IS
  'T-33: Geo-Fenced Compliance Sentinel. Real-time GPS+jurisdiction rule cross-reference alerts.';


-- Compliance check history (batch evaluations per route segment)
CREATE TABLE public.compliance_checks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID REFERENCES public.assignments(id),
  lead_id             UUID REFERENCES public.leads(id),
  -- Route segment evaluated
  from_jurisdiction_id UUID REFERENCES public.jurisdictions(id),
  to_jurisdiction_id   UUID REFERENCES public.jurisdictions(id),
  -- Results
  total_rules_checked  INTEGER DEFAULT 0,
  violations_found     INTEGER DEFAULT 0,
  warnings_found       INTEGER DEFAULT 0,
  check_result         JSONB DEFAULT '{}',
  -- e.g. {"escort_check":"pass","permit_check":"fail","curfew_check":"warn"}
  checked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_checks_assignment ON public.compliance_checks(assignment_id);
CREATE INDEX idx_compliance_checks_lead       ON public.compliance_checks(lead_id);

COMMENT ON TABLE public.compliance_checks IS
  'Pre-trip and en-route compliance scans per route segment.';


-- ===================== T-34: RAILROAD GRADE CROSSING PROFILER =====================
-- Adds rail_crossing as a first-class hazard type with grade/profile data.
-- Cross-references load ground clearance against crossing hump profiles.

ALTER TABLE public.route_hazards ADD COLUMN IF NOT EXISTS
  rail_crossing_data JSONB DEFAULT '{}';
  -- {
  --   "crossing_id": "DOT-123456",
  --   "grade_angle_deg": 4.2,
  --   "hump_height_ft": 0.8,
  --   "approach_grade_pct": 3.5,
  --   "departure_grade_pct": 2.1,
  --   "track_count": 2,
  --   "crossing_surface": "concrete",
  --   "active_warning": true,
  --   "gates": true,
  --   "daily_train_count": 14,
  --   "max_train_speed_mph": 60,
  --   "high_center_risk_score": 8.5
  -- }

ALTER TABLE public.route_hazards ADD COLUMN IF NOT EXISTS
  min_ground_clearance_ft NUMERIC(6,2);
  -- minimum ground clearance needed to safely traverse

ALTER TABLE public.route_hazards ADD COLUMN IF NOT EXISTS
  min_ground_clearance_m NUMERIC(6,2);
  -- metric equivalent

-- Add ground clearance fields to leads (load-specific)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS
  load_ground_clearance_ft NUMERIC(6,2);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS
  load_ground_clearance_m NUMERIC(6,2);

COMMENT ON COLUMN public.route_hazards.rail_crossing_data IS
  'T-34: Railroad Grade Crossing Profiler. DOT crossing data + hump/grade analysis.';


-- ===================== T-35: CRC BLACK BOX (Command-Response-Confirm) =====================
-- Voice recording and transcription for critical operational commands.
-- Chain of custody: who said what, when, and who confirmed.

CREATE TABLE public.crc_recordings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID REFERENCES public.assignments(id),
  -- Participants
  initiator_id        UUID REFERENCES public.providers(id),
  responder_id        UUID REFERENCES public.providers(id),
  -- Recording metadata
  recording_type      recording_type NOT NULL DEFAULT 'general',
  status              recording_status NOT NULL DEFAULT 'recording',
  -- Audio
  audio_url           TEXT,                    -- cloud storage URL
  duration_seconds    INTEGER,
  -- Transcription
  transcript_raw      TEXT,                    -- full raw transcript
  transcript_parsed   JSONB DEFAULT '{}',
  -- {
  --   "command": "Hold intersection at Main & 5th",
  --   "response": "Copy, holding Main and 5th",
  --   "confirm": "Confirmed, intersection held",
  --   "timestamps": {"command_at": "...", "response_at": "...", "confirm_at": "..."}
  -- }
  -- GPS context at time of recording
  lat                 NUMERIC(10,7),
  lng                 NUMERIC(10,7),
  speed_mph           NUMERIC(5,1),
  -- Safety flags
  missed_response     BOOLEAN DEFAULT FALSE,
  response_delay_sec  INTEGER,                -- seconds between command and response
  escalated           BOOLEAN DEFAULT FALSE,
  escalation_reason   TEXT,
  -- Legal/audit
  chain_of_custody    JSONB DEFAULT '{}',
  -- {"recorded_by":"uuid","stored_at":"s3://bucket","hash":"sha256","tamper_proof":true}
  flagged_for_review  BOOLEAN DEFAULT FALSE,
  review_notes        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crc_recordings_assignment ON public.crc_recordings(assignment_id);
CREATE INDEX idx_crc_recordings_type       ON public.crc_recordings(recording_type);
CREATE INDEX idx_crc_recordings_status     ON public.crc_recordings(status);
CREATE INDEX idx_crc_recordings_flagged    ON public.crc_recordings(flagged_for_review) WHERE flagged_for_review = TRUE;
CREATE INDEX idx_crc_recordings_missed     ON public.crc_recordings(missed_response) WHERE missed_response = TRUE;

COMMENT ON TABLE public.crc_recordings IS
  'T-35: CRC Black Box. Voice recording + transcription for Command-Response-Confirm protocol.';


-- CRC response time analytics (aggregated per provider)
CREATE TABLE public.crc_response_metrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         UUID NOT NULL REFERENCES public.providers(id),
  -- Aggregated stats (rolling 90-day window)
  total_commands       INTEGER DEFAULT 0,
  missed_responses     INTEGER DEFAULT 0,
  avg_response_sec     NUMERIC(6,2),
  p95_response_sec     NUMERIC(6,2),
  escalation_count     INTEGER DEFAULT 0,
  reliability_score    NUMERIC(5,2) DEFAULT 100.00,
  -- 100 = perfect, deducted for misses/delays
  last_calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_crc_metrics_provider ON public.crc_response_metrics(provider_id);

COMMENT ON TABLE public.crc_response_metrics IS
  'CRC Black Box aggregated reliability metrics per provider. Feeds trust scoring.';


-- ===================== T-36: AXLE-LOADING / BRIDGE WEIGHT OVERLAY =====================
-- Cross-references axle weight/spacing against bridge load ratings.

CREATE TABLE public.bridge_weight_ratings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id     UUID REFERENCES public.jurisdictions(id),
  -- Bridge identification
  bridge_id           TEXT,                    -- NBI structure number or local ID
  bridge_name         TEXT,
  route_carried       TEXT,                    -- e.g. "I-10 WB"
  feature_crossed     TEXT,                    -- e.g. "Sabine River"
  -- Location
  lat                 NUMERIC(10,7),
  lng                 NUMERIC(10,7),
  mile_marker         TEXT,
  -- Weight ratings
  operating_rating_tons  NUMERIC(8,2),         -- max routine traffic (US short tons)
  inventory_rating_tons  NUMERIC(8,2),         -- max for design life preservation
  posting_limit_tons     NUMERIC(8,2),         -- posted weight limit (if restricted)
  posting_limit_kg       NUMERIC(10,2),        -- metric equivalent
  -- Axle-specific limits
  single_axle_limit_lb   INTEGER,
  tandem_axle_limit_lb   INTEGER,
  tridem_axle_limit_lb   INTEGER,
  gross_vehicle_limit_lb INTEGER,
  -- Structural data
  year_built             INTEGER,
  year_reconstructed     INTEGER,
  deck_condition         TEXT,                 -- 'good', 'fair', 'poor', 'serious', 'critical'
  superstructure_cond    TEXT,
  substructure_cond      TEXT,
  sufficiency_rating     NUMERIC(5,2),         -- FHWA sufficiency (0-100)
  -- Access/routing
  detour_length_mi       NUMERIC(6,1),
  overweight_permit_ok   BOOLEAN DEFAULT FALSE,
  permit_contact         TEXT,
  -- Data lineage
  data_source            TEXT DEFAULT 'nbi',   -- 'nbi', 'state_dot', 'survey', 'crowdsourced'
  last_inspected_at      DATE,
  last_verified_at       TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bridge_weight_jurisdiction ON public.bridge_weight_ratings(jurisdiction_id);
CREATE INDEX idx_bridge_weight_geo          ON public.bridge_weight_ratings(lat, lng);
CREATE INDEX idx_bridge_weight_posting      ON public.bridge_weight_ratings(posting_limit_tons)
  WHERE posting_limit_tons IS NOT NULL;
CREATE INDEX idx_bridge_weight_condition    ON public.bridge_weight_ratings(deck_condition);

COMMENT ON TABLE public.bridge_weight_ratings IS
  'T-36: Axle-Loading Bridge Weight Overlay. NBI + state DOT bridge weight ratings for route planning.';

-- Axle configuration for loads (per lead/assignment)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS
  axle_config JSONB DEFAULT '{}';
  -- {
  --   "total_axles": 9,
  --   "axle_groups": [
  --     {"type": "steer", "axles": 1, "weight_lb": 12000, "spacing_ft": 0},
  --     {"type": "drive_tandem", "axles": 2, "weight_lb": 34000, "spacing_ft": 4.5},
  --     {"type": "trailer_tridem", "axles": 3, "weight_lb": 54000, "spacing_ft": 4.25},
  --     {"type": "jeep_tandem", "axles": 2, "weight_lb": 40000, "spacing_ft": 4.5},
  --     {"type": "stinger", "axles": 1, "weight_lb": 20000, "spacing_ft": 0}
  --   ],
  --   "total_gross_lb": 160000,
  --   "overall_length_ft": 95,
  --   "wheelbase_ft": 72
  -- }


-- ===================== T-37: DYNAMIC TERMINOLOGY SWITCHING =====================
-- Region-aware UI localization for industry terms.

CREATE TABLE public.terminology_map (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Term identity
  canonical_key       TEXT NOT NULL,            -- 'pilot_car', 'oversize_load', 'escort_vehicle'
  market_id           UUID REFERENCES public.markets(id),
  jurisdiction_id     UUID REFERENCES public.jurisdictions(id),  -- NULL = market-wide default
  context             terminology_context NOT NULL DEFAULT 'ui_label',
  -- Localized values
  display_term        TEXT NOT NULL,            -- what the user sees
  display_plural      TEXT,                     -- plural form
  abbreviation        TEXT,                     -- short form for tight UI
  tooltip             TEXT,                     -- hover/info text explaining the term
  -- Matching
  search_aliases      TEXT[] DEFAULT '{}',      -- additional terms that map to this canonical
  -- e.g. for 'pilot_car': ['escort vehicle', 'warning vehicle', 'chase car', 'pace car']
  -- Priority
  priority            INTEGER DEFAULT 0,        -- higher wins when multiple matches (jurisdiction > market)
  active              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_terminology_canonical ON public.terminology_map(canonical_key);
CREATE INDEX idx_terminology_market    ON public.terminology_map(market_id);
CREATE INDEX idx_terminology_juris     ON public.terminology_map(jurisdiction_id);
CREATE UNIQUE INDEX idx_terminology_unique ON public.terminology_map(canonical_key, market_id, jurisdiction_id, context)
  WHERE active = TRUE;

COMMENT ON TABLE public.terminology_map IS
  'T-37: Dynamic Terminology Switching. Region-aware UI labels for industry terms.';


-- ===================== SEED: CORE TERMINOLOGY MAP =====================

DO $$
DECLARE
  us_id UUID; ca_id UUID; uk_id UUID; au_id UUID; eu_id UUID;
BEGIN
  SELECT id INTO us_id FROM public.markets WHERE code = 'US';
  SELECT id INTO ca_id FROM public.markets WHERE code = 'CA';
  SELECT id INTO uk_id FROM public.markets WHERE code = 'UK';
  SELECT id INTO au_id FROM public.markets WHERE code = 'AU';
  SELECT id INTO eu_id FROM public.markets WHERE code = 'EU';

  INSERT INTO public.terminology_map (canonical_key, market_id, context, display_term, display_plural, abbreviation, search_aliases) VALUES
    -- pilot_car
    ('pilot_car', us_id, 'ui_label', 'Pilot Car',        'Pilot Cars',        'PC',   '{"escort vehicle","chase car","lead car"}'),
    ('pilot_car', ca_id, 'ui_label', 'Pilot Vehicle',     'Pilot Vehicles',    'PV',   '{"escort vehicle","lead vehicle"}'),
    ('pilot_car', uk_id, 'ui_label', 'Escort Vehicle',    'Escort Vehicles',   'EV',   '{"warning vehicle","abnormal load escort"}'),
    ('pilot_car', au_id, 'ui_label', 'Pilot Vehicle',     'Pilot Vehicles',    'PV',   '{"warning vehicle","escort vehicle","lead vehicle"}'),
    ('pilot_car', eu_id, 'ui_label', 'Escort Vehicle',    'Escort Vehicles',   'EV',   '{"begleitfahrzeug","véhicule d''escorte","voertuig begeleiding"}'),
    -- oversize_load
    ('oversize_load', us_id, 'ui_label', 'Oversize Load',          'Oversize Loads',           'OS',   '{"wide load","overweight load","superload"}'),
    ('oversize_load', ca_id, 'ui_label', 'Oversize Load',          'Oversize Loads',           'OS',   '{"overdimensional","extra-legal load"}'),
    ('oversize_load', uk_id, 'ui_label', 'Abnormal Load',          'Abnormal Loads',           'AL',   '{"abnormal indivisible load","AIL","special order"}'),
    ('oversize_load', au_id, 'ui_label', 'Excess Dimension Vehicle','Excess Dimension Vehicles','EDV',  '{"oversize overmass","OSOM","class 1 load"}'),
    ('oversize_load', eu_id, 'ui_label', 'Exceptional Transport',  'Exceptional Transports',   'ET',   '{"schwertransport","transport exceptionnel","trasporto eccezionale"}'),
    -- permit
    ('permit', us_id, 'ui_label', 'Oversize/Overweight Permit', 'Permits',    'OOS',  '{"single trip permit","annual permit","superload permit"}'),
    ('permit', ca_id, 'ui_label', 'Movement Permit',            'Permits',    'MP',   '{"oversize permit","extra-legal permit"}'),
    ('permit', uk_id, 'ui_label', 'Movement Order',             'Movement Orders', 'MO', '{"VR1","special order","ESDAL notification"}'),
    ('permit', au_id, 'ui_label', 'Access Permit',              'Access Permits',  'AP', '{"NHVR permit","class 1 permit","OSOM permit"}'),
    ('permit', eu_id, 'ui_label', 'Transport Permit',           'Transport Permits','TP', '{"genehmigung","autorisation","vergunning"}'),
    -- height_pole
    ('height_pole', us_id, 'ui_label', 'Height Pole',     'Height Poles',     'HP',   '{"high pole","clearance pole","measuring stick"}'),
    ('height_pole', uk_id, 'ui_label', 'Bridge Gauge',    'Bridge Gauges',    'BG',   '{"height gauge","clearance stick"}'),
    ('height_pole', au_id, 'ui_label', 'Height Indicator','Height Indicators','HI',   '{"clearance indicator","height stick"}'),
    -- shoe_fly (urban zigzag maneuver)
    ('shoe_fly', us_id, 'ui_label', 'Shoe Fly',          'Shoe Flies',       'SF',   '{"zigzag","s-curve maneuver","urban zigzag"}'),
    ('shoe_fly', uk_id, 'ui_label', 'Lateral Deviation',  'Lateral Deviations','LD', '{"road offset maneuver"}'),
    ('shoe_fly', au_id, 'ui_label', 'Road Deviation',     'Road Deviations',  'RD',   '{"temporary deviation"}');
END $$;


-- ===================== RLS ON NEW TABLES =====================

ALTER TABLE public.compliance_alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crc_recordings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crc_response_metrics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_weight_ratings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology_map         ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY "terminology_public_read" ON public.terminology_map FOR SELECT USING (TRUE);
CREATE POLICY "bridge_weight_public_read" ON public.bridge_weight_ratings FOR SELECT USING (TRUE);

-- Service role full access
CREATE POLICY "service_role_all_compliance_alerts"     ON public.compliance_alerts     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_compliance_checks"     ON public.compliance_checks     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_crc_recordings"        ON public.crc_recordings        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_crc_response_metrics"  ON public.crc_response_metrics  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_bridge_weight_ratings" ON public.bridge_weight_ratings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_terminology_map"       ON public.terminology_map       FOR ALL USING (auth.role() = 'service_role');


-- ===================== UPDATED_AT TRIGGERS =====================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'bridge_weight_ratings'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================================
-- END BLEEDING NECK TOOLS MIGRATION (T-33 through T-37)
-- ============================================================================
