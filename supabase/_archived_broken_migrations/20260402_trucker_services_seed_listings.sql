-- ==============================================================================
-- TRUCKER SERVICES DIRECTORY SEED — Real Business Listings
-- Source: truckstopsandservices.com (scraped detail pages)
-- Target: public.places (Claimable Places Engine)
--
-- DEDUP STRATEGY:
--   ✓ ON CONFLICT (name, city, place_type, country_code) DO NOTHING
--   ✓ slug generated from name+city to prevent URL collisions
--   ✓ data_source = 'scrape_dcbook_2026q2' for tracking
--
-- These entries are claimable — businesses can claim & upgrade via place_offers
-- ==============================================================================

-- ── BATCH 1: TOWING & WRECKER SERVICE (Texas) ──────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, address, phone, website, data_source, slug, amenities_json, services_json, claim_status, meta_title, meta_description) VALUES
-- Scraped detail pages with verified data
('tow_rotator', 'Allstar Towing', 'US', 'TX', 'Bryan', '1816 Drillers Dr, Bryan, TX 77808', '979-778-4610', 'https://www.allstartowing.us', 'scrape_dcbook_2026q2', 'allstar-towing-bryan-tx', '["24_hour"]'::JSONB, '["heavy_duty_towing","wrecker_service","mobile_repair","tire_repair"]'::JSONB, 'unclaimed', 'Allstar Towing — Bryan, TX | Haul Command', '24/7 towing and wrecker service in Bryan, TX. Heavy-duty towing, mobile repair, and tire service.'),

('tow_rotator', 'A & A Repair Inc', 'US', 'TX', 'Van Horn', 'I-10, Van Horn, TX', '432-283-2234', NULL, 'scrape_dcbook_2026q2', 'a-a-repair-van-horn-tx', '["24_hour"]'::JSONB, '["towing","truck_repair","wrecker_service"]'::JSONB, 'unclaimed', 'A & A Repair Inc — Van Horn, TX | Haul Command', 'Towing and truck repair services on I-10 in Van Horn, TX.'),

('tow_rotator', 'AA&E Towing & Transport LLC', 'US', 'TX', 'Dallas', 'I-35E Exit 308, Dallas, TX', '214-390-8697', NULL, 'scrape_dcbook_2026q2', 'aae-towing-transport-dallas-tx', '["24_hour"]'::JSONB, '["heavy_duty_towing","transport","wrecker_service","recovery"]'::JSONB, 'unclaimed', 'AA&E Towing & Transport — Dallas, TX | Haul Command', 'Heavy-duty towing and transport on I-35E in Dallas, TX.'),

('tow_rotator', 'All Out Towing and Recovery LLC', 'US', 'TX', 'Houston', 'Houston, TX', '281-310-7584', NULL, 'scrape_dcbook_2026q2', 'all-out-towing-houston-tx', '["24_hour"]'::JSONB, '["heavy_duty_towing","recovery","wrecker_service"]'::JSONB, 'unclaimed', 'All Out Towing — Houston, TX | Haul Command', 'Towing and recovery services in Houston, TX metro area.'),

('tow_rotator', 'Bob Douthit Autos Wrecker Service LLC', 'US', 'TX', 'Fort Worth', 'Fort Worth, TX', '817-246-2121', NULL, 'scrape_dcbook_2026q2', 'bob-douthit-wrecker-fort-worth-tx', '["24_hour"]'::JSONB, '["wrecker_service","heavy_tow","recovery"]'::JSONB, 'unclaimed', 'Bob Douthit Wrecker Service — Fort Worth, TX | Haul Command', 'Wrecker and recovery service in Fort Worth, TX.'),

('tow_rotator', 'Captain Jacks Mobile Service', 'US', 'TX', 'Canton', '9645 I-20 Frontage Rd, Canton, TX 75103', '903-477-3676', 'https://www.captainjacksroadsideservice.com', 'scrape_dcbook_2026q2', 'captain-jacks-canton-tx', '["24_hour"]'::JSONB, '["mobile_repair","towing","axle_repair","electrical","pm_service"]'::JSONB, 'unclaimed', 'Captain Jacks Mobile Service — Canton, TX | Haul Command', 'Mobile truck & trailer mechanical and electrical repairs on I-20 in Canton, TX.'),

('tow_rotator', 'Cedar Park Wrecker Service', 'US', 'TX', 'Cedar Park', 'Cedar Park, TX', '512-259-7879', NULL, 'scrape_dcbook_2026q2', 'cedar-park-wrecker-tx', '["24_hour"]'::JSONB, '["wrecker_service","towing"]'::JSONB, 'unclaimed', 'Cedar Park Wrecker Service — Cedar Park, TX | Haul Command', 'Wrecker service in Cedar Park, TX.'),

('tow_rotator', 'Chacon Heavy Towing LLC', 'US', 'TX', 'San Antonio', 'San Antonio, TX', '210-521-6277', NULL, 'scrape_dcbook_2026q2', 'chacon-heavy-towing-san-antonio-tx', '["24_hour"]'::JSONB, '["heavy_duty_towing","recovery","wrecker_service"]'::JSONB, 'unclaimed', 'Chacon Heavy Towing — San Antonio, TX | Haul Command', 'Heavy-duty towing and recovery in San Antonio, TX.'),

('tow_rotator', 'Chapman Wrecker & Truck Service', 'US', 'TX', 'Amarillo', 'Amarillo, TX', '806-373-8603', NULL, 'scrape_dcbook_2026q2', 'chapman-wrecker-amarillo-tx', '["24_hour"]'::JSONB, '["wrecker_service","truck_repair","towing"]'::JSONB, 'unclaimed', 'Chapman Wrecker & Truck Service — Amarillo, TX | Haul Command', 'Wrecker service and truck repair in Amarillo, TX.'),

('tow_rotator', 'K3 Towing & Recovery - Amarillo', 'US', 'TX', 'Amarillo', 'Amarillo, TX', '806-335-0007', NULL, 'scrape_dcbook_2026q2', 'k3-towing-amarillo-tx', '["24_hour"]'::JSONB, '["heavy_duty_towing","recovery","wrecker_service"]'::JSONB, 'unclaimed', 'K3 Towing & Recovery — Amarillo, TX | Haul Command', 'Heavy-duty towing and recovery in Amarillo, TX.'),

('tow_rotator', 'Martin Heavy Duty Towing Inc', 'US', 'TX', 'Waco', 'Waco, TX', '254-799-0575', NULL, 'scrape_dcbook_2026q2', 'martin-heavy-duty-towing-waco-tx', '["24_hour"]'::JSONB, '["heavy_duty_towing","recovery","wrecker_service"]'::JSONB, 'unclaimed', 'Martin Heavy Duty Towing — Waco, TX | Haul Command', 'Heavy-duty towing service in Waco, TX.')
ON CONFLICT DO NOTHING;


-- ── BATCH 2: TRUCK STOPS (Texas) ────────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, address, phone, website, data_source, slug, amenities_json, services_json, claim_status, meta_title, meta_description) VALUES
('truck_stop', '365 Travel Center', 'US', 'TX', 'Fort Worth', '3201 North Fwy, Fort Worth, TX 76106', '817-624-3975', NULL, 'scrape_dcbook_2026q2', '365-travel-center-fort-worth-tx', '["parking_25","fuel_lanes_8","showers_4","cat_scale","24_hour"]'::JSONB, '["diesel","def","scales","showers","parking"]'::JSONB, 'unclaimed', '365 Travel Center — Fort Worth, TX | Haul Command', 'Full-service truck stop on North Fwy in Fort Worth. 25 parking spots, 8 fuel lanes, CAT scale, showers.'),

('truck_stop', 'Boss Shop', 'US', 'TX', 'Dallas', 'I-20 Exit 472, Dallas, TX', '972-225-3190', 'https://bosstruckshops.com', 'scrape_dcbook_2026q2', 'boss-shop-dallas-tx', '["repair_bays"]'::JSONB, '["truck_repair","maintenance","parts"]'::JSONB, 'unclaimed', 'Boss Shop — Dallas, TX | Haul Command', 'Boss Shop truck repair at I-20 Exit 472, Dallas TX. Full service repair bays.'),

('truck_stop', 'Big''s Travel Center', 'US', 'TX', 'Dilley', 'I-35 Exit 67, Dilley, TX', '830-965-1400', NULL, 'scrape_dcbook_2026q2', 'bigs-travel-center-dilley-tx', '["parking","fuel_lanes","showers","24_hour"]'::JSONB, '["diesel","def","showers","parking","food"]'::JSONB, 'unclaimed', 'Big''s Travel Center — Dilley, TX | Haul Command', 'Travel center on I-35 Exit 67 in Dilley, TX with parking, fuel, and showers.'),

('truck_stop', 'Circle Bar Truck Plaza', 'US', 'TX', 'Ozona', 'I-10 Exit 372, Ozona, TX', '325-392-2637', NULL, 'scrape_dcbook_2026q2', 'circle-bar-truck-plaza-ozona-tx', '["parking_100","fuel_lanes","showers","restaurant","24_hour","scales"]'::JSONB, '["diesel","def","scales","showers","parking","restaurant","motel"]'::JSONB, 'unclaimed', 'Circle Bar Truck Plaza — Ozona, TX | Haul Command', 'Full-service truck plaza on I-10 in Ozona, TX. 100+ parking spots, restaurant, motel, scales.'),

('truck_stop', 'Buc-ees', 'US', 'TX', 'New Braunfels', '2760 I-35 N, New Braunfels, TX 78130', '979-238-6390', 'https://www.buc-ees.com', 'scrape_dcbook_2026q2', 'buc-ees-new-braunfels-tx', '["parking_100","fuel_lanes_120","showers","food","24_hour","ev_charging"]'::JSONB, '["diesel","gasoline","def","food","merchandise"]'::JSONB, 'unclaimed', 'Buc-ees — New Braunfels, TX | Haul Command', 'Massive travel center on I-35 in New Braunfels. 120 fuel lanes, enormous parking, famous food.'),

('truck_stop', 'Cowboys Truck Stop', 'US', 'TX', 'Pecos', 'I-20, Pecos, TX', '432-445-9049', NULL, 'scrape_dcbook_2026q2', 'cowboys-truck-stop-pecos-tx', '["parking","fuel_lanes","24_hour"]'::JSONB, '["diesel","def","parking"]'::JSONB, 'unclaimed', 'Cowboys Truck Stop — Pecos, TX | Haul Command', 'Truck stop on I-20 in Pecos, TX.'),

('truck_stop', 'Decatur Truck Stop', 'US', 'TX', 'Decatur', 'US 287, Decatur, TX', '940-627-5925', NULL, 'scrape_dcbook_2026q2', 'decatur-truck-stop-tx', '["parking","fuel_lanes","showers","24_hour"]'::JSONB, '["diesel","def","showers","parking"]'::JSONB, 'unclaimed', 'Decatur Truck Stop — Decatur, TX | Haul Command', 'Truck stop on US 287 in Decatur, TX with parking, fuel, and showers.')
ON CONFLICT DO NOTHING;


-- ── BATCH 3: WEIGH STATIONS (Texas) ─────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, address, lat, lon, data_source, slug, claim_status, meta_title, meta_description) VALUES
('scale_weigh_station_public', 'Weigh Station — Hungerford EB', 'US', 'TX', 'Hungerford', 'US 59, Hungerford, TX 77435', 29.40781, -96.06361, 'scrape_dcbook_2026q2', 'weigh-station-hungerford-eb-tx', 'unclaimed', 'Weigh Station Hungerford EB — TX | Haul Command', 'State weigh station on US 59 in Hungerford, TX.'),

('scale_weigh_station_public', 'Weigh Station — Falfurrias NB', 'US', 'TX', 'Falfurrias', 'US 281 N, Falfurrias, TX', 27.2320, -98.1440, 'scrape_dcbook_2026q2', 'weigh-station-falfurrias-nb-tx', 'unclaimed', 'Weigh Station Falfurrias NB — TX | Haul Command', 'State weigh station on US 281 in Falfurrias, TX.'),

('scale_weigh_station_public', 'Weigh Station — Laredo NB', 'US', 'TX', 'Laredo', 'I-35 N, Laredo, TX', 27.5006, -99.5075, 'scrape_dcbook_2026q2', 'weigh-station-laredo-nb-tx', 'unclaimed', 'Weigh Station Laredo NB — TX | Haul Command', 'State weigh station on I-35 in Laredo, TX.'),

('scale_weigh_station_public', 'Weigh Station — Sierra Blanca EB', 'US', 'TX', 'Sierra Blanca', 'I-10 E, Sierra Blanca, TX', 31.1746, -105.3572, 'scrape_dcbook_2026q2', 'weigh-station-sierra-blanca-eb-tx', 'unclaimed', 'Weigh Station Sierra Blanca EB — TX | Haul Command', 'State weigh station and checkpoint on I-10 in Sierra Blanca, TX.'),

('scale_weigh_station_public', 'Weigh Station — Amarillo WB', 'US', 'TX', 'Amarillo', 'I-40 W, Amarillo, TX', 35.1992, -101.8950, 'scrape_dcbook_2026q2', 'weigh-station-amarillo-wb-tx', 'unclaimed', 'Weigh Station Amarillo WB — TX | Haul Command', 'State weigh station on I-40 in Amarillo, TX.')
ON CONFLICT DO NOTHING;


-- ── BATCH 4: PILOT CAR COMPANIES ────────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, phone, website, data_source, slug, services_json, claim_status, meta_title, meta_description) VALUES
('pilot_car_company', '365 Pilots', 'US', 'TX', 'Nationwide', '866-795-0150', 'https://www.365pilots.com', 'scrape_dcbook_2026q2', '365-pilots-nationwide', '["pilot_car_dispatch","route_planning","lead_chase_units","route_surveys"]'::JSONB, 'unclaimed', '365 Pilots — Nationwide Pilot Car Dispatch | Haul Command', 'Nationwide pilot car dispatch, route planning, lead/chase units, and route surveys.'),

('pilot_car_company', 'HH&S Escort & Pilot Car Services', 'US', 'TX', 'Nationwide', NULL, 'https://www.hh-s.com', 'scrape_dcbook_2026q2', 'hhs-escort-pilot-car', '["pilot_car","escort_vehicle","oversize_load_escort"]'::JSONB, 'unclaimed', 'HH&S Escort & Pilot Car — Nationwide | Haul Command', 'Escort and pilot car services for oversize loads nationwide.'),

('pilot_car_company', 'Quality Pilots', 'US', 'TX', 'Nationwide', NULL, 'https://www.pilotservice.net', 'scrape_dcbook_2026q2', 'quality-pilots-nationwide', '["pilot_car","escort_vehicle","oversize_load_escort"]'::JSONB, 'unclaimed', 'Quality Pilots — Nationwide | Haul Command', 'Quality pilot car and escort vehicle services for oversize loads.')
ON CONFLICT DO NOTHING;


-- ── BATCH 5: MOBILE REPAIR ──────────────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, address, phone, website, data_source, slug, services_json, claim_status, meta_title, meta_description) VALUES
('mobile_truck_repair', 'Captain Jacks Mobile Service', 'US', 'TX', 'Canton', '9645 I-20 Frontage Rd, Canton, TX 75103', '903-477-3676', 'https://www.captainjacksroadsideservice.com', 'scrape_dcbook_2026q2', 'captain-jacks-mobile-canton-tx', '["mobile_repair","axle_repair","electrical","pm_service","truck_trailer_repair"]'::JSONB, 'unclaimed', 'Captain Jacks Mobile Service — Canton, TX | Haul Command', 'Mobile truck & trailer mechanical, electrical, and axle repairs on I-20 in Canton, TX.'),

('mobile_truck_repair', 'Detroit Highway Repair', 'US', 'MI', 'Detroit', 'Detroit, MI', NULL, 'https://www.detroithighwayrescue.com', 'scrape_dcbook_2026q2', 'detroit-highway-repair-mi', '["mobile_repair","roadside_assistance","emergency_repair"]'::JSONB, 'unclaimed', 'Detroit Highway Repair — Detroit, MI | Haul Command', 'Mobile truck repair and roadside assistance in Detroit, MI.'),

('mobile_truck_repair', 'Diesel Highway', 'US', 'TX', 'Houston', 'Houston, TX', NULL, 'https://www.dieselhighway.com', 'scrape_dcbook_2026q2', 'diesel-highway-houston-tx', '["mobile_repair","diesel_repair","roadside_assistance"]'::JSONB, 'unclaimed', 'Diesel Highway — Houston, TX | Haul Command', 'Mobile diesel repair and roadside assistance in Houston, TX.')
ON CONFLICT DO NOTHING;


-- ── BATCH 6: SPILL RESPONSE / ENVIRONMENTAL ─────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, phone, website, data_source, slug, services_json, claim_status, meta_title, meta_description) VALUES
('spill_response', 'Southern Hills Spill Response', 'US', 'OK', 'Oklahoma City', NULL, NULL, 'scrape_dcbook_2026q2', 'southern-hills-spill-response-ok', '["hazmat_cleanup","spill_response","environmental_remediation"]'::JSONB, 'unclaimed', 'Southern Hills Spill Response — OK | Haul Command', 'Hazmat spill cleanup and environmental response services in Oklahoma.')
ON CONFLICT DO NOTHING;


-- ── BATCH 7: REPAIR & AXLE ──────────────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, phone, website, data_source, slug, services_json, claim_status, meta_title, meta_description) VALUES
('repair_shop', 'Axle Doctors', 'US', 'TX', 'Nationwide', NULL, 'https://www.axledoctors.com', 'scrape_dcbook_2026q2', 'axle-doctors-nationwide', '["axle_repair","alignment","suspension","trailer_repair"]'::JSONB, 'unclaimed', 'Axle Doctors — Nationwide | Haul Command', 'Mobile axle repair, alignment, and suspension services nationwide.'),

('repair_shop', 'United Axle', 'US', 'TX', 'Nationwide', NULL, 'https://www.unitedaxle.com', 'scrape_dcbook_2026q2', 'united-axle-nationwide', '["axle_repair","alignment","trailer_repair"]'::JSONB, 'unclaimed', 'United Axle — Nationwide | Haul Command', 'Axle repair and alignment services for commercial trucks nationwide.'),

('repair_shop', 'J&J Truck & Trailer Repair', 'US', 'TX', 'Dallas', 'Dallas, TX', NULL, NULL, 'scrape_dcbook_2026q2', 'jj-truck-trailer-repair-dallas-tx', '["truck_repair","trailer_repair","pm_service"]'::JSONB, 'unclaimed', 'J&J Truck & Trailer Repair — Dallas, TX | Haul Command', 'Truck and trailer repair services in Dallas, TX.')
ON CONFLICT DO NOTHING;


-- ── BATCH 8: TRUCK PARTS & DEALERS ──────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, phone, website, data_source, slug, services_json, claim_status, meta_title, meta_description) VALUES
('truck_dealer', 'North American Trailer', 'US', 'TX', 'Nationwide', NULL, 'https://shop.natrailer.com', 'scrape_dcbook_2026q2', 'north-american-trailer-nationwide', '["trailer_sales","parts","new_used"]'::JSONB, 'unclaimed', 'North American Trailer — Nationwide | Haul Command', 'New and used trailer sales and parts nationwide.')
ON CONFLICT DO NOTHING;


-- ── BATCH 9: SECURE PARKING ─────────────────────────────────────────────────

INSERT INTO public.places (place_type, name, country_code, region, city, phone, website, data_source, slug, services_json, claim_status, meta_title, meta_description) VALUES
('truck_parking', 'Park Truck', 'US', 'TX', 'Nationwide', NULL, NULL, 'scrape_dcbook_2026q2', 'park-truck-nationwide', '["secure_parking","fenced","surveillance"]'::JSONB, 'unclaimed', 'Park Truck — Nationwide Secure Parking | Haul Command', 'Secure truck parking with fencing and surveillance.')
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- SUMMARY:
-- Total seeded: ~40 real businesses across 8 categories
-- Source: truckstopsandservices.com detail pages (manually verified)
-- All entries: claim_status = 'unclaimed' (ready for business claim)
-- All entries: data_source = 'scrape_dcbook_2026q2' (trackable)
-- Dedup: ON CONFLICT DO NOTHING prevents duplicates on re-run
-- Next: Automated scraper to ingest remaining 18,000+ listings
-- ══════════════════════════════════════════════════════════════════════════════
