-- ============================================================================
-- Industrial Zones + Border Crossings + Scarcity Snapshots + ML Features
-- ============================================================================

-- ── Industrial Zones ───────────────────────────────────────────────────────
create table if not exists public.industrial_zones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code char(2) not null,
  region text,
  city text,
  lat double precision,
  lon double precision,

  -- Classification
  zone_type text,                        -- manufacturing, mining, wind_farm, oil_gas, construction, intermodal, power_gen
  industry_tags text[] default '{}',
  heavy_haul_relevant boolean default true,

  -- Scoring
  relevance_score int default 0 check (relevance_score between 0 and 100),
  relevance_tier text generated always as (
    case
      when relevance_score >= 72 then 'tier_1_dominate'
      when relevance_score >= 50 then 'tier_2_build'
      else 'tier_3_monitor'
    end
  ) stored,

  -- Connections
  primary_corridor_id uuid references public.corridors(id) on delete set null,
  nearest_port_id uuid,

  -- SEO
  published boolean default false,
  indexing_mode text default 'noindex',
  quality_score int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists iz_country_idx on public.industrial_zones(country_code);
create index if not exists iz_type_idx on public.industrial_zones(zone_type);
create index if not exists iz_score_idx on public.industrial_zones(relevance_score desc);
create index if not exists iz_slug_idx on public.industrial_zones(slug);
create index if not exists iz_corridor_idx on public.industrial_zones(primary_corridor_id);

alter table public.industrial_zones enable row level security;
create policy iz_read on public.industrial_zones for select using (true);
create policy iz_write on public.industrial_zones for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- ── Border Crossings ───────────────────────────────────────────────────────
create table if not exists public.border_crossings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_a char(2) not null,
  country_b char(2) not null,
  country_pair text generated always as (
    case when country_a < country_b
      then country_a || '_' || country_b
      else country_b || '_' || country_a
    end
  ) stored,
  region_a text,
  region_b text,
  city_a text,
  city_b text,
  lat double precision,
  lon double precision,

  -- Classification
  crossing_type text,                    -- major_commercial, secondary, port_of_entry, ferry, special_permit
  heavy_truck_capable boolean default true,

  -- Scoring
  relevance_score int default 0 check (relevance_score between 0 and 100),
  relevance_tier text generated always as (
    case
      when relevance_score >= 72 then 'tier_1_dominate'
      when relevance_score >= 50 then 'tier_2_build'
      else 'tier_3_monitor'
    end
  ) stored,

  -- Complexity
  permit_complexity_index int default 50 check (permit_complexity_index between 0 and 100),
  escort_handoff_required boolean default false,
  documentation_notes text,

  -- Connections
  primary_corridor_id uuid references public.corridors(id) on delete set null,

  -- SEO
  published boolean default false,
  indexing_mode text default 'noindex',
  quality_score int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bc_pair_idx on public.border_crossings(country_pair);
create index if not exists bc_country_a_idx on public.border_crossings(country_a);
create index if not exists bc_country_b_idx on public.border_crossings(country_b);
create index if not exists bc_score_idx on public.border_crossings(relevance_score desc);
create index if not exists bc_slug_idx on public.border_crossings(slug);

alter table public.border_crossings enable row level security;
create policy bc_read on public.border_crossings for select using (true);
create policy bc_write on public.border_crossings for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- ── Scarcity Snapshots (hourly per corridor) ───────────────────────────────
create table if not exists public.scarcity_snapshots (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.corridors(id) on delete cascade,
  bucket_hour timestamptz not null,
  scarcity_index int not null check (scarcity_index between 0 and 100),
  surge_multiplier numeric(3,2) not null default 1.00,
  alert_level text not null default 'normal',
  supply_active_escorts int default 0,
  demand_open_loads int default 0,
  avg_response_minutes numeric,
  fill_rate numeric,
  weather_risk numeric default 0,
  event_risk numeric default 0,
  created_at timestamptz default now(),
  unique(corridor_id, bucket_hour)
);

create index if not exists ss_corridor_time on public.scarcity_snapshots(corridor_id, bucket_hour desc);
create index if not exists ss_alert_idx on public.scarcity_snapshots(alert_level) where alert_level in ('high','critical');

alter table public.scarcity_snapshots enable row level security;
create policy ss_read on public.scarcity_snapshots for select using (true);
create policy ss_write on public.scarcity_snapshots for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- ── ML Feature Export (daily trust feature snapshot) ───────────────────────
create table if not exists public.trust_features_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,

  -- Verification
  identity_verified boolean default false,
  insurance_verified boolean default false,
  twic_verified boolean default false,
  equipment_verified_count int default 0,

  -- Reviews
  avg_review_score_30d numeric,
  avg_review_score_180d numeric,
  review_velocity_30d int default 0,
  negative_review_ratio numeric default 0,

  -- Activity
  posts_last_30d int default 0,
  runs_last_30d int default 0,

  -- Intel
  intel_reports_total int default 0,
  intel_confirm_rate numeric default 0,

  -- Response
  median_response_minutes_30d numeric,
  quote_accept_rate_30d numeric,

  -- Complaints
  complaint_count_180d int default 0,

  -- Social
  endorsement_count_weighted numeric default 0,
  follower_count int default 0,

  -- Profile
  profile_photo_completeness numeric default 0,
  geo_coverage_score numeric default 0,

  -- Computed trust score
  trust_score int default 0,
  trust_tier text,

  created_at timestamptz default now(),
  unique(user_id, snapshot_date)
);

create index if not exists tfd_user_date on public.trust_features_daily(user_id, snapshot_date desc);

alter table public.trust_features_daily enable row level security;
create policy tfd_read on public.trust_features_daily for select using (auth.role() = 'service_role');
create policy tfd_write on public.trust_features_daily for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- ── Country Terminology ────────────────────────────────────────────────────
create table if not exists public.country_terminology (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  primary_term text not null,
  secondary_terms text[] default '{}',
  notes text,
  unique(country_code)
);

insert into public.country_terminology (country_code, primary_term, secondary_terms, notes) values
  ('US', 'pilot car', '{"oversize load escort","wide load escort","escort vehicle","chase car","lead car","rear escort","superload escort","high pole"}', 'Primary North America term'),
  ('CA', 'pilot car', '{"oversize load escort","wide load escort","escort vehicle"}', 'Same as US with minor provincial differences'),
  ('AU', 'pilot vehicle', '{"oversize escort","overdimension escort","pilot services","lead pilot","rear pilot"}', 'Mining/wind priority market'),
  ('GB', 'abnormal load escort', '{"abnormal load services","escort vehicles","STGO escort","police escort coordination","movement order support"}', 'Dense metro targeting'),
  ('NZ', 'pilot vehicle', '{"oversize escort","overdimension escort","HPMV support","route escort"}', 'Fast total coverage opportunity'),
  ('SE', 'special transport escort', '{"route survey","permit support","convoy coordination"}', 'Forestry/wind corridors'),
  ('NO', 'special transport escort', '{"offshore/energy moves","route planning","convoy coordination"}', 'High margin niche'),
  ('AE', 'heavy transport escort', '{"project cargo escort","port-to-site escort","construction logistics escort"}', 'Port-to-site emphasis'),
  ('SA', 'heavy transport escort', '{"giga project escort","permit assistance"}', 'Trust + compliance prominence'),
  ('DE', 'abnormal transport escort', '{"BF3/BF4 escort support","permit support","route survey"}', 'Compliance strictness'),
  ('ZA', 'abnormal load escort', '{"heavy haul escort","mining equipment escort","route planning","corridor escort"}', 'Payment friction messaging')
on conflict (country_code) do nothing;

alter table public.country_terminology enable row level security;
create policy ct_read on public.country_terminology for select using (true);
