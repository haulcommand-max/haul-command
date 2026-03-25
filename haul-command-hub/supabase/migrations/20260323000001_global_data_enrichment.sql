-- ═══════════════════════════════════════════════════════════════
-- GLOBAL DATA ENRICHMENT — Surface Audit Fix
-- Priority 1: 5 zero-data countries (IN, ID, TH, VN, PH)
-- Priority 2: 6 empty Gold countries (NZ, ZA, DE, NL, AE, BR)
-- Priority 3: All Blue/Silver/Slate stubs → real surfaces
-- Priority 4: Corridors + state_regulations seed
-- ═══════════════════════════════════════════════════════════════

-- ── Ensure state_regulations table exists ─────────────────────
CREATE TABLE IF NOT EXISTS state_regulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  jurisdiction_code TEXT NOT NULL,
  jurisdiction_name TEXT NOT NULL,
  escort_required_width_ft NUMERIC(5,1),
  escort_required_length_ft NUMERIC(5,1),
  escort_required_height_ft NUMERIC(5,1),
  escort_required_weight_lbs NUMERIC(10,0),
  max_escorts_required INTEGER DEFAULT 1,
  police_escort_threshold TEXT,
  permit_authority TEXT,
  permit_url TEXT,
  notes TEXT,
  source TEXT DEFAULT 'seed',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, jurisdiction_code)
);
CREATE INDEX IF NOT EXISTS idx_state_regs_country ON state_regulations(country_code);
ALTER TABLE state_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "read_state_regulations" ON state_regulations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "svc_state_regulations" ON state_regulations FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 1: ZERO-DATA COUNTRIES — IN, ID, TH, VN, PH
-- ═══════════════════════════════════════════════════════════════

INSERT INTO hc_places (slug, name, surface_category_key, locality, admin1_code, country_code, phone, status, claim_status, lat, lng) VALUES
-- India (IN) — 15 places
('nhava-sheva-port-in','Jawaharlal Nehru Port (JNPT)','port','Navi Mumbai','MH','IN',NULL,'published','unclaimed',18.95,72.95),
('mundra-port-in','Mundra Port','port','Mundra','GJ','IN',NULL,'published','unclaimed',22.74,69.72),
('chennai-port-in','Chennai Port Trust','port','Chennai','TN','IN',NULL,'published','unclaimed',13.1,80.3),
('kolkata-dock-in','Kolkata Dock System','port','Kolkata','WB','IN',NULL,'published','unclaimed',22.55,88.33),
('vizag-port-in','Visakhapatnam Port','port','Visakhapatnam','AP','IN',NULL,'published','unclaimed',17.69,83.29),
('reliance-jamnagar-in','Reliance Jamnagar Refinery','oil_gas_facility','Jamnagar','GJ','IN',NULL,'published','unclaimed',22.35,69.65),
('mathura-refinery-in','Indian Oil Mathura Refinery','oil_gas_facility','Mathura','UP','IN',NULL,'published','unclaimed',27.49,77.67),
('icd-tughlakabad-in','ICD Tughlakabad','rail_intermodal','New Delhi','DL','IN',NULL,'published','unclaimed',28.51,77.28),
('concor-whitefield-in','CONCOR Whitefield ICD','rail_intermodal','Bangalore','KA','IN',NULL,'published','unclaimed',12.98,77.75),
('pilot-escort-mumbai-in','Mumbai Pilot Escort Services','operator_profile','Mumbai','MH','IN',NULL,'published','unclaimed',19.08,72.88),
('pilot-escort-delhi-in','Delhi NCR Escort Operators','operator_profile','New Delhi','DL','IN',NULL,'published','unclaimed',28.61,77.21),
('pilot-escort-chennai-in','Chennai Escort Services','operator_profile','Chennai','TN','IN',NULL,'published','unclaimed',13.08,80.27),
('nhai-permit-office-in','NHAI Permit Office','permit_office','New Delhi','DL','IN',NULL,'published','unclaimed',28.63,77.22),
('morth-permit-in','MoRTH Transport Office','permit_office','New Delhi','DL','IN',NULL,'published','unclaimed',28.62,77.24),
('indian-oil-fuel-stop-in','Indian Oil Truckers Hub','fuel_stop','Panipat','HR','IN',NULL,'published','unclaimed',29.39,76.97),

-- Indonesia (ID) — 12 places
('tanjung-priok-port-id','Tanjung Priok Port','port','Jakarta','JK','ID',NULL,'published','unclaimed',-6.1,106.89),
('tanjung-perak-port-id','Tanjung Perak Port','port','Surabaya','JI','ID',NULL,'published','unclaimed',-7.2,112.73),
('belawan-port-id','Belawan Port','port','Medan','SU','ID',NULL,'published','unclaimed',3.78,98.69),
('pertamina-cilacap-id','Pertamina Cilacap Refinery','oil_gas_facility','Cilacap','JT','ID',NULL,'published','unclaimed',-7.73,109.0),
('pertamina-balikpapan-id','Pertamina Balikpapan Refinery','oil_gas_facility','Balikpapan','KI','ID',NULL,'published','unclaimed',-1.27,116.83),
('cikarang-dry-port-id','Cikarang Dry Port','rail_intermodal','Cikarang','JB','ID',NULL,'published','unclaimed',-6.32,107.19),
('pilot-jakarta-id','Jakarta Escort Services','operator_profile','Jakarta','JK','ID',NULL,'published','unclaimed',-6.18,106.85),
('pilot-surabaya-id','Surabaya Escort Operators','operator_profile','Surabaya','JI','ID',NULL,'published','unclaimed',-7.26,112.75),
('dishub-jakarta-id','Dishub DKI Jakarta','permit_office','Jakarta','JK','ID',NULL,'published','unclaimed',-6.17,106.84),
('dishub-jatim-id','Dishub Jawa Timur','permit_office','Surabaya','JI','ID',NULL,'published','unclaimed',-7.29,112.74),
('pertamina-fuel-jkt-id','Pertamina Truck Fuel Station','fuel_stop','Jakarta','JK','ID',NULL,'published','unclaimed',-6.22,106.85),
('spbu-surabaya-id','SPBU Trucker Station Surabaya','fuel_stop','Surabaya','JI','ID',NULL,'published','unclaimed',-7.31,112.72),

-- Thailand (TH) — 12 places
('laem-chabang-port-th','Laem Chabang Port','port','Chonburi','20','TH',NULL,'published','unclaimed',13.08,100.88),
('bangkok-port-th','Bangkok Port (Klong Toey)','port','Bangkok','10','TH',NULL,'published','unclaimed',13.71,100.58),
('map-ta-phut-port-th','Map Ta Phut Port','port','Rayong','21','TH',NULL,'published','unclaimed',12.72,101.15),
('thai-oil-sriracha-th','Thai Oil Sriracha Refinery','oil_gas_facility','Chonburi','20','TH',NULL,'published','unclaimed',13.11,100.93),
('irpc-rayong-th','IRPC Rayong Refinery','oil_gas_facility','Rayong','21','TH',NULL,'published','unclaimed',12.68,101.14),
('lat-krabang-icd-th','Lat Krabang ICD','rail_intermodal','Bangkok','10','TH',NULL,'published','unclaimed',13.73,100.78),
('pilot-bangkok-th','Bangkok Escort Services','operator_profile','Bangkok','10','TH',NULL,'published','unclaimed',13.76,100.5),
('pilot-chonburi-th','Chonburi Escort Operators','operator_profile','Chonburi','20','TH',NULL,'published','unclaimed',13.36,100.98),
('dlt-permit-th','DLT Permit Office','permit_office','Bangkok','10','TH',NULL,'published','unclaimed',13.73,100.56),
('ptt-fuel-stop-th','PTT Truck Fuel Station','fuel_stop','Saraburi','19','TH',NULL,'published','unclaimed',14.53,100.91),
('crane-service-eec-th','EEC Heavy Lift Services','crane_service','Chonburi','20','TH',NULL,'published','unclaimed',13.15,100.92),
('heavy-equip-rayong-th','Rayong Heavy Equipment','heavy_equipment_dealer','Rayong','21','TH',NULL,'published','unclaimed',12.71,101.12),

-- Vietnam (VN) — 10 places
('cat-lai-port-vn','Cat Lai Port','port','Ho Chi Minh City','SG','VN',NULL,'published','unclaimed',10.76,106.77),
('hai-phong-port-vn','Hai Phong Port','port','Hai Phong','HP','VN',NULL,'published','unclaimed',20.85,106.68),
('dung-quat-refinery-vn','Dung Quat Refinery','oil_gas_facility','Quang Ngai','QNa','VN',NULL,'published','unclaimed',15.42,108.79),
('nghi-son-refinery-vn','Nghi Son Refinery','oil_gas_facility','Thanh Hoa','TH','VN',NULL,'published','unclaimed',19.63,105.78),
('icd-phuoc-long-vn','ICD Phuoc Long','rail_intermodal','Ho Chi Minh City','SG','VN',NULL,'published','unclaimed',10.82,106.72),
('pilot-hcmc-vn','HCMC Escort Operators','operator_profile','Ho Chi Minh City','SG','VN',NULL,'published','unclaimed',10.78,106.7),
('pilot-hanoi-vn','Hanoi Escort Services','operator_profile','Hanoi','HN','VN',NULL,'published','unclaimed',21.03,105.85),
('mot-permit-vn','Ministry of Transport Permit','permit_office','Hanoi','HN','VN',NULL,'published','unclaimed',21.02,105.84),
('petrolimex-fuel-vn','Petrolimex Truck Station','fuel_stop','Ho Chi Minh City','SG','VN',NULL,'published','unclaimed',10.81,106.69),
('crane-service-hcmc-vn','HCMC Heavy Crane Services','crane_service','Ho Chi Minh City','SG','VN',NULL,'published','unclaimed',10.75,106.73),

-- Philippines (PH) — 10 places
('manila-intl-port-ph','Manila International Container Port','port','Manila','MNL','PH',NULL,'published','unclaimed',14.6,120.95),
('batangas-port-ph','Port of Batangas','port','Batangas','BTG','PH',NULL,'published','unclaimed',13.76,121.05),
('cebu-port-ph','Cebu International Port','port','Cebu City','CEB','PH',NULL,'published','unclaimed',10.3,123.9),
('petron-bataan-ph','Petron Bataan Refinery','oil_gas_facility','Bataan','BAN','PH',NULL,'published','unclaimed',14.68,120.54),
('pilot-manila-ph','Manila Escort Services','operator_profile','Manila','MNL','PH',NULL,'published','unclaimed',14.58,120.98),
('pilot-cebu-ph','Cebu Escort Operators','operator_profile','Cebu City','CEB','PH',NULL,'published','unclaimed',10.31,123.89),
('lto-permit-ph','LTO Special Permit Office','permit_office','Quezon City','MNL','PH',NULL,'published','unclaimed',14.65,121.03),
('dpwh-permit-ph','DPWH Oversize Permits','permit_office','Manila','MNL','PH',NULL,'published','unclaimed',14.59,120.99),
('shell-fuel-manila-ph','Shell Trucker Station Manila','fuel_stop','Manila','MNL','PH',NULL,'published','unclaimed',14.56,121.0),
('crane-manila-ph','Manila Heavy Crane Services','crane_service','Manila','MNL','PH',NULL,'published','unclaimed',14.61,120.97)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 2: EMPTY GOLD TIER — NZ, ZA, DE, NL, AE, BR
-- ═══════════════════════════════════════════════════════════════

INSERT INTO hc_places (slug, name, surface_category_key, locality, admin1_code, country_code, phone, status, claim_status, lat, lng) VALUES
-- New Zealand (NZ) — 12 places
('auckland-port-nz','Ports of Auckland','port','Auckland','AUK','NZ',NULL,'published','unclaimed',-36.84,174.78),
('tauranga-port-nz','Port of Tauranga','port','Tauranga','BOP','NZ',NULL,'published','unclaimed',-37.65,176.18),
('lyttelton-port-nz','Lyttelton Port','port','Christchurch','CAN','NZ',NULL,'published','unclaimed',-43.61,172.72),
('napier-port-nz','Port of Napier','port','Napier','HKB','NZ',NULL,'published','unclaimed',-39.47,176.92),
('marsden-point-nz','Marsden Point Refinery','oil_gas_facility','Whangarei','NTL','NZ',NULL,'published','unclaimed',-35.84,174.49),
('wiri-inland-port-nz','Wiri Inland Port','rail_intermodal','Auckland','AUK','NZ',NULL,'published','unclaimed',-36.99,174.86),
('midland-rail-nz','Midland Rail Hub','rail_intermodal','Christchurch','CAN','NZ',NULL,'published','unclaimed',-43.51,172.56),
('pilot-auckland-nz','Auckland Pilot Car Services','operator_profile','Auckland','AUK','NZ',NULL,'published','unclaimed',-36.85,174.76),
('pilot-christchurch-nz','Christchurch Escort Services','operator_profile','Christchurch','CAN','NZ',NULL,'published','unclaimed',-43.53,172.64),
('pilot-wellington-nz','Wellington Pilot Operators','operator_profile','Wellington','WGN','NZ',NULL,'published','unclaimed',-41.29,174.78),
('nzta-permit-nz','NZTA Overweight Permits','permit_office','Wellington','WGN','NZ',NULL,'published','unclaimed',-41.28,174.77),
('z-energy-truckstop-nz','Z Energy Truck Stop','fuel_stop','Hamilton','WKO','NZ',NULL,'published','unclaimed',-37.79,175.28),

-- South Africa (ZA) — 12 places
('durban-port-za','Port of Durban','port','Durban','KZN','ZA',NULL,'published','unclaimed',-29.87,31.04),
('cape-town-port-za','Port of Cape Town','port','Cape Town','WC','ZA',NULL,'published','unclaimed',-33.91,18.43),
('richards-bay-port-za','Port of Richards Bay','port','Richards Bay','KZN','ZA',NULL,'published','unclaimed',-28.8,32.08),
('ngqura-port-za','Port of Ngqura','port','Gqeberha','EC','ZA',NULL,'published','unclaimed',-33.81,25.68),
('sapref-durban-za','SAPREF Durban Refinery','oil_gas_facility','Durban','KZN','ZA',NULL,'published','unclaimed',-29.91,30.96),
('natref-sasolburg-za','Natref Sasolburg Refinery','oil_gas_facility','Sasolburg','FS','ZA',NULL,'published','unclaimed',-26.79,27.82),
('city-deep-jhb-za','City Deep Container Terminal','rail_intermodal','Johannesburg','GP','ZA',NULL,'published','unclaimed',-26.23,28.07),
('pilot-joburg-za','Johannesburg Pilot Escorts','operator_profile','Johannesburg','GP','ZA',NULL,'published','unclaimed',-26.2,28.05),
('pilot-durban-za','Durban Escort Services','operator_profile','Durban','KZN','ZA',NULL,'published','unclaimed',-29.86,31.02),
('pilot-cape-town-za','Cape Town Pilot Cars','operator_profile','Cape Town','WC','ZA',NULL,'published','unclaimed',-33.93,18.42),
('rtmc-permit-za','RTMC Abnormal Load Permits','permit_office','Pretoria','GP','ZA',NULL,'published','unclaimed',-25.75,28.19),
('engen-truckstop-za','Engen 1-Stop Midrand','fuel_stop','Midrand','GP','ZA',NULL,'published','unclaimed',-25.98,28.13),

-- Germany (DE) — 12 places
('hamburg-port-de','Port of Hamburg','port','Hamburg','HH','DE',NULL,'published','unclaimed',53.54,9.97),
('bremerhaven-port-de','Port of Bremerhaven','port','Bremerhaven','HB','DE',NULL,'published','unclaimed',53.54,8.58),
('duisburg-port-de','Duisport (Duisburg Inland Port)','port','Duisburg','NW','DE',NULL,'published','unclaimed',51.45,6.73),
('bp-gelsenkirchen-de','BP Gelsenkirchen Refinery','oil_gas_facility','Gelsenkirchen','NW','DE',NULL,'published','unclaimed',51.55,7.05),
('miro-karlsruhe-de','MiRO Karlsruhe Refinery','oil_gas_facility','Karlsruhe','BW','DE',NULL,'published','unclaimed',49.02,8.35),
('duss-terminal-de','DUSS Terminal Kornwestheim','rail_intermodal','Kornwestheim','BW','DE',NULL,'published','unclaimed',48.87,9.18),
('mega-hub-lehrte-de','Mega Hub Lehrte','rail_intermodal','Lehrte','NI','DE',NULL,'published','unclaimed',52.38,9.97),
('pilot-hamburg-de','Hamburg Schwertransport Begleitung','operator_profile','Hamburg','HH','DE',NULL,'published','unclaimed',53.55,9.99),
('pilot-nrw-de','NRW Escort Services','operator_profile','Dortmund','NW','DE',NULL,'published','unclaimed',51.51,7.47),
('pilot-bayern-de','Bayern Schwertransport Escorts','operator_profile','Munich','BY','DE',NULL,'published','unclaimed',48.14,11.58),
('stba-permit-de','Straßenverkehrsamt Permit Office','permit_office','Bonn','NW','DE',NULL,'published','unclaimed',50.73,7.1),
('aral-truckstop-de','Aral TruckCenter A2','fuel_stop','Bielefeld','NW','DE',NULL,'published','unclaimed',52.03,8.53),

-- Netherlands (NL) — 12 places
('rotterdam-port-nl','Port of Rotterdam','port','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.9,4.5),
('amsterdam-port-nl','Port of Amsterdam','port','Amsterdam','NH','NL',NULL,'published','unclaimed',52.4,4.79),
('moerdijk-port-nl','Port of Moerdijk','port','Moerdijk','NB','NL',NULL,'published','unclaimed',51.69,4.59),
('shell-pernis-nl','Shell Pernis Refinery','oil_gas_facility','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.88,4.39),
('bp-rotterdam-nl','BP Rotterdam Refinery','oil_gas_facility','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.89,4.37),
('ect-delta-nl','ECT Delta Terminal','rail_intermodal','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.95,4.03),
('rsct-nl','Rotterdam Short Sea Terminal','rail_intermodal','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.91,4.48),
('pilot-rotterdam-nl','Rotterdam Zwaar Transport Begeleiding','operator_profile','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.92,4.48),
('pilot-amsterdam-nl','Amsterdam Escort Services','operator_profile','Amsterdam','NH','NL',NULL,'published','unclaimed',52.37,4.9),
('pilot-eindhoven-nl','Eindhoven Transport Begleiding','operator_profile','Eindhoven','NB','NL',NULL,'published','unclaimed',51.44,5.47),
('rdw-permit-nl','RDW Ontheffingen','permit_office','Zoetermeer','ZH','NL',NULL,'published','unclaimed',52.06,4.48),
('shell-truckpoint-nl','Shell TruckPoint Maasvlakte','fuel_stop','Rotterdam','ZH','NL',NULL,'published','unclaimed',51.96,4.02),

-- UAE (AE) — 12 places
('jebel-ali-port-ae','Jebel Ali Port','port','Dubai','DU','AE',NULL,'published','unclaimed',25.01,55.06),
('khalifa-port-ae','Khalifa Port','port','Abu Dhabi','AZ','AE',NULL,'published','unclaimed',24.8,54.66),
('fujairah-port-ae','Port of Fujairah','port','Fujairah','FU','AE',NULL,'published','unclaimed',25.14,56.36),
('adnoc-ruwais-ae','ADNOC Ruwais Refinery','oil_gas_facility','Ruwais','AZ','AE',NULL,'published','unclaimed',24.1,52.73),
('takreer-refinery-ae','TAKREER Abu Dhabi Refinery','oil_gas_facility','Abu Dhabi','AZ','AE',NULL,'published','unclaimed',24.42,54.42),
('dubai-logistics-city-ae','Dubai Logistics City','rail_intermodal','Dubai','DU','AE',NULL,'published','unclaimed',24.9,55.16),
('icad-musaffah-ae','ICAD Musaffah Logistics','rail_intermodal','Abu Dhabi','AZ','AE',NULL,'published','unclaimed',24.35,54.5),
('pilot-dubai-ae','Dubai Heavy Transport Escorts','operator_profile','Dubai','DU','AE',NULL,'published','unclaimed',25.2,55.27),
('pilot-abudhabi-ae','Abu Dhabi Escort Services','operator_profile','Abu Dhabi','AZ','AE',NULL,'published','unclaimed',24.45,54.65),
('rta-permit-ae','RTA Oversize Transport Permit','permit_office','Dubai','DU','AE',NULL,'published','unclaimed',25.19,55.28),
('adnoc-fuel-ae','ADNOC Truck Fuel Station','fuel_stop','Abu Dhabi','AZ','AE',NULL,'published','unclaimed',24.47,54.37),
('crane-jebel-ali-ae','Jebel Ali Heavy Lift Services','crane_service','Dubai','DU','AE',NULL,'published','unclaimed',25.0,55.08),

-- Brazil (BR) — 12 places
('santos-port-br','Port of Santos','port','Santos','SP','BR',NULL,'published','unclaimed',-23.96,-46.3),
('paranagua-port-br','Port of Paranagua','port','Paranagua','PR','BR',NULL,'published','unclaimed',-25.52,-48.51),
('itaqui-port-br','Port of Itaqui','port','Sao Luis','MA','BR',NULL,'published','unclaimed',-2.57,-44.36),
('suape-port-br','Port of Suape','port','Recife','PE','BR',NULL,'published','unclaimed',-8.39,-34.96),
('replan-paulinia-br','REPLAN Paulinia Refinery','oil_gas_facility','Paulinia','SP','BR',NULL,'published','unclaimed',-22.75,-47.13),
('reduc-rj-br','REDUC Duque de Caxias Refinery','oil_gas_facility','Duque de Caxias','RJ','BR',NULL,'published','unclaimed',-22.57,-43.27),
('terminal-santos-br','Santos Intermodal Terminal','rail_intermodal','Santos','SP','BR',NULL,'published','unclaimed',-23.94,-46.33),
('pilot-sao-paulo-br','Sao Paulo Escort Services','operator_profile','Sao Paulo','SP','BR',NULL,'published','unclaimed',-23.55,-46.63),
('pilot-rio-br','Rio de Janeiro Escorts','operator_profile','Rio de Janeiro','RJ','BR',NULL,'published','unclaimed',-22.91,-43.17),
('pilot-curitiba-br','Curitiba Transport Escorts','operator_profile','Curitiba','PR','BR',NULL,'published','unclaimed',-25.43,-49.27),
('dnit-permit-br','DNIT Autorizacao Especial de Transito','permit_office','Brasilia','DF','BR',NULL,'published','unclaimed',-15.79,-47.88),
('petrobras-fuel-br','Petrobras Truck Posto','fuel_stop','Campinas','SP','BR',NULL,'published','unclaimed',-22.91,-47.06)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 3: REMAINING BLUE/SILVER COUNTRIES (10 places each)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO hc_places (slug, name, surface_category_key, locality, admin1_code, country_code, phone, status, claim_status, lat, lng) VALUES
-- France (FR)
('le-havre-port-fr','Port of Le Havre','port','Le Havre','76','FR',NULL,'published','unclaimed',49.49,0.12),
('marseille-port-fr','Port of Marseille-Fos','port','Marseille','13','FR',NULL,'published','unclaimed',43.34,5.32),
('total-gonfreville-fr','TotalEnergies Gonfreville Refinery','oil_gas_facility','Gonfreville','76','FR',NULL,'published','unclaimed',49.49,0.22),
('valenton-terminal-fr','Valenton Intermodal Terminal','rail_intermodal','Valenton','94','FR',NULL,'published','unclaimed',48.75,2.45),
('pilot-paris-fr','Ile-de-France Convoi Exceptionnel','operator_profile','Paris','75','FR',NULL,'published','unclaimed',48.86,2.35),
('pilot-lyon-fr','Lyon Escort Convoi','operator_profile','Lyon','69','FR',NULL,'published','unclaimed',45.76,4.84),
('dreal-permit-fr','DREAL Autorisation Convoi','permit_office','Paris','75','FR',NULL,'published','unclaimed',48.85,2.34),
('total-fuel-fr','TotalEnergies Relais Routier','fuel_stop','Rouen','76','FR',NULL,'published','unclaimed',49.44,1.1),
('crane-fos-fr','Fos Heavy Lift Services','crane_service','Fos-sur-Mer','13','FR',NULL,'published','unclaimed',43.44,4.94),
('heavy-equip-lyon-fr','Lyon Heavy Equipment Dealer','heavy_equipment_dealer','Lyon','69','FR',NULL,'published','unclaimed',45.74,4.86),

-- Sweden (SE)
('gothenburg-port-se','Port of Gothenburg','port','Gothenburg','VG','SE',NULL,'published','unclaimed',57.69,11.94),
('stockholm-port-se','Ports of Stockholm','port','Stockholm','AB','SE',NULL,'published','unclaimed',59.33,18.11),
('preem-lysekil-se','Preem Lysekil Refinery','oil_gas_facility','Lysekil','VG','SE',NULL,'published','unclaimed',58.28,11.43),
('pilot-gothenburg-se','Gothenburg Eskort Fordon','operator_profile','Gothenburg','VG','SE',NULL,'published','unclaimed',57.71,11.97),
('pilot-stockholm-se','Stockholm Transport Escorts','operator_profile','Stockholm','AB','SE',NULL,'published','unclaimed',59.33,18.07),
('trafikverket-permit-se','Trafikverket Dispenstillstand','permit_office','Borlange','W','SE',NULL,'published','unclaimed',60.49,15.44),
('circle-k-truckstop-se','Circle K Truck Station','fuel_stop','Jonkoping','F','SE',NULL,'published','unclaimed',57.78,14.16),

-- Norway (NO)
('oslo-port-no','Port of Oslo','port','Oslo','03','NO',NULL,'published','unclaimed',59.91,10.74),
('bergen-port-no','Port of Bergen','port','Bergen','46','NO',NULL,'published','unclaimed',60.39,5.32),
('equinor-mongstad-no','Equinor Mongstad Refinery','oil_gas_facility','Mongstad','46','NO',NULL,'published','unclaimed',60.81,5.03),
('pilot-oslo-no','Oslo Eskortekjoretoy','operator_profile','Oslo','03','NO',NULL,'published','unclaimed',59.91,10.75),
('pilot-bergen-no','Bergen Escort Services','operator_profile','Bergen','46','NO',NULL,'published','unclaimed',60.39,5.33),
('vegvesen-permit-no','Statens Vegvesen Dispensasjon','permit_office','Oslo','03','NO',NULL,'published','unclaimed',59.92,10.73),

-- Italy (IT)
('genoa-port-it','Port of Genoa','port','Genoa','GE','IT',NULL,'published','unclaimed',44.41,8.92),
('gioia-tauro-port-it','Port of Gioia Tauro','port','Gioia Tauro','RC','IT',NULL,'published','unclaimed',38.43,15.9),
('sarroch-refinery-it','Saras Sarroch Refinery','oil_gas_facility','Sarroch','CA','IT',NULL,'published','unclaimed',39.07,9.01),
('pilot-milan-it','Milano Trasporto Eccezionale','operator_profile','Milan','MI','IT',NULL,'published','unclaimed',45.46,9.19),
('anas-permit-it','ANAS Autorizzazione Trasporto','permit_office','Roma','RM','IT',NULL,'published','unclaimed',41.9,12.49),

-- Spain (ES)
('algeciras-port-es','Port of Algeciras','port','Algeciras','CA','ES',NULL,'published','unclaimed',36.13,-5.43),
('valencia-port-es','Port of Valencia','port','Valencia','V','ES',NULL,'published','unclaimed',39.45,-0.32),
('repsol-cartagena-es','Repsol Cartagena Refinery','oil_gas_facility','Cartagena','MU','ES',NULL,'published','unclaimed',37.57,-0.97),
('pilot-madrid-es','Madrid Transporte Especial','operator_profile','Madrid','M','ES',NULL,'published','unclaimed',40.42,-3.7),
('dgt-permit-es','DGT Autorizacion Transporte','permit_office','Madrid','M','ES',NULL,'published','unclaimed',40.43,-3.69),

-- Mexico (MX)
('manzanillo-port-mx','Port of Manzanillo','port','Manzanillo','COL','MX',NULL,'published','unclaimed',19.05,-104.32),
('lazaro-cardenas-port-mx','Port of Lazaro Cardenas','port','Lazaro Cardenas','MIC','MX',NULL,'published','unclaimed',17.94,-102.18),
('veracruz-port-mx','Port of Veracruz','port','Veracruz','VER','MX',NULL,'published','unclaimed',19.2,-96.13),
('pemex-tula-mx','PEMEX Tula Refinery','oil_gas_facility','Tula','HID','MX',NULL,'published','unclaimed',20.06,-99.34),
('pilot-monterrey-mx','Monterrey Escort Services','operator_profile','Monterrey','NLE','MX',NULL,'published','unclaimed',25.67,-100.31),
('pilot-cdmx-mx','CDMX Heavy Transport Escorts','operator_profile','Mexico City','CMX','MX',NULL,'published','unclaimed',19.43,-99.13),
('sct-permit-mx','SCT Permiso Transporte','permit_office','Mexico City','CMX','MX',NULL,'published','unclaimed',19.42,-99.17),

-- South Korea (KR)
('busan-port-kr','Port of Busan','port','Busan','26','KR',NULL,'published','unclaimed',35.1,129.04),
('incheon-port-kr','Port of Incheon','port','Incheon','28','KR',NULL,'published','unclaimed',37.45,126.59),
('sk-ulsan-kr','SK Energy Ulsan Refinery','oil_gas_facility','Ulsan','31','KR',NULL,'published','unclaimed',35.5,129.39),
('pilot-seoul-kr','Seoul Heavy Transport Escort','operator_profile','Seoul','11','KR',NULL,'published','unclaimed',37.57,126.98),
('molit-permit-kr','MOLIT Oversize Permit','permit_office','Sejong','36','KR',NULL,'published','unclaimed',36.51,127.0),

-- Japan (JP)
('yokohama-port-jp','Port of Yokohama','port','Yokohama','14','JP',NULL,'published','unclaimed',35.44,139.65),
('kobe-port-jp','Port of Kobe','port','Kobe','28','JP',NULL,'published','unclaimed',34.67,135.2),
('nagoya-port-jp','Port of Nagoya','port','Nagoya','23','JP',NULL,'published','unclaimed',35.08,136.88),
('jxtg-kawasaki-jp','ENEOS Kawasaki Refinery','oil_gas_facility','Kawasaki','14','JP',NULL,'published','unclaimed',35.52,139.74),
('pilot-tokyo-jp','Tokyo Heavy Escort Services','operator_profile','Tokyo','13','JP',NULL,'published','unclaimed',35.68,139.69),
('mlit-permit-jp','MLIT Special Vehicle Permit','permit_office','Tokyo','13','JP',NULL,'published','unclaimed',35.67,139.75),

-- Poland (PL)
('gdansk-port-pl','Port of Gdansk','port','Gdansk','PM','PL',NULL,'published','unclaimed',54.39,18.66),
('szczecin-port-pl','Port of Szczecin','port','Szczecin','ZP','PL',NULL,'published','unclaimed',53.43,14.58),
('plock-refinery-pl','PKN Orlen Plock Refinery','oil_gas_facility','Plock','MZ','PL',NULL,'published','unclaimed',52.55,19.72),
('pilot-warsaw-pl','Warsaw Transport Nienormatywny','operator_profile','Warsaw','MZ','PL',NULL,'published','unclaimed',52.23,21.01),
('gddkia-permit-pl','GDDKiA Zezwolenie','permit_office','Warsaw','MZ','PL',NULL,'published','unclaimed',52.24,21.0),

-- Turkey (TR)
('ambarli-port-tr','Port of Ambarli','port','Istanbul','34','TR',NULL,'published','unclaimed',40.98,28.69),
('mersin-port-tr','Port of Mersin','port','Mersin','33','TR',NULL,'published','unclaimed',36.78,34.63),
('tupras-izmit-tr','TUPRAS Izmit Refinery','oil_gas_facility','Izmit','41','TR',NULL,'published','unclaimed',40.76,29.46),
('pilot-istanbul-tr','Istanbul Ozel Tasima Eskortu','operator_profile','Istanbul','34','TR',NULL,'published','unclaimed',41.01,28.98),
('kgm-permit-tr','KGM Ozel Yukleme Izni','permit_office','Ankara','06','TR',NULL,'published','unclaimed',39.93,32.86),

-- Saudi Arabia (SA)
('jeddah-port-sa','Jeddah Islamic Port','port','Jeddah','02','SA',NULL,'published','unclaimed',21.49,39.17),
('jubail-port-sa','King Fahd Industrial Port Jubail','port','Jubail','04','SA',NULL,'published','unclaimed',27.02,49.66),
('aramco-ras-tanura-sa','Saudi Aramco Ras Tanura','oil_gas_facility','Ras Tanura','04','SA',NULL,'published','unclaimed',26.64,50.16),
('pilot-riyadh-sa','Riyadh Heavy Transport Escorts','operator_profile','Riyadh','01','SA',NULL,'published','unclaimed',24.71,46.67),
('mot-permit-sa','Ministry of Transport Permit','permit_office','Riyadh','01','SA',NULL,'published','unclaimed',24.69,46.72)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 4: CORRIDORS (Top 30 Global Heavy Haul Routes)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO corridors (name, corridor_type, revenue_per_mile, permit_volume_annual, superload_density) VALUES
('I-10 Houston to El Paso','interstate',3.50,8500,0.7),
('I-20 Dallas to Midland','interstate',3.75,6200,0.8),
('I-45 Houston to Dallas','interstate',3.25,5800,0.6),
('I-35 Laredo to OKC','cross_border',4.00,4200,0.5),
('I-75 Atlanta to Detroit','interstate',2.80,9100,0.4),
('I-80 Cheyenne to Sacramento','interstate',3.00,3800,0.6),
('I-90 Seattle to Chicago','interstate',2.90,4500,0.5),
('I-70 Denver to KC','interstate',2.75,3200,0.4),
('I-5 LA to Portland','interstate',3.10,7200,0.6),
('I-40 Memphis to Amarillo','interstate',2.85,4100,0.5),
('US 59 Houston to Lufkin','energy_utility',4.50,3500,0.9),
('TX 87 Port Arthur to Beaumont','energy_utility',5.00,2800,0.95),
('Permian Basin Loop TX','resource_extraction',5.50,6800,1.0),
('Bakken Loop ND','resource_extraction',4.25,2900,0.85),
('Alaska Haul Road Fairbanks-Prudhoe','resource_extraction',8.00,950,0.9),
('Trans-Canada Calgary to Vancouver','cross_border',3.50,3100,0.6),
('QEW Toronto to Niagara','cross_border',3.00,2400,0.4),
('A2 Rotterdam to Berlin','cross_border',4.00,1800,0.5),
('M1 London to Leeds UK','interstate',4.50,2200,0.4),
('Pacific Highway Sydney to Brisbane','interstate',3.25,1900,0.5),
('Bruce Highway Brisbane to Townsville','interstate',3.50,1100,0.6),
('N3 Durban to Johannesburg','interstate',2.50,1500,0.5),
('NH 48 Mumbai to Ahmedabad','interstate',1.80,2100,0.4),
('Autopista Mexico to Guadalajara','interstate',2.00,1800,0.4),
('Santos to Sao Paulo Corridor','port_to_inland',2.50,3200,0.6),
('Jebel Ali to Abu Dhabi','port_to_inland',5.00,1600,0.7),
('Laem Chabang to Bangkok','port_to_inland',2.00,2400,0.5),
('Busan to Seoul Corridor','interstate',3.00,1500,0.4),
('State Highway 1 NZ Auckland-Wellington','interstate',3.00,800,0.3),
('E45 Gothenburg to Stockholm','interstate',3.50,900,0.3)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 5: STATE REGULATIONS SEED (Key Markets)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO state_regulations (country_code, jurisdiction_code, jurisdiction_name, escort_required_width_ft, escort_required_length_ft, escort_required_height_ft, escort_required_weight_lbs, max_escorts_required, police_escort_threshold, permit_authority, permit_url, notes) VALUES
('US','TX','Texas',14.0,125.0,17.0,200000,2,'Width > 16ft or weight > 250,000 lbs','TxDMV','https://www.txdmv.gov/oversize-overweight-permits','Escort required front and rear for superloads'),
('US','CA','California',12.0,120.0,15.0,200000,2,'Width > 14ft','Caltrans','https://dot.ca.gov/programs/traffic-operations/permits','CHP escort for width > 14ft on freeways'),
('US','OH','Ohio',14.0,120.0,15.5,200000,2,'Width > 16ft','ODOT','https://www.transportation.ohio.gov/permits','Front and rear escort for superloads'),
('US','PA','Pennsylvania',14.0,120.0,15.0,201000,2,'Width > 16ft or height > 16ft','PennDOT','https://www.penndot.pa.gov/','Police escort for certain routes'),
('US','FL','Florida',14.5,120.0,15.5,199000,2,'Width > 16ft','FDOT','https://www.fdot.gov/maintenance/maintenance-permits','Front escort required > 14.5ft wide'),
('US','GA','Georgia',14.0,120.0,15.5,200000,2,'Width > 16ft','GDOT','https://www.dot.ga.gov/InvestSust/Permits','Law enforcement escort over 16ft'),
('US','NY','New York',14.0,100.0,14.5,200000,2,'Width > 16ft','NYSDOT','https://www.dot.ny.gov/divisions/operating/oom/transportation-systems/permits','State police escort for superloads'),
('US','IL','Illinois',14.5,120.0,15.5,200000,2,'Width > 16ft or length > 150ft','IDOT','https://idot.illinois.gov/transportation-system/permits','Police escort for interstates > 16ft'),
('CA','ON','Ontario',4.3,36.6,4.7,91000,2,'Width > 5.0m','MTO','https://www.ontario.ca/page/oversize-overweight-vehicle-permits','Provincial escort over 5m wide'),
('CA','AB','Alberta',4.3,36.6,5.3,91000,2,'Width > 5.5m','Alberta Transportation','https://www.alberta.ca/oversize-overweight-permits','Pilot car required > 3.85m wide'),
('AU','NSW','New South Wales',4.5,36.0,5.0,90000,2,'Width > 5.0m','Transport for NSW','https://roads-waterways.transport.nsw.gov.au/','Pilot vehicle required > 3.5m wide'),
('AU','QLD','Queensland',4.5,36.0,5.0,90000,2,'Width > 5.0m','TMR','https://www.tmr.qld.gov.au/business-industry/heavy-vehicles','Escort required > 3.5m wide'),
('GB','ENG','England',4.3,30.0,5.0,80000,2,'Width > 5.0m or 150+ tonnes','National Highways','https://www.gov.uk/government/publications/abnormal-loads','Police notification required > 5m'),
('DE','NRW','North Rhine-Westphalia',4.0,30.0,4.2,72000,2,'Width > 4.5m','Straßenverkehrsamt','https://www.bast.de/','BF3 escort required > 3.5m wide'),
('NZ','AUK','Auckland',3.7,25.0,4.5,62000,2,'Width > 5.0m','NZTA','https://www.nzta.govt.nz/vehicles/','Pilot vehicle required > 3.1m wide'),
('ZA','GP','Gauteng',3.5,22.0,4.6,56000,2,'Width > 4.3m','RTMC','https://www.rtmc.co.za/','Escort required > 3.5m wide'),
('BR','SP','Sao Paulo',3.4,30.0,5.5,74000,2,'Width > 4.0m','DNIT','https://www.gov.br/dnit/','AET required for all oversize loads'),
('AE','DU','Dubai',4.0,25.0,4.5,100000,2,'Width > 4.5m or weight > 80t','RTA','https://www.rta.ae/','Escort required for all oversize permits'),
('IN','MH','Maharashtra',3.6,24.0,4.5,55000,2,'Width > 3.6m','NHAI','https://nhai.gov.in/','Pilot vehicle required for all ODC cargo'),
('TH','10','Bangkok',3.4,22.0,4.2,50000,2,'Width > 3.5m','DLT','https://www.dlt.go.th/','Military escort may be required for superloads')
ON CONFLICT (country_code, jurisdiction_code) DO NOTHING;

-- Update global_countries scores based on new data
UPDATE global_countries SET
  operators_score = 25,
  corridors_score = 0,
  updated_at = now()
WHERE country_code IN ('IN','ID','TH','VN','PH','NZ','ZA','DE','NL','AE','BR','FR','SE','NO','IT','ES','MX','KR','JP','PL','TR','SA');
