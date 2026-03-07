-- 20260301_demand_intelligence_infrastructure.sql
-- Demand Intelligence: industry taxonomy, corridor demand signals, event-based spikes
-- Powers marketplace targeting, SEO programmatic pages, and AdGrid corridors

begin;

-- =========================
-- Industry Segment Taxonomy
-- =========================

create table if not exists public.industry_segments (
  id uuid primary key default gen_random_uuid(),
  segment_key text not null unique,           -- wind_turbine_blade_transport
  segment_label text not null,                -- Wind Turbine Blade Transport
  tier int not null default 3,                -- 1=elite, 2=high_value, 3=local, 4=hidden_gem, 5=gap_filler
  category text not null,                     -- energy_power|heavy_industrial|construction|oil_gas|etc
  category_label text not null,               -- Energy & Power Infrastructure
  payout_level text not null default 'moderate', -- extreme|very_high|high|moderate|low
  demand_frequency text not null default 'steady', -- very_high|high|steady|seasonal|sporadic
  competition_level text not null default 'moderate', -- very_low|low|moderate|high
  global_scalability text not null default 'good', -- excellent|good|regional|local
  description text,
  seo_keywords text[],                        -- keywords for programmatic pages
  created_at timestamptz not null default now()
);

create index if not exists ind_seg_tier_idx on public.industry_segments (tier);
create index if not exists ind_seg_category_idx on public.industry_segments (category);

-- =========================
-- Load Type Tags (links to load_requests.load_type_tags)
-- =========================

create table if not exists public.load_type_definitions (
  tag text primary key,                       -- superload|wide_load|wind_blade|transformer|etc
  label text not null,
  description text,
  typical_dimensions jsonb,                   -- {min_length, max_length, typical_weight_tons}
  typical_escort_count int default 1,
  typical_requirements text[],                -- [height_pole, route_survey, police, night_move]
  industry_segments text[],                   -- FK references to industry_segments.segment_key
  tier_weight int default 50,                 -- scoring weight boost for marketplace
  created_at timestamptz not null default now()
);

-- =========================
-- Corridor Demand Signals
-- =========================

create table if not exists public.corridor_demand_signals (
  id uuid primary key default gen_random_uuid(),
  corridor_id text not null,                  -- I-10_TX-FL | wind_corridor_midwest | etc
  corridor_label text not null,
  country_code text not null default 'US',
  origin_region text,                         -- state/province
  destination_region text,
  industry_segments text[],                   -- which segments drive this corridor
  demand_level text not null default 'moderate', -- extreme|high|moderate|low
  avg_monthly_loads int,
  avg_rate_usd numeric(10,2),
  surge_active boolean not null default false,
  surge_multiplier numeric(4,2) default 1.00,
  seasonality_pattern text,                   -- year_round|spring_fall|summer_peak|winter_peak
  last_signal_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists corr_demand_corridor_idx on public.corridor_demand_signals (corridor_id);
create index if not exists corr_demand_country_idx on public.corridor_demand_signals (country_code);
create index if not exists corr_demand_level_idx on public.corridor_demand_signals (demand_level);

-- =========================
-- Event-Based Demand Spikes
-- =========================

create table if not exists public.demand_spike_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,                   -- wind_farm_build|bridge_replacement|factory_build|port_expansion|pipeline|data_center
  event_label text not null,
  country_code text not null default 'US',
  region_code text,
  corridor_ids text[],                        -- affected corridors
  industry_segments text[],                   -- affected segments
  estimated_escort_demand int,
  estimated_duration_months int,
  start_date date,
  end_date date,
  source_url text,
  confidence_level text default 'medium',     -- high|medium|low|rumor
  status text not null default 'upcoming',    -- upcoming|active|completed|cancelled
  created_at timestamptz not null default now()
);

create index if not exists demand_spike_type_idx on public.demand_spike_events (event_type);
create index if not exists demand_spike_status_idx on public.demand_spike_events (status);
create index if not exists demand_spike_region_idx on public.demand_spike_events (region_code);

-- =========================
-- Broker / Shipper Profile Enrichment
-- =========================

create table if not exists public.broker_industry_profile (
  account_id uuid primary key,
  primary_segments text[],                    -- industry_segments they typically book
  secondary_segments text[],
  typical_load_types text[],                  -- load_type_definitions.tag
  avg_monthly_bookings int,
  avg_booking_value_usd numeric(10,2),
  preferred_corridors text[],
  booker_role text,                           -- project_manager|permit_coordinator|dispatcher|planner|forwarder
  last_booking_at timestamptz,
  updated_at timestamptz not null default now()
);

-- =========================
-- SEED: Industry Segments (from demand map)
-- =========================

insert into public.industry_segments (segment_key, segment_label, tier, category, category_label, payout_level, demand_frequency, competition_level, global_scalability, seo_keywords) values
-- TIER 1: Energy & Power
('wind_turbine_blade_transport', 'Wind Turbine Blade Transport', 1, 'energy_power', 'Energy & Power Infrastructure', 'very_high', 'high', 'moderate', 'excellent', array['wind turbine escort', 'blade transport pilot car', 'wind energy oversize load']),
('wind_farm_epc_contractors', 'Wind Farm EPC Contractors', 1, 'energy_power', 'Energy & Power Infrastructure', 'very_high', 'high', 'moderate', 'excellent', array['wind farm construction escort', 'epc pilot car']),
('power_transformer_transport', 'Power Transformer Transport', 1, 'energy_power', 'Energy & Power Infrastructure', 'very_high', 'high', 'moderate', 'excellent', array['transformer escort', 'power transformer pilot car', 'superload transformer']),
('substation_equipment_movers', 'Substation Equipment Movers', 1, 'energy_power', 'Energy & Power Infrastructure', 'very_high', 'high', 'moderate', 'excellent', array['substation escort', 'utility oversize load']),
('solar_farm_developers', 'Solar Farm Developers (Utility Scale)', 1, 'energy_power', 'Energy & Power Infrastructure', 'high', 'high', 'moderate', 'excellent', array['solar farm escort', 'solar panel transport']),
('nuclear_plant_component_movers', 'Nuclear Plant Component Movers', 1, 'energy_power', 'Energy & Power Infrastructure', 'very_high', 'steady', 'low', 'good', array['nuclear transport escort', 'reactor component pilot car']),

-- TIER 1: Heavy Industrial
('steel_mill_equipment_movers', 'Steel Mill Equipment Movers', 1, 'heavy_industrial', 'Heavy Industrial & Manufacturing', 'very_high', 'high', 'moderate', 'excellent', array['steel mill escort', 'industrial equipment pilot car']),
('mining_equipment_transport', 'Mining Equipment Transport', 1, 'heavy_industrial', 'Heavy Industrial & Manufacturing', 'very_high', 'high', 'moderate', 'excellent', array['mining equipment escort', 'excavator transport pilot car']),
('refinery_equipment_movers', 'Refinery Equipment Movers', 1, 'heavy_industrial', 'Heavy Industrial & Manufacturing', 'very_high', 'high', 'moderate', 'excellent', array['refinery escort', 'petrochemical pilot car']),
('factory_relocation_companies', 'Factory Relocation Companies', 1, 'heavy_industrial', 'Heavy Industrial & Manufacturing', 'high', 'steady', 'moderate', 'excellent', array['factory move escort', 'plant relocation pilot car']),

-- TIER 1: Specialized Heavy Haul
('heavy_haul_trucking_companies', 'Heavy Haul Trucking Companies', 1, 'heavy_haul', 'Specialized Heavy Haul Carriers', 'high', 'very_high', 'moderate', 'excellent', array['heavy haul escort', 'oversize load pilot car', 'wide load escort']),
('superload_carriers', 'Superload Carriers', 1, 'heavy_haul', 'Specialized Heavy Haul Carriers', 'very_high', 'high', 'moderate', 'excellent', array['superload escort', 'superload pilot car']),
('project_cargo_carriers', 'Project Cargo Carriers', 1, 'heavy_haul', 'Specialized Heavy Haul Carriers', 'very_high', 'high', 'low', 'excellent', array['project cargo escort', 'project freight pilot car']),
('permit_service_companies', 'Permit Service Companies', 1, 'heavy_haul', 'Specialized Heavy Haul Carriers', 'high', 'very_high', 'moderate', 'excellent', array['permit service', 'oversize load permits']),

-- TIER 2: Construction
('bridge_beam_transport', 'Bridge Beam Transport', 2, 'construction', 'Construction & Infrastructure', 'high', 'steady', 'moderate', 'good', array['bridge beam escort', 'girder transport pilot car']),
('precast_concrete_companies', 'Precast Concrete Companies', 2, 'construction', 'Construction & Infrastructure', 'high', 'steady', 'moderate', 'good', array['precast concrete escort', 'concrete beam pilot car']),
('crane_rental_companies', 'Crane Rental Companies', 2, 'construction', 'Construction & Infrastructure', 'high', 'high', 'moderate', 'good', array['crane transport escort', 'mobile crane pilot car']),

-- TIER 2: Oil & Gas
('oilfield_service_companies', 'Oilfield Service Companies', 2, 'oil_gas', 'Oil, Gas & Energy Field', 'very_high', 'high', 'moderate', 'excellent', array['oilfield escort', 'drilling rig pilot car']),
('pipeline_contractors', 'Pipeline Contractors', 2, 'oil_gas', 'Oil, Gas & Energy Field', 'very_high', 'high', 'moderate', 'excellent', array['pipeline escort', 'pipeline equipment pilot car']),

-- TIER 2: Project Cargo (Hidden Gold)
('project_logistics_firms', 'Project Logistics Firms', 2, 'project_cargo', 'Project Cargo & Freight Forwarders', 'very_high', 'steady', 'low', 'excellent', array['project logistics escort', 'project freight pilot car']),
('heavy_freight_forwarders', 'Heavy Freight Forwarders', 2, 'project_cargo', 'Project Cargo & Freight Forwarders', 'very_high', 'steady', 'low', 'excellent', array['freight forwarder escort', 'heavy freight pilot car']),
('breakbulk_specialists', 'Breakbulk Specialists', 2, 'project_cargo', 'Project Cargo & Freight Forwarders', 'very_high', 'steady', 'very_low', 'excellent', array['breakbulk escort', 'out of gauge pilot car']),

-- TIER 3: Agriculture
('combine_harvester_transport', 'Combine Harvester Transport', 3, 'agriculture', 'Agriculture & Rural Equipment', 'moderate', 'seasonal', 'moderate', 'good', array['combine transport escort', 'farm equipment pilot car']),

-- TIER 3: Modular Housing
('mobile_home_transport', 'Mobile Home Transport', 3, 'modular_housing', 'Manufactured Housing & Modular', 'moderate', 'very_high', 'moderate', 'good', array['mobile home escort', 'manufactured home pilot car', 'wide load house mover']),

-- TIER 4: Marine
('yacht_transport_companies', 'Yacht Transport Companies', 4, 'marine', 'Marine & Yacht Transport', 'high', 'steady', 'low', 'regional', array['yacht escort', 'boat transport pilot car']),

-- TIER 4: Aerospace
('aircraft_fuselage_transport', 'Aircraft Fuselage Transport', 4, 'aerospace', 'Aerospace & Defense', 'extreme', 'sporadic', 'very_low', 'regional', array['aircraft escort', 'aerospace transport pilot car']),
('rocket_component_movers', 'Rocket Component Movers', 4, 'aerospace', 'Aerospace & Defense', 'extreme', 'sporadic', 'very_low', 'regional', array['rocket transport escort', 'space hardware pilot car'])

on conflict (segment_key) do nothing;

-- =========================
-- SEED: Load Type Definitions
-- =========================

insert into public.load_type_definitions (tag, label, description, typical_escort_count, typical_requirements, industry_segments) values
('superload', 'Superload', 'Extremely heavy or wide loads requiring special permits', 3, array['route_survey','police','height_pole'], array['superload_carriers','power_transformer_transport']),
('wide_load', 'Wide Load', 'Loads exceeding standard width limits', 2, array['height_pole'], array['heavy_haul_trucking_companies','mobile_home_transport']),
('wind_blade', 'Wind Turbine Blade', 'Wind turbine blade transport (extreme length)', 2, array['route_survey','height_pole'], array['wind_turbine_blade_transport','wind_farm_epc_contractors']),
('transformer', 'Power Transformer', 'Large utility transformers', 3, array['route_survey','police','night_move'], array['power_transformer_transport','substation_equipment_movers']),
('oversize', 'Oversize Load', 'General oversize loads exceeding standard dimensions', 1, array['height_pole'], array['heavy_haul_trucking_companies']),
('overweight', 'Overweight Load', 'Loads exceeding standard weight limits', 1, array[], array['heavy_haul_trucking_companies']),
('bridge_beam', 'Bridge Beam / Girder', 'Precast bridge beams and girders', 2, array['route_survey'], array['bridge_beam_transport','precast_concrete_companies']),
('mobile_home', 'Mobile / Modular Home', 'Manufactured or modular home transport', 1, array[], array['mobile_home_transport']),
('crane', 'Crane Transport', 'Mobile or crawler crane transport', 2, array['height_pole'], array['crane_rental_companies']),
('drilling_rig', 'Drilling Rig', 'Oil/gas drilling rig transport', 2, array['route_survey'], array['oilfield_service_companies']),
('yacht', 'Yacht / Large Vessel', 'Overland yacht or large boat transport', 1, array['height_pole'], array['yacht_transport_companies']),
('aircraft', 'Aircraft Component', 'Fuselage, wing, or aerospace component', 3, array['route_survey','police','night_move'], array['aircraft_fuselage_transport']),
('farm_equipment', 'Farm Equipment', 'Combine, tractor, or large agriculture equipment', 1, array[], array['combine_harvester_transport']),
('general_heavy', 'General Heavy Haul', 'General heavy or oversized freight', 1, array[], array['heavy_haul_trucking_companies']),
('project_cargo', 'Project Cargo', 'Large-scale project freight', 2, array['route_survey'], array['project_logistics_firms','heavy_freight_forwarders'])
on conflict (tag) do nothing;

-- =========================
-- RLS
-- =========================

alter table public.industry_segments enable row level security;
alter table public.load_type_definitions enable row level security;
alter table public.corridor_demand_signals enable row level security;
alter table public.demand_spike_events enable row level security;
alter table public.broker_industry_profile enable row level security;

commit;
