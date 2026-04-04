-- Haul Command — South America Corridor Seed
-- Migration: 20260404_009_corridor_seed_south_america.sql
begin;

insert into public.hc_credential_types
  (slug,name,short_name,country_code,credential_family,issuing_authority,renewal_period_days)
values
  ('brazil-antt-permit','Brazil ANTT Special Cargo Transport Authorization','ANTT Auth BR','BR','safety','ANTT (National Land Transportation Agency)',365),
  ('brazil-dnit-aet','Brazil DNIT AET Exceptional Transport Order','DNIT AET BR','BR','safety','DNIT',365),
  ('chile-mop-permit','Chile MOP Oversize Road Permit','MOP CL','CL','safety','Ministerio de Obras Públicas',365),
  ('argentina-cnrt-permit','Argentina CNRT Special Cargo Permit','CNRT AR','AR','safety','CNRT',365),
  ('peru-minem-energy','Peru MINEM Energy Site Access','MINEM PE','PE','energy_site','Ministry of Energy & Mines',365),
  ('colombia-invias-permit','Colombia INVIAS Oversize Permit','INVIAS CO','CO','safety','INVIAS',365),
  ('latam-aduana-tir','LatAm Temporary Import (TIR / Admisión Temporal)','TIR LATAM','BR','customs','National Customs Authority',1095),
  ('chile-mining-access','Chile Mining Site Access Credential','Mining Access CL','CL','mining_site','Mine Operator / SERNAGEOMIN',365)
on conflict (slug) do nothing;

insert into public.hc_corridors(
  corridor_code,slug,name,short_name,status,corridor_type,tier,country_code,
  primary_language_code,currency_code,
  origin_country_code,origin_region_code,origin_city_name,
  destination_country_code,destination_region_code,destination_city_name,
  is_cross_border,distance_km,typical_mode,search_volume_estimate,commercial_value_estimate
) values
-- Brazil flagships
('BR_PORTOSANTOS_SAOPAULOBR','port-santos-to-sao-paulo','Port of Santos to São Paulo Industrial Corridor (Via Anchieta / Imigrantes)','Port Santos–São Paulo','active','port_connector','flagship','BR','pt','USD','BR','SP','Santos','BR','SP','São Paulo',false,75,'road',18400,4400000),
('BR_SAOPAULOBR_BELOHORIZONTEBR','br-116-sao-paulo-to-belo-horizonte','BR-116 — São Paulo to Belo Horizonte Industrial Corridor','São Paulo–Belo Horizonte BR-116','active','country_spine','flagship','BR','pt','USD','BR','SP','São Paulo','BR','MG','Belo Horizonte',false,586,'road',12800,3000000),
('BR_BELOHORIZONTEBR_PORTOUBUIUBR','caraja-railway-bh-to-tubarao','Belo Horizonte to Tubarão Port Mining Corridor','BH–Tubarão Mining','active','industrial_connector','national','BR','pt','USD','BR','MG','Belo Horizonte','BR','ES','Vitória',false,526,'road',9400,2600000),
('BR_PORTOSANTOS_CAMPINASBR','port-santos-to-campinas-br','Port of Santos to Campinas Logistics Corridor','Port Santos–Campinas','active','port_connector','national','BR','pt','USD','BR','SP','Santos','BR','SP','Campinas',false,156,'road',10200,2400000),
('BR_SAOPAULOBR_CURITIBABR','br-116-sao-paulo-to-curitiba','BR-116 / BR-376 — São Paulo to Curitiba Corridor','São Paulo–Curitiba','active','country_spine','national','BR','pt','USD','BR','SP','São Paulo','BR','PR','Curitiba',false,408,'road',9600,2200000),
('BR_CURITIBABR_PORTOALEGREBR','br-116-curitiba-to-porto-alegre','BR-116 — Curitiba to Porto Alegre Southern Corridor','Curitiba–Porto Alegre BR-116','active','country_spine','national','BR','pt','USD','BR','PR','Curitiba','BR','RS','Porto Alegre',false,714,'road',7800,1800000),
('BR_PORTOMANAOS_BELEMBR','amazon-manaus-to-belem-br','Amazon Industrial Corridor — Manaus to Belém (BR-319/BR-230)','Manaus–Belém Amazon','active','industrial_connector','national','BR','pt','USD','BR','AM','Manaus','BR','PA','Belém',false,2300,'road',4800,1600000),
('BR_PORTOVITORIA_SAOPAULOBR','br-101-vitoria-to-sao-paulo','BR-101 — Vitória to São Paulo Coastal Steel Corridor','Vitória–São Paulo BR-101','active','industrial_connector','national','BR','pt','USD','BR','ES','Vitória','BR','SP','São Paulo',false,880,'road',6400,1600000),
-- Chile
('CL_PORTVALPARAISO_SANTIAGOCL','port-valparaiso-to-santiago','Port of Valparaíso to Santiago Inland Corridor (Ruta 68)','Port Valparaíso–Santiago','active','port_connector','flagship','CL','es','USD','CL','VA','Valparaíso','CL','RM','Santiago',false,120,'road',12400,2900000),
('CL_SANTIAGOCL_CALAMACOCL','atacama-santiago-to-calama','Atacama Mining Corridor — Santiago to Calama (Ruta 5/24)','Santiago–Calama Mining','active','industrial_connector','flagship','CL','es','USD','CL','RM','Santiago','CL','AT','Calama',false,1660,'road',14800,4200000),
('CL_CALAMACOCL_ANTOFAGASTACL','calama-to-antofagasta-mining','Calama to Antofagasta Port Mining Corridor','Calama–Antofagasta Port','active','port_connector','flagship','CL','es','USD','CL','AT','Calama','CL','AN','Antofagasta',false,215,'road',11200,3200000),
('CL_PORTANTOFAGASTA_SAOPAULOBR','latam-xbrd-antofagasta-to-mendoza','Antofagasta to Mendoza Trans-Andean Corridor (Ruta 25)','Antofagasta–Mendoza XBRD','active','border_connector','national','CL','es','USD','CL','AN','Antofagasta','AR','ME','Mendoza',true,840,'road',6800,1800000),
-- Argentina
('AR_PORTBUENOSAIRESBR_ROSARIOAR','argentina-ruta9-buenos-aires-to-rosario','Argentina Ruta 9/A001 — Buenos Aires to Rosario','Buenos Aires–Rosario A001','active','country_spine','flagship','AR','es','USD','AR','BA','Buenos Aires','AR','SF','Rosario',false,300,'road',11400,2600000),
('AR_ROSARIOAR_CORDOWAAR','argentina-ruta9-rosario-to-cordoba','Argentina Ruta 9 — Rosario to Córdoba Industrial Corridor','Rosario–Córdoba AR Ruta 9','active','country_spine','national','AR','es','USD','AR','SF','Rosario','AR','CO','Córdoba',false,400,'road',8200,1900000),
('AR_MENDOZAAR_SANTIAGOARBR','andes-xbrd-mendoza-to-santiago','Andes Trans-Andean Cross-Border — Mendoza to Santiago (Paso Los Libertadores)','Mendoza–Santiago Andes XBRD','active','border_connector','flagship','AR','es','USD','AR','ME','Mendoza','CL','RM','Santiago',true,380,'road',14200,3800000),
('AR_PORTBUENOSAIRESBR_MONTEVIDEOUR','rioplatense-buenos-aires-to-montevideo','Buenos Aires to Montevideo Río de la Plata Corridor','Buenos Aires–Montevideo','active','border_connector','national','AR','es','USD','AR','BA','Buenos Aires','UY','MO','Montevideo',true,260,'road',7600,1800000),
-- Colombia
('CO_PORTBARRANQUILLA_BOGOTACO','colombia-ruta45-barranquilla-to-bogota','Colombia Ruta 45 — Barranquilla to Bogotá Corridor','Barranquilla–Bogotá CO','active','country_spine','national','CO','es','USD','CO','AT','Barranquilla','CO','CU','Bogotá',false,1020,'road',8800,2100000),
('CO_PORTCARTAGENA_BOGOTACO','colombia-port-cartagena-to-bogota','Port of Cartagena to Bogotá Inland Corridor','Port Cartagena–Bogotá','active','port_connector','national','CO','es','USD','CO','BO','Cartagena','CO','CU','Bogotá',false,1060,'road',9400,2300000),
-- Peru
('PE_PORTCALLAO_LIMAPE','peru-port-callao-to-lima','Port of Callao to Lima Industrial Corridor','Port Callao–Lima PE','active','port_connector','flagship','PE','es','USD','PE','LI','Callao','PE','LI','Lima',false,25,'road',11800,2800000),
('PE_LIMAPE_AREQUIPAPE','peru-panamericana-lima-to-arequipa','Peru Panamericana Sur — Lima to Arequipa Mining Corridor','Lima–Arequipa Panamerican','active','country_spine','national','PE','es','USD','PE','LI','Lima','PE','AR','Arequipa',false,1009,'road',6800,1900000)
on conflict (corridor_code) do nothing;

insert into public.hc_corridor_requirements(corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score)
select c.id,r.rt,r.jl,r.jc,r.ti,r.su,78,74
from public.hc_corridors c join (
  values
  ('port-santos-to-sao-paulo','permit','country','BR','Brazil ANTT AET Authorization','ANTT issues Autorização para Transporte de Cargas Excepcionais online. Loads over 2.6m wide or 4.4m tall require AET. Imigrantes / Via Anchieta ascent requires advance coordination.'),
  ('port-santos-to-sao-paulo','escort','country','BR','São Paulo State Escort Requirements','ARTESP requires escort for loads over 3.0m wide on São Paulo concession roads. Dual escort required above 4.5m. Night movement required for loads over 4.0m wide in urban São Paulo.'),
  ('port-valparaiso-to-santiago','permit','country','CL','Chile MOP Oversize Permit','Ministerio de Obras Públicas issues permisos de carga indivisible. Loads over 3.0m wide require MOP permit. Mountain route (Ruta 68) has grade restrictions for heavy loads.'),
  ('atacama-santiago-to-calama','permit','country','CL','Chile Ruta 5 Oversize Permit','Long-haul mining permit for Ruta 5 Norte. Annual permits available for regular mining operators under 4.0m wide. Individual permits required above 4.0m wide.'),
  ('atacama-santiago-to-calama','credential','country','CL','Chilean Mining Site Access','CODELCO, SQM, and BHP sites require site-specific access credentials. SERNAGEOMIN safety induction required for all site personnel.'),
  ('andes-xbrd-mendoza-to-santiago','permit','country','AR','Argentina CNRT Cross-Border Permit','CNRT issues habilitaciones for cross-border exceptional transport. Paso Los Libertadores has specific width restrictions (max 3.5m) due to tunnel and road profile limitations.'),
  ('andes-xbrd-mendoza-to-santiago','permit','country','CL','Chile Paso Los Libertadores Permit','Chilean permits required for loads entering via Paso Los Libertadores. Seasonal closures due to snowfall October–April. Alternative Paso Pehuenche available for summer.'),
  ('argentina-ruta9-buenos-aires-to-rosario','permit','country','AR','Argentina CNRT Special Cargo Permit','CNRT issues permisos especiales for loads exceeding 2.6m wide or 4.2m tall. Process: 3–5 business days via CNRT portal.'),
  ('colombia-port-cartagena-to-bogota','permit','country','CO','Colombia INVIAS Oversize Permit','INVIAS issues permisos de tránsito for oversize loads exceeding legal limits. Mountain routes (Andes segments) require route-specific engineering review for loads over 45 tonnes.')
) as r(slug,rt,jl,jc,ti,su) on r.slug=c.slug
on conflict (corridor_id,requirement_type,jurisdiction_level,jurisdiction_code,title) do nothing;

insert into public.hc_corridor_pricing_obs(corridor_id,observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,source_type,confidence_score)
select c.id,pr.obs,'USD',pr.lo,pr.med,pr.hi,pr.pu::public.hc_price_unit,'admin_entry'::public.hc_price_source,63
from public.hc_corridors c join (
  values
  ('port-santos-to-sao-paulo','escort_rate',1.80,2.80,4.40,'km'),
  ('port-santos-to-sao-paulo','operator_rate',2.20,3.40,5.20,'km'),
  ('port-santos-to-sao-paulo','urgent_fill_premium',1.20,2.00,3.20,'km'),
  ('br-116-sao-paulo-to-belo-horizonte','escort_rate',1.60,2.50,3.90,'km'),
  ('br-116-sao-paulo-to-curitiba','escort_rate',1.55,2.40,3.80,'km'),
  ('port-valparaiso-to-santiago','escort_rate',2.00,3.10,4.80,'km'),
  ('atacama-santiago-to-calama','escort_rate',2.40,3.60,5.60,'km'),
  ('atacama-santiago-to-calama','operator_rate',2.80,4.20,6.50,'km'),
  ('atacama-santiago-to-calama','route_survey_rate',800.00,1500.00,3500.00,'trip'),
  ('calama-to-antofagasta-mining','escort_rate',2.20,3.40,5.20,'km'),
  ('andes-xbrd-mendoza-to-santiago','escort_rate',2.60,4.00,6.20,'km'),
  ('andes-xbrd-mendoza-to-santiago','permit_cost',500.00,1100.00,2800.00,'permit'),
  ('argentina-ruta9-buenos-aires-to-rosario','escort_rate',1.40,2.20,3.40,'km'),
  ('colombia-port-cartagena-to-bogota','escort_rate',1.80,2.80,4.40,'km'),
  ('peru-port-callao-to-lima','escort_rate',1.60,2.50,3.90,'km'),
  ('peru-panamericana-lima-to-arequipa','escort_rate',1.80,2.80,4.50,'km')
) as pr(slug,obs,lo,med,hi,pu) on pr.slug=c.slug;

insert into public.hc_corridor_credentials(corridor_id,credential_type_id,required,preferred,urgency_multiplier,premium_multiplier)
select c.id,ct.id,cm.req,cm.pref,cm.urg,cm.prem
from public.hc_corridors c join (
  values
  ('port-santos-to-sao-paulo','brazil-dnit-aet',true,true,1.2,1.25),
  ('br-116-sao-paulo-to-belo-horizonte','brazil-antt-permit',true,true,1.15,1.2),
  ('br-116-sao-paulo-to-curitiba','brazil-antt-permit',true,true,1.15,1.2),
  ('port-santos-to-campinas-br','brazil-dnit-aet',true,true,1.15,1.2),
  ('port-valparaiso-to-santiago','chile-mop-permit',true,true,1.2,1.25),
  ('atacama-santiago-to-calama','chile-mop-permit',true,true,1.2,1.25),
  ('atacama-santiago-to-calama','chile-mining-access',true,true,1.35,1.45),
  ('calama-to-antofagasta-mining','chile-mop-permit',true,true,1.2,1.25),
  ('calama-to-antofagasta-mining','chile-mining-access',true,true,1.3,1.4),
  ('andes-xbrd-mendoza-to-santiago','argentina-cnrt-permit',true,true,1.2,1.25),
  ('andes-xbrd-mendoza-to-santiago','chile-mop-permit',true,true,1.2,1.25),
  ('argentina-ruta9-buenos-aires-to-rosario','argentina-cnrt-permit',true,true,1.15,1.2),
  ('colombia-port-cartagena-to-bogota','colombia-invias-permit',true,true,1.2,1.25),
  ('colombia-ruta45-barranquilla-to-bogota','colombia-invias-permit',true,true,1.15,1.2),
  ('peru-port-callao-to-lima','peru-minem-energy',false,true,1.1,1.15),
  ('peru-panamericana-lima-to-arequipa','peru-minem-energy',false,true,1.15,1.2)
) as cm(slug,cred_slug,req,pref,urg,prem) on cm.slug=c.slug
join public.hc_credential_types ct on ct.slug=cm.cred_slug
on conflict (corridor_id,credential_type_id) do nothing;

insert into public.hc_corridor_pages(corridor_id,page_type,slug,canonical_url,title_tag,meta_description,h1,schema_type,indexable,publish_status,internal_link_score)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Heavy Haul Escort & Permit Guide | Haul Command',
  'Escort requirements, transport permits, and operator intelligence for the '||c.name||'.',
  c.name||': Escort, Permit & Operator Guide','Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in(
  'port-santos-to-sao-paulo','port-valparaiso-to-santiago','atacama-santiago-to-calama',
  'calama-to-antofagasta-mining','andes-xbrd-mendoza-to-santiago',
  'argentina-ruta9-buenos-aires-to-rosario','colombia-port-cartagena-to-bogota','peru-port-callao-to-lima'
)
on conflict (corridor_id,page_type) do nothing;

select public.hc_score_all_corridors();
commit;
