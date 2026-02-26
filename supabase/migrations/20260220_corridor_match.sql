begin;

-- ============================================================
-- 0) REQUIREMENTS
-- ============================================================
create extension if not exists postgis;

-- ============================================================
-- 1) ADD LOAD FIELDS
-- ============================================================
alter table public.loads
  add column if not exists route_polyline_geojson jsonb default null,
  add column if not exists origin_county_fips text default null,
  add column if not exists dest_county_fips text default null;

create index if not exists loads_origin_county_idx on public.loads(origin_county_fips);
create index if not exists loads_dest_county_idx on public.loads(dest_county_fips);

-- ============================================================
-- 2) CORRIDOR GEOMETRY
-- ============================================================
alter table public.corridors
  add column if not exists geom geometry(MultiLineString, 4326);

create or replace function public.corridor_geojson_to_geom(p_geojson jsonb)
returns geometry language plpgsql immutable as $$
declare g geometry;
begin
  if p_geojson is null or p_geojson = '{}'::jsonb then return null; end if;
  begin
    g := ST_SetSRID(ST_GeomFromGeoJSON(p_geojson::text), 4326);
  exception when others then return null; end;
  if GeometryType(g) = 'LINESTRING' then return ST_Multi(g);
  elsif GeometryType(g) = 'MULTILINESTRING' then return g;
  elsif GeometryType(g) in ('POLYGON','MULTIPOLYGON') then return ST_Multi(ST_Boundary(g));
  else return null; end if;
end;
$$;

update public.corridors
set geom = public.corridor_geojson_to_geom(geojson)
where geom is null and geojson is not null and geojson <> '{}'::jsonb;

create table if not exists public.corridor_segments (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.corridors(id) on delete cascade,
  name text,
  geom geometry(LineString, 4326) not null,
  created_at timestamptz not null default now()
);

create index if not exists corridor_segments_corridor_idx on public.corridor_segments(corridor_id);
create index if not exists corridor_segments_geom_gix on public.corridor_segments using gist(geom);

create or replace function public.corridor_refresh_geom(p_corridor_id uuid)
returns void language plpgsql as $$
begin
  update public.corridors c
  set geom = (select ST_Multi(ST_Union(s.geom)) from public.corridor_segments s where s.corridor_id = c.id)
  where c.id = p_corridor_id;
end; $$;

create or replace function public.corridor_segments_refresh_trg()
returns trigger language plpgsql as $$
begin
  perform public.corridor_refresh_geom(coalesce(new.corridor_id, old.corridor_id));
  return coalesce(new, old);
end; $$;

drop trigger if exists corridor_segments_refresh on public.corridor_segments;
create trigger corridor_segments_refresh
after insert or update or delete on public.corridor_segments
for each row execute function public.corridor_segments_refresh_trg();

-- ============================================================
-- 3) COUNTY CORRIDOR MAPPING
-- ============================================================
create table if not exists public.corridor_county_map (
  corridor_id uuid not null references public.corridors(id) on delete cascade,
  county_fips text not null,
  weight numeric not null default 1,
  primary key (corridor_id, county_fips)
);

create index if not exists corridor_county_map_county_idx on public.corridor_county_map(county_fips);

-- ============================================================
-- 4) LOAD ↔ CORRIDOR RESULTS
-- ============================================================
create table if not exists public.load_corridors (
  load_id uuid not null references public.loads(id) on delete cascade,
  corridor_id uuid not null references public.corridors(id) on delete cascade,
  method text not null check (method in ('polyline','county','proximity')),
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (load_id, corridor_id)
);

create index if not exists load_corridors_load_idx on public.load_corridors(load_id);
create index if not exists load_corridors_corridor_idx on public.load_corridors(corridor_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists touch_load_corridors_updated on public.load_corridors;
create trigger touch_load_corridors_updated
before update on public.load_corridors
for each row execute function public.touch_updated_at();

-- ============================================================
-- 5) GEOMETRY HELPERS
-- ============================================================
create or replace function public.load_polyline_geom(p_geojson jsonb)
returns geometry language plpgsql immutable as $$
declare g geometry;
begin
  if p_geojson is null or p_geojson = 'null'::jsonb then return null; end if;
  begin
    g := ST_SetSRID(ST_GeomFromGeoJSON(p_geojson::text), 4326);
  exception when others then return null; end;
  if GeometryType(g) in ('LINESTRING','MULTILINESTRING') then return g; else return null; end if;
end; $$;

create or replace function public.make_point(p_lat double precision, p_lng double precision)
returns geometry language sql immutable as $$
  select ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
$$;

-- ============================================================
-- 6) MATCH: PROXIMITY
-- ============================================================
create or replace function public.corridor_match_point(
  p_lat double precision, p_lng double precision,
  p_max_miles numeric default 30, p_limit int default 5
)
returns table(corridor_id uuid, distance_miles numeric, confidence numeric, method text, evidence jsonb)
language sql stable as $$
  with pt as (select public.make_point(p_lat, p_lng) as g),
  c as (
    select corr.id as corridor_id,
      ST_DistanceSphere(corr.geom, (select g from pt)) / 1609.344 as distance_miles
    from public.corridors corr where corr.geom is not null
  )
  select corridor_id, distance_miles,
    greatest(0.35, least(0.85, 0.85 - (distance_miles / nullif(p_max_miles,0)) * 0.50)) as confidence,
    'proximity'::text,
    jsonb_build_object('distance_miles', round(distance_miles::numeric, 3))
  from c where distance_miles <= p_max_miles order by distance_miles asc limit p_limit;
$$;

-- ============================================================
-- 7) MATCH: COUNTY
-- ============================================================
create or replace function public.corridor_match_county(
  p_origin_county_fips text, p_dest_county_fips text, p_limit int default 8
)
returns table(corridor_id uuid, confidence numeric, method text, evidence jsonb)
language sql stable as $$
  with hits as (
    select m.corridor_id, sum(m.weight) as w, count(*) as cnt
    from public.corridor_county_map m
    where (p_origin_county_fips is not null and m.county_fips = p_origin_county_fips)
       or (p_dest_county_fips   is not null and m.county_fips = p_dest_county_fips)
    group by m.corridor_id
  )
  select corridor_id,
    least(0.90, 0.70 + 0.10 * cnt) as confidence,
    'county'::text,
    jsonb_build_object('origin_county_fips',p_origin_county_fips,'dest_county_fips',p_dest_county_fips,'hit_count',cnt,'weight_sum',w)
  from hits order by cnt desc, w desc limit p_limit;
$$;

-- ============================================================
-- 8) MATCH: POLYLINE INTERSECTION
-- ============================================================
create or replace function public.corridor_match_polyline(p_route_geojson jsonb, p_limit int default 8)
returns table(corridor_id uuid, overlap_miles numeric, confidence numeric, method text, evidence jsonb)
language sql stable as $$
  with route as (select public.load_polyline_geom(p_route_geojson) as g),
  cand as (
    select c.id as corridor_id,
      case
        when (select g from route) is null then 0
        else ST_Length(
          ST_Intersection(ST_MakeValid(c.geom), ST_MakeValid((select g from route)))::geography
        ) / 1609.344
      end as overlap_miles
    from public.corridors c
    where c.geom is not null
      and (select g from route) is not null
      and ST_Intersects(ST_Envelope(c.geom), ST_Envelope((select g from route)))
  )
  select corridor_id, overlap_miles,
    greatest(0.60, least(0.98, 0.60 + (overlap_miles / 20.0) * 0.38)) as confidence,
    'polyline'::text,
    jsonb_build_object('overlap_miles', round(overlap_miles::numeric, 3))
  from cand where overlap_miles > 0.25 order by overlap_miles desc limit p_limit;
$$;

-- ============================================================
-- 9) MASTER: corridor_match_load
-- ============================================================
create or replace function public.corridor_match_load(p_load_id uuid)
returns jsonb language plpgsql as $$
declare
  l record; poly record; cnty record; prox record;
  results_count int := 0;
begin
  select id, origin_lat, origin_lng, dest_lat, dest_lng,
    origin_county_fips, dest_county_fips, route_polyline_geojson
  into l from public.loads where id = p_load_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'load_not_found'); end if;

  delete from public.load_corridors where load_id = p_load_id;

  -- 1) Polyline
  if l.route_polyline_geojson is not null then
    for poly in select * from public.corridor_match_polyline(l.route_polyline_geojson, 8) loop
      insert into public.load_corridors(load_id, corridor_id, method, confidence, evidence)
      values (p_load_id, poly.corridor_id, poly.method, poly.confidence, poly.evidence)
      on conflict (load_id, corridor_id) do update
        set method=excluded.method, confidence=greatest(public.load_corridors.confidence,excluded.confidence), evidence=excluded.evidence;
      results_count := results_count + 1;
    end loop;
  end if;

  -- 2) County
  if (l.origin_county_fips is not null) or (l.dest_county_fips is not null) then
    for cnty in select * from public.corridor_match_county(l.origin_county_fips, l.dest_county_fips, 8) loop
      insert into public.load_corridors(load_id, corridor_id, method, confidence, evidence)
      values (p_load_id, cnty.corridor_id, cnty.method, cnty.confidence, cnty.evidence)
      on conflict (load_id, corridor_id) do update
        set method=case when public.load_corridors.method='polyline' then public.load_corridors.method else excluded.method end,
            confidence=greatest(public.load_corridors.confidence, excluded.confidence),
            evidence=case when public.load_corridors.method='polyline' then public.load_corridors.evidence else excluded.evidence end;
      results_count := results_count + 1;
    end loop;
  end if;

  -- 3a) Proximity: origin
  if l.origin_lat is not null and l.origin_lng is not null then
    for prox in select * from public.corridor_match_point(l.origin_lat, l.origin_lng, 30, 5) loop
      insert into public.load_corridors(load_id, corridor_id, method, confidence, evidence)
      values (p_load_id, prox.corridor_id, prox.method, prox.confidence, prox.evidence || '{"which":"origin"}'::jsonb)
      on conflict (load_id, corridor_id) do update
        set method=case when public.load_corridors.method in ('polyline','county') then public.load_corridors.method else excluded.method end,
            confidence=greatest(public.load_corridors.confidence, excluded.confidence),
            evidence=public.load_corridors.evidence || excluded.evidence;
      results_count := results_count + 1;
    end loop;
  end if;

  -- 3b) Proximity: dest
  if l.dest_lat is not null and l.dest_lng is not null then
    for prox in select * from public.corridor_match_point(l.dest_lat, l.dest_lng, 30, 5) loop
      insert into public.load_corridors(load_id, corridor_id, method, confidence, evidence)
      values (p_load_id, prox.corridor_id, prox.method, prox.confidence, prox.evidence || '{"which":"dest"}'::jsonb)
      on conflict (load_id, corridor_id) do update
        set method=case when public.load_corridors.method in ('polyline','county') then public.load_corridors.method else excluded.method end,
            confidence=greatest(public.load_corridors.confidence, excluded.confidence),
            evidence=public.load_corridors.evidence || excluded.evidence;
      results_count := results_count + 1;
    end loop;
  end if;

  return jsonb_build_object(
    'ok', true, 'load_id', p_load_id,
    'matched_corridors', (
      select jsonb_agg(jsonb_build_object(
        'corridor_id',lc.corridor_id,'method',lc.method,'confidence',lc.confidence,
        'corridor_name',c.name,'corridor_type',c.corridor_type
      ) order by lc.confidence desc)
      from public.load_corridors lc join public.corridors c on c.id=lc.corridor_id
      where lc.load_id=p_load_id
    ),
    'count', (select count(*) from public.load_corridors where load_id=p_load_id)
  );
end; $$;

-- ============================================================
-- 10) TRIGGER: auto-match on load insert/update
-- ============================================================
create or replace function public.loads_corridor_match_trg()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    perform public.corridor_match_load(new.id);
  elsif tg_op = 'UPDATE' then
    if (new.origin_lat is distinct from old.origin_lat)
      or (new.origin_lng is distinct from old.origin_lng)
      or (new.dest_lat is distinct from old.dest_lat)
      or (new.dest_lng is distinct from old.dest_lng)
      or (new.route_polyline_geojson is distinct from old.route_polyline_geojson)
      or (new.origin_county_fips is distinct from old.origin_county_fips)
      or (new.dest_county_fips is distinct from old.dest_county_fips)
    then
      perform public.corridor_match_load(new.id);
    end if;
  end if;
  return coalesce(new, old);
end; $$;

drop trigger if exists loads_corridor_match on public.loads;
create trigger loads_corridor_match
after insert or update on public.loads
for each row execute function public.loads_corridor_match_trg();

-- ============================================================
-- 11) CONVENIENCE: best corridor for a load
-- ============================================================
create or replace function public.best_corridor_for_load(p_load_id uuid)
returns uuid language sql stable as $$
  select corridor_id from public.load_corridors where load_id=p_load_id order by confidence desc limit 1;
$$;

-- ============================================================
-- 12) RLS
-- ============================================================
alter table public.corridor_segments enable row level security;
alter table public.corridor_county_map enable row level security;
alter table public.load_corridors enable row level security;

drop policy if exists corridor_segments_read_all on public.corridor_segments;
create policy corridor_segments_read_all on public.corridor_segments for select using (true);

drop policy if exists corridor_county_map_read_all on public.corridor_county_map;
create policy corridor_county_map_read_all on public.corridor_county_map for select using (true);

drop policy if exists load_corridors_read_all on public.load_corridors;
create policy load_corridors_read_all on public.load_corridors for select using (true);

drop policy if exists load_corridors_write_none on public.load_corridors;
create policy load_corridors_write_none on public.load_corridors for insert with check (false);

drop policy if exists load_corridors_update_none on public.load_corridors;
create policy load_corridors_update_none on public.load_corridors for update using (false);

commit;
