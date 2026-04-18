-- 🏗️ HAUL COMMAND OS: SURVIVAL LAYER SEED DATA
-- "Activation Protocol" for Infrastructure Revenue

-- 1. LODGING PARTNERS (The "Sleep Revenue" Network)
-- Focusing on I-40, I-80, I-10 corridors
INSERT INTO lodging_partners (partner_name, chain_id, address, city, state, zip, lat, lon, clc_accepted, truck_parking_spaces, phone, email)
VALUES
('Motel 6 West Memphis', 'M6-001', '3400 Service Loop', 'West Memphis', 'AR', '72301', 35.1465, -90.1848, true, 25, '870-735-1000', 'mgr.m6.wmphis@motel6.com'),
('Red Roof Inn Knoxville', 'RR-882', '105 Mozelle Ct', 'Knoxville', 'TN', '37920', 35.9606, -83.9207, true, 15, '865-577-4455', 'frontdesk@redroofknox.com'),
('Super 8 by Wyndham Big Springs', 'S8-102', '120 W Hwy 30', 'Big Springs', 'NE', '69122', 41.1308, -102.0463, true, 40, '308-889-3661', 'super8bigsprings@wyndham.com'),
('Econo Lodge Kingman', 'EL-440', '1112 W Beale St', 'Kingman', 'AZ', '86401', 35.1891, -114.0587, true, 20, '928-753-2155', 'gm.kingman@choicehotels.com'),
('Days Inn by Wyndham Tucumcari', 'DI-992', '2806 S 1st St', 'Tucumcari', 'NM', '88401', 35.1717, -103.7250, true, 35, '575-461-4340', 'daysinn.tucumcari@wyndham.com');

-- 2. UTILITY EMERGENCY RESPONSE (The "911 Bucket Truck" Force)
-- High-Pole Lift & Signal Repair Units
INSERT INTO utility_emergency_status (company_id, unit_id, is_active, current_lat, current_lon, lift_height_feet, service_radius_miles, rate_per_hour)
VALUES
((SELECT id FROM companies WHERE name = 'Red Hawk Utility Services' LIMIT 1), 'RH-UNIT-01', true, 35.4676, -97.5164, 55, 100, 250.00), -- OKC
((SELECT id FROM companies WHERE name = 'Lone Star Power' LIMIT 1), 'LS-UNIT-99', true, 32.7767, -96.7970, 75, 150, 300.00), -- Dallas
((SELECT id FROM companies WHERE name = 'Midwest Electric Corp' LIMIT 1), 'MW-UNIT-04', true, 41.8781, -87.6298, 60, 120, 275.00), -- Chicago
((SELECT id FROM companies WHERE name = 'Titan Lift Ops' LIMIT 1), 'TL-UNIT-12', true, 33.7490, -84.3880, 45, 80, 225.00); -- Atlanta

-- 3. ROUTE INTELLIGENCE PACKAGES (Data Monetization)
-- Selling data to Engineering Firms & DOTs
INSERT INTO route_intelligence_packages (pkg_name, pkg_description, monthly_price, access_level, target_audience)
VALUES
('Bridge Strike Risk Feed', 'Real-time JSON feed of verified bridge clearances < 15ft across 48 states. Updated hourly by active pilot cars.', 499.00, 'api_read_only', 'insurance_carriers'),
('Construction Delay Heatmap', 'Aggregated delay times and lane closure signals derived from GPS velocity of 5,000+ escort vehicles.', 299.00, 'dashboard_access', 'logistics_planners'),
('Infrastructure Degradation Report', 'Monthly PDF + CSV report identifying "Soft Shoulders" and "Pothole Clusters" reported by heavy haul drivers.', 999.00, 'full_export', 'state_dot_engineering'),
('Superload Corridor Master', 'The ultimate routing dataset: All 18ft+ cleared routes, updated daily.', 1499.00, 'enterprise_api', 'civil_engineering_firms');

-- 4. AFFILIATE LOGIC (Simulating Kickbacks)
INSERT INTO affiliate_conversions (booking_source, affiliate_partner_id, commission_rate, active_status)
VALUES
('clc_lodging_api', 'CLC-PARTNER-001', 0.05, true),
('truck_parking_club', 'TPC-PARTNER-002', 0.10, true),
('goodyear_tire_network', 'GY-PARTNER-003', 0.08, true);

-- 5. FINANCIAL RAILS (Wealth Vault & Split Seeds)
-- Simulating automated wealth building for Elite providers
INSERT INTO wallets (identity_id, currency, balance, stripe_connect_id, rapid_card_account_id)
SELECT 
    id, 
    'USD', 
    2500.00, 
    'stripe_acc_' || lower(replace(name, ' ', '_')), 
    'rapid_acc_' || lower(replace(name, ' ', '_'))
FROM companies 
WHERE name IN ('Red Hawk Utility Services', 'Lone Star Power');

-- 90% Fiat / 10% BTC Split Rules
INSERT INTO split_payment_rules (wallet_id, destination_type, destination_asset, percentage_split)
SELECT id, 'rapid_card', 'USD', 90.00 FROM wallets WHERE stripe_connect_id LIKE 'stripe_acc%';

INSERT INTO split_payment_rules (wallet_id, destination_type, destination_asset, percentage_split)
SELECT id, 'crypto_vault', 'BTC', 10.00 FROM wallets WHERE stripe_connect_id LIKE 'stripe_acc%';

-- Initialize the Wealth Vaults
INSERT INTO crypto_vaults (wallet_id, asset_code, balance_crypto, balance_usd_val, nowpayments_sub_account_id)
SELECT id, 'BTC', 0.0425, 2050.00, 'np_sub_' || lower(replace(stripe_connect_id, 'stripe_acc_', '')) 
FROM wallets 
WHERE stripe_connect_id LIKE 'stripe_acc%';
