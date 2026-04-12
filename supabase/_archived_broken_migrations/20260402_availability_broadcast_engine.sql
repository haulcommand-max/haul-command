-- ══════════════════════════════════════════════════════════════
-- AVAILABILITY BROADCASTS + REPOSITIONING POSTS
-- The two tables that make competitor-style apps obsolete.
--
-- availability_broadcasts: "I'm available near [location]"
-- repositioning_posts:     "Finishing in A, heading to B"
-- ══════════════════════════════════════════════════════════════

-- 1. AVAILABILITY BROADCASTS
-- Operators broadcast their real-time availability to brokers/carriers.
-- This replaces "post in a Facebook group" with structured, searchable data.

CREATE TABLE IF NOT EXISTS public.availability_broadcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id uuid NOT NULL,
  -- Location
  city text,
  state_code text,
  country_code text DEFAULT 'US',
  lat double precision,
  lng double precision,
  radius_miles int DEFAULT 50,
  -- Availability
  status text NOT NULL DEFAULT 'available_now'
    CHECK (status IN ('available_now', 'available_today', 'available_this_week', 'booked', 'offline')),
  available_from timestamptz DEFAULT now(),
  available_until timestamptz,
  -- Services
  service_types text[] DEFAULT '{}',  -- e.g., ['lead','chase','high_pole','steer']
  equipment_notes text,
  certifications text[] DEFAULT '{}',
  -- Corridor awareness
  corridor_id text,
  willing_to_deadhead_miles int DEFAULT 100,
  -- Contact
  phone text,
  contact_note text,
  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  is_active boolean DEFAULT true
);

-- Indexes for availability search
CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_active
  ON public.availability_broadcasts(is_active, status, available_from DESC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_state
  ON public.availability_broadcasts(country_code, state_code, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_operator
  ON public.availability_broadcasts(operator_id, created_at DESC);

-- Auto-expire stale broadcasts
CREATE OR REPLACE FUNCTION public.expire_stale_broadcasts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.availability_broadcasts
  SET is_active = false
  WHERE is_active = true
    AND expires_at < now();
END;
$$;

-- RLS
ALTER TABLE public.availability_broadcasts ENABLE ROW LEVEL SECURITY;

-- Public can read active broadcasts (this IS the competitor-killing surface)
CREATE POLICY "Public read active broadcasts"
  ON public.availability_broadcasts FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Authenticated users can manage their own broadcasts
CREATE POLICY "Owners manage own broadcasts"
  ON public.availability_broadcasts FOR ALL
  TO authenticated
  USING (operator_id IN (
    SELECT id FROM public.directory_listings WHERE claimed_by = auth.uid()
  ) OR operator_id::text = auth.uid()::text)
  WITH CHECK (operator_id IN (
    SELECT id FROM public.directory_listings WHERE claimed_by = auth.uid()
  ) OR operator_id::text = auth.uid()::text);

-- Service role full access
CREATE POLICY "Service role broadcasts"
  ON public.availability_broadcasts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- 2. REPOSITIONING POSTS
-- "I'm finishing a job in Dallas, heading to Houston, available along the way"
-- This is the #2 competitor function: deadhead reduction.

CREATE TABLE IF NOT EXISTS public.repositioning_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id uuid NOT NULL,
  -- Origin (where they're finishing)
  origin_city text NOT NULL,
  origin_state text NOT NULL,
  origin_country text DEFAULT 'US',
  -- Destination (where they're heading)
  dest_city text,
  dest_state text,
  dest_country text DEFAULT 'US',
  -- Timing
  depart_date date NOT NULL,
  depart_time_approx text, -- e.g., 'morning', 'afternoon', 'evening'
  -- Services
  service_types text[] DEFAULT '{}',
  rate_note text, -- e.g., "$550/day or negotiate"
  willing_to_detour_miles int DEFAULT 50,
  -- Contact
  phone text,
  contact_note text,
  -- Meta
  status text DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '72 hours'),
  is_active boolean DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repositioning_active
  ON public.repositioning_posts(is_active, depart_date)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_repositioning_origin
  ON public.repositioning_posts(origin_state, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_repositioning_dest
  ON public.repositioning_posts(dest_state, is_active)
  WHERE is_active = true;

-- RLS
ALTER TABLE public.repositioning_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active repos"
  ON public.repositioning_posts FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Owners manage own repos"
  ON public.repositioning_posts FOR ALL
  TO authenticated
  USING (operator_id::text = auth.uid()::text)
  WITH CHECK (operator_id::text = auth.uid()::text);

CREATE POLICY "Service role repos"
  ON public.repositioning_posts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- 3. BOOKING REQUESTS
-- Direct "I need you for this job" requests from broker/carrier to operator

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL DEFAULT auth.uid(),
  operator_id uuid NOT NULL,
  load_id uuid,
  -- Job details
  origin text NOT NULL,
  destination text NOT NULL,
  needed_date date NOT NULL,
  service_type text NOT NULL DEFAULT 'lead',
  urgency text DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'rush')),
  rate_offered text,
  notes text,
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'declined', 'expired')),
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_operator_status
  ON public.booking_requests(operator_id, status);

CREATE INDEX IF NOT EXISTS idx_booking_requester
  ON public.booking_requests(requester_id, created_at DESC);

-- RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters see own requests"
  ON public.booking_requests FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Operators see requests for them"
  ON public.booking_requests FOR SELECT
  TO authenticated
  USING (operator_id IN (
    SELECT id FROM public.directory_listings WHERE claimed_by = auth.uid()
  ) OR operator_id::text = auth.uid()::text);

CREATE POLICY "Auth create requests"
  ON public.booking_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Operators update own requests"
  ON public.booking_requests FOR UPDATE
  TO authenticated
  USING (operator_id IN (
    SELECT id FROM public.directory_listings WHERE claimed_by = auth.uid()
  ) OR operator_id::text = auth.uid()::text);

CREATE POLICY "Service role booking"
  ON public.booking_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- 4. VIEWS

-- Active availability feed for brokers
CREATE OR REPLACE VIEW public.v_available_escorts AS
SELECT
  ab.id,
  ab.operator_id,
  ab.city,
  ab.state_code,
  ab.country_code,
  ab.lat,
  ab.lng,
  ab.radius_miles,
  ab.status,
  ab.available_from,
  ab.available_until,
  ab.service_types,
  ab.equipment_notes,
  ab.certifications,
  ab.corridor_id,
  ab.willing_to_deadhead_miles,
  ab.phone,
  ab.contact_note,
  ab.created_at,
  ab.expires_at,
  -- Join operator data
  COALESCE(dl.name, go.name) AS operator_name,
  COALESCE(dl.slug, go.slug) AS operator_slug,
  COALESCE(dl.rank_score, go.confidence_score, 0) AS trust_score,
  COALESCE(dl.claim_status, CASE WHEN go.is_claimed THEN 'claimed' ELSE 'unclaimed' END) AS claim_status
FROM public.availability_broadcasts ab
LEFT JOIN public.directory_listings dl ON dl.claimed_by::text = ab.operator_id::text
LEFT JOIN public.hc_global_operators go ON go.id = ab.operator_id
WHERE ab.is_active = true
  AND ab.expires_at > now()
ORDER BY
  CASE ab.status
    WHEN 'available_now' THEN 1
    WHEN 'available_today' THEN 2
    WHEN 'available_this_week' THEN 3
    ELSE 4
  END,
  ab.created_at DESC;

GRANT SELECT ON public.v_available_escorts TO anon, authenticated;

-- Active repositioning feed
CREATE OR REPLACE VIEW public.v_repositioning_feed AS
SELECT
  rp.*,
  COALESCE(dl.name, go.name) AS operator_name,
  COALESCE(dl.slug, go.slug) AS operator_slug,
  COALESCE(dl.rank_score, go.confidence_score, 0) AS trust_score
FROM public.repositioning_posts rp
LEFT JOIN public.directory_listings dl ON dl.claimed_by::text = rp.operator_id::text
LEFT JOIN public.hc_global_operators go ON go.id = rp.operator_id
WHERE rp.is_active = true
  AND rp.expires_at > now()
  AND rp.status = 'active'
ORDER BY rp.depart_date ASC, rp.created_at DESC;

GRANT SELECT ON public.v_repositioning_feed TO anon, authenticated;
