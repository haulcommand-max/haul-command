-- supabase/migrations/20260408_002_profiles_attributes_reviews.sql

create table public.hc_entity_profiles (
    id uuid primary key default gen_random_uuid(),
    entity_id uuid not null references public.hc_entities(id) on delete cascade,
    headline text,
    short_description text,
    long_description text,
    service_summary text,
    availability_summary text,
    proof_summary text,
    language_support_summary text,
    sectors_summary text,
    geo_summary text,
    hours_json jsonb default '{}'::jsonb,
    contact_json jsonb default '{}'::jsonb,
    commercial_json jsonb default '{}'::jsonb,
    claim_completion_percent numeric(5,2) default 0,
    profile_completeness_score numeric(5,2) default 0,
    ai_readiness_score numeric(5,2) default 0,
    freshness_score numeric(5,2) default 0,
    proof_density_score numeric(5,2) default 0,
    internal_link_score numeric(5,2) default 0,
    conversion_readiness_score numeric(5,2) default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_entity_profiles_entity_id_idx on public.hc_entity_profiles(entity_id);
create index hc_entity_profiles_hours_idx on public.hc_entity_profiles using gin (hours_json);
create index hc_entity_profiles_contact_idx on public.hc_entity_profiles using gin (contact_json);
create index hc_entity_profiles_commercial_idx on public.hc_entity_profiles using gin (commercial_json);

create trigger trg_hc_entity_profiles_updated_at before update on public.hc_entity_profiles for each row execute function public.hc_set_updated_at();

create table public.hc_attributes (
    id uuid primary key default gen_random_uuid(),
    canonical_key text unique not null,
    bucket text not null,
    label_default text not null,
    description_default text,
    search_aliases_json jsonb default '[]'::jsonb,
    country_overrides_json jsonb default '{}'::jsonb,
    language_overrides_json jsonb default '{}'::jsonb,
    negative_terms_json jsonb default '[]'::jsonb,
    related_tools_json jsonb default '[]'::jsonb,
    related_page_families_json jsonb default '[]'::jsonb,
    related_review_prompts_json jsonb default '[]'::jsonb,
    monetization_tags_json jsonb default '[]'::jsonb,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_attributes_bucket_idx on public.hc_attributes(bucket);
create index hc_attributes_aliases_idx on public.hc_attributes using gin(search_aliases_json);
create index hc_attributes_country_overrides_idx on public.hc_attributes using gin(country_overrides_json);
create index hc_attributes_language_overrides_idx on public.hc_attributes using gin(language_overrides_json);

create trigger trg_hc_attributes_updated_at before update on public.hc_attributes for each row execute function public.hc_set_updated_at();

create table public.hc_entity_attributes (
    id uuid primary key default gen_random_uuid(),
    entity_id uuid not null references public.hc_entities(id) on delete cascade,
    attribute_id uuid not null references public.hc_attributes(id) on delete cascade,
    value_type text not null default 'boolean',
    value_text text,
    value_number numeric,
    value_boolean boolean,
    source text not null,
    source_ref_id text,
    confidence_score numeric(5,2) default 0,
    verification_status text not null default 'unverified',
    country_scope text,
    region_scope text,
    language_scope text,
    observed_at timestamptz default now(),
    expires_at timestamptz,
    created_at timestamptz default now(),
    constraint unique_entity_attr_src unique (entity_id, attribute_id, source, source_ref_id)
);

create index hc_ea_entity_id_idx on public.hc_entity_attributes(entity_id);
create index hc_ea_attribute_id_idx on public.hc_entity_attributes(attribute_id);
create index hc_ea_source_idx on public.hc_entity_attributes(source);
create index hc_ea_geo_idx on public.hc_entity_attributes(country_scope, region_scope);
create index hc_ea_verification_idx on public.hc_entity_attributes(verification_status);

create table public.hc_reviews (
    id uuid primary key default gen_random_uuid(),
    entity_id uuid not null references public.hc_entities(id) on delete cascade,
    reviewer_name text,
    review_source text not null,
    review_text_raw text not null,
    review_language text,
    review_rating numeric(3,1),
    review_date date,
    review_url text,
    reviewer_context_json jsonb default '{}'::jsonb,
    is_public boolean default true,
    ingested_at timestamptz default now()
);

create index hc_reviews_entity_id_idx on public.hc_reviews(entity_id);
create index hc_reviews_source_idx on public.hc_reviews(review_source);
create index hc_reviews_date_idx on public.hc_reviews(review_date);
create index hc_reviews_text_idx on public.hc_reviews using gin(to_tsvector('simple', review_text_raw));

create table public.hc_review_attributes (
    id uuid primary key default gen_random_uuid(),
    review_id uuid not null references public.hc_reviews(id) on delete cascade,
    entity_id uuid not null references public.hc_entities(id) on delete cascade,
    attribute_id uuid not null references public.hc_attributes(id) on delete cascade,
    snippet_text text,
    confidence_score numeric(5,2) default 0,
    sentiment_direction text,
    urgency_tag text,
    geo_tag text,
    time_tag text,
    proof_tag text,
    ai_snippet_candidate boolean default false,
    extracted_at timestamptz default now()
);

create index hc_ra_review_id_idx on public.hc_review_attributes(review_id);
create index hc_ra_entity_id_idx on public.hc_review_attributes(entity_id);
create index hc_ra_attribute_id_idx on public.hc_review_attributes(attribute_id);
create index hc_ra_ai_candidate_idx on public.hc_review_attributes(ai_snippet_candidate);

-- RLS Polices 
alter table public.hc_entity_profiles enable row level security;
alter table public.hc_entity_attributes enable row level security;
alter table public.hc_reviews enable row level security;
alter table public.hc_review_attributes enable row level security;

-- (Policies omitted here to stay brief, but will mirror the "general posture" service-role fallback)
create policy "service_role_full_access" on public.hc_entity_profiles for all to service_role using (true) with check (true);
create policy "service_role_full_access" on public.hc_entity_attributes for all to service_role using (true) with check (true);
create policy "service_role_full_access" on public.hc_reviews for all to service_role using (true) with check (true);
create policy "service_role_full_access" on public.hc_review_attributes for all to service_role using (true) with check (true);
