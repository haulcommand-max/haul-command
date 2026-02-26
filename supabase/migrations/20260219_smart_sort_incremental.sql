-- 1) Add change tracking tables

-- A) Track what loads need recompute
create table if not exists public.load_intel_queue (
  load_id uuid primary key references public.loads(id) on delete cascade,
  reason text not null default 'unknown',
  priority int not null default 50, -- lower = sooner
  requested_at timestamptz not null default now()
);

create index if not exists idx_load_intel_queue_priority
  on public.load_intel_queue(priority asc, requested_at asc);

-- B) Track broker + lane “dirty” events (so you don’t recompute everything)
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

-- 2) Triggers that enqueue only the right loads

-- A) Loads: enqueue on insert/update of important fields
create or replace function public.enqueue_load_intel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := 'load_changed';
  v_priority int := 30;
begin
  if tg_op = 'INSERT' then
    v_reason := 'new_load';
    v_priority := 10;
  else
    -- if a load becomes active, prioritize hard
    if (old.status is distinct from new.status) and new.status = 'active' then
      v_reason := 'became_active';
      v_priority := 10;
    end if;

    -- if rate added (upfront rate boost), prioritize
    if old.rate_amount is null and new.rate_amount is not null then
      v_reason := 'upfront_rate_added';
      v_priority := 15;
    end if;

    -- if core route changed, prioritize
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

-- B) Broker metrics: mark broker dirty (then enqueue only that broker’s active loads)
create or replace function public.mark_broker_dirty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

-- C) Lane updates: mark lane dirty (then enqueue loads for that lane)
create or replace function public.mark_lane_dirty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

-- 3) Freshness bucket queue (so “2 minutes ago” feels real without recomputing everything)

-- A) Add a freshness bucket on load_intel
alter table public.load_intel
add column if not exists freshness_bucket int not null default 0;

-- B) Enqueue “top of feed” loads periodically
create or replace function public.enqueue_recent_active_loads(p_minutes int default 180)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.load_intel_queue(load_id, reason, priority, requested_at)
  select l.id, 'freshness_tick', 40, now()
  from public.loads l
  where l.status='active'
    and l.posted_at >= (now() - make_interval(mins => p_minutes))
  on conflict (load_id) do update set
    priority = least(public.load_intel_queue.priority, excluded.priority),
    requested_at = excluded.requested_at;
$$;

-- 4) The incremental refresh worker (process queue, then clear)

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

  -- weights (same as before)
  w_f numeric := 0.28;
  w_q numeric := 0.18;
  w_t numeric := 0.18;
  w_l numeric := 0.16;
  w_s numeric := 0.12;
  w_b numeric := 0.08;

  v_f numeric; v_q numeric; v_t numeric; v_l numeric; v_s numeric; v_b numeric; v_rank numeric;
  qg text; fs text; badges text[]; fbucket int;
begin
  -- advisory lock (prevents overlapping cron runs)
  select pg_try_advisory_lock(22334455) into v_lock;
  if not v_lock then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'lock_not_acquired');
  end if;

  -- enqueue: broker dirty => enqueue that broker’s active loads
  with moved as (
    delete from public.broker_intel_dirty
    where touched_at < now() + interval '100 years' -- delete all rows (we’ll reinsert on next update)
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

  -- enqueue: lane dirty => enqueue matching active loads
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

  -- enqueue: freshness ticks for recent loads (keeps feed alive)
  perform public.enqueue_recent_active_loads(p_recent_minutes);

  -- process queue (batch)
  for r in
    select q.load_id, q.reason
    from public.load_intel_queue q
    order by q.priority asc, q.requested_at asc
    limit p_batch
  loop
    -- fetch load + joins (same as your full refresh)
    declare
      l record;
      bm record;
      ln record;
      lane_key text;
    begin
      select * into l from public.loads where id = r.load_id and status='active';
      if l is null then
        delete from public.load_intel_queue where load_id = r.load_id;
        continue;
      end if;

      select trust_score, avg_days_to_pay into bm
      from public.broker_metrics
      where broker_id = l.broker_id and window_days = 30
      limit 1;

      lane_key := (
        lower(l.origin_country)||':'||lower(l.origin_admin1)||':'||lower(l.origin_city)
        ||'__'||
        lower(l.dest_country)||':'||lower(l.dest_admin1)||':'||lower(l.dest_city)
        ||'__'||
        lower(l.service_required)
      );

      select lane_density_score_30d, fill_speed_index_30d into ln
      from public.lanes
      where lane_key = lane_key
      limit 1;

      -- compute components
      v_f := public.freshness_01(l.posted_at);
      v_q := greatest(0, least(1, coalesce(l.data_completeness_score, 0)));
      v_t := greatest(0, least(1, coalesce((bm).trust_score, 0.5)));
      v_l := greatest(0, least(1, coalesce((ln).lane_density_score_30d, 0.35)));
      v_s := greatest(0, least(1, coalesce((ln).fill_speed_index_30d, 0.55)));

      v_b := public.backhaul_prob_v1_01(
        l.origin_country, l.origin_admin1, l.origin_city,
        l.dest_country, l.dest_admin1, l.dest_city,
        l.service_required,
        l.posted_at
      );

      v_rank := (v_f*w_f + v_q*w_q + v_t*w_t + v_l*w_l + v_s*w_s + v_b*w_b);
      if v_q < 0.50 then v_rank := v_rank - 0.12; end if;
      if v_t < 0.35 then v_rank := v_rank - 0.10; end if;
      if v_q < 0.35 then v_rank := v_rank - 0.08; end if;
      if l.rate_amount is not null then v_rank := v_rank + 0.03; end if;
      v_rank := greatest(0, least(1, v_rank));

      -- badges/labels
      if v_q >= 0.85 then qg := 'A';
      elsif v_q >= 0.70 then qg := 'B';
      elsif v_q >= 0.50 then qg := 'C';
      else qg := 'D';
      end if;

      if v_s >= 0.75 then fs := 'Fast-fill';
      elsif v_s >= 0.55 then fs := 'Mid-fill';
      elsif v_s >= 0.35 then fs := 'Slow-fill';
      else fs := 'Unknown';
      end if;

      badges := '{}';
      if v_l >= 0.70 then badges := array_append(badges, 'HOT'); end if;
      if v_s >= 0.75 then badges := array_append(badges, 'FAST-FILL'); end if;
      if v_b >= 0.70 then badges := array_append(badges, 'RETURN-LIKELY'); end if;

      -- freshness bucket (keeps “alive” feeling stable)
      -- 0: <=30m, 1:<=2h, 2:<=6h, 3:<=24h, 4:older
      fbucket :=
        case
          when now() - l.posted_at <= interval '30 minutes' then 0
          when now() - l.posted_at <= interval '2 hours' then 1
          when now() - l.posted_at <= interval '6 hours' then 2
          when now() - l.posted_at <= interval '24 hours' then 3
          else 4
        end;

      insert into public.load_intel(
        load_id, freshness_01, load_quality_01, broker_trust_01, lane_density_01, fill_speed_01, backhaul_prob_01,
        load_quality_grade, fill_speed_label, lane_badges, load_rank, freshness_bucket, computed_at
      )
      values (
        l.id, v_f, v_q, v_t, v_l, v_s, v_b,
        qg, fs, badges, round((v_rank*100)::numeric, 1), fbucket, now()
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

  return jsonb_build_object(
    'ok', true,
    'processed', v_processed,
    'batch', p_batch,
    'recent_minutes', p_recent_minutes
  );
end;
$$;
