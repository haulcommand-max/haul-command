begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.glo_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  parent_topic_id uuid references public.glo_topics(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glo_terms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_term text not null unique,
  short_definition text not null,
  expanded_definition text,
  plain_english text,
  why_it_matters text,
  term_type text not null default 'standard',
  topic_primary_id uuid references public.glo_topics(id) on delete set null,
  commercial_intent_level integer not null default 0 check (commercial_intent_level between 0 and 100),
  near_me_relevance boolean not null default false,
  sponsor_eligible boolean not null default false,
  featured_snippet_candidate boolean not null default true,
  ai_answer_variant text,
  voice_answer_variant text,
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
  is_active boolean not null default true,
  is_indexable boolean not null default true,
  source_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glo_term_topic_map (
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  topic_id uuid not null references public.glo_topics(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (term_id, topic_id)
);

create table if not exists public.glo_term_aliases (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  alias text not null,
  alias_type text not null default 'synonym'
    check (alias_type in (
      'synonym',
      'acronym',
      'local_alias',
      'misspelling',
      'regulatory_wording',
      'deprecated_term'
    )),
  country_code text,
  region_code text,
  language_code text not null default 'en',
  is_preferred boolean not null default false,
  search_only boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (term_id, alias, coalesce(country_code, ''), coalesce(region_code, ''), language_code)
);

create table if not exists public.glo_term_faqs (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_voice_friendly boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glo_term_use_cases (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  use_case text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.glo_term_sources (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  source_type text not null
    check (source_type in (
      'official_regulation',
      'government_manual',
      'industry_association',
      'workbook',
      'internal_editorial',
      'verified_partner',
      'route_support_reference'
    )),
  source_label text not null,
  source_url text,
  source_note text,
  source_authority_score integer not null default 50 check (source_authority_score between 0 and 100),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists glo_topics_parent_idx on public.glo_topics(parent_topic_id);
create index if not exists glo_topics_active_idx on public.glo_topics(is_active, sort_order);
create index if not exists glo_terms_topic_primary_idx on public.glo_terms(topic_primary_id);
create index if not exists glo_terms_active_idx on public.glo_terms(is_active, is_indexable);
create index if not exists glo_terms_snippet_idx on public.glo_terms(featured_snippet_candidate, commercial_intent_level desc);
create index if not exists glo_term_aliases_term_idx on public.glo_term_aliases(term_id);
create index if not exists glo_term_aliases_alias_idx on public.glo_term_aliases(alias);
create index if not exists glo_term_faqs_term_idx on public.glo_term_faqs(term_id, sort_order);
create index if not exists glo_term_use_cases_term_idx on public.glo_term_use_cases(term_id, sort_order);
create index if not exists glo_term_sources_term_idx on public.glo_term_sources(term_id);

drop trigger if exists trg_glo_topics_updated_at on public.glo_topics;
create trigger trg_glo_topics_updated_at
before update on public.glo_topics
for each row execute function public.set_updated_at();

drop trigger if exists trg_glo_terms_updated_at on public.glo_terms;
create trigger trg_glo_terms_updated_at
before update on public.glo_terms
for each row execute function public.set_updated_at();

drop trigger if exists trg_glo_term_faqs_updated_at on public.glo_term_faqs;
create trigger trg_glo_term_faqs_updated_at
before update on public.glo_term_faqs
for each row execute function public.set_updated_at();

alter table public.glo_topics enable row level security;
alter table public.glo_terms enable row level security;
alter table public.glo_term_topic_map enable row level security;
alter table public.glo_term_aliases enable row level security;
alter table public.glo_term_faqs enable row level security;
alter table public.glo_term_use_cases enable row level security;
alter table public.glo_term_sources enable row level security;

create policy if not exists glo_topics_public_read
on public.glo_topics for select
to anon, authenticated
using (is_active = true);

create policy if not exists glo_topics_auth_write
on public.glo_topics for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_terms_public_read
on public.glo_terms for select
to anon, authenticated
using (is_active = true and is_indexable = true);

create policy if not exists glo_terms_auth_write
on public.glo_terms for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_term_topic_map_public_read
on public.glo_term_topic_map for select
to anon, authenticated
using (true);

create policy if not exists glo_term_topic_map_auth_write
on public.glo_term_topic_map for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_term_aliases_public_read
on public.glo_term_aliases for select
to anon, authenticated
using (true);

create policy if not exists glo_term_aliases_auth_write
on public.glo_term_aliases for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_term_faqs_public_read
on public.glo_term_faqs for select
to anon, authenticated
using (true);

create policy if not exists glo_term_faqs_auth_write
on public.glo_term_faqs for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_term_use_cases_public_read
on public.glo_term_use_cases for select
to anon, authenticated
using (true);

create policy if not exists glo_term_use_cases_auth_write
on public.glo_term_use_cases for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_term_sources_public_read
on public.glo_term_sources for select
to anon, authenticated
using (true);

create policy if not exists glo_term_sources_auth_write
on public.glo_term_sources for all
to authenticated
using (true)
with check (true);

commit;
