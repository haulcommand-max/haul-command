/* =========================================================
   HAUL COMMAND — 52-COUNTRY REGULATION ENGINE
   Option A + B + C (Build + Intelligence + Moat Pack)
   Target: Supabase Postgres
   Paste as one migration.

   Notes:
   - Uses a simple hc_admins table for write access.
   - Read access is public for "published" regulations.
   - Writes restricted to admins.
   ========================================================= */

begin;

create schema if not exists hc_reg;

-- ---------- EXTENSIONS ----------
create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin
  create type hc_reg.subdivision_type as enum ('state','province','region','emirate','prefecture','territory','department','district','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hc_reg.rule_scope as enum ('country','subdivision','corridor_override');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hc_reg.rule_status as enum ('draft','published','deprecated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hc_reg.country_tier as enum ('gold','blue','silver','slate');
exception when duplicate_object then null; end $$;


-- =========================================================
--  AUTHZ: ADMIN LIST (minimal)
-- =========================================================
create table if not exists hc_reg.hc_admins (
  user_id uuid primary key
);

alter table hc_reg.hc_admins enable row level security;

drop policy if exists "admins_read_self_or_admin" on hc_reg.hc_admins;
create policy "admins_read_self_or_admin"
on hc_reg.hc_admins
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from hc_reg.hc_admins a where a.user_id = auth.uid())
);

drop policy if exists "admins_write_admin_only" on hc_reg.hc_admins;
create policy "admins_write_admin_only"
on hc_reg.hc_admins
for all
to authenticated
using (exists (select 1 from hc_reg.hc_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from hc_reg.hc_admins a where a.user_id = auth.uid()));


-- =========================================================
--  CORE TABLES
-- =========================================================

-- Countries (PRIMARY KEY SPACE)
create table if not exists hc_reg.hc_countries (
  id uuid primary key default gen_random_uuid(),
  iso2 text not null unique check (char_length(iso2) = 2),
  iso3 text unique check (iso3 is null or char_length(iso3) = 3),
  name text not null,
  tier hc_reg.country_tier not null default 'silver',
  is_active boolean not null default true,

  -- Intelligence fields
  regulatory_complexity_score int not null default 0 check (regulatory_complexity_score >= 0),
  verification_cadence_days int not null default 90 check (verification_cadence_days between 7 and 365),
  last_verified_at timestamptz,
  next_verification_due_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hc_countries_tier_idx on hc_reg.hc_countries(tier);
create index if not exists hc_countries_active_idx on hc_reg.hc_countries(is_active);

-- Subdivisions (STATE/PROVINCE/REGION children)
create table if not exists hc_reg.hc_subdivisions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references hc_reg.hc_countries(id) on delete cascade,
  name text not null,
  code text not null,
  type hc_reg.subdivision_type not null default 'other',
  is_primary_permit_authority boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(country_id, code)
);

create index if not exists hc_subdivisions_country_idx on hc_reg.hc_subdivisions(country_id);
create index if not exists hc_subdivisions_country_code_idx on hc_reg.hc_subdivisions(country_id, code);

-- Regulation profiles (the rule engine)
create table if not exists hc_reg.hc_regulation_profiles (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references hc_reg.hc_countries(id) on delete cascade,
  subdivision_id uuid references hc_reg.hc_subdivisions(id) on delete cascade,
  scope hc_reg.rule_scope not null default 'country',
  status hc_reg.rule_status not null default 'draft',

  -- Trigger thresholds (nullable = baseline)
  width_threshold_ft numeric,
  height_threshold_ft numeric,
  length_threshold_ft numeric,
  weight_threshold_lb numeric,

  -- Requirements
  requires_pilot_car boolean not null default false,
  escort_vehicle_count int not null default 0 check (escort_vehicle_count >= 0),
  high_pole_required boolean not null default false,
  police_required boolean not null default false,

  night_travel_allowed boolean,
  weekend_travel_allowed boolean,

  -- Provenance & confidence
  source_url text,
  source_note text,
  confidence_score numeric not null default 0.50 check (confidence_score between 0 and 1),
  verified_at timestamptz,

  -- Optional extra structured rules
  rules_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Basic scope integrity
  check (
    (scope = 'country' and subdivision_id is null)
    or (scope = 'subdivision' and subdivision_id is not null)
    or (scope = 'corridor_override')
  )
);

create index if not exists hc_reg_profiles_country_scope_status_idx
  on hc_reg.hc_regulation_profiles(country_id, scope, status);

create index if not exists hc_reg_profiles_subdivision_status_idx
  on hc_reg.hc_regulation_profiles(subdivision_id, status)
  where subdivision_id is not null;

create index if not exists hc_reg_profiles_verified_idx
  on hc_reg.hc_regulation_profiles(country_id, verified_at desc);

create index if not exists hc_reg_profiles_thresholds_idx
  on hc_reg.hc_regulation_profiles(country_id, subdivision_id, scope, status,
    width_threshold_ft, height_threshold_ft, length_threshold_ft, weight_threshold_lb);

-- Verification runs (cadence engine + audit)
create table if not exists hc_reg.hc_reg_verification_runs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references hc_reg.hc_countries(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  run_status text not null default 'running',
  notes text,
  changed_profiles_count int not null default 0,
  created_by uuid
);

create index if not exists hc_reg_verification_runs_country_idx on hc_reg.hc_reg_verification_runs(country_id, started_at desc);

-- Confidence events (decay + boosts)
create table if not exists hc_reg.hc_reg_confidence_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references hc_reg.hc_regulation_profiles(id) on delete cascade,
  event_type text not null,
  delta numeric not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists hc_reg_conf_events_profile_idx on hc_reg.hc_reg_confidence_events(profile_id, created_at desc);


-- =========================================================
--  CACHING LAYER (Option C)
-- =========================================================
create table if not exists hc_reg.hc_regulation_cache (
  cache_key text primary key,
  country_id uuid not null references hc_reg.hc_countries(id) on delete cascade,
  subdivision_id uuid references hc_reg.hc_subdivisions(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists hc_reg_cache_country_sub_idx on hc_reg.hc_regulation_cache(country_id, subdivision_id);
create index if not exists hc_reg_cache_expires_idx on hc_reg.hc_regulation_cache(expires_at);

create or replace function hc_reg.hc_cache_purge_expired()
returns int
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  delete from hc_reg.hc_regulation_cache where expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;


-- =========================================================
--  UPDATED_AT TRIGGERS
-- =========================================================
create or replace function hc_reg.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  create trigger trg_countries_updated_at
  before update on hc_reg.hc_countries
  for each row execute function hc_reg.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_subdivisions_updated_at
  before update on hc_reg.hc_subdivisions
  for each row execute function hc_reg.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_profiles_updated_at
  before update on hc_reg.hc_regulation_profiles
  for each row execute function hc_reg.set_updated_at();
exception when duplicate_object then null; end $$;


-- =========================================================
--  RLS POLICIES (Option A)
-- =========================================================
alter table hc_reg.hc_countries enable row level security;
alter table hc_reg.hc_subdivisions enable row level security;
alter table hc_reg.hc_regulation_profiles enable row level security;
alter table hc_reg.hc_reg_verification_runs enable row level security;
alter table hc_reg.hc_reg_confidence_events enable row level security;
alter table hc_reg.hc_regulation_cache enable row level security;

create or replace function hc_reg.is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from hc_reg.hc_admins a where a.user_id = auth.uid())
$$;

-- Countries
drop policy if exists "countries_public_read_active" on hc_reg.hc_countries;
create policy "countries_public_read_active"
on hc_reg.hc_countries for select to anon, authenticated
using (is_active = true);

drop policy if exists "countries_admin_write" on hc_reg.hc_countries;
create policy "countries_admin_write"
on hc_reg.hc_countries for all to authenticated
using (hc_reg.is_admin()) with check (hc_reg.is_admin());

-- Subdivisions
drop policy if exists "subdivisions_public_read_active_country" on hc_reg.hc_subdivisions;
create policy "subdivisions_public_read_active_country"
on hc_reg.hc_subdivisions for select to anon, authenticated
using (exists (select 1 from hc_reg.hc_countries c where c.id = hc_subdivisions.country_id and c.is_active = true));

drop policy if exists "subdivisions_admin_write" on hc_reg.hc_subdivisions;
create policy "subdivisions_admin_write"
on hc_reg.hc_subdivisions for all to authenticated
using (hc_reg.is_admin()) with check (hc_reg.is_admin());

-- Profiles
drop policy if exists "profiles_public_read_published" on hc_reg.hc_regulation_profiles;
create policy "profiles_public_read_published"
on hc_reg.hc_regulation_profiles for select to anon, authenticated
using (status = 'published');

drop policy if exists "profiles_admin_write" on hc_reg.hc_regulation_profiles;
create policy "profiles_admin_write"
on hc_reg.hc_regulation_profiles for all to authenticated
using (hc_reg.is_admin()) with check (hc_reg.is_admin());

-- Verification runs: admin only
drop policy if exists "verification_runs_admin_only" on hc_reg.hc_reg_verification_runs;
create policy "verification_runs_admin_only"
on hc_reg.hc_reg_verification_runs for all to authenticated
using (hc_reg.is_admin()) with check (hc_reg.is_admin());

-- Confidence events: admin only
drop policy if exists "confidence_events_admin_only" on hc_reg.hc_reg_confidence_events;
create policy "confidence_events_admin_only"
on hc_reg.hc_reg_confidence_events for all to authenticated
using (hc_reg.is_admin()) with check (hc_reg.is_admin());

-- Cache
drop policy if exists "cache_public_read" on hc_reg.hc_regulation_cache;
create policy "cache_public_read"
on hc_reg.hc_regulation_cache for select to anon, authenticated
using (expires_at > now());

drop policy if exists "cache_admin_write" on hc_reg.hc_regulation_cache;
create policy "cache_admin_write"
on hc_reg.hc_regulation_cache for all to authenticated
using (hc_reg.is_admin()) with check (hc_reg.is_admin());


-- =========================================================
--  OPTION B — INTELLIGENCE PHASE
-- =========================================================

create or replace function hc_reg.hc_compute_country_complexity(p_country_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  v_subdivisions int;
  v_profiles int;
  v_threshold_rows int;
  v_special_req int;
  v_score int;
begin
  select count(*) into v_subdivisions from hc_reg.hc_subdivisions s where s.country_id = p_country_id;
  select count(*) into v_profiles from hc_reg.hc_regulation_profiles rp where rp.country_id = p_country_id and rp.status = 'published';
  select count(*) into v_threshold_rows from hc_reg.hc_regulation_profiles rp where rp.country_id = p_country_id and rp.status = 'published' and (rp.width_threshold_ft is not null or rp.height_threshold_ft is not null or rp.length_threshold_ft is not null or rp.weight_threshold_lb is not null);
  select count(*) into v_special_req from hc_reg.hc_regulation_profiles rp where rp.country_id = p_country_id and rp.status = 'published' and (rp.police_required = true or rp.high_pole_required = true);

  v_score := (v_subdivisions * 2) + (v_profiles * 1) + (v_threshold_rows * 2) + (v_special_req * 5);

  update hc_reg.hc_countries set regulatory_complexity_score = v_score, updated_at = now() where id = p_country_id;
  return v_score;
end $$;

create or replace function hc_reg.hc_recompute_country_cadence(p_country_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  v_tier hc_reg.country_tier;
  v_complex int;
  v_base int;
  v_adj int;
  v_days int;
begin
  select tier, regulatory_complexity_score into v_tier, v_complex from hc_reg.hc_countries where id = p_country_id;

  v_base := case v_tier when 'gold' then 14 when 'blue' then 30 when 'silver' then 90 when 'slate' then 120 end;
  v_adj := case when v_complex >= 600 then 10 when v_complex >= 300 then 7 when v_complex >= 150 then 5 when v_complex >= 75 then 3 else 0 end;
  v_days := greatest(7, v_base - v_adj);

  update hc_reg.hc_countries set verification_cadence_days = v_days, next_verification_due_at = coalesce(last_verified_at, now()) + make_interval(days => v_days), updated_at = now() where id = p_country_id;
  return v_days;
end $$;

create or replace function hc_reg.hc_confidence_decay(
  p_country_tier hc_reg.country_tier,
  p_confidence numeric,
  p_verified_at timestamptz
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_half_life_days numeric;
  v_age_days numeric;
  v_baseline numeric := 0.20;
  v_lambda numeric;
  v_out numeric;
begin
  if p_verified_at is null then return greatest(v_baseline, least(1.0, p_confidence)); end if;

  v_half_life_days := case p_country_tier when 'gold' then 30 when 'blue' then 60 when 'silver' then 120 when 'slate' then 180 end;
  v_age_days := extract(epoch from (now() - p_verified_at)) / 86400.0;
  v_lambda := ln(2.0) / v_half_life_days;
  v_out := v_baseline + (p_confidence - v_baseline) * exp(-v_lambda * v_age_days);

  return greatest(v_baseline, least(1.0, v_out));
end $$;

create or replace function hc_reg.hc_refresh_profile_confidence(p_profile_id uuid)
returns numeric
language plpgsql
security definer
as $$
declare
  v_tier hc_reg.country_tier;
  v_conf numeric;
  v_verified timestamptz;
  v_new numeric;
begin
  select c.tier, rp.confidence_score, rp.verified_at into v_tier, v_conf, v_verified
  from hc_reg.hc_regulation_profiles rp join hc_reg.hc_countries c on c.id = rp.country_id where rp.id = p_profile_id;

  v_new := hc_reg.hc_confidence_decay(v_tier, v_conf, v_verified);
  update hc_reg.hc_regulation_profiles set confidence_score = v_new, updated_at = now() where id = p_profile_id;
  return v_new;
end $$;


-- =========================================================
--  OPTION C — FULL MOAT PACK
-- =========================================================

create or replace function hc_reg.norm_code(p text)
returns text language sql immutable
as $$ select upper(regexp_replace(coalesce(p,''), '\s+', '', 'g')) $$;

create or replace function hc_reg.hc_reg_cache_key(
  p_country_iso2 text, p_subdivision_code text,
  p_width_ft numeric, p_height_ft numeric, p_length_ft numeric, p_weight_lb numeric,
  p_flags jsonb
)
returns text language sql immutable
as $$
select encode(digest(
  jsonb_build_object(
    'c', hc_reg.norm_code(p_country_iso2), 's', hc_reg.norm_code(p_subdivision_code),
    'w', coalesce(p_width_ft,0), 'h', coalesce(p_height_ft,0),
    'l', coalesce(p_length_ft,0), 'wt', coalesce(p_weight_lb,0),
    'f', coalesce(p_flags,'{}'::jsonb)
  )::text, 'sha256'), 'hex')
$$;

create or replace function hc_reg.hc_resolve_regulation(
  p_country_iso2 text,
  p_subdivision_code text default null,
  p_width_ft numeric default null,
  p_height_ft numeric default null,
  p_length_ft numeric default null,
  p_weight_lb numeric default null,
  p_flags jsonb default '{}'::jsonb,
  p_use_cache boolean default true
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_country_id uuid;
  v_subdivision_id uuid;
  v_cache_key text;
  v_cached jsonb;
  v_tier hc_reg.country_tier;
  v_rule record;
  v_effective_conf numeric;
  v_ttl_seconds int;
begin
  select id, tier into v_country_id, v_tier
  from hc_reg.hc_countries where iso2 = hc_reg.norm_code(p_country_iso2) and is_active = true;

  if v_country_id is null then
    return jsonb_build_object('ok', false, 'error', 'unknown_or_inactive_country', 'country', hc_reg.norm_code(p_country_iso2));
  end if;

  if p_subdivision_code is not null and length(trim(p_subdivision_code)) > 0 then
    select id into v_subdivision_id from hc_reg.hc_subdivisions where country_id = v_country_id and code = hc_reg.norm_code(p_subdivision_code);
  else
    v_subdivision_id := null;
  end if;

  v_cache_key := hc_reg.hc_reg_cache_key(p_country_iso2, p_subdivision_code, p_width_ft, p_height_ft, p_length_ft, p_weight_lb, p_flags);

  if p_use_cache then
    select payload into v_cached from hc_reg.hc_regulation_cache where cache_key = v_cache_key and expires_at > now();
    if v_cached is not null then return v_cached || jsonb_build_object('cache', true); end if;
  end if;

  select rp.* into v_rule
  from hc_reg.hc_regulation_profiles rp
  where rp.country_id = v_country_id and rp.status = 'published'
    and ((v_subdivision_id is not null and rp.scope = 'subdivision' and rp.subdivision_id = v_subdivision_id)
      or (rp.scope = 'country' and rp.subdivision_id is null))
    and (rp.width_threshold_ft is null or (p_width_ft is not null and p_width_ft >= rp.width_threshold_ft))
    and (rp.height_threshold_ft is null or (p_height_ft is not null and p_height_ft >= rp.height_threshold_ft))
    and (rp.length_threshold_ft is null or (p_length_ft is not null and p_length_ft >= rp.length_threshold_ft))
    and (rp.weight_threshold_lb is null or (p_weight_lb is not null and p_weight_lb >= rp.weight_threshold_lb))
  order by
    case rp.scope when 'subdivision' then 0 else 1 end,
    ((rp.width_threshold_ft is not null)::int + (rp.height_threshold_ft is not null)::int + (rp.length_threshold_ft is not null)::int + (rp.weight_threshold_lb is not null)::int) desc,
    rp.verified_at desc nulls last,
    rp.confidence_score desc
  limit 1;

  if v_rule.id is null then
    return jsonb_build_object('ok', false, 'error', 'no_published_rules_match', 'country', hc_reg.norm_code(p_country_iso2), 'subdivision', hc_reg.norm_code(p_subdivision_code));
  end if;

  v_effective_conf := hc_reg.hc_confidence_decay(v_tier, v_rule.confidence_score, v_rule.verified_at);
  v_ttl_seconds := case v_tier when 'gold' then 3600 when 'blue' then 10800 when 'silver' then 21600 when 'slate' then 43200 end;

  v_cached := jsonb_build_object(
    'ok', true,
    'country', hc_reg.norm_code(p_country_iso2),
    'subdivision', case when v_subdivision_id is null then null else hc_reg.norm_code(p_subdivision_code) end,
    'scope', v_rule.scope,
    'profile_id', v_rule.id,
    'requires_pilot_car', v_rule.requires_pilot_car,
    'escort_vehicle_count', v_rule.escort_vehicle_count,
    'high_pole_required', v_rule.high_pole_required,
    'police_required', v_rule.police_required,
    'night_travel_allowed', v_rule.night_travel_allowed,
    'weekend_travel_allowed', v_rule.weekend_travel_allowed,
    'trigger_thresholds', jsonb_build_object('width_ft', v_rule.width_threshold_ft, 'height_ft', v_rule.height_threshold_ft, 'length_ft', v_rule.length_threshold_ft, 'weight_lb', v_rule.weight_threshold_lb),
    'rules_json', v_rule.rules_json,
    'provenance', jsonb_build_object('source_url', v_rule.source_url, 'source_note', v_rule.source_note, 'verified_at', v_rule.verified_at),
    'confidence', jsonb_build_object('stored', v_rule.confidence_score, 'effective', v_effective_conf, 'tier', v_tier),
    'cache', false,
    'cached_until', now() + make_interval(secs => v_ttl_seconds)
  );

  insert into hc_reg.hc_regulation_cache(cache_key, country_id, subdivision_id, payload, expires_at)
  values (v_cache_key, v_country_id, v_subdivision_id, v_cached, now() + make_interval(secs => v_ttl_seconds))
  on conflict (cache_key) do update set payload = excluded.payload, expires_at = excluded.expires_at, created_at = now();

  return v_cached;
end $$;

grant execute on function hc_reg.hc_resolve_regulation(text,text,numeric,numeric,numeric,numeric,jsonb,boolean) to anon, authenticated;


-- =========================================================
--  Dispatch Hook Integration
-- =========================================================

create or replace function hc_reg.hc_dispatch_regulation_check(p_route jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_legs jsonb; v_dims jsonb; v_flags jsonb; v_leg jsonb; v_result jsonb;
  v_per_leg jsonb := '[]'::jsonb; v_violations jsonb := '[]'::jsonb;
  v_max_escorts int := 0; v_any_police boolean := false; v_any_high_pole boolean := false; v_any_pilot boolean := false;
  v_ok boolean := true;
  v_width numeric; v_height numeric; v_length numeric; v_weight numeric;
  i int;
begin
  v_legs := coalesce(p_route->'legs', '[]'::jsonb);
  v_dims := coalesce(p_route->'dims', '{}'::jsonb);
  v_flags := coalesce(p_route->'flags', '{}'::jsonb);
  v_width  := nullif((v_dims->>'width_ft')::numeric, 0);
  v_height := nullif((v_dims->>'height_ft')::numeric, 0);
  v_length := nullif((v_dims->>'length_ft')::numeric, 0);
  v_weight := nullif((v_dims->>'weight_lb')::numeric, 0);

  if jsonb_typeof(v_legs) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'legs_must_be_array');
  end if;

  for i in 0..jsonb_array_length(v_legs)-1 loop
    v_leg := v_legs->i;
    v_result := hc_reg.hc_resolve_regulation(v_leg->>'country', v_leg->>'subdivision', v_width, v_height, v_length, v_weight, v_flags, true);

    v_per_leg := v_per_leg || jsonb_build_array(jsonb_build_object('leg', v_leg, 'regulation', v_result));

    if coalesce((v_result->>'ok')::boolean, false) = false then
      v_ok := false;
      v_violations := v_violations || jsonb_build_array(jsonb_build_object('leg', v_leg, 'issue', v_result));
    else
      v_max_escorts := greatest(v_max_escorts, coalesce((v_result->>'escort_vehicle_count')::int, 0));
      v_any_police := v_any_police or coalesce((v_result->>'police_required')::boolean, false);
      v_any_high_pole := v_any_high_pole or coalesce((v_result->>'high_pole_required')::boolean, false);
      v_any_pilot := v_any_pilot or coalesce((v_result->>'requires_pilot_car')::boolean, false);
    end if;
  end loop;

  return jsonb_build_object(
    'ok', v_ok,
    'required', jsonb_build_object('max_escort_vehicle_count', v_max_escorts, 'any_police_required', v_any_police, 'any_high_pole_required', v_any_high_pole, 'any_requires_pilot_car', v_any_pilot),
    'violations', v_violations,
    'per_leg', v_per_leg
  );
end $$;

grant execute on function hc_reg.hc_dispatch_regulation_check(jsonb) to authenticated;


-- =========================================================
--  SEED TIER CADENCE DEFAULTS
-- =========================================================
create or replace function hc_reg.hc_set_tier_defaults()
returns void
language plpgsql
security definer
as $$
begin
  update hc_reg.hc_countries set verification_cadence_days =
    case tier when 'gold' then 14 when 'blue' then 30 when 'silver' then 90 when 'slate' then 120 end
  where verification_cadence_days is null or verification_cadence_days <= 0;

  update hc_reg.hc_countries
  set next_verification_due_at = coalesce(last_verified_at, now()) + make_interval(days => verification_cadence_days)
  where next_verification_due_at is null;
end $$;

commit;
