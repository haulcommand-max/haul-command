-- Haul Command — China & NE Asia Corridor Seed
-- Migration: 20260404_013_corridor_seed_china_nea.sql
begin;

insert into public.hc_credential_types(slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('china-moc-permit','China MoC Super Load Transport Permit (远路运输许可证)','MoC Permit CN','CN','safety','Ministry of Communications / Provincial DOT',365),
  ('china-port-id','China Port Area Entry Pass','Port ID CN','CN','port_access','Port Authority / Customs',1825),
  ('korea-oversize','South Korea Oversize Vehicle Permit (일타 허가)','Korea Oversize KR','KR','safety','Ministry of Land, Infrastructure and Transport',365),
  ('japan-tokkyo','Japan Special Vehicle Permit (特車許可)','Tokkyō JP','JP','safety','Ministry of Land, Infrastructure & Transport',365),
  ('china-adr-equiv','China Hazardous Cargo Driver Qualification (危险品运输资格)','CHN Hazchem','CN','hazmat','Ministry of Transport',1825)
on conflict(slug) do nothing;

insert into public.hc_corridors(
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
-- China flagships
('CN_SHANGHAIPORT_BEIJING','g2-shanghai-to-beijing','G2 Jinghu Expressway — Shanghai to Beijing','Shanghai–Beijing G2','active','country_spine','flagship','CN','zh','USD','CN','SH','Shanghai','CN','BJ','Beijing',false,1213,'road',14800,3600000),
('CN_SHANGHAIPORT_WUHAN','g42-shanghai-to-wuhan','G42 Huning Expressway — Shanghai to Wuhan Industrial Corridor','Shanghai–Wuhan G42','active','country_spine','national','CN','zh','USD','CN','SH','Shanghai','CN','HU','Wuhan',false,832,'road',10400,2600000),
('CN_PORTTIANJIN_BEIJING','port-tianjin-to-beijing','Port of Tianjin to Beijing Inland Corridor (G1)','Port Tianjin–Beijing G1','active','port_connector','flagship','CN','zh','USD','CN','TJ','Tianjin','CN','BJ','Beijing',false,130,'road',13200,3300000),
('CN_PORTGUANGZHOU_SHENZHEN','port-guangzhou-to-shenzhen','Port of Guangzhou to Shenzhen Pearl River Delta Corridor','Guangzhou Port–Shenzhen PRD','active','port_connector','flagship','CN','zh','USD','CN','GD','Guangzhou','CN','GD','Shenzhen',false,130,'road',12800,3200000),
('CN_SHENZHEN_GUANGZHOU_WUHAN','g4-shenzhen-to-wuhan','G4 Jinggang’ao — Shenzhen to Wuhan Industrial Spine','Shenzhen–Wuhan G4','active','country_spine','national','CN','zh','USD','CN','GD','Shenzhen','CN','HU','Wuhan',false,965,'road',9800,2400000),
('CN_PORTQINGDAO_JINAN','port-qingdao-to-jinan','Port of Qingdao to Jinan Industrial Corridor (G22)','Port Qingdao–Jinan G22','active','port_connector','national','CN','zh','USD','CN','SD','Qingdao','CN','SD','Jinan',false,370,'road',8400,2100000),
('CN_CHONGQING_CHENGDU','g65-chongqing-to-chengdu','G65 — Chongqing to Chengdu Western China Industrial Corridor','Chongqing–Chengdu G65','active','industrial_connector','national','CN','zh','USD','CN','CQ','Chongqing','CN','SC','Chengdu',false,310,'road',8200,2000000),
('CN_WUHAN_XIAN','g70-wuhan-to-xian','G70 Fuyin Expressway — Wuhan to Xiʼan Energy & Logistics','Wuhan–XiʼAn G70','active','country_spine','national','CN','zh','USD','CN','HU','Wuhan','CN','SN','Xiʼan',false,850,'road',7200,1800000),
('CN_PORTDALIANDLC_SHENYANG','port-dalian-to-shenyang','Port of Dalian to Shenyang Northeast Industrial Corridor','Port Dalian–Shenyang','active','port_connector','national','CN','zh','USD','CN','LN','Dalian','CN','LN','Shenyang',false,398,'road',7800,2000000),
-- South Korea
('KR_BUSANPORT_SEOUL','korea-expressway-busan-to-seoul','Korea Gyeongbu Expressway — Busan to Seoul','Busan–Seoul Expressway','active','country_spine','flagship','KR','ko','USD','KR','BS','Busan','KR','SE','Seoul',false,428,'road',12400,3100000),
('KR_PORTINCHEON_SEOUL','port-incheon-to-seoul-korea','Port of Incheon to Seoul Industrial Corridor','Port Incheon–Seoul KR','active','port_connector','national','KR','ko','USD','KR','IC','Incheon','KR','SE','Seoul',false,45,'road',9800,2400000),
('KR_POHANG_GWANGYANG','korea-posco-pohang-to-gwangyang','POSCO Steel Corridor — Pohang to Gwangyang','POSCO Pohang–Gwangyang KR','active','industrial_connector','national','KR','ko','USD','KR','GB','Pohang','KR','JN','Gwangyang',false,250,'road',7200,2200000),
-- Japan
('JP_TOKYOPRT_NAGOYA','tomei-expressway-tokyo-to-nagoya','Tomei Expressway — Tokyo to Nagoya Auto & Industrial Corridor','Tokyo–Nagoya Tomei','active','country_spine','flagship','JP','ja','USD','JP','TK','Tokyo','JP','AC','Nagoya',false,366,'road',12200,3200000),
('JP_NAGOYA_OSAKA','meishin-nagoya-to-osaka','Meishin Expressway — Nagoya to Osaka Industrial Spine','Nagoya–Osaka Meishin','active','country_spine','national','JP','ja','USD','JP','AC','Nagoya','JP','OS','Osaka',false,187,'road',9400,2400000),
('JP_PORTOSAKA_KOBE','osaka-kobe-port-connector','Port of Osaka – Kobe Waterfront Industrial Connector','Port Osaka–Kobe JP','active','port_connector','national','JP','ja','USD','JP','OS','Osaka','JP','HY','Kobe',false,35,'road',8600,2200000),
-- Cross-border NE Asia
('XBRD_CHINABUSAN_KOREASEA','china-korea-sea-xbrd','China–South Korea Yellow Sea Cross-Border Cargo Link','China–Korea Yellow Sea XBRD','active','border_connector','national','CN','zh','USD','CN','SD','Qingdao','KR','IC','Incheon',true,950,'road_barge',9200,2400000)
on conflict(corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,78,74
from public.hc_corridors c join(
  values
  ('g2-shanghai-to-beijing','permit','country','CN','China MoC Super Load Permit','Ministry of Communications requires 进路许可 for loads exceeding legal limits. Provincial DOT permits required for each province traversed. Online via moc.gov.cn. Processing: 5–10 business days.'),
  ('g2-shanghai-to-beijing','escort','country','CN','China Highway Escort Requirements','Loads over 3.0m wide require pilot vehicle. Loads over 4.0m wide require front and rear escort. Night movement required on expressways for loads over 4.5m wide. Police coordination for loads over 5.0m.'),
  ('g2-shanghai-to-beijing','curfew','country','CN','China Expressway Peak-Hour Restriction','Oversize loads banned on G2 within Shanghai and Beijing urban sections 7AM–9AM and 5PM–8PM. Weekend daytime movement restricted on approach sections.'),
  ('korea-expressway-busan-to-seoul','permit','country','KR','Korea MOLIT Oversize Vehicle Permit','Ministry of Land, Infrastructure and Transport issues 일타 허가 for loads exceeding 2.5m wide or 4.0m tall. Online via doroone.or.kr. Processing: 1–3 days.'),
  ('tomei-expressway-tokyo-to-nagoya','permit','country','JP','Japan Special Vehicle Permit (特車許可)','MLIT issues 特車許可 for vehicles exceeding standard dimensions. Loads over 3.0m wide require escort. Expressway movement restricted during peak hours. Online via tokkyoportal.jp.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'USD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,62
from public.hc_corridors c join(
  values
  ('g2-shanghai-to-beijing','escort_rate',1.20,1.90,3.00,'km'),
  ('g2-shanghai-to-beijing','operator_rate',1.50,2.30,3.60,'km'),
  ('port-tianjin-to-beijing','escort_rate',1.30,2.00,3.20,'km'),
  ('port-guangzhou-to-shenzhen','escort_rate',1.40,2.20,3.40,'km'),
  ('g4-shenzhen-to-wuhan','escort_rate',1.20,1.90,3.00,'km'),
  ('g42-shanghai-to-wuhan','escort_rate',1.10,1.80,2.80,'km'),
  ('korea-expressway-busan-to-seoul','escort_rate',1.80,2.70,4.20,'km'),
  ('port-incheon-to-seoul-korea','escort_rate',1.70,2.60,4.00,'km'),
  ('tomei-expressway-tokyo-to-nagoya','escort_rate',2.20,3.20,4.80,'km'),
  ('meishin-nagoya-to-osaka','escort_rate',2.00,3.00,4.60,'km'),
  ('osaka-kobe-port-connector','escort_rate',2.10,3.10,4.70,'km')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join(
  values
  ('g2-shanghai-to-beijing','china-moc-permit',true,true,1.2,1.25),
  ('g42-shanghai-to-wuhan','china-moc-permit',true,true,1.15,1.2),
  ('port-tianjin-to-beijing','china-moc-permit',true,true,1.15,1.2),
  ('port-tianjin-to-beijing','china-port-id',true,true,1.2,1.25),
  ('port-guangzhou-to-shenzhen','china-moc-permit',true,true,1.15,1.2),
  ('port-guangzhou-to-shenzhen','china-port-id',true,true,1.2,1.25),
  ('port-qingdao-to-jinan','china-port-id',true,true,1.15,1.2),
  ('korea-expressway-busan-to-seoul','korea-oversize',true,true,1.15,1.2),
  ('port-incheon-to-seoul-korea','korea-oversize',true,true,1.15,1.2),
  ('korea-posco-pohang-to-gwangyang','korea-oversize',true,true,1.15,1.2),
  ('tomei-expressway-tokyo-to-nagoya','japan-tokkyo',true,true,1.2,1.25),
  ('meishin-nagoya-to-osaka','japan-tokkyo',true,true,1.2,1.25),
  ('osaka-kobe-port-connector','japan-tokkyo',true,true,1.15,1.2)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict(corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Heavy Haul & Exceptional Transport Guide | Haul Command',
  'Escort requirements, permits, and operator intelligence for the '||c.name||'.',
  c.name||': Escort, Permit & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in('g2-shanghai-to-beijing','port-tianjin-to-beijing','port-guangzhou-to-shenzhen','korea-expressway-busan-to-seoul','tomei-expressway-tokyo-to-nagoya','meishin-nagoya-to-osaka')
on conflict(corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
