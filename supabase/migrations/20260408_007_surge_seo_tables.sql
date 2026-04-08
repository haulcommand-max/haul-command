-- supabase/migrations/20260408_007_surge_seo_tables.sql

create table public.hc_market_surge_window (
    id uuid primary key default gen_random_uuid(),
    market_code text not null,
    surge_type text not null,
    surge_name text not null,
    start_at timestamptz not null,
    end_at timestamptz not null,
    urgency_score numeric(5,2) default 0,
    commercial_priority_score numeric(5,2) default 0,
    search_priority_score numeric(5,2) default 0,
    active_flag boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_msw_market_idx on public.hc_market_surge_window(market_code);
create index hc_msw_active_idx on public.hc_market_surge_window(active_flag);
create trigger trg_hc_market_surge_window_updated_at before update on public.hc_market_surge_window for each row execute function public.hc_set_updated_at();

create table public.hc_surge_page (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    page_type text not null,
    market_code text not null,
    corridor_code text,
    service_code text,
    surge_window_id uuid references public.hc_market_surge_window(id) on delete set null,
    headline text not null,
    subheadline text,
    proof_block_json jsonb default '{}'::jsonb,
    faq_json jsonb default '[]'::jsonb,
    cta_variant text,
    status text not null default 'draft',
    published_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index hc_sp_slug_idx on public.hc_surge_page(slug);
create index hc_sp_market_idx on public.hc_surge_page(market_code);
create trigger trg_hc_surge_page_updated_at before update on public.hc_surge_page for each row execute function public.hc_set_updated_at();

create table public.hc_gbp_readiness_audit (
    id uuid primary key default gen_random_uuid(),
    provider_profile_id uuid not null references public.hc_entities(id) on delete cascade,
    title_tag_score numeric(5,2) default 0,
    primary_category_match_score numeric(5,2) default 0,
    city_match_score numeric(5,2) default 0,
    review_strength_score numeric(5,2) default 0,
    trust_signal_score numeric(5,2) default 0,
    conversion_clarity_score numeric(5,2) default 0,
    mobile_first_score numeric(5,2) default 0,
    recommended_fixes_json jsonb default '[]'::jsonb,
    created_at timestamptz default now()
);

create index hc_gra_provider_idx on public.hc_gbp_readiness_audit(provider_profile_id);

-- Dummy implementation of urgent market signals table since it connects the operations to SEO
create table public.hc_urgent_market_signal (
    id uuid primary key default gen_random_uuid(),
    market_code text not null,
    signal_type text not null,
    urgency_level text not null default 'high',
    detected_at timestamptz default now(),
    resolved_at timestamptz
);

create index hc_ums_market_idx on public.hc_urgent_market_signal(market_code, urgency_level);
