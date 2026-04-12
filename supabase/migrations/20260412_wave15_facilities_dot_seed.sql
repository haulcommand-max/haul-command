-- ========================================================================================
-- Haul Command OS - 2026-04-12
-- Wave 15: DOT Facility UGC Seed (Cold-Start Elimination)
-- Seeds weigh stations, major ports, and truck stops into the facilities database 
-- to provide immediate utility to the mapping surface and UGC engine.
-- ========================================================================================

INSERT INTO public.facilities (
    name, address, city, state_province, country_code, latitude, longitude, type, is_verified
) 
VALUES 
-- Weigh Stations
('I-80 Westbound Weigh Station', 'I-80 WB Mile Marker 290', 'Walcott', 'IA', 'US', 41.6, -90.7, 'weigh_station', true),
('I-10 Eastbound Weigh Station', 'I-10 EB', 'Banning', 'CA', 'US', 33.91, -116.89, 'weigh_station', true),
('I-95 Northbound Weigh Station', 'I-95 NB', 'Perryville', 'MD', 'US', 39.58, -76.08, 'weigh_station', true),
('I-40 Eastbound Scales', 'I-40 EB Mile 242', 'Knoxville', 'TN', 'US', 35.88, -84.14, 'weigh_station', true),

-- Rest Stops / Truck Stops
('Iowa 80 Truckstop', '390 W Iowa 80 Rd', 'Walcott', 'IA', 'US', 41.60, -90.77, 'rest_stop', true),
('Jubitz Truck Stop', '10210 N Vancouver Way', 'Portland', 'OR', 'US', 45.60, -122.68, 'rest_stop', true),
('TA Travel Center', 'I-40 Exit 66', 'Amarillo', 'TX', 'US', 35.19, -101.76, 'rest_stop', true),

-- Major Ports
('Port of Long Beach', '925 Harbor Plaza', 'Long Beach', 'CA', 'US', 33.75, -118.21, 'port', true),
('Port of Houston', '111 E Loop North', 'Houston', 'TX', 'US', 29.74, -95.26, 'port', true),
('Port of Savannah (Garden City Terminal)', '2 Main St', 'Garden City', 'GA', 'US', 32.12, -81.14, 'port', true)
ON CONFLICT DO NOTHING;
