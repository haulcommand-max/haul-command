-- ==============================================================================
-- HAUL COMMAND OPERATING SYSTEM (HCOS) - MASTER SCHEMA v1.0
-- Module: LEAD RADAR + GEO-DOMINANCE
-- ==============================================================================

-- Enable common extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis"; -- For Geo-Dominance

-- ==============================================================================
-- A) SOURCE REGISTRY & CONNECTORS
-- ==============================================================================

create type source_type as enum ('rss', 'api', 'http_html', 'manual', 'email');
create type connector_mode as enum ('http_first', 'playwright_first');
create type auth_type as enum ('cookies', 'username_password', 'oauth_manual');

create table sources (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    base_url text not null,
    type source_type not null,
    requires_auth boolean default false,
    js_likely boolean default false,
    allowed boolean default false,
    paused boolean default false,
    robots_respected boolean default true,
    rate_limit_rps numeric default 0.5,
    max_concurrency int default 2,
    notes text,
    last_success_at timestamptz,
    last_fail_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table source_connectors (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references sources(id),
    connector_mode connector_mode not null,
    url_patterns jsonb default '[]', -- include/exclude
    extraction_rules jsonb default '{}', -- selectors + mappings
    required_fields jsonb default '[]', -- validation
    login_profile_id uuid, -- fk to login_profiles (defined below)
    validation_tests jsonb default '[]',
    version int default 1,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table login_profiles (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references sources(id),
    auth_type auth_type not null,
    secret_ref text not null, -- Vault reference
    last_verified_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table source_connectors add constraint fk_login_profile foreign key (login_profile_id) references login_profiles(id);

-- ==============================================================================
-- B) INGESTION PIPELINE
-- ==============================================================================

create type parse_status as enum ('new', 'parsed', 'rejected');
create type job_status as enum ('queued', 'running', 'success', 'failed', 'paused');
create type job_type as enum ('fetch_http', 'fetch_playwright');

create table raw_events (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references sources(id),
    source_url text,
    fetched_at timestamptz default now(),
    status_code int,
    content_type text,
    raw_payload jsonb,
    raw_text text,
    hash_signature text unique,
    parse_status parse_status default 'new',
    reject_reason text
);

create table ingest_jobs (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references sources(id),
    url text not null,
    job_type job_type not null,
    needs_browser boolean default false,
    status job_status default 'queued',
    attempts int default 0,
    next_run_at timestamptz default now(),
    last_error text,
    duration_ms int,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==============================================================================
-- C) ENTITIES (COMPANIES & CONTACTS)
-- ==============================================================================

create table companies (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    domain text,
    hq_city text,
    hq_state text,
    hq_country text,
    industry_tags text[] default '{}',
    is_buyer boolean default false,
    is_provider boolean default false,
    quality_score numeric default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create type contact_channel as enum ('sms', 'email', 'phone', 'none');
create type verification_status as enum ('unverified', 'verified', 'bounced');

create table contacts (
    id uuid primary key default uuid_generate_v4(),
    company_id uuid references companies(id),
    name text,
    role_title text,
    phone_e164 text,
    email text,
    preferred_channel contact_channel default 'email',
    verification_status verification_status default 'unverified',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==============================================================================
-- D) LEADS & SCORING
-- ==============================================================================

create type lead_type as enum ('escort_request', 'route_survey', 'steer_man', 'bucket_line', 'pilot_chase', 'permit_help', 'other');
create type lead_status as enum ('new', 'qualified', 'dispatched', 'assigned', 'completed', 'dead', 'archived');

create table leads (
    id uuid primary key default uuid_generate_v4(),
    lead_type lead_type not null,
    buyer_company_id uuid references companies(id),
    buyer_contact_id uuid references contacts(id),
    origin_text text,
    dest_text text,
    origin_lat numeric,
    origin_lng numeric,
    dest_lat numeric,
    dest_lng numeric,
    pickup_date date,
    time_window text,
    load_length_ft numeric,
    load_width_ft numeric,
    load_height_ft numeric,
    load_weight_lb numeric,
    needs_high_pole boolean default false,
    needs_route_survey boolean default false,
    needs_bucket_line boolean default false,
    notes text,
    status lead_status default 'new',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table lead_sources (
    lead_id uuid references leads(id),
    raw_event_id uuid references raw_events(id),
    source_url text,
    first_seen_at timestamptz default now(),
    last_seen_at timestamptz default now(),
    primary key (lead_id, raw_event_id)
);

create table lead_scores (
    lead_id uuid references leads(id) primary key,
    intent_score int check (intent_score between 0 and 100),
    freshness_score int check (freshness_score between 0 and 100),
    fit_score int check (fit_score between 0 and 100),
    contactability_score int check (contactability_score between 0 and 100),
    geo_score int check (geo_score between 0 and 100),
    overall_score int check (overall_score between 0 and 100),
    score_explain jsonb,
    scored_at timestamptz default now()
);

-- ==============================================================================
-- E) GEO-DOMINANCE ARCHITECTURE (PHASE 4)
-- ==============================================================================

create type region_type as enum ('city', 'county', 'tri_county', 'state_province', 'country', 'global');

create table geo_regions (
    id uuid primary key default uuid_generate_v4(),
    region_type region_type not null,
    name text not null,
    parent_region_id uuid references geo_regions(id),
    country_code text, -- e.g. 'US', 'CA'
    iso_code text, -- e.g. 'TX', 'AB' (for states/provinces)
    centroid_lat numeric,
    centroid_lng numeric,
    geometry geography(MultiPolygon, 4326), -- PostGIS
    created_at timestamptz default now()
);

-- ==============================================================================
-- F) PROVIDERS & PERFORMANCE
-- ==============================================================================

create type provider_type as enum ('pilot_car', 'route_surveyor', 'steer_man', 'bucket_line', 'police_coord', 'permit_runner');
create type provider_tier as enum ('base', 'active', 'unicorn', 'elite');
create type provider_status as enum ('available', 'limited', 'unavailable');

create table providers (
    id uuid primary key default uuid_generate_v4(),
    company_id uuid references companies(id),
    provider_type provider_type not null,
    home_base_lat numeric,
    home_base_lng numeric,
    service_area jsonb, -- states/radius
    availability_status provider_status default 'available',
    rating_score numeric default 0,
    response_speed_score numeric default 0,
    completion_rate numeric default 0,
    cancellation_rate numeric default 0,
    tier provider_tier default 'base',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Provider Geo Performance (The "Leaderboard" Data)
create table provider_geo_stats (
    provider_id uuid references providers(id),
    region_id uuid references geo_regions(id),
    total_assignments int default 0,
    completed_assignments int default 0,
    cancel_count int default 0,
    avg_response_time_seconds int,
    avg_rating numeric,
    revenue_generated numeric default 0,
    last_assignment_at timestamptz,
    performance_score numeric, -- Weighted Index
    rank_position int,
    percentile int,
    updated_at timestamptz default now(),
    primary key (provider_id, region_id)
);

create table provider_capabilities (
    provider_id uuid references providers(id) primary key,
    capabilities text[] default '{}',
    max_height_ft numeric,
    notes text
);

create type credential_type as enum ('state_cert', 'insurance', 'background_check', 'twic', 'other');

create table provider_credentials (
    id uuid primary key default uuid_generate_v4(),
    provider_id uuid references providers(id),
    credential_type credential_type not null,
    issuer text,
    credential_id text,
    expires_at date,
    verified boolean default false,
    document_url text
);

-- ==============================================================================
-- G) MATCHING, OFFERS & ASSIGNMENTS
-- ==============================================================================

create table matches (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id),
    provider_id uuid references providers(id),
    eligibility_pass boolean,
    match_score int check (match_score between 0 and 100),
    rank int,
    match_explain jsonb,
    created_at timestamptz default now()
);

create type offer_status as enum ('sent', 'viewed', 'accepted', 'declined', 'expired');

create table offers (
    id uuid primary key default uuid_generate_v4(),
    match_id uuid references matches(id),
    offer_status offer_status default 'sent',
    rate_quote numeric,
    expires_at timestamptz,
    sent_at timestamptz default now(),
    responded_at timestamptz
);

create type assignment_status as enum ('assigned', 'enroute', 'on_site', 'completed', 'canceled');

create table assignments (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references leads(id),
    provider_id uuid references providers(id),
    assignment_status assignment_status default 'assigned',
    agreed_rate numeric,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==============================================================================
-- H) GROWTH & SECURITY
-- ==============================================================================

create table upgrade_recommendations (
    id uuid primary key default uuid_generate_v4(),
    provider_id uuid references providers(id),
    missing_feature text,
    risk_impact int,
    revenue_impact int,
    suggested_package text,
    match_boost_value int,
    created_at timestamptz default now()
);

create table acquisition_intel (
    provider_id uuid references providers(id) primary key,
    acquisition_source text,
    group_member boolean,
    referred_by text,
    invite_count int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table audit_log (
    id uuid primary key default uuid_generate_v4(),
    actor_id uuid, -- User ID
    action text not null,
    entity_type text not null,
    entity_id uuid,
    meta jsonb,
    created_at timestamptz default now()
);

create table legal_acceptance_log (
    id uuid primary key default uuid_generate_v4(),
    provider_id uuid references providers(id),
    terms_version text not null,
    disclaimers_version text not null,
    ranking_disclaimer_ack boolean default false,
    ip_address text,
    user_agent text,
    signed_at timestamptz default now(),
    signature_hash text not null
);
