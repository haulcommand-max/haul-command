
-- 10. ANTI-GRAVITY PROVIDER SCHEMA (Canonical)
-- Replaces previous partial implementations.
drop table if exists public.providers cascade;
drop table if exists public.provider_contacts cascade;
drop table if exists public.phone_validations cascade;
drop table if exists public.provider_scores cascade;
drop table if exists public.provider_coverage cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.transactions cascade;

-- Providers: the canonical entity used by Directory + Leaderboard + Routing + Monetization
create table if not exists public.providers (
  provider_key text primary key,
  name_raw text not null,
  name_norm text not null,
  provider_type text not null,         -- broker, escort, permit_service, dispatch, utility_bucket, training...
  category_raw text,
  role text,
  source text,
  status text default 'active',
  city text,
  state text,
  country text,
  trust_score numeric default 0,       -- future: composite score
  rating_avg numeric,
  rating_count integer default 0,
  jobs_completed integer default 0,
  miles_escorted integer default 0,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists providers_name_norm_idx on public.providers (name_norm);
create index if not exists providers_type_state_idx on public.providers (provider_type, state);

-- Contacts: support multiple phones/emails per provider later
create table if not exists public.provider_contacts (
  id bigserial primary key,
  provider_key text references public.providers(provider_key) on delete cascade,
  phone_raw text,
  phone_e164 text,
  email text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique (provider_key, phone_e164, email)
);

create index if not exists provider_contacts_phone_idx on public.provider_contacts (phone_e164);

-- Phone validation history (append-only)
create table if not exists public.phone_validations (
  id bigserial primary key,
  provider_key text references public.providers(provider_key) on delete cascade,
  phone_raw text,
  phone_e164 text,
  is_valid boolean,
  reason text,
  created_at timestamptz default now()
);

-- Leaderboard: points + tiers (computed or stored)
create table if not exists public.provider_scores (
  provider_key text primary key references public.providers(provider_key) on delete cascade,
  points numeric default 0,
  tier text default 'rookie',
  last_score_at timestamptz
);

-- Routing readiness: providers can have lanes/regions later
create table if not exists public.provider_coverage (
  id bigserial primary key,
  provider_key text references public.providers(provider_key) on delete cascade,
  region text,          -- e.g. "FL-GA", "I-75", "Northeast"
  state text,
  corridor text,        -- e.g. "I-10", "I-95"
  notes text,
  created_at timestamptz default now()
);

-- Monetization readiness: subscriptions + transactions later
create table if not exists public.subscriptions (
  id bigserial primary key,
  provider_key text references public.providers(provider_key) on delete cascade,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id bigserial primary key,
  provider_key text references public.providers(provider_key) on delete cascade,
  kind text,            -- listing_claim, boost, lead_purchase, subscription
  amount_cents integer,
  currency text default 'USD',
  meta jsonb,
  created_at timestamptz default now()
);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_providers_updated_at on public.providers;
create trigger set_providers_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

-- RLS (Open for now, lock down later)
alter table public.providers enable row level security;
create policy "providers_read_all" on public.providers for select using (true);
create policy "providers_insert_service" on public.providers for insert with check (true); 
create policy "providers_update_service" on public.providers for update using (true);

alter table public.provider_contacts enable row level security;
create policy "contacts_read_all" on public.provider_contacts for select using (true);
create policy "contacts_write_all" on public.provider_contacts for insert with check (true);
create policy "contacts_update_all" on public.provider_contacts for update using (true);
