-- ============================================================
-- GROWTH ENGINE — SAVED SEARCHES, REFERRALS, APP BANNER CONFIG
-- Spec: HCOS-GROWTH-PLAY-01 / Phase 0 + 1
-- ============================================================
begin;

-- ────────────────────────────────────────────────────────────
-- 1) SAVED SEARCHES + JOB ALERTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.saved_searches (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    search_type     text not null default 'load',           -- load, operator, corridor
    label           text null,                               -- user's name for this search

    -- Search params
    filters         jsonb not null default '{}',             -- full search state
    geo_center_lat  float8 null,
    geo_center_lon  float8 null,
    radius_km       int null,
    country_code    text null,
    admin1_code     text null,

    -- Alert config
    alert_enabled   boolean not null default true,
    alert_channel   text not null default 'push',            -- push, email, both
    alert_frequency text not null default 'instant',         -- instant, daily_digest, weekly_digest
    quiet_hours     jsonb null,                              -- { start: "22:00", end: "07:00", tz: "US/Eastern" }

    -- Tracking
    last_matched_at timestamptz null,
    match_count     int not null default 0,
    last_notified_at timestamptz null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists saved_searches_user_idx  on public.saved_searches(user_id);
create index if not exists saved_searches_alert_idx on public.saved_searches(alert_enabled, alert_frequency)
    where alert_enabled = true;
create index if not exists saved_searches_country_idx on public.saved_searches(country_code);

alter table public.saved_searches enable row level security;

create policy "users_manage_own_saved_searches"
    on public.saved_searches for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 2) REFERRAL ENGINE
-- ────────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    code          text not null unique,                    -- HC-JOHN-12AB
    country_code  text null,
    persona       text null,                               -- operator, broker, dispatcher
    is_active     boolean not null default true,
    total_uses    int not null default 0,
    max_uses      int null,                                -- null = unlimited
    created_at    timestamptz not null default now(),
    unique(user_id)                                        -- one code per user
);

create table if not exists public.referral_events (
    id              uuid primary key default gen_random_uuid(),
    referrer_id     uuid not null references auth.users(id),
    referred_id     uuid not null references auth.users(id),
    code_used       text not null,
    country_code    text null,

    -- Lifecycle
    status          text not null default 'signed_up',     -- signed_up, activated, reward_eligible, reward_issued
    activated_action text null,                             -- what the referred user did to activate
    
    -- Rewards
    referrer_reward_type  text null,                        -- profile_boost, lead_credits, badge, cash
    referrer_reward_value jsonb null,
    referred_reward_type  text null,
    referred_reward_value jsonb null,
    
    activated_at    timestamptz null,
    rewarded_at     timestamptz null,
    created_at      timestamptz not null default now(),
    unique(referred_id)                                    -- each user can only be referred once
);

create index if not exists referral_events_referrer_idx on public.referral_events(referrer_id);
create index if not exists referral_events_code_idx     on public.referral_events(code_used);
create index if not exists referral_events_status_idx   on public.referral_events(status);

alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;

-- Users read their own code
create policy "users_read_own_referral_code"
    on public.referral_codes for select
    using (auth.uid() = user_id);

-- Code lookup is public (for the referral flow)
create policy "public_lookup_referral_codes"
    on public.referral_codes for select
    using (is_active = true);

-- Users read their own referral events
create policy "users_read_own_referrals"
    on public.referral_events for select
    using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- System/admin inserts referral events
create policy "admin_manage_referral_events"
    on public.referral_events for all
    using (public.is_admin())
    with check (public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 3) EXTEND country_configs FOR APP STORE LINKS
-- ────────────────────────────────────────────────────────────
alter table if exists public.country_configs
    add column if not exists app_store_url     text null,
    add column if not exists play_store_url    text null,
    add column if not exists smart_banner_text text null default 'Get the Haul Command App',
    add column if not exists smart_banner_cta  text null default 'Open';

-- ────────────────────────────────────────────────────────────
-- 4) EXTEND feature flags FOR COUNTRY GATING
-- ────────────────────────────────────────────────────────────
alter table if exists public.hc_feature_flags
    add column if not exists country_codes text[] null,    -- null = all countries
    add column if not exists persona_ids   text[] null;    -- null = all personas

commit;
