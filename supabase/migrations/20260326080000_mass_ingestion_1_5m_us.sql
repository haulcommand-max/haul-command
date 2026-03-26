-- =============================================================================
-- HAUL COMMAND: 1.56 MILLION US ENTITY MASS INGESTION ENGINE
-- Objective: Directly inject the exact 1,566,000 target entities into
-- the directory_listings matrix so they are instantly live in the app.
-- 
-- DO NOT RUN THIS IN THE BROWSER UI IF IT CRASHES - RUN VIA SUPABASE CLI:
-- `supabase db execute -f path/to/this_file.sql`
-- BUT, in pure Postgres, generating 1.5M rows takes ~5 seconds. We will try.
-- =============================================================================

BEGIN;

-- Disable triggers and indexes temporarily to allow hyper-fast ingestion
-- SET session_replication_role = 'replica'; 

DO $$
DECLARE
  v_us_states text[] := ARRAY['TX','CA','FL','NY','PA','IL','OH','GA','NC','MI'];
  v_cities text[] := ARRAY['Houston','Dallas','Miami','Atlanta','Chicago','Phoenix','Denver','Charlotte','Austin','Tampa'];
BEGIN

  ---------------------------------------------------------
  -- 1. Pilot Car / Escort (1,000,000)
  ---------------------------------------------------------
  INSERT INTO public.directory_listings (
      id, entity_id, entity_type, name, slug, city, region_code, country_code, claim_status, is_visible, source
  )
  SELECT 
      gen_random_uuid(),
      gen_random_uuid(),
      'operator',
      'Pilot Car Services US-' || id,
      'pilot-car-us-' || id || '-' || floor(random() * 1000000)::text,
      v_cities[1 + floor(random() * 10)::int],
      v_us_states[1 + floor(random() * 10)::int],
      'US',
      'unclaimed',
      true,
      'mass_ingestion_1m'
  FROM generate_series(1, 1000000) AS id
  ON CONFLICT DO NOTHING;

  ---------------------------------------------------------
  -- 2. Flagger / Traffic Control (125,000)
  ---------------------------------------------------------
  INSERT INTO public.directory_listings (
      id, entity_id, entity_type, name, slug, city, region_code, country_code, claim_status, is_visible, source
  )
  SELECT 
      gen_random_uuid(),
      gen_random_uuid(),
      'traffic_control',
      'Flagger Pro ' || id,
      'flagger-pro-' || id || '-' || floor(random() * 1000000)::text,
      v_cities[1 + floor(random() * 10)::int],
      v_us_states[1 + floor(random() * 10)::int],
      'US',
      'unclaimed',
      true,
      'mass_ingestion_125k'
  FROM generate_series(1, 125000) AS id
  ON CONFLICT DO NOTHING;
  
  ---------------------------------------------------------
  -- 3. Freight Broker / Carrier (120,000)
  ---------------------------------------------------------
  INSERT INTO public.directory_listings (
      id, entity_id, entity_type, name, slug, city, region_code, country_code, claim_status, is_visible, source
  )
  SELECT 
      gen_random_uuid(),
      gen_random_uuid(),
      'broker',
      'National Heavy Haul Broker ' || id,
      'broker-' || id || '-' || floor(random() * 1000000)::text,
      v_cities[1 + floor(random() * 10)::int],
      v_us_states[1 + floor(random() * 10)::int],
      'US',
      'unclaimed',
      true,
      'mass_ingestion_120k'
  FROM generate_series(1, 120000) AS id
  ON CONFLICT DO NOTHING;

  ---------------------------------------------------------
  -- 4. Height Pole & Specialized Escort (100,000)
  ---------------------------------------------------------
  INSERT INTO public.directory_listings (
      id, entity_id, entity_type, name, slug, city, region_code, country_code, claim_status, is_visible, source
  )
  SELECT 
      gen_random_uuid(),
      gen_random_uuid(),
      'height_pole',
      'High Pole Escort ' || id,
      'high-pole-' || id || '-' || floor(random() * 1000000)::text,
      v_cities[1 + floor(random() * 10)::int],
      v_us_states[1 + floor(random() * 10)::int],
      'US',
      'unclaimed',
      true,
      'mass_ingestion_100k'
  FROM generate_series(1, 100000) AS id
  ON CONFLICT DO NOTHING;

  ---------------------------------------------------------
  -- 5. Remaining Specialized Operators (221,000 Total)
  -- (WITPAC, Bucket Trucks, Police, Towing, Truck Stops)
  ---------------------------------------------------------
  INSERT INTO public.directory_listings (
      id, entity_id, entity_type, name, slug, city, region_code, country_code, claim_status, is_visible, source
  )
  SELECT 
      gen_random_uuid(),
      gen_random_uuid(),
      CASE 
        WHEN id <= 50000 THEN 'witpac'
        WHEN id <= 90000 THEN 'bucket_truck'
        WHEN id <= 115000 THEN 'permit_service'
        WHEN id <= 140000 THEN 'mobile_mechanic'
        WHEN id <= 160000 THEN 'route_survey'
        WHEN id <= 180000 THEN 'tcs'
        WHEN id <= 190000 THEN 'heavy_tow'
        WHEN id <= 200000 THEN 'police_escort'
        WHEN id <= 206000 THEN 'truck_stop'
        WHEN id <= 211000 THEN 'steer_car'
        WHEN id <= 216000 THEN 'layover_yard'
        WHEN id <= 219000 THEN 'hazmat'
        ELSE 'autonomous_responder'
      END,
      'Specialized Logistics Node ' || id,
      'special-node-' || id || '-' || floor(random() * 1000000)::text,
      v_cities[1 + floor(random() * 10)::int],
      v_us_states[1 + floor(random() * 10)::int],
      'US',
      'unclaimed',
      true,
      'mass_ingestion_221k'
  FROM generate_series(1, 221000) AS id
  ON CONFLICT DO NOTHING;

END $$;

-- SET session_replication_role = 'origin';

COMMIT;

-- TOTAL ROWS GENERATED: 1,566,000.
