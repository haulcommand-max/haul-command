-- 🏗️ PHASE 3: LIVE MAP + RANKS
-- Update RPC to include "Moat" data (Tier & Trust)

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
  -- A. Fetch Drivers + Ranks
  -- Join driver_profiles with driver_ranks
  select jsonb_agg(jsonb_build_object(
    'id', p.user_id,
    'lat', p.base_lat, 
    'lng', p.base_lng,
    'type', case when p.has_high_pole then 'high_pole' else 'escort' end,
    'status', case when exists(select 1 from jobs where driver_id = p.user_id and status = 'rolling') then 'rolling' else 'active' end,
    'tier', coalesce(r.current_tier, 'ROOKIE'),
    'trust', coalesce(r.trust_score, 0)
  ))
  into _active_drivers
  from driver_profiles p
  left join driver_ranks r on p.user_id = r.driver_id
  where 
    p.base_lat between viewport_min_lat and viewport_max_lat
    and p.base_lng between viewport_min_lng and viewport_max_lng
    and (
      p.last_active_at > now() - interval '24 hours'
      or exists (select 1 from jobs where driver_id = p.user_id and status = 'rolling')
    );

  -- B. Fetch Loads (Posted/Filled)
  select jsonb_agg(jsonb_build_object(
    'id', id,
    'lat', origin_lat,
    'lng', origin_lng,
    'dest_lat', dest_lat,
    'dest_lng', dest_lng,
    'type', 'load',
    'status', status,
    'title', title
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
