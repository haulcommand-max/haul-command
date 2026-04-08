-- supabase/migrations/20260408_003_surfaces_links_scores.sql

create table public.hc_page_surfaces (
    id uuid primary key default gen_random_uuid(),
    surface_type text not null,
    entity_id uuid references public.hc_entities(id) on delete cascade,
    page_family text not null,
    country_code text,
    region_code text,
    language_code text,
    slug text not null unique,
    title text,
    h1 text,
    meta_description text,
    rendering_mode text not null default 'standard',
    canonical_url text,
    alternate_urls_json jsonb default '[]'::jsonb,
    schema_json jsonb default '{}'::jsonb,
    faq_json jsonb default '[]'::jsonb,
    link_cluster_json jsonb default '{}'::jsonb,
    ai_snippet_block_json jsonb default '{}'::jsonb,
    freshness_block_json jsonb default '{}'::jsonb,
    status text not null default 'draft',
    published_at timestamptz,
    updated_at timestamptz default now()
);

create index hc_ps_page_family_idx on public.hc_page_surfaces(page_family);
create index hc_ps_entity_id_idx on public.hc_page_surfaces(entity_id);
create index hc_ps_geo_idx on public.hc_page_surfaces(country_code, region_code, language_code);
create index hc_ps_status_idx on public.hc_page_surfaces(status);
create index hc_ps_text_search_idx on public.hc_page_surfaces using gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(h1,'')));

create trigger trg_hc_page_surfaces_updated_at before update on public.hc_page_surfaces for each row execute function public.hc_set_updated_at();

create table public.hc_internal_links (
    id uuid primary key default gen_random_uuid(),
    from_surface_id uuid not null references public.hc_page_surfaces(id) on delete cascade,
    to_surface_id uuid not null references public.hc_page_surfaces(id) on delete cascade,
    link_type text not null,
    anchor_text text,
    context_reason text,
    priority_score numeric(5,2) default 0,
    country_scope text,
    language_scope text,
    created_at timestamptz default now(),
    constraint unique_internal_link unique (from_surface_id, to_surface_id, link_type)
);

create index hc_il_from_idx on public.hc_internal_links(from_surface_id);
create index hc_il_to_idx on public.hc_internal_links(to_surface_id);
create index hc_il_type_idx on public.hc_internal_links(link_type);
create index hc_il_priority_idx on public.hc_internal_links(priority_score desc);

create table public.hc_ai_scores (
    id uuid primary key default gen_random_uuid(),
    target_type text not null,
    target_id uuid not null,
    completeness_score numeric(5,2) default 0,
    attribute_coverage_score numeric(5,2) default 0,
    proof_density_score numeric(5,2) default 0,
    freshness_score numeric(5,2) default 0,
    review_specificity_score numeric(5,2) default 0,
    geo_fit_score numeric(5,2) default 0,
    language_fit_score numeric(5,2) default 0,
    internal_link_score numeric(5,2) default 0,
    query_coverage_score numeric(5,2) default 0,
    conversion_readiness_score numeric(5,2) default 0,
    entity_consistency_score numeric(5,2) default 0,
    overall_ai_readiness_score numeric(5,2) default 0,
    score_payload_json jsonb default '{}'::jsonb,
    calculated_at timestamptz default now()
);

create index hc_as_target_idx on public.hc_ai_scores(target_type, target_id);
create index hc_as_overall_score_idx on public.hc_ai_scores(overall_ai_readiness_score desc);
