-- ============================================================================
-- Global Glossary Concepts + Country Term Variants
-- Concept-first architecture: one canonical concept → many localized terms
-- ============================================================================

-- ── Core concept table (global authority) ──────────────────────────────────
create table if not exists public.glossary_concepts (
    id                  uuid primary key default gen_random_uuid(),
    concept_slug        text not null unique,
    concept_name        text not null,
    concept_description text not null,
    category            text,
    global_priority     smallint default 0,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

create index if not exists glossary_concepts_slug_idx on public.glossary_concepts (concept_slug);
create index if not exists glossary_concepts_category_idx on public.glossary_concepts (category);

-- ── Country term variants (maps concepts to local terminology) ─────────────
create table if not exists public.glossary_term_variants (
    id                    uuid primary key default gen_random_uuid(),
    concept_slug          text not null references public.glossary_concepts(concept_slug) on delete cascade,
    country_code          text not null,           -- ISO 3166: US, CA, GB, AU, DE, etc.
    locale                text not null,           -- BCP 47: en-US, en-AU, fr-CA, de-DE, sv-SE, etc.
    term_local            text not null,           -- The actual term in that country/locale
    is_primary            boolean default false,   -- Primary term for this country
    search_aliases        text[] default '{}',     -- Alternative search terms
    regulatory_notes      text,                    -- Country-specific regulatory context
    industry_usage_score  smallint default 5,      -- 1-10 how commonly used
    noindex               boolean default true,    -- Default noindex until validated
    created_at            timestamptz default now(),
    unique(concept_slug, country_code, locale, term_local)
);

create index if not exists glossary_term_variants_lookup
    on public.glossary_term_variants (country_code, locale, term_local);
create index if not exists glossary_term_variants_concept_idx
    on public.glossary_term_variants (concept_slug);

-- ── Global countries reference ─────────────────────────────────────────────
create table if not exists public.global_countries (
    id                          uuid primary key default gen_random_uuid(),
    iso2                        text not null unique,
    iso3                        text,
    name                        text not null,
    primary_language            text not null default 'en',
    secondary_languages         text[] default '{}',
    currency_code               text default 'USD',
    measurement_system          text default 'imperial', -- metric | imperial
    driving_side                text default 'right',    -- left | right
    regulatory_confidence_score numeric(3,2) default 0,
    digital_maturity_score      numeric(3,2) default 0,
    freight_intensity_score     numeric(3,2) default 0,
    seo_priority_score          numeric(3,2) default 0,
    is_active_market            boolean default false,
    activation_phase            text default 'monitor', -- immediate | phase_2 | phase_3 | monitor
    created_at                  timestamptz default now(),
    updated_at                  timestamptz default now()
);

-- ── Global escort/permit rules (per country + optional region) ─────────────
create table if not exists public.global_escort_rules (
    id                        uuid primary key default gen_random_uuid(),
    country_code              text not null,
    region_code               text,         -- nullable: country-level if null
    escort_required_width     text,
    escort_required_length    text,
    escort_required_weight    text,
    number_of_escorts_formula text,
    special_equipment         text,
    source_url                text,
    last_verified_at          timestamptz,
    confidence_score          numeric(3,2) default 0.5,
    created_at                timestamptz default now(),
    updated_at                timestamptz default now()
);

create index if not exists global_escort_rules_country_idx
    on public.global_escort_rules (country_code, region_code);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.glossary_concepts enable row level security;
alter table public.glossary_term_variants enable row level security;
alter table public.global_countries enable row level security;
alter table public.global_escort_rules enable row level security;

-- Public read
create policy glossary_concepts_read on public.glossary_concepts for select using (true);
create policy glossary_variants_read on public.glossary_term_variants for select using (noindex = false);
create policy global_countries_read on public.global_countries for select using (true);
create policy global_escort_rules_read on public.global_escort_rules for select using (true);

-- Service role write
create policy glossary_concepts_write on public.glossary_concepts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy glossary_variants_write on public.glossary_term_variants for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy global_countries_write on public.global_countries for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy global_escort_rules_write on public.global_escort_rules for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ── Seed priority countries ────────────────────────────────────────────────
insert into public.global_countries (iso2, iso3, name, primary_language, measurement_system, driving_side, seo_priority_score, is_active_market, activation_phase) values
    ('US', 'USA', 'United States', 'en', 'imperial', 'right', 10.0, true, 'immediate'),
    ('CA', 'CAN', 'Canada', 'en', 'metric', 'right', 9.8, true, 'immediate'),
    ('AU', 'AUS', 'Australia', 'en', 'metric', 'left', 9.7, true, 'immediate'),
    ('GB', 'GBR', 'United Kingdom', 'en', 'imperial', 'left', 9.1, true, 'immediate'),
    ('NZ', 'NZL', 'New Zealand', 'en', 'metric', 'left', 9.0, true, 'immediate'),
    ('SE', 'SWE', 'Sweden', 'sv', 'metric', 'right', 8.6, false, 'phase_2'),
    ('NO', 'NOR', 'Norway', 'no', 'metric', 'right', 8.5, false, 'phase_2'),
    ('AE', 'ARE', 'United Arab Emirates', 'en', 'metric', 'right', 8.4, false, 'phase_2'),
    ('SA', 'SAU', 'Saudi Arabia', 'ar', 'metric', 'right', 8.2, false, 'phase_3'),
    ('DE', 'DEU', 'Germany', 'de', 'metric', 'right', 8.1, false, 'phase_3'),
    ('ZA', 'ZAF', 'South Africa', 'en', 'metric', 'left', 7.9, false, 'phase_3')
on conflict (iso2) do nothing;

-- ── Updated_at triggers ────────────────────────────────────────────────────
drop trigger if exists trg_glossary_concepts_updated on public.glossary_concepts;
create trigger trg_glossary_concepts_updated
before update on public.glossary_concepts
for each row execute function public.set_updated_at();

drop trigger if exists trg_global_countries_updated on public.global_countries;
create trigger trg_global_countries_updated
before update on public.global_countries
for each row execute function public.set_updated_at();
