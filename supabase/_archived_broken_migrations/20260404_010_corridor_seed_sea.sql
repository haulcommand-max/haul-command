-- Haul Command — Southeast Asia Corridor Seed
-- Migration: 20260404_010_corridor_seed_sea.sql
begin;

insert into public.hc_credential_types(slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('singapore-vp1','Singapore VP1 Abnormal Load Permit','VP1 SG','SG','safety','LTA Singapore',365),
  ('thailand-sdp','Thailand Special Dimension Permit','SDP TH','TH','safety','Department of Highways',365),
  ('malaysia-jpj','Malaysia JPJ Oversize Vehicle Permit','JPJ MY','MY','safety','Jabatan Pengangkutan Jalan',365),
  ('indonesia-kemenhub','Indonesia Kemenhub Special Cargo Permit','Kemenhub ID','ID','safety','Ministry of Transportation',365),
  ('vietnam-bgt-permit','Vietnam Boộ Giao Thông Exceptional Load Permit','BGT VN','VN','safety','Ministry of Transport',365),
  ('philippines-ltfrb','Philippines LTFRB Special Permit','LTFRB PH','PH','safety','LTFRB',365),
  ('sea-asean-customs','ASEAN Cross-Border Customs Transit Document','ASEAN Transit','SG','customs','ASEAN Secretariat / National Customs',1095)
on conflict(slug) do nothing;

insert into public.hc_corridors(
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
-- Singapore hub
('SG_PORTSINGAPORE_JURONG','port-singapore-to-jurong-industrial','Port of Singapore to Jurong Industrial Estate Corridor','Singapore Port–Jurong','active','port_connector','flagship','SG','en','USD','SG','WR','Singapore Port','SG','WR','Jurong',false,25,'road',14200,3600000),
('SG_PORTSINGAPORE_JOHORBAHRU','singapore-to-johor-bahru-xbrd','Singapore to Johor Bahru Cross-Border Industrial Corridor (CIQ)','Singapore–JB XBRD','active','border_connector','flagship','SG','en','USD','SG','WR','Singapore','MY','JH','Johor Bahru',true,5,'road',18400,4400000),
-- Malaysia
('MY_JOHORBAHRU_KUALALUMPUR','malaysia-n1-johor-to-kl','Malaysia North-South Highway — Johor Bahru to Kuala Lumpur','JB–KL NSE','active','country_spine','flagship','MY','ms','USD','MY','JH','Johor Bahru','MY','KL','Kuala Lumpur',false,380,'road',13200,3200000),
('MY_KUALALUMPUR_PENANG','malaysia-nse-kl-to-penang','Malaysia North-South Highway — KL to George Town Penang','KL–Penang NSE','active','country_spine','national','MY','ms','USD','MY','KL','Kuala Lumpur','MY','PG','George Town',false,360,'road',9400,2200000),
('MY_PORTKLANG_KUALALUMPUR','port-klang-to-kl-malaysia','Port Klang to Kuala Lumpur Industrial Corridor','Port Klang–KL','active','port_connector','national','MY','ms','USD','MY','SL','Port Klang','MY','KL','Kuala Lumpur',false,40,'road',8800,2100000),
('MY_KUALALUMPUR_IPOH','malaysia-kl-to-ipoh','Malaysia KL to Ipoh Industrial Corridor (NSE)','KL–Ipoh NSE','active','industrial_connector','regional','MY','ms','USD','MY','KL','Kuala Lumpur','MY','PK','Ipoh',false,205,'road',6200,1500000),
-- Thailand
('TH_BANGKOKTH_LEMCHABANG','bangkok-to-laem-chabang-port','Bangkok to Laem Chabang Port Corridor (Highway 7/Route 34)','Bangkok–Laem Chabang','active','port_connector','flagship','TH','th','USD','TH','BK','Bangkok','TH','RY','Laem Chabang',false,130,'road',14800,3600000),
('TH_LEMCHABANG_BANGKOKTH','port-laem-chabang-to-eastern-seaboard','Laem Chabang to Eastern Seaboard Industrial Corridor','Laem Chabang–EEC','active','industrial_connector','flagship','TH','th','USD','TH','RY','Laem Chabang','TH','RY','Rayong',false,30,'road',11200,2800000),
('TH_BANGKOKTH_CHIANGMAI','thailand-highway1-bangkok-to-chiang-mai','Thailand Highway 1 — Bangkok to Chiang Mai','Bangkok–Chiang Mai Hwy 1','active','country_spine','national','TH','th','USD','TH','BK','Bangkok','TH','CM','Chiang Mai',false,696,'road',7400,1800000),
('TH_BANGKOKTH_KHLONGTOEI_DANAO','thailand-bangkok-to-dan-nao-border','Bangkok to Dan Nao Thailand–Laos Cross-Border Corridor','Bangkok–Laos Border TH','active','border_connector','national','TH','th','USD','TH','BK','Bangkok','LA','VT','Vientiane',true,605,'road',5200,1400000),
-- Indonesia
('ID_PORTANJUNGPRIOK_JAKARTA','jakarta-port-to-industrial-zones','Port of Tanjung Priok to Jakarta Industrial Zones','Tanjung Priok–Jakarta','active','port_connector','flagship','ID','id','USD','ID','JK','Tanjung Priok','ID','JK','Jakarta',false,15,'road',16400,4000000),
('ID_JAKARTA_SURABAYA','java-trans-jakarta-to-surabaya','Trans-Java Toll Road — Jakarta to Surabaya','Trans-Java Jakarta–Surabaya','active','country_spine','flagship','ID','id','USD','ID','JK','Jakarta','ID','JI','Surabaya',false,760,'road',12800,3200000),
('ID_PORTSURABAYA_KALIMANTAN','surabaya-to-kalimantan-mining','Surabaya to Kalimantan Mining Link (Tanjung Perak Port)','Surabaya–Kalimantan Mining','active','industrial_connector','national','ID','id','USD','ID','JI','Surabaya','ID','KT','Balikpapan',false,650,'road_barge',8400,2200000),
('ID_PORTBELAWAN_MEDANSUMATERA','port-belawan-to-medan-sumatra','Port of Belawan to Medan Industrial Corridor (Sumatra)','Port Belawan–Medan','active','port_connector','national','ID','id','USD','ID','SU','Belawan','ID','SU','Medan',false,25,'road',7200,1800000),
-- Vietnam
('VN_PORTCATVANG_HOCHIMINH','port-cat-lai-to-hcmc-industrial','Port of Cat Lai to Ho Chi Minh City Industrial Corridor','Port Cat Lai–HCMC','active','port_connector','flagship','VN','vi','USD','VN','SG','Cat Lai','VN','SG','Ho Chi Minh City',false,20,'road',13600,3400000),
('VN_HOCHIMINH_HANOI','vietnam-hcm-to-hanoi-corridor','Ho Chi Minh City to Hanoi North–South Corridor (QL-1)','HCMC–Hanoi QL-1','active','country_spine','national','VN','vi','USD','VN','SG','Ho Chi Minh City','VN','HN','Hanoi',false,1726,'road',8200,2000000),
('VN_PORTHAIPHONG_HANOI','port-haiphong-to-hanoi','Port of Haiphong to Hanoi Industrial Corridor','Port Haiphong–Hanoi','active','port_connector','national','VN','vi','USD','VN','HP','Haiphong','VN','HN','Hanoi',false,105,'road',9400,2400000),
-- Philippines
('PH_PORTMANILA_CLARK','philippines-manila-to-clark','Port of Manila to Clark Freeport Industrial Corridor','Manila–Clark Luzon','active','port_connector','national','PH','en','USD','PH','00','Manila','PH','03','Clark',false,80,'road',8600,2100000),
-- Cross-border SEA
('XBRD_SINGAPORE_BATAM','singapore-batam-sea-xbrd','Singapore to Batam Indonesia Cross-Border Industrial Link','Singapore–Batam XBRD','active','border_connector','national','SG','en','USD','SG','WR','Singapore','ID','RI','Batam',true,20,'road_barge',9200,2400000)
on conflict(corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,77,73
from public.hc_corridors c join(
  values
  ('port-singapore-to-jurong-industrial','permit','country','SG','Singapore LTA VP1 Permit','LTA requires VP1 permit for loads over 2.5m wide or 4.5m tall. Online application. Processing: 1–2 working days. Police escort required for loads over 3.5m wide.'),
  ('singapore-to-johor-bahru-xbrd','permit','country','MY','Malaysia JPJ Cross-Border Permit','JPJ permit required for abnormal loads entering Malaysia. Advance coordination with Malaysian Road Transport Department required for loads over 3.0m wide.'),
  ('bangkok-to-laem-chabang-port','permit','country','TH','Thailand DOH Special Dimension Permit','Department of Highways issues special permits for loads over 2.5m wide. Night movement required for loads over 3.0m wide on Highway 7. Processing: 3–5 days.'),
  ('jakarta-port-to-industrial-zones','permit','country','ID','Indonesia Kemenhub Special Cargo Permit','Ministry of Transportation issues angkutan barang khusus permits. Loads over 2.5m wide require permit. Jakarta police coordination required for loads over 3.5m wide.'),
  ('port-cat-lai-to-hcmc-industrial','permit','country','VN','Vietnam BGT Exceptional Load Permit','Ministry of Transport issues permits for loads exceeding legal limits. Ho Chi Minh City Department of Transport coordinates urban movements. Night movement preferred for loads over 3.5m wide.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'USD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,62
from public.hc_corridors c join(
  values
  ('port-singapore-to-jurong-industrial','escort_rate',3.50,5.00,7.80,'km'),
  ('singapore-to-johor-bahru-xbrd','escort_rate',2.80,4.20,6.50,'km'),
  ('malaysia-n1-johor-to-kl','escort_rate',1.60,2.50,3.90,'km'),
  ('bangkok-to-laem-chabang-port','escort_rate',1.80,2.80,4.40,'km'),
  ('bangkok-to-laem-chabang-port','operator_rate',2.20,3.40,5.20,'km'),
  ('jakarta-port-to-industrial-zones','escort_rate',1.40,2.20,3.50,'km'),
  ('trans-java-jakarta-to-surabaya','escort_rate',1.50,2.40,3.80,'km'),
  ('port-cat-lai-to-hcmc-industrial','escort_rate',1.30,2.10,3.30,'km'),
  ('port-haiphong-to-hanoi','escort_rate',1.40,2.20,3.50,'km')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join(
  values
  ('port-singapore-to-jurong-industrial','singapore-vp1',true,true,1.2,1.25),
  ('singapore-to-johor-bahru-xbrd','singapore-vp1',true,true,1.2,1.25),
  ('singapore-to-johor-bahru-xbrd','malaysia-jpj',true,true,1.2,1.25),
  ('malaysia-n1-johor-to-kl','malaysia-jpj',true,true,1.15,1.2),
  ('port-klang-to-kl-malaysia','malaysia-jpj',true,true,1.15,1.2),
  ('bangkok-to-laem-chabang-port','thailand-sdp',true,true,1.2,1.25),
  ('jakarta-port-to-industrial-zones','indonesia-kemenhub',true,true,1.2,1.25),
  ('trans-java-jakarta-to-surabaya','indonesia-kemenhub',true,true,1.15,1.2),
  ('port-cat-lai-to-hcmc-industrial','vietnam-bgt-permit',true,true,1.2,1.25),
  ('vietnam-hcm-to-hanoi-corridor','vietnam-bgt-permit',true,true,1.15,1.2),
  ('philippines-manila-to-clark','philippines-ltfrb',true,true,1.15,1.2),
  ('singapore-batam-sea-xbrd','singapore-vp1',true,true,1.15,1.2),
  ('singapore-batam-sea-xbrd','sea-asean-customs',false,true,1.1,1.15)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict(corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Heavy Haul Escort & Permit Guide | Haul Command',
  'Escort requirements, permits, and operator intelligence for the '||c.name||'.',
  c.name||': Escort, Permit & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in('port-singapore-to-jurong-industrial','singapore-to-johor-bahru-xbrd','malaysia-n1-johor-to-kl','bangkok-to-laem-chabang-port','jakarta-port-to-industrial-zones','port-cat-lai-to-hcmc-industrial','trans-java-jakarta-to-surabaya')
on conflict(corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
