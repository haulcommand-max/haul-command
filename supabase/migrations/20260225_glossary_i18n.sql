-- ============================================================================
-- Glossary i18n: localized term variants (fr-CA, en-CA)
-- ============================================================================

create table if not exists public.glossary_term_i18n (
    id                            uuid primary key default gen_random_uuid(),
    term_slug                     text not null references public.glossary_terms(slug) on delete cascade,
    locale                        text not null, -- 'en-US' | 'en-CA' | 'fr-CA'
    term_localized                text not null,
    short_definition_localized    text not null,
    long_definition_localized     text,
    example_usage_localized       text,
    common_mistakes_localized     text,
    sources                       jsonb default '[]'::jsonb,
    published                     boolean not null default true,
    noindex                       boolean not null default false,
    updated_at                    timestamptz not null default now(),
    unique(term_slug, locale)
);

create index if not exists glossary_term_i18n_slug_locale_idx
    on public.glossary_term_i18n (term_slug, locale);

-- Public view (only published + indexable)
create or replace view public.glossary_i18n_public as
select
    term_slug,
    locale,
    term_localized,
    short_definition_localized,
    long_definition_localized,
    example_usage_localized,
    common_mistakes_localized,
    sources,
    updated_at
from public.glossary_term_i18n
where published = true and noindex = false;

-- RLS
alter table public.glossary_term_i18n enable row level security;

create policy glossary_i18n_public_read on public.glossary_term_i18n
    for select using (published = true and noindex = false);

create policy glossary_i18n_service_all on public.glossary_term_i18n
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- Reuse updated_at trigger
drop trigger if exists trg_glossary_i18n_updated_at on public.glossary_term_i18n;
create trigger trg_glossary_i18n_updated_at
before update on public.glossary_term_i18n
for each row execute function public.set_updated_at();
