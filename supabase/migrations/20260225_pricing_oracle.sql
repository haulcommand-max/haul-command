-- ============================================================================
-- Predictive Load Pricing Oracle — event tracking + model storage
-- ============================================================================

create table if not exists public.pricing_events (
    id                          uuid primary key default gen_random_uuid(),
    created_at                  timestamptz default now(),
    country_code                text not null,
    region_code                 text,
    corridor_slug               text,
    role                        text not null,        -- broker, escort, system
    event_type                  text not null,        -- draft, posted, accepted, rejected, completed, cancelled
    load_type                   text not null,        -- PEVO, HEIGHT_POLE, ROUTE_SURVEY, BUCKET_TRUCK, POLICE
    miles_estimate              numeric not null,
    width_ft                    numeric,
    height_ft                   numeric,
    length_ft                   numeric,
    weight_lbs                  numeric,
    night_move                  boolean default false,
    weekend                     boolean default false,
    urban_heavy                 boolean default false,
    multi_day                   boolean default false,
    requires_police             boolean default false,
    suggested_floor             numeric,
    suggested_target            numeric,
    suggested_ceiling           numeric,
    posted_price                numeric,
    final_paid_price            numeric,
    time_to_first_response_min  numeric,
    time_to_fill_minutes        numeric,
    accepted                    boolean,
    completed                   boolean,
    broker_id                   uuid,
    escort_id                   uuid
);

create index if not exists pricing_events_country_idx on public.pricing_events (country_code, created_at desc);
create index if not exists pricing_events_corridor_idx on public.pricing_events (corridor_slug, created_at desc);
create index if not exists pricing_events_type_idx on public.pricing_events (event_type, created_at desc);

create table if not exists public.pricing_models (
    id              uuid primary key default gen_random_uuid(),
    created_at      timestamptz default now(),
    country_code    text not null,
    model_version   text not null,
    model_type      text not null,          -- heuristic, glm, gbdt, bayes
    parameters      jsonb not null,
    active          boolean default false
);

create unique index if not exists pricing_models_active_unique
    on public.pricing_models (country_code) where active = true;

-- RLS
alter table public.pricing_events enable row level security;
alter table public.pricing_models enable row level security;

create policy pe_read on public.pricing_events for select using (auth.role() in ('authenticated', 'service_role'));
create policy pe_insert on public.pricing_events for insert with check (auth.role() in ('authenticated', 'service_role'));
create policy pe_update on public.pricing_events for update using (auth.role() = 'service_role');
create policy pm_read on public.pricing_models for select using (auth.role() in ('authenticated', 'service_role'));
create policy pm_write on public.pricing_models for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
