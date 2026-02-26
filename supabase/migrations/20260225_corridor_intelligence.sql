-- ============================================================================
-- Corridor Scarcity Intelligence + Permit Friction Heatmap
-- Feeds: escort shortage predictor, broker risk alerts, dynamic pricing
-- ============================================================================

-- ── Corridor Scarcity Scores ───────────────────────────────────────────────
create table if not exists public.corridor_scarcity_scores (
    id                      uuid primary key default gen_random_uuid(),
    corridor_slug           text not null,
    country_code            text not null,
    region_code             text,
    -- Supply signals
    escorts_active_30d      integer default 0,
    escorts_online_now      integer default 0,
    avg_acceptance_rate     numeric(5,2),
    avg_response_time_min   numeric(6,1),
    escort_reliability_avg  numeric(5,2),
    new_signup_velocity_7d  integer default 0,
    -- Demand signals
    loads_posted_7d         integer default 0,
    loads_posted_24h        integer default 0,
    broker_search_freq_7d   integer default 0,
    corridor_heat_score     numeric(5,2),
    -- Computed indices
    supply_index            numeric(8,4),
    demand_intensity_index  numeric(8,4),
    friction_multiplier     numeric(6,3) default 1.000,
    scarcity_score_raw      numeric(8,4),
    scarcity_score_adjusted numeric(8,4),
    scarcity_band           text,       -- healthy, tightening, shortage_risk, critical_shortage
    confidence              numeric(4,3) default 0.500,
    -- Forecast
    forecast_24h_band       text,
    forecast_72h_band       text,
    forecast_7d_band        text,
    -- Timestamps
    computed_at             timestamptz default now(),
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

create index if not exists css_corridor_idx on public.corridor_scarcity_scores (corridor_slug, country_code);
create index if not exists css_band_idx on public.corridor_scarcity_scores (scarcity_band, country_code);
create index if not exists css_computed_idx on public.corridor_scarcity_scores (computed_at desc);

-- ── Permit Friction Scores ─────────────────────────────────────────────────
create table if not exists public.permit_friction_scores (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null,
    region_code             text,
    corridor_slug           text,
    -- Component scores (0-2 scale each)
    approval_speed_score    numeric(5,3),
    regulatory_complexity   numeric(5,3),
    restriction_density     numeric(5,3),
    route_risk_pressure     numeric(5,3),
    rework_probability      numeric(5,3),
    -- Composite
    friction_score          numeric(8,4) not null,
    friction_band           text not null,  -- low, moderate, high, extreme
    confidence              numeric(4,3) default 0.500,
    data_sources_count      integer default 0,
    -- Sparse data flag
    is_sparse_estimate      boolean default true,
    prior_source            text,          -- country_prior, region_shrinkage, rule_bootstrap
    -- Timestamps
    computed_at             timestamptz default now(),
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

create index if not exists pfs_country_idx on public.permit_friction_scores (country_code, region_code);
create index if not exists pfs_corridor_idx on public.permit_friction_scores (corridor_slug);
create index if not exists pfs_band_idx on public.permit_friction_scores (friction_band, country_code);

-- ── Recruitment Priority Zones ─────────────────────────────────────────────
create table if not exists public.recruitment_priority_zones (
    id                  uuid primary key default gen_random_uuid(),
    country_code        text not null,
    region_code         text,
    corridor_slug       text,
    priority_rank       integer not null,
    reason              text not null,     -- critical_shortage, high_demand_low_supply, growth_market
    estimated_escorts_needed integer default 0,
    scarcity_score      numeric(8,4),
    demand_intensity    numeric(8,4),
    is_active           boolean default true,
    computed_at         timestamptz default now(),
    created_at          timestamptz default now()
);

create index if not exists rpz_country_idx on public.recruitment_priority_zones (country_code, priority_rank);

-- ── Crowdsourced Intelligence Events ───────────────────────────────────────
create table if not exists public.crowd_intel_events (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid,
    country_code        text not null,
    region_code         text,
    corridor_slug       text,
    event_type          text not null,     -- hazard, delay, closure, clearance, shortage, friction
    sub_type            text,              -- low_bridge, flood, construction, office_slowdown, etc.
    lat                 numeric(10,6),
    lng                 numeric(10,6),
    severity            text default 'medium',  -- low, medium, high, critical
    description         text,
    trust_weight        numeric(4,3) default 1.000,
    verified            boolean default false,
    suppressed          boolean default false,
    expires_at          timestamptz,
    created_at          timestamptz default now()
);

create index if not exists cie_country_idx on public.crowd_intel_events (country_code, created_at desc);
create index if not exists cie_type_idx on public.crowd_intel_events (event_type, country_code);
create index if not exists cie_geo_idx on public.crowd_intel_events (lat, lng);

-- ── Country Readiness Scores (executive dashboard) ─────────────────────────
create table if not exists public.country_readiness_scores (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null unique,
    tier                    text not null,         -- tier_a, tier_b, tier_c, home
    -- Coverage dimensions (0-100)
    escort_supply_density   integer default 0,
    permit_rule_coverage    integer default 0,
    bridge_clearance_data   integer default 0,
    corridor_risk_signals   integer default 0,
    project_cargo_presence  integer default 0,
    port_to_site_flows      integer default 0,
    payment_confidence      integer default 0,
    regulatory_mapping      integer default 0,
    crowd_signal_volume     integer default 0,
    -- Composite
    overall_readiness       integer default 0,
    monetization_readiness  integer default 0,
    data_thin_areas         text[],
    high_value_gaps         text[],
    recommended_sources     text[],
    -- Timestamps
    computed_at             timestamptz default now(),
    updated_at              timestamptz default now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.corridor_scarcity_scores enable row level security;
alter table public.permit_friction_scores enable row level security;
alter table public.recruitment_priority_zones enable row level security;
alter table public.crowd_intel_events enable row level security;
alter table public.country_readiness_scores enable row level security;

create policy css_read on public.corridor_scarcity_scores for select using (true);
create policy css_write on public.corridor_scarcity_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy pfs_read on public.permit_friction_scores for select using (true);
create policy pfs_write on public.permit_friction_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy rpz_read on public.recruitment_priority_zones for select using (true);
create policy rpz_write on public.recruitment_priority_zones for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy cie_read on public.crowd_intel_events for select using (auth.role() in ('authenticated', 'service_role'));
create policy cie_insert on public.crowd_intel_events for insert with check (auth.role() in ('authenticated', 'service_role'));
create policy crs_read on public.country_readiness_scores for select using (true);
create policy crs_write on public.country_readiness_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ── SEED: Country Readiness Baselines ──────────────────────────────────────
insert into public.country_readiness_scores
    (country_code, tier, escort_supply_density, permit_rule_coverage, bridge_clearance_data,
     corridor_risk_signals, project_cargo_presence, port_to_site_flows, payment_confidence,
     regulatory_mapping, crowd_signal_volume, overall_readiness, monetization_readiness,
     data_thin_areas, high_value_gaps, recommended_sources) values
('US', 'home',   85, 90, 70, 65, 80, 75, 95, 88, 60, 79, 90,
 '{"rural bridge clearances","crowd signal density"}', '{"county-level permit data"}',
 '{"FHWA bridge inventory","state DOT APIs"}'),
('CA', 'home',   72, 80, 55, 50, 70, 65, 90, 75, 40, 66, 82,
 '{"provincial permit portals","bridge data outside ON/AB"}', '{"francophone corridor data"}',
 '{"Transport Canada","provincial MTO portals"}'),
('AU', 'tier_a', 45, 60, 40, 35, 75, 50, 85, 55, 20, 52, 65,
 '{"remote corridor coverage","bridge/clearance outside NSW/VIC"}', '{"mining corridor permits","NHVR API"}',
 '{"NHVR portal","state road authorities","mining companies"}'),
('GB', 'tier_a', 50, 70, 60, 45, 55, 55, 90, 65, 25, 57, 70,
 '{"rural Wales/Scotland coverage"}', '{"abnormal load notification APIs"}',
 '{"Highways England","ESDAL system","DVSA"}'),
('NZ', 'tier_a', 30, 55, 35, 30, 40, 35, 85, 50, 10, 41, 50,
 '{"South Island corridors","bridge weight limits"}', '{"wind farm transport data"}',
 '{"NZTA","Waka Kotahi","regional councils"}'),
('SE', 'tier_b', 20, 45, 30, 25, 50, 30, 88, 40, 8, 37, 42,
 '{"rural Norrland coverage","winter road data"}', '{"wind turbine corridors"}',
 '{"Trafikverket","Swedish Transport Agency"}'),
('NO', 'tier_b', 18, 40, 25, 30, 55, 35, 88, 38, 5, 37, 40,
 '{"fjord crossing data","tunnel restrictions"}', '{"offshore/energy corridor data"}',
 '{"Statens vegvesen","Norwegian coastal admin"}'),
('AE', 'tier_b', 15, 35, 20, 15, 65, 45, 80, 30, 5, 35, 55,
 '{"inter-emirate data","free zone logistics"}', '{"mega project cargo flows"}',
 '{"RTA Dubai","Abu Dhabi DOT","Jebel Ali port"}'),
('SA', 'tier_c', 10, 25, 15, 10, 60, 30, 70, 20, 3, 27, 40,
 '{"most regions thin","NEOM/giga-project corridors"}', '{"giga-project logistics data"}',
 '{"Saudi MOT","NEOM logistics contacts","Aramco"}'),
('DE', 'tier_c', 25, 50, 45, 35, 50, 40, 92, 48, 12, 44, 55,
 '{"Bundesland variation","autobahn restriction data"}', '{"bridge engineering permits"}',
 '{"BASt","Bundesverkehrsministerium","VEMAGS portal"}'),
('ZA', 'tier_c', 12, 20, 15, 20, 45, 25, 55, 18, 5, 24, 30,
 '{"corridor security data","rural coverage"}', '{"mining corridor escorts","port-to-mine flows"}',
 '{"SANRAL","Chamber of Mines","Transnet"}')
on conflict (country_code) do nothing;
