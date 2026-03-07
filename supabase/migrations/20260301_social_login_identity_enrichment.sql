-- 20260301_social_login_identity_enrichment.sql
-- Social Login Identity Enrichment: identity graph, provider links, trust bonuses,
-- claim accelerator matching, progressive profiling state

begin;

-- =========================
-- Social Provider Links (identity graph)
-- =========================

create table if not exists public.user_provider_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,                          -- google|facebook|linkedin|email
  provider_user_id text not null,                  -- sub / provider UID
  provider_email text,
  email_verified boolean default false,
  display_name text,
  avatar_url text,                                 -- raw provider URL (for reference only)
  raw_profile jsonb default '{}',                  -- full provider profile snapshot
  trust_bonus numeric(4,2) default 1.00,           -- 1.25 google, 1.20 linkedin, 1.15 facebook
  linked_at timestamptz not null default now(),
  last_login_at timestamptz,
  constraint provider_link_unique unique (provider, provider_user_id)
);

create index if not exists prov_link_user_idx on public.user_provider_links (user_id);
create index if not exists prov_link_provider_idx on public.user_provider_links (provider);
create index if not exists prov_link_email_idx on public.user_provider_links (provider_email);

-- =========================
-- Identity Dedupe Candidates
-- =========================

create table if not exists public.identity_dedupe_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id_a uuid not null,
  user_id_b uuid not null,
  match_type text not null,                        -- email_exact|provider_id|name_city_fuzzy
  confidence numeric(5,4) not null,                -- 0-1
  status text not null default 'pending',          -- pending|merged|rejected|review
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dedupe_status_idx on public.identity_dedupe_candidates (status);

-- =========================
-- Trust Score Social Bonuses
-- =========================

create table if not exists public.trust_score_social_bonuses (
  user_id uuid primary key,
  google_verified boolean default false,
  facebook_verified boolean default false,
  linkedin_verified boolean default false,
  combined_social_multiplier numeric(4,2) default 1.00,  -- max 1.45
  providers_linked int default 0,
  computed_at timestamptz not null default now()
);

-- =========================
-- Claim Flow Matches (listing → social account)
-- =========================

create table if not exists public.claim_flow_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null,                        -- existing unclaimed listing
  match_confidence numeric(5,4) not null,          -- 0-1
  match_inputs jsonb default '{}',                 -- {email, display_name, city}
  status text not null default 'prompted',         -- prompted|claimed|rejected|expired
  prompted_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists claim_match_user_idx on public.claim_flow_matches (user_id);
create index if not exists claim_match_status_idx on public.claim_flow_matches (status);

-- =========================
-- Progressive Profile State
-- =========================

create table if not exists public.user_profile_progress (
  user_id uuid primary key,
  user_role text,                                  -- operator|broker
  completion_score numeric(5,4) default 0,         -- 0-1
  steps_completed text[] default '{}',
  current_step text,
  fields_collected jsonb default '{}',
  nudge_count int default 0,
  last_nudge_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- RLS
-- =========================

alter table public.user_provider_links enable row level security;
alter table public.identity_dedupe_candidates enable row level security;
alter table public.trust_score_social_bonuses enable row level security;
alter table public.claim_flow_matches enable row level security;
alter table public.user_profile_progress enable row level security;

commit;
