-- 🏗️ ENGINE 3: LIQUIDITY BALANCE (Live Map & Market Health)

-- 1. SNAPSHOTS (Time-Series for "Market Pulse")
create table if not exists liquidity_snapshots (
  id uuid primary key default gen_random_uuid(),
  region text not null,                -- 'US', 'FL', 'TX', 'Hub-Key'
  active_drivers_count int not null,
  active_loads_count int not null,
  liquidity_ratio numeric(5,2) not null, -- drivers / loads
  hot_corridors jsonb,                 -- [{'origin':'FL','dest':'TX', 'count': 5}]
  snapshot_at timestamptz not null default now()
);

create index if not exists idx_liquidity_time on liquidity_snapshots(region, snapshot_at desc);

-- 2. SECURE RPC FOR MAP DATA (Anonymized)
-- Returns: { drivers: [{lat,lng,type}], loads: [{lat,lng,type}], metrics: {...} }
create or replace function get_live_map_data(
  viewport_min_lat float default -90,
  viewport_min_lng float default -180,
  viewport_max_lat float default 90,
  viewport_max_lng float default 180
)
returns jsonb
language plpgsql
security definer
as $$
declare
  _active_drivers jsonb;
  _active_loads jsonb;
  _metrics jsonb;
  _driver_count int;
  _load_count int;
begin
  -- A. Fetch Drivers (Anonymized slightly if needed, currently raw for internal beta)
  -- Logic: Active in last 24h OR has active job
  select jsonb_agg(jsonb_build_object(
    'id', id,
    'lat', base_lat, 
    'lng', base_lng,
    'type', case when has_high_pole then 'high_pole' else 'escort' end,
    'status', case when exists(select 1 from jobs where driver_id = id and status = 'rolling') then 'rolling' else 'active' end
  ))
  into _active_drivers
  from driver_profiles
  where 
    base_lat between viewport_min_lat and viewport_max_lat
    and base_lng between viewport_min_lng and viewport_max_lng
    and (
      last_active_at > now() - interval '24 hours'
      or exists (select 1 from jobs where driver_id = user_id and status = 'rolling')
    );

  -- B. Fetch Loads (Posted/Filled)
  select jsonb_agg(jsonb_build_object(
    'id', id,
    'lat', origin_lat,
    'lng', origin_lng,
    'dest_lat', dest_lat,
    'dest_lng', dest_lng,
    'type', 'load',
    'status', status
  ))
  into _active_loads
  from loads
  where 
    status in ('posted', 'filled')
    and origin_lat between viewport_min_lat and viewport_max_lat
    and origin_lng between viewport_min_lng and viewport_max_lng;

  -- C. Metrics Calculation
  _driver_count := coalesce(jsonb_array_length(_active_drivers), 0);
  _load_count := coalesce(jsonb_array_length(_active_loads), 0);

  _metrics := jsonb_build_object(
    'driver_count', _driver_count,
    'load_count', _load_count,
    'liquidity_ratio', case when _load_count > 0 then round((_driver_count::numeric / _load_count::numeric), 2) else 0 end
  );

  return jsonb_build_object(
    'drivers', coalesce(_active_drivers, '[]'::jsonb),
    'loads', coalesce(_active_loads, '[]'::jsonb),
    'metrics', _metrics
  );
end;
$$;
