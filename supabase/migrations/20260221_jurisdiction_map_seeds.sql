-- Seed data for jurisdiction map control surface
-- Inserts US-XX / CA-XX formatted codes into the jurisdiction map schema tables

-- Seed jurisdictions (if not already present from the bare-code registry)
INSERT INTO public.jurisdictions (jurisdiction_code, name, type, country) VALUES
-- US States
('US-AL', 'Alabama', 'state', 'US'), ('US-AK', 'Alaska', 'state', 'US'),
('US-AZ', 'Arizona', 'state', 'US'), ('US-AR', 'Arkansas', 'state', 'US'),
('US-CA', 'California', 'state', 'US'), ('US-CO', 'Colorado', 'state', 'US'),
('US-CT', 'Connecticut', 'state', 'US'), ('US-DE', 'Delaware', 'state', 'US'),
('US-FL', 'Florida', 'state', 'US'), ('US-GA', 'Georgia', 'state', 'US'),
('US-HI', 'Hawaii', 'state', 'US'), ('US-ID', 'Idaho', 'state', 'US'),
('US-IL', 'Illinois', 'state', 'US'), ('US-IN', 'Indiana', 'state', 'US'),
('US-IA', 'Iowa', 'state', 'US'), ('US-KS', 'Kansas', 'state', 'US'),
('US-KY', 'Kentucky', 'state', 'US'), ('US-LA', 'Louisiana', 'state', 'US'),
('US-ME', 'Maine', 'state', 'US'), ('US-MD', 'Maryland', 'state', 'US'),
('US-MA', 'Massachusetts', 'state', 'US'), ('US-MI', 'Michigan', 'state', 'US'),
('US-MN', 'Minnesota', 'state', 'US'), ('US-MS', 'Mississippi', 'state', 'US'),
('US-MO', 'Missouri', 'state', 'US'), ('US-MT', 'Montana', 'state', 'US'),
('US-NE', 'Nebraska', 'state', 'US'), ('US-NV', 'Nevada', 'state', 'US'),
('US-NH', 'New Hampshire', 'state', 'US'), ('US-NJ', 'New Jersey', 'state', 'US'),
('US-NM', 'New Mexico', 'state', 'US'), ('US-NY', 'New York', 'state', 'US'),
('US-NC', 'North Carolina', 'state', 'US'), ('US-ND', 'North Dakota', 'state', 'US'),
('US-OH', 'Ohio', 'state', 'US'), ('US-OK', 'Oklahoma', 'state', 'US'),
('US-OR', 'Oregon', 'state', 'US'), ('US-PA', 'Pennsylvania', 'state', 'US'),
('US-RI', 'Rhode Island', 'state', 'US'), ('US-SC', 'South Carolina', 'state', 'US'),
('US-SD', 'South Dakota', 'state', 'US'), ('US-TN', 'Tennessee', 'state', 'US'),
('US-TX', 'Texas', 'state', 'US'), ('US-UT', 'Utah', 'state', 'US'),
('US-VT', 'Vermont', 'state', 'US'), ('US-VA', 'Virginia', 'state', 'US'),
('US-WA', 'Washington', 'state', 'US'), ('US-WV', 'West Virginia', 'state', 'US'),
('US-WI', 'Wisconsin', 'state', 'US'), ('US-WY', 'Wyoming', 'state', 'US'),
('US-DC', 'District of Columbia', 'territory', 'US'),
-- CA Provinces & Territories
('CA-AB', 'Alberta', 'province', 'CA'), ('CA-BC', 'British Columbia', 'province', 'CA'),
('CA-MB', 'Manitoba', 'province', 'CA'), ('CA-NB', 'New Brunswick', 'province', 'CA'),
('CA-NL', 'Newfoundland and Labrador', 'province', 'CA'), ('CA-NS', 'Nova Scotia', 'province', 'CA'),
('CA-ON', 'Ontario', 'province', 'CA'), ('CA-PE', 'Prince Edward Island', 'province', 'CA'),
('CA-QC', 'Quebec', 'province', 'CA'), ('CA-SK', 'Saskatchewan', 'province', 'CA'),
('CA-NT', 'Northwest Territories', 'territory', 'CA'), ('CA-NU', 'Nunavut', 'territory', 'CA'),
('CA-YT', 'Yukon', 'territory', 'CA')
ON CONFLICT (jurisdiction_code) DO NOTHING;

-- Seed test operator_listings for US-FL (acceptance test: FL data)
INSERT INTO public.operator_listings (business_name, phone, website_url, categories, verified, rating, response_time_sec_avg, coverage_notes, jurisdiction_code) VALUES
('Sunshine Pilot Car Services', '(305) 555-0101', 'https://sunshinepilotcar.com', ARRAY['pilot_car','oversize_escort'], true, 4.7, 180, 'Full Florida coverage, I-95 / I-75 / Turnpike specialist', 'US-FL'),
('Gulf Coast Escort LLC', '(813) 555-0202', 'https://gulfcoastescort.com', ARRAY['oversize_escort','superload'], true, 4.5, 240, 'Tampa Bay area, I-4 / I-275 corridor coverage', 'US-FL')
ON CONFLICT DO NOTHING;

-- Seed test operator_listings for US-WY (acceptance test: WY data)
INSERT INTO public.operator_listings (business_name, phone, website_url, categories, verified, rating, response_time_sec_avg, coverage_notes, jurisdiction_code) VALUES
('Cowboy State Escorts', '(307) 555-0303', 'https://cowboystateescorts.com', ARRAY['pilot_car','wind_energy'], true, 4.8, 120, 'I-80 / I-25 Wyoming specialist, wind turbine loads', 'US-WY'),
('Yellowstone Pilot Services', '(307) 555-0404', 'https://yellowstonepilot.com', ARRAY['pilot_car','oversize_escort'], false, 4.2, 300, 'Northern Wyoming, I-90 corridor', 'US-WY')
ON CONFLICT DO NOTHING;
