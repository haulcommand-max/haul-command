-- 🚀 COORDINATE CAPTURE UPGRADE — PIN DROP + GEOCODE QUEUE (SAFE, FAST)

-- PHASE 0 — Feature Flags
insert into public.feature_flags(key, enabled, config) values
('coord_capture', true,  '{"require_coords_for_active":false,"max_geocodes_per_run":400,"ttl_days":30}'),
('geocode_provider', false, '{"provider":"here","fallback":"none"}')
on conflict (key) do nothing;

-- PHASE 1 — Schema: coordinates + confidence + pin metadata
alter table public.loads
add column if not exists origin_lat numeric,
add column if not exists origin_lng numeric,
add column if not exists dest_lat numeric,
add column if not exists dest_lng numeric,

add column if not exists origin_coord_source text not null default 'none', -- 'pin'|'geocode'|'none'
add column if not exists dest_coord_source text not null default 'none',

add column if not exists origin_coord_status text not null default 'required', -- 'required'|'ok'|'failed'
add column if not exists dest_coord_status text not null default 'required',

add column if not exists origin_place_label text, -- what broker selected/pinned
add column if not exists dest_place_label text,

add column if not exists origin_geocode_error text,
add column if not exists dest_geocode_error text;

-- PHASE 2 — Queue tables (async geocoding, capped)
create table if not exists public.geocode_queue (
  id bigserial primary key,
  load_id uuid not null,
  side text not null check (side in ('origin','dest')),
  query_text text not null,              -- "Houston, TX" or full address
  priority int not null default 0,
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_geocode_queue_next
on public.geocode_queue(next_attempt_at asc, priority desc);

-- PHASE 3 — RPC: set coords from pin-drop (instant, no API)
create or replace function public.set_load_coords_pin(
  p_load_id uuid,
  p_side text,              -- 'origin'|'dest'
  p_lat numeric,
  p_lng numeric,
  p_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_side not in ('origin','dest') then
    return jsonb_build_object('ok', false, 'error', 'invalid_side');
  end if;

  if p_lat is null or p_lng is null then
    return jsonb_build_object('ok', false, 'error', 'missing_coords');
  end if;

  if p_side = 'origin' then
    update public.loads
    set origin_lat = p_lat,
        origin_lng = p_lng,
        origin_place_label = coalesce(p_label, origin_place_label),
        origin_coord_source = 'pin',
        origin_coord_status = 'ok',
        origin_geocode_error = null
    where id = p_load_id;
  else
    update public.loads
    set dest_lat = p_lat,
        dest_lng = p_lng,
        dest_place_label = coalesce(p_label, dest_place_label),
        dest_coord_source = 'pin',
        dest_coord_status = 'ok',
        dest_geocode_error = null
    where id = p_load_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- PHASE 4 — RPC: enqueue geocode from text inputs (async)
create or replace function public.enqueue_geocode(
  p_load_id uuid,
  p_side text,              -- 'origin'|'dest'
  p_query_text text,
  p_priority int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_enabled('coord_capture') then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'flag_off');
  end if;

  if p_side not in ('origin','dest') then
    return jsonb_build_object('ok', false, 'error', 'invalid_side');
  end if;

  if p_query_text is null or length(trim(p_query_text)) < 3 then
    return jsonb_build_object('ok', false, 'error', 'invalid_query_text');
  end if;

  insert into public.geocode_queue(load_id, side, query_text, priority)
  values (p_load_id, p_side, trim(p_query_text), p_priority);

  if p_side = 'origin' then
    update public.loads set origin_coord_status='required' where id=p_load_id;
  else
    update public.loads set dest_coord_status='required' where id=p_load_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- PHASE 5 — Optional guardrail: require coords to activate (toggleable)
create or replace function public.enforce_coords_for_active_load()
returns trigger
language plpgsql
as $$
declare
  v_req boolean := false;
  v_cfg jsonb;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select config into v_cfg from public.feature_flags where key='coord_capture';
  v_req := coalesce((v_cfg->>'require_coords_for_active')::boolean, false);

  if v_req then
    if new.origin_lat is null or new.origin_lng is null or new.dest_lat is null or new.dest_lng is null then
      raise exception 'Coordinates required to publish active load (pin-drop or geocode).';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_coords_for_active_load on public.loads;
create trigger trg_enforce_coords_for_active_load
before insert or update of status, origin_lat, origin_lng, dest_lat, dest_lng
on public.loads
for each row execute function public.enforce_coords_for_active_load();

-- PHASE 8 — TTL cleanup for geocode queue
create or replace function public.cleanup_geocode_queue(p_keep_days int default 30)
returns jsonb
language sql
security definer
set search_path = public
as $$
  delete from public.geocode_queue
  where created_at < (now() - make_interval(days => p_keep_days));
  select jsonb_build_object('ok', true);
$$;
