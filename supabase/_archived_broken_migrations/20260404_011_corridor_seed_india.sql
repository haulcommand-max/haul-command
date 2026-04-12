-- Haul Command — India Corridor Seed
-- Migration: 20260404_011_corridor_seed_india.sql
begin;

insert into public.hc_credential_types(slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('india-morth-permit','India MoRTH Oversize/Overweight Permit','MoRTH Permit IN','IN','safety','Ministry of Road Transport & Highways',365),
  ('india-state-pwd','India State PWD Special Permit','PWD State IN','IN','safety','State Public Works Department',365),
  ('india-port-access','India Port Trust / PAS Access Card','Port PAS IN','IN','port_access','Major Port Trust',1825),
  ('india-adr-equiv','India Hazardous Goods Driver Training Certificate','HAZCHEM IN','IN','hazmat','State Transport Authority',1095)
on conflict(slug) do nothing;

insert into public.hc_corridors(
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
('IN_MUMBAI_DELHI','nh48-mumbai-to-delhi','NH-48 — Mumbai to Delhi Heavy Haul Spine','Mumbai–Delhi NH-48','active','country_spine','flagship','IN','en','USD','IN','MH','Mumbai','IN','DL','Delhi',false,1421,'road',16200,3900000),
('IN_DELHI_KOLKATA','nh19-delhi-to-kolkata','NH-19 — Delhi to Kolkata Grand Trunk Industrial Corridor','Delhi–Kolkata NH-19','active','country_spine','flagship','IN','en','USD','IN','DL','Delhi','IN','WB','Kolkata',false,1531,'road',11800,2800000),
('IN_MUMBAI_CHENNAI','nh48-nh44-mumbai-to-chennai','NH-48/NH-44 — Mumbai to Chennai West–East Corridor','Mumbai–Chennai','active','country_spine','national','IN','en','USD','IN','MH','Mumbai','IN','TN','Chennai',false,1338,'road',10400,2500000),
('IN_DELHI_MUMBAI_DMIC','delhi-mumbai-industrial-corridor','Delhi–Mumbai Industrial Corridor (DMIC Highway)','DMIC Delhi–Mumbai','active','industrial_connector','flagship','IN','en','USD','IN','DL','Delhi','IN','MH','Mumbai',false,1504,'road',14400,3600000),
('IN_PORTMUMBAI_PUNE','nhava-sheva-to-pune','Port of Nhava Sheva (JNPT) to Pune Industrial Corridor','JNPT–Pune','active','port_connector','flagship','IN','en','USD','IN','MH','Navi Mumbai','IN','MH','Pune',false,160,'road',13600,3400000),
('IN_PORTCHENNAI_BENGALURU','port-chennai-to-bengaluru','Port of Chennai to Bengaluru Industrial Corridor (NH-44)','Chennai Port–Bengaluru','active','port_connector','national','IN','en','USD','IN','TN','Chennai','IN','KA','Bengaluru',false,345,'road',10800,2600000),
('IN_PORTKOLKATA_DELHI','port-kolkata-to-delhi-nh19','Port of Kolkata to Delhi via NH-19 Corridor','Kolkata Port–Delhi NH-19','active','port_connector','national','IN','en','USD','IN','WB','Kolkata','IN','DL','Delhi',false,1531,'road',8200,2000000),
('IN_BENGALURU_CHENNAI','nh44-bengaluru-to-chennai','NH-44 — Bengaluru to Chennai Tech & Auto Corridor','Bengaluru–Chennai NH-44','active','industrial_connector','national','IN','en','USD','IN','KA','Bengaluru','IN','TN','Chennai',false,345,'road',9600,2300000),
('IN_MUMBAI_AHMEDABAD','nh48-mumbai-to-ahmedabad','NH-48 — Mumbai to Ahmedabad Industrial Corridor','Mumbai–Ahmedabad NH-48','active','country_spine','national','IN','en','USD','IN','MH','Mumbai','IN','GJ','Ahmedabad',false,524,'road',9200,2200000),
('IN_PORTMUNDRA_DELHI','port-mundra-to-delhi','Port of Mundra to Delhi Western Corridor','Port Mundra–Delhi','active','port_connector','national','IN','en','USD','IN','GJ','Mundra','IN','DL','Delhi',false,1060,'road',8800,2100000),
('IN_VIZAG_VISAKHAPATNAM_HYDER','port-vizag-to-hyderabad','Port of Visakhapatnam to Hyderabad Industrial Corridor','Vizag Port–Hyderabad','active','port_connector','national','IN','en','USD','IN','AP','Visakhapatnam','IN','TS','Hyderabad',false,625,'road',7400,1800000),
('IN_DELHI_JAIPUR','nh48-delhi-to-jaipur','NH-48 — Delhi to Jaipur Industrial & Energy Corridor','Delhi–Jaipur NH-48','active','industrial_connector','regional','IN','en','USD','IN','DL','Delhi','IN','RJ','Jaipur',false,280,'road',6800,1600000),
('IN_HYDERABAD_BENGALURU','nh44-hyderabad-to-bengaluru','NH-44 — Hyderabad to Bengaluru Tech Corridor','Hyderabad–Bengaluru NH-44','active','industrial_connector','regional','IN','en','USD','IN','TS','Hyderabad','IN','KA','Bengaluru',false,570,'road',6400,1600000),
('IN_KOLKATA_ASANSOL','nh19-kolkata-to-asansol-coal','Kolkata to Asansol Coal & Steel Corridor (NH-19)','Kolkata–Asansol Coal','active','industrial_connector','regional','IN','en','USD','IN','WB','Kolkata','IN','WB','Asansol',false,220,'road',5800,1500000)
on conflict(corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,79,75
from public.hc_corridors c join(
  values
  ('nh48-mumbai-to-delhi','permit','country','IN','India MoRTH Oversize/Overweight Permit','MoRTH issues permits for loads exceeding legal limits under Rule 93 of the Central Motor Vehicles Rules. State PWD permits also required for each state traversed. Online portal: vahan.parivahan.gov.in.'),
  ('nh48-mumbai-to-delhi','escort','country','IN','India Pilot Vehicle Requirement','Loads over 3.0m wide require pilot vehicle. Loads over 4.5m wide require front and rear pilot. State police escort required for loads over 5.0m wide. Night movement preferred in urban zones.'),
  ('nhava-sheva-to-pune','permit','state','IN-MH','Maharashtra State Oversize Permit','Maharashtra PWD issues state permits. Expressway movement requires MSRDC permit. Nh-48 / Mumbai–Pune Expressway has specific axle load restrictions.'),
  ('port-chennai-to-bengaluru','permit','state','IN-TN','Tamil Nadu State PWD Permit','Tamil Nadu PWD issues permits for loads exceeding legal dimensions. State border entry permit required when entering Karnataka. Processing: 3–5 days per state.'),
  ('delhi-mumbai-industrial-corridor','curfew','country','IN','India Urban Nighttime Movement','Oversize loads banned during peak hours in Delhi, Mumbai, and Pune metro areas. Night window 10PM–5AM strongly recommended for loads over 3.5m wide in metros.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'USD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,62
from public.hc_corridors c join(
  values
  ('nh48-mumbai-to-delhi','escort_rate',0.80,1.40,2.20,'km'),
  ('nh48-mumbai-to-delhi','operator_rate',1.00,1.70,2.70,'km'),
  ('nh48-mumbai-to-delhi','urgent_fill_premium',0.50,0.90,1.60,'km'),
  ('delhi-mumbai-industrial-corridor','escort_rate',0.85,1.45,2.30,'km'),
  ('nhava-sheva-to-pune','escort_rate',1.00,1.70,2.60,'km'),
  ('port-chennai-to-bengaluru','escort_rate',0.90,1.55,2.40,'km'),
  ('nh48-mumbai-to-ahmedabad','escort_rate',0.80,1.40,2.20,'km'),
  ('nh19-delhi-to-kolkata','escort_rate',0.75,1.30,2.10,'km'),
  ('port-mundra-to-delhi','escort_rate',0.85,1.45,2.30,'km')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join(
  values
  ('nh48-mumbai-to-delhi','india-morth-permit',true,true,1.15,1.2),
  ('nh48-mumbai-to-delhi','india-state-pwd',true,true,1.1,1.15),
  ('nh19-delhi-to-kolkata','india-morth-permit',true,true,1.15,1.2),
  ('nh19-delhi-to-kolkata','india-state-pwd',true,true,1.1,1.15),
  ('delhi-mumbai-industrial-corridor','india-morth-permit',true,true,1.15,1.2),
  ('nhava-sheva-to-pune','india-morth-permit',true,true,1.15,1.2),
  ('nhava-sheva-to-pune','india-port-access',true,true,1.2,1.25),
  ('port-chennai-to-bengaluru','india-morth-permit',true,true,1.15,1.2),
  ('port-chennai-to-bengaluru','india-port-access',true,true,1.2,1.25),
  ('port-mundra-to-delhi','india-morth-permit',true,true,1.15,1.2),
  ('port-mundra-to-delhi','india-port-access',true,true,1.2,1.25)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict(corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Oversize Permit & Escort Guide | Haul Command',
  'Permit rules, escort requirements, and operator intelligence for the '||c.name||'.',
  c.name||': Permit, Escort & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in('nh48-mumbai-to-delhi','delhi-mumbai-industrial-corridor','nhava-sheva-to-pune','port-chennai-to-bengaluru','nh19-delhi-to-kolkata','port-mundra-to-delhi')
on conflict(corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
