-- ============================================================================
-- Global Core 30 Seed: Regions + Metros + Corridors (9 International Markets)
-- ============================================================================

-- ── Helper: Ensure corridors exist ─────────────────────────────────────────
-- Corridors table should already exist. Insert if not exists approach.

-- ═══════════════════════════════════════════════════════════════════════════
-- CORRIDORS — International Seed
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.corridors (name, slug, country_code, region_codes, endpoints, corridor_type, industries, priority_score, published) values

  -- 🇦🇺 AUSTRALIA
  ('East Coast Freight Spine', 'au-east-coast-mega', 'AU', '{"NSW","QLD","VIC"}', '{"Melbourne","Sydney","Brisbane"}', 'national backbone', '{"general freight","wind","construction"}', 10.0, true),
  ('Perth to Pilbara Mining Corridor', 'au-perth-mining', 'AU', '{"WA"}', '{"Perth","Port Hedland"}', 'mining heavy haul', '{"mining","energy"}', 9.8, true),
  ('Adelaide to Darwin North-South', 'au-adelaide-darwin', 'AU', '{"SA","NT"}', '{"Adelaide","Darwin"}', 'cross-continent', '{"defense","mining","energy"}', 9.2, true),
  ('Brisbane Inland Heavy Route', 'au-brisbane-inland', 'AU', '{"QLD"}', '{"Brisbane","Toowoomba"}', 'oversize route', '{"agriculture","wind"}', 8.7, true),
  ('Melbourne to Geelong Industrial', 'au-melbourne-geelong', 'AU', '{"VIC"}', '{"Melbourne","Geelong"}', 'industrial', '{"manufacturing","port moves"}', 8.2, true),

  -- 🇬🇧 UNITED KINGDOM
  ('M1 North-South Abnormal Load Spine', 'gb-m1-spine', 'GB', '{"ENG"}', '{"London","Leeds"}', 'abnormal load backbone', '{"construction","industrial"}', 10.0, true),
  ('M6 Heavy Freight Corridor', 'gb-m6-freight', 'GB', '{"ENG"}', '{"Birmingham","Manchester","Liverpool"}', 'heavy freight', '{"industrial","port traffic"}', 9.5, true),
  ('A14 Port of Felixstowe Corridor', 'gb-a14-port', 'GB', '{"ENG"}', '{"Felixstowe","Cambridge"}', 'port heavy haul', '{"project cargo","containers"}', 9.3, true),
  ('M4 London to South Wales', 'gb-m4-wales', 'GB', '{"ENG","WAL"}', '{"London","Cardiff"}', 'industrial', '{"energy","manufacturing"}', 8.8, true),
  ('Scotland Central Belt Corridor', 'gb-scotland-central', 'GB', '{"SCT"}', '{"Glasgow","Edinburgh"}', 'regional heavy', '{"industrial","energy"}', 8.4, true),

  -- 🇳🇿 NEW ZEALAND
  ('Auckland to Waikato Freight Route', 'nz-auckland-waikato', 'NZ', '{"AKL","WKO"}', '{"Auckland","Hamilton"}', 'primary heavy route', '{"construction","agriculture"}', 9.6, true),
  ('Auckland to Port of Tauranga', 'nz-auckland-tauranga', 'NZ', '{"AKL","BOP"}', '{"Auckland","Tauranga"}', 'port heavy haul', '{"export","project cargo"}', 9.4, true),
  ('Christchurch to Dunedin South Island', 'nz-christchurch-dunedin', 'NZ', '{"CAN","OTA"}', '{"Christchurch","Dunedin"}', 'regional heavy', '{"forestry","wind"}', 8.9, true),
  ('Wellington to Palmerston North', 'nz-wellington-north', 'NZ', '{"WGN","MWT"}', '{"Wellington","Palmerston North"}', 'oversize route', '{"government","construction"}', 8.5, true),

  -- 🇸🇪 SWEDEN
  ('Stockholm to Gothenburg Heavy', 'se-stockholm-gothenburg', 'SE', '{"AB","O"}', '{"Stockholm","Gothenburg"}', 'national heavy', '{"wind","industrial"}', 9.3, true),
  ('Malmo to Stockholm Spine', 'se-malmo-stockholm', 'SE', '{"M","AB"}', '{"Malmo","Stockholm"}', 'long-haul', '{"manufacturing"}', 9.0, true),
  ('Northern Forestry Transport', 'se-north-forestry', 'SE', '{"AC","BD"}', '{"Umea","Lulea"}', 'forestry heavy', '{"forestry","energy"}', 8.7, true),

  -- 🇳🇴 NORWAY
  ('Oslo to Bergen Mountain Corridor', 'no-oslo-bergen', 'NO', '{"03","46"}', '{"Oslo","Bergen"}', 'special transport', '{"energy","industrial"}', 9.4, true),
  ('Oslo to Trondheim Route', 'no-oslo-trondheim', 'NO', '{"03","50"}', '{"Oslo","Trondheim"}', 'long-haul', '{"industrial"}', 8.9, true),
  ('Stavanger Energy Corridor', 'no-stavanger-energy', 'NO', '{"11","42"}', '{"Stavanger","Kristiansand"}', 'energy heavy', '{"offshore","oil gas"}', 8.6, true),

  -- 🇦🇪 UNITED ARAB EMIRATES
  ('Dubai to Abu Dhabi Mega Corridor', 'ae-dubai-abu-dhabi', 'AE', '{"DU","AZ"}', '{"Dubai","Abu Dhabi"}', 'mega project', '{"construction","project cargo"}', 10.0, true),
  ('Jebel Ali Port Inland Route', 'ae-jebel-ali-inland', 'AE', '{"DU"}', '{"Jebel Ali","Dubai South"}', 'port heavy', '{"project cargo"}', 9.5, true),
  ('Northern Emirates Heavy Route', 'ae-northern-emirates', 'AE', '{"SH","RK"}', '{"Sharjah","Ras Al Khaimah"}', 'regional heavy', '{"construction"}', 8.6, true),

  -- 🇸🇦 SAUDI ARABIA
  ('Riyadh to Dammam Industrial', 'sa-riyadh-dammam', 'SA', '{"01","04"}', '{"Riyadh","Dammam"}', 'industrial heavy', '{"oil gas","industrial"}', 9.6, true),
  ('Jeddah to Mecca Heavy Route', 'sa-jeddah-mecca', 'SA', '{"02"}', '{"Jeddah","Mecca"}', 'construction', '{"mega projects"}', 9.1, true),
  ('NEOM Development Corridor', 'sa-neom-corridor', 'SA', '{"07"}', '{"Tabuk","NEOM"}', 'giga project', '{"construction","energy"}', 9.8, true),

  -- 🇩🇪 GERMANY
  ('Ruhr Industrial Heavy Corridor', 'de-ruhr-industrial', 'DE', '{"NW"}', '{"Dortmund","Duisburg"}', 'industrial', '{"manufacturing"}', 9.4, true),
  ('Hamburg to Hannover Freight', 'de-hamburg-hannover', 'DE', '{"HH","NI"}', '{"Hamburg","Hannover"}', 'port inland', '{"logistics"}', 9.0, true),
  ('Munich to Nuremberg Heavy Route', 'de-munich-nuremberg', 'DE', '{"BY"}', '{"Munich","Nuremberg"}', 'industrial', '{"automotive"}', 8.7, true),

  -- 🇿🇦 SOUTH AFRICA
  ('Gauteng to Durban Freight', 'za-gauteng-durban', 'ZA', '{"GP","KZN"}', '{"Johannesburg","Durban"}', 'national backbone', '{"mining","port"}', 10.0, true),
  ('Gauteng to Cape Town Route', 'za-gauteng-cape', 'ZA', '{"GP","WC"}', '{"Johannesburg","Cape Town"}', 'long haul', '{"industrial"}', 9.1, true),
  ('North West Mining Corridor', 'za-mining-belt', 'ZA', '{"NW","GP"}', '{"Rustenburg","Johannesburg"}', 'mining heavy', '{"platinum","mining"}', 9.3, true)

on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- GEO ENTITIES — Core 30 Regions + Metros per country
-- ═══════════════════════════════════════════════════════════════════════════

-- 🇦🇺 Australia — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('au-nsw', 'New South Wales', 'state', 'AU', 'au'),
  ('au-qld', 'Queensland', 'state', 'AU', 'au'),
  ('au-vic', 'Victoria', 'state', 'AU', 'au'),
  ('au-wa', 'Western Australia', 'state', 'AU', 'au'),
  ('au-sa', 'South Australia', 'state', 'AU', 'au'),
  ('au-nt', 'Northern Territory', 'state', 'AU', 'au')
on conflict (slug) do nothing;

-- Australia — Metros
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('au-sydney', 'Sydney', 'city', 'AU', 'au-nsw'),
  ('au-melbourne', 'Melbourne', 'city', 'AU', 'au-vic'),
  ('au-brisbane', 'Brisbane', 'city', 'AU', 'au-qld'),
  ('au-perth', 'Perth', 'city', 'AU', 'au-wa'),
  ('au-adelaide', 'Adelaide', 'city', 'AU', 'au-sa'),
  ('au-newcastle', 'Newcastle', 'city', 'AU', 'au-nsw'),
  ('au-gold-coast', 'Gold Coast', 'city', 'AU', 'au-qld'),
  ('au-townsville', 'Townsville', 'city', 'AU', 'au-qld'),
  ('au-darwin', 'Darwin', 'city', 'AU', 'au-nt'),
  ('au-wollongong', 'Wollongong', 'city', 'AU', 'au-nsw'),
  ('au-geelong', 'Geelong', 'city', 'AU', 'au-vic'),
  ('au-cairns', 'Cairns', 'city', 'AU', 'au-qld')
on conflict (slug) do nothing;

-- 🇬🇧 United Kingdom — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('gb-south-east', 'England South East', 'region', 'GB', 'gb'),
  ('gb-midlands', 'England Midlands', 'region', 'GB', 'gb'),
  ('gb-north-west', 'North West England', 'region', 'GB', 'gb'),
  ('gb-yorkshire', 'Yorkshire and Humber', 'region', 'GB', 'gb'),
  ('gb-scotland-central', 'Scotland Central Belt', 'region', 'GB', 'gb'),
  ('gb-wales-south', 'Wales South', 'region', 'GB', 'gb')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('gb-london', 'London', 'city', 'GB', 'gb-south-east'),
  ('gb-birmingham', 'Birmingham', 'city', 'GB', 'gb-midlands'),
  ('gb-manchester', 'Manchester', 'city', 'GB', 'gb-north-west'),
  ('gb-leeds', 'Leeds', 'city', 'GB', 'gb-yorkshire'),
  ('gb-liverpool', 'Liverpool', 'city', 'GB', 'gb-north-west'),
  ('gb-sheffield', 'Sheffield', 'city', 'GB', 'gb-yorkshire'),
  ('gb-bristol', 'Bristol', 'city', 'GB', 'gb-south-east'),
  ('gb-glasgow', 'Glasgow', 'city', 'GB', 'gb-scotland-central'),
  ('gb-edinburgh', 'Edinburgh', 'city', 'GB', 'gb-scotland-central'),
  ('gb-newcastle', 'Newcastle upon Tyne', 'city', 'GB', 'gb-yorkshire'),
  ('gb-nottingham', 'Nottingham', 'city', 'GB', 'gb-midlands'),
  ('gb-cardiff', 'Cardiff', 'city', 'GB', 'gb-wales-south')
on conflict (slug) do nothing;

-- 🇳🇿 New Zealand — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('nz-auckland', 'Auckland Region', 'region', 'NZ', 'nz'),
  ('nz-waikato', 'Waikato', 'region', 'NZ', 'nz'),
  ('nz-canterbury', 'Canterbury', 'region', 'NZ', 'nz'),
  ('nz-wellington', 'Wellington Region', 'region', 'NZ', 'nz'),
  ('nz-bop', 'Bay of Plenty', 'region', 'NZ', 'nz'),
  ('nz-otago', 'Otago', 'region', 'NZ', 'nz')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('nz-auckland-city', 'Auckland', 'city', 'NZ', 'nz-auckland'),
  ('nz-wellington-city', 'Wellington', 'city', 'NZ', 'nz-wellington'),
  ('nz-christchurch', 'Christchurch', 'city', 'NZ', 'nz-canterbury'),
  ('nz-hamilton', 'Hamilton', 'city', 'NZ', 'nz-waikato'),
  ('nz-tauranga', 'Tauranga', 'city', 'NZ', 'nz-bop'),
  ('nz-dunedin', 'Dunedin', 'city', 'NZ', 'nz-otago'),
  ('nz-palmerston-north', 'Palmerston North', 'city', 'NZ', 'nz-wellington'),
  ('nz-napier', 'Napier', 'city', 'NZ', 'nz-wellington'),
  ('nz-nelson', 'Nelson', 'city', 'NZ', 'nz-canterbury'),
  ('nz-rotorua', 'Rotorua', 'city', 'NZ', 'nz-bop'),
  ('nz-new-plymouth', 'New Plymouth', 'city', 'NZ', 'nz-waikato'),
  ('nz-invercargill', 'Invercargill', 'city', 'NZ', 'nz-otago')
on conflict (slug) do nothing;

-- 🇸🇪 Sweden — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('se-stockholm', 'Stockholm County', 'region', 'SE', 'se'),
  ('se-vastra-gotaland', 'Vastra Gotaland', 'region', 'SE', 'se'),
  ('se-skane', 'Skane', 'region', 'SE', 'se'),
  ('se-ostergotland', 'Ostergotland', 'region', 'SE', 'se'),
  ('se-jonkoping', 'Jonkoping County', 'region', 'SE', 'se'),
  ('se-vasterbotten', 'Vasterbotten', 'region', 'SE', 'se')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('se-stockholm-city', 'Stockholm', 'city', 'SE', 'se-stockholm'),
  ('se-gothenburg', 'Gothenburg', 'city', 'SE', 'se-vastra-gotaland'),
  ('se-malmo', 'Malmo', 'city', 'SE', 'se-skane'),
  ('se-uppsala', 'Uppsala', 'city', 'SE', 'se-stockholm'),
  ('se-vasteras', 'Vasteras', 'city', 'SE', 'se-stockholm'),
  ('se-orebro', 'Orebro', 'city', 'SE', 'se-ostergotland'),
  ('se-linkoping', 'Linkoping', 'city', 'SE', 'se-ostergotland'),
  ('se-helsingborg', 'Helsingborg', 'city', 'SE', 'se-skane'),
  ('se-jonkoping-city', 'Jonkoping', 'city', 'SE', 'se-jonkoping'),
  ('se-umea', 'Umea', 'city', 'SE', 'se-vasterbotten'),
  ('se-gavle', 'Gavle', 'city', 'SE', 'se-stockholm'),
  ('se-boras', 'Boras', 'city', 'SE', 'se-vastra-gotaland')
on conflict (slug) do nothing;

-- 🇳🇴 Norway — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('no-oslo', 'Oslo Region', 'region', 'NO', 'no'),
  ('no-vestland', 'Vestland', 'region', 'NO', 'no'),
  ('no-rogaland', 'Rogaland', 'region', 'NO', 'no'),
  ('no-trondelag', 'Trondelag', 'region', 'NO', 'no'),
  ('no-viken', 'Viken', 'region', 'NO', 'no'),
  ('no-nordland', 'Nordland', 'region', 'NO', 'no')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('no-oslo-city', 'Oslo', 'city', 'NO', 'no-oslo'),
  ('no-bergen', 'Bergen', 'city', 'NO', 'no-vestland'),
  ('no-stavanger', 'Stavanger', 'city', 'NO', 'no-rogaland'),
  ('no-trondheim', 'Trondheim', 'city', 'NO', 'no-trondelag'),
  ('no-drammen', 'Drammen', 'city', 'NO', 'no-viken'),
  ('no-fredrikstad', 'Fredrikstad', 'city', 'NO', 'no-viken'),
  ('no-kristiansand', 'Kristiansand', 'city', 'NO', 'no-rogaland'),
  ('no-sandnes', 'Sandnes', 'city', 'NO', 'no-rogaland'),
  ('no-tromso', 'Tromso', 'city', 'NO', 'no-nordland'),
  ('no-skien', 'Skien', 'city', 'NO', 'no-viken'),
  ('no-alesund', 'Alesund', 'city', 'NO', 'no-vestland'),
  ('no-bodo', 'Bodo', 'city', 'NO', 'no-nordland')
on conflict (slug) do nothing;

-- 🇦🇪 UAE — Regions (Emirates = regions)
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('ae-dubai', 'Dubai', 'region', 'AE', 'ae'),
  ('ae-abu-dhabi', 'Abu Dhabi', 'region', 'AE', 'ae'),
  ('ae-sharjah', 'Sharjah', 'region', 'AE', 'ae'),
  ('ae-rak', 'Ras Al Khaimah', 'region', 'AE', 'ae'),
  ('ae-fujairah', 'Fujairah', 'region', 'AE', 'ae'),
  ('ae-ajman', 'Ajman', 'region', 'AE', 'ae')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('ae-dubai-city', 'Dubai', 'city', 'AE', 'ae-dubai'),
  ('ae-abu-dhabi-city', 'Abu Dhabi', 'city', 'AE', 'ae-abu-dhabi'),
  ('ae-sharjah-city', 'Sharjah', 'city', 'AE', 'ae-sharjah'),
  ('ae-al-ain', 'Al Ain', 'city', 'AE', 'ae-abu-dhabi'),
  ('ae-rak-city', 'Ras Al Khaimah', 'city', 'AE', 'ae-rak'),
  ('ae-fujairah-city', 'Fujairah', 'city', 'AE', 'ae-fujairah'),
  ('ae-ajman-city', 'Ajman', 'city', 'AE', 'ae-ajman'),
  ('ae-khor-fakkan', 'Khor Fakkan', 'city', 'AE', 'ae-sharjah'),
  ('ae-mussafah', 'Mussafah', 'city', 'AE', 'ae-abu-dhabi'),
  ('ae-jebel-ali', 'Jebel Ali', 'city', 'AE', 'ae-dubai'),
  ('ae-dubai-south', 'Dubai South', 'city', 'AE', 'ae-dubai'),
  ('ae-al-ruwais', 'Al Ruwais', 'city', 'AE', 'ae-abu-dhabi')
on conflict (slug) do nothing;

-- 🇸🇦 Saudi Arabia — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('sa-riyadh', 'Riyadh Region', 'region', 'SA', 'sa'),
  ('sa-makkah', 'Makkah Region', 'region', 'SA', 'sa'),
  ('sa-eastern', 'Eastern Province', 'region', 'SA', 'sa'),
  ('sa-madinah', 'Madinah Region', 'region', 'SA', 'sa'),
  ('sa-tabuk', 'Tabuk Region', 'region', 'SA', 'sa'),
  ('sa-asir', 'Asir Region', 'region', 'SA', 'sa')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('sa-riyadh-city', 'Riyadh', 'city', 'SA', 'sa-riyadh'),
  ('sa-jeddah', 'Jeddah', 'city', 'SA', 'sa-makkah'),
  ('sa-dammam', 'Dammam', 'city', 'SA', 'sa-eastern'),
  ('sa-mecca', 'Mecca', 'city', 'SA', 'sa-makkah'),
  ('sa-medina', 'Medina', 'city', 'SA', 'sa-madinah'),
  ('sa-tabuk-city', 'Tabuk', 'city', 'SA', 'sa-tabuk'),
  ('sa-jubail', 'Jubail', 'city', 'SA', 'sa-eastern'),
  ('sa-yanbu', 'Yanbu', 'city', 'SA', 'sa-madinah'),
  ('sa-khobar', 'Khobar', 'city', 'SA', 'sa-eastern'),
  ('sa-abha', 'Abha', 'city', 'SA', 'sa-asir'),
  ('sa-hail', 'Hail', 'city', 'SA', 'sa-riyadh'),
  ('sa-neom', 'NEOM', 'city', 'SA', 'sa-tabuk')
on conflict (slug) do nothing;

-- 🇩🇪 Germany — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('de-nrw', 'North Rhine-Westphalia', 'state', 'DE', 'de'),
  ('de-bavaria', 'Bavaria', 'state', 'DE', 'de'),
  ('de-bw', 'Baden-Wurttemberg', 'state', 'DE', 'de'),
  ('de-lower-saxony', 'Lower Saxony', 'state', 'DE', 'de'),
  ('de-hesse', 'Hesse', 'state', 'DE', 'de'),
  ('de-saxony', 'Saxony', 'state', 'DE', 'de')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('de-berlin', 'Berlin', 'city', 'DE', 'de-nrw'),
  ('de-hamburg', 'Hamburg', 'city', 'DE', 'de-lower-saxony'),
  ('de-munich', 'Munich', 'city', 'DE', 'de-bavaria'),
  ('de-cologne', 'Cologne', 'city', 'DE', 'de-nrw'),
  ('de-frankfurt', 'Frankfurt', 'city', 'DE', 'de-hesse'),
  ('de-stuttgart', 'Stuttgart', 'city', 'DE', 'de-bw'),
  ('de-dusseldorf', 'Dusseldorf', 'city', 'DE', 'de-nrw'),
  ('de-dortmund', 'Dortmund', 'city', 'DE', 'de-nrw'),
  ('de-essen', 'Essen', 'city', 'DE', 'de-nrw'),
  ('de-leipzig', 'Leipzig', 'city', 'DE', 'de-saxony'),
  ('de-bremen', 'Bremen', 'city', 'DE', 'de-lower-saxony'),
  ('de-hanover', 'Hanover', 'city', 'DE', 'de-lower-saxony')
on conflict (slug) do nothing;

-- 🇿🇦 South Africa — Regions
insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('za-gauteng', 'Gauteng', 'province', 'ZA', 'za'),
  ('za-kzn', 'KwaZulu-Natal', 'province', 'ZA', 'za'),
  ('za-wc', 'Western Cape', 'province', 'ZA', 'za'),
  ('za-ec', 'Eastern Cape', 'province', 'ZA', 'za'),
  ('za-mp', 'Mpumalanga', 'province', 'ZA', 'za'),
  ('za-nw', 'North West', 'province', 'ZA', 'za')
on conflict (slug) do nothing;

insert into public.geo_entities (slug, name, entity_type, country_code, parent_slug) values
  ('za-johannesburg', 'Johannesburg', 'city', 'ZA', 'za-gauteng'),
  ('za-cape-town', 'Cape Town', 'city', 'ZA', 'za-wc'),
  ('za-durban', 'Durban', 'city', 'ZA', 'za-kzn'),
  ('za-pretoria', 'Pretoria', 'city', 'ZA', 'za-gauteng'),
  ('za-port-elizabeth', 'Port Elizabeth', 'city', 'ZA', 'za-ec'),
  ('za-bloemfontein', 'Bloemfontein', 'city', 'ZA', 'za-gauteng'),
  ('za-nelspruit', 'Nelspruit', 'city', 'ZA', 'za-mp'),
  ('za-rustenburg', 'Rustenburg', 'city', 'ZA', 'za-nw'),
  ('za-polokwane', 'Polokwane', 'city', 'ZA', 'za-gauteng'),
  ('za-east-london', 'East London', 'city', 'ZA', 'za-ec'),
  ('za-kimberley', 'Kimberley', 'city', 'ZA', 'za-nw'),
  ('za-george', 'George', 'city', 'ZA', 'za-wc')
on conflict (slug) do nothing;
