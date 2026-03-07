-- 20260227_sociable_directory_upgrades.sql
-- AI headshot enhancer, face verification, experiments framework,
-- trust badges, and sociability synergy (streaks/levels)

begin;

-- =========================
-- 1) Avatar Assets & Processing Jobs
-- =========================

create table if not exists public.avatar_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  operator_profile_id uuid,
  source_type text not null default 'user_upload',  -- social_import|user_upload|seed|admin
  original_object_key text not null,
  processed_object_key text,
  state text not null default 'queued',              -- queued|processing|done|failed|skipped
  quality_before int,                                -- 0-100
  quality_after int,                                 -- 0-100
  face_detected boolean,
  safe_content_ok boolean,
  transform_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avatar_asset_user_idx on public.avatar_assets (user_id);
create index if not exists avatar_asset_profile_idx on public.avatar_assets (operator_profile_id);
create index if not exists avatar_asset_state_idx on public.avatar_assets (state);

create table if not exists public.avatar_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  avatar_asset_id uuid not null references public.avatar_assets(id),
  job_type text not null,                            -- enhance|reencode|resize|safety_check
  attempts int not null default 0,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists avatar_job_type_idx on public.avatar_processing_jobs (job_type);
create index if not exists avatar_job_run_idx on public.avatar_processing_jobs (run_after);

-- =========================
-- 2) Human Verification Signals
-- =========================

create table if not exists public.human_verification_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  operator_profile_id uuid,
  signal_type text not null,                         -- face_detected|liveness_passed|match_to_id_doc|social_consistency
  strength int not null,                             -- -100 to 100
  evidence_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hv_signal_user_idx on public.human_verification_signals (user_id);
create index if not exists hv_signal_type_idx on public.human_verification_signals (signal_type);

create table if not exists public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  operator_profile_id uuid,
  status text not null default 'queued',             -- queued|approved|rejected
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists verify_review_status_idx on public.verification_reviews (status);

-- Composite verification tier (computed)
create table if not exists public.user_verification_tiers (
  user_id uuid primary key,
  tier int not null default 0,                       -- 0|1|2|3|4
  tier_label text not null default 'unverified',     -- unverified|face_verified|verified_plus|liveness_verified|elite_verified
  trust_score_bonus int not null default 0,          -- 0|8|18|30|45
  face_detected boolean default false,
  social_verified boolean default false,
  liveness_passed boolean default false,
  cert_verified boolean default false,
  profile_claimed boolean default false,
  computed_at timestamptz not null default now()
);

-- =========================
-- 3) Experiments Framework
-- =========================

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  state text not null default 'draft',               -- draft|running|paused|complete
  start_at timestamptz,
  end_at timestamptz,
  primary_metric text not null,                      -- profile_ctr|time_on_profile|contact_click|match_accept
  guardrail_metrics text[] default '{}',
  config_json jsonb default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id),
  user_id uuid not null,
  variant text not null,                             -- control|treatment_a|treatment_b
  assigned_at timestamptz not null default now(),
  constraint exp_assign_unique unique (experiment_id, user_id)
);

create table if not exists public.experiment_events (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id),
  user_id uuid not null,
  event_name text not null,
  value numeric,
  occurred_at timestamptz not null default now()
);

create index if not exists exp_event_exp_idx on public.experiment_events (experiment_id);
create index if not exists exp_event_name_idx on public.experiment_events (event_name);

-- =========================
-- 4) Trust Badges
-- =========================

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_type text not null,                          -- verified_operator|elite_verified|top_10_corridor|fast_responder
  badge_label text not null,
  earned_at timestamptz not null default now(),
  expires_at timestamptz,                            -- null = permanent
  active boolean not null default true,
  criteria_snapshot jsonb default '{}',
  constraint badge_unique unique (user_id, badge_type)
);

create index if not exists badge_user_idx on public.user_badges (user_id);
create index if not exists badge_type_idx on public.user_badges (badge_type);
create index if not exists badge_active_idx on public.user_badges (active);

-- =========================
-- 5) Streaks & Levels (Sociability)
-- =========================

create table if not exists public.user_streaks (
  user_id uuid primary key,
  current_streak_days int not null default 0,
  longest_streak_days int not null default 0,
  last_active_date date,
  streak_actions_today int default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_levels (
  user_id uuid primary key,
  level int not null default 1,
  total_points int not null default 0,
  verified_tier_points int default 0,
  responsiveness_points int default 0,
  completion_points int default 0,
  last_point_earned_at timestamptz,
  updated_at timestamptz not null default now()
);

-- =========================
-- RLS
-- =========================

alter table public.avatar_assets enable row level security;
alter table public.avatar_processing_jobs enable row level security;
alter table public.human_verification_signals enable row level security;
alter table public.verification_reviews enable row level security;
alter table public.user_verification_tiers enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_assignments enable row level security;
alter table public.experiment_events enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_levels enable row level security;

commit;
