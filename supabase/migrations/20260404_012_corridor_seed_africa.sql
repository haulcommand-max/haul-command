-- Haul Command — Sub-Saharan Africa Corridor Seed
-- Migration: 20260404_012_corridor_seed_africa.sql
begin;

insert into public.hc_credential_types(slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('sa-aarto-permit','South Africa AARTO Abnormal Load Permit','AARTO ZA','ZA','safety','RTMC / Provincial Authority',365),
  ('zambia-rtsa-permit','Zambia RTSA Special Permit','RTSA ZM','ZM','safety','Road Transport & Safety Agency',365),
  ('kenya-ntsa-permit','Kenya NTSA Oversize Permit','NTSA KE','KE','safety','National Transport & Safety Authority',365),
  ('ghana-dvla-permit','Ghana DVLA Special Load Permit','DVLA GH','GH','safety','Driver & Vehicle Licensing Authority',365),
  ('nigeria-frsc-permit','Nigeria FRSC Special Haulage Permit','FRSC NG','NG','safety','Federal Road Safety Corps',365),
  ('comesa-transit','COMESA/SADC Cross-Border Transit Document','COMESA Transit','ZA','customs','COMESA / SADC Secretariat',1095)
on conflict(slug) do nothing;

insert into public.hc_corridors(
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
-- South Africa flagships
('ZA_PORTDURBAN_JOHANNESBURG','n3-durban-to-johannesburg','South Africa N3 — Durban to Johannesburg Heavy Haul Corridor','Durban–Johannesburg N3','active','country_spine','flagship','ZA','en','USD','ZA','KZN','Durban','ZA','GP','Johannesburg',false,586,'road',16800,4200000),
('ZA_PORTCAPETOWN_JOHANNESBURG','n1-cape-town-to-johannesburg','South Africa N1 — Cape Town to Johannesburg Industrial Spine','Cape Town–Johannesburg N1','active','country_spine','flagship','ZA','en','USD','ZA','WP','Cape Town','ZA','GP','Johannesburg',false,1399,'road',11400,2800000),
('ZA_JOHANNESBURG_PRETORIA','n1-johannesburg-to-pretoria','Johannesburg to Pretoria Urban Industrial Corridor (N1/N14)','JHB–Pretoria N1','active','metro_connector','national','ZA','en','USD','ZA','GP','Johannesburg','ZA','GP','Pretoria',false,55,'road',8800,2200000),
('ZA_PORTDURBAN_RICHARDSBAY','n2-durban-to-richards-bay','Durban to Richards Bay Mining & Port Corridor (N2)','Durban–Richards Bay N2','active','port_connector','national','ZA','en','USD','ZA','KZN','Durban','ZA','KZN','Richards Bay',false,185,'road',9400,2600000),
('ZA_JOHANNESBURG_POLOKWANE','n1-johannesburg-to-polokwane','Johannesburg to Polokwane Mining Corridor (N1)','JHB–Polokwane N1','active','industrial_connector','national','ZA','en','USD','ZA','GP','Johannesburg','ZA','LP','Polokwane',false,350,'road',6800,1800000),
('ZA_PORTCAPETOWN_HOTAZEL_MINES','cape-town-to-hotazel-mining','Cape Town to Hotazel Manganese Mine Corridor (N12/N14)','Cape Town–Hotazel Mining','active','industrial_connector','national','ZA','en','USD','ZA','WP','Cape Town','ZA','NC','Hotazel',false,950,'road',5400,1800000),
-- Cross-border Southern Africa
('XBRD_JOHANNESBURG_LUSAKA','sadc-xbrd-johannesburg-to-lusaka','Johannesburg to Lusaka SADC Corridor (N1/N4/T2)','JHB–Lusaka SADC XBRD','active','border_connector','flagship','ZA','en','USD','ZA','GP','Johannesburg','ZM','LU','Lusaka',true,1980,'road',9200,2600000),
('XBRD_JOHANNESBURG_HARARE','sadc-xbrd-johannesburg-to-harare','Johannesburg to Harare SADC Cross-Border Corridor','JHB–Harare SADC XBRD','active','border_connector','national','ZA','en','USD','ZA','GP','Johannesburg','ZW','HA','Harare',true,1190,'road',7200,2000000),
('XBRD_LUSAKA_DARES_SALAAM','tazara-lusaka-to-dar-es-salaam','Lusaka to Dar es Salaam TAZARA Corridor (T1/A7)','Lusaka–Dar es Salaam','active','border_connector','national','ZM','en','USD','ZM','LU','Lusaka','TZ','DA','Dar es Salaam',true,2000,'road',5800,1700000),
('XBRD_NAIROBI_MOMBASA','kenya-a109-nairobi-to-mombasa','Kenya A109 — Nairobi to Mombasa Port Industrial Corridor','Nairobi–Mombasa A109','active','port_connector','flagship','KE','sw','USD','KE','NA','Nairobi','KE','MO','Mombasa',false,480,'road',12400,3200000),
('XBRD_MOMBASA_KAMPALA','northern-corridor-mombasa-to-kampala','Northern Corridor — Mombasa to Kampala Cross-Border','Mombasa–Kampala N.Corridor','active','border_connector','flagship','KE','sw','USD','KE','MO','Mombasa','UG','KA','Kampala',true,1650,'road',8600,2400000),
-- West Africa
('GH_PORTACCRA_KUMASI','ghana-n6-accra-to-kumasi','Ghana N6 — Port of Tema to Kumasi Inland Corridor','Port Tema–Kumasi GH','active','port_connector','national','GH','en','USD','GH','GA','Accra','GH','AH','Kumasi',false,250,'road',7200,1800000),
('NG_PORTLAGOS_ABUJA','nigeria-a1-lagos-to-abuja','Nigeria A1 — Lagos to Abuja Industrial Corridor','Lagos–Abuja A1 NG','active','country_spine','flagship','NG','en','USD','NG','LA','Lagos','NG','FC','Abuja',false,760,'road',14400,3600000),
('NG_PORTLAGOS_PHARCOURT','nigeria-a2-lagos-to-port-harcourt','Nigeria A2 — Lagos to Port Harcourt Energy Corridor','Lagos–Port Harcourt NG','active','industrial_connector','national','NG','en','USD','NG','LA','Lagos','NG','RI','Port Harcourt',false,650,'road',9200,2400000),
-- Mozambique / Southern Africa
('MZ_PORTBEIRA_ZIMBABWE','beira-corridor-mozambique-to-zimbabwe','Beira Corridor — Port of Beira to Zimbabwe Cross-Border','Beira Corridor MZ–ZW','active','border_connector','national','MZ','pt','USD','MZ','SO','Beira','ZW','MS','Mutare',true,580,'road',6200,1800000)
on conflict(corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,77,73
from public.hc_corridors c join(
  values
  ('n3-durban-to-johannesburg','permit','country','ZA','South Africa AARTO Abnormal Load Permit','RTMC issues abnormal load permits. Loads over 2.5m wide require permit. Loads over 3.5m wide require escort. N3 is one of Africa highest-traffic heavy haul routes. Online: natis.gov.za.'),
  ('n3-durban-to-johannesburg','escort','country','ZA','South Africa Abnormal Load Escort Requirement','One escort for loads 3.5–4.5m wide. Two escorts above 4.5m. Traffic officer mandatory above 5.0m. Night movement required through Pietermaritzburg and Johannesburg CBD.'),
  ('nigeria-a1-lagos-to-abuja','permit','country','NG','Nigeria FRSC Special Haulage Permit','FRSC issues special haulage permits for loads exceeding legal limits. Lagos State LASTMA coordination required for loads moving through Lagos metro. Processing: 5–7 days.'),
  ('kenya-a109-nairobi-to-mombasa','permit','country','KE','Kenya NTSA Oversize Permit','NTSA issues oversize vehicle permits. A109 has axle load enforcement stations. Kenya Revenue Authority road levy applies to oversize loads.'),
  ('sadc-xbrd-johannesburg-to-lusaka','permit','country','ZA','SADC Cross-Border Permit (Beit Bridge / Chirundu)','COMESA/SADC cross-border transport permit required. Yellow Card (RCTG) required for in-transit movement. Each country requires separate oversize permit. Processing: 5–10 days per country.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'USD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,62
from public.hc_corridors c join(
  values
  ('n3-durban-to-johannesburg','escort_rate',1.20,1.90,3.00,'km'),
  ('n3-durban-to-johannesburg','operator_rate',1.50,2.30,3.60,'km'),
  ('n3-durban-to-johannesburg','urgent_fill_premium',0.80,1.40,2.20,'km'),
  ('n1-cape-town-to-johannesburg','escort_rate',1.10,1.80,2.80,'km'),
  ('n2-durban-to-richards-bay','escort_rate',1.20,1.90,3.00,'km'),
  ('nigeria-a1-lagos-to-abuja','escort_rate',1.00,1.70,2.80,'km'),
  ('kenya-a109-nairobi-to-mombasa','escort_rate',0.90,1.50,2.40,'km'),
  ('northern-corridor-mombasa-to-kampala','escort_rate',1.10,1.80,2.90,'km'),
  ('sadc-xbrd-johannesburg-to-lusaka','escort_rate',1.40,2.20,3.50,'km'),
  ('sadc-xbrd-johannesburg-to-lusaka','permit_cost',400.00,850.00,2200.00,'permit')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join(
  values
  ('n3-durban-to-johannesburg','sa-aarto-permit',true,true,1.2,1.25),
  ('n1-cape-town-to-johannesburg','sa-aarto-permit',true,true,1.2,1.25),
  ('johannesburg-to-pretoria','sa-aarto-permit',true,true,1.1,1.15),
  ('n2-durban-to-richards-bay','sa-aarto-permit',true,true,1.15,1.2),
  ('sadc-xbrd-johannesburg-to-lusaka','sa-aarto-permit',true,true,1.2,1.25),
  ('sadc-xbrd-johannesburg-to-lusaka','comesa-transit',true,true,1.15,1.2),
  ('sadc-xbrd-johannesburg-to-lusaka','zambia-rtsa-permit',true,true,1.2,1.25),
  ('northern-corridor-mombasa-to-kampala','kenya-ntsa-permit',true,true,1.2,1.25),
  ('northern-corridor-mombasa-to-kampala','comesa-transit',true,true,1.15,1.2),
  ('kenya-a109-nairobi-to-mombasa','kenya-ntsa-permit',true,true,1.2,1.25),
  ('nigeria-a1-lagos-to-abuja','nigeria-frsc-permit',true,true,1.2,1.25),
  ('nigeria-a2-lagos-to-port-harcourt','nigeria-frsc-permit',true,true,1.2,1.25),
  ('ghana-n6-accra-to-kumasi','ghana-dvla-permit',true,true,1.15,1.2)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict(corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Heavy Haul Escort & Permit Guide | Haul Command',
  'Escort requirements, permits, and operator intelligence for the '||c.name||'.',
  c.name||': Escort, Permit & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in('n3-durban-to-johannesburg','n1-cape-town-to-johannesburg','nigeria-a1-lagos-to-abuja','kenya-a109-nairobi-to-mombasa','northern-corridor-mombasa-to-kampala','sadc-xbrd-johannesburg-to-lusaka')
on conflict(corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
