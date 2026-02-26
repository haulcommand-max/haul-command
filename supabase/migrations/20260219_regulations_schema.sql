
-- 9. STATE REGULATIONS
create table if not exists public.state_regulations (
  id uuid primary key default gen_random_uuid(),
  
  state_code text not null, -- e.g. 'AL', 'FL', 'BC'
  state_name text not null,
  country text not null default 'US',
  
  content_markdown text,
  source_url text,
  
  -- Structured data (if we parse it later)
  height_pole_threshold text,
  lead_car_threshold text,
  chase_car_threshold text,
  curfew_notes text,
  
  updated_at timestamptz default now(),
  unique(state_code, country)
);

alter table public.state_regulations enable row level security;
create policy "regulations_read_all" on public.state_regulations for select using (true);

-- Full text search
create index if not exists idx_state_regulations_search on public.state_regulations using gin(to_tsvector('english', content_markdown));
