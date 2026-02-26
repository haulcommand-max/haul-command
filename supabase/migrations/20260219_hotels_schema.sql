
-- 8. LODGING & RESOURCES (Hotels)
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_e164 text,
  city text,
  state text,
  address text,
  
  -- Pilot Car Specifics
  is_pilot_car_friendly boolean default true,
  has_clc boolean default false,
  has_truck_parking boolean default false,
  rate_notes text, -- e.g. "$45/night"
  
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.hotels enable row level security;
create policy "hotels_read_all" on public.hotels for select using (true);

-- Index for geo-lookup (future)
create index if not exists idx_hotels_state_city on public.hotels(state, city);
