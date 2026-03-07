-- ============================================================
-- CORRECTED PostGIS + Geography Migration
-- Table names & column names verified against production schema
-- ============================================================
begin;

-- 1) Enable PostGIS
create extension if not exists postgis;

-- ────────────────────────────────────────────────────────
-- 2) driver_profiles — uses base_lat / base_lng
-- ────────────────────────────────────────────────────────
alter table if exists public.driver_profiles
  add column if not exists geo geography(Point, 4326);

update public.driver_profiles
  set geo = ST_SetSRID(ST_MakePoint(base_lng, base_lat), 4326)::geography
  where base_lat is not null and base_lng is not null and geo is null;

create index if not exists idx_driver_profiles_geo
  on public.driver_profiles using gist(geo);

-- ────────────────────────────────────────────────────────
-- 3) loads — has origin_lat/origin_lng + dest_lat/dest_lng
-- ────────────────────────────────────────────────────────
alter table if exists public.loads
  add column if not exists origin_geo geography(Point, 4326);

alter table if exists public.loads
  add column if not exists dest_geo geography(Point, 4326);

update public.loads
  set origin_geo = ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)::geography
  where origin_lat is not null and origin_lng is not null and origin_geo is null;

update public.loads
  set dest_geo = ST_SetSRID(ST_MakePoint(dest_lng, dest_lat), 4326)::geography
  where dest_lat is not null and dest_lng is not null and dest_geo is null;

create index if not exists idx_loads_origin_geo
  on public.loads using gist(origin_geo);

create index if not exists idx_loads_dest_geo
  on public.loads using gist(dest_geo);

-- ────────────────────────────────────────────────────────
-- 4) ports — uses lat / lng
-- ────────────────────────────────────────────────────────
alter table if exists public.ports
  add column if not exists geo geography(Point, 4326);

update public.ports
  set geo = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  where lat is not null and lng is not null and geo is null;

create index if not exists idx_ports_geo
  on public.ports using gist(geo);

-- ────────────────────────────────────────────────────────
-- 5) places — uses latitude / longitude
-- ────────────────────────────────────────────────────────
alter table if exists public.places
  add column if not exists geo geography(Point, 4326);

update public.places
  set geo = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  where latitude is not null and longitude is not null and geo is null;

create index if not exists idx_places_geo
  on public.places using gist(geo);

-- ────────────────────────────────────────────────────────
-- 6) Safer geo auto-sync trigger (handles all naming variants)
-- ────────────────────────────────────────────────────────
create or replace function public.set_geo_from_lat_lng()
returns trigger
language plpgsql
as $$
declare
  v_lat double precision;
  v_lng double precision;
  v_lat_col text;
  v_lng_col text;
begin
  -- Detect column names dynamically
  if TG_TABLE_NAME = 'driver_profiles' then
    v_lat := new.base_lat;
    v_lng := new.base_lng;
    v_lat_col := 'base_lat';
    v_lng_col := 'base_lng';
  elsif TG_TABLE_NAME = 'places' then
    v_lat := new.latitude;
    v_lng := new.longitude;
    v_lat_col := 'latitude';
    v_lng_col := 'longitude';
  else
    -- Default: lat/lng (ports, etc.)
    v_lat := new.lat;
    v_lng := new.lng;
    v_lat_col := 'lat';
    v_lng_col := 'lng';
  end if;

  -- INSERT: set geo if both present
  if (TG_OP = 'INSERT') then
    if v_lat is not null and v_lng is not null then
      new.geo := ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography;
    end if;
    return new;
  end if;

  -- UPDATE: only touch geo if lat or lng actually changed
  if TG_TABLE_NAME = 'driver_profiles' then
    if (new.base_lat is distinct from old.base_lat) or (new.base_lng is distinct from old.base_lng) then
      if new.base_lat is not null and new.base_lng is not null then
        new.geo := ST_SetSRID(ST_MakePoint(new.base_lng, new.base_lat), 4326)::geography;
      else
        new.geo := null;
      end if;
    end if;
  elsif TG_TABLE_NAME = 'places' then
    if (new.latitude is distinct from old.latitude) or (new.longitude is distinct from old.longitude) then
      if new.latitude is not null and new.longitude is not null then
        new.geo := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
      else
        new.geo := null;
      end if;
    end if;
  else
    if (new.lat is distinct from old.lat) or (new.lng is distinct from old.lng) then
      if new.lat is not null and new.lng is not null then
        new.geo := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
      else
        new.geo := null;
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Apply triggers
drop trigger if exists trg_driver_profiles_set_geo on public.driver_profiles;
create trigger trg_driver_profiles_set_geo
  before insert or update on public.driver_profiles
  for each row execute function public.set_geo_from_lat_lng();

drop trigger if exists trg_ports_set_geo on public.ports;
create trigger trg_ports_set_geo
  before insert or update on public.ports
  for each row execute function public.set_geo_from_lat_lng();

drop trigger if exists trg_places_set_geo on public.places;
create trigger trg_places_set_geo
  before insert or update on public.places
  for each row execute function public.set_geo_from_lat_lng();

-- loads has origin + dest, needs separate handling
create or replace function public.set_loads_geo()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    if new.origin_lat is not null and new.origin_lng is not null then
      new.origin_geo := ST_SetSRID(ST_MakePoint(new.origin_lng, new.origin_lat), 4326)::geography;
    end if;
    if new.dest_lat is not null and new.dest_lng is not null then
      new.dest_geo := ST_SetSRID(ST_MakePoint(new.dest_lng, new.dest_lat), 4326)::geography;
    end if;
    return new;
  end if;

  -- UPDATE
  if (new.origin_lat is distinct from old.origin_lat) or (new.origin_lng is distinct from old.origin_lng) then
    if new.origin_lat is not null and new.origin_lng is not null then
      new.origin_geo := ST_SetSRID(ST_MakePoint(new.origin_lng, new.origin_lat), 4326)::geography;
    else
      new.origin_geo := null;
    end if;
  end if;

  if (new.dest_lat is distinct from old.dest_lat) or (new.dest_lng is distinct from old.dest_lng) then
    if new.dest_lat is not null and new.dest_lng is not null then
      new.dest_geo := ST_SetSRID(ST_MakePoint(new.dest_lng, new.dest_lat), 4326)::geography;
    else
      new.dest_geo := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_loads_set_geo on public.loads;
create trigger trg_loads_set_geo
  before insert or update on public.loads
  for each row execute function public.set_loads_geo();

commit;
