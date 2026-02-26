-- ============================================================================
-- Global Infrastructure: Escort Licensing + Corridor Intelligence
-- Run AFTER 20260225_global_concepts.sql
-- ============================================================================

-- ── Escort Licensing Requirements (per country) ────────────────────────────
create table if not exists public.escort_licensing (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null,
    licensing_model         text not null,        -- state_based_accreditation, national_framework, etc.
    typical_requirement     text,
    complexity              text default 'medium', -- low, medium, medium_high, high
    automation_readiness    text default 'medium', -- low, low_medium, medium, high
    training_required       boolean default true,
    license_url             text,
    notes                   text,
    last_verified_at        timestamptz,
    created_at              timestamptz default now(),
    updated_at              timestamptz default now(),
    unique(country_code)
);

-- ── Corridor Intelligence ──────────────────────────────────────────────────
create table if not exists public.global_corridors (
    id                      uuid primary key default gen_random_uuid(),
    country_code            text not null,
    corridor_name           text not null,
    corridor_type           text,                -- mining, wind, port, energy, industrial, mega_project
    start_point             text,
    end_point               text,
    lat_start               numeric(9,6),
    lon_start               numeric(9,6),
    lat_end                 numeric(9,6),
    lon_end                 numeric(9,6),
    corridor_score          numeric(5,2) default 0,
    port_proximity_score    numeric(3,2) default 0,
    energy_density_score    numeric(3,2) default 0,
    mining_density_score    numeric(3,2) default 0,
    wind_project_score      numeric(3,2) default 0,
    infrastructure_score    numeric(3,2) default 0,
    escort_demand_estimate  text,                -- low, medium, high, very_high
    is_active               boolean default false,
    created_at              timestamptz default now(),
    updated_at              timestamptz default now()
);

create index if not exists global_corridors_country_idx on public.global_corridors (country_code);
create index if not exists global_corridors_type_idx on public.global_corridors (corridor_type);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.escort_licensing enable row level security;
alter table public.global_corridors enable row level security;

create policy escort_licensing_read on public.escort_licensing for select using (true);
create policy escort_licensing_write on public.escort_licensing for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy global_corridors_read on public.global_corridors for select using (true);
create policy global_corridors_write on public.global_corridors for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ── Seed escort licensing ──────────────────────────────────────────────────
insert into public.escort_licensing (country_code, licensing_model, typical_requirement, complexity, automation_readiness, notes) values
('US', 'state_based_licensing', 'state pilot vehicle certification', 'medium', 'high', 'Varies by state. Most require training course + certification.'),
('CA', 'provincial_certification', 'provincial escort vehicle operator', 'medium', 'high', 'Province-specific. Alberta, Ontario, BC have strongest programs.'),
('AU', 'state_based_accreditation', 'certified pilot vehicle driver', 'medium', 'high', 'State-level. WA, QLD, NSW most active. NHVR national standards emerging.'),
('GB', 'police_notification_plus_private', 'abnormal load escort training', 'medium_high', 'high', 'Police notification mandatory. Private escorts for most moves. STGO framework.'),
('NZ', 'national_framework', 'pilot vehicle certification', 'medium', 'high', 'NZTA national framework. Clear, structured market.'),
('SE', 'regulated_transport_escort', 'certified transport escort', 'medium_high', 'medium', 'Trafikverket regulated. Forestry + wind are primary demand drivers.'),
('NO', 'regulated_special_transport', 'escort vehicle authorization', 'medium_high', 'medium', 'Statens vegvesen oversight. Mountainous corridors add complexity.'),
('DE', 'bf3_bf4_certification', 'federal escort certification (BF3/BF4)', 'high', 'medium', 'Very strict. BF3 = private escort, BF4 = administrative. §29 StVO governs.'),
('AE', 'emirate_specific', 'police or authority coordination', 'high', 'low_medium', 'RTA Dubai primary. Emirate-level variance. Relationship-driven approvals.'),
('SA', 'project_authority_driven', 'government or contractor approval', 'high', 'low', 'Giga-project demand rising. Approval pathways less standardized.'),
('ZA', 'provincial_variation', 'abnormal load escort compliance', 'medium', 'medium', 'SANRAL framework. Mining corridors are primary demand. Provincial variation exists.')
on conflict (country_code) do nothing;

-- ── Updated_at triggers ────────────────────────────────────────────────────
drop trigger if exists trg_escort_licensing_updated on public.escort_licensing;
create trigger trg_escort_licensing_updated
before update on public.escort_licensing
for each row execute function public.set_updated_at();

drop trigger if exists trg_global_corridors_updated on public.global_corridors;
create trigger trg_global_corridors_updated
before update on public.global_corridors
for each row execute function public.set_updated_at();
