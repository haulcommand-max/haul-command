-- ============================================================
-- GLOBAL PR AUTHORITY ENGINE — SCHEMA
-- Spec: AG-MKT-PR-52-GLOBAL-001
-- Tables: journalist requests, outlets, responses, spokespeople,
--         backlink tracking, partnership targets
-- ============================================================
begin;

-- ────────────────────────────────────────────────────────────
-- 1) PR OUTLETS (journalist/publication registry)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pr_outlets (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    domain          text null,
    country_iso2    text null,
    outlet_type     text not null default 'trade_press',    -- trade_press, news, blog, broadcast, podcast
    domain_authority_estimate int null,                      -- 0-100 rough DA
    audience_reach  text null,                               -- small, medium, large, major
    beat_tags       text[] null,                              -- logistics, heavy_haul, compliance, etc.
    primary_contact_name  text null,
    primary_contact_email text null,
    notes           text null,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique(domain)
);

create index if not exists pr_outlets_country_idx on public.pr_outlets(country_iso2);
create index if not exists pr_outlets_type_idx    on public.pr_outlets(outlet_type);
create index if not exists pr_outlets_active_idx  on public.pr_outlets(is_active);

-- ────────────────────────────────────────────────────────────
-- 2) PR JOURNALIST REQUESTS (HARO / Qwoted / inbound)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pr_journalist_requests (
    id                  uuid primary key default gen_random_uuid(),
    source_channel      text not null,                      -- featured_haro, qwoted, sourcebottle, x_journorequest, direct, manual
    outlet_id           uuid null references public.pr_outlets(id) on delete set null,
    country_iso2        text null,
    topic_tags          text[] null,
    deadline_at         timestamptz null,

    journalist_name     text null,
    outlet_name         text null,
    outlet_domain       text null,
    request_text        text not null,
    response_requirements text null,

    -- Classification
    matched_report_id   text null,                          -- RPT-ESCORT-RATE-INDEX etc
    matched_dataset     text null,
    relevance_score     numeric null,                       -- 0-1

    -- Workflow
    status              text not null default 'new',        -- new, reviewing, assigned, responded, published, expired, declined
    assigned_to         uuid null references auth.users(id) on delete set null,
    responded_at        timestamptz null,
    outcome             text null,                          -- published, not_used, unknown

    -- Ingest metadata
    raw_payload         jsonb null,
    ingested_at         timestamptz not null default now(),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists pr_requests_status_idx   on public.pr_journalist_requests(status);
create index if not exists pr_requests_country_idx  on public.pr_journalist_requests(country_iso2);
create index if not exists pr_requests_channel_idx  on public.pr_journalist_requests(source_channel);
create index if not exists pr_requests_deadline_idx on public.pr_journalist_requests(deadline_at);
create index if not exists pr_requests_tags_idx     on public.pr_journalist_requests using gin(topic_tags);

-- ────────────────────────────────────────────────────────────
-- 3) PR SPOKESPEOPLE (verified operators who can give quotes)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pr_spokespeople (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    display_name    text not null,
    title           text null,                               -- e.g. "Owner, ABC Escorts"
    company_name    text null,
    country_iso2    text null,
    timezone        text null,
    expertise_tags  text[] null,                              -- corridor_knowledge, compliance, safety, rates
    bio             text null,
    headshot_url    text null,
    is_active       boolean not null default true,
    response_count  int not null default 0,
    last_response_at timestamptz null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique(user_id)
);

create index if not exists pr_spokespeople_country_idx on public.pr_spokespeople(country_iso2);
create index if not exists pr_spokespeople_active_idx  on public.pr_spokespeople(is_active);
create index if not exists pr_spokespeople_tags_idx    on public.pr_spokespeople using gin(expertise_tags);

-- ────────────────────────────────────────────────────────────
-- 4) PR RESPONSES (quotes / analyses sent to journalists)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pr_responses (
    id              uuid primary key default gen_random_uuid(),
    request_id      uuid not null references public.pr_journalist_requests(id) on delete cascade,
    spokesperson_id uuid null references public.pr_spokespeople(id) on delete set null,
    template_id     text null,                               -- PR-TPL-QUOTE-001, PR-TPL-ANALYSIS-001
    response_text   text not null,
    citation_urls   text[] null,
    data_points     jsonb null,                              -- structured stats included
    sent_via        text not null default 'email',           -- email, platform, manual
    sent_at         timestamptz null,
    outcome         text null,                               -- pending, published, not_used
    published_url   text null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists pr_responses_request_idx on public.pr_responses(request_id);
create index if not exists pr_responses_outcome_idx on public.pr_responses(outcome);

-- ────────────────────────────────────────────────────────────
-- 5) PR BACKLINK HITS (earned media tracking)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pr_backlink_hits (
    id              uuid primary key default gen_random_uuid(),
    response_id     uuid null references public.pr_responses(id) on delete set null,
    outlet_id       uuid null references public.pr_outlets(id) on delete set null,
    source_url      text not null,
    target_url      text not null,
    anchor_text     text null,
    is_dofollow     boolean null,
    domain_authority int null,
    discovered_at   timestamptz not null default now(),
    country_iso2    text null,
    verified        boolean not null default false,
    created_at      timestamptz not null default now(),
    unique(source_url, target_url)
);

create index if not exists pr_backlinks_outlet_idx   on public.pr_backlink_hits(outlet_id);
create index if not exists pr_backlinks_country_idx  on public.pr_backlink_hits(country_iso2);
create index if not exists pr_backlinks_discovered_idx on public.pr_backlink_hits(discovered_at desc);

-- ────────────────────────────────────────────────────────────
-- 6) PR PARTNERSHIP TARGETS (chambers, associations, ports)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pr_partnership_targets (
    id                uuid primary key default gen_random_uuid(),
    target_type       text not null,                         -- chamber, association, port_authority, registry, trade_body
    target_name       text not null,
    target_url        text null,
    country_iso2      text not null,
    admin1_code       text null,
    city              text null,
    contact_email     text null,
    contact_name      text null,
    listing_url       text null,                             -- their listing of us, if acquired
    backlink_url      text null,                             -- reciprocal link they gave us

    -- Workflow
    status            text not null default 'identified',    -- identified, contacted, negotiating, acquired, declined, expired
    last_contacted_at timestamptz null,
    outcome_notes     text null,
    priority          int not null default 5,                 -- 1=critical, 10=nice-to-have

    -- Value tracking
    domain_authority  int null,
    estimated_referral_value text null,

    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index if not exists pr_partners_country_idx  on public.pr_partnership_targets(country_iso2);
create index if not exists pr_partners_type_idx     on public.pr_partnership_targets(target_type);
create index if not exists pr_partners_status_idx   on public.pr_partnership_targets(status);
create index if not exists pr_partners_priority_idx on public.pr_partnership_targets(priority);

-- ────────────────────────────────────────────────────────────
-- 7) COMPLIANCE CONFIG (ComplianceBrain country profiles)
-- ────────────────────────────────────────────────────────────
create table if not exists public.compliance_country_profiles (
    id                  uuid primary key default gen_random_uuid(),
    country_iso2        text not null unique,
    country_name        text not null,
    tier                text not null default 'B',            -- A, B, C, D
    region_group        text not null,                        -- EU_EEA, EFTA, UK_IRE, GCC, LATAM, APAC, AFR, NA
    consent_profile     text not null default 'non_eu_tracking_notice',
    stores_ios          text[] not null default '{"apple_app_store"}',
    stores_android      text[] not null default '{"google_play","samsung_galaxy_store"}',
    data_retention_days int not null default 365,
    requires_gdpr       boolean not null default false,
    requires_att        boolean not null default false,
    locale_default      text null,
    currency_code       text null,
    unit_system         text null,                            -- metric, imperial, mixed
    timezone_default    text null,
    is_active           boolean not null default true,
    config_overrides    jsonb not null default '{}',
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists compliance_country_tier_idx   on public.compliance_country_profiles(tier);
create index if not exists compliance_country_region_idx on public.compliance_country_profiles(region_group);
create index if not exists compliance_country_active_idx on public.compliance_country_profiles(is_active);

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────
alter table public.pr_outlets enable row level security;
alter table public.pr_journalist_requests enable row level security;
alter table public.pr_spokespeople enable row level security;
alter table public.pr_responses enable row level security;
alter table public.pr_backlink_hits enable row level security;
alter table public.pr_partnership_targets enable row level security;
alter table public.compliance_country_profiles enable row level security;

-- Public read for outlets and compliance (non-sensitive)
create policy "public_read_pr_outlets"
    on public.pr_outlets for select using (true);
create policy "public_read_compliance_profiles"
    on public.compliance_country_profiles for select using (true);

-- Spokespeople can read their own record
create policy "spokespeople_read_own"
    on public.pr_spokespeople for select
    using (auth.uid() = user_id);

-- Admin full access on all PR tables
create policy "admin_manage_pr_requests"    on public.pr_journalist_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_manage_pr_outlets"     on public.pr_outlets for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_manage_pr_spokespeople" on public.pr_spokespeople for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_manage_pr_responses"   on public.pr_responses for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_manage_pr_backlinks"   on public.pr_backlink_hits for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_manage_pr_partners"    on public.pr_partnership_targets for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_manage_compliance"     on public.compliance_country_profiles for all using (public.is_admin()) with check (public.is_admin());

commit;
