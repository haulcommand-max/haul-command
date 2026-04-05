-- Migration 028: Three canonical fixes
-- 1. Fix hc_available_now schema + seed data
-- 2. Seed realistic demo data for homepage stats + load board  
-- 3. Ensure loads has urgency + title columns

BEGIN;

-- ── 1. Expand hc_available_now vehicle_type constraint + add service_type column ──
ALTER TABLE public.hc_available_now
  DROP CONSTRAINT IF EXISTS hc_available_now_vehicle_type_check;

ALTER TABLE public.hc_available_now
  ADD CONSTRAINT hc_available_now_vehicle_type_check
    CHECK (vehicle_type = ANY(ARRAY[
      'pilot_car','escort_truck','chase_vehicle','shadow_vehicle',
      'escort_vehicle','high_pole','steerman','route_surveyor','heavy_towing','other'
    ])),
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS current_city text,
  ADD COLUMN IF NOT EXISTS current_state text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_radius_miles int DEFAULT 150,
  ADD COLUMN IF NOT EXISTS notes text;

-- ── 2. Ensure loads has title + urgency + status columns ──
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS urgency int DEFAULT 50,
  ADD COLUMN IF NOT EXISTS title text;

UPDATE public.loads SET urgency = 50 WHERE urgency IS NULL;

-- ── 3. Seed realistic demo operators into hc_available_now ──
-- Drop FK temporarily so demo rows can be inserted without real auth.users
ALTER TABLE public.hc_available_now
  DROP CONSTRAINT IF EXISTS hc_available_now_user_id_fkey;

-- Make user_id nullable for demo seeds
ALTER TABLE public.hc_available_now
  ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO public.hc_available_now
  (id, slug, business_name, display_name, country_code, region_code, city,
   current_city, current_state, trust_score, is_verified, vehicle_type, service_type,
   is_active, max_radius_miles, available_since, last_ping_at)
VALUES
  (gen_random_uuid(), 'apex-escort-tx', 'Apex Escort Services', 'Mike R.', 'US', 'TX', 'Houston',
   'Houston', 'TX', 87, true, 'pilot_car', 'pilot_car', true, 250,
   now() - interval '2 hours', now() - interval '15 minutes'),
  (gen_random_uuid(), 'lone-star-pilot-cars', 'Lone Star Pilot Cars', 'Sandra T.', 'US', 'TX', 'Dallas',
   'Dallas', 'TX', 92, true, 'high_pole', 'high_pole', true, 300,
   now() - interval '4 hours', now() - interval '8 minutes'),
  (gen_random_uuid(), 'midwest-escort-il', 'Midwest Escort LLC', 'Dave K.', 'US', 'IL', 'Chicago',
   'Chicago', 'IL', 78, true, 'escort_vehicle', 'escort_vehicle', true, 200,
   now() - interval '1 hour', now() - interval '30 minutes'),
  (gen_random_uuid(), 'blue-ridge-escorts-nc', 'Blue Ridge Escorts', 'Jamie L.', 'US', 'NC', 'Charlotte',
   'Charlotte', 'NC', 83, false, 'pilot_car', 'pilot_car', true, 175,
   now() - interval '6 hours', now() - interval '45 minutes'),
  (gen_random_uuid(), 'pacific-pilot-or', 'Pacific Pilot Car Co', 'Chris M.', 'US', 'OR', 'Portland',
   'Portland', 'OR', 95, true, 'steerman', 'steerman', true, 400,
   now() - interval '30 minutes', now() - interval '5 minutes'),
  (gen_random_uuid(), 'great-plains-escort-ks', 'Great Plains Escort', 'Tom B.', 'US', 'KS', 'Wichita',
   'Wichita', 'KS', 71, true, 'pilot_car', 'pilot_car', true, 300,
   now() - interval '3 hours', now() - interval '20 minutes'),
  (gen_random_uuid(), 'sunbelt-escorts-fl', 'Sunbelt Escort Services', 'Angie W.', 'US', 'FL', 'Tampa',
   'Tampa', 'FL', 88, true, 'route_surveyor', 'route_surveyor', true, 200,
   now() - interval '2 hours', now() - interval '10 minutes'),
  (gen_random_uuid(), 'prairie-star-nd', 'Prairie Star Escorts', 'Bill F.', 'US', 'ND', 'Fargo',
   'Fargo', 'ND', 76, false, 'pilot_car', 'pilot_car', true, 250,
   now() - interval '5 hours', now() - interval '55 minutes'),
  (gen_random_uuid(), 'red-rock-az', 'Red Rock Pilot Cars', 'Maria G.', 'US', 'AZ', 'Phoenix',
   'Phoenix', 'AZ', 90, true, 'pilot_car', 'pilot_car', true, 350,
   now() - interval '1 hour', now() - interval '12 minutes'),
  (gen_random_uuid(), 'appalachian-escort-va', 'Appalachian Escort Co', 'Robert H.', 'US', 'VA', 'Richmond',
   'Richmond', 'VA', 81, true, 'high_pole', 'high_pole', true, 225,
   now() - interval '7 hours', now() - interval '35 minutes'),
  (gen_random_uuid(), 'outback-escorts-au', 'Outback Escort Services', 'Ben C.', 'AU', 'QLD', 'Brisbane',
   'Brisbane', 'QLD', 85, true, 'pilot_car', 'pilot_car', true, 400,
   now() - interval '3 hours', now() - interval '25 minutes'),
  (gen_random_uuid(), 'maple-leaf-escorts-ca', 'Maple Leaf Escorts', 'Jean P.', 'CA', 'AB', 'Calgary',
   'Calgary', 'AB', 79, true, 'pilot_car', 'pilot_car', true, 300,
   now() - interval '4 hours', now() - interval '40 minutes');




-- ── 4. Seed open route requests (load board) ──
INSERT INTO public.hc_route_requests
  (id, service_type, contact_name, contact_email, pickup_location, delivery_location, 
   pickup_date, load_description, width_ft, height_ft, weight_lbs, status, created_at)
VALUES
  (gen_random_uuid(), 'pilot_car', 'Ryan Davis', 'rdavis@example.com', 
   'Houston, TX', 'San Antonio, TX', current_date + 2, 
   'Wind turbine blade — 185ft long, requires 2 pilots', 14.5, 15.2, 0, 'pending',
   now() - interval '2 hours'),
  (gen_random_uuid(), 'high_pole', 'Lisa Chen', 'lchen@example.com',
   'Dallas, TX', 'Oklahoma City, OK', current_date + 1,
   'Power transformer — requires height pole lead', 16.0, 17.5, 380000, 'pending',
   now() - interval '45 minutes'),
  (gen_random_uuid(), 'pilot_car', 'Mark Wilson', 'mwilson@example.com',
   'Phoenix, AZ', 'Tucson, AZ', current_date + 3,
   'Industrial press — 14ft wide load', 14.0, 14.0, 95000, 'viewed',
   now() - interval '5 hours'),
  (gen_random_uuid(), 'steerman', 'Sarah Johnson', 'sjohnson@example.com',
   'Portland, OR', 'Seattle, WA', current_date + 4,
   'Bridge beam — requires rear steer operator', 12.0, 13.5, 125000, 'pending',
   now() - interval '1 hour'),
  (gen_random_uuid(), 'route_surveyor', 'Tom Brown', 'tbrown@example.com',
   'Denver, CO', 'Salt Lake City, UT', current_date + 7,
   'Pre-survey required — superload petrochemical vessel', 18.0, 16.0, 520000, 'pending',
   now() - interval '30 minutes'),
  (gen_random_uuid(), 'pilot_car', 'Carlos Martinez', 'cmartinez@example.com',
   'Chicago, IL', 'Indianapolis, IN', current_date + 2,
   'Construction equipment transport — double-wide', 16.5, 14.5, 180000, 'pending',
   now() - interval '3 hours')
ON CONFLICT DO NOTHING;

COMMIT;
