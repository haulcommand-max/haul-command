begin;

create table if not exists public.glo_term_relationships (
  id uuid primary key default gen_random_uuid(),
  from_term_id uuid not null references public.glo_terms(id) on delete cascade,
  to_term_id uuid not null references public.glo_terms(id) on delete cascade,
  relationship_type text not null
    check (relationship_type in (
      'related',
      'parent',
      'child',
      'confused_with',
      'prerequisite_for',
      'often_used_with',
      'opposite_of',
      'required_by',
      'tool_solves',
      'regulation_mentions'
    )),
  weight integer not null default 1 check (weight between 1 and 100),
  created_at timestamptz not null default now(),
  unique (from_term_id, to_term_id, relationship_type),
  check (from_term_id <> to_term_id)
);

create table if not exists public.glo_geo_overlays (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  country_code text not null,
  region_code text,
  local_title_override text,
  local_short_definition text,
  local_expanded_definition text,
  local_plain_english text,
  local_why_it_matters text,
  local_regulatory_note text,
  confidence_state text not null default 'seeded_needs_review'
    check (confidence_state in (
      'verified_current',
      'verified_but_review_due',
      'partially_verified',
      'seeded_needs_review',
      'historical_reference_only'
    )),
  freshness_state text not null default 'seeded_needs_review'
    check (freshness_state in (
      'verified_current',
      'verified_but_review_due',
      'partially_verified',
      'seeded_needs_review',
      'historical_reference_only'
    )),
  reviewed_at timestamptz,
  next_review_due timestamptz,
  is_indexable boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, country_code, region_code)
);

create index if not exists glo_term_relationships_from_idx on public.glo_term_relationships(from_term_id, relationship_type);
create index if not exists glo_term_relationships_to_idx on public.glo_term_relationships(to_term_id, relationship_type);
create index if not exists glo_geo_overlays_term_idx on public.glo_geo_overlays(term_id);
create index if not exists glo_geo_overlays_country_idx on public.glo_geo_overlays(country_code, region_code, is_indexable);

drop trigger if exists trg_glo_geo_overlays_updated_at on public.glo_geo_overlays;
create trigger trg_glo_geo_overlays_updated_at
before update on public.glo_geo_overlays
for each row execute function public.set_updated_at();

alter table public.glo_term_relationships enable row level security;
alter table public.glo_geo_overlays enable row level security;

create policy if not exists glo_term_relationships_public_read
on public.glo_term_relationships for select
to anon, authenticated
using (true);

create policy if not exists glo_term_relationships_auth_write
on public.glo_term_relationships for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_geo_overlays_public_read
on public.glo_geo_overlays for select
to anon, authenticated
using (true);

create policy if not exists glo_geo_overlays_auth_write
on public.glo_geo_overlays for all
to authenticated
using (true)
with check (true);

commit;
