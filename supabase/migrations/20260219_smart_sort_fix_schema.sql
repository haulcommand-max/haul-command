-- 20260219_smart_sort_fix_schema.sql
-- Fixes missing V2 tables and applies Incremental Refresh logic (With Full Rebuild)

-- 1. CLEANUP (Drop tables to ensure clean V2 schema)
drop view if exists public.directory_active_loads_view cascade;
drop table if exists public.load_intel_queue cascade;
drop table if exists public.broker_intel_dirty cascade;
drop table if exists public.lane_intel_dirty cascade;
drop table if exists public.load_intel cascade;
drop table if exists public.broker_metrics cascade;
drop table if exists public.load_contacts cascade;
drop table if exists public.loads cascade; 
drop table if exists public.brokers cascade;
drop table if exists public.lanes cascade;
drop table if exists public.corridors cascade;

-- 2. CREATE V2 BASE TABLES

-- Brokers
create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  verification text not null default 'V0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lanes
create table if not exists public.lanes (
  id uuid primary key default gen_random_uuid(),
  lane_key text not null unique,
  service_required text not null,
  origin_country text not null,
  origin_admin1 text not null,
  origin_metro_or_city text not null,
  dest_country text not null,
  dest_admin1 text not null,
  dest_metro_or_city text not null,
  active_loads_7d int not null default 0,
  active_loads_30d int not null default 0,
  unique_brokers_30d int not null default 0,
  fill_speed_index_30d numeric not null default 0.0,
  lane_density_score_30d numeric not null default 0.0,
  updated_at timestamptz not null default now()
);
create index idx_lanes_density on public.lanes(lane_density_score_30d desc);

-- Corridors
create table if not exists public.corridors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  confidence_score numeric not null default 0.0,
  risk_score numeric not null default 0.0,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Loads (V2)
create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  public_id text unique,
  broker_id uuid references public.brokers(id) on delete set null,
  lane_id uuid references public.lanes(id) on delete set null,
  corridor_id uuid references public.corridors(id) on delete set null,
  service_required text not null,
  origin_country text not null,
  origin_admin1 text not null,
  origin_city text not null,
  dest_country text not null,
  dest_admin1 text not null,
  dest_city text not null,
  posted_at timestamptz not null default now(),
  load_date date,
  rate_amount numeric,
  rate_currency text default 'USD',
  status text not null default 'active',
  data_completeness_score numeric not null default 0.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_loads_posted_at on public.loads(posted_at desc);
create index idx_loads_status on public.loads(status);

-- Broker Metrics
create table if not exists public.broker_metrics (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  tier text default 'unknown',
  reliability_score numeric not null default 0.0,
  fill_speed_score numeric not null default 0.0,
  trust_score numeric default 0.5,
  avg_days_to_pay int default 30,
  window_days int default 30,
  last_calculated_at timestamptz not null default now(),
  unique(broker_id)
);

-- Load Intel (With freshness_bucket)
create table if not exists public.load_intel (
  load_id uuid primary key references public.loads(id) on delete cascade,
  freshness_01 numeric not null default 0,
  load_quality_01 numeric not null default 0,
  broker_trust_01 numeric not null default 0,
  lane_density_01 numeric not null default 0,
  fill_speed_01 numeric not null default 0,
  backhaul_prob_01 numeric not null default 0,
  load_quality_grade text,
  fill_speed_label text,
  lane_badges text[] not null default '{}',
  load_rank numeric not null default 0,
  freshness_bucket int not null default 0, -- Added
  computed_at timestamptz not null default now()
);
create index idx_load_intel_rank on public.load_intel(load_rank desc);
alter table public.load_intel enable row level security;
create policy "load_intel_public_read" on public.load_intel for select to anon, authenticated using (true);

-- 3. INCREMENTAL INTELLIGENCE LOGIC

-- A) Track what loads need recompute
create table if not exists public.load_intel_queue (
  load_id uuid primary key references public.loads(id) on delete cascade,
  reason text not null default 'unknown',
  priority int not null default 50, 
  requested_at timestamptz not null default now()
);
create index if not exists idx_load_intel_queue_priority on public.load_intel_queue(priority asc, requested_at asc);

-- B) Track broker + lane dirty
create table if not exists public.broker_intel_dirty (
  broker_id uuid primary key references public.brokers(id) on delete cascade,
  reason text not null default 'metrics_update',
  touched_at timestamptz not null default now()
);

create table if not exists public.lane_intel_dirty (
  lane_key text primary key,
  reason text not null default 'lane_rollup_update',
  touched_at timestamptz not null default now()
);

-- C) Triggers

-- Enqueue Load Intel
create or replace function public.enqueue_load_intel()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_reason text := 'load_changed';
  v_priority int := 30;
begin
  if tg_op = 'INSERT' then
    v_reason := 'new_load';
    v_priority := 10;
  else
    if (old.status is distinct from new.status) and new.status = 'active' then
      v_reason := 'became_active';
      v_priority := 10;
    end if;
    if old.rate_amount is null and new.rate_amount is not null then
      v_reason := 'upfront_rate_added';
      v_priority := 15;
    end if;
    if (old.origin_city is distinct from new.origin_city)
       or (old.dest_city is distinct from new.dest_city)
       or (old.service_required is distinct from new.service_required) then
      v_reason := 'route_or_service_changed';
      v_priority := 15;
    end if;
  end if;

  insert into public.load_intel_queue(load_id, reason, priority, requested_at)
  values (new.id, v_reason, v_priority, now())
  on conflict (load_id) do update set
    reason = excluded.reason,
    priority = least(public.load_intel_queue.priority, excluded.priority),
    requested_at = excluded.requested_at;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_load_intel on public.loads;
create trigger trg_enqueue_load_intel
after insert or update of
  status, posted_at, load_date, rate_amount, rate_currency,
  origin_country, origin_admin1, origin_city,
  dest_country, dest_admin1, dest_city,
  service_required, broker_id, data_completeness_score
on public.loads
for each row execute function public.enqueue_load_intel();

-- Mark Broker Dirty
create or replace function public.mark_broker_dirty()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.broker_intel_dirty(broker_id, reason, touched_at)
  values (new.broker_id, 'broker_metrics_update', now())
  on conflict (broker_id) do update set
    touched_at = excluded.touched_at,
    reason = excluded.reason;
  return new;
end;
$$;
drop trigger if exists trg_broker_dirty on public.broker_metrics;
create trigger trg_broker_dirty
after insert or update on public.broker_metrics
for each row execute function public.mark_broker_dirty();

-- Mark Lane Dirty
create or replace function public.mark_lane_dirty()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.lane_intel_dirty(lane_key, reason, touched_at)
  values (new.lane_key, 'lane_rollup_update', now())
  on conflict (lane_key) do update set
    touched_at = excluded.touched_at,
    reason = excluded.reason;
  return new;
end;
$$;
drop trigger if exists trg_lane_dirty on public.lanes;
create trigger trg_lane_dirty
after insert or update on public.lanes
for each row execute function public.mark_lane_dirty();

-- D) Enqueue Recent Loads Helper
create or replace function public.enqueue_recent_active_loads(p_minutes int default 180)
returns void language sql security definer set search_path = public as $$
  insert into public.load_intel_queue(load_id, reason, priority, requested_at)
  select l.id, 'freshness_tick', 40, now()
  from public.loads l
  where l.status='active'
    and l.posted_at >= (now() - make_interval(mins => p_minutes))
  on conflict (load_id) do update set
    priority = least(public.load_intel_queue.priority, excluded.priority),
    requested_at = excluded.requested_at;
$$;

-- E) Worker RPC (Incremental)
create or replace function public.refresh_load_intel_incremental(
  p_batch int default 800,
  p_recent_minutes int default 180
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock boolean;
  v_processed int := 0;
  v_enqueued int := 0;
  r record;
  w_f numeric := 0.28;
  w_q numeric := 0.18;
  w_t numeric := 0.18;
  w_l numeric := 0.16;
  w_s numeric := 0.12;
  w_b numeric := 0.08;
  v_f numeric; v_q numeric; v_t numeric; v_l numeric; v_s numeric; v_b numeric; v_rank numeric;
  qg text; fs text; badges text[]; fbucket int;
begin
  select pg_try_advisory_lock(22334455) into v_lock;
  if not v_lock then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'lock_not_acquired');
  end if;

  -- Process dirty brokers
  with moved as (
    delete from public.broker_intel_dirty
    where touched_at < now() + interval '100 years'
    returning broker_id
  )
  insert into public.load_intel_queue(load_id, reason, priority, requested_at)
  select l.id, 'broker_dirty', 20, now()
  from public.loads l
  join moved m on m.broker_id = l.broker_id
  where l.status='active'
  on conflict (load_id) do update set
    priority = least(public.load_intel_queue.priority, excluded.priority),
    requested_at = excluded.requested_at;

  -- Process dirty lanes
  with moved as (
    delete from public.lane_intel_dirty
    where touched_at < now() + interval '100 years'
    returning lane_key
  )
  insert into public.load_intel_queue(load_id, reason, priority, requested_at)
  select l.id, 'lane_dirty', 25, now()
  from public.loads l
  join moved m on m.lane_key = (
    lower(l.origin_country)||':'||lower(l.origin_admin1)||':'||lower(l.origin_city)
    ||'__'||
    lower(l.dest_country)||':'||lower(l.dest_admin1)||':'||lower(l.dest_city)
    ||'__'||
    lower(l.service_required)
  )
  where l.status='active'
  on conflict (load_id) do update set
    priority = least(public.load_intel_queue.priority, excluded.priority),
    requested_at = excluded.requested_at;

  perform public.enqueue_recent_active_loads(p_recent_minutes);

  for r in
    select q.load_id, q.reason
    from public.load_intel_queue q
    order by q.priority asc, q.requested_at asc
    limit p_batch
  loop
    declare
      l record;
      bm record;
      ln record;
      lane_key_val text;
    begin
      select * into l from public.loads where id = r.load_id and status='active';
      if l is null then
        delete from public.load_intel_queue where load_id = r.load_id;
        continue;
      end if;

      select trust_score, avg_days_to_pay into bm
      from public.broker_metrics
      where broker_id = l.broker_id
      limit 1;

      lane_key_val := (
        lower(l.origin_country)||':'||lower(l.origin_admin1)||':'||lower(l.origin_city)
        ||'__'||
        lower(l.dest_country)||':'||lower(l.dest_admin1)||':'||lower(l.dest_city)
        ||'__'||
        lower(l.service_required)
      );

      select lane_density_score_30d, fill_speed_index_30d into ln
      from public.lanes
      where lane_key = lane_key_val
      limit 1;

      v_f := public.freshness_01(l.posted_at);
      v_q := greatest(0, least(1, coalesce(l.data_completeness_score, 0)));
      v_t := greatest(0, least(1, coalesce((bm).trust_score, 0.5)));
      v_l := greatest(0, least(1, coalesce((ln).lane_density_score_30d, 0.35)));
      v_s := greatest(0, least(1, coalesce((ln).fill_speed_index_30d, 0.55)));
      v_b := public.backhaul_prob_v1_01(
        l.origin_country, l.origin_admin1, l.origin_city,
        l.dest_country, l.dest_admin1, l.dest_city,
        l.service_required, l.posted_at
      );

      v_rank := (v_f*w_f + v_q*w_q + v_t*w_t + v_l*w_l + v_s*w_s + v_b*w_b);
      if v_q < 0.50 then v_rank := v_rank - 0.12; end if;
      if v_t < 0.35 then v_rank := v_rank - 0.10; end if;
      if v_q < 0.35 then v_rank := v_rank - 0.08; end if;
      if l.rate_amount is not null then v_rank := v_rank + 0.03; end if;
      v_rank := greatest(0, least(1, v_rank));

      if v_q >= 0.85 then qg := 'A';
      elsif v_q >= 0.70 then qg := 'B';
      elsif v_q >= 0.50 then qg := 'C';
      else qg := 'D'; end if;

      if v_s >= 0.75 then fs := 'Fast-fill';
      elsif v_s >= 0.55 then fs := 'Mid-fill';
      elsif v_s >= 0.35 then fs := 'Slow-fill';
      else fs := 'Unknown'; end if;

      badges := '{}';
      if v_l >= 0.70 then badges := array_append(badges, 'HOT'); end if;
      if v_s >= 0.75 then badges := array_append(badges, 'FAST-FILL'); end if;
      if v_b >= 0.70 then badges := array_append(badges, 'RETURN-LIKELY'); end if;

      fbucket := case
          when now() - l.posted_at <= interval '30 minutes' then 0
          when now() - l.posted_at <= interval '2 hours' then 1
          when now() - l.posted_at <= interval '6 hours' then 2
          when now() - l.posted_at <= interval '24 hours' then 3
          else 4 end;

      insert into public.load_intel(
        load_id, freshness_01, load_quality_01, broker_trust_01, lane_density_01, fill_speed_01, backhaul_prob_01,
        load_quality_grade, fill_speed_label, lane_badges,
        load_rank, freshness_bucket, computed_at
      )
      values(
        r.id, v_f, v_q, v_t, v_l, v_s, v_b,
        qg, fs, badges,
        round((v_rank*100)::numeric, 1), fbucket, now()
      )
      on conflict (load_id) do update set
        freshness_01 = excluded.freshness_01,
        load_quality_01 = excluded.load_quality_01,
        broker_trust_01 = excluded.broker_trust_01,
        lane_density_01 = excluded.lane_density_01,
        fill_speed_01 = excluded.fill_speed_01,
        backhaul_prob_01 = excluded.backhaul_prob_01,
        load_quality_grade = excluded.load_quality_grade,
        fill_speed_label = excluded.fill_speed_label,
        lane_badges = excluded.lane_badges,
        load_rank = excluded.load_rank,
        freshness_bucket = excluded.freshness_bucket,
        computed_at = excluded.computed_at;

      delete from public.load_intel_queue where load_id = r.load_id;
      v_processed := v_processed + 1;
    end;
  end loop;

  perform pg_advisory_unlock(22334455);
  return jsonb_build_object('ok', true, 'processed', v_processed, 'batch', p_batch);
end;
$$;

-- F) Recreate View
create or replace view public.directory_active_loads_view as
select
  l.id,
  l.public_id,
  l.service_required,
  l.origin_country, l.origin_admin1, l.origin_city,
  l.dest_country, l.dest_admin1, l.dest_city,
  l.posted_at,
  l.load_date,
  l.rate_amount, l.rate_currency,
  l.status,
  
  coalesce(li.load_rank, 0) as load_rank,
  li.load_quality_grade,
  li.fill_speed_label,
  li.lane_badges,
  coalesce(li.backhaul_prob_01, 0) as backhaul_prob_01,
  
  bm.trust_score as broker_trust_score,
  bm.avg_days_to_pay as broker_avg_days_to_pay
from public.loads l
left join public.load_intel li on li.load_id = l.id
left join public.broker_metrics bm on bm.broker_id = l.broker_id
where l.status = 'active';
