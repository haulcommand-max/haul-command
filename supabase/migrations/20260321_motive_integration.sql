-- ═══════════════════════════════════════════════════════════════
-- MOTIVE ELD/FLEET INTEGRATION — HAUL COMMAND
-- ═══════════════════════════════════════════════════════════════
-- Tables for storing Motive OAuth connections, synced fleet data,
-- and webhook events.
-- Applied: 2026-03-21
-- ═══════════════════════════════════════════════════════════════

-- ── Motive OAuth Connections ──
CREATE TABLE IF NOT EXISTS motive_connections (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token    text NOT NULL,
  refresh_token   text NOT NULL,
  token_type      text DEFAULT 'Bearer',
  scope           text,
  expires_at      timestamptz NOT NULL,
  motive_company_id bigint,
  status          text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'disconnected')),
  connected_at    timestamptz DEFAULT now(),
  last_synced_at  timestamptz,
  sync_errors     jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- ── Motive Vehicles ──
CREATE TABLE IF NOT EXISTS motive_vehicles (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  motive_id           bigint NOT NULL,
  connection_id       uuid NOT NULL REFERENCES motive_connections(id) ON DELETE CASCADE,
  profile_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  number              text, -- Unit number
  status              text,
  year                text,
  make                text,
  model               text,
  vin                 text,
  license_plate       text,
  license_plate_state text,
  fuel_type           text,
  raw_data            jsonb,
  synced_at           timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  UNIQUE(motive_id, connection_id)
);

-- ── Motive Drivers ──
CREATE TABLE IF NOT EXISTS motive_drivers (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  motive_id         bigint NOT NULL,
  connection_id     uuid NOT NULL REFERENCES motive_connections(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name        text,
  last_name         text,
  email             text,
  phone             text,
  status            text,
  license_number    text,
  license_state     text,
  cycle             text, -- HOS cycle
  raw_data          jsonb,
  synced_at         timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now(),
  UNIQUE(motive_id, connection_id)
);

-- ── Motive Vehicle Locations (latest snapshot per vehicle) ──
CREATE TABLE IF NOT EXISTS motive_locations (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_motive_id   bigint NOT NULL,
  connection_id       uuid NOT NULL REFERENCES motive_connections(id) ON DELETE CASCADE,
  lat                 double precision,
  lon                 double precision,
  bearing             double precision,
  speed               double precision, -- mph
  located_at          timestamptz,
  engine_hours        double precision,
  odometer            double precision,
  fuel_percent        double precision,
  raw_data            jsonb,
  synced_at           timestamptz DEFAULT now(),
  UNIQUE(vehicle_motive_id, connection_id)
);

-- ── Motive HOS Events (from webhooks) ──
CREATE TABLE IF NOT EXISTS motive_hos_events (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_motive_id  bigint,
  connection_id     uuid NOT NULL REFERENCES motive_connections(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            text, -- off_duty, sleeper, driving, on_duty, etc.
  start_time        timestamptz,
  end_time          timestamptz,
  duration          integer, -- seconds
  raw_data          jsonb,
  occurred_at       timestamptz,
  created_at        timestamptz DEFAULT now()
);

-- ── Motive Webhook Events (audit log) ──
CREATE TABLE IF NOT EXISTS motive_webhook_events (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    text NOT NULL,
  company_id    bigint,
  webhook_id    text UNIQUE,
  occurred_at   timestamptz,
  raw_data      jsonb,
  processed     boolean DEFAULT false,
  error         text,
  created_at    timestamptz DEFAULT now()
);

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_motive_connections_profile
  ON motive_connections(profile_id);
CREATE INDEX IF NOT EXISTS idx_motive_connections_status
  ON motive_connections(status);
CREATE INDEX IF NOT EXISTS idx_motive_vehicles_connection
  ON motive_vehicles(connection_id);
CREATE INDEX IF NOT EXISTS idx_motive_vehicles_profile
  ON motive_vehicles(profile_id);
CREATE INDEX IF NOT EXISTS idx_motive_drivers_connection
  ON motive_drivers(connection_id);
CREATE INDEX IF NOT EXISTS idx_motive_locations_vehicle
  ON motive_locations(vehicle_motive_id);
CREATE INDEX IF NOT EXISTS idx_motive_locations_located_at
  ON motive_locations(located_at DESC);
CREATE INDEX IF NOT EXISTS idx_motive_hos_driver
  ON motive_hos_events(driver_motive_id);
CREATE INDEX IF NOT EXISTS idx_motive_hos_occurred
  ON motive_hos_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_motive_webhook_type
  ON motive_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_motive_webhook_processed
  ON motive_webhook_events(processed) WHERE NOT processed;

-- ═══ RLS ═══
ALTER TABLE motive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_hos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_webhook_events ENABLE ROW LEVEL SECURITY;

-- Operators can only see their own connections and data
CREATE POLICY motive_connections_owner ON motive_connections
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY motive_vehicles_owner ON motive_vehicles
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY motive_drivers_owner ON motive_drivers
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY motive_hos_owner ON motive_hos_events
  FOR ALL USING (profile_id = auth.uid());

-- Service role bypass for cron/webhook operations
CREATE POLICY motive_connections_service ON motive_connections
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY motive_vehicles_service ON motive_vehicles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY motive_drivers_service ON motive_drivers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY motive_locations_service ON motive_locations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY motive_hos_service ON motive_hos_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY motive_webhook_service ON motive_webhook_events
  FOR ALL USING (auth.role() = 'service_role');
