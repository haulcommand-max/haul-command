-- 20260301_prospect_pipeline_and_corridor_seeding.sql
-- Prospect pipeline (CRM), lead scoring, and corridor demand seeding
-- Powers outreach tracking, conversion analytics, and corridor intelligence

begin;

-- =========================
-- Prospect Pipeline (Lightweight CRM)
-- =========================

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  country_code text not null,
  prospect_tier text not null default 'B',     -- S|A|B|C
  industry_segment text,                       -- FK to industry_segments.segment_key
  category text,                               -- heavy_haul|project_cargo|energy|etc
  contact_name text,
  contact_title text,
  contact_email text,
  contact_phone text,
  linkedin_url text,
  website_url text,
  lead_score int not null default 50,          -- 0-100
  lead_status text not null default 'new',     -- new|contacted|responded|qualified|converted|lost
  notes text,
  last_contacted_at timestamptz,
  converted_account_id uuid,                   -- links to account if converted
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospect_country_idx on public.prospects (country_code);
create index if not exists prospect_tier_idx on public.prospects (prospect_tier);
create index if not exists prospect_status_idx on public.prospects (lead_status);
create index if not exists prospect_score_idx on public.prospects (lead_score desc);
create index if not exists prospect_segment_idx on public.prospects (industry_segment);

-- =========================
-- Prospect Activity Log
-- =========================

create table if not exists public.prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id),
  activity_type text not null,                  -- email_sent|call|linkedin_message|demo_scheduled|proposal_sent|signup|conversion
  notes text,
  performed_by text,
  created_at timestamptz not null default now()
);

create index if not exists prospect_act_prospect_idx on public.prospect_activities (prospect_id);
create index if not exists prospect_act_type_idx on public.prospect_activities (activity_type);

-- =========================
-- SEED: Top Global Prospects
-- =========================

insert into public.prospects (company_name, country_code, prospect_tier, category, industry_segment) values
-- US Tier S
('Bennett International Group', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Total Quality Logistics', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('MGA International', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Heavy Haulers', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Trans Global Projects', 'US', 'S', 'project_cargo', 'project_logistics_firms'),
('Martin Bencher Group', 'US', 'S', 'project_cargo', 'breakbulk_specialists'),
('VARAMAR', 'US', 'S', 'project_cargo', 'breakbulk_specialists'),

-- Canada Tier S
('Vectra Heavy Haulers', 'CA', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('DFS Projects', 'CA', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Bridging Distances', 'CA', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),

-- UK Tier A
('Collett & Sons', 'GB', 'A', 'heavy_haul', 'heavy_haul_trucking_companies'),

-- Australia Tier S
('Toll Group', 'AU', 'S', 'project_cargo', 'project_logistics_firms'),
('Mammoet Australia', 'AU', 'S', 'heavy_haul', 'superload_carriers'),
('Qube Heavy Logistics', 'AU', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Lindsay Transport', 'AU', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),

-- Germany Tier S
('Mammoet Europe', 'DE', 'S', 'heavy_haul', 'superload_carriers'),
('Kübler Spedition', 'DE', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Bohnet GmbH', 'DE', 'A', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Schmidbauer GmbH', 'DE', 'A', 'heavy_haul', 'crane_rental_companies'),

-- Netherlands Tier S
('Mammoet', 'NL', 'S', 'heavy_haul', 'superload_carriers'),
('Van der Vlist', 'NL', 'S', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Wagenborg Nedlift', 'NL', 'A', 'heavy_haul', 'superload_carriers'),
('Broekman Logistics', 'NL', 'A', 'project_cargo', 'project_logistics_firms'),

-- UAE Tier S (EXTREME MONEY)
('Sarens Gulf', 'AE', 'S', 'heavy_haul', 'superload_carriers'),
('Al Faris Group', 'AE', 'S', 'heavy_haul', 'crane_rental_companies'),
('Mammoet Middle East', 'AE', 'S', 'heavy_haul', 'superload_carriers'),
('Abu Dhabi Ports', 'AE', 'S', 'project_cargo', 'project_logistics_firms'),

-- Saudi Arabia Tier A
('Bahri Logistics', 'SA', 'A', 'project_cargo', 'heavy_freight_forwarders'),
('Saudi Mammoet', 'SA', 'A', 'heavy_haul', 'superload_carriers'),
('HeavyLift Arabia', 'SA', 'A', 'heavy_haul', 'superload_carriers'),

-- India Tier A
('Allcargo Logistics', 'IN', 'A', 'project_cargo', 'project_logistics_firms'),
('Gati Project Logistics', 'IN', 'A', 'project_cargo', 'project_logistics_firms'),
('Mammoet India', 'IN', 'A', 'heavy_haul', 'superload_carriers'),

-- Brazil Tier A
('Sarens Brazil', 'BR', 'A', 'heavy_haul', 'superload_carriers'),
('Wilson Sons Heavy Transport', 'BR', 'A', 'heavy_haul', 'heavy_haul_trucking_companies'),

-- Mexico Tier A
('Transportes Marva', 'MX', 'A', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Grupo Traxion', 'MX', 'A', 'heavy_haul', 'heavy_haul_trucking_companies'),
('Mammoet Mexico', 'MX', 'A', 'heavy_haul', 'superload_carriers'),

-- South Africa Tier B
('Mammoet South Africa', 'ZA', 'A', 'heavy_haul', 'superload_carriers'),
('Grindrod Logistics', 'ZA', 'B', 'project_cargo', 'project_logistics_firms'),

-- France Tier A
('Daher Logistics', 'FR', 'A', 'project_cargo', 'project_logistics_firms'),
('Sarens France', 'FR', 'A', 'heavy_haul', 'superload_carriers'),

-- Spain Tier A
('Mammoet Spain', 'ES', 'A', 'heavy_haul', 'superload_carriers'),

-- Italy Tier A
('Fagioli', 'IT', 'A', 'heavy_haul', 'superload_carriers'),
('Codognotto', 'IT', 'A', 'heavy_haul', 'heavy_haul_trucking_companies'),

-- Japan Tier A
('Nippon Express', 'JP', 'A', 'project_cargo', 'heavy_freight_forwarders'),

-- South Korea Tier A
('Hyundai Glovis', 'KR', 'A', 'project_cargo', 'heavy_freight_forwarders'),
('CJ Logistics', 'KR', 'A', 'project_cargo', 'heavy_freight_forwarders'),

-- Singapore Tier A
('AAL Shipping', 'SG', 'A', 'project_cargo', 'breakbulk_specialists'),
('PSA Logistics', 'SG', 'A', 'project_cargo', 'project_logistics_firms'),
('YCH Group', 'SG', 'A', 'project_cargo', 'project_logistics_firms')

on conflict do nothing;

-- =========================
-- SEED: Global Money Corridors
-- =========================

insert into public.corridor_demand_signals
  (corridor_id, corridor_label, country_code, origin_region, destination_region, industry_segments, demand_level, seasonality_pattern, updated_at)
values
-- US corridors
('us_tx_oil_basin', 'Texas Oil Basin', 'US', 'TX', null, array['oilfield_service_companies','pipeline_contractors'], 'extreme', 'year_round', now()),
('us_midwest_wind', 'Midwest Wind Corridor', 'US', 'IA', 'TX', array['wind_turbine_blade_transport','wind_farm_epc_contractors'], 'extreme', 'spring_fall', now()),
('us_gulf_petrochem', 'Gulf Coast Petrochemical Belt', 'US', 'TX', 'LA', array['refinery_equipment_movers','pipeline_contractors'], 'high', 'year_round', now()),
('us_great_lakes_mfg', 'Great Lakes Manufacturing Belt', 'US', 'OH', 'MI', array['steel_mill_equipment_movers','factory_relocation_companies'], 'high', 'year_round', now()),
('us_se_modular', 'Southeast Modular Housing Belt', 'US', 'GA', 'FL', array['mobile_home_transport'], 'high', 'year_round', now()),
('us_ne_wind', 'Northeast Wind Corridor', 'US', 'NY', 'MA', array['wind_turbine_blade_transport'], 'moderate', 'spring_fall', now()),
('us_ca_solar', 'California Solar Belt', 'US', 'CA', null, array['solar_farm_developers'], 'high', 'year_round', now()),

-- Canada corridors
('ca_ab_oilsands', 'Alberta Oil Sands Corridor', 'CA', 'AB', null, array['oilfield_service_companies','mining_equipment_transport'], 'extreme', 'year_round', now()),
('ca_on_mfg', 'Ontario Manufacturing Belt', 'CA', 'ON', null, array['steel_mill_equipment_movers','factory_relocation_companies'], 'high', 'year_round', now()),
('ca_bc_port', 'BC Port → Inland Corridor', 'CA', 'BC', 'AB', array['project_logistics_firms','heavy_freight_forwarders'], 'high', 'year_round', now()),

-- Australia corridors
('au_pilbara_mining', 'Pilbara Mining Corridor', 'AU', 'WA', null, array['mining_equipment_transport'], 'extreme', 'year_round', now()),
('au_qld_wind', 'Queensland Wind Corridor', 'AU', 'QLD', null, array['wind_turbine_blade_transport'], 'high', 'spring_fall', now()),
('au_port_hedland', 'Port Hedland Routes', 'AU', 'WA', null, array['mining_equipment_transport','heavy_haul_trucking_companies'], 'extreme', 'year_round', now()),

-- Europe corridors
('eu_north_sea_wind', 'North Sea Wind Corridor', 'NL', null, null, array['wind_turbine_blade_transport','wind_farm_epc_contractors'], 'extreme', 'spring_fall', now()),
('eu_ruhr_industrial', 'Ruhr Industrial Belt', 'DE', null, null, array['steel_mill_equipment_movers','refinery_equipment_movers'], 'high', 'year_round', now()),
('eu_rotterdam_inland', 'Rotterdam → Inland EU Routes', 'NL', null, null, array['project_logistics_firms','breakbulk_specialists'], 'extreme', 'year_round', now()),

-- Middle East corridors
('ae_neom_project', 'NEOM Project Corridors', 'SA', null, null, array['project_logistics_firms','superload_carriers'], 'extreme', 'year_round', now()),
('ae_abudhabi_energy', 'Abu Dhabi Energy Belt', 'AE', null, null, array['oilfield_service_companies','power_transformer_transport'], 'extreme', 'year_round', now()),
('sa_oil_corridors', 'Saudi Oil Corridors', 'SA', null, null, array['oilfield_service_companies','pipeline_contractors'], 'extreme', 'year_round', now()),

-- Brazil corridors
('br_minas_mining', 'Minas Gerais Mining Routes', 'BR', null, null, array['mining_equipment_transport'], 'high', 'year_round', now()),
('br_santos_port', 'Santos Port Corridors', 'BR', null, null, array['project_logistics_firms','heavy_freight_forwarders'], 'high', 'year_round', now()),
('br_ne_wind', 'Northeast Brazil Wind', 'BR', null, null, array['wind_turbine_blade_transport'], 'high', 'spring_fall', now()),

-- India corridors
('in_gujarat_industrial', 'Gujarat Industrial Belt', 'IN', null, null, array['refinery_equipment_movers','factory_relocation_companies'], 'high', 'year_round', now()),
('in_tn_wind', 'Tamil Nadu Wind Corridor', 'IN', null, null, array['wind_turbine_blade_transport'], 'high', 'year_round', now()),
('in_mh_mfg', 'Maharashtra Manufacturing Zone', 'IN', null, null, array['steel_mill_equipment_movers','heavy_haul_trucking_companies'], 'high', 'year_round', now())

on conflict do nothing;

-- =========================
-- RLS
-- =========================

alter table public.prospects enable row level security;
alter table public.prospect_activities enable row level security;

commit;
