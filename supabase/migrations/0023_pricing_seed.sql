-- 0023_pricing_seed.sql
begin;

-- Regions
insert into public.pricing_regions (region_key, label) values
('southeast', 'Southeast'),
('midwest', 'Midwest'),
('northeast', 'Northeast'),
('southwest', 'Southwest'),
('west_coast', 'West Coast'),
('midwest_northeast', 'Midwest / Northeast'),
('west_coast_canada', 'West Coast / Canada'),
('all', 'National / All')
on conflict (region_key) do nothing;

-- Services & Addons
insert into public.service_types (service_key, label, category, description) values
('pilot_car_lead_chase_pevo', 'Pilot Car Escort — Lead/Chase (PEVO)', 'service', 'Standard lead or chase car services'),
('high_pole_specialized_escort', 'High Pole & Specialized Escort', 'service', 'Height pole and complex routing'),
('bucket_truck_escorts_utility_line_lift', 'Bucket Truck Escorts (Utility/Line Lift)', 'service', 'Utility line lifting'),
('route_survey_engineering', 'Route Survey (Engineering)', 'service', 'Route planning and bridge analysis'),
('police_escorts_state_local', 'Police Escorts (State & Local)', 'service', 'Law enforcement escort'),
('addon_advanced_visibility_safety', 'Advanced Visibility & Safety', 'addon', ''),
('addon_wait_time_detention', 'Wait Time / Detention', 'addon', ''),
('addon_night_moves', 'Night Moves Premium', 'addon', ''),
('addon_layover_day', 'Layover Day', 'addon', ''),
('addon_no_go_cancelled_after_dispatch', 'No-Go / Cancelled After Dispatch', 'addon', ''),
('addon_deadhead_pay', 'Deadhead / Repositioning', 'addon', ''),
('optional_cost_factors_safety_premiums', 'Optional Cost Factors & Safety Premiums', 'addon', '')
on conflict (service_key) do nothing;

-- Benchmarks (Sample set from provided data)
insert into public.pricing_benchmarks (service_key, region_key, unit, min_rate, max_rate, currency, notes) values
-- Pilot Car
('pilot_car_lead_chase_pevo', 'southeast', 'per_mile', 1.65, 1.85, 'USD', null),
('pilot_car_lead_chase_pevo', 'midwest', 'per_mile', 1.75, 1.95, 'USD', null),
('pilot_car_lead_chase_pevo', 'northeast', 'per_mile', 1.80, 2.00, 'USD', null),
('pilot_car_lead_chase_pevo', 'southwest', 'per_mile', 1.85, 2.00, 'USD', null),
('pilot_car_lead_chase_pevo', 'west_coast', 'per_mile', 2.00, 2.25, 'USD', '2.25+ shown on graphic'),
('pilot_car_lead_chase_pevo', 'all', 'day_rate', 450, 650, 'USD', null),
('pilot_car_lead_chase_pevo', 'all', 'minimum', 350, 500, 'USD', 'Mini / Short Move minimum'),

-- High Pole
('high_pole_specialized_escort', 'southeast', 'per_mile', 1.90, 2.20, 'USD', null),
('high_pole_specialized_escort', 'midwest_northeast', 'per_mile', 2.00, 2.50, 'USD', null),
('high_pole_specialized_escort', 'west_coast', 'per_mile', 2.25, 2.75, 'USD', null),
('high_pole_specialized_escort', 'all', 'day_rate', 550, 800, 'USD', null),

-- Addons
('addon_deadhead_pay', 'all', 'per_mile', 0.75, 1.25, 'USD', 'Also applies to repositioning'),
('addon_night_moves', 'all', 'per_mile', 0.25, 0.50, 'USD', null),
('addon_night_moves', 'all', 'day_rate', 100, 150, 'USD', 'Graphic shows +$100-$150/day'),

-- Route Survey (Tiered - simplified sample)
('route_survey_engineering', 'southeast', 'flat_by_distance_tier', 550, 850, 'USD', 'Tier: 0_100'),
('route_survey_engineering', 'midwest_northeast', 'flat_by_distance_tier', 600, 950, 'USD', 'Tier: 0_100'),
('route_survey_engineering', 'west_coast_canada', 'flat_by_distance_tier', 700, 1200, 'USD', 'Tier: 0_100')
-- (Add more tiers as needed in CRUD)
;

commit;
