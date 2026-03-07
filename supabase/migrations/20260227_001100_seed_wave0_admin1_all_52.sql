-- ============================================================
-- WAVE 0: ADMIN1 JURISDICTION SEEDING — ALL 52 COUNTRIES
-- Spec: AG-AUTH-SEED-52-001
-- Uses INSERT ... ON CONFLICT DO UPDATE (upsert)
-- ============================================================
begin;

-- Helper: generate slug from name
create or replace function public.slugify(text) returns text as $$
  select lower(regexp_replace(regexp_replace($1, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
$$ language sql immutable;

-- ────────────────────────────────────────────────────────────
-- STEP 1: Seed country-level rows for all 52 countries
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, name, slug)
values
  ('country','US','United States','us'),
  ('country','CA','Canada','ca'),
  ('country','AU','Australia','au'),
  ('country','GB','United Kingdom','gb'),
  ('country','NZ','New Zealand','nz'),
  ('country','IE','Ireland','ie'),
  ('country','ZA','South Africa','za'),
  ('country','NL','Netherlands','nl'),
  ('country','DE','Germany','de'),
  ('country','SE','Sweden','se'),
  ('country','NO','Norway','no'),
  ('country','DK','Denmark','dk'),
  ('country','FI','Finland','fi'),
  ('country','BE','Belgium','be'),
  ('country','AT','Austria','at'),
  ('country','CH','Switzerland','ch'),
  ('country','ES','Spain','es'),
  ('country','FR','France','fr'),
  ('country','IT','Italy','it'),
  ('country','PT','Portugal','pt'),
  ('country','PL','Poland','pl'),
  ('country','CZ','Czech Republic','cz'),
  ('country','SK','Slovakia','sk'),
  ('country','HU','Hungary','hu'),
  ('country','SI','Slovenia','si'),
  ('country','EE','Estonia','ee'),
  ('country','LV','Latvia','lv'),
  ('country','LT','Lithuania','lt'),
  ('country','HR','Croatia','hr'),
  ('country','RO','Romania','ro'),
  ('country','BG','Bulgaria','bg'),
  ('country','GR','Greece','gr'),
  ('country','TR','Turkey','tr'),
  ('country','AE','United Arab Emirates','ae'),
  ('country','SA','Saudi Arabia','sa'),
  ('country','QA','Qatar','qa'),
  ('country','KW','Kuwait','kw'),
  ('country','OM','Oman','om'),
  ('country','BH','Bahrain','bh'),
  ('country','SG','Singapore','sg'),
  ('country','MY','Malaysia','my'),
  ('country','JP','Japan','jp'),
  ('country','KR','South Korea','kr'),
  ('country','CL','Chile','cl'),
  ('country','MX','Mexico','mx'),
  ('country','BR','Brazil','br'),
  ('country','AR','Argentina','ar'),
  ('country','CO','Colombia','co'),
  ('country','PE','Peru','pe'),
  ('country','UY','Uruguay','uy'),
  ('country','PA','Panama','pa'),
  ('country','CR','Costa Rica','cr')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 2: US States + Territories (56 rows)
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug, lat, lng)
values
  ('admin1','US','AL','Alabama','alabama',32.377716,-86.300568),
  ('admin1','US','AK','Alaska','alaska',58.301598,-134.420212),
  ('admin1','US','AZ','Arizona','arizona',33.448143,-112.096962),
  ('admin1','US','AR','Arkansas','arkansas',34.746613,-92.288986),
  ('admin1','US','CA','California','california',38.576668,-121.493629),
  ('admin1','US','CO','Colorado','colorado',39.739227,-104.984856),
  ('admin1','US','CT','Connecticut','connecticut',41.764046,-72.682198),
  ('admin1','US','DE','Delaware','delaware',39.157307,-75.519722),
  ('admin1','US','FL','Florida','florida',30.438118,-84.281296),
  ('admin1','US','GA','Georgia','georgia',33.749027,-84.388229),
  ('admin1','US','HI','Hawaii','hawaii',21.307442,-157.857376),
  ('admin1','US','ID','Idaho','idaho',43.617775,-116.199722),
  ('admin1','US','IL','Illinois','illinois',39.798363,-89.654961),
  ('admin1','US','IN','Indiana','indiana',39.768623,-86.162643),
  ('admin1','US','IA','Iowa','iowa',41.591087,-93.603729),
  ('admin1','US','KS','Kansas','kansas',39.048191,-95.677956),
  ('admin1','US','KY','Kentucky','kentucky',38.186722,-84.875374),
  ('admin1','US','LA','Louisiana','louisiana',30.457069,-91.187393),
  ('admin1','US','ME','Maine','maine',44.307167,-69.781693),
  ('admin1','US','MD','Maryland','maryland',38.978764,-76.490936),
  ('admin1','US','MA','Massachusetts','massachusetts',42.358162,-71.063698),
  ('admin1','US','MI','Michigan','michigan',42.733635,-84.555328),
  ('admin1','US','MN','Minnesota','minnesota',44.955097,-93.102211),
  ('admin1','US','MS','Mississippi','mississippi',32.303848,-90.182106),
  ('admin1','US','MO','Missouri','missouri',38.579201,-92.172935),
  ('admin1','US','MT','Montana','montana',46.585709,-112.018417),
  ('admin1','US','NE','Nebraska','nebraska',40.808075,-96.699654),
  ('admin1','US','NV','Nevada','nevada',39.163914,-119.766121),
  ('admin1','US','NH','New Hampshire','new-hampshire',43.206898,-71.537994),
  ('admin1','US','NJ','New Jersey','new-jersey',40.220596,-74.769913),
  ('admin1','US','NM','New Mexico','new-mexico',35.68224,-105.939728),
  ('admin1','US','NY','New York','new-york',42.652843,-73.757874),
  ('admin1','US','NC','North Carolina','north-carolina',35.78043,-78.639099),
  ('admin1','US','ND','North Dakota','north-dakota',46.82085,-100.783318),
  ('admin1','US','OH','Ohio','ohio',39.961346,-82.999069),
  ('admin1','US','OK','Oklahoma','oklahoma',35.492207,-97.503342),
  ('admin1','US','OR','Oregon','oregon',44.938461,-123.030403),
  ('admin1','US','PA','Pennsylvania','pennsylvania',40.264378,-76.883598),
  ('admin1','US','RI','Rhode Island','rhode-island',41.830914,-71.414963),
  ('admin1','US','SC','South Carolina','south-carolina',34.000343,-81.033211),
  ('admin1','US','SD','South Dakota','south-dakota',44.367031,-100.346405),
  ('admin1','US','TN','Tennessee','tennessee',36.16581,-86.784241),
  ('admin1','US','TX','Texas','texas',30.27467,-97.740349),
  ('admin1','US','UT','Utah','utah',40.777477,-111.888237),
  ('admin1','US','VT','Vermont','vermont',44.262436,-72.580536),
  ('admin1','US','VA','Virginia','virginia',37.538857,-77.43364),
  ('admin1','US','WA','Washington','washington',47.035805,-122.905014),
  ('admin1','US','WV','West Virginia','west-virginia',38.336246,-81.612328),
  ('admin1','US','WI','Wisconsin','wisconsin',43.074684,-89.384445),
  ('admin1','US','WY','Wyoming','wyoming',41.140259,-104.820236),
  -- Territories
  ('admin1','US','DC','District of Columbia','district-of-columbia',38.9072,-77.0369),
  ('admin1','US','PR','Puerto Rico','puerto-rico',18.4655,-66.1057),
  ('admin1','US','GU','Guam','guam',13.4443,144.7937),
  ('admin1','US','VI','U.S. Virgin Islands','us-virgin-islands',18.3358,-64.8963),
  ('admin1','US','AS','American Samoa','american-samoa',-14.271,-170.132),
  ('admin1','US','MP','Northern Mariana Islands','northern-mariana-islands',15.0979,145.6739)
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, lat = excluded.lat, lng = excluded.lng, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 3: Canada Provinces + Territories (13 rows)
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','CA','AB','Alberta','alberta'),
  ('admin1','CA','BC','British Columbia','british-columbia'),
  ('admin1','CA','MB','Manitoba','manitoba'),
  ('admin1','CA','NB','New Brunswick','new-brunswick'),
  ('admin1','CA','NL','Newfoundland and Labrador','newfoundland-and-labrador'),
  ('admin1','CA','NS','Nova Scotia','nova-scotia'),
  ('admin1','CA','ON','Ontario','ontario'),
  ('admin1','CA','PE','Prince Edward Island','prince-edward-island'),
  ('admin1','CA','QC','Quebec','quebec'),
  ('admin1','CA','SK','Saskatchewan','saskatchewan'),
  ('admin1','CA','NT','Northwest Territories','northwest-territories'),
  ('admin1','CA','NU','Nunavut','nunavut'),
  ('admin1','CA','YT','Yukon','yukon')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 4: Australia States + Territories (8 rows)
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','AU','NSW','New South Wales','new-south-wales'),
  ('admin1','AU','VIC','Victoria','victoria'),
  ('admin1','AU','QLD','Queensland','queensland'),
  ('admin1','AU','WA','Western Australia','western-australia'),
  ('admin1','AU','SA','South Australia','south-australia'),
  ('admin1','AU','TAS','Tasmania','tasmania'),
  ('admin1','AU','ACT','Australian Capital Territory','australian-capital-territory'),
  ('admin1','AU','NT','Northern Territory','northern-territory')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 5: United Kingdom (4 rows)
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','GB','ENG','England','england'),
  ('admin1','GB','SCT','Scotland','scotland'),
  ('admin1','GB','WLS','Wales','wales'),
  ('admin1','GB','NIR','Northern Ireland','northern-ireland')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 6: EU / EEA / EFTA Admin1 (50+ rows)
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  -- Netherlands
  ('admin1','NL','NL-NH','North Holland','north-holland'),
  ('admin1','NL','NL-ZH','South Holland','south-holland'),
  ('admin1','NL','NL-NB','North Brabant','north-brabant'),
  ('admin1','NL','NL-GE','Gelderland','gelderland'),
  ('admin1','NL','NL-UT','Utrecht','utrecht'),
  -- Germany
  ('admin1','DE','DE-BW','Baden-Württemberg','baden-wurttemberg'),
  ('admin1','DE','DE-BY','Bavaria','bavaria'),
  ('admin1','DE','DE-NW','North Rhine-Westphalia','north-rhine-westphalia'),
  ('admin1','DE','DE-HE','Hesse','hesse'),
  ('admin1','DE','DE-NI','Lower Saxony','lower-saxony'),
  -- Sweden
  ('admin1','SE','SE-AB','Stockholm County','stockholm-county'),
  ('admin1','SE','SE-O','Västra Götaland','vastra-gotaland'),
  ('admin1','SE','SE-M','Skåne County','skane-county'),
  -- Norway
  ('admin1','NO','NO-03','Oslo','oslo'),
  ('admin1','NO','NO-11','Rogaland','rogaland'),
  ('admin1','NO','NO-46','Vestland','vestland'),
  -- Denmark
  ('admin1','DK','DK-84','Capital Region','capital-region'),
  ('admin1','DK','DK-85','Zealand','zealand'),
  ('admin1','DK','DK-82','Central Denmark','central-denmark'),
  -- Finland
  ('admin1','FI','FI-18','Uusimaa','uusimaa'),
  ('admin1','FI','FI-02','South Karelia','south-karelia'),
  ('admin1','FI','FI-13','North Ostrobothnia','north-ostrobothnia'),
  -- Belgium
  ('admin1','BE','BE-VLG','Flanders','flanders'),
  ('admin1','BE','BE-WAL','Wallonia','wallonia'),
  ('admin1','BE','BE-BRU','Brussels-Capital','brussels-capital'),
  -- Austria
  ('admin1','AT','AT-9','Vienna','vienna'),
  ('admin1','AT','AT-3','Lower Austria','lower-austria'),
  ('admin1','AT','AT-6','Styria','styria'),
  -- Switzerland
  ('admin1','CH','CH-ZH','Zurich','zurich'),
  ('admin1','CH','CH-BE','Bern','bern'),
  ('admin1','CH','CH-VD','Vaud','vaud'),
  -- Spain
  ('admin1','ES','ES-MD','Madrid','madrid'),
  ('admin1','ES','ES-CT','Catalonia','catalonia'),
  ('admin1','ES','ES-AN','Andalusia','andalusia'),
  -- France
  ('admin1','FR','FR-IDF','Île-de-France','ile-de-france'),
  ('admin1','FR','FR-ARA','Auvergne-Rhône-Alpes','auvergne-rhone-alpes'),
  ('admin1','FR','FR-NAQ','Nouvelle-Aquitaine','nouvelle-aquitaine'),
  -- Italy
  ('admin1','IT','IT-LOM','Lombardy','lombardy'),
  ('admin1','IT','IT-LAZ','Lazio','lazio'),
  ('admin1','IT','IT-VEN','Veneto','veneto'),
  -- Portugal
  ('admin1','PT','PT-11','Lisbon','lisbon'),
  ('admin1','PT','PT-13','Porto','porto'),
  ('admin1','PT','PT-15','Algarve','algarve'),
  -- Poland
  ('admin1','PL','PL-MZ','Mazowieckie','mazowieckie'),
  ('admin1','PL','PL-SL','Silesian','silesian'),
  ('admin1','PL','PL-MA','Lesser Poland','lesser-poland'),
  -- Czech Republic
  ('admin1','CZ','CZ-10','Prague','prague'),
  ('admin1','CZ','CZ-20','Central Bohemian','central-bohemian'),
  ('admin1','CZ','CZ-64','South Moravian','south-moravian'),
  -- Slovakia
  ('admin1','SK','SK-BL','Bratislava Region','bratislava-region'),
  ('admin1','SK','SK-KI','Košice Region','kosice-region'),
  -- Hungary
  ('admin1','HU','HU-BU','Budapest','budapest'),
  ('admin1','HU','HU-PE','Pest County','pest-county'),
  -- Slovenia
  ('admin1','SI','SI-061','Ljubljana','ljubljana'),
  -- Baltics
  ('admin1','EE','EE-37','Harju County','harju-county'),
  ('admin1','LV','LV-RIX','Riga','riga'),
  ('admin1','LT','LT-VL','Vilnius County','vilnius-county'),
  -- Southeast EU
  ('admin1','HR','HR-21','Zagreb County','zagreb-county'),
  ('admin1','RO','RO-B','Bucharest','bucharest'),
  ('admin1','BG','BG-22','Sofia','sofia'),
  ('admin1','GR','GR-I','Attica','attica'),
  -- Turkey
  ('admin1','TR','TR-34','Istanbul','istanbul'),
  ('admin1','TR','TR-06','Ankara','ankara'),
  ('admin1','TR','TR-35','Izmir','izmir')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 7: Middle East (GCC) Admin1
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','AE','AE-DU','Dubai','dubai'),
  ('admin1','AE','AE-AZ','Abu Dhabi','abu-dhabi'),
  ('admin1','SA','SA-01','Riyadh','riyadh'),
  ('admin1','SA','SA-02','Makkah','makkah'),
  ('admin1','QA','QA-DA','Doha','doha'),
  ('admin1','KW','KW-KU','Al Asimah','al-asimah'),
  ('admin1','OM','OM-MA','Muscat','muscat'),
  ('admin1','BH','BH-13','Capital Governorate','capital-governorate')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 8: APAC Admin1
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','NZ','NZ-AUK','Auckland','auckland'),
  ('admin1','NZ','NZ-WGN','Wellington','wellington'),
  ('admin1','SG','SG-01','Central Region','central-region'),
  ('admin1','MY','MY-14','Kuala Lumpur','kuala-lumpur'),
  ('admin1','MY','MY-10','Selangor','selangor'),
  ('admin1','JP','JP-13','Tokyo','tokyo'),
  ('admin1','JP','JP-27','Osaka','osaka'),
  ('admin1','KR','KR-11','Seoul','seoul'),
  ('admin1','KR','KR-26','Busan','busan')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 9: LATAM Admin1
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','MX','MX-CMX','Mexico City','mexico-city'),
  ('admin1','MX','MX-NLE','Nuevo León','nuevo-leon'),
  ('admin1','BR','BR-SP','São Paulo','sao-paulo'),
  ('admin1','BR','BR-RJ','Rio de Janeiro','rio-de-janeiro'),
  ('admin1','AR','AR-B','Buenos Aires','buenos-aires'),
  ('admin1','CL','CL-RM','Santiago Metropolitan','santiago-metropolitan'),
  ('admin1','CO','CO-DC','Bogotá','bogota'),
  ('admin1','PE','PE-LIM','Lima','lima'),
  ('admin1','UY','UY-MO','Montevideo','montevideo'),
  ('admin1','PA','PA-8','Panamá Province','panama-province'),
  ('admin1','CR','CR-SJ','San José','san-jose')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 10: Africa + Ireland Admin1
-- ────────────────────────────────────────────────────────────
insert into public.authority_jurisdictions (level, country_code, admin1_code, name, slug)
values
  ('admin1','ZA','ZA-GP','Gauteng','gauteng'),
  ('admin1','ZA','ZA-WC','Western Cape','western-cape'),
  ('admin1','ZA','ZA-KZN','KwaZulu-Natal','kwazulu-natal'),
  ('admin1','IE','IE-L','Leinster','leinster'),
  ('admin1','IE','IE-M','Munster','munster'),
  ('admin1','IE','IE-C','Connacht','connacht')
on conflict (level, country_code, coalesce(admin1_code,''), coalesce(admin2_code,''), coalesce(special_code,''))
do update set name = excluded.name, slug = excluded.slug, updated_at = now();

-- ────────────────────────────────────────────────────────────
-- STEP 11: Set parent_id for all admin1 → country
-- ────────────────────────────────────────────────────────────
update public.authority_jurisdictions a1
set parent_id = c.id
from public.authority_jurisdictions c
where a1.level = 'admin1'
  and c.level = 'country'
  and a1.country_code = c.country_code
  and a1.parent_id is null;

-- ────────────────────────────────────────────────────────────
-- STEP 12: Log the seed run
-- ────────────────────────────────────────────────────────────
insert into public.authority_change_log (entity_type, entity_id, change_type, diff)
select
  'jurisdiction',
  gen_random_uuid(),
  'seed_run',
  jsonb_build_object(
    'wave', 0,
    'scope', 'all_52_countries_admin1',
    'country_count', (select count(distinct country_code) from public.authority_jurisdictions where level = 'country'),
    'admin1_count', (select count(*) from public.authority_jurisdictions where level = 'admin1'),
    'total_rows', (select count(*) from public.authority_jurisdictions),
    'seeded_at', now()
  );

commit;
