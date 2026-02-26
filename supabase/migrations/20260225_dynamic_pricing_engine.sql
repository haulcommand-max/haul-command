-- ============================================================================
-- Dynamic Pricing Intelligence Engine
-- Global escort pricing with US/CA anchor, country multipliers, corridor heat
-- ============================================================================

-- ── Country Economic Multipliers ───────────────────────────────────────────
create table if not exists public.pricing_country_multipliers (
    id              uuid primary key default gen_random_uuid(),
    country_code    text not null unique,
    multiplier      numeric(4,2) not null default 1.00,
    reason          text,
    tier            text,          -- tier_a, tier_b, tier_c
    currency_code   text not null default 'USD',
    is_active       boolean default true,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- ── US Regional Baseline Rates ─────────────────────────────────────────────
create table if not exists public.pricing_baseline_rates (
    id              uuid primary key default gen_random_uuid(),
    region_key      text not null,          -- southeast, midwest, northeast, etc.
    rate_type       text not null,          -- pevo, height_pole, day_rate, day_rate_height
    low             numeric(8,2) not null,
    high            numeric(8,2) not null,
    unit            text not null default 'per_mile',  -- per_mile, per_day
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique(region_key, rate_type)
);

-- ── Corridor Heat Bands ────────────────────────────────────────────────────
create table if not exists public.pricing_heat_bands (
    id              uuid primary key default gen_random_uuid(),
    band_name       text not null unique,   -- cold, balanced, warm, hot, critical
    multiplier      numeric(4,2) not null,
    min_liquidity   numeric(5,2),           -- corridor liquidity score threshold
    max_liquidity   numeric(5,2),
    color           text,
    created_at      timestamptz default now()
);

-- ── Complexity Modifiers ───────────────────────────────────────────────────
create table if not exists public.pricing_complexity_modifiers (
    id              uuid primary key default gen_random_uuid(),
    modifier_key    text not null unique,   -- height_pole, superload, night_move, etc.
    multiplier      numeric(4,2) not null,
    label           text,
    created_at      timestamptz default now()
);

-- ── Price Recommendations Log (for learning loop) ──────────────────────────
create table if not exists public.pricing_recommendations (
    id                  uuid primary key default gen_random_uuid(),
    load_id             uuid,
    corridor_slug       text,
    country_code        text not null,
    region_key          text,
    rate_type           text not null,
    base_rate_low       numeric(8,2),
    base_rate_high      numeric(8,2),
    country_multiplier  numeric(4,2),
    heat_multiplier     numeric(4,2),
    complexity_mods     jsonb default '[]',
    recommended_low     numeric(8,2) not null,
    recommended_high    numeric(8,2) not null,
    final_price         numeric(8,2),         -- actual accepted price (filled post-job)
    price_band          text,                 -- great_deal, fair_market, premium, overpriced
    fill_time_minutes   integer,
    created_at          timestamptz default now()
);

create index if not exists pricing_recs_country_idx on public.pricing_recommendations (country_code, created_at desc);
create index if not exists pricing_recs_corridor_idx on public.pricing_recommendations (corridor_slug, created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.pricing_country_multipliers enable row level security;
alter table public.pricing_baseline_rates enable row level security;
alter table public.pricing_heat_bands enable row level security;
alter table public.pricing_complexity_modifiers enable row level security;
alter table public.pricing_recommendations enable row level security;

create policy pcm_read on public.pricing_country_multipliers for select using (true);
create policy pcm_write on public.pricing_country_multipliers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy pbr_read on public.pricing_baseline_rates for select using (true);
create policy pbr_write on public.pricing_baseline_rates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy phb_read on public.pricing_heat_bands for select using (true);
create policy phb_write on public.pricing_heat_bands for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy pcmod_read on public.pricing_complexity_modifiers for select using (true);
create policy pcmod_write on public.pricing_complexity_modifiers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy prec_read on public.pricing_recommendations for select using (auth.role() = 'service_role' or auth.role() = 'authenticated');
create policy prec_write on public.pricing_recommendations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ── SEED: Country Multipliers ──────────────────────────────────────────────
insert into public.pricing_country_multipliers (country_code, multiplier, reason, tier, currency_code) values
('US', 1.00, 'Baseline anchor market',           'home',   'USD'),
('CA', 0.98, 'Near-parity with US',              'home',   'CAD'),
('AU', 1.18, 'High labor + mining demand',        'tier_a', 'AUD'),
('GB', 1.12, 'Mature abnormal-load market',       'tier_a', 'GBP'),
('NZ', 1.15, 'Small but specialized market',      'tier_a', 'NZD'),
('SE', 1.20, 'High-cost Nordic logistics',        'tier_b', 'SEK'),
('NO', 1.28, 'Very high labor + energy sector',   'tier_b', 'NOK'),
('AE', 1.10, 'High-value project cargo',          'tier_b', 'AED'),
('SA', 1.05, 'Growing but price-sensitive',       'tier_c', 'SAR'),
('DE', 1.14, 'Strict compliance + strong freight', 'tier_c', 'EUR'),
('ZA', 0.82, 'Lower labor costs',                 'tier_c', 'ZAR')
on conflict (country_code) do nothing;

-- ── SEED: US Regional Baselines (per mile) ─────────────────────────────────
insert into public.pricing_baseline_rates (region_key, rate_type, low, high, unit) values
('southeast',       'pevo',              1.65, 1.85, 'per_mile'),
('midwest',         'pevo',              1.75, 1.95, 'per_mile'),
('northeast',       'pevo',              1.80, 2.00, 'per_mile'),
('southwest',       'pevo',              1.85, 2.00, 'per_mile'),
('west_coast',      'pevo',              2.00, 2.25, 'per_mile'),
('southeast',       'height_pole',       1.90, 2.20, 'per_mile'),
('midwest',         'height_pole',       2.00, 2.50, 'per_mile'),
('northeast',       'height_pole',       2.00, 2.50, 'per_mile'),
('west_coast',      'height_pole',       2.25, 2.75, 'per_mile'),
('national',        'day_rate',        450.00, 650.00, 'per_day'),
('national',        'day_rate_height', 550.00, 800.00, 'per_day')
on conflict (region_key, rate_type) do nothing;

-- ── SEED: Heat Bands ───────────────────────────────────────────────────────
insert into public.pricing_heat_bands (band_name, multiplier, min_liquidity, max_liquidity, color) values
('cold',      0.95, 75,  100, '#3b82f6'),
('balanced',  1.00, 40,  74,  '#22c55e'),
('warm',      1.08, 25,  39,  '#f59e0b'),
('hot',       1.18, 10,  24,  '#f97316'),
('critical',  1.32,  0,   9,  '#ef4444')
on conflict (band_name) do nothing;

-- ── SEED: Complexity Modifiers ─────────────────────────────────────────────
insert into public.pricing_complexity_modifiers (modifier_key, multiplier, label) values
('height_pole',    1.18, 'Height pole required'),
('superload',      1.35, 'Superload / special movement'),
('night_move',     1.12, 'Night move'),
('urban_heavy',    1.15, 'Urban / heavy metro'),
('multi_day',      1.08, 'Multi-day assignment'),
('police_required', 1.10, 'Police escort required')
on conflict (modifier_key) do nothing;
