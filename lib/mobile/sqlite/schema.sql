-- Haul Command Mobile SQLite Schema
-- Offline-first cache + outbox for dead zones

pragma foreign_keys = ON;

create table if not exists kv_meta (
  k text primary key,
  v text not null
);

-- Track sync state per resource
create table if not exists sync_state (
  resource text primary key,             -- e.g. 'loads', 'leaderboard', 'profile'
  last_synced_at text,                   -- ISO timestamp
  last_cursor text,                      -- for pagination/delta
  updated_at text not null
);

-- Generic outbox: queued writes while offline
create table if not exists outbox_events (
  id text primary key,                   -- uuid
  type text not null,                    -- e.g. 'PING_LOCATION', 'UPLOAD_EVIDENCE', 'ACK_LOAD'
  payload text not null,                 -- JSON string
  created_at text not null,
  tries integer not null default 0,
  last_error text,
  next_retry_at text
);

-- Cached loads (minimum viable for dead zone survival)
create table if not exists loads_cache (
  load_id text primary key,
  payload text not null,                 -- JSON string for UI rendering
  updated_at text not null
);

create table if not exists operator_profile_cache (
  user_id text primary key,
  payload text not null,
  updated_at text not null
);

create table if not exists leaderboard_cache (
  scope text primary key,                -- e.g. 'global', 'us_fl', 'corridor_i10'
  payload text not null,
  updated_at text not null
);

-- Optional: cached map tiles/geojson (keep small; can prune)
create table if not exists geojson_cache (
  key text primary key,                  -- e.g. "load_routes:bbox:.."
  payload text not null,
  expires_at text,
  updated_at text not null
);

create index if not exists outbox_next_retry_idx on outbox_events (next_retry_at);
create index if not exists loads_cache_updated_idx on loads_cache (updated_at);
