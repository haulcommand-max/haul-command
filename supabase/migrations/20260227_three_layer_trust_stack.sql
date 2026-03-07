-- 20260227_three_layer_trust_stack.sql
-- Layer 1: Crowd Signals (stars/ratings)
-- Layer 2: Verified Activity (jobs, payments, GPS sessions)
-- Layer 3: Evidence-Backed Disputes (uploads, proofs, rebuttals)
-- Plus: composite trust score engine tables

begin;

-- =========================
-- LAYER 1: CROWD SIGNALS
-- =========================

-- Multi-axis ratings (not just stars)
create table if not exists public.trust_ratings (
  id uuid primary key default gen_random_uuid(),
  rated_user_id uuid not null,                     -- who is being rated
  rater_user_id uuid not null,                     -- who is rating
  rater_role text not null,                        -- broker|operator
  job_id uuid,                                     -- tied to a real job (if available)
  -- Experience axes (1-5 each)
  communication_score int check (communication_score between 1 and 5),
  professionalism_score int check (professionalism_score between 1 and 5),
  responsiveness_score int check (responsiveness_score between 1 and 5),
  reliability_score int check (reliability_score between 1 and 5),
  overall_score int check (overall_score between 1 and 5),
  -- Trust axes (1-5 each)
  payment_reliability_score int check (payment_reliability_score between 1 and 5),  -- for brokers
  safety_compliance_score int check (safety_compliance_score between 1 and 5),       -- for operators
  -- Text
  review_text text,
  -- Anti-gaming
  verified_job boolean not null default false,     -- was this tied to a completed job?
  weight numeric(4,2) not null default 1.0,        -- verified job reviews weigh more
  flagged boolean default false,
  created_at timestamptz not null default now(),
  constraint rating_unique unique (rated_user_id, rater_user_id, job_id)
);

create index if not exists rating_rated_idx on public.trust_ratings (rated_user_id);
create index if not exists rating_rater_idx on public.trust_ratings (rater_user_id);
create index if not exists rating_job_idx on public.trust_ratings (job_id);
create index if not exists rating_verified_idx on public.trust_ratings (verified_job);

-- =========================
-- LAYER 2: VERIFIED ACTIVITY
-- =========================

create table if not exists public.verified_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,                        -- job_completed|payment_received|payment_sent|gps_session|load_moved|broker_interaction
  event_weight numeric(4,2) not null default 1.0,  -- heavier = more trust
  job_id uuid,
  counterparty_id uuid,                            -- the other party
  evidence_type text,                              -- platform_record|gps_track|payment_confirmation
  evidence_ref text,                               -- reference ID
  amount_cents int,                                -- for payment events
  verified boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vae_user_idx on public.verified_activity_events (user_id);
create index if not exists vae_type_idx on public.verified_activity_events (event_type);
create index if not exists vae_job_idx on public.verified_activity_events (job_id);

-- Activity summary (materialized per user)
create table if not exists public.verified_activity_summary (
  user_id uuid primary key,
  total_verified_jobs int not null default 0,
  total_verified_payments int not null default 0,
  total_gps_sessions int not null default 0,
  total_broker_interactions int not null default 0,
  total_loads_moved int not null default 0,
  total_payment_volume_cents bigint not null default 0,
  avg_payment_speed_hours numeric(6,2),           -- how fast they pay
  on_time_rate numeric(5,4) default 0,
  activity_score int not null default 0,          -- 0-100 composite
  last_activity_at timestamptz,
  computed_at timestamptz not null default now()
);

-- =========================
-- LAYER 3: EVIDENCE-BACKED DISPUTES
-- =========================

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  complainant_id uuid not null,                    -- who filed
  respondent_id uuid not null,                     -- who is accused
  job_id uuid,
  dispute_type text not null,                      -- non_payment|no_show|safety_violation|service_quality|fraud|other
  severity text not null default 'medium',         -- low|medium|high|critical
  status text not null default 'open',             -- open|evidence_phase|under_review|resolved|dismissed|escalated
  resolution text,                                 -- found_for_complainant|found_for_respondent|mutual|dismissed
  complainant_summary text not null,
  respondent_rebuttal text,
  admin_notes text,
  trust_impact_applied boolean default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists dispute_complainant_idx on public.disputes (complainant_id);
create index if not exists dispute_respondent_idx on public.disputes (respondent_id);
create index if not exists dispute_status_idx on public.disputes (status);
create index if not exists dispute_type_idx on public.disputes (dispute_type);

-- Evidence uploads
create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id),
  submitted_by uuid not null,
  evidence_type text not null,                     -- ratecon|screenshot|message_log|gps_track|payment_proof|photo|video|contract|other
  storage_path text not null,
  file_name text,
  file_size_bytes int,
  mime_type text,
  description text,
  timestamp_claimed timestamptz,                   -- when the submitter says it happened
  verified boolean default false,                  -- admin verified?
  created_at timestamptz not null default now()
);

create index if not exists evidence_dispute_idx on public.dispute_evidence (dispute_id);
create index if not exists evidence_submitter_idx on public.dispute_evidence (submitted_by);

-- Dispute outcomes impact on trust
create table if not exists public.dispute_trust_impacts (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id),
  user_id uuid not null,
  impact_type text not null,                       -- penalty|restoration|neutral
  trust_score_delta int not null,                  -- negative = penalty
  reason text not null,
  applied_at timestamptz not null default now()
);

create index if not exists dti_user_idx on public.dispute_trust_impacts (user_id);
create index if not exists dti_dispute_idx on public.dispute_trust_impacts (dispute_id);

-- =========================
-- COMPOSITE TRUST SCORE
-- =========================

create table if not exists public.composite_trust_scores (
  user_id uuid primary key,
  -- Layer scores (0-100 each)
  crowd_signal_score int not null default 0,       -- from ratings
  verified_activity_score int not null default 0,  -- from verified events
  evidence_defensibility_score int not null default 0, -- from dispute record
  -- Weighted composite
  composite_score int not null default 50,         -- 0-100
  -- Dimensions (visible to users)
  experience_score int not null default 0,         -- stars, communication, professionalism
  trust_score int not null default 0,              -- verified jobs, payments, disputes
  -- Confidence
  confidence_level text not null default 'low',    -- low|medium|high|very_high
  data_points int not null default 0,
  -- Cold start
  is_emerging boolean not null default true,       -- true until enough data
  probation_active boolean not null default false,
  -- Anti-gaming
  gaming_flags text[] default '{}',
  -- Timestamps
  computed_at timestamptz not null default now()
);

-- =========================
-- RLS
-- =========================

alter table public.trust_ratings enable row level security;
alter table public.verified_activity_events enable row level security;
alter table public.verified_activity_summary enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.dispute_trust_impacts enable row level security;
alter table public.composite_trust_scores enable row level security;

commit;
