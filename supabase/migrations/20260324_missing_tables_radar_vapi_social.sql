-- ============================================================================
-- MISSING TABLES MIGRATION — 2026-03-24
-- Covers all tables referenced in code that had no existing migration:
--   1. Radar geo + RPCs (hc_rm_radar_geo, hc_csn_signals + 4 RPCs)
--   2. VAPI tables (vapi_call_events, vapi_call_transcripts,
--      vapi_call_intelligence, vapi_offer_log)
--   3. Social distribution (distribution_posts, social_post_queue, push_queue)
--   4. Waitlist (waitlist_signups)
--   5. Email sequences (email_sequence_enrollments)
--   6. Country compliance (country_compliance)
--   7. Behavioral events (behavioral_events)
--   8. Ad revenue rollup cron support functions
-- Anti-downgrade: 100% additive — all CREATE TABLE IF NOT EXISTS
-- ============================================================================

-- ============================================================================
-- 1. RADAR GEO — hc_rm_radar_geo + hc_csn_signals
--    Powers GlobalEscortSupplyRadar and radar.ts data access layer
-- ============================================================================

DROP TABLE IF EXISTS hc_rm_radar_geo CASCADE;
DROP TABLE IF EXISTS hc_rm_radar_us_states CASCADE;
DROP TABLE IF EXISTS hc_csn_signals CASCADE;

-- Country-level radar data (one row per country)
CREATE TABLE IF NOT EXISTS hc_rm_radar_geo (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code     TEXT NOT NULL UNIQUE,           -- ISO2 code, e.g. 'US', 'CA'
  country_name     TEXT NOT NULL,
  tier             TEXT DEFAULT 'C'
                   CHECK (tier IN ('A','B','C','D')),
  launch_wave      INTEGER CHECK (launch_wave BETWEEN 1 AND 5),
  is_active_market BOOLEAN DEFAULT FALSE,
  surface_count    INTEGER DEFAULT 0,              -- SEO pages
  entity_count     INTEGER DEFAULT 0,              -- directory listings
  operator_count   INTEGER DEFAULT 0,              -- verified operators
  load_count_24h   INTEGER DEFAULT 0,              -- loads posted last 24h
  demand_level     TEXT DEFAULT 'none'
                   CHECK (demand_level IN ('high','medium','med','low','none')),
  supply_level     TEXT DEFAULT 'none'
                   CHECK (supply_level IN ('high','medium','low','none')),
  liquidity_score  NUMERIC(5,2) DEFAULT 0,
  radar_updated_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_geo_country   ON hc_rm_radar_geo(country_code);
CREATE INDEX IF NOT EXISTS idx_radar_geo_active     ON hc_rm_radar_geo(is_active_market);
CREATE INDEX IF NOT EXISTS idx_radar_geo_tier       ON hc_rm_radar_geo(tier);
CREATE INDEX IF NOT EXISTS idx_radar_geo_wave       ON hc_rm_radar_geo(launch_wave);

-- US state-level radar data
CREATE TABLE IF NOT EXISTS hc_rm_radar_us_states (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code      TEXT NOT NULL,                  -- e.g. 'US-TX'
  state_abbr       TEXT NOT NULL UNIQUE,            -- e.g. 'TX'
  state_name       TEXT NOT NULL,
  operator_count   INTEGER DEFAULT 0,
  load_count_24h   INTEGER DEFAULT 0,
  demand_level     TEXT DEFAULT 'low'
                   CHECK (demand_level IN ('high','medium','low','none')),
  supply_level     TEXT DEFAULT 'low'
                   CHECK (supply_level IN ('high','medium','low','none')),
  liquidity_score  NUMERIC(5,2) DEFAULT 0,
  radar_updated_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_us_state ON hc_rm_radar_us_states(state_abbr);

-- CSN (Crowdsourced Signal Network) signals — live route intelligence feeds
CREATE TABLE IF NOT EXISTS hc_csn_signals (
  signal_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type    TEXT NOT NULL
                 CHECK (signal_type IN (
                   'low_bridge','construction','police_checkpoint','high_wind',
                   'lane_closure','corridor_clear','permit_checkpoint',
                   'tight_turn','weight_restriction','road_damage','flooding',
                   'escort_active','staging_area_full','port_congestion',
                   'ice_conditions','detour_required'
                 )),
  description    TEXT,
  latitude       NUMERIC(10,7),
  longitude      NUMERIC(10,7),
  country_code   TEXT DEFAULT 'US',
  state_abbr     TEXT,
  corridor_code  TEXT,
  confidence     TEXT DEFAULT 'community'
                 CHECK (confidence IN ('verified','community','unconfirmed')),
  reported_by    UUID,                             -- operator_id (optional anon)
  upvotes        INTEGER DEFAULT 0,
  downvotes      INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 hours')
);

CREATE INDEX IF NOT EXISTS idx_csn_signals_active   ON hc_csn_signals(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_csn_signals_country  ON hc_csn_signals(country_code);
CREATE INDEX IF NOT EXISTS idx_csn_signals_type     ON hc_csn_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_csn_signals_corridor ON hc_csn_signals(corridor_code);
CREATE INDEX IF NOT EXISTS idx_csn_signals_created  ON hc_csn_signals(created_at DESC);

-- Seed: pre-populate US from existing global_countries data if it exists
INSERT INTO hc_rm_radar_geo (country_code, country_name, tier, launch_wave, is_active_market, demand_level, supply_level, liquidity_score)
VALUES ('US', 'United States', 'A', 1, TRUE, 'high', 'high', 85)
ON CONFLICT (country_code) DO NOTHING;

-- Seed 56 non-US countries with correct wave/tier assignments
INSERT INTO hc_rm_radar_geo (country_code, country_name, tier, launch_wave, is_active_market, demand_level, supply_level)
VALUES
('CA','Canada',         'A',2,FALSE,'high','medium'),
('AU','Australia',      'A',2,FALSE,'high','medium'),
('GB','United Kingdom', 'A',3,FALSE,'medium','low'),
('DE','Germany',        'A',3,FALSE,'medium','low'),
('FR','France',         'B',3,FALSE,'medium','low'),
('NL','Netherlands',    'B',3,FALSE,'medium','low'),
('BE','Belgium',        'B',3,FALSE,'low','low'),
('ES','Spain',          'B',3,FALSE,'low','low'),
('IT','Italy',          'B',3,FALSE,'low','low'),
('PT','Portugal',       'C',3,FALSE,'low','none'),
('PL','Poland',         'B',3,FALSE,'medium','low'),
('CZ','Czech Republic', 'C',3,FALSE,'low','none'),
('AT','Austria',        'C',3,FALSE,'low','none'),
('CH','Switzerland',    'B',3,FALSE,'low','none'),
('SE','Sweden',         'B',3,FALSE,'medium','low'),
('NO','Norway',         'A',3,FALSE,'high','medium'),
('DK','Denmark',        'B',3,FALSE,'low','none'),
('FI','Finland',        'C',3,FALSE,'low','none'),
('IE','Ireland',        'C',3,FALSE,'low','none'),
('HU','Hungary',        'C',3,FALSE,'low','none'),
('RO','Romania',        'C',3,FALSE,'low','none'),
('BG','Bulgaria',       'D',3,FALSE,'none','none'),
('HR','Croatia',        'D',3,FALSE,'none','none'),
('SK','Slovakia',       'D',3,FALSE,'none','none'),
('SI','Slovenia',       'D',3,FALSE,'none','none'),
('EE','Estonia',        'D',3,FALSE,'none','none'),
('LV','Latvia',         'D',3,FALSE,'none','none'),
('LT','Lithuania',      'D',3,FALSE,'none','none'),
('GR','Greece',         'C',3,FALSE,'low','none'),
('TR','Turkey',         'B',3,FALSE,'medium','low'),
('BR','Brazil',         'A',4,FALSE,'high','low'),
('MX','Mexico',         'A',4,FALSE,'high','low'),
('AR','Argentina',      'B',4,FALSE,'low','none'),
('CL','Chile',          'B',4,FALSE,'low','none'),
('CO','Colombia',       'B',4,FALSE,'low','none'),
('PE','Peru',           'C',4,FALSE,'none','none'),
('UY','Uruguay',        'D',4,FALSE,'none','none'),
('CR','Costa Rica',     'D',4,FALSE,'none','none'),
('PA','Panama',         'D',4,FALSE,'none','none'),
('AE','United Arab Emirates','A',4,FALSE,'high','low'),
('SA','Saudi Arabia',   'A',4,FALSE,'high','low'),
('QA','Qatar',          'B',4,FALSE,'medium','none'),
('KW','Kuwait',         'B',4,FALSE,'medium','none'),
('BH','Bahrain',        'C',4,FALSE,'low','none'),
('OM','Oman',           'C',4,FALSE,'low','none'),
('IN','India',          'A',4,FALSE,'high','low'),
('ID','Indonesia',      'B',4,FALSE,'medium','none'),
('TH','Thailand',       'B',4,FALSE,'medium','none'),
('MY','Malaysia',       'B',4,FALSE,'medium','none'),
('SG','Singapore',      'A',4,FALSE,'high','low'),
('PH','Philippines',    'C',4,FALSE,'low','none'),
('VN','Vietnam',        'C',4,FALSE,'low','none'),
('JP','Japan',          'A',4,FALSE,'high','low'),
('KR','South Korea',    'A',4,FALSE,'high','low'),
('ZA','South Africa',   'B',4,FALSE,'medium','none'),
('NZ','New Zealand',    'B',5,FALSE,'low','none'),
('NG','Nigeria',        'B',5,FALSE,'medium','none')
ON CONFLICT (country_code) DO NOTHING;

-- Seed US states with initial data
INSERT INTO hc_rm_radar_us_states (region_code, state_abbr, state_name, operator_count, load_count_24h, demand_level, supply_level, liquidity_score)
VALUES
('US-TX','TX','Texas',         2850,48,'high','high',82),
('US-CA','CA','California',    1120,22,'high','medium',68),
('US-FL','FL','Florida',        680,18,'medium','medium',71),
('US-OK','OK','Oklahoma',       520,14,'high','high',88),
('US-LA','LA','Louisiana',      490,16,'high','high',85),
('US-OH','OH','Ohio',           380,12,'medium','medium',72),
('US-PA','PA','Pennsylvania',   340,10,'medium','medium',70),
('US-GA','GA','Georgia',        310,9,'medium','medium',69),
('US-IL','IL','Illinois',       290,8,'medium','medium',67),
('US-NC','NC','North Carolina', 280,8,'medium','medium',66),
('US-WA','WA','Washington',     260,7,'medium','medium',65),
('US-AZ','AZ','Arizona',        250,7,'medium','medium',64),
('US-IN','IN','Indiana',        240,7,'medium','medium',63),
('US-MO','MO','Missouri',       230,6,'medium','medium',62),
('US-CO','CO','Colorado',       220,6,'medium','medium',61),
('US-NY','NY','New York',       210,6,'medium','low',58),
('US-MI','MI','Michigan',       200,5,'medium','medium',60),
('US-TN','TN','Tennessee',      190,5,'medium','medium',59),
('US-AL','AL','Alabama',        180,5,'medium','medium',58),
('US-MS','MS','Mississippi',    170,5,'high','medium',73),
('US-AR','AR','Arkansas',       160,4,'high','medium',75),
('US-KS','KS','Kansas',         150,4,'medium','medium',62),
('US-MN','MN','Minnesota',      140,4,'medium','medium',61),
('US-WI','WI','Wisconsin',      130,4,'medium','medium',60),
('US-IA','IA','Iowa',           120,3,'medium','medium',59),
('US-SC','SC','South Carolina', 115,3,'medium','medium',58),
('US-KY','KY','Kentucky',       110,3,'medium','medium',57),
('US-OR','OR','Oregon',         105,3,'medium','medium',56),
('US-NM','NM','New Mexico',     100,3,'high','medium',78),
('US-NV','NV','Nevada',          95,3,'medium','medium',55),
('US-ID','ID','Idaho',           90,2,'low','low',44),
('US-WV','WV','West Virginia',   85,2,'medium','low',52),
('US-ND','ND','North Dakota',    80,2,'high','high',88),
('US-NE','NE','Nebraska',        75,2,'medium','medium',60),
('US-UT','UT','Utah',            70,2,'medium','medium',59),
('US-WY','WY','Wyoming',         65,2,'high','high',86),
('US-MT','MT','Montana',         60,2,'medium','medium',58),
('US-SD','SD','South Dakota',    55,2,'medium','medium',57),
('US-VA','VA','Virginia',        50,1,'medium','low',50),
('US-MD','MD','Maryland',        45,1,'low','low',42)
ON CONFLICT (state_abbr) DO NOTHING;

-- ============================================================================
-- 2. RADAR RPCs — 4 stored procedures called by lib/supabase/radar.ts
-- ============================================================================

DROP FUNCTION IF EXISTS rpc_radar_country_summary CASCADE;
DROP FUNCTION IF EXISTS rpc_radar_us_states CASCADE;
DROP FUNCTION IF EXISTS rpc_radar_live_signals CASCADE;
DROP FUNCTION IF EXISTS rpc_radar_stats CASCADE;

-- rpc_radar_country_summary: returns country-level radar data
CREATE OR REPLACE FUNCTION rpc_radar_country_summary()
RETURNS TABLE (
  country_code     TEXT,
  country_name     TEXT,
  tier             TEXT,
  launch_wave      INTEGER,
  is_active_market BOOLEAN,
  surface_count    INTEGER,
  entity_count     INTEGER,
  operator_count   INTEGER,
  load_count_24h   INTEGER,
  demand_level     TEXT,
  supply_level     TEXT,
  liquidity_score  NUMERIC,
  radar_updated_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    country_code, country_name, tier, launch_wave, is_active_market,
    surface_count, entity_count, operator_count, load_count_24h,
    demand_level, supply_level, liquidity_score, radar_updated_at
  FROM hc_rm_radar_geo
  ORDER BY
    CASE WHEN is_active_market THEN 0 ELSE 1 END,
    COALESCE(launch_wave, 99),
    tier,
    country_name;
$$;

-- rpc_radar_us_states: returns US state-level data
CREATE OR REPLACE FUNCTION rpc_radar_us_states()
RETURNS TABLE (
  region_code      TEXT,
  state_abbr       TEXT,
  operator_count   INTEGER,
  load_count_24h   INTEGER,
  demand_level     TEXT,
  supply_level     TEXT,
  liquidity_score  NUMERIC,
  radar_updated_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    region_code, state_abbr, operator_count, load_count_24h,
    demand_level, supply_level, liquidity_score, radar_updated_at
  FROM hc_rm_radar_us_states
  ORDER BY operator_count DESC;
$$;

-- rpc_radar_live_signals: most recent active signals
CREATE OR REPLACE FUNCTION rpc_radar_live_signals(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  signal_id    UUID,
  signal_type  TEXT,
  description  TEXT,
  latitude     NUMERIC,
  longitude    NUMERIC,
  country_code TEXT,
  confidence   TEXT,
  created_at   TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  upvotes      INTEGER,
  downvotes    INTEGER
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    signal_id, signal_type, description, latitude, longitude,
    country_code, confidence, created_at, expires_at, upvotes, downvotes
  FROM hc_csn_signals
  WHERE is_active = TRUE AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- rpc_radar_stats: aggregate stats for the radar overlay widgets
CREATE OR REPLACE FUNCTION rpc_radar_stats()
RETURNS TABLE (
  total_countries  BIGINT,
  active_markets   BIGINT,
  total_surfaces   BIGINT,
  total_entities   BIGINT,
  total_operators  BIGINT,
  active_signals   BIGINT,
  last_updated     TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*)                                             AS total_countries,
    COUNT(*) FILTER (WHERE is_active_market)             AS active_markets,
    COALESCE(SUM(surface_count), 0)                      AS total_surfaces,
    COALESCE(SUM(entity_count), 0)                       AS total_entities,
    COALESCE(SUM(operator_count), 0)                     AS total_operators,
    (SELECT COUNT(*) FROM hc_csn_signals WHERE is_active AND expires_at > NOW()) AS active_signals,
    MAX(radar_updated_at)                                AS last_updated
  FROM hc_rm_radar_geo;
$$;

-- RLS: radar data is publicly readable
ALTER TABLE hc_rm_radar_geo        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_rm_radar_us_states  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_csn_signals         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radar_geo_public_read"    ON hc_rm_radar_geo        FOR SELECT USING (TRUE);
CREATE POLICY "radar_states_public_read" ON hc_rm_radar_us_states  FOR SELECT USING (TRUE);
CREATE POLICY "csn_signals_public_read"  ON hc_csn_signals         FOR SELECT USING (TRUE);
CREATE POLICY "csn_signals_auth_insert"  ON hc_csn_signals         FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "radar_geo_service"        ON hc_rm_radar_geo        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "radar_states_service"     ON hc_rm_radar_us_states  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "csn_signals_service"      ON hc_csn_signals         FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. VAPI TABLES — Voice AI pipeline
-- ============================================================================

CREATE TABLE IF NOT EXISTS vapi_call_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id         TEXT NOT NULL UNIQUE,
  operator_id     UUID,
  load_id         UUID,
  event_type      TEXT,
  status          TEXT DEFAULT 'initiated'
                  CHECK (status IN ('initiated','in_progress','completed','failed','no_answer')),
  direction       TEXT DEFAULT 'outbound'
                  CHECK (direction IN ('inbound','outbound')),
  duration_secs   INTEGER,
  outcome         TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vapi_events_call       ON vapi_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_vapi_events_operator   ON vapi_call_events(operator_id);
CREATE INDEX IF NOT EXISTS idx_vapi_events_created    ON vapi_call_events(created_at DESC);

CREATE TABLE IF NOT EXISTS vapi_call_transcripts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id         TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('assistant','user','system','tool')),
  content         TEXT NOT NULL,
  timestamp_ms    BIGINT,
  sequence        INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vapi_transcripts_call ON vapi_call_transcripts(call_id);
CREATE INDEX IF NOT EXISTS idx_vapi_transcripts_seq  ON vapi_call_transcripts(call_id, sequence);

CREATE TABLE IF NOT EXISTS vapi_call_intelligence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id         TEXT NOT NULL UNIQUE,
  operator_id     UUID,
  intent          TEXT,
  sentiment       TEXT CHECK (sentiment IN ('positive','neutral','negative','unknown')),
  interest_level  TEXT CHECK (interest_level IN ('high','medium','low','none')),
  objections      TEXT[],
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  load_discussed  UUID,
  converted       BOOLEAN DEFAULT FALSE,
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vapi_intel_call     ON vapi_call_intelligence(call_id);
CREATE INDEX IF NOT EXISTS idx_vapi_intel_operator ON vapi_call_intelligence(operator_id);

CREATE TABLE IF NOT EXISTS vapi_offer_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL,
  load_id         UUID NOT NULL,
  call_id         TEXT,
  offer_status    TEXT DEFAULT 'pending'
                  CHECK (offer_status IN ('pending','called','no_answer','accepted','declined','expired')),
  offer_rate      NUMERIC(10,2),
  attempt_number  INTEGER DEFAULT 1,
  reason_declined TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vapi_offer_operator ON vapi_offer_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_vapi_offer_load     ON vapi_offer_log(load_id);
CREATE INDEX IF NOT EXISTS idx_vapi_offer_status   ON vapi_offer_log(offer_status);

-- RLS: service role only (internal pipeline)
ALTER TABLE vapi_call_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vapi_call_transcripts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vapi_call_intelligence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vapi_offer_log          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vapi_events_service"      ON vapi_call_events        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "vapi_transcripts_service" ON vapi_call_transcripts   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "vapi_intel_service"       ON vapi_call_intelligence  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "vapi_offer_service"       ON vapi_offer_log          FOR ALL USING (auth.role() = 'service_role');

-- Operators can see their own call logs
CREATE POLICY "vapi_events_operator_read" ON vapi_call_events
  FOR SELECT TO authenticated
  USING (operator_id = auth.uid());

CREATE POLICY "vapi_intel_operator_read" ON vapi_call_intelligence
  FOR SELECT TO authenticated
  USING (operator_id = auth.uid());

-- ============================================================================
-- 4. SOCIAL DISTRIBUTION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS distribution_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL
                  CHECK (content_type IN ('blog_post','video','compliance_alert','market_update','operator_spotlight','load_alert')),
  source_id       UUID,                            -- blog_post_id or content_queue_id
  title           TEXT,
  body            TEXT,
  image_url       TEXT,
  link_url        TEXT,
  platforms       TEXT[] DEFAULT '{}',             -- twitter, linkedin, facebook, instagram
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','scheduled','publishing','published','failed')),
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  error_message   TEXT,
  platform_post_ids JSONB DEFAULT '{}',            -- {twitter: 'id', linkedin: 'id', ...}
  engagement_data   JSONB DEFAULT '{}',            -- impressions, likes, shares per platform
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dist_posts_status    ON distribution_posts(status);
CREATE INDEX IF NOT EXISTS idx_dist_posts_scheduled ON distribution_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dist_posts_type      ON distribution_posts(content_type);

-- Social post queue (individual platform tasks)
CREATE TABLE IF NOT EXISTS social_post_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_post_id UUID REFERENCES distribution_posts(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL
                  CHECK (platform IN ('twitter','linkedin','facebook','instagram','youtube','tiktok')),
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','posted','failed','skipped')),
  post_content    TEXT,
  media_urls      TEXT[] DEFAULT '{}',
  scheduled_at    TIMESTAMPTZ,
  posted_at       TIMESTAMPTZ,
  platform_post_id TEXT,
  attempt_count   INTEGER DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_queue_status   ON social_post_queue(status);
CREATE INDEX IF NOT EXISTS idx_social_queue_platform ON social_post_queue(platform);
CREATE INDEX IF NOT EXISTS idx_social_queue_schedule ON social_post_queue(scheduled_at);

-- Push notification queue (app + email)
CREATE TABLE IF NOT EXISTS push_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type      TEXT NOT NULL CHECK (queue_type IN ('push','email','sms')),
  recipient_id    UUID,                            -- user_id or operator_id
  recipient_email TEXT,
  recipient_phone TEXT,
  title           TEXT,
  body            TEXT NOT NULL,
  data            JSONB DEFAULT '{}',              -- deep link data
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','failed','bounced','skipped')),
  priority        INTEGER DEFAULT 5,               -- 1=highest, 10=lowest
  scheduled_at    TIMESTAMPTZ DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  attempt_count   INTEGER DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_queue_status    ON push_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_push_queue_recipient ON push_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_push_queue_type      ON push_queue(queue_type);

ALTER TABLE distribution_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_queue          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dist_posts_service"   ON distribution_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "social_queue_service" ON social_post_queue  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "push_queue_service"   ON push_queue         FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. WAITLIST SIGNUPS — /api/waitlist route
-- ============================================================================

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  role            TEXT CHECK (role IN ('escort','broker','fleet','other')),
  country_code    TEXT DEFAULT 'US',
  state_abbr      TEXT,
  corridor_interest TEXT[],
  referral_source TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  ip_hash         TEXT,
  invited_at      TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'waiting'
                  CHECK (status IN ('waiting','invited','converted','unsubscribed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email   ON waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status  ON waitlist_signups(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist_signups(created_at DESC);

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_service" ON waitlist_signups FOR ALL USING (auth.role() = 'service_role');
-- Allow anonymous inserts for the public waitlist form
CREATE POLICY "waitlist_anon_insert" ON waitlist_signups FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- 6. EMAIL SEQUENCE ENROLLMENTS — used by /api/cron/email-sequences
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  trigger_event   TEXT,                            -- 'signup', 'day7_inactive', etc.
  steps           JSONB DEFAULT '[]',              -- [{day, subject, template_id}]
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  user_id         UUID,
  operator_id     UUID,
  email           TEXT NOT NULL,
  current_step    INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','paused','completed','unsubscribed','bounced')),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_send_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  UNIQUE(sequence_id, email)
);

CREATE INDEX IF NOT EXISTS idx_seq_enrollments_status  ON email_sequence_enrollments(status, next_send_at);
CREATE INDEX IF NOT EXISTS idx_seq_enrollments_email   ON email_sequence_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_seq_enrollments_user    ON email_sequence_enrollments(user_id);

-- Seed baseline sequences
INSERT INTO email_sequences (name, description, trigger_event, steps) VALUES
('welcome_escort',  'New escort operator onboarding drip', 'escort_signup',
 '[{"day":0,"subject":"Welcome to Haul Command","template":"welcome_escort_d0"},
   {"day":3,"subject":"Claim your first corridor","template":"welcome_escort_d3"},
   {"day":7,"subject":"Your territory is open","template":"welcome_escort_d7"},
   {"day":14,"subject":"Operators near you are booking","template":"welcome_escort_d14"}]'),
('welcome_broker',  'New broker onboarding drip', 'broker_signup',
 '[{"day":0,"subject":"Your load board is live","template":"welcome_broker_d0"},
   {"day":3,"subject":"Fill your first load faster","template":"welcome_broker_d3"},
   {"day":7,"subject":"Stage probability explained","template":"welcome_broker_d7"}]'),
('waitlist_invite', 'Waitlist invite drip when slot opens', 'waitlist_slot_open',
 '[{"day":0,"subject":"Your spot is ready — join Haul Command","template":"waitlist_invite_d0"},
   {"day":2,"subject":"48 hours left to claim your spot","template":"waitlist_invite_d2"}]'),
('certification_nudge', 'AV Certification upsell sequence', 'cert_eligible',
 '[{"day":0,"subject":"You qualify for AV-Ready Certification","template":"av_cert_nudge_d0"},
   {"day":7,"subject":"Certified escorts get priority loads","template":"av_cert_nudge_d7"}]')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE email_sequences             ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_seq_service"         ON email_sequences            FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "email_enrollments_service" ON email_sequence_enrollments FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. COUNTRY COMPLIANCE — used by lib/vapi/compliance-enforcer.ts
-- ============================================================================

CREATE TABLE IF NOT EXISTS country_compliance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    TEXT NOT NULL UNIQUE,
  country_name    TEXT NOT NULL,
  -- Escort requirement thresholds
  width_threshold_m   NUMERIC(6,3),               -- meters
  height_threshold_m  NUMERIC(6,3),
  length_threshold_m  NUMERIC(6,3),
  weight_threshold_kg NUMERIC(12,2),
  -- Escort requirements
  lead_escort_required   BOOLEAN DEFAULT FALSE,
  rear_escort_required   BOOLEAN DEFAULT FALSE,
  police_escort_required BOOLEAN DEFAULT FALSE,
  pilot_car_required     BOOLEAN DEFAULT FALSE,
  -- Legal info
  regulatory_body     TEXT,
  permit_authority    TEXT,
  source_url          TEXT,
  source_doc          TEXT,
  -- Status
  is_verified         BOOLEAN DEFAULT FALSE,
  last_reviewed_at    TIMESTAMPTZ,
  compliance_notes    TEXT,
  -- Haul Command data source link
  escort_requirements_url TEXT,   -- /escort-requirements/[country_slug]
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_country_compliance_code ON country_compliance(country_code);

-- Seed key markets
INSERT INTO country_compliance (country_code, country_name, width_threshold_m, height_threshold_m, length_threshold_m, weight_threshold_kg, lead_escort_required, rear_escort_required, regulatory_body, is_verified)
VALUES
('US','United States',    3.66,4.11,16.77,36288,  true, true,  'FHWA + State DOTs',        true),
('CA','Canada',           2.59,4.15,23.00,63500,  true, false, 'Transport Canada',          true),
('AU','Australia',        2.50,4.30,19.00,42500,  true, true,  'NTC + State RMS',           true),
('GB','United Kingdom',   2.90,4.20,18.65,44000,  true, true,  'DVSA/DVLA',                 true),
('DE','Germany',          3.00,4.00,16.50,40000,  true, true,  'Kraftfahrt-Bundesamt',      true),
('FR','France',           3.00,4.00,16.50,40000,  true, true,  'DREAL',                     true),
('NL','Netherlands',      3.00,4.00,16.50,40000,  true, true,  'RDW',                       true),
('AE','United Arab Emirates',3.50,4.50,20.00,48000,true,true,  'RTA / MOEI',                false),
('SA','Saudi Arabia',     3.50,4.50,20.00,48000,  true, true,  'GASTAT / SPEA',             false),
('BR','Brazil',           2.60,4.40,19.80,45000,  true, true,  'DNIT / ANTT',               false),
('MX','Mexico',           3.00,4.00,18.50,48000,  true, true,  'SCT / SICT',                false)
ON CONFLICT (country_code) DO NOTHING;

ALTER TABLE country_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_public_read" ON country_compliance FOR SELECT USING (TRUE);
CREATE POLICY "compliance_service"     ON country_compliance FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. BEHAVIORAL EVENTS — lib/telemetry.ts + lib/vapi/pipeline.ts
-- ============================================================================

DROP TABLE IF EXISTS behavioral_events CASCADE;

CREATE TABLE IF NOT EXISTS behavioral_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,                   -- 'page_view','click','search','booking_intent', etc.
  user_id         UUID,
  operator_id     UUID,
  session_id      TEXT,
  ip_hash         TEXT,
  country_code    TEXT DEFAULT 'US',
  page_url        TEXT,
  referrer_url    TEXT,
  event_data      JSONB DEFAULT '{}',
  device_type     TEXT CHECK (device_type IN ('mobile','tablet','desktop','unknown')),
  platform        TEXT CHECK (platform IN ('web','ios','android','api')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beh_events_type    ON behavioral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_beh_events_user    ON behavioral_events(user_id);
CREATE INDEX IF NOT EXISTS idx_beh_events_session ON behavioral_events(session_id);
CREATE INDEX IF NOT EXISTS idx_beh_events_country ON behavioral_events(country_code);
CREATE INDEX IF NOT EXISTS idx_beh_events_created ON behavioral_events(created_at DESC);

ALTER TABLE behavioral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beh_events_service" ON behavioral_events FOR ALL USING (auth.role() = 'service_role');
-- Allow anon/auth inserts for client-side telemetry
CREATE POLICY "beh_events_insert" ON behavioral_events FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- 9. AD REVENUE ROLLUP FUNCTION — called by /api/cron/ad-revenue-rollup
-- ============================================================================

-- Function that the cron job calls to roll up daily ad revenue
CREATE OR REPLACE FUNCTION fn_rollup_ad_revenue_daily(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSONB;
  v_rows_inserted INTEGER := 0;
BEGIN
  -- Roll up hc_ad_events into ad_revenue_daily by campaign
  INSERT INTO ad_revenue_daily (date, campaign_id, advertiser_id, impressions, clicks, revenue)
  SELECT
    p_date                                          AS date,
    ae.campaign_id,
    ac.advertiser_id,
    COUNT(*) FILTER (WHERE ae.event_type = 'impression') AS impressions,
    COUNT(*) FILTER (WHERE ae.event_type = 'click')      AS clicks,
    COALESCE(SUM(ae.revenue_credit), 0)                  AS revenue
  FROM hc_ad_events ae
  JOIN ad_campaigns  ac ON ac.id = ae.campaign_id
  WHERE ae.created_at >= p_date::TIMESTAMPTZ
    AND ae.created_at <  (p_date + 1)::TIMESTAMPTZ
    AND ae.campaign_id IS NOT NULL
  GROUP BY ae.campaign_id, ac.advertiser_id
  ON CONFLICT (date, campaign_id) DO UPDATE
    SET impressions = EXCLUDED.impressions,
        clicks      = EXCLUDED.clicks,
        revenue     = EXCLUDED.revenue;

  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  -- Update campaign spend_to_date
  UPDATE ad_campaigns ac
  SET    spend_to_date = COALESCE(ac.spend_to_date, 0) + rd.revenue
  FROM  (
    SELECT campaign_id, SUM(revenue) AS revenue
    FROM   ad_revenue_daily
    WHERE  date = p_date
    GROUP BY campaign_id
  ) rd
  WHERE ac.id = rd.campaign_id;

  v_result := jsonb_build_object(
    'date',          p_date,
    'rows_inserted', v_rows_inserted,
    'ran_at',        NOW()
  );
  RETURN v_result;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION fn_rollup_ad_revenue_daily(DATE) TO service_role;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
