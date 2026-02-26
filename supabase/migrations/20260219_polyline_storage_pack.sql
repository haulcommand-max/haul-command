-- 🚀 POLYLINE STORAGE PACK — SAFE (FLAGGED, CAPPED, TTL, APP-ONLY)

-- 0) Feature Flag (ensure exists)
insert into public.feature_flags(key, enabled, config)
values ('polyline_store', false, '{"max_polylines_per_run":500,"ttl_days":7,"min_miles":25}')
on conflict (key) do nothing;

-- 1) Schema: Store polyline on loads (minimal + safe)
alter table public.loads
add column if not exists route_polyline text,                 -- encoded polyline string
add column if not exists route_polyline_provider text,        -- 'here' | 'manual' | 'none'
add column if not exists route_polyline_created_at timestamptz,
add column if not exists route_polyline_ttl_at timestamptz,   -- when to delete
add column if not exists route_polyline_status text not null default 'none'; -- 'none'|'pending'|'ok'|'failed'

alter table public.loads
add column if not exists route_polyline_error text;

-- 2) RLS / Access: app-only fetch gate
create or replace view public.directory_active_loads_public as
select
  id,
  status,
  posted_at,
  origin_country, origin_admin1, origin_city,
  dest_country, dest_admin1, dest_city,
  service_required,
  miles,
  rate_amount,
  -- IMPORTANT: DO NOT expose route_polyline
  route_polyline_status
from public.loads
where status='active';

-- 3) RPC: fetch polyline (auth required + unlock gate optional)
create or replace function public.get_route_polyline_for_load(
  p_load_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_poly text;
  v_status text;
  v_provider text;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'error', 'auth_required');
  end if;

  select route_polyline, route_polyline_status, route_polyline_provider
  into v_poly, v_status, v_provider
  from public.loads
  where id = p_load_id;

  if v_status <> 'ok' or v_poly is null then
    return jsonb_build_object('ok', false, 'status', coalesce(v_status,'none'));
  end if;

  return jsonb_build_object('ok', true, 'provider', v_provider, 'polyline', v_poly);
end;
$$;

-- 4) Queue table (cron-only compute, capped)
create table if not exists public.route_polyline_queue (
  load_id uuid primary key,
  priority int not null default 0,        -- higher = sooner
  reason text,
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rpq_next_attempt
on public.route_polyline_queue(next_attempt_at asc, priority desc);

-- 5) RPC: enqueue polyline generation (safe + throttled)
create or replace function public.enqueue_route_polyline(
  p_load_id uuid,
  p_priority int default 0,
  p_reason text default 'requested'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_enabled('polyline_store') then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'flag_off');
  end if;

  insert into public.route_polyline_queue(load_id, priority, reason)
  values (p_load_id, p_priority, p_reason)
  on conflict (load_id) do update set
    priority = greatest(public.route_polyline_queue.priority, excluded.priority),
    reason = excluded.reason,
    updated_at = now();

  update public.loads
  set route_polyline_status='pending'
  where id=p_load_id and route_polyline_status in ('none','failed');

  return jsonb_build_object('ok', true);
end;
$$;

-- 6) Cron worker: generate polylines (provider-safe stub)
create or replace function public.process_route_polyline_queue(
  p_max int default 500
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg jsonb := (select config from public.feature_flags where key='polyline_store');
  v_max int := coalesce((v_cfg->>'max_polylines_per_run')::int, p_max);
  v_ttl_days int := coalesce((v_cfg->>'ttl_days')::int, 7);
  v_min_miles numeric := coalesce((v_cfg->>'min_miles')::numeric, 25);

  r record;
  v_processed int := 0;
  v_has_key boolean := false;
begin
  if not public.is_enabled('polyline_store') then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'flag_off');
  end if;

  -- Key check placeholder: since SQL can’t read env directly, we use a config table key stub.
  v_has_key := false;

  for r in
    select q.load_id, q.attempts
    from public.route_polyline_queue q
    where q.next_attempt_at <= now()
    order by q.priority desc, q.next_attempt_at asc
    limit v_max
  loop
    v_processed := v_processed + 1;

    -- Skip small jobs to save cost
    if exists (select 1 from public.loads l where l.id=r.load_id and coalesce(l.miles,0) < v_min_miles) then
      delete from public.route_polyline_queue where load_id=r.load_id;
      update public.loads set route_polyline_status='none' where id=r.load_id;
      continue;
    end if;

    if not v_has_key then
      -- Backoff: try again later, don’t spam
      update public.route_polyline_queue
      set attempts = attempts + 1,
          next_attempt_at = now() + interval '6 hours',
          updated_at = now()
      where load_id = r.load_id;

      update public.loads
      set route_polyline_status='failed',
          route_polyline_error='no_routing_key'
      where id = r.load_id;

      continue;
    end if;

    -- Placeholder:
    update public.loads
    set route_polyline_status='failed',
        route_polyline_error='provider_not_connected'
    where id=r.load_id;

    update public.route_polyline_queue
    set attempts = attempts + 1,
        next_attempt_at = now() + interval '12 hours',
        updated_at = now()
    where load_id=r.load_id;

  end loop;

  return jsonb_build_object('ok', true, 'processed', v_processed);
end;
$$;

-- 7) TTL cleanup
create or replace function public.cleanup_route_polylines()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg jsonb := (select config from public.feature_flags where key='polyline_store');
  v_ttl_days int := coalesce((v_cfg->>'ttl_days')::int, 7);
  v_deleted int := 0;
begin
  -- delete expired polylines
  update public.loads
  set
    route_polyline = null,
    route_polyline_provider = null,
    route_polyline_created_at = null,
    route_polyline_ttl_at = null,
    route_polyline_status = 'none',
    route_polyline_error = null
  where route_polyline_ttl_at is not null
    and route_polyline_ttl_at < now();

  get diagnostics v_deleted = row_count;

  -- purge queue entries that failed too many times
  delete from public.route_polyline_queue
  where attempts >= 10
    and updated_at < (now() - interval '7 days');

  return jsonb_build_object('ok', true, 'polylines_cleared', v_deleted);
end;
$$;
