-- 20260301_regional_demand_scoring_and_prospects_v2.sql
-- Regional demand scoring (county + country level), predictive model inputs,
-- and Tier S prospect seeding (expanded list)

begin;

-- =========================
-- Regional Demand Scores (county/region level)
-- =========================

create table if not exists public.regional_demand_scores (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  region_code text not null,                      -- state/province
  sub_region text,                                -- county/parish/district
  demand_score int not null default 50,           -- 0-100
  demand_tier text not null default 'B',          -- S|A|B|C
  scoring_inputs jsonb not null default '{}',     -- {industrial_density, energy_projects, ...}
  primary_drivers text[],                         -- ['petrochemical','port','energy']
  notes text,
  computed_at timestamptz not null default now(),
  constraint regional_demand_unique unique (country_code, region_code, sub_region)
);

create index if not exists reg_demand_country_idx on public.regional_demand_scores (country_code);
create index if not exists reg_demand_score_idx on public.regional_demand_scores (demand_score desc);
create index if not exists reg_demand_tier_idx on public.regional_demand_scores (demand_tier);

-- =========================
-- Country Demand Index
-- =========================

create table if not exists public.country_demand_index (
  country_code text primary key,
  demand_score int not null default 50,
  demand_tier text not null default 'B',
  notes text,
  updated_at timestamptz not null default now()
);

-- =========================
-- SEED: Country Demand Index (all 25 countries)
-- =========================

insert into public.country_demand_index (country_code, demand_score, demand_tier, notes) values
('US', 100, 'S', 'Largest oversize market globally'),
('CA', 94, 'S', 'Energy + mining corridors'),
('AU', 93, 'S', 'Mining + wind, Pilbara corridor'),
('DE', 90, 'S', 'Heavy industry, EU hub'),
('NL', 89, 'S', 'EU port gateway, Rotterdam'),
('AE', 88, 'S', 'Mega projects, extreme money'),
('SA', 87, 'S', 'Oil + NEOM mega projects'),
('GB', 84, 'A', 'Offshore wind + industry'),
('BR', 82, 'A', 'Mining + wind northeast'),
('IN', 80, 'A', 'Gujarat industrial + wind'),
('MX', 79, 'A', 'Manufacturing + energy'),
('PL', 77, 'A', 'EU manufacturing expansion'),
('ES', 76, 'A', 'Wind energy + infrastructure'),
('IT', 75, 'A', 'Heavy industry + ports'),
('NO', 72, 'B', 'Offshore energy'),
('SE', 71, 'B', 'Wind + mining'),
('ZA', 69, 'B', 'Mining corridors'),
('CL', 68, 'B', 'Mining + ports'),
('JP', 67, 'B', 'Infrastructure projects'),
('KR', 66, 'B', 'Shipbuilding + industry'),
('SG', 65, 'B', 'Project cargo hub'),
('TH', 63, 'B', 'Manufacturing growth'),
('VN', 61, 'B', 'Emerging manufacturing'),
('NZ', 60, 'B', 'Small but active'),
('IE', 58, 'B', 'Wind energy growth')
on conflict (country_code) do update set
  demand_score = excluded.demand_score,
  demand_tier = excluded.demand_tier,
  notes = excluded.notes,
  updated_at = now();

-- =========================
-- SEED: US County Demand Scores (Tier S + A)
-- =========================

insert into public.regional_demand_scores (country_code, region_code, sub_region, demand_score, demand_tier, primary_drivers) values
-- TIER S (90-100)
('US', 'TX', 'Harris County', 96, 'S', array['petrochemical','port','energy']),
('US', 'TX', 'Midland County', 95, 'S', array['oil_basin','superloads']),
('US', 'TX', 'Ector County', 94, 'S', array['permian_basin']),
('US', 'TX', 'Jefferson County', 93, 'S', array['refineries']),
('US', 'LA', 'Calcasieu Parish', 92, 'S', array['lng','petrochemical']),
('US', 'OK', 'Tulsa County', 90, 'S', array['energy','fabrication']),
('US', 'PA', 'Allegheny County', 90, 'S', array['heavy_industry']),
('US', 'IN', 'Lake County', 89, 'A', array['steel_corridor']),
('US', 'OH', 'Cuyahoga County', 88, 'A', array['manufacturing']),
('US', 'IL', 'Cook County', 88, 'A', array['freight_hub']),
-- TIER A (75-89)
('US', 'FL', 'Polk County', 84, 'A', array['logistics','housing']),
('US', 'FL', 'Hillsborough County', 83, 'A', array['port','growth']),
('US', 'GA', 'Chatham County', 82, 'A', array['port_savannah']),
('US', 'GA', 'Fulton County', 80, 'A', array['freight_hub']),
('US', 'NC', 'Mecklenburg County', 79, 'A', array['manufacturing']),
('US', 'TN', 'Shelby County', 78, 'A', array['memphis_freight']),
('US', 'AL', 'Mobile County', 78, 'A', array['port_activity']),
('US', 'MI', 'Wayne County', 77, 'A', array['auto_industry']),
('US', 'KY', 'Jefferson County', 76, 'A', array['freight_hub']),
('US', 'WA', 'Pierce County', 75, 'A', array['port_overflow'])
on conflict (country_code, region_code, sub_region) do update set
  demand_score = excluded.demand_score,
  demand_tier = excluded.demand_tier,
  primary_drivers = excluded.primary_drivers,
  computed_at = now();

-- =========================
-- SEED: Additional Tier S Prospects (expanded)
-- =========================

insert into public.prospects (company_name, country_code, prospect_tier, category, industry_segment, lead_score) values
-- US Heavy Haul (daily escort users)
('Landstar Heavy Haul Services', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 90),
('ATS Specialized', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 90),
('Keen Transport', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 88),
('Daseke Specialized', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 88),
('Mercer Transportation', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 86),
('TMC Heavy Haul', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 86),
('Anderson Trucking Service', 'US', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 87),
-- US Project Cargo & Wind
('Mammoet USA', 'US', 'S', 'project_cargo', 'superload_carriers', 95),
('Sarens USA', 'US', 'S', 'project_cargo', 'superload_carriers', 95),
('Barnhart Crane & Rigging', 'US', 'S', 'crane', 'crane_rental_companies', 88),
('Fagioli Inc', 'US', 'S', 'project_cargo', 'superload_carriers', 90),
('Bigge Crane & Rigging', 'US', 'S', 'crane', 'crane_rental_companies', 87),
('Blattner Energy', 'US', 'S', 'energy', 'wind_farm_epc_contractors', 95),
('Mortenson', 'US', 'S', 'energy', 'wind_farm_epc_contractors', 94),
-- Canada (expanded)
('Sarens Canada', 'CA', 'S', 'project_cargo', 'superload_carriers', 93),
('Entrec Corporation', 'CA', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 88),
('Ledcor Heavy Transport', 'CA', 'S', 'heavy_haul', 'heavy_haul_trucking_companies', 86),
-- Australia (expanded)
('Sarens Australia', 'AU', 'S', 'project_cargo', 'superload_carriers', 93),
('Monadelphous', 'AU', 'S', 'energy', 'wind_farm_epc_contractors', 90),
-- UK (expanded)
('ALE Heavy Lift', 'GB', 'A', 'heavy_haul', 'superload_carriers', 85),
('Allelys Heavy Haulage', 'GB', 'A', 'heavy_haul', 'heavy_haul_trucking_companies', 83),
('Flegg Projects', 'GB', 'A', 'heavy_haul', 'heavy_haul_trucking_companies', 80),
-- UAE (expanded)
('ADNOC Logistics', 'AE', 'S', 'energy', 'oilfield_service_companies', 92),
('Lamprell Energy', 'AE', 'S', 'energy', 'oilfield_service_companies', 88),
-- Saudi (expanded)
('Nesma Logistics', 'SA', 'A', 'project_cargo', 'project_logistics_firms', 85),
-- Germany (expanded)
('Sarens Germany', 'DE', 'S', 'project_cargo', 'superload_carriers', 90),
-- India (expanded)
('L&T Heavy Engineering', 'IN', 'A', 'heavy_haul', 'steel_mill_equipment_movers', 82),
-- Brazil (expanded)
('Mammoet Brazil', 'BR', 'A', 'project_cargo', 'superload_carriers', 85),
('Ultracargo', 'BR', 'A', 'project_cargo', 'project_logistics_firms', 80),
-- Mexico (expanded)
('Sarens Mexico', 'MX', 'A', 'project_cargo', 'superload_carriers', 82),
('TUM Heavy Division', 'MX', 'A', 'heavy_haul', 'heavy_haul_trucking_companies', 78)
on conflict do nothing;

-- =========================
-- RLS
-- =========================

alter table public.regional_demand_scores enable row level security;
alter table public.country_demand_index enable row level security;

commit;
