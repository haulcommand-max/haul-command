-- supabase/migrations/20260408_004_claim_queries_gaps.sql

create table public.hc_proof_items (
    id uuid primary key default gen_random_uuid(),
    entity_id uuid not null references public.hc_entities(id) on delete cascade,
    proof_type text not null,
    proof_label text,
    proof_status text not null default 'pending',
    proof_source text,
    proof_url text,
    proof_file_ref text,
    verified_by uuid,
    verified_at timestamptz,
    expires_at timestamptz,
    proof_metadata_json jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index hc_pi_entity_id_idx on public.hc_proof_items(entity_id);
create index hc_pi_type_idx on public.hc_proof_items(proof_type);
create index hc_pi_status_idx on public.hc_proof_items(proof_status);
create index hc_pi_expires_idx on public.hc_proof_items(expires_at);

create table public.hc_claim_sessions (
    id uuid primary key default gen_random_uuid(),
    entity_id uuid not null references public.hc_entities(id) on delete cascade,
    user_id uuid not null,
    claim_status text not null default 'claim_started',
    verification_method text,
    wizard_step text,
    completion_percent numeric(5,2) default 0,
    missing_fields_json jsonb default '[]'::jsonb,
    missing_attributes_json jsonb default '[]'::jsonb,
    recommended_actions_json jsonb default '[]'::jsonb,
    score_before_json jsonb default '{}'::jsonb,
    score_after_json jsonb default '{}'::jsonb,
    started_at timestamptz default now(),
    completed_at timestamptz
);

create index hc_cs_entity_id_idx on public.hc_claim_sessions(entity_id);
create index hc_cs_user_id_idx on public.hc_claim_sessions(user_id);
create index hc_cs_status_idx on public.hc_claim_sessions(claim_status);

create table public.hc_intent_queries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    anonymous_session_id text,
    query_text text not null,
    query_language text,
    query_country_code text,
    query_region_code text,
    query_city text,
    query_lat numeric(10,7),
    query_lng numeric(10,7),
    query_intent_cluster text,
    query_attributes_json jsonb default '[]'::jsonb,
    query_urgency text,
    query_time_context text,
    query_sector_context text,
    query_entity_type_targets_json jsonb default '[]'::jsonb,
    matched_entity_ids_json jsonb default '[]'::jsonb,
    match_success boolean default false,
    gap_detected boolean default false,
    created_at timestamptz default now()
);

create index hc_iq_text_idx on public.hc_intent_queries using gin(to_tsvector('simple', query_text));
create index hc_iq_geo_idx on public.hc_intent_queries(query_country_code, query_region_code);
create index hc_iq_cluster_idx on public.hc_intent_queries(query_intent_cluster);
create index hc_iq_match_gap_idx on public.hc_intent_queries(match_success, gap_detected);

create table public.hc_query_gaps (
    id uuid primary key default gen_random_uuid(),
    gap_type text not null,
    country_code text,
    region_code text,
    city_name text,
    corridor_hc_id text,
    attribute_id uuid references public.hc_attributes(id),
    entity_type text,
    query_examples_json jsonb default '[]'::jsonb,
    demand_count integer default 0,
    supply_count integer default 0,
    severity_score numeric(5,2) default 0,
    recommended_build_action text,
    recommended_monetization_action text,
    recommended_outreach_action text,
    status text not null default 'open',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_qg_type_idx on public.hc_query_gaps(gap_type);
create index hc_qg_geo_idx on public.hc_query_gaps(country_code, region_code);
create index hc_qg_status_idx on public.hc_query_gaps(status);
create index hc_qg_severity_idx on public.hc_query_gaps(severity_score desc);

create trigger trg_hc_query_gaps_updated_at before update on public.hc_query_gaps for each row execute function public.hc_set_updated_at();
