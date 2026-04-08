-- supabase/migrations/20260408_001_core_entities.sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table public.hc_entities (
    id uuid primary key default gen_random_uuid(),
    hc_id text unique not null,
    entity_type text not null,
    canonical_name text not null,
    display_name text,
    slug text unique,
    status text not null default 'active',
    claim_status text not null default 'unclaimed',
    owner_user_id uuid null,
    source_type text,
    source_confidence numeric(5,2) default 0,
    country_code text,
    region_code text,
    city_name text,
    timezone text,
    lat numeric(10,7),
    lng numeric(10,7),
    canonical_language text,
    currency_code text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_verified_at timestamptz,
    last_freshness_event_at timestamptz,
    constraint valid_claim_status check (claim_status in ('unclaimed','claim_started','verification_pending','verified_not_optimized','optimized_basic','optimized_strong','optimized_dominant'))
);

create index hc_entities_type_idx on public.hc_entities using btree (entity_type);
create index hc_entities_geo_idx on public.hc_entities using btree (country_code, region_code);
create index hc_entities_claim_idx on public.hc_entities using btree (claim_status);
create index hc_entities_canonical_name_idx on public.hc_entities using gin (to_tsvector('simple', canonical_name));
create index hc_entities_display_name_idx on public.hc_entities using gin (to_tsvector('simple', display_name));
create index hc_entities_slug_idx on public.hc_entities using btree (slug);

-- RLS
alter table public.hc_entities enable row level security;

create policy "public_select_active_public_entities"
on public.hc_entities for select
to public
using (status = 'active');

create policy "owner_update_claimed_entity_basic_fields"
on public.hc_entities for update
to authenticated
using (owner_user_id = auth.uid());

create policy "service_role_full_access"
on public.hc_entities for all
to service_role
using (true)
with check (true);

-- Trigger for updated_at
create or replace function public.hc_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_hc_entities_updated_at
before update on public.hc_entities
for each row execute function public.hc_set_updated_at();
