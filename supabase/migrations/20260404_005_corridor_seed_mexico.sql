-- Haul Command Corridor OS — Mexico Corridor Seed
-- Migration: 20260404_005_corridor_seed_mexico.sql
-- Depends on: 20260404_004_corridor_seed_canada.sql
-- Coverage: 35 México corridors
begin;

-- Credential types
insert into public.hc_credential_types
  (slug, name, short_name, country_code, credential_family, issuing_authority, renewal_period_days)
values
  ('mexico-sct-permit','SCT Permit Operator License','SCT Operator','MX','safety','SICT',730),
  ('mexico-caat','Certificado de Aptitud Técnica','CAAT','MX','safety','SICT',365),
  ('mexico-aeo','Operador Económico Autorizado','AEO','MX','customs','SAT / ACEX',1095),
  ('mexico-c-tpat','C-TPAT Certified Carrier','C-TPAT','MX','customs','CBP',1095),
  ('mexico-pemex-access','PEMEX Facility Access Credential','PEMEX Access','MX','energy_site','PEMEX',365),
  ('mexico-pilot-car-state','Mexico State Pilot Car Authorization','MX Pilot Car','MX','pilot_operator','SCT Delegación',365)
on conflict (slug) do nothing;

-- Corridors
insert into public.hc_corridors (
  corridor_code, slug, name, short_name,
  status, corridor_type, tier, country_code,
  primary_language_code, currency_code,
  origin_country_code, origin_region_code, origin_city_name,
  destination_country_code, destination_region_code, destination_city_name,
  is_cross_border, distance_km, typical_mode,
  search_volume_estimate, commercial_value_estimate
) values
-- Cross-border flagships
('XBRD_LAREDOTX_NUEVOLAREDOMX','cross-border-laredo-nuevo-laredo',
 'Laredo TX – Nuevo Laredo NL Cross-Border NAFTA Corridor','Laredo–Nuevo Laredo XBRD',
 'active','border_connector','flagship','MX','es','USD',
 'US','TX','Laredo','MX','NL','Nuevo Laredo',true,5,'road',28000,6200000),
('XBRD_ELPASOTX_CDHJUAREZMX','cross-border-el-paso-ciudad-juarez',
 'El Paso TX – Ciudad Juárez CHIH Cross-Border Corridor','El Paso–Cd Juárez XBRD',
 'active','border_connector','flagship','MX','es','USD',
 'US','TX','El Paso','MX','CH','Ciudad Juárez',true,4,'road',21000,4800000),
('XBRD_SANANTONIOX_MONTERREYMX','cross-border-san-antonio-monterrey',
 'San Antonio TX – Monterrey NL NAFTA Corridor','San Antonio–Monterrey NAFTA',
 'active','border_connector','flagship','MX','es','USD',
 'US','TX','San Antonio','MX','NL','Monterrey',true,415,'road',18500,4200000),
('XBRD_NOGALESAZ_NOGALESMX','cross-border-nogales-az-mx',
 'Nogales AZ – Nogales SON Cross-Border Pacific Corridor','Nogales XBRD',
 'active','border_connector','national','MX','es','USD',
 'US','AZ','Nogales','MX','SO','Nogales',true,3,'road',11500,2600000),
('XBRD_BROWNSTX_MATAMORSMX','cross-border-brownsville-matamoros',
 'Brownsville TX – Matamoros TAM Gulf Corridor','Brownsville–Matamoros XBRD',
 'active','border_connector','national','MX','es','USD',
 'US','TX','Brownsville','MX','TM','Matamoros',true,4,'road',9800,2200000),
-- NAFTA Spine domestic
('MX_NUEVOLAREDONL_MONTERREYNL','nafta-spine-nuevo-laredo-to-monterrey',
 'NAFTA Spine – Nuevo Laredo to Monterrey (Autopista 85D)','Nuevo Laredo–Monterrey 85D',
 'active','country_spine','flagship','MX','es','MXN',
 'MX','NL','Nuevo Laredo','MX','NL','Monterrey',false,235,'road',16400,3800000),
('MX_MONTERREYNL_SALTILLOCOA','monterrey-to-saltillo-mx',
 'Monterrey to Saltillo Industrial Corridor (Autopista 40D)','Monterrey–Saltillo',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','NL','Monterrey','MX','CO','Saltillo',false,88,'road',10200,2400000),
('MX_SALTILLOCOA_TORREONCOAH','saltillo-to-torreon-coahuila',
 'Saltillo to Torreón Laguna Industrial Corridor','Saltillo–Torreón',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','CO','Saltillo','MX','CO','Torreón',false,287,'road',7800,1700000),
('MX_MONTERREYNL_MXCITYCMX','nafta-spine-monterrey-to-mexico-city',
 'NAFTA Spine – Monterrey to Mexico City (Autopista 57D)','Monterrey–CDMX NAFTA',
 'active','country_spine','flagship','MX','es','MXN',
 'MX','NL','Monterrey','MX','CM','Mexico City',false,985,'road',14800,3500000),
('MX_MXCITYCMX_PUEBLAPUE','mexico-city-to-puebla-mx',
 'Mexico City to Puebla Industrial Corridor (Autopista 150D)','CDMX–Puebla',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','CM','Mexico City','MX','PU','Puebla',false,130,'road',11400,2600000),
('MX_PUEBLAPUE_VERACRUZVER','puebla-to-veracruz-mx',
 'Puebla to Veracruz Port Corridor (MEX-150D)','Puebla–Veracruz',
 'active','port_connector','national','MX','es','MXN',
 'MX','PU','Puebla','MX','VE','Veracruz',false,340,'road',8600,2000000),
-- Bajío Auto Belt
('MX_MXCITYCMX_GUADALAJARAJAL','mexico-city-to-guadalajara-mx',
 'Mexico City to Guadalajara NAFTA Corridor (Autopista 15D)','CDMX–Guadalajara',
 'active','country_spine','flagship','MX','es','MXN',
 'MX','CM','Mexico City','MX','JA','Guadalajara',false,545,'road',12800,3000000),
('MX_QUERETAROQUE_MONTERREYNL','queretaro-to-monterrey-mx',
 'Querétaro to Monterrey Bajío Industrial Corridor','Querétaro–Monterrey',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','QR','Querétaro','MX','NL','Monterrey',false,620,'road',9200,2200000),
('MX_LEONGTO_QUERETAROQUE','leon-to-queretaro-bajio',
 'León to Querétaro Bajío Auto Belt (Autopista 45D)','León–Querétaro Bajío',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','GT','León','MX','QR','Querétaro',false,176,'road',8100,1900000),
('MX_AGUASCALIENTSAGO_LEONGTO','aguascalientes-to-leon-mx',
 'Aguascalientes to León Auto Manufacturing Corridor','Aguascalientes–León',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','AG','Aguascalientes','MX','GT','León',false,104,'road',6400,1500000),
('MX_GUADALAJARAJAL_QUERETAROQUE','guadalajara-to-queretaro-mx',
 'Guadalajara to Querétaro Technology & Auto Corridor','Guadalajara–Querétaro',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','JA','Guadalajara','MX','QR','Querétaro',false,330,'road',7600,1800000),
('MX_SANLPOTOSISSLP_MONTERREYNL','san-luis-potosi-to-monterrey-mx',
 'San Luis Potosí to Monterrey NAFTA Connector (Hwy 57D)','SLP–Monterrey',
 'active','country_spine','national','MX','es','MXN',
 'MX','SL','San Luis Potosí','MX','NL','Monterrey',false,446,'road',6900,1600000),
-- Gulf Energy
('MX_TAMPICOTAM_VERACRUZVER','tampico-to-veracruz-gulf-energy',
 'Tampico to Veracruz Gulf Energy Corridor (MEX-180)','Tampico–Veracruz Gulf',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','TM','Tampico','MX','VE','Veracruz',false,480,'road',7400,1900000),
('MX_VILLAHERMOSATAB_VERACRUZVER','villahermosa-to-veracruz-mx',
 'Villahermosa to Veracruz PEMEX Energy Corridor (MEX-180D)','Villahermosa–Veracruz',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','TA','Villahermosa','MX','VE','Veracruz',false,485,'road',6200,1700000),
('MX_PORTVERACRUZVER_MXCITYCMX','port-veracruz-to-mexico-city',
 'Port of Veracruz to Mexico City Inland Corridor (MEX-150D)','Port Veracruz–CDMX',
 'active','port_connector','flagship','MX','es','MXN',
 'MX','VE','Veracruz','MX','CM','Mexico City',false,465,'road',11800,2800000),
('MX_COATZACOALCOSVER_VERACRUZVER','coatzacoalcos-to-veracruz-energy',
 'Coatzacoalcos Petrochemical to Veracruz Port Corridor','Coatzacoalcos–Veracruz',
 'active','industrial_connector','regional','MX','es','MXN',
 'MX','VE','Coatzacoalcos','MX','VE','Veracruz',false,335,'road',5400,1500000),
-- Pacific Ports
('MX_PORTMANZANILLOCLM_GUADALAJARAJAL','port-manzanillo-to-guadalajara-mx',
 'Port of Manzanillo to Guadalajara Inland Corridor (MEX-54D)','Port Manzanillo–Guadalajara',
 'active','port_connector','flagship','MX','es','MXN',
 'MX','CL','Manzanillo','MX','JA','Guadalajara',false,330,'road',13200,3200000),
('MX_PORTMANZANILLOCLM_MXCITYCMX','port-manzanillo-to-mexico-city',
 'Port of Manzanillo to Mexico City Corridor','Port Manzanillo–CDMX',
 'active','port_connector','national','MX','es','MXN',
 'MX','CL','Manzanillo','MX','CM','Mexico City',false,875,'road',9400,2300000),
('MX_PORTLAZAROMIC_MONTERREYNL','port-lazaro-cardenas-to-monterrey',
 'Port of Lázaro Cárdenas to Monterrey Corridor','Port Lázaro Cárdenas–Monterrey',
 'active','port_connector','national','MX','es','MXN',
 'MX','MI','Lázaro Cárdenas','MX','NL','Monterrey',false,1180,'road',8100,2000000),
-- Northern Maquiladora Belt
('MX_MONTERREYNL_REYNOSATAM','monterrey-to-reynosa-mx',
 'Monterrey to Reynosa Maquiladora Corridor (Hwy 40/2)','Monterrey–Reynosa',
 'active','industrial_connector','national','MX','es','MXN',
 'MX','NL','Monterrey','MX','TM','Reynosa',false,220,'road',8800,2100000),
('MX_TIJUANABCN_ENSENADADBCN','tijuana-to-ensenada-bcn',
 'Tijuana to Ensenada Manufacturing & Port Corridor (MEX-1D)','Tijuana–Ensenada BCN',
 'active','industrial_connector','regional','MX','es','MXN',
 'MX','BC','Tijuana','MX','BC','Ensenada',false,110,'road',5800,1400000),
('MX_CDJUAREZCHIH_CHIHUAHUACHIH','ciudad-juarez-to-chihuahua-mx',
 'Ciudad Juárez to Chihuahua Industrial Corridor (MEX-45D)','Cd Juárez–Chihuahua',
 'active','industrial_connector','regional','MX','es','MXN',
 'MX','CH','Ciudad Juárez','MX','CH','Chihuahua',false,365,'road',6800,1600000),
('MX_HERMOSILLOSON_NOGALESSONMX','hermosillo-to-nogales-sonora',
 'Hermosillo to Nogales Auto & Border Corridor (MEX-15)','Hermosillo–Nogales SON',
 'active','industrial_connector','regional','MX','es','MXN',
 'MX','SO','Hermosillo','MX','SO','Nogales',false,271,'road',6200,1500000),
-- Monterrey Metro
('MX_MONTERREYNL_APODACANL','monterrey-to-apodaca-industrial',
 'Monterrey to Apodaca Industrial Park Connector','Monterrey–Apodaca NL',
 'active','metro_connector','regional','MX','es','MXN',
 'MX','NL','Monterrey','MX','NL','Apodaca',false,25,'road',5100,1300000),
('MX_MONTERREYNL_PESQUERIA','monterrey-to-pesqueria-industrial',
 'Monterrey to Pesquería Kia/BMW Auto Plant Corridor','Monterrey–Pesquería NL',
 'active','industrial_connector','regional','MX','es','MXN',
 'MX','NL','Monterrey','MX','NL','Pesquería',false,41,'road',6400,1600000),
-- Torreon–Chihuahua + SLP–CDMX
('MX_TORREONCOAH_CHIHUACACHIH','torreon-to-chihuahua-mx',
 'Torreón to Chihuahua Northern Industrial Corridor (Hwy 45)','Torreón–Chihuahua',
 'active','country_spine','national','MX','es','MXN',
 'MX','CO','Torreón','MX','CH','Chihuahua',false,472,'road',5800,1300000),
('MX_MXCITYCMX_TOLUCAMEX','mexico-city-to-toluca-mx',
 'Mexico City to Toluca Manufacturing Corridor (Autopista 15)','CDMX–Toluca',
 'active','industrial_connector','regional','MX','es','MXN',
 'MX','CM','Mexico City','MX','ME','Toluca',false,72,'road',5800,1400000)
on conflict (corridor_code) do nothing;

-- Requirements
insert into public.hc_corridor_requirements (
  corridor_id, requirement_type, jurisdiction_level, jurisdiction_code,
  title, summary, confidence_score, freshness_score
)
select c.id, r.rtype, r.jlevel, r.jcode, r.title, r.summary, 80, 75
from public.hc_corridors c
join (
  values
    ('cross-border-laredo-nuevo-laredo','permit','country','MX','Mexico Permiso Transporte Especializado',
     'SICT issues special transport permits. Loads exceeding 4.25m wide require pre-approval. Processing: 3–5 business days.'),
    ('cross-border-laredo-nuevo-laredo','escort','country','MX','Mexico Cross-Border Pilot Car Requirement',
     'Oversize loads on Mexican federal highways require certified pilot vehicle (vehículo guía). Operators must hold SICT authorization.'),
    ('cross-border-laredo-nuevo-laredo','credential','country','MX','C-TPAT / AEO Carrier Certification',
     'C-TPAT or AEO-certified carriers receive expedited border processing at Laredo International Bridge.'),
    ('nafta-spine-nuevo-laredo-to-monterrey','permit','state','MX-NL','Nuevo León SCT Permit',
     'NL SCT Delegación requires permit for loads exceeding 2.6m wide or 4.25m tall. Night restrictions for loads over 4.0m wide.'),
    ('nafta-spine-nuevo-laredo-to-monterrey','escort','state','MX-NL','Nuevo León Pilot Car Requirement',
     'Single escort for loads 2.6–4.0m wide. Dual escort above 4.0m. Police escort mandatory above 5.0m wide.'),
    ('nafta-spine-monterrey-to-mexico-city','curfew','state','MX-CM','Mexico City Oversize Curfew',
     'CDMX prohibits oversize loads on ring roads 6AM–9AM and 5PM–8PM. Periferico/Viaducto restricted to 10PM–5AM for loads over 4.0m wide.'),
    ('port-manzanillo-to-guadalajara-mx','route_survey','country','MX','Manzanillo Mountain Route Survey',
     'Survey required for loads over 4.0m wide on Sierra Madre segment (MEX-54D). SCT-registered survey companies required.'),
    ('villahermosa-to-veracruz-mx','credential','state','MX-TA','PEMEX Tabasco Facility Access',
     'All deliveries to PEMEX Tabasco facilities require PEMEX contractor credential. Processing: 5–10 business days.'),
    ('coatzacoalcos-to-veracruz-energy','credential','state','MX-VE','PEMEX Veracruz Site Credential',
     'PEMEX Veracruz refineries require access pass and IMSS registration for all delivery personnel.')
) as r(slug, rtype, jlevel, jcode, title, summary)
on r.slug = c.slug
on conflict (corridor_id, requirement_type, jurisdiction_level, jurisdiction_code, title) do nothing;

-- Pricing
insert into public.hc_corridor_pricing_obs (
  corridor_id, observation_type, currency_code,
  amount_min, amount_median, amount_max,
  price_unit, source_type, confidence_score
)
select c.id, pr.observation_type, pr.currency,
       pr.amount_min, pr.amount_median, pr.amount_max,
       pr.price_unit::public.hc_price_unit,
       'admin_entry'::public.hc_price_source, 65
from public.hc_corridors c
join (
  values
    ('cross-border-laredo-nuevo-laredo','escort_rate','USD',2.20,3.20,5.00,'mile'),
    ('cross-border-laredo-nuevo-laredo','permit_cost','USD',450.00,900.00,2200.00,'permit'),
    ('cross-border-laredo-nuevo-laredo','urgent_fill_premium','USD',1.50,2.50,4.00,'mile'),
    ('cross-border-el-paso-ciudad-juarez','escort_rate','USD',2.00,2.90,4.50,'mile'),
    ('cross-border-san-antonio-monterrey','escort_rate','USD',2.20,3.20,5.00,'mile'),
    ('cross-border-nogales-az-mx','escort_rate','USD',2.10,3.00,4.70,'mile'),
    ('nafta-spine-nuevo-laredo-to-monterrey','escort_rate','MXN',28.00,42.00,68.00,'km'),
    ('nafta-spine-nuevo-laredo-to-monterrey','operator_rate','MXN',35.00,52.00,82.00,'km'),
    ('nafta-spine-nuevo-laredo-to-monterrey','urgent_fill_premium','MXN',18.00,30.00,50.00,'km'),
    ('nafta-spine-monterrey-to-mexico-city','escort_rate','MXN',26.00,40.00,64.00,'km'),
    ('nafta-spine-monterrey-to-mexico-city','operator_rate','MXN',32.00,48.00,76.00,'km'),
    ('mexico-city-to-guadalajara-mx','escort_rate','MXN',24.00,38.00,60.00,'km'),
    ('port-manzanillo-to-guadalajara-mx','escort_rate','MXN',30.00,46.00,72.00,'km'),
    ('port-manzanillo-to-guadalajara-mx','route_survey_rate','MXN',8000.00,14000.00,28000.00,'trip'),
    ('port-veracruz-to-mexico-city','escort_rate','MXN',26.00,40.00,62.00,'km'),
    ('villahermosa-to-veracruz-mx','escort_rate','MXN',28.00,44.00,70.00,'km'),
    ('coatzacoalcos-to-veracruz-energy','escort_rate','MXN',26.00,40.00,64.00,'km'),
    ('monterrey-to-saltillo-mx','escort_rate','MXN',28.00,42.00,66.00,'km')
) as pr(slug, observation_type, currency, amount_min, amount_median, amount_max, price_unit)
on pr.slug = c.slug;

-- Credentials
insert into public.hc_corridor_credentials (
  corridor_id, credential_type_id, required, preferred, urgency_multiplier, premium_multiplier
)
select c.id, ct.id, cm.required, cm.preferred, cm.urgency_multiplier, cm.premium_multiplier
from public.hc_corridors c
join (
  values
    ('cross-border-laredo-nuevo-laredo','mexico-c-tpat',false,true,1.15,1.2),
    ('cross-border-laredo-nuevo-laredo','mexico-sct-permit',true,true,1.2,1.25),
    ('cross-border-el-paso-ciudad-juarez','mexico-sct-permit',true,true,1.2,1.25),
    ('cross-border-san-antonio-monterrey','mexico-sct-permit',true,true,1.2,1.25),
    ('cross-border-nogales-az-mx','mexico-sct-permit',true,true,1.15,1.2),
    ('nafta-spine-nuevo-laredo-to-monterrey','mexico-sct-permit',true,true,1.15,1.2),
    ('nafta-spine-nuevo-laredo-to-monterrey','mexico-pilot-car-state',true,true,1.1,1.15),
    ('nafta-spine-monterrey-to-mexico-city','mexico-sct-permit',true,true,1.15,1.2),
    ('villahermosa-to-veracruz-mx','mexico-pemex-access',true,true,1.35,1.4),
    ('coatzacoalcos-to-veracruz-energy','mexico-pemex-access',true,true,1.35,1.4),
    ('port-manzanillo-to-guadalajara-mx','mexico-sct-permit',true,true,1.2,1.25),
    ('port-veracruz-to-mexico-city','mexico-sct-permit',true,true,1.2,1.25)
) as cm(slug, cred_slug, required, preferred, urgency_multiplier, premium_multiplier)
on cm.slug = c.slug
join public.hc_credential_types ct on ct.slug = cm.cred_slug
on conflict (corridor_id, credential_type_id) do nothing;

-- Page stubs
insert into public.hc_corridor_pages (
  corridor_id, page_type, slug, canonical_url,
  title_tag, meta_description, h1, schema_type, indexable, publish_status, internal_link_score
)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,
  'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Transporte Especializado y Escoltas | Haul Command',
  'Guía completa de requisitos de escolta, permisos SCT y operadores para el '||c.name,
  c.name||': Guía de Escolta, Permiso y Fletes',
  'Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in (
  'cross-border-laredo-nuevo-laredo','cross-border-el-paso-ciudad-juarez',
  'nafta-spine-nuevo-laredo-to-monterrey','nafta-spine-monterrey-to-mexico-city',
  'port-manzanillo-to-guadalajara-mx','port-veracruz-to-mexico-city',
  'mexico-city-to-guadalajara-mx'
)
on conflict (corridor_id, page_type) do nothing;

select public.hc_score_all_corridors();
commit;
