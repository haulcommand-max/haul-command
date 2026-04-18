-- ============================================================================
-- GLOBAL JURISDICTIONS + SEO PAGES + CORRIDORS
-- Extends global_markets_migration.sql with full region/state seeding for
-- all 9 expansion countries (AU, GB, NZ, SE, NO, AE, SA, DE, ZA)
-- Plus SEO hub pages and corridor seeds at parity with US/CA
-- ============================================================================

-- ── First: Add expansion markets missing from original migration ───────────
INSERT INTO public.markets (code, name, tier, region, default_measurement, default_currency, permit_term, timezone_ref)
VALUES
    ('NZ', 'New Zealand',          'expansion', 'oceania',            'metric', 'NZD', 'excess_dimension', 'Pacific/Auckland'),
    ('SE', 'Sweden',               'expansion', 'europe',            'metric', 'SEK', 'transport_exceptionnel', 'Europe/Stockholm'),
    ('NO', 'Norway',               'expansion', 'europe',            'metric', 'NOK', 'transport_exceptionnel', 'Europe/Oslo'),
    ('AE', 'United Arab Emirates', 'expansion', 'middle_east_africa','metric', 'AED', 'generic', 'Asia/Dubai'),
    ('SA', 'Saudi Arabia',         'expansion', 'middle_east_africa','metric', 'SAR', 'generic', 'Asia/Riyadh'),
    ('DE', 'Germany',              'expansion', 'europe',            'metric', 'EUR', 'schwertransport', 'Europe/Berlin'),
    ('ZA', 'South Africa',         'expansion', 'africa',            'metric', 'ZAR', 'generic', 'Africa/Johannesburg')
ON CONFLICT (code) DO NOTHING;

-- ── AUSTRALIA: Remaining States/Territories ────────────────────────────────
DO $$
DECLARE au_id UUID;
BEGIN
    SELECT id INTO au_id FROM public.markets WHERE code = 'AU';
    IF au_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, pilot_cert_tier, notes) VALUES
        (au_id, 'AU-SA',  'South Australia',           'state_province', 'AU-SA',  'level_1', 'DPTI authority. Wind farm corridor. Road train limits.'),
        (au_id, 'AU-TAS', 'Tasmania',                  'state_province', 'AU-TAS', 'level_1', 'State Growth Dept. Narrow roads, heritage bridges. Ferry dependency.'),
        (au_id, 'AU-NT',  'Northern Territory',        'state_province', 'AU-NT',  'level_1', 'DIPL authority. Road trains, remote mining. Stuart Highway.'),
        (au_id, 'AU-ACT', 'Australian Capital Territory','state_province','AU-ACT','level_2', 'TCCS authority. Urban-only jurisdiction, very strict.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── UNITED KINGDOM: already has ENG, SCT, WLS, NIR — no additions needed

-- ── NEW ZEALAND: Regions ───────────────────────────────────────────────────
DO $$
DECLARE nz_id UUID;
BEGIN
    SELECT id INTO nz_id FROM public.markets WHERE code = 'NZ';
    IF nz_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (nz_id, 'NZ-AUK', 'Auckland',       'state_province', 'NZ-AUK', 'Largest metro. Auckland Transport authority. SH1 hub.'),
        (nz_id, 'NZ-WKO', 'Waikato',        'state_province', 'NZ-WKO', 'Agricultural and dairy corridors. SH1/SH3.'),
        (nz_id, 'NZ-BOP', 'Bay of Plenty',  'state_province', 'NZ-BOP', 'Port of Tauranga — NZ busiest port. Forestry corridors.'),
        (nz_id, 'NZ-WGN', 'Wellington',     'state_province', 'NZ-WGN', 'Capital region. Tight urban corridors. SH1/SH2 junction.'),
        (nz_id, 'NZ-CAN', 'Canterbury',     'state_province', 'NZ-CAN', 'South Island hub. Christchurch metro. SH1 south.'),
        (nz_id, 'NZ-OTA', 'Otago',          'state_province', 'NZ-OTA', 'Mountain passes. Hydroelectric project cargo. Remote.'),
        (nz_id, 'NZ-STL', 'Southland',      'state_province', 'NZ-STL', 'Wind energy corridors. Aluminium smelter transport.'),
        (nz_id, 'NZ-TKI', 'Taranaki',       'state_province', 'NZ-TKI', 'Energy sector. Oil & gas equipment moves.'),
        (nz_id, 'NZ-MWT', 'Manawatū-Whanganui','state_province','NZ-MWT','Wind farm corridors. SH1/SH3 junction.'),
        (nz_id, 'NZ-HKB', 'Hawke''s Bay',   'state_province', 'NZ-HKB', 'Port of Napier. Horticultural/wine region.'),
        (nz_id, 'NZ-NSN', 'Nelson/Marlborough','state_province','NZ-NSN','Ferry terminal. SH6 mountain routes.'),
        (nz_id, 'NZ-WTC', 'West Coast',     'state_province', 'NZ-WTC', 'Mining. Single-lane bridges. Arthur''s Pass route.'),
        (nz_id, 'NZ-NTL', 'Northland',      'state_province', 'NZ-NTL', 'Remote. Marsden Point refinery. SH1 north.'),
        (nz_id, 'NZ-GIS', 'Gisborne',       'state_province', 'NZ-GIS', 'Forestry transport. Remote East Cape routes.'),
        (nz_id, 'NZ-TAS', 'Tasman',         'state_province', 'NZ-TAS', 'Horticultural region. Nelson–Blenheim corridor.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── SWEDEN: Counties (län) ─────────────────────────────────────────────────
DO $$
DECLARE se_id UUID;
BEGIN
    SELECT id INTO se_id FROM public.markets WHERE code = 'SE';
    IF se_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (se_id, 'SE-AB', 'Stockholm',       'state_province', 'SE-AB', 'Capital region. Heavy urban restrictions. Congestion zone.'),
        (se_id, 'SE-O',  'Västra Götaland', 'state_province', 'SE-O',  'Gothenburg port — largest in Scandinavia. Volvo corridor.'),
        (se_id, 'SE-M',  'Skåne',           'state_province', 'SE-M',  'Malmö–Copenhagen bridge corridor. Øresund link.'),
        (se_id, 'SE-E',  'Östergötland',    'state_province', 'SE-E',  'E4 motorway hub. Industrial corridor.'),
        (se_id, 'SE-U',  'Västmanland',     'state_province', 'SE-U',  'ABB heavy industry. E18 corridor.'),
        (se_id, 'SE-BD', 'Norrbotten',      'state_province', 'SE-BD', 'Mining (Kiruna iron). Arctic conditions. E10 corridor.'),
        (se_id, 'SE-AC', 'Västerbotten',    'state_province', 'SE-AC', 'Wind farm corridors. E4 coastal. Forestry.'),
        (se_id, 'SE-Z',  'Jämtland',        'state_province', 'SE-Z',  'Norway border. Wind energy. Mountain routes.'),
        (se_id, 'SE-Y',  'Västernorrland',  'state_province', 'SE-Y',  'Sundsvall port. Paper/pulp industry corridors.'),
        (se_id, 'SE-X',  'Gävleborg',       'state_province', 'SE-X',  'Gävle port. Steel industry. E4 corridor.'),
        (se_id, 'SE-W',  'Dalarna',         'state_province', 'SE-W',  'Mining (copper, zinc). Heavy industry. Winter roads.'),
        (se_id, 'SE-S',  'Värmland',        'state_province', 'SE-S',  'Norway border crossing. Forestry. E18 corridor.'),
        (se_id, 'SE-T',  'Örebro',          'state_province', 'SE-T',  'Central Sweden logistics hub. E18/E20 junction.'),
        (se_id, 'SE-D',  'Södermanland',    'state_province', 'SE-D',  'E4 corridor. Power plant equipment.'),
        (se_id, 'SE-C',  'Uppsala',         'state_province', 'SE-C',  'University/research. E4 north from Stockholm.'),
        (se_id, 'SE-H',  'Kalmar',          'state_province', 'SE-H',  'Coastal. Öland bridge. Wind energy corridor.'),
        (se_id, 'SE-K',  'Blekinge',        'state_province', 'SE-K',  'Karlskrona naval base. Coastal transport.'),
        (se_id, 'SE-N',  'Halland',         'state_province', 'SE-N',  'E6 motorway. Coastal wind energy.'),
        (se_id, 'SE-G',  'Kronoberg',       'state_province', 'SE-G',  'IKEA country. Forestry transport.'),
        (se_id, 'SE-F',  'Jönköping',       'state_province', 'SE-F',  'Central logistics node. E4/Rv40 junction.'),
        (se_id, 'SE-I',  'Gotland',         'state_province', 'SE-I',  'Island — ferry dependency. Cement industry.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── NORWAY: Counties (fylker) ──────────────────────────────────────────────
DO $$
DECLARE no_id UUID;
BEGIN
    SELECT id INTO no_id FROM public.markets WHERE code = 'NO';
    IF no_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (no_id, 'NO-03', 'Oslo',               'state_province', 'NO-03', 'Capital. Urban restrictions. E6/E18 junction.'),
        (no_id, 'NO-30', 'Viken',              'state_province', 'NO-30', 'Oslo surrounds. Largest county. E6/E18 corridors.'),
        (no_id, 'NO-46', 'Vestland',           'state_province', 'NO-46', 'Bergen. Oil/gas logistics. Fjord crossings. E39.'),
        (no_id, 'NO-11', 'Rogaland',           'state_province', 'NO-11', 'Stavanger. Offshore energy capital. E39.'),
        (no_id, 'NO-15', 'Møre og Romsdal',    'state_province', 'NO-15', 'Subsea equipment. Fjord ferries. Offshore fabrication.'),
        (no_id, 'NO-50', 'Trøndelag',          'state_province', 'NO-50', 'Trondheim. E6. Wind energy corridors. Research/tech.'),
        (no_id, 'NO-18', 'Nordland',           'state_province', 'NO-18', 'Arctic corridor. Lofoten. Mining. E6 northern.'),
        (no_id, 'NO-54', 'Troms og Finnmark',  'state_province', 'NO-54', 'Arctic. LNG plants. Military logistics. E6 terminus.'),
        (no_id, 'NO-42', 'Agder',              'state_province', 'NO-42', 'Southern coast. E18/E39. Offshore supply bases.'),
        (no_id, 'NO-38', 'Vestfold og Telemark','state_province','NO-38', 'E18 corridor. Industrial/maritime.'),
        (no_id, 'NO-34', 'Innlandet',          'state_province', 'NO-34', 'Interior. E6. Hydropower. Forestry. Mountain roads.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── UAE: Emirates ──────────────────────────────────────────────────────────
DO $$
DECLARE ae_id UUID;
BEGIN
    SELECT id INTO ae_id FROM public.markets WHERE code = 'AE';
    IF ae_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (ae_id, 'AE-DU', 'Dubai',         'state_province', 'AE-DU', 'Jebel Ali port — world busiest. EXPO corridors. RTA authority.'),
        (ae_id, 'AE-AZ', 'Abu Dhabi',     'state_province', 'AE-AZ', 'Capital. Khalifa Port. Oil/gas project cargo. ITC authority.'),
        (ae_id, 'AE-SH', 'Sharjah',       'state_province', 'AE-SH', 'Industrial zones. Dubai–Sharjah transit corridor.'),
        (ae_id, 'AE-RK', 'Ras Al Khaimah','state_province', 'AE-RK', 'Northern emirate. Cement/aggregate heavy transport.'),
        (ae_id, 'AE-FU', 'Fujairah',      'state_province', 'AE-FU', 'East coast port. Oil terminal. Indian Ocean access.'),
        (ae_id, 'AE-AJ', 'Ajman',         'state_province', 'AE-AJ', 'Smallest emirate. Transit corridor.'),
        (ae_id, 'AE-UQ', 'Umm Al Quwain', 'state_province', 'AE-UQ', 'Smallest. Limited heavy haul activity.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── SAUDI ARABIA: Regions ──────────────────────────────────────────────────
DO $$
DECLARE sa_id UUID;
BEGIN
    SELECT id INTO sa_id FROM public.markets WHERE code = 'SA';
    IF sa_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (sa_id, 'SA-01', 'Riyadh',          'state_province', 'SA-01', 'Capital. KAFD mega-project. E30/E45 hub.'),
        (sa_id, 'SA-04', 'Eastern Province', 'state_province', 'SA-04', 'Dammam/Jubail. Aramco industrial. King Fahd Causeway.'),
        (sa_id, 'SA-02', 'Makkah',          'state_province', 'SA-02', 'Jeddah Islamic Port. KAEC. Pilgrimage traffic.'),
        (sa_id, 'SA-05', 'Madinah',         'state_province', 'SA-05', 'Religious tourism. Rail link projects.'),
        (sa_id, 'SA-07', 'Tabuk',           'state_province', 'SA-07', 'NEOM mega-project zone. Desert logistics. THE LINE.'),
        (sa_id, 'SA-06', 'Asir',            'state_province', 'SA-06', 'Mountain terrain. Limited heavy haul infrastructure.'),
        (sa_id, 'SA-08', 'Northern Borders', 'state_province', 'SA-08', 'Iraq/Jordan border transit. Arar crossing.'),
        (sa_id, 'SA-09', 'Jazan',           'state_province', 'SA-09', 'Red Sea port. Yemen border. Jizan Economic City.'),
        (sa_id, 'SA-10', 'Najran',          'state_province', 'SA-10', 'Southern border. Limited infrastructure.'),
        (sa_id, 'SA-11', 'Al Bahah',        'state_province', 'SA-11', 'Mountainous. Tourism development.'),
        (sa_id, 'SA-12', 'Al Jawf',         'state_province', 'SA-12', 'Northern desert. Agriculture/mining.'),
        (sa_id, 'SA-13', 'Hail',            'state_province', 'SA-13', 'Mining corridor. Agriculture hub.'),
        (sa_id, 'SA-03', 'Qassim',          'state_province', 'SA-03', 'Central distribution. Agricultural hub.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── GERMANY: Bundesländer ──────────────────────────────────────────────────
DO $$
DECLARE de_id UUID;
BEGIN
    SELECT id INTO de_id FROM public.markets WHERE code = 'DE';
    IF de_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (de_id, 'DE-NW', 'Nordrhein-Westfalen', 'state_province', 'DE-NW', 'Largest state. Duisburg inland port. A1/A2/A3 hub. Ruhr industrial.'),
        (de_id, 'DE-BY', 'Bayern',               'state_province', 'DE-BY', 'Munich. BMW/Siemens. A8/A9. Alpine border corridors.'),
        (de_id, 'DE-BW', 'Baden-Württemberg',    'state_province', 'DE-BW', 'Stuttgart. Daimler/Bosch. A5/A8. Black Forest clearance issues.'),
        (de_id, 'DE-NI', 'Niedersachsen',        'state_province', 'DE-NI', 'VW Wolfsburg. A2 corridor. Offshore wind ports (Cuxhaven).'),
        (de_id, 'DE-HE', 'Hessen',               'state_province', 'DE-HE', 'Frankfurt. A3/A5 junction. Financial/logistics hub.'),
        (de_id, 'DE-SN', 'Sachsen',               'state_province', 'DE-SN', 'Dresden/Leipzig. A4/A14. Czech border transit.'),
        (de_id, 'DE-RP', 'Rheinland-Pfalz',      'state_province', 'DE-RP', 'Rhine river transport. Chemical industry. A61.'),
        (de_id, 'DE-SH', 'Schleswig-Holstein',   'state_province', 'DE-SH', 'Kiel Canal. Denmark border. Wind energy coast.'),
        (de_id, 'DE-TH', 'Thüringen',            'state_province', 'DE-TH', 'A4 corridor. Central Germany logistics.'),
        (de_id, 'DE-BB', 'Brandenburg',           'state_province', 'DE-BB', 'Berlin surrounds. Tesla Gigafactory. A10 ring.'),
        (de_id, 'DE-ST', 'Sachsen-Anhalt',        'state_province', 'DE-ST', 'A2/A14. Chemical triangle. Magdeburg port.'),
        (de_id, 'DE-MV', 'Mecklenburg-Vorpommern','state_province','DE-MV', 'Rostock port. Offshore wind. A20.'),
        (de_id, 'DE-SL', 'Saarland',              'state_province', 'DE-SL', 'France border. Steel industry. A6.'),
        (de_id, 'DE-BE', 'Berlin',                 'state_province', 'DE-BE', 'Capital. Urban-only. Very strict night-only rules.'),
        (de_id, 'DE-HH', 'Hamburg',                'state_province', 'DE-HH', 'Port of Hamburg — Europe 3rd largest. A1/A7. City-state.'),
        (de_id, 'DE-HB', 'Bremen',                 'state_province', 'DE-HB', 'Bremerhaven port. Wind turbine export hub. A1.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── SOUTH AFRICA: Provinces ────────────────────────────────────────────────
DO $$
DECLARE za_id UUID;
BEGIN
    SELECT id INTO za_id FROM public.markets WHERE code = 'ZA';
    IF za_id IS NULL THEN RETURN; END IF;
    INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
        (za_id, 'ZA-GP', 'Gauteng',          'state_province', 'ZA-GP', 'Johannesburg/Pretoria. N1/N3 hub. Industrial heartland.'),
        (za_id, 'ZA-KZN','KwaZulu-Natal',    'state_province', 'ZA-KZN','Durban port — busiest in Africa. N2/N3. Sugar/mining.'),
        (za_id, 'ZA-WC', 'Western Cape',     'state_province', 'ZA-WC', 'Cape Town port. N1/N2. Wine/agriculture. Wind energy.'),
        (za_id, 'ZA-EC', 'Eastern Cape',     'state_province', 'ZA-EC', 'Port Elizabeth/Ngqura. Automotive industry. N2.'),
        (za_id, 'ZA-MP', 'Mpumalanga',       'state_province', 'ZA-MP', 'Coal mining. Power stations. N4. Maputo corridor.'),
        (za_id, 'ZA-LP', 'Limpopo',          'state_province', 'ZA-LP', 'Mining (platinum). N1 to Zimbabwe. Remote corridors.'),
        (za_id, 'ZA-NW', 'North West',       'state_province', 'ZA-NW', 'Platinum belt. Mining equipment. N4 Botswana corridor.'),
        (za_id, 'ZA-FS', 'Free State',       'state_province', 'ZA-FS', 'N1 central corridor. Gold mining. Agriculture.'),
        (za_id, 'ZA-NC', 'Northern Cape',    'state_province', 'ZA-NC', 'Largest province. Mining (diamonds, iron). Remote. Solar farms.')
    ON CONFLICT (market_id, code) DO NOTHING;
END $$;

-- ── SEED: SEO Pages for all 9 International Markets ───────────────────────
-- Expand seo_pages country check constraint first
ALTER TABLE seo_pages DROP CONSTRAINT IF EXISTS seo_pages_country_check;
ALTER TABLE seo_pages ADD CONSTRAINT seo_pages_country_check
    CHECK (country IN ('US','CA','AU','GB','NZ','SE','NO','AE','SA','DE','ZA'));

INSERT INTO seo_pages (slug, type, region, country, title, h1, meta_description, status, canonical_url) VALUES
-- AUSTRALIA
('rules/new-south-wales/escort-requirements','region','new-south-wales','AU','New South Wales Pilot Vehicle Requirements & Escort Regulations 2025','NSW Pilot Vehicle & Escort Requirements 2025','Complete NSW pilot vehicle requirements, NHVR permits, two-tier escort system, and oversize load compliance. Updated 2025.','draft','/rules/new-south-wales/escort-requirements'),
('rules/queensland/escort-requirements','region','queensland','AU','Queensland Pilot Vehicle Requirements & Escort Regulations 2025','Queensland Pilot Vehicle & Escort Requirements 2025','Complete Queensland pilot vehicle requirements, TMR permits, mining corridor escort rules, and oversize compliance. Updated 2025.','draft','/rules/queensland/escort-requirements'),
('rules/western-australia/escort-requirements','region','western-australia','AU','Western Australia Pilot Vehicle Requirements & Escort Regulations 2025','WA Pilot Vehicle & Escort Requirements 2025','Complete Western Australia pilot vehicle requirements, Main Roads WA permits, road train escorts, and mining corridor compliance. Updated 2025.','draft','/rules/western-australia/escort-requirements'),
('rules/victoria/escort-requirements','region','victoria','AU','Victoria Pilot Vehicle Requirements & Escort Regulations 2025','Victoria Pilot Vehicle & Escort Requirements 2025','Complete Victoria pilot vehicle requirements, VicRoads permits, Melbourne urban corridors, and oversize compliance. Updated 2025.','draft','/rules/victoria/escort-requirements'),
('rules/south-australia/escort-requirements','region','south-australia','AU','South Australia Pilot Vehicle Requirements & Escort Regulations 2025','SA Pilot Vehicle & Escort Requirements 2025','Complete South Australia pilot vehicle requirements, DPTI permits, wind farm corridor escort rules. Updated 2025.','draft','/rules/south-australia/escort-requirements'),
('rules/tasmania/escort-requirements','region','tasmania','AU','Tasmania Pilot Vehicle Requirements & Escort Regulations 2025','Tasmania Pilot Vehicle & Escort Requirements 2025','Complete Tasmania pilot vehicle requirements, heritage bridge restrictions, ferry coordination. Updated 2025.','draft','/rules/tasmania/escort-requirements'),
('rules/northern-territory/escort-requirements','region','northern-territory','AU','Northern Territory Pilot Vehicle Requirements & Escort Regulations 2025','NT Pilot Vehicle & Escort Requirements 2025','Complete Northern Territory pilot vehicle requirements, road train escorts, mining corridor compliance. Updated 2025.','draft','/rules/northern-territory/escort-requirements'),
-- UNITED KINGDOM
('rules/england/abnormal-load','region','england','GB','England Abnormal Load Escort Requirements & VR1 Permits 2025','England Abnormal Load & Escort Vehicle Requirements 2025','Complete England abnormal load escort requirements, Highways England VR1/SO permits, ESDAL notifications, and vehicle regulations. Updated 2025.','draft','/rules/england/abnormal-load'),
('rules/scotland/abnormal-load','region','scotland','GB','Scotland Abnormal Load Escort Requirements 2025','Scotland Abnormal Load & Escort Requirements 2025','Complete Scotland abnormal load escort requirements, Transport Scotland permits, trunk road notifications. Updated 2025.','draft','/rules/scotland/abnormal-load'),
('rules/wales/abnormal-load','region','wales','GB','Wales Abnormal Load Escort Requirements 2025','Wales Abnormal Load & Escort Requirements 2025','Complete Wales abnormal load escort requirements, Welsh Government permits, trunk road regulations. Updated 2025.','draft','/rules/wales/abnormal-load'),
('rules/northern-ireland/abnormal-load','region','northern-ireland','GB','Northern Ireland Abnormal Load Escort Requirements 2025','Northern Ireland Abnormal Load & Escort Requirements 2025','Complete Northern Ireland abnormal load escort requirements, DfI permits, and cross-border ROI coordination. Updated 2025.','draft','/rules/northern-ireland/abnormal-load'),
-- NEW ZEALAND
('rules/auckland/oversize-escort','region','auckland','NZ','Auckland Oversize Load Escort Requirements 2025','Auckland Oversize Load & Pilot Vehicle Requirements 2025','Complete Auckland oversize load escort requirements, AT permits, SH1 urban restrictions, and NZTA compliance. Updated 2025.','draft','/rules/auckland/oversize-escort'),
('rules/canterbury/oversize-escort','region','canterbury','NZ','Canterbury Oversize Load Escort Requirements 2025','Canterbury Oversize Load & Pilot Vehicle Requirements 2025','Complete Canterbury oversize load escort requirements, Christchurch metro rules, mountain pass restrictions. Updated 2025.','draft','/rules/canterbury/oversize-escort'),
('rules/waikato/oversize-escort','region','waikato','NZ','Waikato Oversize Load Escort Requirements 2025','Waikato Oversize Load & Pilot Vehicle Requirements 2025','Complete Waikato oversize load escort requirements, agricultural corridor rules. Updated 2025.','draft','/rules/waikato/oversize-escort'),
('rules/bay-of-plenty/oversize-escort','region','bay-of-plenty','NZ','Bay of Plenty Oversize Load Escort Requirements 2025','Bay of Plenty Oversize Load & Pilot Vehicle Requirements 2025','Complete Bay of Plenty oversize load escort requirements, Port of Tauranga corridor transport rules. Updated 2025.','draft','/rules/bay-of-plenty/oversize-escort'),
-- GERMANY
('rules/nordrhein-westfalen/schwertransport','region','nordrhein-westfalen','DE','Nordrhein-Westfalen Schwertransport & Begleitfahrzeug Anforderungen 2025','NRW Schwertransport Escort Requirements 2025','Complete NRW heavy transport escort requirements, VEMAGS permits, Autobahn restrictions for abnormal loads. Updated 2025.','draft','/rules/nordrhein-westfalen/schwertransport'),
('rules/bayern/schwertransport','region','bayern','DE','Bayern Schwertransport & Begleitfahrzeug Anforderungen 2025','Bayern Heavy Transport Escort Requirements 2025','Complete Bavaria heavy transport escort requirements, Alpine corridor restrictions, VEMAGS permits. Updated 2025.','draft','/rules/bayern/schwertransport'),
('rules/niedersachsen/schwertransport','region','niedersachsen','DE','Niedersachsen Schwertransport & Begleitfahrzeug Anforderungen 2025','Niedersachsen Heavy Transport Escort Requirements 2025','Complete Lower Saxony heavy transport escort requirements, offshore wind port corridors. Updated 2025.','draft','/rules/niedersachsen/schwertransport'),
('rules/hamburg/schwertransport','region','hamburg','DE','Hamburg Schwertransport & Begleitfahrzeug Anforderungen 2025','Hamburg Heavy Transport Escort Requirements 2025','Complete Hamburg heavy transport requirements, port corridor escorts, urban night restrictions. Updated 2025.','draft','/rules/hamburg/schwertransport'),
-- SWEDEN
('rules/stockholm/tungtransport','region','stockholm','SE','Stockholm Tungtransport & Eskort Fordon Krav 2025','Stockholm Heavy Transport Escort Requirements 2025','Complete Stockholm region heavy transport escort requirements, urban congestion restrictions. Updated 2025.','draft','/rules/stockholm/tungtransport'),
('rules/vastra-gotaland/tungtransport','region','vastra-gotaland','SE','Västra Götaland Tungtransport & Eskort Krav 2025','Gothenburg Heavy Transport Escort Requirements 2025','Complete Västra Götaland heavy transport escort requirements, Gothenburg port corridor rules. Updated 2025.','draft','/rules/vastra-gotaland/tungtransport'),
('rules/norrbotten/tungtransport','region','norrbotten','SE','Norrbotten Tungtransport & Gruvtransport Krav 2025','Norrbotten Mining & Heavy Transport Escort Requirements 2025','Complete Norrbotten heavy transport escort requirements, Kiruna mining corridor, arctic conditions. Updated 2025.','draft','/rules/norrbotten/tungtransport'),
-- NORWAY
('rules/vestland/tungtransport','region','vestland','NO','Vestland Tungtransport & Eskortekjøretøy Krav 2025','Bergen Heavy Transport Escort Requirements 2025','Complete Vestland heavy transport escort requirements, fjord crossing logistics, offshore energy corridors. Updated 2025.','draft','/rules/vestland/tungtransport'),
('rules/rogaland/tungtransport','region','rogaland','NO','Rogaland Tungtransport & Oljetransport Krav 2025','Rogaland Heavy Transport & Oil Sector Escort Requirements 2025','Complete Rogaland heavy transport escort requirements, Stavanger energy corridor, subsea equipment moves. Updated 2025.','draft','/rules/rogaland/tungtransport'),
-- UAE
('rules/dubai/heavy-transport','region','dubai','AE','Dubai Heavy Transport & Escort Requirements 2025','Dubai Heavy Transport & Escort Vehicle Requirements 2025','Complete Dubai heavy transport escort requirements, RTA permits, Jebel Ali port corridor rules, and project cargo regulations. Updated 2025.','draft','/rules/dubai/heavy-transport'),
('rules/abu-dhabi/heavy-transport','region','abu-dhabi','AE','Abu Dhabi Heavy Transport & Escort Requirements 2025','Abu Dhabi Heavy Transport & Escort Vehicle Requirements 2025','Complete Abu Dhabi heavy transport escort requirements, ITC permits, Khalifa Port corridor, and oil sector logistics. Updated 2025.','draft','/rules/abu-dhabi/heavy-transport'),
-- SAUDI ARABIA
('rules/eastern-province/heavy-transport','region','eastern-province','SA','Eastern Province Heavy Transport & Escort Requirements 2025','Saudi Eastern Province Heavy Transport Escort Requirements 2025','Complete Eastern Province heavy transport escort requirements, Jubail industrial corridor, Aramco logistics. Updated 2025.','draft','/rules/eastern-province/heavy-transport'),
('rules/riyadh/heavy-transport','region','riyadh','SA','Riyadh Heavy Transport & Escort Requirements 2025','Riyadh Heavy Transport Escort Requirements 2025','Complete Riyadh region heavy transport escort requirements, KAFD mega-project logistics, Saudi MOT permits. Updated 2025.','draft','/rules/riyadh/heavy-transport'),
('rules/tabuk-neom/heavy-transport','region','tabuk-neom','SA','NEOM & Tabuk Heavy Transport & Escort Requirements 2025','NEOM Mega-Project Heavy Transport Requirements 2025','Complete NEOM/Tabuk heavy transport escort requirements, THE LINE project logistics. Updated 2025.','draft','/rules/tabuk-neom/heavy-transport'),
-- SOUTH AFRICA
('rules/gauteng/heavy-transport','region','gauteng','ZA','Gauteng Heavy Transport & Escort Requirements 2025','Gauteng Heavy Transport Escort Requirements 2025','Complete Gauteng heavy transport escort requirements, N1/N3 corridor, Johannesburg urban restrictions, SANRAL permits. Updated 2025.','draft','/rules/gauteng/heavy-transport'),
('rules/kwazulu-natal/heavy-transport','region','kwazulu-natal','ZA','KwaZulu-Natal Heavy Transport & Escort Requirements 2025','KZN Heavy Transport Escort Requirements 2025','Complete KwaZulu-Natal heavy transport escort requirements, Durban port corridor, N2/N3 mining transport. Updated 2025.','draft','/rules/kwazulu-natal/heavy-transport'),
('rules/western-cape/heavy-transport','region','western-cape','ZA','Western Cape Heavy Transport & Escort Requirements 2025','Western Cape Heavy Transport Escort Requirements 2025','Complete Western Cape heavy transport escort requirements, Cape Town port corridor, N1/N2 regulations. Updated 2025.','draft','/rules/western-cape/heavy-transport')
ON CONFLICT (slug) DO NOTHING;

-- ── SEED: International Corridor Hub Pages ─────────────────────────────────
INSERT INTO seo_pages (slug, type, corridor_slug, country, title, h1, meta_description, status, canonical_url) VALUES
-- AUSTRALIA
('corridors/pacific-highway-au','corridor','pacific-highway-au','AU','Pacific Highway Pilot Vehicle Services & Escort Requirements','Pacific Highway (Sydney–Brisbane) Oversize Load Escort','Pacific Highway pilot vehicle requirements from Sydney to Brisbane. NSW/QLD escort regulations, NHVR permits, and certified escort operators.','draft','/corridors/pacific-highway-au'),
('corridors/hume-highway','corridor','hume-highway','AU','Hume Highway Pilot Vehicle Services & Escort Requirements','Hume Highway (Sydney–Melbourne) Oversize Load Escort','Hume Highway pilot vehicle requirements from Sydney to Melbourne. NSW/VIC escort regulations, curfew rules, and certified operators.','draft','/corridors/hume-highway'),
('corridors/great-northern-highway','corridor','great-northern-highway','AU','Great Northern Highway Escort & Pilot Vehicle Requirements','Great Northern Highway (Perth–Port Hedland) Mining Corridor Escort','Great Northern Highway pilot vehicle requirements for WA mining corridor. Road train escorts, remote area protocols, and NHVR compliance.','draft','/corridors/great-northern-highway'),
('corridors/stuart-highway','corridor','stuart-highway','AU','Stuart Highway Escort & Pilot Vehicle Requirements','Stuart Highway (Adelaide–Darwin) Outback Transport Escort','Stuart Highway pilot vehicle requirements crossing SA and NT. Road train escorts, remote fuel planning, and outback compliance.','draft','/corridors/stuart-highway'),
-- UK
('corridors/m1-uk','corridor','m1-uk','GB','M1 Abnormal Load Escort & Pilot Vehicle Requirements','M1 (London–Leeds) Abnormal Load Escort Services','M1 motorway abnormal load escort requirements from London to Yorkshire. Highways England VR1 notifications, night-only restrictions.','draft','/corridors/m1-uk'),
('corridors/m6-uk','corridor','m6-uk','GB','M6 Abnormal Load Escort & Pilot Vehicle Requirements','M6 (Birmingham–Scotland) Abnormal Load Escort Services','M6 motorway abnormal load escort requirements. West Midlands to Scotland, bridge restrictions, and police notification requirements.','draft','/corridors/m6-uk'),
-- GERMANY
('corridors/a2-de','corridor','a2-de','DE','A2 Schwertransport Begleitfahrzeug & Escort Requirements','A2 Autobahn (Dortmund–Berlin) Heavy Transport Escort','A2 Autobahn heavy transport escort requirements. Ruhr to Berlin corridor, bridge engineering clearances, VEMAGS permits.','draft','/corridors/a2-de'),
-- NORWAY
('corridors/e6-no','corridor','e6-no','NO','E6 Tungtransport Eskortekjøretøy & Escort Requirements','E6 (Oslo–Tromsø) Heavy Transport Escort Requirements','E6 heavy transport escort requirements along Norway spine. Fjord crossings, tunnel restrictions, winter conditions.','draft','/corridors/e6-no'),
-- UAE
('corridors/e11-uae','corridor','e11-uae','AE','E11 Heavy Transport & Escort Requirements','E11 (Abu Dhabi–Dubai) Heavy Transport Escort Services','E11 Sheikh Zayed Road heavy transport escort requirements. Jebel Ali port corridor, mega-project logistics.','draft','/corridors/e11-uae'),
-- SOUTH AFRICA
('corridors/n3-za','corridor','n3-za','ZA','N3 Heavy Transport & Escort Requirements','N3 (Durban–Johannesburg) Heavy Transport Escort Services','N3 highway heavy transport escort requirements. Port of Durban to Gauteng mining corridor, SANRAL permits.','draft','/corridors/n3-za')
ON CONFLICT (slug) DO NOTHING;
