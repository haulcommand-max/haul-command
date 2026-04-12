-- ==============================================================================
-- 🚀 HAUL COMMAND VENDOR LAYER (US + CANADA)
-- ==============================================================================
-- Enables self-serve vendor onboarding, 'Emergency Nearby' route surfacing,
-- tiered monetization, and future kickbacks.

-- 1) VENDORS
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  dba_name text,
  vendor_type text not null, -- roadside_repair | towing | truck_parking | parts | escort_service | spill_response | welding | tire_service | fuel | other
  description text,
  website_url text,
  dot_mc_number text,
  insurance_on_file boolean default false,
  verified_status text default 'unverified', -- unverified | pending | verified | suspended
  verification_notes text,
  primary_contact_name text,
  primary_contact_phone text,
  primary_contact_email text,
  billing_email text,
  payout_method text, -- ach | card | rapid | stripe_connect | other
  referral_source text, -- self_apply | outbound | partner | import
  status text default 'active', -- active | paused | closed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) VENDOR LOCATIONS
create table if not exists public.vendor_locations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  location_name text,
  country text not null check(country in ('US', 'CA')),
  region1 text,
  region2 text,
  city text,
  postal_code text,
  address_line1 text,
  address_line2 text,
  lat numeric not null,
  lng numeric not null,
  dispatch_phone text not null,
  dispatch_email text,
  hours_json jsonb,
  is_24_7 boolean default false,
  service_radius_miles integer default 50,
  supports_cash boolean default false,
  supports_credit boolean default true,
  supports_invoice boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vendor_loc_vendor on public.vendor_locations(vendor_id);
create index if not exists idx_vendor_loc_geo on public.vendor_locations(country, region1, city);
create index if not exists idx_vendor_loc_coords on public.vendor_locations(lat, lng);

-- 3) VENDOR SERVICES
create table if not exists public.vendor_services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  service_category text not null,
  service_name text not null,
  service_notes text,
  min_callout_fee numeric,
  rate_unit text, -- per_call | per_hour | per_mile | quote
  created_at timestamptz default now()
);

-- 4) VENDOR COVERAGE
create table if not exists public.vendor_coverage (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  coverage_type text not null, -- radius | polygon | corridor | region
  corridor_name text,
  region1 text,
  geojson jsonb,
  priority_weight integer default 0,
  created_at timestamptz default now()
);

-- 5) VENDOR PLANS
create table if not exists public.vendor_plans (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  plan_tier text not null, -- free | verified | priority | command_partner | corridor_dominator
  plan_status text default 'active',
  start_date date,
  end_date date,
  monthly_price numeric default 0,
  entitlements_json jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_vendor_plans_status on public.vendor_plans(vendor_id, plan_tier, plan_status);

-- 6) PREMIUM PLACEMENTS
create table if not exists public.premium_placements (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  placement_type text not null, -- near_route | emergency_top | category_top | corridor_exclusive | push_eligible
  region1 text,
  corridor_name text,
  start_at timestamptz,
  end_at timestamptz,
  bid_monthly numeric default 0,
  is_exclusive boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_premium_placements on public.premium_placements(placement_type, region1, corridor_name, start_at, end_at);

-- 7) EMERGENCY REQUESTS
create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid, -- FK to auth.users theoretically
  requester_role text, -- driver | escort | dispatcher | broker | other
  incident_type text not null, -- breakdown | tire | tow | spill | parking | parts | other
  lat numeric not null,
  lng numeric not null,
  country text,
  region1 text,
  corridor_hint text,
  notes text,
  status text default 'open', -- open | assigned | closed | canceled
  created_at timestamptz default now(),
  closed_at timestamptz
);

create index if not exists idx_emergency_req on public.emergency_requests(status, country, region1, created_at);

-- 8) EMERGENCY DISPATCH LOG
create table if not exists public.emergency_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  emergency_request_id uuid not null references public.emergency_requests(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  vendor_location_id uuid references public.vendor_locations(id),
  surfaced_rank integer not null,
  surfaced_reason text,
  call_initiated boolean default false,
  call_connected boolean default false,
  resolution text, -- unknown | dispatched | no_answer | declined | resolved
  created_at timestamptz default now()
);

create index if not exists idx_emerg_dispatch_fk on public.emergency_dispatch_log(emergency_request_id, vendor_id);

-- 9) VENDOR REVIEWS
create table if not exists public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  reviewer_user_id uuid,
  rating integer not null check(rating >= 1 and rating <= 5),
  review_text text,
  tags text[],
  created_at timestamptz default now()
);

-- 10) VENDOR APPLICATIONS
create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz default now(),
  status text default 'pending', -- pending | needs_info | approved | rejected
  company_name text not null,
  vendor_type text not null,
  website_url text,
  primary_contact_name text not null,
  primary_contact_phone text not null,
  primary_contact_email text,
  country text not null,
  region1 text,
  city text,
  postal_code text,
  address_line1 text,
  lat numeric not null,
  lng numeric not null,
  dispatch_phone text not null,
  is_24_7 boolean default false,
  service_radius_miles integer default 50,
  services_json jsonb,
  preferred_plan_tier text default 'free',
  notes text
);

-- ==============================================================================
-- SYNTHETIC SEED DATA
-- ==============================================================================
insert into public.vendors (id, legal_name, dba_name, vendor_type, website_url, verified_status, primary_contact_name, primary_contact_phone, referral_source)
values
  ('bbbb1111-1111-1111-1111-111111111111', 'Rapid Tow & Recovery', 'Rapid Tow', 'towing', 'https://example.com/rapid-tow', 'unverified', 'Dispatch', '+1-000-000-0000', 'import'),
  ('bbbb2222-2222-2222-2222-222222222222', 'North Corridor Mobile Repair', null, 'roadside_repair', 'https://example.com/north-corridor-repair', 'unverified', 'Dispatch', '+1-000-000-0000', 'import'),
  ('bbbb3333-3333-3333-3333-333333333333', '401 Heavy Service Ontario', null, 'roadside_repair', 'https://example.com/401-heavy-service', 'unverified', 'Dispatch', '+1-000-000-0000', 'import')
on conflict do nothing;

insert into public.vendor_locations (id, vendor_id, location_name, country, region1, city, lat, lng, dispatch_phone, is_24_7, service_radius_miles)
values
  ('locc1111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Gainesville HQ', 'US', 'FL', 'Gainesville', 29.6516, -82.3248, '+1-000-000-0000', true, 80),
  ('locc2222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', 'Detroit Metro', 'US', 'MI', 'Detroit', 42.3314, -83.0458, '+1-000-000-0000', true, 60),
  ('locc3333-3333-3333-3333-333333333333', 'bbbb3333-3333-3333-3333-333333333333', 'Toronto Hub', 'CA', 'ON', 'Toronto', 43.6532, -79.3832, '+1-000-000-0000', true, 70)
on conflict do nothing;

insert into public.vendor_services (vendor_id, service_category, service_name, rate_unit)
values
  ('bbbb1111-1111-1111-1111-111111111111', 'towing', 'Heavy-duty towing', 'quote'),
  ('bbbb2222-2222-2222-2222-222222222222', 'roadside_repair', 'Mobile truck repair', 'per_hour'),
  ('bbbb3333-3333-3333-3333-333333333333', 'tire_service', '24/7 tire service', 'per_call')
on conflict do nothing;

insert into public.vendor_plans (vendor_id, plan_tier, monthly_price, entitlements_json)
values
  ('bbbb1111-1111-1111-1111-111111111111', 'free', 0, '{"searchable": true, "in_app_surface": "limited"}'),
  ('bbbb2222-2222-2222-2222-222222222222', 'verified', 29, '{"searchable": true, "verified_badge": true, "emergency_surface": "basic"}'),
  ('bbbb3333-3333-3333-3333-333333333333', 'priority', 99, '{"searchable": true, "verified_badge": true, "emergency_surface": "boosted", "corridor_boost": true}')
on conflict do nothing;
