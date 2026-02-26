-- ============================================================================
-- Pricing Experiments Engine + AdGrid Global Expansion + Revenue Intelligence
-- ============================================================================

-- ── PRICING EXPERIMENTS ────────────────────────────────────────────────────

create table if not exists public.pricing_experiments (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    experiment_type text not null,    -- price_point_ab, feature_bundle, free_trial_length,
                                      -- paywall_position, surge_multiplier, regional_discount
    country_code    text not null,
    status          text default 'draft',  -- draft, running, paused, concluded
    -- Variants
    control_config  jsonb not null default '{}',
    variant_config  jsonb not null default '{}',
    traffic_split   integer[] default '{50,50}',
    -- Guardrails
    floor_price_usd numeric,
    liquidity_gate  boolean default true,  -- pause if liquidity drops
    -- Results
    winner          text,  -- control, variant, inconclusive
    metrics         jsonb default '{}',     -- {revenue_per_user, conversion_rate, retention_30d, ...}
    probability_of_best numeric,
    revenue_lift_pct    numeric,
    -- Rollout
    rollout_stage   text default 'none',   -- none, 10_pct, 25_pct, 50_pct, 100_pct
    -- Auto-safety
    auto_paused_at  timestamptz,
    auto_pause_reason text,
    -- Meta
    created_at      timestamptz default now(),
    started_at      timestamptz,
    concluded_at    timestamptz,
    created_by      uuid
);

create index if not exists pe_country_idx on public.pricing_experiments (country_code, status);
create index if not exists pe_status_idx on public.pricing_experiments (status);

-- Experiment assignments (which user sees which variant)
create table if not exists public.experiment_assignments (
    id              uuid primary key default gen_random_uuid(),
    experiment_id   uuid references public.pricing_experiments(id),
    profile_id      uuid not null,
    variant         text not null,   -- control, variant
    assigned_at     timestamptz default now(),
    unique(experiment_id, profile_id)
);

create index if not exists ea_experiment_idx on public.experiment_assignments (experiment_id);
create index if not exists ea_profile_idx on public.experiment_assignments (profile_id);

-- Experiment events (conversions, revenue, etc.)
create table if not exists public.experiment_events (
    id              uuid primary key default gen_random_uuid(),
    experiment_id   uuid references public.pricing_experiments(id),
    profile_id      uuid not null,
    variant         text not null,
    event_type      text not null,   -- impression, conversion, revenue, churn, fill_event
    value           numeric,
    metadata        jsonb default '{}',
    created_at      timestamptz default now()
);

create index if not exists ee_experiment_idx on public.experiment_events (experiment_id, event_type, created_at desc);

-- ── ADGRID GLOBAL EXPANSION ───────────────────────────────────────────────

-- AdGrid pricing matrix (per-country floor + multiplier)
create table if not exists public.adgrid_pricing_matrix (
    id              uuid primary key default gen_random_uuid(),
    country_code    text not null unique,
    currency        text not null default 'USD',
    base_cpm_usd    numeric not null default 22.00,
    base_cpc_usd    numeric not null default 4.50,
    multiplier      numeric not null default 1.0,
    floor_price_usd numeric not null default 0.80,
    surge_enabled   boolean default true,
    vat_rate        numeric default 0.0,
    ad_maturity     text default 'emerging',  -- high, medium, emerging
    last_updated_at timestamptz default now()
);

-- Seed pricing matrix for all 11 markets
insert into public.adgrid_pricing_matrix (country_code, currency, base_cpm_usd, base_cpc_usd, multiplier, floor_price_usd, vat_rate, ad_maturity) values
    ('US', 'USD', 22.00, 4.50, 1.00, 0.80, 0.0,   'high'),
    ('CA', 'CAD', 22.00, 4.50, 1.00, 0.80, 0.13,  'high'),
    ('AU', 'AUD', 22.00, 4.50, 1.00, 0.80, 0.10,  'high'),
    ('GB', 'GBP', 22.00, 4.50, 0.95, 0.80, 0.20,  'high'),
    ('NZ', 'NZD', 22.00, 4.50, 0.85, 0.60, 0.15,  'medium'),
    ('SE', 'SEK', 22.00, 4.50, 0.90, 0.80, 0.25,  'high'),
    ('NO', 'NOK', 22.00, 4.50, 0.95, 0.80, 0.25,  'high'),
    ('AE', 'AED', 22.00, 4.50, 1.05, 0.80, 0.05,  'high'),
    ('SA', 'SAR', 22.00, 4.50, 0.80, 0.40, 0.15,  'emerging'),
    ('DE', 'EUR', 22.00, 4.50, 0.90, 0.80, 0.19,  'high'),
    ('ZA', 'ZAR', 22.00, 4.50, 0.70, 0.40, 0.15,  'emerging')
on conflict (country_code) do nothing;

-- Revenue leak monitors
create table if not exists public.revenue_leak_alerts (
    id              uuid primary key default gen_random_uuid(),
    alert_type      text not null,   -- underpriced_corridor, high_traffic_low_yield,
                                      -- strong_usage_low_conversion, high_demand_low_supply
    country_code    text not null,
    region_code     text,
    corridor_slug   text,
    severity        text default 'medium',  -- low, medium, high, critical
    details         jsonb default '{}',
    recommended_action text,
    status          text default 'open',    -- open, acknowledged, acted, dismissed
    created_at      timestamptz default now(),
    resolved_at     timestamptz
);

create index if not exists rla_status_idx on public.revenue_leak_alerts (status, severity, created_at desc);
create index if not exists rla_country_idx on public.revenue_leak_alerts (country_code, alert_type);

-- Liquidity health snapshots (for protection engine)
create table if not exists public.liquidity_snapshots (
    id              uuid primary key default gen_random_uuid(),
    country_code    text not null,
    region_code     text,
    corridor_slug   text,
    fill_rate       numeric,           -- 0-1
    time_to_first_accept_sec numeric,
    escort_accept_rate numeric,        -- 0-1
    active_supply_ratio numeric,       -- active/total
    liquidity_status text default 'stable',  -- strong, stable, warning, critical
    protection_factor numeric default 1.0,   -- 0.85 = weak, 1.0 = stable, 1.05 = strong
    snapshot_at     timestamptz default now()
);

create index if not exists ls_country_idx on public.liquidity_snapshots (country_code, snapshot_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.pricing_experiments enable row level security;
alter table public.experiment_assignments enable row level security;
alter table public.experiment_events enable row level security;
alter table public.adgrid_pricing_matrix enable row level security;
alter table public.revenue_leak_alerts enable row level security;
alter table public.liquidity_snapshots enable row level security;

-- Service role access for all
create policy pe_sr on public.pricing_experiments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy ea_sr on public.experiment_assignments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy ee_sr on public.experiment_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy apm_read on public.adgrid_pricing_matrix for select using (true);
create policy apm_write on public.adgrid_pricing_matrix for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy rla_sr on public.revenue_leak_alerts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy ls_read on public.liquidity_snapshots for select using (true);
create policy ls_write on public.liquidity_snapshots for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Authenticated users can see their own experiment assignments
create policy ea_own on public.experiment_assignments for select using (auth.uid() = profile_id);
