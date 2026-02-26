
-- Phase 15: Verified Partner Engine (Monetization Layer)
-- Vertical sponsored placement engine for Haul Command.

CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  category text, -- escort, bucket_truck, permits, police_coordination
  status text default 'active',
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.sponsor_placements (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references public.sponsors(id) on delete cascade,
  placement_type text, 
  -- featured_directory, boosted_load, region_spotlight, near_me_priority, equipment_deal
  region_code text, -- state or province (e.g. 'FL')
  category text,
  priority_score int default 50,
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.sponsor_metrics (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references public.sponsors(id) on delete cascade,
  placement_id uuid references public.sponsor_placements(id) on delete cascade,
  event_type text, -- impression, click, call, save
  region_code text,
  created_at timestamptz default now()
);

-- RLS Policies
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsors_read_public" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "sponsor_placements_read_public" ON public.sponsor_placements FOR SELECT USING (is_active = true);
CREATE POLICY "sponsor_metrics_insert_public" ON public.sponsor_metrics FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_placements_lookup ON public.sponsor_placements (region_code, category, is_active);
CREATE INDEX IF NOT EXISTS idx_sponsor_metrics_agg ON public.sponsor_metrics (sponsor_id, event_type);
