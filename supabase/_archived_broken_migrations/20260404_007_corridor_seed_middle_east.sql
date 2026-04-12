-- Haul Command — Middle East Corridor Seed
-- Migration: 20260404_007_corridor_seed_middle_east.sql
begin;

insert into public.hc_credential_types
  (slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('uae-rta-permit','UAE RTA Exceptional Load Permit','RTA AE','AE','safety','Roads & Transport Authority',365),
  ('ksa-momra-permit','KSA MOMRA Oversize Transport Permit','MOMRA SA','SA','safety','Ministry of Municipal & Rural Affairs',365),
  ('gcc-transport-cert','GCC Cross-Border Transport Certificate','GCC Cert','SA','customs','GCC Secretariat',365),
  ('aramco-vendor','Saudi Aramco Approved Vendor / Site Access','Aramco Vendor','SA','energy_site','Saudi Aramco Procurement',365),
  ('adnoc-access','ADNOC Site Access Pass','ADNOC Access','AE','energy_site','ADNOC',365),
  ('qatar-moi-permit','Qatar MoI Special Transport Permit','Qatar MoI','QA','safety','Qatar Ministry of Interior',365),
  ('neom-access','NEOM Project Site Access Credential','NEOM Access','SA','energy_site','NEOM Authority',365),
  ('kuwait-mow-permit','Kuwait Ministry of Works Oversize Permit','Kuwait MoW','KW','safety','Kuwait Ministry of Works',365)
on conflict (slug) do nothing;

insert into public.hc_corridors (
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
('AE_JEBELALI_DUBAI','port-jebel-ali-to-dubai','Port of Jebel Ali to Dubai Industrial Corridor','Jebel Ali–Dubai','active','port_connector','flagship','AE','en','USD','AE','DU','Jebel Ali','AE','DU','Dubai',false,40,'road',18200,4200000),
('AE_DUBAI_ABUDHABI','uae-e11-dubai-to-abu-dhabi','UAE E11 Sheikh Zayed Road — Dubai to Abu Dhabi','Dubai–Abu Dhabi E11','active','country_spine','flagship','AE','en','USD','AE','DU','Dubai','AE','AZ','Abu Dhabi',false,140,'road',14800,3400000),
('AE_KHORFAKKAN_DUBAI','port-khorfakkan-to-dubai','Port of Khorfakkan to Dubai Corridor','Khorfakkan–Dubai','active','port_connector','national','AE','en','USD','AE','SH','Khorfakkan','AE','DU','Dubai',false,130,'road',8400,2000000),
('AE_ABUDHABI_MUSCAT','uae-oman-abu-dhabi-to-muscat','Abu Dhabi to Muscat GCC Energy Corridor','Abu Dhabi–Muscat GCC','active','border_connector','national','AE','en','USD','AE','AZ','Abu Dhabi','OM','MA','Muscat',true,390,'road',7600,1900000),
('SA_DAMMAM_RIYADH','ksa-hwy40-dammam-to-riyadh','Saudi Arabia Highway 40 — Dammam to Riyadh','Dammam–Riyadh Hwy 40','active','country_spine','flagship','SA','ar','USD','SA','EP','Dammam','SA','RI','Riyadh',false,400,'road',16800,4000000),
('SA_RIYADH_JEDDAH','ksa-hwy15-riyadh-to-jeddah','Saudi Arabia Highway 15 — Riyadh to Jeddah','Riyadh–Jeddah Hwy 15','active','country_spine','flagship','SA','ar','USD','SA','RI','Riyadh','SA','MK','Jeddah',false,960,'road',12400,2900000),
('SA_JUBAIL_RIYADH','ksa-port-jubail-to-riyadh','Port of Jubail to Riyadh Petrochemical Corridor','Port Jubail–Riyadh','active','port_connector','flagship','SA','ar','USD','SA','EP','Jubail','SA','RI','Riyadh',false,380,'road',14200,3600000),
('SA_JEDDAH_RIYADH','ksa-port-jeddah-to-riyadh','Port of Jeddah to Riyadh Inland Corridor','Port Jeddah–Riyadh','active','port_connector','national','SA','ar','USD','SA','MK','Jeddah','SA','RI','Riyadh',false,970,'road',9200,2200000),
('SA_RIYADH_NEOM','ksa-riyadh-to-neom','Riyadh to NEOM Megaproject Corridor (via Tabuk)','Riyadh–NEOM Vision 2030','active','industrial_connector','flagship','SA','ar','USD','SA','RI','Riyadh','SA','TB','Tabuk',false,1400,'road',22000,5800000),
('SA_DAMMAM_JUBAIL','dammam-to-jubail-petrochem','Dammam to Jubail Petrochemical Industrial Corridor','Dammam–Jubail Petrochem','active','industrial_connector','national','SA','ar','USD','SA','EP','Dammam','SA','EP','Jubail',false,95,'road',10400,2600000),
('SA_JEDDAH_MEDINA','ksa-jeddah-to-medina','Jeddah to Medina Infrastructure Corridor','Jeddah–Medina Hwy 15','active','industrial_connector','national','SA','ar','USD','SA','MK','Jeddah','SA','MD','Medina',false,420,'road',6400,1600000),
('QA_HAMAD_DOHA','qatar-port-hamad-to-doha','Port of Hamad to Doha Industrial City Corridor','Port Hamad–Doha IC','active','port_connector','flagship','QA','ar','USD','QA','DA','Hamad Port','QA','DA','Doha',false,40,'road',12800,3200000),
('QA_DOHA_MESAIEED','qatar-doha-to-mesaieed','Doha to Mesaieed Industrial City Corridor','Doha–Mesaieed IC','active','industrial_connector','national','QA','ar','USD','QA','DA','Doha','QA','DA','Mesaieed',false,45,'road',8600,2200000),
('QA_DOHA_RASLAFFAN','qatar-doha-to-ras-laffan','Doha to Ras Laffan LNG Industrial City Corridor','Doha–Ras Laffan LNG','active','industrial_connector','flagship','QA','ar','USD','QA','DA','Doha','QA','MU','Ras Laffan',false,80,'road',14600,3800000),
('KW_SHUAIBA_KUWAITCITY','kuwait-port-shuaiba-to-city','Port of Shuaiba to Kuwait City Industrial Corridor','Port Shuaiba–Kuwait City','active','port_connector','national','KW','ar','USD','KW','AH','Shuaiba','KW','KU','Kuwait City',false,45,'road',8200,2000000),
('OM_SOHAR_MUSCAT','oman-port-sohar-to-muscat','Port of Sohar to Muscat Industrial Corridor','Port Sohar–Muscat','active','port_connector','national','OM','ar','USD','OM','BA','Sohar','OM','MA','Muscat',false,220,'road',7200,1800000),
('OM_MUSCAT_SALALAH','oman-muscat-to-salalah','Oman Muscat to Salalah Highway Energy Corridor','Muscat–Salalah Oman','active','country_spine','national','OM','ar','USD','OM','MA','Muscat','OM','DH','Salalah',false,1010,'road',5400,1400000),
('XBRD_DAMMAM_MANAMA','gcc-xbrd-dammam-to-manama','Saudi Arabia–Bahrain King Fahd Causeway Cross-Border','Dammam–Manama Causeway XBRD','active','border_connector','flagship','SA','en','USD','SA','EP','Dammam','BH','CA','Manama',true,25,'road',11200,2800000),
('XBRD_DUBAI_DOHA','gcc-xbrd-dubai-to-doha','Dubai to Doha GCC Cross-Border Corridor','Dubai–Doha GCC XBRD','active','border_connector','national','AE','en','USD','AE','DU','Dubai','QA','DA','Doha',true,540,'road',8600,2200000),
('XBRD_RIYADH_KUWAIT','gcc-xbrd-riyadh-to-kuwait','Riyadh to Kuwait City GCC Cross-Border Energy Corridor','Riyadh–Kuwait City GCC XBRD','active','border_connector','national','SA','ar','USD','SA','RI','Riyadh','KW','KU','Kuwait City',true,600,'road',6200,1600000),
('XBRD_ABUDHABI_RIYADH','gcc-xbrd-abu-dhabi-to-riyadh','Abu Dhabi to Riyadh GCC Highway Cross-Border','Abu Dhabi–Riyadh GCC XBRD','active','border_connector','national','AE','en','USD','AE','AZ','Abu Dhabi','SA','RI','Riyadh',true,850,'road',7400,1900000)
on conflict (corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,78,74
from public.hc_corridors c join (
  values
  ('port-jebel-ali-to-dubai','permit','country','AE','UAE RTA Exceptional Load Permit','RTA requires permits for loads over 2.9m wide or 4.2m tall. Online via RTA portal. Processing: 1–3 days.'),
  ('port-jebel-ali-to-dubai','escort','country','AE','UAE Police Escort','Dubai Police escort required for loads over 4.0m wide. Abu Dhabi Police required over 4.5m wide on E11.'),
  ('uae-e11-dubai-to-abu-dhabi','curfew','country','AE','UAE Peak-Hour Curfew','Oversize loads banned on E11 7AM–9AM and 5PM–8PM. Night movement 10PM–5AM recommended for loads over 3.5m wide.'),
  ('ksa-hwy40-dammam-to-riyadh','permit','country','SA','MOMRA Oversize Permit','Loads over 2.5m wide or 4.0m tall require MOMRA permit. Processing: 3–7 days. Aramco deliveries need additional coordination.'),
  ('ksa-riyadh-to-neom','credential','state','SA-TB','NEOM Site Credential','NEOM Authority issues project-specific credentials. Pre-registration mandatory 72 hours ahead. Safety induction required for all convoy crew.'),
  ('ksa-riyadh-to-neom','escort','country','SA','NEOM Corridor Police Escort','Saudi Traffic Police escort mandatory for loads over 3.5m wide on Tabuk segment.'),
  ('qatar-doha-to-ras-laffan','credential','country','QA','QatarEnergy / Ras Laffan Site Access','QatarEnergy contractor card and site induction required. Gate registration minimum 72 hours in advance.'),
  ('qatar-doha-to-ras-laffan','permit','country','QA','Qatar MoI Special Transport Permit','MoI permit required for loads over 2.5m wide. Night movement 10PM–4AM required for loads over 4.0m.'),
  ('gcc-xbrd-dammam-to-manama','permit','country','SA','GCC Cross-Border Permit (King Fahd Causeway)','GCC Transport Certificate required. Max load width 3.5m at causeway. Advance coordination with Causeway Authority required.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict (corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'USD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,65
from public.hc_corridors c join (
  values
  ('port-jebel-ali-to-dubai','escort_rate',3.50,5.20,8.00,'km'),
  ('port-jebel-ali-to-dubai','urgent_fill_premium',2.00,3.50,5.50,'km'),
  ('uae-e11-dubai-to-abu-dhabi','escort_rate',3.20,4.80,7.50,'km'),
  ('uae-e11-dubai-to-abu-dhabi','operator_rate',3.80,5.50,8.50,'km'),
  ('ksa-hwy40-dammam-to-riyadh','escort_rate',2.80,4.20,6.50,'km'),
  ('ksa-hwy40-dammam-to-riyadh','operator_rate',3.40,5.00,7.80,'km'),
  ('ksa-port-jubail-to-riyadh','escort_rate',2.90,4.40,6.80,'km'),
  ('ksa-riyadh-to-neom','escort_rate',3.20,5.00,8.20,'km'),
  ('ksa-riyadh-to-neom','route_survey_rate',1200.00,2200.00,5000.00,'trip'),
  ('qatar-doha-to-ras-laffan','escort_rate',3.00,4.60,7.20,'km'),
  ('qatar-port-hamad-to-doha','escort_rate',3.20,5.00,7.80,'km'),
  ('oman-port-sohar-to-muscat','escort_rate',2.60,4.00,6.20,'km'),
  ('gcc-xbrd-dammam-to-manama','escort_rate',3.50,5.50,9.00,'km'),
  ('gcc-xbrd-dammam-to-manama','permit_cost',600.00,1200.00,3000.00,'permit')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join (
  values
  ('port-jebel-ali-to-dubai','uae-rta-permit',true,true,1.2,1.25),
  ('uae-e11-dubai-to-abu-dhabi','uae-rta-permit',true,true,1.2,1.25),
  ('uae-e11-dubai-to-abu-dhabi','adnoc-access',false,true,1.1,1.15),
  ('ksa-hwy40-dammam-to-riyadh','ksa-momra-permit',true,true,1.2,1.25),
  ('ksa-hwy40-dammam-to-riyadh','aramco-vendor',false,true,1.3,1.4),
  ('ksa-port-jubail-to-riyadh','ksa-momra-permit',true,true,1.2,1.25),
  ('ksa-port-jubail-to-riyadh','aramco-vendor',true,true,1.4,1.5),
  ('dammam-to-jubail-petrochem','aramco-vendor',true,true,1.45,1.55),
  ('ksa-riyadh-to-neom','neom-access',true,true,1.5,1.6),
  ('ksa-riyadh-to-neom','ksa-momra-permit',true,true,1.25,1.35),
  ('qatar-doha-to-ras-laffan','qatar-moi-permit',true,true,1.2,1.25),
  ('qatar-port-hamad-to-doha','qatar-moi-permit',true,true,1.2,1.25),
  ('gcc-xbrd-dammam-to-manama','gcc-transport-cert',true,true,1.15,1.2),
  ('gcc-xbrd-abu-dhabi-to-riyadh','gcc-transport-cert',true,true,1.15,1.2),
  ('gcc-xbrd-abu-dhabi-to-riyadh','uae-rta-permit',true,true,1.2,1.25),
  ('gcc-xbrd-abu-dhabi-to-riyadh','ksa-momra-permit',true,true,1.2,1.25),
  ('kuwait-port-shuaiba-to-city','kuwait-mow-permit',true,true,1.15,1.2)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict (corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Heavy Haul Escort & Permit Guide | Haul Command',
  'Escort requirements, permit rules, and operator intelligence for the '||c.name||'.',
  c.name||': Escort, Permit & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in('port-jebel-ali-to-dubai','uae-e11-dubai-to-abu-dhabi','ksa-hwy40-dammam-to-riyadh','ksa-port-jubail-to-riyadh','ksa-riyadh-to-neom','qatar-doha-to-ras-laffan','gcc-xbrd-dammam-to-manama')
on conflict (corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
