-- ============================================================================
-- Intel Observation Tables + Event Stream Capture
-- Turns priors → observed intelligence via behavioral exhaust + crowdsourcing
-- ============================================================================

-- ── Permit Friction Observations (the "priors killer") ─────────────────────
create table if not exists public.permit_friction_observations (
    id              uuid primary key default gen_random_uuid(),
    observed_at     timestamptz default now(),
    country_code    text not null,
    region_code     text,
    corridor_slug   text,
    observation_type text not null,   -- permit_delay, reroute, rejection, resubmission, office_slowdown
    value           numeric,          -- e.g. delay in hours, rejection count
    source          text not null,    -- behavioral, crowdsourced, structured
    trust_weight    numeric(4,3) default 1.000,
    session_id      text,
    profile_id      uuid,
    suppressed      boolean default false,
    created_at      timestamptz default now()
);

create index if not exists pfo_country_idx on public.permit_friction_observations (country_code, observed_at desc);
create index if not exists pfo_type_idx on public.permit_friction_observations (observation_type, country_code);
create index if not exists pfo_corridor_idx on public.permit_friction_observations (corridor_slug, observed_at desc);

-- ── Behavioral Intel Events (marketplace exhaust) ──────────────────────────
create table if not exists public.intel_events (
    id              uuid primary key default gen_random_uuid(),
    event_type      text not null,    -- search_submitted, load_posted, offer_accepted, offer_declined,
                                      -- route_planned, route_changed, late_fill, unfilled_timeout,
                                      -- match_generated
    country_code    text not null,
    region_code     text,
    corridor_slug   text,
    payload         jsonb default '{}',
    session_id      text,
    profile_id      uuid,
    created_at      timestamptz default now()
);

create index if not exists ie_type_idx on public.intel_events (event_type, country_code, created_at desc);
create index if not exists ie_country_idx on public.intel_events (country_code, created_at desc);
create index if not exists ie_corridor_idx on public.intel_events (corridor_slug, created_at desc);

-- ── Observation Aggregates (recomputed by cron) ────────────────────────────
create table if not exists public.intel_observation_counts (
    id              uuid primary key default gen_random_uuid(),
    country_code    text not null,
    region_code     text,
    corridor_slug   text,
    -- Counts (rolling 30d)
    friction_observations_30d   integer default 0,
    scarcity_observations_30d   integer default 0,
    behavioral_events_30d       integer default 0,
    crowd_reports_30d           integer default 0,
    -- Basis determination
    friction_basis  text default 'priors',   -- priors, mixed, observed
    scarcity_basis  text default 'priors',
    -- Timestamps
    computed_at     timestamptz default now(),
    unique(country_code, region_code, corridor_slug)
);

create index if not exists ioc_country_idx on public.intel_observation_counts (country_code);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.permit_friction_observations enable row level security;
alter table public.intel_events enable row level security;
alter table public.intel_observation_counts enable row level security;

create policy pfo_read on public.permit_friction_observations for select using (auth.role() in ('authenticated', 'service_role'));
create policy pfo_insert on public.permit_friction_observations for insert with check (auth.role() in ('authenticated', 'service_role'));
create policy ie_read on public.intel_events for select using (auth.role() = 'service_role');
create policy ie_insert on public.intel_events for insert with check (auth.role() in ('authenticated', 'service_role'));
create policy ioc_read on public.intel_observation_counts for select using (true);
create policy ioc_write on public.intel_observation_counts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
