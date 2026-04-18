-- 20260220_liquidity_engine_v2.sql
-- Haul Command Liquidity Engine V2
-- Creates canonical tables per HAUL_COMMAND_BUILD_PACK_V3 spec.
-- Conflict resolution: escort_presence is NEW (replaces driver_presence for new flows).
-- match_offers is NEW (replaces offers for V2 match logic). Old tables kept for reads.

-- ============================================================
-- ESCORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.escort_profiles (
  escort_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_lat          double precision,
  base_lng          double precision,
  default_radius_miles int DEFAULT 150,
  vehicle_type      text CHECK (vehicle_type IN (
                      'pilot','chase','lead','high_pole','bucket_support',
                      'police_coord','survey'
                    )),
  capabilities_json jsonb DEFAULT '{}'::jsonb,
  certifications_json jsonb DEFAULT '{}'::jsonb,
  insurance_status  text DEFAULT 'unknown' CHECK (insurance_status IN (
                      'unknown','pending','verified','expired'
                    )),
  insurance_expires_at timestamptz,
  compliance_status text DEFAULT 'unknown' CHECK (compliance_status IN (
                      'unknown','pending','verified','flagged'
                    )),
  trust_base        numeric(5,2) DEFAULT 50.00,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broker_profiles (
  broker_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name      text,
  company_domain    text,
  verified_company  bool DEFAULT false,
  payout_terms      text,
  trust_base        numeric(5,2) DEFAULT 50.00,
  created_at        timestamptz DEFAULT now()
);

-- escort_presence: canonical V2 presence table
CREATE TABLE IF NOT EXISTS public.escort_presence (
  escort_id           uuid PRIMARY KEY REFERENCES public.escort_profiles(escort_id) ON DELETE CASCADE,
  status              text DEFAULT 'offline' CHECK (status IN (
                          'offline','online','available','busy','resting','do_not_disturb'
                      )),
  device_platform     text CHECK (device_platform IN ('ios','android','web')),
  push_token          text,
  last_heartbeat_at   timestamptz,
  last_lat            double precision,
  last_lng            double precision,
  last_speed_mph      numeric(6,2),
  last_heading        numeric(6,2),
  location_accuracy_m numeric(8,2),
  battery_pct         int CHECK (battery_pct BETWEEN 0 AND 100),
  network_quality     text DEFAULT 'unknown' CHECK (network_quality IN ('unknown','poor','ok','good')),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS escort_presence_lat_lng_idx
  ON public.escort_presence (last_lat, last_lng)
  WHERE status IN ('available','online');

CREATE INDEX IF NOT EXISTS escort_presence_status_idx
  ON public.escort_presence (status);

-- escort_availability_windows
CREATE TABLE IF NOT EXISTS public.escort_availability_windows (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escort_id         uuid NOT NULL REFERENCES public.escort_profiles(escort_id) ON DELETE CASCADE,
  start_at          timestamptz NOT NULL,
  end_at            timestamptz NOT NULL,
  mode              text DEFAULT 'scheduled' CHECK (mode IN ('instant','scheduled')),
  radius_miles      int DEFAULT 150,
  preferred_states  text[] DEFAULT '{}',
  preferred_corridors text[] DEFAULT '{}',
  min_rate          numeric(10,2),
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  CONSTRAINT valid_window CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS escort_availability_escort_idx
  ON public.escort_availability_windows (escort_id, start_at, end_at);

-- escort_territory_claims
CREATE TABLE IF NOT EXISTS public.escort_territory_claims (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escort_id   uuid NOT NULL REFERENCES public.escort_profiles(escort_id) ON DELETE CASCADE,
  country     text NOT NULL DEFAULT 'US',
  state       text NOT NULL,
  county_fips text,
  corridor_id uuid,
  claim_tier  text DEFAULT 'free' CHECK (claim_tier IN ('free','pro','elite')),
  claimed_at  timestamptz DEFAULT now(),
  expires_at  timestamptz,
  is_active   bool DEFAULT true
);

CREATE INDEX IF NOT EXISTS escort_territory_state_idx
  ON public.escort_territory_claims (state, is_active);

-- escort_blocklists (bidirectional)
CREATE TABLE IF NOT EXISTS public.escort_blocklists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason          text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (blocker_user_id, blocked_user_id)
);

-- ============================================================
-- LOADS EXTENSIONS (load_open_load core table already exists)
-- ============================================================
-- Add columns that may be missing from the existing loads table
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS load_type text DEFAULT 'misc' CHECK (load_type IN (
    'mobile_home','heavy_equipment','steel','precast','transformer','wind','boat','misc'
  )),
  ADD COLUMN IF NOT EXISTS origin_lat double precision,
  ADD COLUMN IF NOT EXISTS origin_lng double precision,
  ADD COLUMN IF NOT EXISTS dest_lat double precision,
  ADD COLUMN IF NOT EXISTS dest_lng double precision,
  ADD COLUMN IF NOT EXISTS pickup_earliest_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_latest_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_latest_at timestamptz,
  ADD COLUMN IF NOT EXISTS dimensions_json jsonb,
  ADD COLUMN IF NOT EXISTS escort_requirements_json jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS route_corridors text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'warm' CHECK (urgency IN ('hot','warm','planned','flex')),
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public','invite_only','private')),
  ADD COLUMN IF NOT EXISTS dest_state text,
  ADD COLUMN IF NOT EXISTS dest_country text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS origin_country text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS origin_state text;

-- Patch: map origin_admin1 -> origin_state for backward compat
UPDATE public.loads
  SET origin_state = origin_admin1
  WHERE origin_state IS NULL AND origin_admin1 IS NOT NULL;

CREATE INDEX IF NOT EXISTS loads_origin_lat_lng_idx
  ON public.loads (origin_lat, origin_lng)
  WHERE status = 'open' OR status = 'active';

CREATE INDEX IF NOT EXISTS loads_status_idx
  ON public.loads (status);

-- load_invites
CREATE TABLE IF NOT EXISTS public.load_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id     uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  broker_id   uuid NOT NULL,
  escort_id   uuid NOT NULL REFERENCES public.escort_profiles(escort_id),
  invited_at  timestamptz DEFAULT now(),
  channel     text DEFAULT 'push' CHECK (channel IN ('push','sms','email')),
  status      text DEFAULT 'sent' CHECK (status IN ('sent','viewed','accepted','declined','expired'))
);

-- ============================================================
-- MATCHING
-- ============================================================

-- match_offers: V2 canonical offer table
CREATE TABLE IF NOT EXISTS public.match_offers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id         uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  broker_id       uuid NOT NULL,
  escort_id       uuid NOT NULL REFERENCES public.escort_profiles(escort_id),
  offer_rank      int,
  wave            int DEFAULT 1 CHECK (wave IN (1,2,3)),
  offer_reason_json jsonb DEFAULT '{}'::jsonb,
  offered_rate    numeric(10,2),
  offered_at      timestamptz DEFAULT now(),
  expires_at      timestamptz,
  status          text DEFAULT 'offered' CHECK (status IN (
                    'offered','viewed','accepted','declined','expired','rescinded'
                  )),
  viewed_at       timestamptz,
  responded_at    timestamptz,
  decline_reason  text CHECK (decline_reason IN (
                    'rate','distance','schedule','requirements','broker_trust','other'
                  )),
  decline_notes   text
);

CREATE INDEX IF NOT EXISTS match_offers_load_escort_idx
  ON public.match_offers (load_id, escort_id, status);

CREATE INDEX IF NOT EXISTS match_offers_escort_status_idx
  ON public.match_offers (escort_id, status, offered_at DESC);

-- matches: confirmed matches
CREATE TABLE IF NOT EXISTS public.matches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id           uuid NOT NULL UNIQUE REFERENCES public.loads(id),
  broker_id         uuid NOT NULL,
  escort_id         uuid NOT NULL REFERENCES public.escort_profiles(escort_id),
  accepted_offer_id uuid REFERENCES public.match_offers(id),
  accepted_at       timestamptz DEFAULT now(),
  start_at          timestamptz,
  complete_at       timestamptz,
  status            text DEFAULT 'accepted' CHECK (status IN (
                      'accepted','in_progress','completed','canceled','disputed'
                    )),
  payout_status     text DEFAULT 'none' CHECK (payout_status IN (
                      'none','pending','paid','failed'
                    )),
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS matches_load_idx ON public.matches (load_id);
CREATE INDEX IF NOT EXISTS matches_escort_idx ON public.matches (escort_id, status);

-- trust_edges
CREATE TABLE IF NOT EXISTS public.trust_edges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  uuid NOT NULL REFERENCES auth.users(id),
  to_user_id    uuid NOT NULL REFERENCES auth.users(id),
  lane_key      text,
  edge_type     text CHECK (edge_type IN (
                  'broker_rates_escort','escort_rates_broker','repeat_partner'
                )),
  rating        int CHECK (rating BETWEEN 1 AND 5),
  weight        numeric(8,4) DEFAULT 1.0,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trust_edges_to_lane_idx
  ON public.trust_edges (to_user_id, lane_key);

-- incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id          uuid REFERENCES public.loads(id),
  match_id         uuid REFERENCES public.matches(id),
  subject_user_id  uuid NOT NULL REFERENCES auth.users(id),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id),
  category         text CHECK (category IN (
                     'late','no_show','unsafe','route_violation','paperwork',
                     'fraud','harassment','other'
                   )),
  severity         text DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  details          text,
  created_at       timestamptz DEFAULT now(),
  resolved_at      timestamptz,
  resolution       text
);

-- liquidity_metrics_daily
CREATE TABLE IF NOT EXISTS public.liquidity_metrics_daily (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                          date NOT NULL,
  geo_key                       text NOT NULL,
  segment                       text DEFAULT 'market' CHECK (segment IN ('escort','broker','market')),
  loads_posted                  int DEFAULT 0,
  offers_sent                   int DEFAULT 0,
  accepts                       int DEFAULT 0,
  fills                         int DEFAULT 0,
  median_time_to_first_offer_min numeric(10,2),
  median_time_to_accept_min     numeric(10,2),
  median_time_to_fill_min       numeric(10,2),
  active_escorts                int DEFAULT 0,
  available_escorts             int DEFAULT 0,
  supply_demand_ratio           numeric(10,4),
  created_at                    timestamptz DEFAULT now(),
  UNIQUE (date, geo_key, segment)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.escort_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_blocklists ENABLE ROW LEVEL SECURITY;

-- escort_presence: escort reads own row only
CREATE POLICY "escort_presence_self_read" ON public.escort_presence
  FOR SELECT USING (auth.uid() = escort_id);
CREATE POLICY "escort_presence_self_write" ON public.escort_presence
  FOR ALL USING (auth.uid() = escort_id);

-- escort_availability_windows: escort reads/writes own
CREATE POLICY "availability_self" ON public.escort_availability_windows
  FOR ALL USING (auth.uid() = escort_id);

-- match_offers: escort reads their own offers; broker reads their load's offers
CREATE POLICY "match_offers_escort" ON public.match_offers
  FOR SELECT USING (auth.uid() = escort_id);
CREATE POLICY "match_offers_broker" ON public.match_offers
  FOR SELECT USING (auth.uid() = broker_id);

-- matches: escort and broker read own
CREATE POLICY "matches_escort" ON public.matches
  FOR SELECT USING (auth.uid() = escort_id);
CREATE POLICY "matches_broker" ON public.matches
  FOR SELECT USING (auth.uid() = broker_id);

-- trust_edges: users see edges they're part of
CREATE POLICY "trust_edges_participant" ON public.trust_edges
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- blocklists: users see their own
CREATE POLICY "blocklist_self" ON public.escort_blocklists
  FOR ALL USING (auth.uid() = blocker_user_id);

-- escort_territory_claims: public read (for map density)
ALTER TABLE public.escort_territory_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "territory_public_read" ON public.escort_territory_claims
  FOR SELECT USING (true);
CREATE POLICY "territory_self_write" ON public.escort_territory_claims
  FOR ALL USING (auth.uid() = escort_id);
