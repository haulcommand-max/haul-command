-- 20260301_daily_habit_engine.sql
-- Tables for: momentum scoring, search boosts, profile analytics, push queue
-- Powers: Operator Command Center, Profile Strength Meter, Weekly Reports

begin;

-- =========================
-- Operator Momentum Scores
-- =========================

create table if not exists public.operator_momentum (
    user_id uuid primary key references auth.users(id),
    score int not null default 0,                          -- 0-100
    band text not null default 'inactive',                 -- rising|steady|cooling|inactive
    components jsonb not null default '{}'::jsonb,         -- breakdown: profile, response, activity, uptime
    visibility_multiplier numeric(3,1) not null default 1.0,
    computed_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists momentum_band_idx on public.operator_momentum (band);
create index if not exists momentum_score_idx on public.operator_momentum (score desc);

-- =========================
-- Search Rank Boosts (temporary)
-- =========================

create table if not exists public.search_boosts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    boost_type text not null,                              -- availability_toggle|profile_completion|territory_claim
    multiplier numeric(3,1) not null default 1.0,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    unique(user_id, boost_type)
);

create index if not exists boost_user_idx on public.search_boosts (user_id);
create index if not exists boost_expiry_idx on public.search_boosts (expires_at);

-- =========================
-- Profile View Tracking (for broker view notifications)
-- =========================

create table if not exists public.profile_views (
    id uuid primary key default gen_random_uuid(),
    profile_user_id uuid not null references auth.users(id),
    viewer_user_id uuid,                                   -- null for anonymous views
    viewer_role text,                                      -- broker|driver|anonymous
    source text,                                           -- search|directory|corridor_page|load_match
    created_at timestamptz not null default now()
);

create index if not exists pv_profile_idx on public.profile_views (profile_user_id, created_at desc);
create index if not exists pv_viewer_idx on public.profile_views (viewer_user_id);

-- =========================
-- Push Queue (for native push delivery)
-- =========================

create table if not exists public.push_queue (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    title text not null,
    body text not null,
    data jsonb default '{}'::jsonb,
    priority text not null default 'medium',               -- high|medium|low
    status text not null default 'pending',                -- pending|sent|failed
    sent_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists push_pending_idx on public.push_queue (status, created_at) where status = 'pending';
create index if not exists push_user_idx on public.push_queue (user_id);

-- =========================
-- County Territories (for territory gamification)
-- =========================

create table if not exists public.county_territories (
    county_fips text primary key,
    county_name text not null,
    state_code text not null,
    max_slots int not null default 3,
    claimed_slots int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists ct_state_idx on public.county_territories (state_code);

-- =========================
-- Territory Claims
-- =========================

create table if not exists public.territory_claims (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    county_fips text not null references public.county_territories(county_fips),
    county_name text not null,
    state_code text not null,
    status text not null default 'active',                 -- active|expired|released
    claimed_at timestamptz not null default now(),
    streak_start timestamptz not null default now(),
    streak_days int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists tc_user_idx on public.territory_claims (user_id, status);
create index if not exists tc_county_idx on public.territory_claims (county_fips, status);

-- =========================
-- Weekly Report History
-- =========================

create table if not exists public.weekly_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    period text not null,
    report_data jsonb not null,
    sent_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists wr_user_idx on public.weekly_reports (user_id, created_at desc);

-- =========================
-- RLS
-- =========================

alter table public.operator_momentum enable row level security;
alter table public.search_boosts enable row level security;
alter table public.profile_views enable row level security;
alter table public.push_queue enable row level security;
alter table public.county_territories enable row level security;
alter table public.territory_claims enable row level security;
alter table public.weekly_reports enable row level security;

-- Operators can read their own data
create policy "Users can view own momentum" on public.operator_momentum for select using (auth.uid() = user_id);
create policy "Users can view own boosts" on public.search_boosts for select using (auth.uid() = user_id);
create policy "Users can view own profile views" on public.profile_views for select using (auth.uid() = profile_user_id);
create policy "Users can view own push queue" on public.push_queue for select using (auth.uid() = user_id);
create policy "Anyone can view county territories" on public.county_territories for select using (true);
create policy "Users can view own territory claims" on public.territory_claims for select using (auth.uid() = user_id);
create policy "Users can view own weekly reports" on public.weekly_reports for select using (auth.uid() = user_id);

commit;
