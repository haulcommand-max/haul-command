
-- Phase 16: Seed Rate Benchmarks from 2026 Industry Guides
TRUNCATE public.rate_benchmarks;

INSERT INTO public.rate_benchmarks(country, region, service_type, unit, low, high, notes)
VALUES
-- PEVO Lead/Chase per mile
('us','southeast','pevo_lead_chase','per_mile',1.65,1.85,null),
('us','midwest','pevo_lead_chase','per_mile',1.75,1.95,null),
('us','northeast','pevo_lead_chase','per_mile',1.80,2.00,null),
('us','southwest','pevo_lead_chase','per_mile',1.85,2.00,null),
('us','west_coast','pevo_lead_chase','per_mile',2.00,2.25,'2.25+ shown; cap stored at 2.25'),

-- PEVO day + mini minimum
('us','all','pevo_lead_chase','per_day',450,650,null),
('us','all','pevo_short_move','flat',350,500,'minimum'),

-- Advanced visibility/safety adders
('us','all','advanced_visibility','per_mile',0.10,0.25,'adder'),
('us','all','advanced_visibility','per_day',50,100,'adder'),

-- Layover + cancel
('us','all','layover','per_day',300,500,null),
('us','all','cancel_after_dispatch','flat',250,400,'plus hotel if staged'),

-- Deadhead
('us','all','deadhead','per_mile',0.75,1.25,null),

-- Height pole per mile + day
('us','southeast','height_pole','per_mile',1.90,2.20,null),
('us','midwest_northeast','height_pole','per_mile',2.00,2.50,null),
('us','west_coast','height_pole','per_mile',2.25,2.75,null),
('us','all','height_pole','per_day',550,800,null),

-- Detention + night move premiums
('us','all','detention','per_hour',50,75,null),
('us','all','night_move','per_mile',0.25,0.50,'premium'),
('us','all','night_move','per_day',100,150,'premium'),

-- Bucket truck per mile + day + hour
('us','southeast','bucket_truck','per_mile',2.25,3.50,null),
('us','midwest_northeast','bucket_truck','per_mile',2.25,3.50,null),
('us','west_coast','bucket_truck','per_mile',2.25,3.50,'image groups West Coast/Canada'),
('ca','west_coast_canada','bucket_truck','per_mile',2.25,3.50,'image groups West Coast/Canada'),

('us','all','bucket_truck','per_day',1200,1800,'mobilization fees apply'),

('us','southeast','bucket_truck','per_hour',150,225,null),
('us','midwest_northeast','bucket_truck','per_hour',175,250,null),
('us','west_coast','bucket_truck','per_hour',200,275,'image groups West Coast/Canada'),
('ca','west_coast_canada','bucket_truck','per_hour',200,275,'image groups West Coast/Canada'),

-- Route survey (engineering) per day
('us','southeast','route_survey','per_day',550,850,'per survey/day'),
('us','midwest_northeast','route_survey','per_day',600,950,'per survey/day'),
('us','west_coast','route_survey','per_day',700,1200,'per survey/day'),
('ca','west_coast_canada','route_survey','per_day',700,1200,'per survey/day'),

-- Police escorts
('us','all','police_state','per_hour',31,31,'plus $0.044/mi'),
('us','all','police_state','per_mile',0.044,0.044,'adder'),
('us','all','police_local','per_hour',50,100,null),

-- Optional factors
('us','all','after_hours','multiplier',1.25,1.25,null),
('us','all','urban_coordination','flat',100,300,null),
('us','all','standby','per_hour',75,125,null),
('us','all','weekend_seasonal','multiplier',1.10,1.25,'+10–25%'),
('us','all','multi_agency','flat',500,1500,null);
