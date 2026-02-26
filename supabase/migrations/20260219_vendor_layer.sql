-- =========================================================
-- VENDOR LAYER — Full Schema (Additive / Non-invasive)
-- Tables: vendor_applications, vendors, vendor_locations,
--         vendor_services, vendor_plans, premium_placements,
--         emergency_requests, emergency_dispatch_log, vendor_reviews
-- =========================================================

-- Feature flags
INSERT INTO public.feature_flags(key, enabled, rollout_pct, description) VALUES
  ('vendor_layer',           true,  100, 'Vendor directory: apply, profile, emergency nearby'),
  ('vendor_placements',      true,  100, 'Premium placements (emergency top, route, corridor exclusive)'),
  ('emergency_nearby',       true,  100, 'Emergency Nearby search + rank + call log')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 1. vendor_applications
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- company
  company_name          text NOT NULL,
  vendor_type           text NOT NULL CHECK (vendor_type IN (
                          'roadside_repair','towing','truck_parking','parts',
                          'escort_service','spill_response','welding',
                          'tire_service','fuel','other')),
  website_url           text,
  notes                 text,
  -- contact
  primary_contact_name  text NOT NULL,
  primary_contact_phone text NOT NULL,
  primary_contact_email text,
  dispatch_phone        text NOT NULL,
  -- location
  country               text NOT NULL CHECK (country IN ('US','CA')),
  region1               text,
  city                  text NOT NULL,
  postal_code           text,
  address_line1         text,
  lat                   numeric(10,7),
  lng                   numeric(10,7),
  -- coverage
  is_24_7               boolean NOT NULL DEFAULT false,
  service_radius_miles  int NOT NULL DEFAULT 50,
  -- services
  services_json         jsonb NOT NULL DEFAULT '[]',
  -- plan preference
  preferred_plan_tier   text NOT NULL DEFAULT 'free' CHECK (preferred_plan_tier IN (
                          'free','verified','priority','command_partner','corridor_dominator')),
  -- workflow
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN (
                          'pending','needs_info','approved','rejected')),
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_at           timestamptz,
  reviewer_id           uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS va_status_idx       ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS va_submitted_idx    ON public.vendor_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS va_vendor_type_idx  ON public.vendor_applications(vendor_type);

ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Public (anon) can INSERT (apply form)
CREATE POLICY va_anon_insert ON public.vendor_applications
  FOR INSERT WITH CHECK (true);

-- Admins can read / update all
CREATE POLICY va_admin_all ON public.vendor_applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 2. vendors
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendors (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- identity
  legal_name            text NOT NULL,
  dba_name              text,
  vendor_type           text NOT NULL CHECK (vendor_type IN (
                          'roadside_repair','towing','truck_parking','parts',
                          'escort_service','spill_response','welding',
                          'tire_service','fuel','other')),
  website_url           text,
  description           text,
  -- contact
  primary_contact_name  text,
  primary_contact_phone text,
  primary_contact_email text,
  -- verification
  verified_status       text NOT NULL DEFAULT 'pending' CHECK (verified_status IN (
                          'pending','verified','rejected')),
  verified_at           timestamptz,
  -- ownership link (optional — for claimed profiles)
  owner_user_id         uuid REFERENCES auth.users(id),
  referral_source       text,
  -- lifecycle
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','removed')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendors_type_idx    ON public.vendors(vendor_type);
CREATE INDEX IF NOT EXISTS vendors_status_idx  ON public.vendors(status);
CREATE INDEX IF NOT EXISTS vendors_owner_idx   ON public.vendors(owner_user_id) WHERE owner_user_id IS NOT NULL;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Public read (active vendors)
CREATE POLICY vendors_public_read ON public.vendors
  FOR SELECT USING (status = 'active');

-- Vendor owner manages their own record
CREATE POLICY vendors_owner_all ON public.vendors
  FOR ALL USING (owner_user_id = auth.uid());

-- Admin full access
CREATE POLICY vendors_admin_all ON public.vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 3. vendor_locations
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_locations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_name         text,
  country               text NOT NULL CHECK (country IN ('US','CA')),
  region1               text,
  city                  text,
  postal_code           text,
  address_line1         text,
  lat                   numeric(10,7),
  lng                   numeric(10,7),
  dispatch_phone        text,
  is_24_7               boolean NOT NULL DEFAULT false,
  service_radius_miles  int NOT NULL DEFAULT 50,
  is_primary            boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vl_vendor_idx       ON public.vendor_locations(vendor_id);
CREATE INDEX IF NOT EXISTS vl_region_idx       ON public.vendor_locations(region1, city);
CREATE INDEX IF NOT EXISTS vl_coords_idx       ON public.vendor_locations(lat, lng) WHERE lat IS NOT NULL;

ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY vl_public_read ON public.vendor_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'active')
  );

CREATE POLICY vl_owner_all ON public.vendor_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY vl_admin_all ON public.vendor_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 4. vendor_services
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_category  text NOT NULL,  -- maps to incident_type in emergency_requests
  service_name      text NOT NULL,
  rate_unit         text NOT NULL DEFAULT 'quote' CHECK (rate_unit IN ('quote','flat','per_mile','per_hour')),
  rate_amount       numeric(10,2),
  service_notes     text,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vs_vendor_idx    ON public.vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS vs_category_idx ON public.vendor_services(service_category);
CREATE INDEX IF NOT EXISTS vs_active_idx   ON public.vendor_services(vendor_id, is_active) WHERE is_active;

ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY vs_public_read ON public.vendor_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'active')
  );

CREATE POLICY vs_owner_all ON public.vendor_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY vs_admin_all ON public.vendor_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 5. vendor_plans
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  plan_tier           text NOT NULL DEFAULT 'free' CHECK (plan_tier IN (
                        'free','verified','priority','command_partner','corridor_dominator')),
  plan_status         text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active','cancelled','past_due')),
  monthly_price       numeric(10,2) NOT NULL DEFAULT 0,
  entitlements_json   jsonb NOT NULL DEFAULT '{}',
  stripe_subscription_id text,
  billing_cycle_start timestamptz,
  billing_cycle_end   timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vp_vendor_idx       ON public.vendor_plans(vendor_id);
CREATE INDEX IF NOT EXISTS vp_active_tier_idx  ON public.vendor_plans(vendor_id, plan_status) WHERE plan_status = 'active';

ALTER TABLE public.vendor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY vp_owner_read ON public.vendor_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY vp_admin_all ON public.vendor_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 6. premium_placements
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.premium_placements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  placement_type text NOT NULL CHECK (placement_type IN (
                   'near_route','emergency_top','category_top',
                   'corridor_exclusive','push_eligible')),
  region1        text,          -- state/province scope; NULL = national
  corridor_name  text,          -- e.g. 'I-75', '401'; NULL = region-wide
  bid_monthly    numeric(10,2) NOT NULL DEFAULT 0,
  is_exclusive   boolean NOT NULL DEFAULT false,
  start_at       timestamptz NOT NULL,
  end_at         timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS pp_vendor_idx         ON public.premium_placements(vendor_id);
CREATE INDEX IF NOT EXISTS pp_type_region_idx    ON public.premium_placements(placement_type, region1);
CREATE INDEX IF NOT EXISTS pp_corridor_idx       ON public.premium_placements(corridor_name) WHERE corridor_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS pp_window_idx         ON public.premium_placements(start_at, end_at);

ALTER TABLE public.premium_placements ENABLE ROW LEVEL SECURITY;

-- Vendor owner reads own placements
CREATE POLICY pp_owner_read ON public.premium_placements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid())
  );

-- Vendor owner can insert / cancel own
CREATE POLICY pp_owner_write ON public.premium_placements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid())
  );

CREATE POLICY pp_owner_update ON public.premium_placements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid())
  );

-- Admin full access
CREATE POLICY pp_admin_all ON public.premium_placements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 7. emergency_requests
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id   uuid REFERENCES auth.users(id),
  requester_role      text NOT NULL DEFAULT 'driver',
  incident_type       text NOT NULL CHECK (incident_type IN (
                        'breakdown','tire','tow','spill','parking','parts','other')),
  lat                 numeric(10,7) NOT NULL,
  lng                 numeric(10,7) NOT NULL,
  country             text,
  region1             text,
  corridor_hint       text,
  notes               text,
  status              text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  resolved_at         timestamptz
);

CREATE INDEX IF NOT EXISTS er_user_idx         ON public.emergency_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS er_status_idx       ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS er_created_idx      ON public.emergency_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS er_region_idx       ON public.emergency_requests(region1, incident_type);

ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert and read own
CREATE POLICY er_owner_all ON public.emergency_requests
  FOR ALL USING (requester_user_id = auth.uid());

CREATE POLICY er_anon_insert ON public.emergency_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY er_admin_all ON public.emergency_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 8. emergency_dispatch_log
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emergency_dispatch_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_request_id  uuid NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  vendor_id             uuid NOT NULL REFERENCES public.vendors(id),
  vendor_location_id    uuid REFERENCES public.vendor_locations(id),
  surfaced_rank         int NOT NULL,
  surfaced_reason       text[],          -- e.g. ['tier_boost','corridor_match','24_7']
  call_initiated        boolean NOT NULL DEFAULT false,
  call_initiated_at     timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edl_request_idx   ON public.emergency_dispatch_log(emergency_request_id);
CREATE INDEX IF NOT EXISTS edl_vendor_idx    ON public.emergency_dispatch_log(vendor_id);
CREATE INDEX IF NOT EXISTS edl_rank_idx      ON public.emergency_dispatch_log(emergency_request_id, surfaced_rank);

ALTER TABLE public.emergency_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY edl_owner_read ON public.emergency_dispatch_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.emergency_requests er
      WHERE er.id = emergency_request_id AND er.requester_user_id = auth.uid()
    )
  );

CREATE POLICY edl_service_insert ON public.emergency_dispatch_log
  FOR INSERT WITH CHECK (true);  -- edge function uses service_role

CREATE POLICY edl_admin_all ON public.emergency_dispatch_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 9. vendor_reviews
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  emergency_request_id  uuid REFERENCES public.emergency_requests(id),
  reviewer_user_id      uuid REFERENCES auth.users(id),
  reviewer_role         text NOT NULL DEFAULT 'driver',
  rating                int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text           text,
  tags                  text[],   -- ['fast','professional','expensive',...]
  is_verified           boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vr_vendor_idx   ON public.vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS vr_rating_idx  ON public.vendor_reviews(vendor_id, rating);
CREATE INDEX IF NOT EXISTS vr_created_idx ON public.vendor_reviews(created_at DESC);

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY vr_public_read ON public.vendor_reviews
  FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY vr_auth_insert ON public.vendor_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY vr_admin_all ON public.vendor_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- Helper: approve_vendor_application RPC
-- Called from the admin UI "Approve & Publish" action.
-- Atomically creates vendor → location → services → plan → marks approved.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_vendor_application(p_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app   public.vendor_applications%ROWTYPE;
  v_vid   uuid;
  v_lid   uuid;
  v_price numeric(10,2);
  v_ent   jsonb;
BEGIN
  -- 1. Load application
  SELECT * INTO v_app FROM public.vendor_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'application_not_found');
  END IF;
  IF v_app.status NOT IN ('pending', 'needs_info') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_processed');
  END IF;

  -- 2. Plan price + entitlements
  v_price := CASE v_app.preferred_plan_tier
    WHEN 'verified'           THEN 29
    WHEN 'priority'           THEN 99
    WHEN 'command_partner'    THEN 299
    WHEN 'corridor_dominator' THEN 999
    ELSE 0
  END;

  v_ent := CASE v_app.preferred_plan_tier
    WHEN 'free'               THEN '{"searchable":true,"in_app_surface":"limited"}'::jsonb
    WHEN 'verified'           THEN '{"searchable":true,"verified_badge":true,"in_app_surface":"standard","emergency_surface":"basic","analytics":"basic"}'::jsonb
    WHEN 'priority'           THEN '{"searchable":true,"verified_badge":true,"in_app_surface":"boosted","emergency_surface":"boosted","analytics":"standard","corridor_boost":true,"push_eligible":true}'::jsonb
    WHEN 'command_partner'    THEN '{"searchable":true,"verified_badge":true,"in_app_surface":"boosted","emergency_surface":"top_eligible","analytics":"advanced","corridor_boost":true,"push_eligible":true,"emergency_top_placement":true}'::jsonb
    WHEN 'corridor_dominator' THEN '{"searchable":true,"verified_badge":true,"in_app_surface":"max","emergency_surface":"max","analytics":"advanced","corridor_boost":true,"push_eligible":true,"corridor_exclusivity":true}'::jsonb
    ELSE '{"searchable":true,"in_app_surface":"limited"}'::jsonb
  END;

  -- 3. Create vendor
  INSERT INTO public.vendors (
    legal_name, dba_name, vendor_type, website_url,
    primary_contact_name, primary_contact_phone, primary_contact_email,
    referral_source, verified_status, status
  ) VALUES (
    v_app.company_name, v_app.company_name, v_app.vendor_type, v_app.website_url,
    v_app.primary_contact_name, v_app.primary_contact_phone, v_app.primary_contact_email,
    'self_apply', 'pending', 'active'
  ) RETURNING id INTO v_vid;

  -- 4. Create primary location
  INSERT INTO public.vendor_locations (
    vendor_id, location_name, country, region1, city, postal_code,
    address_line1, lat, lng, dispatch_phone, is_24_7, service_radius_miles, is_primary
  ) VALUES (
    v_vid, v_app.city, v_app.country, v_app.region1, v_app.city, v_app.postal_code,
    v_app.address_line1, v_app.lat, v_app.lng, v_app.dispatch_phone,
    v_app.is_24_7, v_app.service_radius_miles, true
  ) RETURNING id INTO v_lid;

  -- 5. Create services (from services_json array)
  INSERT INTO public.vendor_services (vendor_id, service_category, service_name, rate_unit, service_notes)
  SELECT
    v_vid,
    COALESCE(s->>'service_category', s->>'service_name', s::text),
    COALESCE(s->>'service_name', s->>'service_category', s::text),
    COALESCE(s->>'rate_unit', 'quote'),
    s->>'service_notes'
  FROM jsonb_array_elements(COALESCE(v_app.services_json, '[]'::jsonb)) AS s;

  -- 6. Create plan
  INSERT INTO public.vendor_plans (vendor_id, plan_tier, plan_status, monthly_price, entitlements_json)
  VALUES (v_vid, COALESCE(v_app.preferred_plan_tier, 'free'), 'active', v_price, v_ent);

  -- 7. Mark application approved
  UPDATE public.vendor_applications
  SET status = 'approved', reviewed_at = now()
  WHERE id = p_application_id;

  RETURN jsonb_build_object('ok', true, 'vendor_id', v_vid, 'location_id', v_lid);
END;
$$;
