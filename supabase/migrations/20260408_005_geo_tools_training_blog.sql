-- supabase/migrations/20260408_005_geo_tools_training_blog.sql

create table public.hc_geo_overlays (
    id uuid primary key default gen_random_uuid(),
    country_code text not null,
    region_code text,
    default_language text not null,
    supported_languages_json jsonb default '[]'::jsonb,
    currency_code text not null,
    measurement_system text not null,
    date_format text not null,
    time_format text not null,
    role_aliases_json jsonb default '{}'::jsonb,
    service_aliases_json jsonb default '{}'::jsonb,
    legal_notes_json jsonb default '{}'::jsonb,
    commercial_notes_json jsonb default '{}'::jsonb,
    holiday_context_json jsonb default '{}'::jsonb,
    priority_sectors_json jsonb default '[]'::jsonb,
    local_search_phrases_json jsonb default '[]'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint unique_geo_overlay unique (country_code, region_code)
);

create index hc_go_geo_idx on public.hc_geo_overlays(country_code, region_code);
create trigger trg_hc_geo_overlays_updated_at before update on public.hc_geo_overlays for each row execute function public.hc_set_updated_at();

create table public.hc_glossary_terms (
    id uuid primary key default gen_random_uuid(),
    canonical_term text not null,
    slug text unique not null,
    definition_short text,
    definition_long text,
    aliases_json jsonb default '[]'::jsonb,
    country_variants_json jsonb default '{}'::jsonb,
    language_variants_json jsonb default '{}'::jsonb,
    ambiguity_notes_json jsonb default '[]'::jsonb,
    related_attributes_json jsonb default '[]'::jsonb,
    related_entities_json jsonb default '[]'::jsonb,
    related_tools_json jsonb default '[]'::jsonb,
    related_training_json jsonb default '[]'::jsonb,
    related_regulations_json jsonb default '[]'::jsonb,
    related_services_json jsonb default '[]'::jsonb,
    ai_snippet_answer text,
    status text not null default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_gt_search_idx on public.hc_glossary_terms using gin(to_tsvector('simple', canonical_term || ' ' || coalesce(definition_short,'')));
create index hc_gt_aliases_idx on public.hc_glossary_terms using gin(aliases_json);
create trigger trg_hc_glossary_terms_updated_at before update on public.hc_glossary_terms for each row execute function public.hc_set_updated_at();

create table public.hc_training_modules (
    id uuid primary key default gen_random_uuid(),
    module_title text not null,
    slug text unique not null,
    summary text,
    skills_json jsonb default '[]'::jsonb,
    credentials_json jsonb default '[]'::jsonb,
    country_specific_notes_json jsonb default '{}'::jsonb,
    related_entities_json jsonb default '[]'::jsonb,
    related_tools_json jsonb default '[]'::jsonb,
    related_glossary_json jsonb default '[]'::jsonb,
    related_pages_json jsonb default '[]'::jsonb,
    faq_json jsonb default '[]'::jsonb,
    proof_outputs_json jsonb default '[]'::jsonb,
    status text not null default 'draft',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_tm_status_idx on public.hc_training_modules(status);
create index hc_tm_search_idx on public.hc_training_modules using gin(to_tsvector('simple', module_title || ' ' || coalesce(summary,'')));
create trigger trg_hc_training_modules_updated_at before update on public.hc_training_modules for each row execute function public.hc_set_updated_at();

create table public.hc_tools (
    id uuid primary key default gen_random_uuid(),
    tool_name text not null,
    slug text unique not null,
    tool_type text not null,
    input_schema_json jsonb not null default '{}'::jsonb,
    output_schema_json jsonb not null default '{}'::jsonb,
    related_attributes_json jsonb default '[]'::jsonb,
    related_pages_json jsonb default '[]'::jsonb,
    related_entities_json jsonb default '[]'::jsonb,
    lead_capture_rules_json jsonb default '{}'::jsonb,
    monetization_rules_json jsonb default '{}'::jsonb,
    status text not null default 'draft',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger trg_hc_tools_updated_at before update on public.hc_tools for each row execute function public.hc_set_updated_at();

create table public.hc_tool_runs (
    id uuid primary key default gen_random_uuid(),
    tool_id uuid not null references public.hc_tools(id) on delete cascade,
    user_id uuid,
    anonymous_session_id text,
    input_payload_json jsonb not null default '{}'::jsonb,
    output_payload_json jsonb not null default '{}'::jsonb,
    extracted_attributes_json jsonb default '[]'::jsonb,
    extracted_geo_json jsonb default '{}'::jsonb,
    recommended_entities_json jsonb default '[]'::jsonb,
    gap_detection_json jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index hc_tr_tool_idx on public.hc_tool_runs(tool_id);
create index hc_tr_user_idx on public.hc_tool_runs(user_id);

create table public.hc_blog_posts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text unique not null,
    summary text,
    body text,
    country_scope text,
    region_scope text,
    language_code text,
    intent_cluster text,
    related_attributes_json jsonb default '[]'::jsonb,
    related_entities_json jsonb default '[]'::jsonb,
    related_tools_json jsonb default '[]'::jsonb,
    related_glossary_json jsonb default '[]'::jsonb,
    related_training_json jsonb default '[]'::jsonb,
    faq_json jsonb default '[]'::jsonb,
    ai_snippet_block_json jsonb default '{}'::jsonb,
    freshness_weight numeric(5,2) default 0,
    status text not null default 'draft',
    published_at timestamptz,
    updated_at timestamptz default now()
);

create index hc_bp_intent_idx on public.hc_blog_posts(intent_cluster);
create index hc_bp_geo_idx on public.hc_blog_posts(country_scope, region_scope);
create index hc_bp_status_idx on public.hc_blog_posts(status);
create trigger trg_hc_blog_posts_updated_at before update on public.hc_blog_posts for each row execute function public.hc_set_updated_at();

create table public.hc_monetization_products (
    id uuid primary key default gen_random_uuid(),
    product_type text not null,
    product_name text not null,
    target_entity_type text,
    country_scope text,
    region_scope text,
    attribute_targeting_json jsonb default '[]'::jsonb,
    billing_model text not null,
    price_rules_json jsonb default '{}'::jsonb,
    eligibility_rules_json jsonb default '{}'::jsonb,
    upsell_trigger_rules_json jsonb default '{}'::jsonb,
    downsell_rules_json jsonb default '{}'::jsonb,
    status text not null default 'active'
);

create index hc_mp_type_idx on public.hc_monetization_products(product_type);

create table public.hc_agent_jobs (
    id uuid primary key default gen_random_uuid(),
    agent_name text not null,
    job_type text not null,
    target_type text not null,
    target_id uuid,
    input_payload_json jsonb default '{}'::jsonb,
    output_payload_json jsonb default '{}'::jsonb,
    status text not null default 'queued',
    priority integer default 100,
    created_at timestamptz default now(),
    started_at timestamptz,
    completed_at timestamptz,
    error_text text
);

create index hc_aj_queue_idx on public.hc_agent_jobs(agent_name, status, priority);

create schema if not exists audit;
create table audit.surface_audits (
    id uuid primary key default gen_random_uuid(),
    surface_id uuid not null,
    audit_type text not null,
    score_json jsonb default '{}'::jsonb,
    fail_reasons_json jsonb default '[]'::jsonb,
    keep_merge_kill text,
    created_at timestamptz default now()
);
