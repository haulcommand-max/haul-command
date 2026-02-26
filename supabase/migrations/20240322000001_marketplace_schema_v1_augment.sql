-- =========================================================
-- MARKETPLACE SCHEMA AUGMENTATION & CREATION (v1.1)
-- Safe execution: Alters existing tables and creates new ones
-- Fixed to accommodate existing schema structures.
-- =========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. Profiles (Alter existing)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'driver' CHECK (role in ('driver','broker','admin','moderator','finance','support','owner_admin')),
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email citext,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS home_state text,
  ADD COLUMN IF NOT EXISTS home_country text DEFAULT 'US';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_home_state ON public.profiles(home_state);

-- 2. Driver Profiles (Alter existing)
ALTER TABLE public.driver_profiles 
  ADD COLUMN IF NOT EXISTS verified_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS insurance_on_file boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS twic_on_file boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS equipment_tags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available' CHECK (availability_status in ('available','busy','offline')),
  ADD COLUMN IF NOT EXISTS response_time_minutes_est int DEFAULT 30,
  ADD COLUMN IF NOT EXISTS jobs_completed int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_driver_profiles_availability ON public.driver_profiles(availability_status);

-- 3. Broker Profiles (Alter existing)
ALTER TABLE public.broker_profiles 
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS mc_or_dot text,
  ADD COLUMN IF NOT EXISTS reputation_score int DEFAULT 50,
  ADD COLUMN IF NOT EXISTS payment_velocity_score int DEFAULT 50,
  ADD COLUMN IF NOT EXISTS verified_business boolean DEFAULT false;

-- 4. Loads (Alter existing heavily)
ALTER TABLE public.loads 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS origin_text text,
  ADD COLUMN IF NOT EXISTS origin_lat numeric,
  ADD COLUMN IF NOT EXISTS origin_lng numeric,
  ADD COLUMN IF NOT EXISTS dest_text text,
  ADD COLUMN IF NOT EXISTS dest_lat numeric,
  ADD COLUMN IF NOT EXISTS dest_lng numeric,
  ADD COLUMN IF NOT EXISTS route_polyline text,
  ADD COLUMN IF NOT EXISTS distance_miles numeric,
  ADD COLUMN IF NOT EXISTS states_crossed jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS load_time_window text,
  ADD COLUMN IF NOT EXISTS escort_front_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS escort_rear_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS height_pole_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS police_escort_risk text DEFAULT 'unknown' CHECK (police_escort_risk in ('low','medium','high','unknown')),
  ADD COLUMN IF NOT EXISTS rate_offer numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fill_probability numeric DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS demand_score numeric DEFAULT 0.0;

CREATE INDEX IF NOT EXISTS idx_loads_status_date ON public.loads(status, load_date);
CREATE INDEX IF NOT EXISTS idx_loads_origin ON public.loads(origin_lat, origin_lng);
CREATE INDEX IF NOT EXISTS idx_loads_dest ON public.loads(dest_lat, dest_lng);

-- 5. Load Visibility Zones
CREATE TABLE IF NOT EXISTS public.load_visibility_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  primary_radius_miles int NOT NULL DEFAULT 50,
  secondary_radius_miles int NOT NULL DEFAULT 120,
  tertiary_radius_miles int NOT NULL DEFAULT 250,
  min_drivers_target int NOT NULL DEFAULT 3,
  computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visibility_load ON public.load_visibility_zones(load_id);

-- 6. Load Matches (Alter existing - uses escort_id instead of driver_id)
ALTER TABLE public.load_matches 
  ADD COLUMN IF NOT EXISTS bid_amount numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_load_matches_load_status ON public.load_matches(load_id, status);
CREATE INDEX IF NOT EXISTS idx_load_matches_driver_status ON public.load_matches(escort_id, status);

-- 7. Activity Events
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  geo jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_events_type_time ON public.activity_events(event_type, created_at desc);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type in ('driver','broker')),
  subject_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_value int,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  comment text,
  verified_job_id uuid REFERENCES public.loads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status in ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_subject ON public.reviews(subject_type, subject_id, status);

-- 9. Monetization Events
CREATE TABLE IF NOT EXISTS public.monetization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status in ('pending','paid','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_monetization_user_time ON public.monetization_events(user_id, created_at desc);

-- 10. Geo Index Governor table
CREATE TABLE IF NOT EXISTS public.geo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  state_or_province text NOT NULL,
  city text,
  county text,
  page_type text NOT NULL CHECK (page_type in ('city','county','state','province','corridor','port')),
  canonical_url text NOT NULL UNIQUE,
  index_status text NOT NULL DEFAULT 'probation' CHECK (index_status in ('index','probation','noindex')),
  geo_index_score numeric NOT NULL DEFAULT 0,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_geo_pages_type_status ON public.geo_pages(page_type, index_status);
CREATE INDEX IF NOT EXISTS idx_geo_pages_state ON public.geo_pages(state_or_province);

-- 11. Extra Add-on: Route IQ Cache
CREATE TABLE IF NOT EXISTS public.route_iq_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload_hash text NOT NULL UNIQUE,
  request jsonb NOT NULL,
  response jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_route_iq_cache_expires ON public.route_iq_cache(expires_at);

-- 12. Extra Add-on: Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel in ('push','sms','email','inapp')),
  title text,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status in ('queued','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON public.notifications(user_id, created_at desc);

-- 13. Extra Add-on: Featured Placements
CREATE TABLE IF NOT EXISTS public.featured_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_type text NOT NULL CHECK (placement_type in ('city_driver_slot','state_driver_slot','corridor_sponsor','port_sponsor','load_boost')),
  geo_key text,
  entity_type text NOT NULL,
  entity_id uuid,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_featured_geo_time ON public.featured_placements(geo_key, ends_at);

-- 14. Extra Add-on: Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id uuid REFERENCES public.loads(id) ON DELETE SET NULL,
  broker_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status in ('in_progress','completed','cancelled')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_driver_status ON public.jobs(driver_id, status);

-- Update timestamp helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set triggers
DROP TRIGGER IF EXISTS trg_driver_profiles_updated_at ON public.driver_profiles;
CREATE TRIGGER trg_driver_profiles_updated_at
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_broker_profiles_updated_at ON public.broker_profiles;
CREATE TRIGGER trg_broker_profiles_updated_at
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_load_matches_updated_at ON public.load_matches;
CREATE TRIGGER trg_load_matches_updated_at
BEFORE UPDATE ON public.load_matches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Safe View for Recent State Activity
CREATE OR REPLACE VIEW public.v_recent_state_activity AS
SELECT
  l.id,
  l.created_at,
  l.status,
  l.load_date,
  l.rate_currency as currency,
  coalesce(l.rate_amount, null) AS rate_offer,
  jsonb_build_object(
    'state_hint', jsonb_extract_path_text(l.states_crossed, '0'),
    'distance_miles', l.miles,
    'police_escort_risk', l.police_escort_risk
  ) AS hints
FROM public.loads l
WHERE l.created_at > now() - interval '14 days'
ORDER BY l.created_at DESC;

-- City Market Pulse View
CREATE OR REPLACE VIEW public.v_city_market_pulse AS
WITH open_loads AS (
  SELECT
    jsonb_extract_path_text(l.states_crossed, '0') AS first_state,
    l.status,
    l.created_at
  FROM public.loads l
  WHERE l.status = 'open'
),
avail_drivers AS (
  SELECT
    p.home_state AS state,
    dp.availability_status
  FROM public.driver_profiles dp
  JOIN public.profiles p ON p.id = dp.user_id
  WHERE dp.availability_status = 'available'
)
SELECT
  s.state AS state,
  coalesce(lc.open_loads, 0) AS open_loads,
  coalesce(dc.available_drivers, 0) AS available_drivers,
  CASE
    WHEN coalesce(dc.available_drivers,0) = 0 THEN 100
    ELSE least(100, greatest(0, (coalesce(lc.open_loads,0)::numeric / dc.available_drivers::numeric) * 25))
  END AS supply_gap_score,
  now() AS computed_at
FROM (
  SELECT DISTINCT home_state AS state FROM public.profiles WHERE home_state IS NOT NULL
) s
LEFT JOIN (
  SELECT first_state AS state, count(*) AS open_loads
  FROM open_loads
  GROUP BY first_state
) lc ON lc.state = s.state
LEFT JOIN (
  SELECT state, count(*) AS available_drivers
  FROM avail_drivers
  GROUP BY state
) dc ON dc.state = s.state;
