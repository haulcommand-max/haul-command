-- =====================================================================
-- Haul Command — Search Engine Infrastructure
-- Generated: 2026-03-03
-- Stack: pg_trgm + tsvector + PostGIS + HC Hybrid Ranking
-- Decision: pg_search NOT available on Supabase Cloud.
--   Using Postgres-native full-text search + trigram fuzzy matching
--   + PostGIS geo-decay + trust/verification signals.
-- Upgrade path: Typesense external index if BM25 needed later.
-- =====================================================================
begin;

-- =====================================================================
-- 0) Required Extensions
-- =====================================================================

create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists postgis;
create extension if not exists btree_gin;


-- =====================================================================
-- 1) Search Config: unaccented English
-- =====================================================================

-- Custom text search configuration that strips accents
-- Handles: "José" → "jose", "über" → "uber"
do $$
begin
  if not exists (
    select 1 from pg_ts_config where cfgname = 'hc_english'
  ) then
    create text search configuration hc_english (copy = english);
    alter text search configuration hc_english
      alter mapping for hword, hword_part, word
      with unaccent, english_stem;
  end if;
end $$;


-- =====================================================================
-- 2) Searchable Materialized Columns on profiles + driver_profiles
-- =====================================================================

-- Add tsvector column to profiles for full-text search
alter table public.profiles
  add column if not exists search_vector tsvector;

-- Add trigram index column (for fuzzy "did you mean" matching)
alter table public.profiles
  add column if not exists search_text text;

-- Computed search text: combine all searchable fields
create or replace function hc_build_profile_search_text(
  p_display_name text,
  p_email text,
  p_phone text,
  p_home_city text,
  p_home_state text,
  p_country text
)
returns text
language sql
immutable
as $$
  select coalesce(p_display_name, '') || ' ' ||
         coalesce(p_home_city, '')     || ' ' ||
         coalesce(p_home_state, '')    || ' ' ||
         coalesce(p_country, '')       || ' ' ||
         coalesce(p_email, '');
$$;

-- Backfill search columns
update public.profiles
set
  search_text = hc_build_profile_search_text(
    display_name, email, phone, home_city, home_state, country
  ),
  search_vector = to_tsvector(
    'hc_english',
    hc_build_profile_search_text(
      display_name, email, phone, home_city, home_state, country
    )
  )
where search_vector is null;


-- =====================================================================
-- 3) Indexes: GIN for tsvector, GIN/GIST for trigram, GIST for geo
-- =====================================================================

-- Full-text search index (fast tsquery matching)
create index if not exists idx_profiles_search_vector
  on public.profiles using gin (search_vector);

-- Trigram index (fuzzy/typo-tolerant matching)
create index if not exists idx_profiles_search_text_trgm
  on public.profiles using gin (search_text gin_trgm_ops);

-- Geo index on driver_profiles for distance decay
-- Uses existing base_lat/base_lng columns
-- We create a PostGIS geography point for proper distance queries
alter table public.driver_profiles
  add column if not exists geo geography(point, 4326);

-- Backfill geo column
update public.driver_profiles
set geo = st_setsrid(st_makepoint(base_lng, base_lat), 4326)::geography
where base_lat is not null
  and base_lng is not null
  and geo is null;

-- Spatial index
create index if not exists idx_driver_profiles_geo
  on public.driver_profiles using gist (geo);


-- =====================================================================
-- 4) Auto-update Trigger: keep search columns in sync
-- =====================================================================

create or replace function hc_update_profile_search()
returns trigger
language plpgsql
as $$
begin
  new.search_text := hc_build_profile_search_text(
    new.display_name, new.email, new.phone,
    new.home_city, new.home_state, new.country
  );
  new.search_vector := to_tsvector('hc_english', new.search_text);
  return new;
end;
$$;

drop trigger if exists trg_profile_search_update on public.profiles;
create trigger trg_profile_search_update
  before insert or update of display_name, email, phone, home_city, home_state, country
  on public.profiles
  for each row
  execute function hc_update_profile_search();


-- Auto-update geo on driver_profiles
create or replace function hc_update_driver_geo()
returns trigger
language plpgsql
as $$
begin
  if new.base_lat is not null and new.base_lng is not null then
    new.geo := st_setsrid(st_makepoint(new.base_lng, new.base_lat), 4326)::geography;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_driver_geo_update on public.driver_profiles;
create trigger trg_driver_geo_update
  before insert or update of base_lat, base_lng
  on public.driver_profiles
  for each row
  execute function hc_update_driver_geo();


-- =====================================================================
-- 5) App-Layer H3: store computed hex cells from client/edge
--    (H3 extension not available; compute in JS, store bigint)
-- =====================================================================

alter table public.driver_profiles
  add column if not exists h3_cell_r7 bigint;  -- metro tile (~5.16 km² cells)

-- btree index on H3 cell for fast IN-list queries
create index if not exists idx_driver_profiles_h3_r7
  on public.driver_profiles (h3_cell_r7);


-- =====================================================================
-- 6) HC Hybrid Ranking RPC — The Moat Layer
--    Combines: text relevance + trust score + verification + geo decay
--              + availability recency
-- =====================================================================

create or replace function hc_search_operators(
  p_query         text       default null,
  p_lat           float8     default null,
  p_lng           float8     default null,
  p_radius_miles  int        default 150,
  p_country       text       default null,
  p_state         text       default null,
  p_verified_only boolean    default false,
  p_has_high_pole boolean    default false,
  p_limit         int        default 50,
  p_offset        int        default 0
)
returns table (
  profile_id       uuid,
  display_name     text,
  role             user_role,
  home_city        text,
  home_state       text,
  country          text,
  verified_badge   boolean,
  has_high_pole    boolean,
  distance_miles   float8,
  text_score       float4,
  trust_score      int,
  composite_score  float8
)
language sql
stable
as $$
  with
  -- Step 1: Text matching (tsvector + trigram fallback)
  text_matches as (
    select
      p.id,
      p.display_name,
      p.role,
      p.home_city,
      p.home_state,
      p.country,
      -- tsvector rank (0-1 normalized)
      case
        when p_query is not null and p_query <> '' then
          ts_rank_cd(
            p.search_vector,
            websearch_to_tsquery('hc_english', p_query),
            32  -- normalize by document length
          )
        else 0.5  -- neutral score when no query
      end as ts_score,
      -- trigram similarity (0-1)
      case
        when p_query is not null and p_query <> '' then
          similarity(p.search_text, p_query)
        else 0.0
      end as trgm_score
    from public.profiles p
    where
      -- Text filter: match either tsvector OR trigram (fuzzy)
      (
        p_query is null
        or p_query = ''
        or p.search_vector @@ websearch_to_tsquery('hc_english', p_query)
        or similarity(p.search_text, p_query) > 0.15
      )
      -- Country filter
      and (p_country is null or p.country = p_country)
      -- State filter
      and (p_state is null or p.home_state = p_state)
      -- Role filter: only drivers/operators
      and p.role = 'driver'
  ),

  -- Step 2: Join driver details + geo distance + trust signals
  scored as (
    select
      tm.id as profile_id,
      tm.display_name,
      tm.role,
      tm.home_city,
      tm.home_state,
      tm.country,
      dp.verified_badge,
      dp.has_high_pole,
      -- Geo distance in miles (null if no geo params)
      case
        when p_lat is not null and p_lng is not null and dp.geo is not null then
          st_distance(
            dp.geo,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
          ) / 1609.34  -- meters to miles
        else null
      end as distance_miles,
      -- Combined text score (weighted blend of tsvector + trigram)
      (tm.ts_score * 0.7 + tm.trgm_score * 0.3)::float4 as text_score,
      -- Trust score from latest snapshot (0-100)
      coalesce(ss.score, 50) as trust_score,
      -- Availability recency boost
      case
        when dp.last_active_at > now() - interval '24 hours' then 1.0
        when dp.last_active_at > now() - interval '7 days'   then 0.7
        when dp.last_active_at > now() - interval '30 days'  then 0.4
        else 0.1
      end as recency_boost,
      -- Verification boost
      case when dp.verified_badge then 1.2 else 1.0 end as verify_boost
    from text_matches tm
    join public.driver_profiles dp on dp.user_id = tm.id
    left join lateral (
      select score
      from public.score_snapshots
      where subject_type = 'driver'
        and subject_id = tm.id
      order by created_at desc
      limit 1
    ) ss on true
    where
      -- Geo radius filter
      (
        p_lat is null or p_lng is null or dp.geo is null
        or st_dwithin(
          dp.geo,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
          p_radius_miles * 1609.34  -- miles to meters
        )
      )
      -- Equipment filters
      and (not p_verified_only or dp.verified_badge = true)
      and (not p_has_high_pole or dp.has_high_pole = true)
  )

  -- Step 3: Composite scoring (THE MOAT)
  select
    s.profile_id,
    s.display_name,
    s.role,
    s.home_city,
    s.home_state,
    s.country,
    s.verified_badge,
    s.has_high_pole,
    round(s.distance_miles::numeric, 1)::float8 as distance_miles,
    s.text_score,
    s.trust_score,
    -- HC Composite Score formula:
    --   40% text relevance
    --   25% trust score (normalized 0-1)
    --   15% geo proximity (inverse distance decay, capped)
    --   10% recency
    --   10% verification
    round((
      (s.text_score * 0.40) +
      ((s.trust_score / 100.0) * 0.25) +
      (case
        when s.distance_miles is null then 0.5  -- no geo = neutral
        when s.distance_miles < 10 then 1.0
        when s.distance_miles < 50 then 0.8
        when s.distance_miles < 150 then 0.5
        else 0.2
      end * 0.15) +
      (s.recency_boost * 0.10) +
      (s.verify_boost * 0.10 - 0.10)  -- normalize: verified=0.02, not=0
    )::numeric, 4)::float8 as composite_score
  from scored s
  order by
    -- Primary: composite score descending
    composite_score desc,
    -- Tiebreaker: distance ascending (closer first)
    coalesce(s.distance_miles, 99999) asc
  limit p_limit
  offset p_offset;
$$;


-- =====================================================================
-- 7) Load Search RPC (simpler: text + status + geo)
-- =====================================================================

create or replace function hc_search_loads(
  p_query         text    default null,
  p_status        text    default 'posted',
  p_origin_lat    float8  default null,
  p_origin_lng    float8  default null,
  p_radius_miles  int     default 200,
  p_limit         int     default 50,
  p_offset        int     default 0
)
returns table (
  load_id       uuid,
  title         text,
  status        load_status,
  origin_text   text,
  dest_text     text,
  pickup_at     timestamptz,
  distance_miles float8
)
language sql
stable
as $$
  select
    l.id as load_id,
    l.title,
    l.status,
    l.origin_text,
    l.dest_text,
    l.pickup_at,
    case
      when p_origin_lat is not null and p_origin_lng is not null
           and l.origin_lat is not null and l.origin_lng is not null then
        st_distance(
          st_setsrid(st_makepoint(l.origin_lng, l.origin_lat), 4326)::geography,
          st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography
        ) / 1609.34
      else null
    end as distance_miles
  from public.loads l
  where
    (p_status is null or l.status::text = p_status)
    and l.deleted_at is null
    and (
      p_query is null or p_query = ''
      or l.title ilike '%' || p_query || '%'
      or l.origin_text ilike '%' || p_query || '%'
      or l.dest_text ilike '%' || p_query || '%'
      or l.notes ilike '%' || p_query || '%'
    )
    and (
      p_origin_lat is null or p_origin_lng is null
      or l.origin_lat is null or l.origin_lng is null
      or st_dwithin(
        st_setsrid(st_makepoint(l.origin_lng, l.origin_lat), 4326)::geography,
        st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography,
        p_radius_miles * 1609.34
      )
    )
  order by
    case
      when p_origin_lat is not null and p_origin_lng is not null
           and l.origin_lat is not null and l.origin_lng is not null then
        st_distance(
          st_setsrid(st_makepoint(l.origin_lng, l.origin_lat), 4326)::geography,
          st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography
        )
      else 0
    end asc,
    l.created_at desc
  limit p_limit
  offset p_offset;
$$;


-- =====================================================================
-- 8) Grant execute to anon + authenticated
-- =====================================================================

grant execute on function hc_search_operators to anon, authenticated;
grant execute on function hc_search_loads to anon, authenticated;


commit;
