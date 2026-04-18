-- Haul Command Corridor OS — EU Flagship Corridor Seed
-- Migration: 20260404_006_corridor_seed_eu.sql
-- Depends on: 20260404_005_corridor_seed_mexico.sql
-- Coverage: 40 EU corridors — Germany Autobahn, Rhine industrial, France A-routes,
--           Spain TERN, Benelux port connectors, Italy A-routes, Poland CEN-T,
--           Nordic industrial, cross-border EU flagships
-- Currency: EUR. Language: per country.

begin;

-- EU credential types
insert into public.hc_credential_types
  (slug, name, short_name, country_code, credential_family, issuing_authority, renewal_period_days)
values
  ('eu-exceptional-transport','EU Exceptional Transport Permit','SORT/ET','EU','safety','National Road Authority',365),
  ('adr-certificate','ADR Dangerous Goods Driver Certificate','ADR','EU','hazmat','National Authority',1825),
  ('germany-grossraum','Germany Groß- und Schwertransport Permit','GSTP DE','DE','safety','Landesbehörde',365),
  ('france-convoi-ex','France Convoi Exceptionnel Authorization','Conv. Ex. FR','FR','safety','DREAL',365),
  ('uk-stgo','UK Special Types General Order STGO','STGO UK','GB','safety','Driver & Vehicle Licensing Agency',365),
  ('benelux-escort','Benelux Escort Vehicle Operator','Benelux Escort','NL','pilot_operator','RDW / AWG',730),
  ('spain-transporte-especial','Spain Transporte Especial Permit','TE ES','ES','safety','Dirección General de Tráfico',365),
  ('italy-trasporto-eccezionale','Italy Trasporto Eccezionale Authorization','TE IT','IT','safety','Anas S.p.A.',365),
  ('poland-zezwolenie','Poland Zezwolenie na Przejazd Nienormatywny','ZPN PL','PL','safety','GDDKiA',365),
  ('port-eu-twic-equiv','EU Port Access Security Pass','EU Port Pass','EU','port_access','Port Authority',365)
on conflict (slug) do nothing;

-- EU Corridors
insert into public.hc_corridors (
  corridor_code, slug, name, short_name,
  status, corridor_type, tier, country_code,
  primary_language_code, currency_code,
  origin_country_code, origin_region_code, origin_city_name,
  destination_country_code, destination_region_code, destination_city_name,
  is_cross_border, distance_km, typical_mode,
  search_volume_estimate, commercial_value_estimate
) values

-- GERMANY (flagship)
('DE_HAMBURGDE_MUENICHDE','germany-a1-a9-hamburg-to-munich',
 'Germany A1/A9 Autobahn — Hamburg to Munich','Hamburg–Munich A1/A9',
 'active','country_spine','flagship','DE','de','EUR',
 'DE','HH','Hamburg','DE','BY','Munich',false,780,'road',16400,3800000),

('DE_DORTMUNDDE_FRANKFURTDE','germany-a45-ruhr-to-frankfurt',
 'Germany A45 Sauerland Route — Dortmund to Frankfurt','Dortmund–Frankfurt A45',
 'active','industrial_connector','national','DE','de','EUR',
 'DE','NW','Dortmund','DE','HE','Frankfurt',false,260,'road',9800,2200000),

('DE_DUISBURGDE_STUTTGARTDE','germany-a3-a81-rhine-to-schwaben',
 'Germany A3/A81 Rhine to Swabia — Duisburg to Stuttgart','Duisburg–Stuttgart',
 'active','industrial_connector','national','DE','de','EUR',
 'DE','NW','Duisburg','DE','BW','Stuttgart',false,330,'road',8600,2000000),

('DE_BREMENEDE_HANNOVERELE','germany-a2-bremen-to-hanover',
 'Germany A2 — Bremen to Hanover Logistics Corridor','Bremen–Hanover A2',
 'active','country_spine','national','DE','de','EUR',
 'DE','HB','Bremen','DE','NI','Hanover',false,120,'road',6200,1400000),

('DE_NUERNBERFGDE_MUNICHDE','germany-a9-nurnberg-to-munich',
 'Germany A9 — Nürnberg to Munich Auto & Logistics Corridor','Nürnberg–Munich A9',
 'active','industrial_connector','regional','DE','de','EUR',
 'DE','BY','Nürnberg','DE','BY','Munich',false,168,'road',5800,1300000),

('DE_HAMBURGDE_BERINDE','germany-a7-a24-hamburg-to-berlin',
 'Germany A7/A24 — Hamburg to Berlin','Hamburg–Berlin A24',
 'active','country_spine','national','DE','de','EUR',
 'DE','HH','Hamburg','DE','BE','Berlin',false,290,'road',8100,1900000),

('DE_BERINDE_DRESDENEDE','germany-a13-berlin-to-dresden',
 'Germany A13 — Berlin to Dresden Industrial Corridor','Berlin–Dresden A13',
 'active','industrial_connector','regional','DE','de','EUR',
 'DE','BE','Berlin','DE','SN','Dresden',false,195,'road',5400,1200000),

-- BENELUX / PORT CORRIDORS (flagship)
('NL_PORTROTTERDAMNL_EINDHOVENLE','benelux-rotterdam-to-eindhoven',
 'Port of Rotterdam to Eindhoven Logistics Corridor (A15/A16)','Rotterdam–Eindhoven',
 'active','port_connector','flagship','NL','nl','EUR',
 'NL','ZH','Rotterdam','NL','NB','Eindhoven',false,110,'road',14200,3200000),

('NL_PORTROTTERDAMNL_DUISBURGDE','rhine-corridor-rotterdam-to-duisburg',
 'Rhine Industrial Corridor — Rotterdam to Duisburg (A3/E35)','Rhine Rotterdam–Duisburg',
 'active','industrial_connector','flagship','NL','nl','EUR',
 'NL','ZH','Rotterdam','DE','NW','Duisburg',true,220,'road',18600,4400000),

('BE_PORTOFANTWERPBE_BRUSSELSBE','benelux-antwerp-to-brussels',
 'Port of Antwerp to Brussels Industrial Corridor (E19/A12)','Antwerp–Brussels',
 'active','port_connector','flagship','BE','nl','EUR',
 'BE','VAN','Antwerp','BE','BRU','Brussels',false,55,'road',12800,2900000),

('NL_PORTROTTERDAMNL_AMSTERDAMLE','netherlands-rotterdam-to-amsterdam',
 'Rotterdam to Amsterdam Port Logistics Corridor (A4)','Rotterdam–Amsterdam NL',
 'active','port_connector','national','NL','nl','EUR',
 'NL','ZH','Rotterdam','NL','NH','Amsterdam',false,75,'road',9200,2100000),

('BE_PORTOFANTWERPBE_LIEGEEBE','antwerp-to-liege-industrial',
 'Antwerp to Liège Steel & Chemical Corridor (E313)','Antwerp–Liège',
 'active','industrial_connector','national','BE','nl','EUR',
 'BE','VAN','Antwerp','BE','LIE','Liège',false,100,'road',6800,1600000),

-- FRANCE (flagship)
('FR_PORTLENEHAVRFR_PARISFR','france-a13-le-havre-to-paris',
 'Port of Le Havre to Paris Corridor (A13)','Le Havre–Paris A13',
 'active','port_connector','flagship','FR','fr','EUR',
 'FR','NOR','Le Havre','FR','IDF','Paris',false,200,'road',14800,3500000),

('FR_PARISFR_LYONFR','france-a6-paris-to-lyon',
 'France A6 — Paris to Lyon (Autoroute du Soleil)','Paris–Lyon A6',
 'active','country_spine','flagship','FR','fr','EUR',
 'FR','IDF','Paris','FR','ARA','Lyon',false,462,'road',12400,2900000),

('FR_LYONFR_MARSEILLFR','france-a7-lyon-to-marseille',
 'France A7 Autoroute Rhône — Lyon to Marseille','Lyon–Marseille A7',
 'active','country_spine','national','FR','fr','EUR',
 'FR','ARA','Lyon','FR','PAC','Marseille',false,315,'road',9600,2200000),

('FR_PORTMARSEILLFR_LYONFR','france-port-marseille-to-lyon',
 'Port of Marseille to Lyon Inland Corridor (A7)','Port Marseille–Lyon',
 'active','port_connector','national','FR','fr','EUR',
 'FR','PAC','Marseille','FR','ARA','Lyon',false,315,'road',8400,2000000),

('FR_PARISFR_STRASBORGFR','france-a4-paris-to-strasbourg',
 'France A4 — Paris to Strasbourg Industrial & Cross-Border','Paris–Strasbourg A4',
 'active','country_spine','national','FR','fr','EUR',
 'FR','IDF','Paris','FR','GES','Strasbourg',false,490,'road',7800,1800000),

('FR_BORDEAUXFR_PARISFR','france-a10-bordeaux-to-paris',
 'France A10 — Bordeaux to Paris Atlantic Corridor','Bordeaux–Paris A10',
 'active','country_spine','national','FR','fr','EUR',
 'FR','NAQ','Bordeaux','FR','IDF','Paris',false,586,'road',6800,1600000),

-- SPAIN (flagship)
('ES_BARCELONA_MADRIDES','spain-ap2-barcelona-to-madrid',
 'Spain AP-2/A-2 — Barcelona to Madrid','Barcelona–Madrid AP-2',
 'active','country_spine','flagship','ES','es','EUR',
 'ES','CT','Barcelona','ES','MD','Madrid',false,621,'road',14200,3300000),

('ES_PORTVALENCIAES_MADRIDES','spain-a3-valencia-port-to-madrid',
 'Port of Valencia to Madrid Inland Corridor (A-3)','Port Valencia–Madrid',
 'active','port_connector','flagship','ES','es','EUR',
 'ES','VC','Valencia','ES','MD','Madrid',false,364,'road',11600,2700000),

('ES_BILBAOPAISBASCO_MADRIDES','spain-ap68-a1-bilbao-to-madrid',
 'Spain AP-68/A-1 — Bilbao to Madrid TERN Corridor','Bilbao–Madrid AP-68',
 'active','country_spine','national','ES','es','EUR',
 'ES','PV','Bilbao','ES','MD','Madrid',false,396,'road',9200,2100000),

('ES_BARCELONA_FRONTIERFRANCES','spain-ap7-barcelona-to-french-border',
 'Spain AP-7 — Barcelona to French Border (La Jonquera)','Barcelona–La Jonquera AP-7',
 'active','country_spine','national','ES','es','EUR',
 'ES','CT','Barcelona','ES','CT','La Jonquera',false,140,'road',8800,2000000),

('ES_SEVILLAES_MADRIDES','spain-a4-seville-to-madrid',
 'Spain A-4 — Seville to Madrid South Corridor','Seville–Madrid A-4',
 'active','country_spine','national','ES','es','EUR',
 'ES','AN','Seville','ES','MD','Madrid',false,540,'road',7200,1700000),

-- ITALY (national)
('IT_MILANO_ROMAIT','italy-a1-milan-to-rome',
 'Italy A1 (Autostrada del Sole) — Milan to Rome','Milan–Rome A1',
 'active','country_spine','flagship','IT','it','EUR',
 'IT','LOM','Milan','IT','LAZ','Rome',false,572,'road',13600,3200000),

('IT_PORTGENOAIT_MILANOIT','italy-a7-a26-genoa-port-to-milan',
 'Port of Genoa to Milan Inland Corridor (A7/A26)','Port Genoa–Milan',
 'active','port_connector','flagship','IT','it','EUR',
 'IT','LIG','Genoa','IT','LOM','Milan',false,142,'road',11400,2700000),

('IT_MILANOIT_VENEZIAIT','italy-a4-milan-to-venice',
 'Italy A4 — Milan to Venice Veneto Industrial Corridor','Milan–Venice A4',
 'active','industrial_connector','national','IT','it','EUR',
 'IT','LOM','Milan','IT','VEN','Venice',false,270,'road',8800,2100000),

('IT_PORTTRIESTEAIT_MILANOIT','italy-a4-trieste-to-milan',
 'Port of Trieste to Milan Eastern Corridor (A4)','Port Trieste–Milan',
 'active','port_connector','national','IT','it','EUR',
 'IT','FVG','Trieste','IT','LOM','Milan',false,406,'road',7600,1800000),

('IT_MILANOIT_TURINOIT','italy-a4-milan-to-turin',
 'Italy A4 — Milan to Turin Auto Manufacturing Corridor','Milan–Turin A4',
 'active','industrial_connector','national','IT','it','EUR',
 'IT','LOM','Milan','IT','PIE','Turin',false,140,'road',7200,1700000),

-- POLAND / CEF (national)
('PL_GDANSKPL_WARSAWPL','poland-a1-gdansk-to-warsaw',
 'Poland A1/S7 — Gdańsk to Warsaw TEN-T Corridor','Gdańsk–Warsaw A1',
 'active','country_spine','national','PL','pl','EUR',
 'PL','PM','Gdańsk','PL','MZ','Warsaw',false,340,'road',8400,1900000),

('PL_WARSAWPL_KATOWICEPL','poland-a1-warsaw-to-katowice',
 'Poland A1 — Warsaw to Katowice Industrial Corridor','Warsaw–Katowice A1',
 'active','industrial_connector','national','PL','pl','EUR',
 'PL','MZ','Warsaw','PL','SL','Katowice',false,310,'road',6800,1600000),

('PL_PORTGDANSKPL_WARSAWPL','poland-port-gdansk-to-warsaw',
 'Port of Gdańsk to Warsaw Inland Corridor','Port Gdańsk–Warsaw',
 'active','port_connector','national','PL','pl','EUR',
 'PL','PM','Gdańsk','PL','MZ','Warsaw',false,340,'road',6200,1500000),

-- CROSS-BORDER EU FLAGSHIPS
('XBRD_AURICHDE_AMSTERDAMLE','rhine-delta-germany-to-netherlands',
 'Rhine Delta Cross-Border — Germany to Netherlands (A3/E35)','DE–NL Rhine Cross-Border',
 'active','border_connector','flagship','DE','de','EUR',
 'DE','NW','Cologne','NL','ZH','Rotterdam',true,245,'road',16800,4000000),

('XBRD_STRASBORGFR_KAISERSLAUTERDE','france-germany-upper-rhine-xbrd',
 'Upper Rhine Cross-Border — Strasbourg to Karlsruhe (A35/A5)','Strasbourg–Karlsruhe XBRD',
 'active','border_connector','national','FR','fr','EUR',
 'FR','GES','Strasbourg','DE','BW','Karlsruhe',true,80,'road',9200,2200000),

('XBRD_BARCELONAES_PERPIGNANFR','spain-france-pyrenees-xbrd',
 'Spain–France Pyrenees Cross-Border (AP-7/A9 La Jonquera)','Barcelona–Perpignan XBRD',
 'active','border_connector','flagship','ES','es','EUR',
 'ES','CT','Barcelona','FR','OCC','Perpignan',true,185,'road',14400,3400000),

('XBRD_MILANOIT_LYONFR','italy-france-mont-blanc-xbrd',
 'Italy–France Mont Blanc Cross-Border (A5/A40)','Milan–Lyon Mont Blanc XBRD',
 'active','border_connector','national','IT','it','EUR',
 'IT','LOM','Milan','FR','ARA','Lyon',true,315,'road',9800,2400000),

('XBRD_PORTOFANTWERPBE_LONDONUK','channel-antwerp-to-london',
 'Channel Corridor — Antwerp to London (E40 / Eurotunnel)','Antwerp–London Channel',
 'active','border_connector','flagship','BE','nl','EUR',
 'BE','VAN','Antwerp','GB','ENG','London',true,390,'road_barge',18200,4300000),

-- NORDIC
('SE_GOTHENBURGSE_STOCKHOLSE','sweden-e4-gothenburg-to-stockholm',
 'Sweden E4 — Gothenburg to Stockholm','Gothenburg–Stockholm E4',
 'active','country_spine','national','SE','sv','EUR',
 'SE','VGT','Gothenburg','SE','STO','Stockholm',false,470,'road',6800,1600000),

('NO_BERGENNO_OSLONO','norway-e16-bergen-to-oslo',
 'Norway E16 / E6 — Bergen to Oslo Energy & Industrial','Bergen–Oslo NO',
 'active','country_spine','national','NO','no','EUR',
 'NO','VL','Bergen','NO','VI','Oslo',false,463,'road',5400,1300000),

('FI_HELSINKIFI_TAMPEREFI','finland-e12-helsinki-to-tampere',
 'Finland E12 — Helsinki to Tampere Industrial Corridor','Helsinki–Tampere FI',
 'active','country_spine','regional','FI','fi','EUR',
 'FI','US','Helsinki','FI','PI','Tampere',false,175,'road',4200,1000000)

on conflict (corridor_code) do nothing;

-- Requirements
insert into public.hc_corridor_requirements (
  corridor_id, requirement_type, jurisdiction_level, jurisdiction_code,
  title, summary, confidence_score, freshness_score
)
select c.id, r.rtype, r.jlevel, r.jcode, r.title, r.summary, 83, 79
from public.hc_corridors c
join (
  values
    -- Germany
    ('germany-a1-a9-hamburg-to-munich','permit','country','DE','Germany Groß- und Schwertransportgenehmigung',
     'German Landesbehörden issue GSTP permits. Loads over 3.0m wide require escort. Loads over 4.0m wide require convoy planning. Autobahn movement restricted 6AM–10AM and 4PM–8PM on working days.'),
    ('germany-a1-a9-hamburg-to-munich','escort','country','DE','Germany Begleitfahrzeug Requirements',
     'Single escort (Begleitfahrzeug) for loads 3.0–4.5m wide. Dual escort above 4.5m. Police escort required above 5.0m. Night moves preferred for loads over 4.0m wide.'),
    ('germany-a1-a9-hamburg-to-munich','curfew','country','DE','German Autobahn Curfew',
     'Oversize load movement banned on German Autobahn 6AM–10AM and 4PM‘8PM Mon–Fri. Saturday movement banned until noon. No movement Sunday or public holidays without special permit.'),
    -- Rhine Rotterdam–Duisburg
    ('rhine-corridor-rotterdam-to-duisburg','permit','country','NL','Netherlands Ontheffing (Exceptional Transport Permit)',
     'RDW issues exceptional transport permits. Loads over 3.0m wide require permit. Cross-border loads require coordinated NL+DE permits. Online application via RDW portal.'),
    ('rhine-corridor-rotterdam-to-duisburg','escort','country','NL','Netherlands Begeleiding Requirements',
     'Single escort for loads 3.0–5.0m wide. Loads 5.0–8.0m wide require 2 escorts. Loads over 8.0m wide require police escort. Escort drivers must hold AWG certificate.'),
    -- France Le Havre–Paris
    ('france-a13-le-havre-to-paris','permit','country','FR','France Convoi Exceptionnel Authorization',
     'DREAL issues convoi exceptionnel permits in 1st, 2nd, or 3rd category. Cat 1: up to 3.0m wide. Cat 2: 3.0–4.0m. Cat 3: above 4.0m or 48t. Cat 3 requires DREAL advance approval.'),
    ('france-a13-le-havre-to-paris','escort','country','FR','France Pilot Car Requirements',
     'Cat 1 convoi: no escort required. Cat 2: 1 avant. Cat 3: 1 avant + 1 arrière. Loads over 5.0m wide require police escort and GPS tracking on pilot vehicles.'),
    -- Spain Barcelona–Madrid
    ('spain-ap2-barcelona-to-madrid','permit','country','ES','Spain Transporte Especial Permit',
     'DGT issues transporte especial permits. Loads over 4.0m wide require individual authorization. Standard permit valid 3 months. Autopistas toll fees apply to oversize loads.'),
    ('spain-ap2-barcelona-to-madrid','escort','country','ES','Spain Vehículo de Acompañamiento Requirements',
     'Single escort for loads 3.5‡5.0m wide. Dual escort above 5.0m. Front escort mandatory for loads over 30m length. Night moves required for loads over 4.5m wide in urban zones.'),
    -- France-Spain cross-border
    ('spain-france-pyrenees-xbrd','permit','country','ES','Spanish Export Transporte Especial',
     'Spanish loads require valid transporte especial before crossing. French DREAL permit must be obtained separately for French territory.'),
    ('spain-france-pyrenees-xbrd','permit','country','FR','French Convoi Exceptionnel at La Jonquera',
     'All oversize loads crossing La Jonquera must have Cat 2 or Cat 3 French convoi exceptionnel permit. Loads pending French permit held at Spanish side.'),
    -- Italy A1 Milan–Rome
    ('italy-a1-milan-to-rome','permit','country','IT','Italy Trasporto Eccezionale Authorization',
     'Anas S.p.A. issues trasporto eccezionale authorizations. Loads over 3.0m wide require escorted movement. Autostrada movement restricted during peak hours in urban sections.'),
    ('italy-a1-milan-to-rome','escort','country','IT','Italy Scorta Tecnica Requirements',
     'Scorta tecnica (technical escort) required for loads over 3.0m wide. Two escorts required over 4.5m. State police escort required for loads over 5.0m wide on autostrade.'),
    -- Benelux-UK Channel
    ('channel-antwerp-to-london','permit','country','BE','Belgium Exceptional Transport Permit',
     'Belgian SPW/AWV issues autorisation de transport exceptionnel. Loads transiting Belgium via E40 require permit per province. Processing: 3–5 days.'),
    ('channel-antwerp-to-london','permit','country','GB','UK STGO Special Types General Order',
     'Loads on UK roads require STGO notification or abnormal load order. Loads over 150 tonnes require Minister of Transport special order. Police escort mandatory above 5.0m wide.'),
    -- Poland
    ('poland-a1-gdansk-to-warsaw','permit','country','PL','Poland Zezwolenie na Przejazd Nienormatywny',
     'GDDKiA issues non-normative vehicle transit permits (ZPN). Category II–VII based on dimensions. Cat VII (max oversize) requires individual route approval and escort.'),
    ('poland-a1-gdansk-to-warsaw','escort','country','PL','Poland Pilotowanie Requirements',
     'Cat IV and above requires pilot vehicle (pojazd pilotujący). Dual escort for loads over 4.5m wide. Police escort or additional pilot cars for loads over 6.0m wide.')
) as r(slug, rtype, jlevel, jcode, title, summary)
on r.slug = c.slug
on conflict (corridor_id, requirement_type, jurisdiction_level, jurisdiction_code, title) do nothing;

-- Pricing (EUR, per km)
insert into public.hc_corridor_pricing_obs (
  corridor_id, observation_type, currency_code,
  amount_min, amount_median, amount_max,
  price_unit, source_type, confidence_score
)
select c.id, pr.observation_type, 'EUR',
  pr.amount_min, pr.amount_median, pr.amount_max,
  pr.price_unit::public.hc_price_unit,
  'admin_entry'::public.hc_price_source, 70
from public.hc_corridors c
join (
  values
    ('germany-a1-a9-hamburg-to-munich','escort_rate',1.80,2.60,4.00,'km'),
    ('germany-a1-a9-hamburg-to-munich','operator_rate',2.20,3.20,4.80,'km'),
    ('germany-a1-a9-hamburg-to-munich','permit_cost',800.00,1400.00,3500.00,'permit'),
    ('germany-a45-ruhr-to-frankfurt','escort_rate',1.70,2.50,3.80,'km'),
    ('germany-a3-a81-rhine-to-schwaben','escort_rate',1.75,2.55,3.90,'km'),
    ('rhine-corridor-rotterdam-to-duisburg','escort_rate',1.90,2.80,4.20,'km'),
    ('rhine-corridor-rotterdam-to-duisburg','operator_rate',2.30,3.40,5.10,'km'),
    ('rhine-corridor-rotterdam-to-duisburg','urgent_fill_premium',0.90,1.60,2.60,'km'),
    ('benelux-antwerp-to-brussels','escort_rate',1.80,2.60,4.00,'km'),
    ('benelux-rotterdam-to-eindhoven','escort_rate',1.85,2.70,4.10,'km'),
    ('france-a13-le-havre-to-paris','escort_rate',1.70,2.45,3.70,'km'),
    ('france-a13-le-havre-to-paris','permit_cost',600.00,1100.00,2800.00,'permit'),
    ('france-a6-paris-to-lyon','escort_rate',1.65,2.40,3.65,'km'),
    ('france-a7-lyon-to-marseille','escort_rate',1.60,2.35,3.60,'km'),
    ('spain-ap2-barcelona-to-madrid','escort_rate',1.50,2.20,3.40,'km'),
    ('spain-ap2-barcelona-to-madrid','permit_cost',450.00,900.00,2200.00,'permit'),
    ('spain-a3-valencia-port-to-madrid','escort_rate',1.45,2.15,3.30,'km'),
    ('spain-france-pyrenees-xbrd','escort_rate',1.80,2.70,4.20,'km'),
    ('spain-france-pyrenees-xbrd','permit_cost',900.00,1700.00,4000.00,'permit'),
    ('italy-a1-milan-to-rome','escort_rate',1.60,2.35,3.60,'km'),
    ('italy-a7-a26-genoa-port-to-milan','escort_rate',1.65,2.40,3.70,'km'),
    ('channel-antwerp-to-london','escort_rate',2.20,3.20,5.00,'km'),
    ('channel-antwerp-to-london','urgent_fill_premium',1.20,2.00,3.40,'km'),
    ('poland-a1-gdansk-to-warsaw','escort_rate',1.10,1.80,2.80,'km'),
    ('rhine-delta-germany-to-netherlands','escort_rate',1.85,2.75,4.20,'km'),
    ('france-germany-upper-rhine-xbrd','escort_rate',1.90,2.80,4.30,'km')
) as pr(slug, observation_type, amount_min, amount_median, amount_max, price_unit)
on pr.slug = c.slug;

-- Credential mappings
insert into public.hc_corridor_credentials (
  corridor_id, credential_type_id, required, preferred, urgency_multiplier, premium_multiplier
)
select c.id, ct.id, cm.required, cm.preferred, cm.urgency_multiplier, cm.premium_multiplier
from public.hc_corridors c
join (
  values
    ('germany-a1-a9-hamburg-to-munich','germany-grossraum',true,true,1.2,1.25),
    ('germany-a1-a9-hamburg-to-munich','eu-exceptional-transport',false,true,1.0,1.1),
    ('germany-a45-ruhr-to-frankfurt','germany-grossraum',true,true,1.15,1.2),
    ('germany-a3-a81-rhine-to-schwaben','germany-grossraum',true,true,1.15,1.2),
    ('rhine-corridor-rotterdam-to-duisburg','benelux-escort',true,true,1.2,1.25),
    ('rhine-corridor-rotterdam-to-duisburg','germany-grossraum',true,true,1.2,1.25),
    ('benelux-antwerp-to-brussels','benelux-escort',true,true,1.15,1.2),
    ('benelux-rotterdam-to-eindhoven','benelux-escort',true,true,1.15,1.2),
    ('france-a13-le-havre-to-paris','france-convoi-ex',true,true,1.2,1.25),
    ('france-a6-paris-to-lyon','france-convoi-ex',true,true,1.15,1.2),
    ('france-a7-lyon-to-marseille','france-convoi-ex',true,true,1.15,1.2),
    ('france-a4-paris-to-strasbourg','france-convoi-ex',true,true,1.15,1.2),
    ('spain-ap2-barcelona-to-madrid','spain-transporte-especial',true,true,1.15,1.2),
    ('spain-a3-valencia-port-to-madrid','spain-transporte-especial',true,true,1.15,1.2),
    ('spain-ap68-a1-bilbao-to-madrid','spain-transporte-especial',true,true,1.15,1.2),
    ('spain-france-pyrenees-xbrd','spain-transporte-especial',true,true,1.2,1.25),
    ('spain-france-pyrenees-xbrd','france-convoi-ex',true,true,1.2,1.25),
    ('italy-a1-milan-to-rome','italy-trasporto-eccezionale',true,true,1.15,1.2),
    ('italy-a7-a26-genoa-port-to-milan','italy-trasporto-eccezionale',true,true,1.15,1.2),
    ('italy-a4-milan-to-venice','italy-trasporto-eccezionale',true,true,1.1,1.15),
    ('poland-a1-gdansk-to-warsaw','poland-zezwolenie',true,true,1.1,1.15),
    ('channel-antwerp-to-london','benelux-escort',true,true,1.2,1.25),
    ('channel-antwerp-to-london','uk-stgo',true,true,1.25,1.3),
    ('rhine-delta-germany-to-netherlands','germany-grossraum',true,true,1.2,1.25),
    ('rhine-delta-germany-to-netherlands','benelux-escort',true,true,1.2,1.25)
) as cm(slug, cred_slug, required, preferred, urgency_multiplier, premium_multiplier)
on cm.slug = c.slug
join public.hc_credential_types ct on ct.slug = cm.cred_slug
on conflict (corridor_id, credential_type_id) do nothing;

-- Page stubs for flagship EU corridors
insert into public.hc_corridor_pages (
  corridor_id, page_type, slug, canonical_url,
  title_tag, meta_description, h1, schema_type, indexable, publish_status, internal_link_score
)
select c.id,'overview'::public.hc_corridor_page_type,c.slug,
  'https://haulcommand.com/corridors/'||c.slug,
  c.name||' — Exceptional Transport, Escorts & Permits | Haul Command',
  'Complete escort requirements, permit rules, and operator coverage for the '||c.name||'.',
  c.name||': Escort, Permit & Operator Guide',
  'Service',true,'published'::public.hc_publish_status,88
from public.hc_corridors c
where c.slug in (
  'germany-a1-a9-hamburg-to-munich',
  'rhine-corridor-rotterdam-to-duisburg',
  'benelux-antwerp-to-brussels',
  'france-a13-le-havre-to-paris',
  'france-a6-paris-to-lyon',
  'spain-ap2-barcelona-to-madrid',
  'italy-a1-milan-to-rome',
  'italy-a7-a26-genoa-port-to-milan',
  'channel-antwerp-to-london',
  'spain-france-pyrenees-xbrd'
)
on conflict (corridor_id, page_type) do nothing;

select public.hc_score_all_corridors();
commit;
