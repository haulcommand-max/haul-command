-- Haul Command — Stripe Product & Price Registry
-- Migration: 20260404_015_stripe_products.sql
-- Purpose: Canonical mapping of Stripe product/price IDs to Haul Command features
-- APPLY AFTER creating products in Stripe Dashboard
begin;

create table if not exists public.hc_stripe_products (
  id                uuid primary key default gen_random_uuid(),
  product_key       text unique not null,  -- internal key, matches env var suffix
  stripe_product_id text,                 -- prod_xxx
  stripe_price_id   text,                 -- price_xxx (default price)
  name              text not null,
  description       text,
  amount_cents      int,
  currency          char(3) default 'USD',
  interval          text check(interval in ('one_time','month','year')),
  active            boolean default true,
  category          text check(category in ('data_product','adgrid','subscription','marketplace')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.hc_stripe_products enable row level security;
create policy "Service role full access stripe products"
  on public.hc_stripe_products for all using (auth.role() = 'service_role');

-- Seed canonical product registry
insert into public.hc_stripe_products(product_key, name, description, amount_cents, currency, interval, category)
values
  -- Data products
  ('corridor-starter',        'Corridor Intelligence Starter',     'Single corridor rate benchmark + permit map',                4900,  'USD', 'month',    'data_product'),
  ('corridor-pro',            'Corridor Intelligence Pro',          'Up to 25 corridors, CSV+PDF export, priority alerts',        19900, 'USD', 'month',    'data_product'),
  ('corridor-enterprise',     'Corridor Intelligence Enterprise',   'All corridors, API access, white-label, custom research',    NULL,  'USD', 'month',    'data_product'),
  -- AdGrid corridor
  ('adgrid-corridor-30d',     'AdGrid Corridor Sponsor — 30 days',  'Corridor page sponsor banner for 30 days',                   14900, 'USD', 'one_time', 'adgrid'),
  ('adgrid-corridor-90d',     'AdGrid Corridor Sponsor — 90 days',  'Corridor page sponsor banner for 90 days (save 10%)',         40230, 'USD', 'one_time', 'adgrid'),
  ('adgrid-corridor-180d',    'AdGrid Corridor Sponsor — 180 days', 'Corridor page sponsor banner for 180 days (save 17%)',        74500, 'USD', 'one_time', 'adgrid'),
  -- AdGrid country
  ('adgrid-country-30d',      'AdGrid Country Takeover — 30 days',  'All pages for a country for 30 days',                        49900, 'USD', 'one_time', 'adgrid'),
  ('adgrid-country-90d',      'AdGrid Country Takeover — 90 days',  'All pages for a country for 90 days (save 10%)',             134730, 'USD', 'one_time', 'adgrid'),
  -- AdGrid leaderboard
  ('adgrid-leaderboard-30d',  'AdGrid Leaderboard Sponsor — 30 days','Leaderboard top sponsor slot for 30 days',                  29900, 'USD', 'one_time', 'adgrid'),
  ('adgrid-leaderboard-90d',  'AdGrid Leaderboard Sponsor — 90 days','Leaderboard top sponsor slot for 90 days (save 10%)',        80730, 'USD', 'one_time', 'adgrid'),
  -- AdGrid tool / glossary
  ('adgrid-tool-30d',         'AdGrid Tool Sponsor — 30 days',      'Calculator or tool page sponsor for 30 days',                19900, 'USD', 'one_time', 'adgrid'),
  ('adgrid-glossary-30d',     'AdGrid Glossary Sponsor — 30 days',  'Glossary term sponsor for 30 days',                          9900,  'USD', 'one_time', 'adgrid'),
  ('adgrid-data-product-30d', 'AdGrid Data Product Slot — 30 days', 'Data product page sponsor slot for 30 days',                 24900, 'USD', 'one_time', 'adgrid')
on conflict (product_key) do update
  set name = excluded.name,
      description = excluded.description,
      amount_cents = excluded.amount_cents,
      updated_at = now();

commit;
