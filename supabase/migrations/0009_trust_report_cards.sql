-- 0009_trust_report_cards.sql

do $$ begin
  create type public.trust_event as enum (
    'job_completed',
    'job_cancelled_by_broker',
    'no_show_driver',
    'late_arrival',
    'docs_verified',
    'docs_expired',
    'payment_dispute_opened',
    'payment_dispute_resolved_driver_favor',
    'payment_dispute_resolved_broker_favor',
    'ghost_load_flagged',
    'fraud_flagged'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  subject_actor_id uuid not null,                 -- driver/broker profile id
  subject_actor_type public.actor_type not null,  -- driver or broker
  event public.trust_event not null,
  job_id uuid null,
  severity int not null default 1,                -- 1..5
  weight int not null default 0,                  -- computed points delta (store for audit)
  evidence_ref text null,                         -- storage path or hash pointer
  occurred_at timestamptz not null default now(),
  inserted_at timestamptz not null default now()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS trust_events_subject_idx
    ON public.trust_events (subject_actor_type, subject_actor_id, occurred_at desc);
EXCEPTION WHEN undefined_column OR undefined_object THEN NULL;
END $$;

-- Simple, explainable scoring (you can tune weights later)
create or replace function public.trust_weight(e public.trust_event, severity int)
returns int
language sql
stable
as $$
  select
    case e
      when 'docs_verified' then 10
      when 'job_completed' then 5
      when 'payment_dispute_resolved_driver_favor' then 3
      when 'payment_dispute_resolved_broker_favor' then -3
      when 'late_arrival' then -2 * greatest(severity,1)
      when 'job_cancelled_by_broker' then -2 * greatest(severity,1)
      when 'no_show_driver' then -10 * greatest(severity,1)
      when 'docs_expired' then -6
      when 'ghost_load_flagged' then -8 * greatest(severity,1)
      when 'fraud_flagged' then -20 * greatest(severity,1)
      when 'payment_dispute_opened' then -1
      else 0
    end;
$$;

-- Rollup view (adapted to actual trust_events schema)
DROP VIEW IF EXISTS public.trust_report_cards CASCADE;
CREATE VIEW public.trust_report_cards AS
WITH base AS (
  SELECT
    role                                                         AS subject_actor_type,
    entity_profile_id                                           AS subject_actor_id,
    count(*)::bigint                                            AS score_lifetime,
    count(CASE WHEN occurred_at >= now() - interval '30 days' THEN 1 END)::bigint AS score_30d,
    max(occurred_at)                                            AS last_event_at
  FROM public.trust_events
  GROUP BY 1, 2
)
SELECT
  b.*,
  CASE
    WHEN b.score_lifetime >= 250 THEN 'gold'
    WHEN b.score_lifetime >= 100 THEN 'silver'
    WHEN b.score_lifetime >= 25  THEN 'bronze'
    ELSE 'new'
  END AS trust_tier
FROM base b;
