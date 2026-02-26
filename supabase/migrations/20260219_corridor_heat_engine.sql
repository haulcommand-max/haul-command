-- 🚀 CORRIDOR HEAT MEMORY TABLE — SAFE PACK (FEATURE-FLAGGED, CAPPED, TTL)
-- 1) Tables + Columns
create table if not exists public.corridor_heat (
  corridor_key text primary key,         -- e.g. "us:fl|us:tx|pevo_lead_chase|i75"
  country text not null,                 -- 'us'|'ca'
  origin_admin1 text not null,           -- state/province
  dest_admin1 text not null,
  service_type text not null,

  -- optional corridor label (interstates, named corridors, etc)
  corridor_label text,                   -- e.g. "I-75", "I-10", "Hwy 401"

  -- heat metrics (rolling)
  heat_01 numeric not null default 0,    -- 0..1
  active_loads int not null default 0,
  unlocks_60m int not null default 0,
  unlocks_24h int not null default 0,

  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_corridor_heat_lookup
on public.corridor_heat(country, origin_admin1, dest_admin1, service_type);

-- Attach cached heat to load_intel for fast UI reads
alter table public.load_intel
add column if not exists corridor_heat_01 numeric,
add column if not exists corridor_label text,
add column if not exists hot_corridor_badge boolean not null default false;

-- 2) Corridor Key builder (stable)
create or replace function public.make_corridor_key(
  p_country text,
  p_origin_admin1 text,
  p_dest_admin1 text,
  p_service_type text,
  p_corridor_label text
)
returns text
language sql
immutable
as $$
  select
    lower(p_country) || ':' || lower(p_origin_admin1) || '|' ||
    lower(p_country) || ':' || lower(p_dest_admin1) || '|' ||
    lower(p_service_type) || '|' ||
    coalesce(lower(p_corridor_label), 'unknown');
$$;

-- 3) Corridor label heuristic (cheap v1)
create or replace function public.guess_corridor_label_v1(
  p_origin_admin1 text,
  p_dest_admin1 text
)
returns text
language plpgsql
immutable
as $$
begin
  -- v1: only a few high-value corridors. expand later.
  if (lower(p_origin_admin1) in ('fl','ga','sc','nc','va')) and (lower(p_dest_admin1) in ('fl','ga','sc','nc','va')) then
    return 'I-95';
  end if;

  if (lower(p_origin_admin1) in ('fl','ga','tn','ky','oh','mi')) and (lower(p_dest_admin1) in ('fl','ga','tn','ky','oh','mi')) then
    return 'I-75';
  end if;

  if (lower(p_origin_admin1) in ('tx','la','ms','al','fl')) and (lower(p_dest_admin1) in ('tx','la','ms','al','fl')) then
    return 'I-10';
  end if;

  if (lower(p_origin_admin1) in ('ca','az','nm','tx')) and (lower(p_dest_admin1) in ('ca','az','nm','tx')) then
    return 'I-40/I-10';
  end if;

  if (lower(p_origin_admin1) in ('on','qc')) and (lower(p_dest_admin1) in ('on','qc')) then
    return 'Hwy 401';
  end if;

  return 'Regional';
end;
$$;

-- 4) Refresh corridor heat (cron-only, capped, sampled)
create or replace function public.refresh_corridor_heat(
  p_batch int default 6000,
  p_max_corridors int default 2500,
  p_sample_ratio numeric default 0.25
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean := public.is_enabled('corridor_heat');
  v_cfg jsonb := (select config from public.feature_flags where key='corridor_heat');
  v_rows int := 0;
begin
  if not v_enabled then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'flag_off');
  end if;

  -- override defaults from feature flag config if provided
  if v_cfg ? 'sample_ratio' then p_sample_ratio := (v_cfg->>'sample_ratio')::numeric; end if;
  if v_cfg ? 'max_rows_per_run' then p_batch := (v_cfg->>'max_rows_per_run')::int; end if;

  -- Sample active loads to keep cost down early
  with active as (
    select
      l.id as load_id,
      lower(l.origin_country) as country,
      lower(l.origin_admin1) as origin_admin1,
      lower(l.dest_admin1) as dest_admin1,
      lower(l.service_required) as service_type,
      public.guess_corridor_label_v1(l.origin_admin1, l.dest_admin1) as corridor_label
    from public.loads l
    where l.status='active'
      and l.origin_admin1 is not null
      and l.dest_admin1 is not null
      and (random() < p_sample_ratio)
    order by l.posted_at desc
    limit p_batch
  ),
  unlocks as (
    -- if unlock velocity buckets exist, use last 60m unlock attempts
    select
      uv.load_id,
      sum(uv.unlock_attempts) as unlocks_60m
    from public.unlock_velocity_buckets uv
    where uv.bucket_minute >= date_trunc('minute', now() - interval '60 minutes')
    group by uv.load_id
  ),
  roll as (
    select
      a.country,
      a.origin_admin1,
      a.dest_admin1,
      a.service_type,
      a.corridor_label,
      count(*)::int as active_loads,
      coalesce(sum(coalesce(u.unlocks_60m,0)),0)::int as unlocks_60m
    from active a
    left join unlocks u on u.load_id = a.load_id
    group by 1,2,3,4,5
    order by count(*) desc
    limit p_max_corridors
  ),
  scored as (
    select
      public.make_corridor_key(country, origin_admin1, dest_admin1, service_type, corridor_label) as corridor_key,
      country, origin_admin1, dest_admin1, service_type, corridor_label,
      active_loads,
      unlocks_60m,
      -- heat score v1: normalize counts to 0..1
      public.clamp01( (least(active_loads, 30) / 30.0) * 0.65 + (least(unlocks_60m, 120) / 120.0) * 0.35 ) as heat_01
    from roll
  )
  insert into public.corridor_heat(
    corridor_key, country, origin_admin1, dest_admin1, service_type, corridor_label,
    heat_01, active_loads, unlocks_60m, unlocks_24h, last_seen_at, updated_at
  )
  select
    s.corridor_key, s.country, s.origin_admin1, s.dest_admin1, s.service_type, s.corridor_label,
    s.heat_01, s.active_loads, s.unlocks_60m, 0, now(), now()
  from scored s
  on conflict (corridor_key) do update set
    heat_01 = excluded.heat_01,
    active_loads = excluded.active_loads,
    unlocks_60m = excluded.unlocks_60m,
    corridor_label = excluded.corridor_label,
    last_seen_at = now(),
    updated_at = now();

  get diagnostics v_rows = row_count;

  -- Push heat onto load_intel for active loads (cheap join)
  update public.load_intel li
  set
    corridor_heat_01 = ch.heat_01,
    corridor_label = ch.corridor_label,
    hot_corridor_badge = (ch.heat_01 >= 0.70)
  from public.loads l
  join public.corridor_heat ch
    on ch.country = lower(l.origin_country)
   and ch.origin_admin1 = lower(l.origin_admin1)
   and ch.dest_admin1 = lower(l.dest_admin1)
   and ch.service_type = lower(l.service_required)
  where li.load_id = l.id
    and l.status='active';

  return jsonb_build_object('ok', true, 'upserts', v_rows);
end;
$$;

-- 5) TTL cleanup
create or replace function public.cleanup_corridor_heat(p_keep_days int default 14)
returns jsonb
language sql
security definer
set search_path = public
as $$
  delete from public.corridor_heat
  where last_seen_at < (now() - make_interval(days := p_keep_days));
  select jsonb_build_object('ok', true);
$$;
