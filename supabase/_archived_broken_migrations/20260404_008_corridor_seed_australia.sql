-- Haul Command — Australia Corridor Seed
-- Migration: 20260404_008_corridor_seed_australia.sql
begin;

insert into public.hc_credential_types
  (slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('aus-osom-permit','Australia OSOM Oversize/Overmass Permit','OSOM AU','AU','safety','State Road Authority',365),
  ('aus-pilot-vehicle','Australia PBS Pilot/Escort Vehicle Operator','PBS Escort AU','AU','pilot_operator','NHVR',730),
  ('aus-nhvr-notice','NHVR Class 1 Oversize Notice','NHVR Notice','AU','safety','NHVR',365),
  ('fifo-site-access','Australian Mining FIFO Site Access','FIFO Access','AU','mining_site','Mine Operator',365),
  ('aus-twic-equiv','Australian Port Workers Security Card (MSIC)','MSIC AU','AU','port_access','ASIC / MSIC Issuing Body',1825)
on conflict (slug) do nothing;

insert into public.hc_corridors(
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
('AU_PORTHEDLAND_NEWMAN','pilbara-port-hedland-to-newman','Port Hedland to Newman Pilbara Mining Corridor','Port Hedland–Newman Pilbara','active','industrial_connector','flagship','AU','en','AUD','AU','WA','Port Hedland','AU','WA','Newman',false,440,'road',14800,4200000),
('AU_PORTHEDLAND_KARRATHA','pilbara-port-hedland-to-karratha','Port Hedland to Karratha LNG & Mining Corridor','Port Hedland–Karratha','active','port_connector','flagship','AU','en','AUD','AU','WA','Port Hedland','AU','WA','Karratha',false,237,'road',12200,3600000),
('AU_KARRATHA_PERTH','karratha-to-perth-northwest','Karratha to Perth Northwest Corridor (NW Coastal Hwy)','Karratha–Perth NW','active','country_spine','national','AU','en','AUD','AU','WA','Karratha','AU','WA','Perth',false,1530,'road',7800,2200000),
('AU_PORTPERTH_KALGOORLIE','port-fremantle-to-kalgoorlie','Port of Fremantle to Kalgoorlie Mining Corridor','Fremantle–Kalgoorlie','active','port_connector','national','AU','en','AUD','AU','WA','Fremantle','AU','WA','Kalgoorlie',false,596,'road',8400,2400000),
('AU_PORTPERTH_ALBANY','port-fremantle-to-albany','Port of Fremantle to Albany Corridor','Fremantle–Albany WA','active','port_connector','national','AU','en','AUD','AU','WA','Fremantle','AU','WA','Albany',false,418,'road',4200,1000000),
('AU_DARWIN_ALICE','darwin-to-alice-springs-nt','Darwin to Alice Springs Stuart Highway Corridor','Darwin–Alice Springs NT','active','country_spine','national','AU','en','AUD','AU','NT','Darwin','AU','NT','Alice Springs',false,1491,'road',5600,1500000),
('AU_PORTDAMPIER_KARRATHA','port-dampier-to-karratha','Port of Dampier to Karratha Industrial Corridor','Port Dampier–Karratha','active','port_connector','national','AU','en','AUD','AU','WA','Dampier','AU','WA','Karratha',false,20,'road',6800,2000000),
('AU_PORTTOWNSVILLEQ_MOUNTISA','port-townsville-to-mount-isa','Port of Townsville to Mount Isa Mining Corridor (Flinders Hwy)','Townsville–Mount Isa QLD','active','port_connector','flagship','AU','en','AUD','AU','QLD','Townsville','AU','QLD','Mount Isa',false,904,'road',9400,2800000),
('AU_PORTBRISBANE_SYDNEY','east-coast-brisbane-to-sydney','East Coast Corridor — Brisbane to Sydney (Pacific Motorway / M1)','Brisbane–Sydney M1','active','country_spine','flagship','AU','en','AUD','AU','QLD','Brisbane','AU','NSW','Sydney',false,922,'road',13200,3800000),
('AU_PORTSYDNEY_MELBOURNE','east-coast-sydney-to-melbourne','East Coast Corridor — Sydney to Melbourne (Hume Highway / M31)','Sydney–Melbourne Hume','active','country_spine','flagship','AU','en','AUD','AU','NSW','Sydney','AU','VIC','Melbourne',false,877,'road',14600,4200000),
('AU_PORTMELBOURNE_ADELAIDE','south-route-melbourne-to-adelaide','Melbourne to Adelaide Corridor (Western Freeway / A8)','Melbourne–Adelaide A8','active','country_spine','national','AU','en','AUD','AU','VIC','Melbourne','AU','SA','Adelaide',false,725,'road',8800,2500000),
('AU_PORTADELAIDE_DARWIN','centre-adelaide-to-darwin','Adelaide to Darwin Stuart Highway Corridor','Adelaide–Darwin Stuart','active','country_spine','national','AU','en','AUD','AU','SA','Adelaide','AU','NT','Darwin',false,3020,'road',5200,1600000),
('AU_PORTBRISBANE_CAIRNS','coastal-brisbane-to-cairns','Brisbane to Cairns Coastal Corridor (Bruce Highway)','Brisbane–Cairns Bruce Hwy','active','country_spine','national','AU','en','AUD','AU','QLD','Brisbane','AU','QLD','Cairns',false,1703,'road',5800,1700000),
('AU_SOUTHAUSTMINES_PORTADELAIDE','olympic-dam-to-port-adelaide','Olympic Dam Mine to Port Adelaide Corridor','Olympic Dam–Port Adelaide','active','industrial_connector','national','AU','en','AUD','AU','SA','Roxby Downs','AU','SA','Adelaide',false,572,'road',4800,1800000)
on conflict (corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,82,78
from public.hc_corridors c join (
  values
  ('pilbara-port-hedland-to-newman','permit','country','AU','Western Australia OSOM Permit','WA Department of Transport issues OSOM permits online. Loads over 2.5m wide require permit. Loads over 3.5m wide require escort. Processing: same day to 5 days.'),
  ('pilbara-port-hedland-to-newman','escort','country','AU','WA Pilbara Escort Requirements','Single PBS-certified pilot vehicle for loads 3.5–5.0m wide. Dual escort for loads over 5.0m wide. NHVR notice required for multi-state moves.'),
  ('pilbara-port-hedland-to-newman','credential','country','AU','Pilbara Mining Site FIFO Access','All personnel entering mine sites require valid site access card. Rio Tinto and BHP issue site-specific access via their contractor management systems.'),
  ('port-townsville-to-mount-isa','permit','country','AU','Queensland OSOM Permit (TMR)','Queensland Dept of Transport & Main Roads issues OSOM permits. Flinders Hwy has specific bridge load limits requiring engineering sign-off for heavy loads.'),
  ('east-coast-sydney-to-melbourne','permit','country','AU','NSW + VIC NHVR Class 1 Notice','Cross-state NHVR Class 1 Oversize Notice required. Notice valid across both states for loads under specific dimension limits. Loads exceeding notice limits require individual permits.'),
  ('east-coast-sydney-to-melbourne','curfew','country','AU','NSW Urban Curfew (Sydney Metro)','Oversize loads banned on Sydney motorways 6AM–9AM and 3PM–7PM Mon–Fri. Weekend night movement recommended for loads over 3.5m wide on M7/M4.'),
  ('pilbara-port-hedland-to-karratha','credential','country','AU','Australian MSIC/ASIC Port Security Card','All port workers and delivery personnel operating within Port Hedland port precinct require valid MSIC or ASIC card. Issued by RMS or MSIC accredited body.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict (corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'AUD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,68
from public.hc_corridors c join (
  values
  ('pilbara-port-hedland-to-newman','escort_rate',4.50,6.50,10.00,'km'),
  ('pilbara-port-hedland-to-newman','operator_rate',5.50,7.80,12.00,'km'),
  ('pilbara-port-hedland-to-newman','urgent_fill_premium',3.00,5.00,8.00,'km'),
  ('pilbara-port-hedland-to-newman','route_survey_rate',1500.00,2800.00,6000.00,'trip'),
  ('pilbara-port-hedland-to-karratha','escort_rate',4.00,6.00,9.50,'km'),
  ('port-townsville-to-mount-isa','escort_rate',3.80,5.60,8.80,'km'),
  ('port-townsville-to-mount-isa','operator_rate',4.50,6.50,10.00,'km'),
  ('east-coast-brisbane-to-sydney','escort_rate',2.80,4.00,6.00,'km'),
  ('east-coast-sydney-to-melbourne','escort_rate',2.90,4.20,6.30,'km'),
  ('east-coast-sydney-to-melbourne','operator_rate',3.40,4.90,7.20,'km'),
  ('port-fremantle-to-kalgoorlie','escort_rate',3.50,5.20,8.00,'km'),
  ('port-fremantle-to-kalgoorlie','operator_rate',4.20,6.00,9.20,'km'),
  ('karratha-to-perth-northwest','escort_rate',3.80,5.60,8.80,'km'),
  ('olympic-dam-to-port-adelaide','escort_rate',3.60,5.30,8.20,'km')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join (
  values
  ('pilbara-port-hedland-to-newman','aus-osom-permit',true,true,1.2,1.25),
  ('pilbara-port-hedland-to-newman','aus-pilot-vehicle',true,true,1.25,1.3),
  ('pilbara-port-hedland-to-newman','fifo-site-access',true,true,1.3,1.4),
  ('pilbara-port-hedland-to-karratha','aus-osom-permit',true,true,1.2,1.25),
  ('pilbara-port-hedland-to-karratha','aus-twic-equiv',true,true,1.15,1.2),
  ('port-townsville-to-mount-isa','aus-osom-permit',true,true,1.2,1.25),
  ('port-townsville-to-mount-isa','aus-pilot-vehicle',true,true,1.2,1.25),
  ('port-townsville-to-mount-isa','fifo-site-access',false,true,1.1,1.15),
  ('east-coast-sydney-to-melbourne','aus-nhvr-notice',true,true,1.1,1.15),
  ('east-coast-brisbane-to-sydney','aus-nhvr-notice',true,true,1.1,1.15),
  ('port-fremantle-to-kalgoorlie','aus-osom-permit',true,true,1.15,1.2),
  ('port-fremantle-to-kalgoorlie','fifo-site-access',false,true,1.1,1.15),
  ('olympic-dam-to-port-adelaide','aus-osom-permit',true,true,1.2,1.25),
  ('olympic-dam-to-port-adelaide','fifo-site-access',true,true,1.3,1.4)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict (corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Oversize Escort & OSOM Permit Guide | Haul Command',
  'OSOM permits, escort requirements, and operator coverage for the '||c.name||'.',
  c.name||': OSOM, Escort & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in('pilbara-port-hedland-to-newman','pilbara-port-hedland-to-karratha','port-townsville-to-mount-isa','east-coast-sydney-to-melbourne','east-coast-brisbane-to-sydney','port-fremantle-to-kalgoorlie')
on conflict (corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
