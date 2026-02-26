-- ============================================================================
-- Glossary: Supabase source-of-truth for ESC industry terminology
-- Used for: tooltips, /glossary pages, internal linking, schema, anti-thin SEO
-- ============================================================================

-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

-- ── Core glossary table ─────────────────────────────────────────────────────
create table if not exists public.glossary_terms (
    id                uuid primary key default gen_random_uuid(),
    slug              text not null unique,
    term              text not null,
    short_definition  text not null,
    long_definition   text,
    category          text,
    synonyms          text[] default '{}'::text[],
    related_slugs     text[] default '{}'::text[],
    acronyms          text[] default '{}'::text[],
    tags              text[] default '{}'::text[],
    sources           jsonb default '[]'::jsonb,
    jurisdiction      text,           -- e.g. FL, GA, US, CA, NA
    example_usage     text,
    common_mistakes   text,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    published         boolean not null default true,
    noindex           boolean not null default false,
    priority          smallint not null default 0
);

create index if not exists glossary_terms_slug_idx on public.glossary_terms (slug);
create index if not exists glossary_terms_term_trgm_idx on public.glossary_terms using gin (term gin_trgm_ops);
create index if not exists glossary_terms_def_trgm_idx on public.glossary_terms using gin (short_definition gin_trgm_ops);
create index if not exists glossary_terms_category_idx on public.glossary_terms (category);

-- ── Term usage tracking (proof + internal linking intelligence) ─────────────
create table if not exists public.glossary_term_usages (
    id              uuid primary key default gen_random_uuid(),
    term_slug       text not null references public.glossary_terms(slug) on delete cascade,
    page_path       text not null,
    page_type       text not null,    -- directory_city, profile, corridor, port, blog, load_board
    context_snippet text,
    first_seen_at   timestamptz not null default now(),
    last_seen_at    timestamptz not null default now(),
    occurrences     int not null default 1,
    unique(term_slug, page_path)
);

create index if not exists glossary_term_usages_term_slug_idx on public.glossary_term_usages(term_slug);
create index if not exists glossary_term_usages_page_path_idx on public.glossary_term_usages(page_path);

-- ── Public-safe view (hides admin/noindex rows) ────────────────────────────
create or replace view public.glossary_public as
select
    slug,
    term,
    short_definition,
    long_definition,
    category,
    synonyms,
    related_slugs,
    acronyms,
    tags,
    jurisdiction,
    example_usage,
    common_mistakes,
    sources,
    updated_at
from public.glossary_terms
where published = true and noindex = false;

-- ── Auto-update updated_at on write ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_glossary_terms_updated_at on public.glossary_terms;
create trigger trg_glossary_terms_updated_at
before update on public.glossary_terms
for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.glossary_terms enable row level security;
alter table public.glossary_term_usages enable row level security;

-- Public read for published + indexable terms
create policy glossary_public_read on public.glossary_terms
    for select using (published = true and noindex = false);

-- Public read for usages
create policy glossary_usages_public_read on public.glossary_term_usages
    for select using (true);

-- Service role full access (for data import + cron jobs)
create policy glossary_service_all on public.glossary_terms
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

create policy glossary_usages_service_all on public.glossary_term_usages
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
