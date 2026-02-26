-- 0015_the_brain.sql

-- ================
-- 1) Rates + Lane Index
-- ================

create table if not exists public.rates_lane_samples (
  id uuid primary key default gen_random_uuid(),
  origin_city text,
  origin_state text,
  dest_city text,
  dest_state text,
  distance_miles numeric,
  rate_cents int,
  equipment_type text,
  submitted_by uuid references public.profiles(id),
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.rates_lane_index (
  origin_state text,
  dest_state text,
  equipment_type text,
  p50_rate_cents int,
  p90_rate_cents int,
  sample_count int default 0,
  updated_at timestamptz default now(),
  primary key (origin_state, dest_state, equipment_type)
);

-- ================
-- 2) Deadhead + Offer Math
-- ================

alter table public.offers
add column if not exists deadhead_miles numeric default 0,
add column if not exists deadhead_duration_minutes int default 0;

-- ================
-- 3) Job Requirements (Pre-Calc)
-- ================

create table if not exists public.job_requirements (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  min_height_inches int,
  min_width_inches int,
  requires_high_pole boolean default false,
  requires_light_bar boolean default false,
  insurance_min_amount int default 1000000,
  required_certs text[] default '{}',
  created_at timestamptz default now()
);

-- ================
-- 4) Availability + Accept Score
-- ================

create table if not exists public.driver_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_available boolean default false,
  last_seen_at timestamptz default now(),
  last_lat float,
  last_lng float,
  current_city text,
  current_state text,
  updated_at timestamptz default now()
);

create table if not exists public.driver_accept_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  offers_received int default 0,
  offers_viewed int default 0,
  offers_accepted int default 0,
  offers_ignored int default 0,
  accept_rate numeric generated always as (
    case when offers_received > 0 then round((offers_accepted::numeric / offers_received) * 100, 1) else 0 end
  ) stored,
  updated_at timestamptz default now()
);

-- ================
-- 5) Hazards (Waze++)
-- ================

create table if not exists public.hazard_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id),
  hazard_type text, -- height_trap, police_trap, closure, accident
  lat float not null,
  lng float not null,
  description text,
  is_active boolean default true,
  confirmations int default 0,
  denials int default 0,
  created_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists public.hazard_confirmations (
  id uuid primary key default gen_random_uuid(),
  hazard_id uuid references public.hazard_reports(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text check (action in ('confirm','deny')),
  created_at timestamptz default now(),
  unique(hazard_id, user_id)
);

-- ================
-- 6) RLS Rules
-- ================

-- Rates
alter table public.rates_lane_samples enable row level security;
alter table public.rates_lane_index enable row level security;
create policy "rates_index_public" on public.rates_lane_index for select using (true);
create policy "rates_samples_insert_auth" on public.rates_lane_samples for insert to authenticated with check (submitted_by = auth.uid());

-- Job Req
alter table public.job_requirements enable row level security;
create policy "job_req_public" on public.job_requirements for select using (true);

-- Presence
alter table public.driver_presence enable row level security;
create policy "presence_read_auth" on public.driver_presence for select to authenticated using (true);
create policy "presence_update_own" on public.driver_presence for update to authenticated using (user_id = auth.uid());

-- Hazards
alter table public.hazard_reports enable row level security;
create policy "hazards_public" on public.hazard_reports for select using (true);
create policy "hazards_insert_auth" on public.hazard_reports for insert to authenticated with check (true);

alter table public.hazard_confirmations enable row level security;
create policy "hazard_conf_insert_auth" on public.hazard_confirmations for insert to authenticated with check (user_id = auth.uid());
