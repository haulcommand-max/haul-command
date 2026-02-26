-- 20260219_truck_stops_schema.sql
-- Truck Stops Directory

create table if not exists public.truck_stops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  
  -- Location
  address text,
  city text,
  state text, -- 'AL', 'TX' etc
  zip text,
  country text default 'US',
  
  -- Contact
  phone_e164 text,
  website_url text,
  
  -- Resources
  has_parking boolean default true,
  parking_spots int,
  has_showers boolean default false,
  has_scales boolean default false,
  has_wifi boolean default false,
  has_laundry boolean default false,
  fuel_lanes int,
  
  -- Metadata
  source_url text,
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(state, name, city) -- Simple dedup constraint
);

-- Indexing
create index if not exists idx_truck_stops_state on public.truck_stops(state);
create index if not exists idx_truck_stops_geo on public.truck_stops(state, city);

-- RLS
alter table public.truck_stops enable row level security;
create policy "truck_stops_read_all" on public.truck_stops for select to anon, authenticated using (true);

-- Waze Updates Integration (Optional Future: Link waze_updates to truck_stops)
