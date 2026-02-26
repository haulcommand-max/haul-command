-- ============================================================================
-- Expanded Geo Entity Types + Load Board Indexing Support
-- ============================================================================

-- Add new geo entity types for deeper surface coverage
-- NOTE: Postgres doesn't support ALTER TYPE ADD VALUE inside transactions.
-- Run these outside a transaction block, or wrap in DO blocks that check first.

do $$
begin
  -- These will fail silently if the values already exist
  begin alter type geo_entity_type add value if not exists 'industrial_zone'; exception when duplicate_object then null; end;
  begin alter type geo_entity_type add value if not exists 'border_crossing'; exception when duplicate_object then null; end;
  begin alter type geo_entity_type add value if not exists 'weigh_station'; exception when duplicate_object then null; end;
  begin alter type geo_entity_type add value if not exists 'rural_zone'; exception when duplicate_object then null; end;
  begin alter type geo_entity_type add value if not exists 'suburb'; exception when duplicate_object then null; end;
end$$;


-- ── Load Board Indexing (each load = unique URL + structured data) ─────────
create table if not exists public.load_board_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,              -- unique URL slug for SEO

  -- Load basics
  title text not null,
  description text,
  load_type text,                         -- oversize, heavy_haul, wide_load, superload
  cargo_description text,

  -- Geography
  origin_city text,
  origin_region text,
  origin_country_code char(2),
  origin_lat double precision,
  origin_lon double precision,

  destination_city text,
  destination_region text,
  destination_country_code char(2),
  destination_lat double precision,
  destination_lon double precision,

  corridor_id uuid references public.corridors(id) on delete set null,

  -- Dimensions
  weight_lbs numeric,
  height_ft numeric,
  width_ft numeric,
  length_ft numeric,

  -- Escort requirements
  escorts_needed int default 0,
  police_escort_required boolean default false,

  -- Pricing
  rate_offered numeric,
  rate_currency text default 'USD',

  -- Status
  status text default 'open',             -- open, filled, expired, cancelled
  posted_at timestamptz default now(),
  expires_at timestamptz,
  filled_at timestamptz,

  -- Broker
  posted_by uuid,
  broker_name text,

  -- SEO / indexing
  is_indexable boolean default true,
  structured_data_valid boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists lbl_status_idx on public.load_board_listings(status, posted_at desc);
create index if not exists lbl_origin_idx on public.load_board_listings(origin_country_code, origin_region);
create index if not exists lbl_dest_idx on public.load_board_listings(destination_country_code, destination_region);
create index if not exists lbl_corridor_idx on public.load_board_listings(corridor_id);
create index if not exists lbl_slug_idx on public.load_board_listings(slug);
create index if not exists lbl_type_idx on public.load_board_listings(load_type, status);

-- Auto-expire: view of recently filled (for "recently filled" strip)
create or replace view public.v_recently_filled_loads as
select *
from public.load_board_listings
where status = 'filled'
  and filled_at >= (now() - interval '7 days')
order by filled_at desc
limit 50;

-- Hot corridors: corridors with most open loads
create or replace view public.v_hot_corridor_loads as
select
  corridor_id,
  c.name as corridor_name,
  c.slug as corridor_slug,
  count(*) as open_loads,
  avg(rate_offered) as avg_rate
from public.load_board_listings l
join public.corridors c on c.id = l.corridor_id
where l.status = 'open'
  and l.posted_at >= (now() - interval '30 days')
group by corridor_id, c.name, c.slug
having count(*) >= 2
order by open_loads desc;


-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.load_board_listings enable row level security;
create policy lbl_read on public.load_board_listings for select using (true);
create policy lbl_write on public.load_board_listings for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- ── Updated-at trigger ─────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'lbl_set_updated_at') then
    create trigger lbl_set_updated_at before update on public.load_board_listings
    for each row execute function set_updated_at();
  end if;
end$$;
