-- Haul Command Corridor OS — U.S.-First Seed
-- Migration: 20260404_002_corridor_seed_us.sql
-- Depends on: 20260404_001_corridor_os.sql
-- Strategy: INSERT ... ON CONFLICT DO NOTHING (idempotent)
-- Coverage: 20 high-value U.S. corridors (flagship + national tier)

begin;

-- ── Credential types ────────────────────────────────────────────────────────

insert into public.hc_credential_types
  (slug, name, short_name, country_code, credential_family, issuing_authority, renewal_period_days)
values
  ('twic','Transportation Worker Identification Credential','TWIC','US','port_access','TSA / CBP',1825),
  ('naec-pevo','NAEC Pilot/Escort Vehicle Operator','PEVO','US','pilot_operator','NAEC',730),
  ('hazmat-endorsement','Hazardous Materials CDL Endorsement','HazMat','US','hazmat','FMCSA',1825),
  ('oversize-flagperson','Oversize Load Flagperson Certification','Flagperson','US','safety','State DOT',365),
  ('police-coordination','Law Enforcement Escort Coordination','LE Coord','US','police_coordination','State LEA',null),
  ('energy-site-access','Energy Facility Site Access Credential','Energy Access','US','energy_site','Site Operator',365),
  ('route-survey-cert','Route Survey Certification','Route Survey','US','route_survey','NATSO / State',730)
on conflict (slug) do nothing;

-- ── Helper: insert corridor + initial scoring placeholder ───────────────────
-- All scores start at 0; hc_score_all_corridors() will compute them after seed.

insert into public.hc_corridors (
  corridor_code, slug, name, short_name,
  status, corridor_type, tier, country_code,
  origin_country_code, origin_region_code, origin_city_name,
  destination_country_code, destination_region_code, destination_city_name,
  is_cross_border, distance_miles, typical_mode,
  search_volume_estimate, commercial_value_estimate
) values

-- ── Flagship: I-10 Southern (CA → FL)
('US_SANTAMONICACA_JACKSONVILLEFL',
 'i-10-southern-ca-fl',
 'I-10 Southern Corridor — Los Angeles to Jacksonville',
 'I-10 Southern',
 'active','country_spine','flagship','US',
 'US','CA','Los Angeles','US','FL','Jacksonville',
 false, 2460,
 'road', 22000, 4800000),

-- ── Flagship: I-95 Atlantic (FL → ME)
('US_MIAMFL_CALAISME',
 'i-95-atlantic-fl-me',
 'I-95 Atlantic Corridor — Miami to Maine Border',
 'I-95 Atlantic',
 'active','country_spine','flagship','US',
 'US','FL','Miami','US','ME','Calais',
 false, 1920,
 'road', 18500, 3900000),

-- ── Flagship: I-35 Central / NAFTA (Laredo → Minneapolis)
('US_LAREDOTX_MINNEAPOLISMN',
 'i-35-central-tx-mn',
 'I-35 NAFTA Corridor — Laredo to Minneapolis',
 'I-35 Central',
 'active','country_spine','flagship','US',
 'US','TX','Laredo','US','MN','Minneapolis',
 false, 1568,
 'road', 15200, 3200000),

-- ── Flagship: I-5 West Coast (San Diego → Seattle)
('US_SANDIEGOCA_SEATTLEWA',
 'i-5-west-coast-ca-wa',
 'I-5 West Coast Corridor — San Diego to Seattle',
 'I-5 West Coast',
 'active','country_spine','flagship','US',
 'US','CA','San Diego','US','WA','Seattle',
 false, 1381,
 'road', 14800, 3100000),

-- ── Flagship: I-75 Southeast (Detroit → Miami)
('US_DETROITMI_MIAMFL',
 'i-75-southeast-mi-fl',
 'I-75 Southeast Corridor — Detroit to Miami',
 'I-75 Southeast',
 'active','country_spine','flagship','US',
 'US','MI','Detroit','US','FL','Miami',
 false, 1430,
 'road', 13600, 2900000),

-- ── National: Houston Ship Channel / Port of Houston corridors
('US_PORTHOUSTONTTX_BEAUMONTTX',
 'port-houston-beaumont-tx',
 'Port of Houston to Beaumont Refinery Corridor',
 'Houston–Beaumont',
 'active','port_connector','national','US',
 'US','TX','Houston','US','TX','Beaumont',
 false, 85,
 'road', 9800, 1850000),

-- ── National: Port of Savannah to Atlanta
('US_PORTOFAVSANNAH_ATLANTAGA',
 'port-savannah-to-atlanta-ga',
 'Port of Savannah to Atlanta Distribution Corridor',
 'Savannah–Atlanta',
 'active','port_connector','national','US',
 'US','GA','Savannah','US','GA','Atlanta',
 false, 252,
 'road', 8700, 1650000),

-- ── National: Port of LA/LB to Phoenix
('US_PORTLALBCA_PHOENIXAZ',
 'port-la-lb-to-phoenix-az',
 'Port of LA/Long Beach to Phoenix Corridor',
 'LA Ports–Phoenix',
 'active','port_connector','national','US',
 'US','CA','Los Angeles','US','AZ','Phoenix',
 false, 372,
 'road', 8400, 1600000),

-- ── National: I-20 Permian Basin (Midland → Fort Worth)
('US_MIDLANDTX_FORTWORTHTX',
 'i-20-permian-basin-tx',
 'I-20 Permian Basin Corridor — Midland/Odessa to Fort Worth',
 'Permian Basin Corridor',
 'active','industrial_connector','national','US',
 'US','TX','Midland','US','TX','Fort Worth',
 false, 305,
 'road', 9100, 2200000),

-- ── National: I-65 Auto Alley (Detroit → Mobile)
('US_DETROITMI_MOBILEAL',
 'i-65-auto-alley-mi-al',
 'I-65 Auto Alley Corridor — Detroit to Mobile',
 'Auto Alley I-65',
 'active','industrial_connector','national','US',
 'US','MI','Detroit','US','AL','Mobile',
 false, 1060,
 'road', 7200, 1400000),

-- ── National: Gulf Coast Petrochemical (Lake Charles → Corpus Christi)
('US_LAKECHARLESLA_CORPUSCHRISTITX',
 'gulf-coast-petrochem-la-tx',
 'Gulf Coast Petrochemical Corridor — Lake Charles to Corpus Christi',
 'Gulf Coast Petrochem',
 'active','industrial_connector','national','US',
 'US','LA','Lake Charles','US','TX','Corpus Christi',
 false, 385,
 'road', 8800, 2400000),

-- ── National: I-70 Midwest Spine (St. Louis → Denver)
('US_STLOUISMO_DENVERCL',
 'i-70-midwest-st-louis-denver',
 'I-70 Midwest Spine — St. Louis to Denver',
 'I-70 Midwest',
 'active','country_spine','national','US',
 'US','MO','St. Louis','US','CO','Denver',
 false, 857,
 'road', 6400, 1100000),

-- ── National: Wind Energy Corridor (Sweetwater TX → Kansas City)
('US_SWEETWATERTX_KANSASCITYMO',
 'wind-energy-tx-to-kc',
 'Wind Energy Transport Corridor — West Texas to Kansas City',
 'Wind Energy TX–KC',
 'active','industrial_connector','national','US',
 'US','TX','Sweetwater','US','MO','Kansas City',
 false, 660,
 'road', 7600, 1950000),

-- ── National: Port of New Orleans to Memphis
('US_PORTNEWorleans_MEMPHISTN',
 'port-new-orleans-to-memphis-tn',
 'Port of New Orleans to Memphis Distribution Corridor',
 'NOLA–Memphis',
 'active','port_connector','national','US',
 'US','LA','New Orleans','US','TN','Memphis',
 false, 395,
 'road', 6200, 1050000),

-- ── National: Port of Virginia to Charlotte
('US_PORTOFVIRGINIA_CHARLOTTENC',
 'port-virginia-to-charlotte-nc',
 'Port of Virginia to Charlotte Distribution Corridor',
 'Port Virginia–Charlotte',
 'active','port_connector','national','US',
 'US','VA','Norfolk','US','NC','Charlotte',
 false, 310,
 'road', 5900, 980000),

-- ── National: I-80 Northern Spine (Chicago → Sacramento)
('US_CHICAGOIL_SACRAMENTOCA',
 'i-80-northern-chicago-sacramento',
 'I-80 Northern Spine — Chicago to Sacramento',
 'I-80 Northern',
 'active','country_spine','national','US',
 'US','IL','Chicago','US','CA','Sacramento',
 false, 2088,
 'road', 6800, 1200000),

-- ── National: Bakken Oil Fields (Williston ND → Billings MT)
('US_WILLISTONND_BILLINGSMT',
 'bakken-oil-nd-to-mt',
 'Bakken Oil Fields Transport Corridor — Williston to Billings',
 'Bakken Corridor',
 'active','industrial_connector','national','US',
 'US','ND','Williston','US','MT','Billings',
 false, 268,
 'road', 4800, 1400000),

-- ── National: I-90 Northern (Seattle → Boston)
('US_SEATTLEWA_BOSTONMA',
 'i-90-northern-wa-ma',
 'I-90 Northern Route — Seattle to Boston',
 'I-90 Northern',
 'active','country_spine','national','US',
 'US','WA','Seattle','US','MA','Boston',
 false, 3084,
 'road', 5500, 900000),

-- ── National: Port of Charleston to Charlotte/Greenville
('US_PORTOFCHARLESTON_CHARLOTTENC',
 'port-charleston-to-charlotte-nc',
 'Port of Charleston to Charlotte/Greenville Corridor',
 'Charleston–Charlotte',
 'active','port_connector','national','US',
 'US','SC','Charleston','US','NC','Charlotte',
 false, 215,
 'road', 5200, 870000),

-- ── National: Solar/Renewable Energy SW (Phoenix → Albuquerque)
('US_PHOENIXAZ_ALBUQUERQUENM',
 'solar-energy-az-nm',
 'Southwest Solar/Renewable Energy Corridor — Phoenix to Albuquerque',
 'Solar SW Corridor',
 'active','industrial_connector','national','US',
 'US','AZ','Phoenix','US','NM','Albuquerque',
 false, 481,
 'road', 5100, 1100000)

on conflict (corridor_code) do nothing;

-- ── Requirements seed for top 5 flagship corridors ─────────────────────────

insert into public.hc_corridor_requirements (
  corridor_id, requirement_type, jurisdiction_level, jurisdiction_code,
  title, summary, confidence_score, freshness_score
)
select c.id, req.requirement_type, req.jurisdiction_level, req.jurisdiction_code,
       req.title, req.summary, 85, 80
from public.hc_corridors c
join (
  values
    -- I-10 Southern requirements
    ('i-10-southern-ca-fl','permit','state','US-CA','California Oversize Permit',
     'CA DOT requires permit for loads over 8.5 ft wide. Same-day permits available online via Caltrans Permit Portal.'),
    ('i-10-southern-ca-fl','escort','state','US-CA','California Escort Requirements',
     'Loads 8.5–14 ft wide require 1 rear escort. Over 14 ft requires lead + rear. Over 20 ft requires police escort.'),
    ('i-10-southern-ca-fl','permit','state','US-TX','Texas Oversize Permit',
     'TxDMV issues single-trip and annual permits. Loads over 12 ft wide require pre-approved route.'),
    ('i-10-southern-ca-fl','escort','state','US-TX','Texas Escort Requirements',
     'Loads 8.5–14 ft require 1 rear escort. 14–18 ft requires lead + rear. Over 20 ft requires Texas DPS escort.'),
    ('i-10-southern-ca-fl','escort','state','US-FL','Florida Escort Requirements',
     'FDOT requires escort for loads over 8.5 ft wide. Loads over 14 ft require dual escort. Night moves restricted for loads over 14 ft wide.'),
    -- I-95 Atlantic requirements
    ('i-95-atlantic-fl-me','permit','state','US-FL','Florida Oversize Permit',
     'FDOT issues permits online. Same-day processing for standard oversize dimensions.'),
    ('i-95-atlantic-fl-me','escort','state','US-NC','North Carolina Escort Requirements',
     'NCDOT requires escort for loads over 8.5 ft wide. Dual escort required over 14 ft wide.'),
    ('i-95-atlantic-fl-me','curfew','state','US-VA','Virginia Holiday / Weekend Restrictions',
     'Virginia prohibits oversized load movement during certain holiday weekends and peak traffic windows on I-95.'),
    -- I-35 NAFTA requirements
    ('i-35-central-tx-mn','permit','state','US-TX','Texas/Mexico Border Crossing Permit',
     'Loads entering via Laredo require both TxDMV oversize permit and CBP customs clearance documentation.'),
    ('i-35-central-tx-mn','escort','state','US-OK','Oklahoma Escort Requirements',
     'ODOT requires single rear escort for loads 8.5–14 ft wide. Dual escort and route pre-approval for loads over 16 ft.'),
    -- I-5 West Coast requirements
    ('i-5-west-coast-ca-wa','permit','state','US-CA','California Oversize Permit',
     'Caltrans issues annual blanket permits for loads under 14 ft wide. Single-trip permits required above that.'),
    ('i-5-west-coast-ca-wa','escort','state','US-OR','Oregon Escort Requirements',
     'ODOT requires escort for loads over 8.5 ft wide. Loads over 14 ft require lead + rear escort. Night moves prohibited for loads over 14 ft.'),
    ('i-5-west-coast-ca-wa','escort','state','US-WA','Washington Escort Requirements',
     'WSDOT requires escort for loads over 8.5 ft wide. Dual escort required over 14.5 ft wide.'),
    -- Permian Basin requirements
    ('i-20-permian-basin-tx','escort','state','US-TX','Texas Oilfield Escort Requirements',
     'TxDMV requires load-specific escort for oilfield rigs exceeding 14 ft wide. 48-hour advance notice required for loads exceeding 20 ft.'),
    ('i-20-permian-basin-tx','police','state','US-TX','Texas DPS Police Escort',
     'Texas DPS escort required for loads exceeding 20 ft wide. Contact local TxDPS troop 7–10 days in advance.'),
    -- Gulf Coast Petrochem
    ('gulf-coast-petrochem-la-tx','escort','state','US-LA','Louisiana Escort Requirements',
     'LADOTD requires escort for loads over 8.5 ft wide. Night moves permitted with special permit. Loads over 16 ft require lead + rear escorts.'),
    ('gulf-coast-petrochem-la-tx','credential','state','US-LA','Refinery/Plant Site Credentials',
     'Deliveries to Gulf Coast refineries typically require TWIC cards and facility-specific site access credentials for all crew.'),
    -- Wind Energy corridor
    ('wind-energy-tx-to-kc','escort','state','US-TX','Texas Wind Energy Load Escort',
     'Wind turbine blade transport requires certified escort operators familiar with long-load turning procedures. 72-hour permit processing time.'),
    ('wind-energy-tx-to-kc','route_survey','country','US','Wind Turbine Route Survey',
     'Route surveys are mandatory for wind turbine blade transport over 150 ft length. Survey must be filed with permit application.')
) as req(slug, requirement_type, jurisdiction_level, jurisdiction_code, title, summary)
on req.slug = c.slug
on conflict (corridor_id, requirement_type, jurisdiction_level, jurisdiction_code, title) do nothing;

-- ── Pricing observations seed ────────────────────────────────────────────────

insert into public.hc_corridor_pricing_obs (
  corridor_id, observation_type, currency_code,
  amount_min, amount_median, amount_max,
  price_unit, source_type, confidence_score
)
select c.id, pr.observation_type, 'USD',
       pr.amount_min, pr.amount_median, pr.amount_max,
       pr.price_unit::public.hc_price_unit,
       'admin_entry'::public.hc_price_source, 70
from public.hc_corridors c
join (
  values
    ('i-10-southern-ca-fl','escort_rate', 1.75, 2.50, 3.75, 'mile'),
    ('i-10-southern-ca-fl','operator_rate', 2.00, 2.85, 4.25, 'mile'),
    ('i-10-southern-ca-fl','urgent_fill_premium', 0.75, 1.25, 2.00, 'mile'),
    ('i-95-atlantic-fl-me','escort_rate', 1.80, 2.55, 3.80, 'mile'),
    ('i-95-atlantic-fl-me','operator_rate', 2.10, 2.90, 4.30, 'mile'),
    ('i-35-central-tx-mn','escort_rate', 1.75, 2.45, 3.60, 'mile'),
    ('i-35-central-tx-mn','operator_rate', 2.00, 2.75, 4.10, 'mile'),
    ('i-5-west-coast-ca-wa','escort_rate', 2.00, 2.80, 4.00, 'mile'),
    ('i-5-west-coast-ca-wa','operator_rate', 2.25, 3.10, 4.60, 'mile'),
    ('i-75-southeast-mi-fl','escort_rate', 1.70, 2.40, 3.55, 'mile'),
    ('i-75-southeast-mi-fl','operator_rate', 1.95, 2.70, 4.00, 'mile'),
    ('port-houston-beaumont-tx','escort_rate', 1.50, 2.20, 3.40, 'mile'),
    ('port-houston-beaumont-tx','twic_premium', 25.00, 40.00, 60.00, 'trip'),
    ('port-houston-beaumont-tx','urgent_fill_premium', 1.00, 1.75, 2.50, 'mile'),
    ('i-20-permian-basin-tx','escort_rate', 1.80, 2.60, 4.00, 'mile'),
    ('i-20-permian-basin-tx','operator_rate', 2.20, 3.00, 4.50, 'mile'),
    ('i-20-permian-basin-tx','police_coordination_fee', 250.00, 450.00, 900.00, 'trip'),
    ('gulf-coast-petrochem-la-tx','escort_rate', 1.75, 2.50, 3.85, 'mile'),
    ('gulf-coast-petrochem-la-tx','twic_premium', 30.00, 50.00, 80.00, 'trip'),
    ('wind-energy-tx-to-kc','escort_rate', 2.00, 2.85, 4.25, 'mile'),
    ('wind-energy-tx-to-kc','route_survey_rate', 350.00, 600.00, 1200.00, 'trip'),
    ('wind-energy-tx-to-kc','urgent_fill_premium', 1.25, 2.00, 3.00, 'mile'),
    ('bakken-oil-nd-to-mt','escort_rate', 1.90, 2.70, 4.10, 'mile'),
    ('bakken-oil-nd-to-mt','operator_rate', 2.20, 3.10, 4.60, 'mile'),
    ('bakken-oil-nd-to-mt','urgent_fill_premium', 1.00, 1.80, 2.75, 'mile')
) as pr(slug, observation_type, amount_min, amount_median, amount_max, price_unit)
on pr.slug = c.slug;

-- ── Credential mappings for top corridors ───────────────────────────────────

insert into public.hc_corridor_credentials (
  corridor_id, credential_type_id, required, preferred, urgency_multiplier, premium_multiplier
)
select c.id, ct.id, cm.required, cm.preferred, cm.urgency_multiplier, cm.premium_multiplier
from public.hc_corridors c
join (
  values
    ('port-houston-beaumont-tx','twic', true, true, 1.4, 1.5),
    ('port-houston-beaumont-tx','naec-pevo', false, true, 1.1, 1.15),
    ('gulf-coast-petrochem-la-tx','twic', true, true, 1.35, 1.45),
    ('gulf-coast-petrochem-la-tx','energy-site-access', true, true, 1.2, 1.3),
    ('i-20-permian-basin-tx','energy-site-access', false, true, 1.1, 1.2),
    ('i-20-permian-basin-tx','police-coordination', false, true, 1.25, 1.3),
    ('wind-energy-tx-to-kc','route-survey-cert', true, true, 1.3, 1.4),
    ('wind-energy-tx-to-kc','naec-pevo', false, true, 1.15, 1.2),
    ('bakken-oil-nd-to-mt','energy-site-access', true, true, 1.3, 1.35),
    ('port-savannah-to-atlanta-ga','twic', false, true, 1.1, 1.15),
    ('port-la-lb-to-phoenix-az','twic', false, true, 1.1, 1.15),
    ('port-virginia-to-charlotte-nc','twic', false, true, 1.1, 1.15),
    ('port-charleston-to-charlotte-nc','twic', false, true, 1.1, 1.15),
    ('i-10-southern-ca-fl','naec-pevo', false, true, 1.0, 1.1),
    ('i-95-atlantic-fl-me','naec-pevo', false, true, 1.0, 1.1),
    ('i-35-central-tx-mn','naec-pevo', false, true, 1.0, 1.1),
    ('i-5-west-coast-ca-wa','naec-pevo', false, true, 1.0, 1.1),
    ('i-75-southeast-mi-fl','naec-pevo', false, true, 1.0, 1.1)
) as cm(slug, cred_slug, required, preferred, urgency_multiplier, premium_multiplier)
on cm.slug = c.slug
join public.hc_credential_types ct on ct.slug = cm.cred_slug
on conflict (corridor_id, credential_type_id) do nothing;

-- ── Initial page stubs for top 5 flagship corridors ─────────────────────────

insert into public.hc_corridor_pages (
  corridor_id, page_type, slug, canonical_url,
  title_tag, meta_description, h1,
  schema_type, indexable, publish_status, internal_link_score
)
select
  c.id,
  'overview'::public.hc_corridor_page_type,
  c.slug,
  'https://haulcommand.com/corridors/' || c.slug,
  c.name || ' — Heavy Haul Escort & Permit Guide | Haul Command',
  'Complete guide to escort requirements, permits, pricing, and certified operators for the ' || c.name || '.',
  c.name || ': Escort, Permit & Operator Guide',
  'SpecialAnnouncement',
  true,
  'published'::public.hc_publish_status,
  90
from public.hc_corridors c
where c.slug in (
  'i-10-southern-ca-fl','i-95-atlantic-fl-me','i-35-central-tx-mn',
  'i-5-west-coast-ca-wa','i-75-southeast-mi-fl'
)
on conflict (corridor_id, page_type) do nothing;

-- ── Kick off scoring for all seeded corridors ───────────────────────────────

select public.hc_score_all_corridors();

commit;
