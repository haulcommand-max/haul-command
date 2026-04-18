-- Haul Command Corridor OS — Canadian Corridor Seed
-- Migration: 20260404_004_corridor_seed_canada.sql
-- Depends on: 20260404_002_corridor_seed_us.sql
-- Coverage: 35 Canadian corridors — Trans-Canada spine, Alberta Oil Sands,
--           BC Port connectors, Ontario manufacturing, Quebec river corridor,
--           Prairie energy/wind, Maritime connections
-- Strategy: INSERT ... ON CONFLICT DO NOTHING (idempotent)

begin;

-- ── Canadian credential types ──────────────────────────────────────────────────────

insert into public.hc_credential_types
  (slug, name, short_name, country_code, credential_family, issuing_authority, renewal_period_days)
values
  ('oil-sands-access','Oil Sands Facility Access Pass','Oil Sands Pass','CA','energy_site','Site Operator / AER',365),
  ('alberta-pevo','Alberta PEVO / Pilot Vehicle Operator','AB PEVO','CA','pilot_operator','Alberta Transportation',730),
  ('bc-pevo','BC Pilot Vehicle Operator Certification','BC PEVO','CA','pilot_operator','BC MoTI',730),
  ('ontario-esc','Ontario Escort Vehicle Operator Certification','ON ESC','CA','pilot_operator','Ontario MTO',730),
  ('transport-canada-dg','Transport Canada Dangerous Goods Certificate','TDG Cert','CA','hazmat','Transport Canada',1095),
  ('nexus-card','NEXUS Trusted Traveler Card (US-Canada Border)','NEXUS','CA','customs','CBSA / CBP',1825),
  ('cstic','Canadian Security Transparency Initiative Certification','CSTIC','CA','secure_facility','TC / CBSA',730)
on conflict (slug) do nothing;

-- ── Canadian corridors ─────────────────────────────────────────────────────────────

insert into public.hc_corridors (
  corridor_code, slug, name, short_name,
  status, corridor_type, tier, country_code,
  primary_language_code, currency_code,
  origin_country_code, origin_region_code, origin_city_name,
  destination_country_code, destination_region_code, destination_city_name,
  is_cross_border, distance_km, typical_mode,
  search_volume_estimate, commercial_value_estimate
) values

-- ── TRANS-CANADA SPINE (flagship) ───────────────────────────────────────────────

('CA_VANCOUVERBC_CALGARYAB',
 'trans-canada-vancouver-to-calgary',
 'Trans-Canada Highway — Vancouver to Calgary',
 'Vancouver–Calgary TCH',
 'active','country_spine','flagship','CA',
 'en','CAD',
 'CA','BC','Vancouver','CA','AB','Calgary',
 false,1050,'road',14200,3100000),

('CA_CALGARYAB_REGINAASK',
 'trans-canada-calgary-to-regina',
 'Trans-Canada Highway — Calgary to Regina',
 'Calgary–Regina TCH',
 'active','country_spine','national','CA',
 'en','CAD',
 'CA','AB','Calgary','CA','SK','Regina',
 false,762,'road',8400,1750000),

('CA_REGINAASK_WINNIPEGMB',
 'trans-canada-regina-to-winnipeg',
 'Trans-Canada Highway — Regina to Winnipeg',
 'Regina–Winnipeg TCH',
 'active','country_spine','national','CA',
 'en','CAD',
 'CA','SK','Regina','CA','MB','Winnipeg',
 false,577,'road',6800,1400000),

('CA_WINNIPEGMB_TORONTOON',
 'trans-canada-winnipeg-to-toronto',
 'Trans-Canada Highway — Winnipeg to Toronto',
 'Winnipeg–Toronto TCH',
 'active','country_spine','flagship','CA',
 'en','CAD',
 'CA','MB','Winnipeg','CA','ON','Toronto',
 false,2092,'road',11800,2600000),

('CA_TORONTOON_MONTREALQC',
 'hwy-401-toronto-to-montreal',
 'Highway 401 / Ontario–Quebec — Toronto to Montréal',
 'Toronto–Montréal Hwy 401',
 'active','country_spine','flagship','CA',
 'en','CAD',
 'CA','ON','Toronto','CA','QC','Montréal',
 false,542,'road',16800,3600000),

('CA_MONTREALQC_QUEBECCITQC',
 'hwy-20-montreal-to-quebec-city',
 'Highway 20 — Montréal to Québec City',
 'Montréal–Québec City',
 'active','country_spine','national','CA',
 'fr','CAD',
 'CA','QC','Montréal','CA','QC','Québec City',
 false,254,'road',9200,1900000),

-- ── ALBERTA OIL SANDS (flagship) ──────────────────────────────────────────────

('CA_EDMONTONAB_FORTMCMURRABYAB',
 'hwy-63-edmonton-to-fort-mcmurray',
 'Highway 63 — Edmonton to Fort McMurray (Oil Sands Corridor)',
 'Hwy 63 Oil Sands',
 'active','industrial_connector','flagship','CA',
 'en','CAD',
 'CA','AB','Edmonton','CA','AB','Fort McMurray',
 false,443,'road',18500,4800000),

('CA_CALGARYAB_EDMONTONAB',
 'hwy-2-calgary-to-edmonton',
 'Highway 2 CANAMEX — Calgary to Edmonton',
 'Calgary–Edmonton Hwy 2',
 'active','country_spine','flagship','CA',
 'en','CAD',
 'CA','AB','Calgary','CA','AB','Edmonton',
 false,299,'road',13200,2900000),

('CA_FORTMCMURRBYAB_LLOYDMINSASK',
 'oil-sands-fort-mcmurray-to-lloydminster',
 'Oil Sands Corridor — Fort McMurray to Lloydminster',
 'Fort McMurray–Lloydminster',
 'active','industrial_connector','national','CA',
 'en','CAD',
 'CA','AB','Fort McMurray','CA','SK','Lloydminster',
 false,481,'road',6800,2200000),

('CA_EDMONTONAB_LLOYDMINSASK',
 'edmonton-to-lloydminster-ab-sk',
 'Edmonton to Lloydminster Heavy Industrial Corridor',
 'Edmonton–Lloydminster',
 'active','industrial_connector','national','CA',
 'en','CAD',
 'CA','AB','Edmonton','CA','SK','Lloydminster',
 false,278,'road',5100,1650000),

('CA_CALGARYAB_LETHBRIDGEAB',
 'calgary-to-lethbridge-ab',
 'Calgary to Lethbridge Energy & Agricultural Corridor',
 'Calgary–Lethbridge AB',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','AB','Calgary','CA','AB','Lethbridge',
 false,216,'road',4200,850000),

('CA_EDMONTONAB_GRANDEPRAIRIEAB',
 'edmonton-to-grande-prairie-ab',
 'Edmonton to Grande Prairie Energy Corridor',
 'Edmonton–Grande Prairie',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','AB','Edmonton','CA','AB','Grande Prairie',
 false,462,'road',4800,1350000),

('CA_FORTMCMURRBYAB_PEACERIVERAB',
 'fort-mcmurray-to-peace-river-ab',
 'Fort McMurray to Peace River Bitumen Corridor',
 'Fort McMurray–Peace River',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','AB','Fort McMurray','CA','AB','Peace River',
 false,390,'road',3600,1200000),

-- ── BRITISH COLUMBIA port / industrial corridors ──────────────────────────────────

('CA_PORTOFVANCOUVBC_KAMLOOPSBC',
 'port-vancouver-to-kamloops-bc',
 'Port of Vancouver to Kamloops Corridor (Trans-Canada / Hwy 1)',
 'Vancouver Port–Kamloops BC',
 'active','port_connector','national','CA',
 'en','CAD',
 'CA','BC','Vancouver','CA','BC','Kamloops',
 false,355,'road',8100,1700000),

('CA_PORTOFVANCOUVBC_PRINCGEORGBC',
 'port-vancouver-to-prince-george-bc',
 'Port of Vancouver to Prince George Corridor (Hwy 97/16)',
 'Vancouver Port–Prince George',
 'active','port_connector','national','CA',
 'en','CAD',
 'CA','BC','Vancouver','CA','BC','Prince George',
 false,790,'road',5900,1250000),

('CA_PRINCIPERUGERTBC_EDMONTONNAB',
 'port-prince-rupert-to-edmonton',
 'Port of Prince Rupert to Edmonton Inland Corridor (Hwy 16)',
 'Prince Rupert Port–Edmonton',
 'active','port_connector','national','CA',
 'en','CAD',
 'CA','BC','Prince Rupert','CA','AB','Edmonton',
 false,1488,'road',7200,2100000),

('CA_KITIMATBC_PRINCGEORGBC',
 'kitimat-to-prince-george-bc',
 'Kitimat LNG Corridor — Kitimat to Prince George',
 'Kitimat LNG–Prince George',
 'active','industrial_connector','national','CA',
 'en','CAD',
 'CA','BC','Kitimat','CA','BC','Prince George',
 false,355,'road',5200,1800000),

('CA_PORTOFVANCOUVBC_KELOWNABC',
 'port-vancouver-to-kelowna-bc',
 'Vancouver to Kelowna Interior Corridor (Hwy 97)',
 'Vancouver–Kelowna BC',
 'active','port_connector','regional','CA',
 'en','CAD',
 'CA','BC','Vancouver','CA','BC','Kelowna',
 false,392,'road',4400,880000),

-- ── ONTARIO manufacturing / port corridors ──────────────────────────────────────

('CA_WINDSORON_TORONTOON',
 'hwy-401-windsor-to-toronto',
 'Highway 401 — Windsor to Toronto Auto Manufacturing Belt',
 'Windsor–Toronto Hwy 401',
 'active','industrial_connector','national','CA',
 'en','CAD',
 'CA','ON','Windsor','CA','ON','Toronto',
 false,375,'road',11400,2500000),

('CA_TORONTOON_HAMILTONON',
 'toronto-to-hamilton-on',
 'Toronto to Hamilton Steel & Port Corridor (QEW / Hwy 403)',
 'Toronto–Hamilton ON',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','ON','Toronto','CA','ON','Hamilton',
 false,75,'road',7200,1500000),

('CA_HAMILTONON_NIAGARAON',
 'hamilton-to-niagara-on',
 'Hamilton to Niagara Falls Cross-Border Corridor',
 'Hamilton–Niagara ON',
 'active','border_connector','regional','CA',
 'en','CAD',
 'CA','ON','Hamilton','CA','ON','Niagara Falls',
 false,70,'road',5100,1300000),

('CA_TORONTOON_SUDBURYON',
 'toronto-to-sudbury-on',
 'Toronto to Sudbury Mining Corridor (Hwy 400/69)',
 'Toronto–Sudbury Mining',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','ON','Toronto','CA','ON','Sudbury',
 false,400,'road',3800,950000),

('CA_SUDBURYON_THUNDERBAYON',
 'sudbury-to-thunder-bay-on',
 'Sudbury to Thunder Bay Resource Corridor (Trans-Canada/Hwy 17)',
 'Sudbury–Thunder Bay ON',
 'active','country_spine','national','CA',
 'en','CAD',
 'CA','ON','Sudbury','CA','ON','Thunder Bay',
 false,714,'road',4400,1100000),

('CA_PORTOFTORONTOON_HAMILTONON',
 'port-toronto-to-hamilton-on',
 'Port of Toronto to Hamilton Steel Connector',
 'Port Toronto–Hamilton',
 'active','port_connector','regional','CA',
 'en','CAD',
 'CA','ON','Toronto','CA','ON','Hamilton',
 false,75,'road',4900,1100000),

-- ── QUEBEC corridors ─────────────────────────────────────────────────────────────

('CA_PORTOFMONTREALQC_LAVALQC',
 'port-montreal-to-laval-qc',
 'Port of Montréal to Laval Distribution Corridor',
 'Port Montréal–Laval',
 'active','port_connector','regional','CA',
 'fr','CAD',
 'CA','QC','Montréal','CA','QC','Laval',
 false,22,'road',5600,1100000),

('CA_MONTREALQC_SHERBROOKEQC',
 'montreal-to-sherbrooke-qc',
 'Montréal to Sherbrooke Industrial Corridor (Hwy 10)',
 'Montréal–Sherbrooke QC',
 'active','country_spine','regional','CA',
 'fr','CAD',
 'CA','QC','Montréal','CA','QC','Sherbrooke',
 false,150,'road',3500,700000),

('CA_BAIECOMAUQC_QUEBECCITQC',
 'baie-comeau-to-quebec-city-qc',
 'Baie-Comeau to Québec City Hydro Corridor (Hwy 138/40)',
 'Baie-Comeau–Québec City',
 'active','industrial_connector','regional','CA',
 'fr','CAD',
 'CA','QC','Baie-Comeau','CA','QC','Québec City',
 false,420,'road',3100,900000),

('CA_SAGUENAYQC_MONTREALQC',
 'saguenay-to-montreal-qc',
 'Saguenay Aluminium Corridor to Montréal (Hwy 70/40)',
 'Saguenay Aluminium–Montréal',
 'active','industrial_connector','regional','CA',
 'fr','CAD',
 'CA','QC','Saguenay','CA','QC','Montréal',
 false,475,'road',3400,1050000),

-- ── PRAIRIE energy / agricultural corridors ────────────────────────────────────────

('CA_SASKATOONNSK_REGINANASK',
 'saskatoon-to-regina-sk',
 'Saskatoon to Regina Prairie Corridor (Hwy 11)',
 'Saskatoon–Regina SK',
 'active','country_spine','regional','CA',
 'en','CAD',
 'CA','SK','Saskatoon','CA','SK','Regina',
 false,258,'road',5600,1100000),

('CA_REGINANASK_WINNIPEGNMB',
 'regina-to-winnipeg-sk-mb',
 'Regina to Winnipeg Agricultural Corridor (TCH)',
 'Regina–Winnipeg',
 'active','country_spine','regional','CA',
 'en','CAD',
 'CA','SK','Regina','CA','MB','Winnipeg',
 false,574,'road',4800,960000),

('CA_ESTEVANASK_REGINANASK',
 'estevan-to-regina-sk',
 'Estevan Oil Corridor to Regina (Hwy 39)',
 'Estevan–Regina Energy',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','SK','Estevan','CA','SK','Regina',
 false,225,'road',3200,850000),

('CA_WINNIPEGNMB_PORTAGER_MB',
 'winnipeg-to-portage-la-prairie-mb',
 'Winnipeg to Portage la Prairie Agricultural Exchange',
 'Winnipeg–Portage MB',
 'active','industrial_connector','regional','CA',
 'en','CAD',
 'CA','MB','Winnipeg','CA','MB','Portage la Prairie',
 false,88,'road',2800,560000),

-- ── CROSS-BORDER corridors (US↔CA) ─────────────────────────────────────────────

('XBRD_DETROITMI_WINDSORON',
 'cross-border-detroit-windsor',
 'Detroit–Windsor Cross-Border Auto Corridor (Ambassador Bridge)',
 'Detroit–Windsor XBRD',
 'active','border_connector','flagship','CA',
 'en','CAD',
 'US','MI','Detroit','CA','ON','Windsor',
 true,6,'road',22000,4200000),

('XBRD_BUFFALONE_NIAGARAON',
 'cross-border-buffalo-niagara',
 'Buffalo–Niagara Falls Cross-Border Corridor (Peace Bridge)',
 'Buffalo–Niagara XBRD',
 'active','border_connector','national','CA',
 'en','CAD',
 'US','NY','Buffalo','CA','ON','Niagara Falls',
 true,35,'road',14200,2800000),

('XBRD_BLAINEWA_SURREYBC',
 'cross-border-blaine-surrey-bc',
 'Blaine WA–Surrey BC Cross-Border Corridor (Pacific Hwy)',
 'Blaine–Surrey XBRD',
 'active','border_connector','national','CA',
 'en','CAD',
 'US','WA','Blaine','CA','BC','Surrey',
 true,5,'road',12800,2600000),

('XBRD_SWEETGRASSMT_COUTTSSAB',
 'cross-border-sweetgrass-coutts',
 'Sweetgrass MT–Coutts AB Cross-Border Energy Corridor',
 'Sweetgrass–Coutts XBRD',
 'active','border_connector','national','CA',
 'en','CAD',
 'US','MT','Sweetgrass','CA','AB','Coutts',
 true,2,'road',8400,2100000),

('XBRD_NORTONND_NORTHPORTALSK',
 'cross-border-north-portal-sk',
 'North Dakota–Saskatchewan Cross-Border Agricultural Corridor',
 'ND–SK Border XBRD',
 'active','border_connector','regional','CA',
 'en','CAD',
 'US','ND','Portal','CA','SK','North Portal',
 true,2,'road',4200,1050000)

on conflict (corridor_code) do nothing;

-- ── Requirements for top Canadian corridors ─────────────────────────────────────────

insert into public.hc_corridor_requirements (
  corridor_id, requirement_type, jurisdiction_level, jurisdiction_code,
  title, summary, confidence_score, freshness_score
)
select c.id, req.rtype, req.jlevel, req.jcode, req.title, req.summary, 82, 78
from public.hc_corridors c
join (
  values
    -- Hwy 63 Oil Sands (Edmonton–Fort McMurray)
    ('hwy-63-edmonton-to-fort-mcmurray','permit','state','CA-AB','Alberta Oversize Permit',
     'Alberta Transportation issues annual and single-trip oversize permits. Loads over 2.6m wide require escort. Special permits required for loads exceeding 6.0m wide.'),
    ('hwy-63-edmonton-to-fort-mcmurray','escort','state','CA-AB','Alberta Escort Requirements',
     'Single escort required for loads 2.6–4.9m wide. Dual escort (front + rear) required for loads over 4.9m wide. Police escort required above 6.0m wide.'),
    ('hwy-63-edmonton-to-fort-mcmurray','credential','state','CA-AB','Oil Sands Site Access Requirement',
     'All delivery personnel entering oil sands facilities require site-specific access passes. Most major operators (Syncrude, Suncor, CNRL) issue facility-specific credentials.'),
    ('hwy-63-edmonton-to-fort-mcmurray','route_survey','state','CA-AB','Hwy 63 Route Survey',
     'Route surveys are required for loads exceeding 8.0m wide or 6.4m tall on Highway 63 due to utility crossings and camp road access points.'),
    -- Calgary–Edmonton (Hwy 2)
    ('hwy-2-calgary-to-edmonton','permit','state','CA-AB','Alberta Hwy 2 Oversize Permit',
     'High-frequency corridor with annual blanket permits available for loads under 3.5m wide. Single-trip permits issued same-day for standard dimensions.'),
    ('hwy-2-calgary-to-edmonton','escort','state','CA-AB','Alberta Hwy 2 Escort Requirements',
     'One rear escort for loads 2.6–4.0m wide. Dual escort above 4.0m wide. Night restrictions apply for loads over 4.0m wide between cities.'),
    -- Trans-Canada Vancouver–Calgary
    ('trans-canada-vancouver-to-calgary','permit','state','CA-BC','BC Oversize Permit',
     'BC MoTI issues oversize permits online. Mountain terrain requires route-specific review for loads over 4.5m tall. IRP pre-approval required for cross-provincial moves.'),
    ('trans-canada-vancouver-to-calgary','escort','state','CA-BC','BC Escort Requirements',
     'Single pilot vehicle for loads over 2.6m wide. Dual escort required over 4.9m wide. Height pole mandatory above 4.5m tall. Night moves restricted on mountain segments.'),
    ('trans-canada-vancouver-to-calgary','permit','state','CA-AB','Alberta Trans-Canada Oversize Permit',
     'Alberta segment requires separate permit from Alberta Transportation. Online permit available for standard oversize. Annual permits cover loads under 3.5m wide.'),
    -- Hwy 401 Windsor–Toronto
    ('hwy-401-windsor-to-toronto','permit','state','CA-ON','Ontario OSOW Permit',
     'Ontario MTO issues oversize/overweight permits through OPMS. Annual permits available for loads under 3.0m wide. Multi-axle loads require axle group analysis.'),
    ('hwy-401-windsor-to-toronto','escort','state','CA-ON','Ontario Escort Requirements',
     'Single escort required for loads 2.6–4.0m wide on Hwy 401. Dual escort required above 4.0m wide. Police escort required for loads over 5.0m wide.'),
    -- Hwy 401 Toronto–Montréal
    ('hwy-401-toronto-to-montreal','permit','state','CA-ON','Ontario Oversize Permit (Toronto–Cornwall)',
     'Ontario MTO permit required for Ontario portion. Complex urban zones require nighttime movement windows. Hwy 401 has designated oversize movement corridors.'),
    ('hwy-401-toronto-to-montreal','permit','state','CA-QC','Québec Oversize Permit',
     'MTQ (Ministère des Transports du Québec) issues permits for Québec portion. French-language permit documents required. Seasonal thaw restrictions March–May.'),
    ('hwy-401-toronto-to-montreal','escort','state','CA-QC','Quebec Escort Requirements',
     'MTQ requires escort for loads over 3.5m wide on autoroutes. Seasonal weight restrictions apply during spring thaw. Front escort required for loads over 4.5m wide.'),
    -- Detroit–Windsor Cross-Border
    ('cross-border-detroit-windsor','permit','country','US','US Customs Export Documentation',
     'CBP requires AES filing for heavy equipment exports over $2,500 USD. TIR documentation may be required for temporary import contracts.'),
    ('cross-border-detroit-windsor','permit','country','CA','Canadian Import Permit / CBSA Clearance',
     'CBSA requires advance cargo reporting via eManifest. Temporary import (TIB) available for equipment returning after service work in US or Canada.'),
    ('cross-border-detroit-windsor','credential','country','XBRD','NEXUS / FAST Card',
     'NEXUS or FAST card recommended for frequent cross-border operators. Standard crossing uses Enhanced Driver License or NEXUS.'),
    -- Blaine–Surrey Cross-Border
    ('cross-border-blaine-surrey-bc','permit','country','CA','BC Import Oversize Declaration',
     'Oversize loads entering BC from Washington require a valid BC oversize permit with port-of-entry stamp. Pre-clearance available through BC MoTI.'),
    ('cross-border-blaine-surrey-bc','escort','state','CA-BC','BC Escort at Port of Entry',
     'BC MoTI requires escort vehicles to be licensed BC operators at the port of entry. US-licensed escort operators must transfer to a BC escort at the border.')
) as req(slug, rtype, jlevel, jcode, title, summary)
on req.slug = c.slug
on conflict (corridor_id, requirement_type, jurisdiction_level, jurisdiction_code, title) do nothing;

-- ── Canadian pricing observations ────────────────────────────────────────────────────

insert into public.hc_corridor_pricing_obs (
  corridor_id, observation_type, currency_code,
  amount_min, amount_median, amount_max,
  price_unit, source_type, confidence_score
)
select c.id, pr.observation_type, 'CAD',
       pr.amount_min, pr.amount_median, pr.amount_max,
       pr.price_unit::public.hc_price_unit,
       'admin_entry'::public.hc_price_source, 68
from public.hc_corridors c
join (
  values
    -- Hwy 63 Oil Sands
    ('hwy-63-edmonton-to-fort-mcmurray','escort_rate',3.10,4.25,6.50,'mile'),
    ('hwy-63-edmonton-to-fort-mcmurray','operator_rate',3.50,4.80,7.20,'mile'),
    ('hwy-63-edmonton-to-fort-mcmurray','urgent_fill_premium',2.00,3.25,5.00,'mile'),
    ('hwy-63-edmonton-to-fort-mcmurray','route_survey_rate',600.00,950.00,1800.00,'trip'),
    -- Calgary–Edmonton
    ('hwy-2-calgary-to-edmonton','escort_rate',2.80,3.90,5.80,'mile'),
    ('hwy-2-calgary-to-edmonton','operator_rate',3.20,4.40,6.50,'mile'),
    ('hwy-2-calgary-to-edmonton','urgent_fill_premium',1.50,2.50,4.00,'mile'),
    -- Trans-Canada Vancouver–Calgary
    ('trans-canada-vancouver-to-calgary','escort_rate',3.00,4.10,6.20,'mile'),
    ('trans-canada-vancouver-to-calgary','operator_rate',3.40,4.70,7.00,'mile'),
    -- Hwy 401 Toronto–Montréal
    ('hwy-401-toronto-to-montreal','escort_rate',2.60,3.70,5.50,'mile'),
    ('hwy-401-toronto-to-montreal','operator_rate',3.00,4.20,6.20,'mile'),
    -- Windsor–Toronto
    ('hwy-401-windsor-to-toronto','escort_rate',2.70,3.80,5.60,'mile'),
    ('hwy-401-windsor-to-toronto','operator_rate',3.10,4.30,6.40,'mile'),
    -- Cross-border
    ('cross-border-detroit-windsor','escort_rate',2.50,3.60,5.50,'mile'),
    ('cross-border-blaine-surrey-bc','escort_rate',2.80,4.00,6.00,'mile'),
    ('cross-border-blaine-surrey-bc','permit_cost',350.00,650.00,1200.00,'permit'),
    -- Fort McMurray–Lloydminster
    ('oil-sands-fort-mcmurray-to-lloydminster','escort_rate',3.00,4.20,6.40,'mile'),
    ('oil-sands-fort-mcmurray-to-lloydminster','urgent_fill_premium',2.00,3.00,4.50,'mile'),
    -- Kitimat LNG
    ('kitimat-to-prince-george-bc','escort_rate',3.20,4.50,7.00,'mile'),
    ('kitimat-to-prince-george-bc','route_survey_rate',700.00,1100.00,2200.00,'trip'),
    -- Prince Rupert–Edmonton
    ('port-prince-rupert-to-edmonton','escort_rate',3.00,4.30,6.50,'mile'),
    ('port-prince-rupert-to-edmonton','operator_rate',3.50,4.90,7.50,'mile')
) as pr(slug, observation_type, amount_min, amount_median, amount_max, price_unit)
on pr.slug = c.slug;

-- ── Credential mappings for Canadian corridors ───────────────────────────────────

insert into public.hc_corridor_credentials (
  corridor_id, credential_type_id, required, preferred, urgency_multiplier, premium_multiplier
)
select c.id, ct.id, cm.required, cm.preferred, cm.urgency_multiplier, cm.premium_multiplier
from public.hc_corridors c
join (
  values
    -- Oil Sands corridors (all require site access)
    ('hwy-63-edmonton-to-fort-mcmurray','oil-sands-access',true,true,1.5,1.6),
    ('hwy-63-edmonton-to-fort-mcmurray','alberta-pevo',true,true,1.3,1.4),
    ('hwy-63-edmonton-to-fort-mcmurray','route-survey-cert',true,true,1.2,1.3),
    ('oil-sands-fort-mcmurray-to-lloydminster','oil-sands-access',true,true,1.4,1.5),
    ('oil-sands-fort-mcmurray-to-lloydminster','alberta-pevo',true,true,1.2,1.3),
    ('edmonton-to-lloydminster-ab-sk','oil-sands-access',false,true,1.1,1.2),
    ('edmonton-to-lloydminster-ab-sk','alberta-pevo',true,true,1.2,1.3),
    ('fort-mcmurray-to-peace-river-ab','oil-sands-access',false,true,1.1,1.2),
    ('fort-mcmurray-to-peace-river-ab','alberta-pevo',true,true,1.2,1.3),
    -- Alberta corridors
    ('hwy-2-calgary-to-edmonton','alberta-pevo',true,true,1.1,1.15),
    ('trans-canada-calgary-to-regina','alberta-pevo',false,true,1.0,1.1),
    -- BC corridors
    ('trans-canada-vancouver-to-calgary','bc-pevo',true,true,1.15,1.2),
    ('trans-canada-vancouver-to-calgary','alberta-pevo',false,true,1.0,1.1),
    ('port-vancouver-to-kamloops-bc','bc-pevo',true,true,1.1,1.15),
    ('port-prince-rupert-to-edmonton','bc-pevo',true,true,1.2,1.25),
    ('port-prince-rupert-to-edmonton','alberta-pevo',false,true,1.0,1.1),
    ('kitimat-to-prince-george-bc','bc-pevo',true,true,1.3,1.35),
    ('kitimat-to-prince-george-bc','energy-site-access',true,true,1.25,1.3),
    ('kitimat-to-prince-george-bc','route-survey-cert',true,true,1.2,1.25),
    -- Ontario corridors
    ('hwy-401-windsor-to-toronto','ontario-esc',true,true,1.1,1.15),
    ('hwy-401-toronto-to-montreal','ontario-esc',true,true,1.1,1.15),
    -- Cross-border
    ('cross-border-detroit-windsor','nexus-card',false,true,1.05,1.1),
    ('cross-border-blaine-surrey-bc','nexus-card',false,true,1.05,1.1),
    ('cross-border-blaine-surrey-bc','bc-pevo',true,true,1.2,1.25),
    ('cross-border-sweetgrass-coutts','alberta-pevo',true,true,1.15,1.2),
    ('cross-border-buffalo-niagara','ontario-esc',false,true,1.05,1.1)
) as cm(slug, cred_slug, required, preferred, urgency_multiplier, premium_multiplier)
on cm.slug = c.slug
join public.hc_credential_types ct on ct.slug = cm.cred_slug
on conflict (corridor_id, credential_type_id) do nothing;

-- ── Page stubs for flagship Canadian corridors ───────────────────────────────────

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
  c.name || ' — Oversize Transport Escort & Permit Guide | Haul Command',
  'Complete escort requirements, permit rules, and pricing for the ' || c.name || '. Includes requirements for ' || c.origin_region_code || ' and ' || c.destination_region_code || '.',
  c.name || ': Escort, Permit & Pricing Guide',
  'Service',
  true,
  'published'::public.hc_publish_status,
  88
from public.hc_corridors c
where c.slug in (
  'hwy-63-edmonton-to-fort-mcmurray',
  'hwy-2-calgary-to-edmonton',
  'trans-canada-vancouver-to-calgary',
  'hwy-401-toronto-to-montreal',
  'cross-border-detroit-windsor',
  'cross-border-blaine-surrey-bc'
)
on conflict (corridor_id, page_type) do nothing;

-- Rescore including new Canada corridors
select public.hc_score_all_corridors();

commit;
