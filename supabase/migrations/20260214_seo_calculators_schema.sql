-- ==============================================================================
-- HAUL COMMAND OPERATING SYSTEM (HCOS) - MODULE: SEO CALCULATORS
-- Date: 2026-02-14
-- Description: Schema for Traffic Engine, Calculator Runs, and Lead Capture.
-- ==============================================================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. CALCULATOR RUNS (The Core Data Stream)
-- ==============================================================================

create type calculator_type as enum (
    'escort_cost_estimator', 
    'permit_checker', 
    'deadhead_profit', 
    'escort_team_builder', 
    'superload_qualifier',
    'route_survey_estimator',
    'lane_profitability'
);

create table calculator_runs (
    id uuid primary key default uuid_generate_v4(),
    calculator_type calculator_type not null,
    timestamp timestamptz default now(),
    
    -- Inputs (Flexible JSON to store diverse calculator fields)
    inputs_json jsonb not null default '{}',
    -- Outputs (The result generated)
    output_json jsonb not null default '{}',
    
    -- Intelligence
    confidence_score int check (confidence_score between 0 and 100),
    state_detected text, -- e.g. 'FL', 'TX'
    corridor_detected text, -- e.g. 'I-10', 'I-95'
    
    -- User Identity (Nullable for anonymous "Instant" tier runs)
    email text,
    phone text,
    
    -- Provenance
    source_url text, -- Where they ran it (e.g. /calculators/florida-escort-cost)
    share_used boolean default false, -- Did they unlock via share?
    
    -- Metadata
    user_agent text,
    ip_address text -- Hashed for privacy compliance if needed
);

-- Index for analytics
create index idx_calc_runs_type on calculator_runs(calculator_type);
create index idx_calc_runs_email on calculator_runs(email);
create index idx_calc_runs_state on calculator_runs(state_detected);

-- ==============================================================================
-- 2. SAVED LANES (Retention Engine)
-- ==============================================================================

create table saved_lanes (
    id uuid primary key default uuid_generate_v4(),
    user_email text, -- Link via email
    user_phone text,
    
    origin_city text,
    origin_state text,
    dest_city text,
    dest_state text,
    
    roles_needed text[], -- e.g. ['lead_pole', 'chase']
    preferences jsonb default '{}', -- e.g. { "min_rate": 2.00 }
    
    last_result_json jsonb, -- Snapshot of last calculation
    is_active boolean default true, -- For recurring alerts
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==============================================================================
-- 3. LEAD EVENTS (Funnel Tracking)
-- ==============================================================================

create type lead_event_type as enum (
    'view', 
    'run', 
    'unlock_email', 
    'unlock_share', 
    'download_pdf', 
    'dispatch_click', 
    'directory_click', 
    'join_group_click'
);

create table lead_events (
    id uuid primary key default uuid_generate_v4(),
    calculator_run_id uuid references calculator_runs(id), -- Optional link to a specific run
    email text,
    phone text,
    event_type lead_event_type not null,
    metadata jsonb default '{}', -- Extra context
    timestamp timestamptz default now()
);

-- ==============================================================================
-- 4. DISPATCH REQUESTS (Revenue Conversion)
-- ==============================================================================

create type request_status as enum ('new', 'assigned', 'completed', 'canceled');

create table dispatch_requests (
    id uuid primary key default uuid_generate_v4(),
    calculator_run_id uuid references calculator_runs(id), -- Provenance
    
    -- Pre-filled inputs from calculator
    details_json jsonb not null, 
    
    contact_name text,
    contact_email text,
    contact_phone text,
    
    status request_status default 'new',
    assigned_provider_id uuid, -- Link to providers table (from Lead Radar schema)
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==============================================================================
-- 5. PARTNER CLICKS (Monetization Routing)
-- ==============================================================================

create table partner_clicks (
    id uuid primary key default uuid_generate_v4(),
    provider_id uuid, -- Target Partner
    calculator_type calculator_type,
    
    click_context text, -- e.g. "result_page_recommendation"
    revenue_tag text, -- e.g. "affiliate_link_a"
    
    run_id uuid references calculator_runs(id),
    timestamp timestamptz default now()
);

-- ==============================================================================
-- 6. VIEWS FOR ANALYTICS (Admin Dashboard)
-- ==============================================================================

create or replace view view_calculator_conversion as
select 
    calculator_type,
    count(*) as total_runs,
    count(case when email is not null then 1 end) as leads_captured,
    count(case when share_used = true then 1 end) as viral_shares,
    round((count(case when email is not null then 1 end)::numeric / count(*)) * 100, 2) as conversion_rate
from calculator_runs
group by calculator_type;
