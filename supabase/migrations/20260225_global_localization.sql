-- ============================================================================
-- Global Localization Intelligence + Holiday Restrictions + Heat Model
-- Enables: regulation resolution, travel restriction enforcement,
--          thin-page protection, and global expansion prioritization
-- ============================================================================

-- ── Country Localization Profiles ──────────────────────────────────────────
create table if not exists public.country_localization (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null unique,
    country_name            text not null,
    primary_language        text not null,
    secondary_languages     text[] default '{}',
    currency_code           text not null,
    currency_symbol         text not null,
    measurement_system      text not null default 'metric',  -- metric, imperial
    driving_side            text not null default 'right',   -- left, right
    weekend_definition      text default 'sat_sun',          -- sat_sun, fri_sat, etc.
    major_religious_calendar text,
    public_holiday_source   text,
    cultural_risk_notes     text,
    timezone_primary        text,
    date_format             text default 'YYYY-MM-DD',
    phone_prefix            text,
    last_verified_at        timestamptz default now(),
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

-- ── Holiday & Travel Restrictions ──────────────────────────────────────────
create table if not exists public.holiday_restrictions (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null,
    region_code             text,           -- nullable = national scope
    holiday_name            text not null,
    start_date              date not null,
    end_date                date not null,
    oversize_travel_allowed boolean default false,
    restriction_notes       text,
    source_url              text,
    confidence_score        numeric(4,3) default 0.700,
    is_recurring            boolean default true,
    last_verified_at        timestamptz default now(),
    created_at              timestamptz default now()
);

create index if not exists hr_country_date_idx on public.holiday_restrictions (country_code, start_date, end_date);
create index if not exists hr_region_idx on public.holiday_restrictions (country_code, region_code);

-- ── Regulation Rules (cascading resolution) ────────────────────────────────
create table if not exists public.regulation_rules (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null,
    region_code             text,           -- null = country-level default
    rule_type               text not null,  -- escort_req, permit_req, dimension_limit, travel_window, etc.
    rule_key                text not null,   -- max_width, max_height, escort_count_min, etc.
    rule_value              text not null,
    rule_unit               text,            -- feet, meters, hours, etc.
    applies_to              text,            -- all, oversize, superload, height_pole
    source_url              text,
    confidence_score        numeric(4,3) default 0.700,
    disclaimer              text default 'Always verify with local authority.',
    last_verified_at        timestamptz default now(),
    created_at              timestamptz default now(),
    updated_at              timestamptz default now(),
    unique(country_code, region_code, rule_type, rule_key)
);

create index if not exists rr_lookup_idx on public.regulation_rules (country_code, region_code, rule_type);

-- ── Regulation Resolution Log ──────────────────────────────────────────────
create table if not exists public.regulation_resolution_log (
    id                  uuid primary key default gen_random_uuid(),
    user_country        text,
    user_region         text,
    resolved_country    text not null,
    resolved_region     text,
    rule_type           text not null,
    rule_found          boolean not null,
    resolution_level    text not null,    -- region, country, fallback
    confidence          numeric(4,3),
    created_at          timestamptz default now()
);

create index if not exists rrl_country_idx on public.regulation_resolution_log (resolved_country, created_at desc);

-- ── Global Heat Model Scores ───────────────────────────────────────────────
create table if not exists public.global_heat_scores (
    id                          uuid primary key default gen_random_uuid(),
    country_code                text not null,
    region_code                 text,              -- null = country level
    -- Component scores (0-10 each)
    freight_intensity           numeric(5,2) default 0,
    escort_requirement_prob     numeric(5,2) default 0,
    regulatory_friction         numeric(5,2) default 0,
    digital_adoption            numeric(5,2) default 0,
    competition_weakness        numeric(5,2) default 0,
    cross_border_activity       numeric(5,2) default 0,
    port_heavy_haul             numeric(5,2) default 0,
    -- Composite (weighted)
    global_priority_score       numeric(5,2) not null,
    -- Tier outputs
    seo_priority_tier           text,               -- tier_1, tier_2, tier_3, monitor_only
    monetization_priority_tier  text,
    supply_risk_level           text,               -- low, medium, high, critical
    recommended_activation      text,               -- phase_1, phase_2, phase_3, monitor
    -- Timestamps
    computed_at                 timestamptz default now(),
    updated_at                  timestamptz default now(),
    unique(country_code, region_code)
);

create index if not exists ghs_score_idx on public.global_heat_scores (global_priority_score desc);
create index if not exists ghs_tier_idx on public.global_heat_scores (seo_priority_tier);

-- ── SEO Page Quality Scores (thin-page protection) ─────────────────────────
create table if not exists public.seo_page_quality (
    id                  uuid primary key default gen_random_uuid(),
    page_path           text not null unique,
    country_code        text,
    region_code         text,
    -- Quality signals
    data_point_count    integer default 0,
    entity_depth        integer default 0,
    unique_content_score integer default 0,
    regulation_present  boolean default false,
    supply_present      boolean default false,
    demand_present      boolean default false,
    -- Computed
    should_index        boolean not null default false,
    index_reason        text,              -- auto_indexed, auto_noindexed, manual_override
    -- Timestamps
    last_evaluated_at   timestamptz default now(),
    created_at          timestamptz default now()
);

create index if not exists spq_index_idx on public.seo_page_quality (should_index, country_code);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.country_localization enable row level security;
alter table public.holiday_restrictions enable row level security;
alter table public.regulation_rules enable row level security;
alter table public.regulation_resolution_log enable row level security;
alter table public.global_heat_scores enable row level security;
alter table public.seo_page_quality enable row level security;

create policy cl_read on public.country_localization for select using (true);
create policy cl_write on public.country_localization for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy hr_read on public.holiday_restrictions for select using (true);
create policy hr_write on public.holiday_restrictions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy rr_read on public.regulation_rules for select using (true);
create policy rr_write on public.regulation_rules for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy rrl_read on public.regulation_resolution_log for select using (auth.role() = 'service_role');
create policy rrl_write on public.regulation_resolution_log for insert with check (auth.role() in ('authenticated', 'service_role'));
create policy ghs_read on public.global_heat_scores for select using (true);
create policy ghs_write on public.global_heat_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy spq_read on public.seo_page_quality for select using (auth.role() in ('authenticated', 'service_role'));
create policy spq_write on public.seo_page_quality for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ── SEED: Country Localization Profiles ────────────────────────────────────
insert into public.country_localization
    (country_code, country_name, primary_language, secondary_languages, currency_code, currency_symbol,
     measurement_system, driving_side, weekend_definition, timezone_primary, phone_prefix) values
('US', 'United States',      'en', '{"es"}',          'USD', '$',   'imperial', 'right', 'sat_sun',  'America/New_York',     '+1'),
('CA', 'Canada',             'en', '{"fr"}',          'CAD', 'C$',  'metric',   'right', 'sat_sun',  'America/Toronto',      '+1'),
('AU', 'Australia',          'en', '{}',              'AUD', 'A$',  'metric',   'left',  'sat_sun',  'Australia/Sydney',     '+61'),
('GB', 'United Kingdom',     'en', '{"cy","gd"}',    'GBP', '£',   'imperial', 'left',  'sat_sun',  'Europe/London',        '+44'),
('NZ', 'New Zealand',        'en', '{"mi"}',         'NZD', 'NZ$', 'metric',   'left',  'sat_sun',  'Pacific/Auckland',     '+64'),
('SE', 'Sweden',             'sv', '{"en"}',         'SEK', 'kr',  'metric',   'right', 'sat_sun',  'Europe/Stockholm',     '+46'),
('NO', 'Norway',             'no', '{"en","nn"}',    'NOK', 'kr',  'metric',   'right', 'sat_sun',  'Europe/Oslo',          '+47'),
('AE', 'United Arab Emirates','ar','{"en"}',         'AED', 'د.إ', 'metric',   'right', 'fri_sat',  'Asia/Dubai',           '+971'),
('SA', 'Saudi Arabia',       'ar', '{"en"}',         'SAR', '﷼',  'metric',   'right', 'fri_sat',  'Asia/Riyadh',          '+966'),
('DE', 'Germany',            'de', '{"en"}',         'EUR', '€',   'metric',   'right', 'sat_sun',  'Europe/Berlin',        '+49'),
('ZA', 'South Africa',       'en', '{"af","zu","xh"}','ZAR','R',   'metric',   'left',  'sat_sun',  'Africa/Johannesburg',  '+27')
on conflict (country_code) do nothing;

-- ── SEED: Global Heat Scores (bootstrapped from readiness data) ────────────
insert into public.global_heat_scores
    (country_code, region_code, freight_intensity, escort_requirement_prob, regulatory_friction,
     digital_adoption, competition_weakness, cross_border_activity, port_heavy_haul,
     global_priority_score, seo_priority_tier, monetization_priority_tier, supply_risk_level,
     recommended_activation) values
('US', null,  9.5, 9.0, 7.0, 9.5, 3.0, 7.0, 8.5,  8.14, 'tier_1', 'tier_1', 'medium',   'phase_1'),
('CA', null,  8.0, 8.0, 6.5, 9.0, 5.0, 8.5, 7.0,  7.64, 'tier_1', 'tier_1', 'medium',   'phase_1'),
('AU', null,  8.5, 8.5, 6.0, 8.5, 7.0, 4.0, 7.5,  7.46, 'tier_2', 'tier_2', 'high',     'phase_1'),
('GB', null,  7.5, 7.0, 7.5, 9.0, 5.5, 7.0, 6.5,  7.21, 'tier_2', 'tier_2', 'medium',   'phase_1'),
('NZ', null,  5.5, 6.5, 5.0, 8.0, 8.0, 3.0, 5.0,  5.96, 'tier_3', 'tier_3', 'high',     'phase_2'),
('SE', null,  6.5, 6.0, 5.5, 9.0, 7.5, 6.0, 5.5,  6.64, 'tier_3', 'tier_2', 'high',     'phase_2'),
('NO', null,  7.0, 6.5, 5.5, 9.0, 7.5, 5.5, 7.0,  6.96, 'tier_2', 'tier_2', 'high',     'phase_2'),
('AE', null,  7.5, 5.0, 4.0, 8.5, 8.5, 6.0, 8.0,  6.86, 'tier_2', 'tier_2', 'critical', 'phase_2'),
('SA', null,  7.0, 4.5, 3.5, 6.5, 9.0, 4.5, 6.5,  6.14, 'tier_3', 'tier_3', 'critical', 'phase_3'),
('DE', null,  8.0, 7.0, 8.0, 9.0, 6.0, 8.0, 6.5,  7.61, 'tier_1', 'tier_2', 'medium',   'phase_1'),
('ZA', null,  6.0, 5.0, 4.0, 5.5, 8.5, 3.5, 5.5,  5.54, 'tier_3', 'tier_3', 'critical', 'phase_3')
on conflict (country_code, region_code) do nothing;
