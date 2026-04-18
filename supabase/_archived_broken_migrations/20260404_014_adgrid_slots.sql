-- Haul Command — AdGrid Slots Table
-- Migration: 20260404_014_adgrid_slots.sql
-- Purpose: Stores active sponsor creative for all AdGrid surfaces
-- Surfaces: corridor | country | region | tool | glossary | leaderboard | empty_market
begin;

create type if not exists public.hc_adgrid_surface as enum(
  'corridor','country','region','city','tool','glossary',
  'regulations','leaderboard','empty_market','claim_listing','data_product'
);

create table if not exists public.hc_adgrid_slots (
  id                uuid primary key default gen_random_uuid(),
  surface           public.hc_adgrid_surface not null,

  -- Geo targeting (null = global)
  country_code      char(2),
  region_code       text,
  corridor_slug     text references public.hc_corridors(slug) on delete set null,

  -- Creative
  headline          text not null,
  subline           text,
  cta_label         text not null default 'Learn More',
  cta_href          text not null,
  badge_label       text,
  image_url         text,

  -- Scheduling
  status            text not null default 'active' check(status in ('active','paused','expired')),
  starts_at         timestamptz not null default now(),
  ends_at           timestamptz not null default (now() + interval '30 days'),

  -- Billing reference
  stripe_product_id text,
  stripe_price_id   text,
  advertiser_email  text,
  advertiser_name   text,

  -- Scoring / priority
  priority_score    int not null default 50,

  -- Audit
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_adgrid_slots_surface_corridor
  on public.hc_adgrid_slots(surface, corridor_slug, status);
create index if not exists idx_adgrid_slots_surface_country
  on public.hc_adgrid_slots(surface, country_code, status);
create index if not exists idx_adgrid_slots_active_window
  on public.hc_adgrid_slots(status, starts_at, ends_at);

alter table public.hc_adgrid_slots enable row level security;

-- Public can read active slots
create policy "Public read active adgrid slots" on public.hc_adgrid_slots
  for select using (status = 'active' and starts_at <= now() and ends_at >= now());

-- Service role has full access
create policy "Service role full access adgrid" on public.hc_adgrid_slots
  for all using (auth.role() = 'service_role');

commit;
