-- 20260227_0030_stripe_metered_billing_hardening.sql
-- Stripe metered billing hardening: locks, watermarks, batch ledger, webhook dedupe, reconciliation hooks

begin;

-- Extensions
create extension if not exists pgcrypto;

-- =========================
-- Stripe entity mapping
-- =========================

create table if not exists public.stripe_customers (
  account_id uuid primary key,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_subscriptions (
  account_id uuid primary key,
  stripe_subscription_id text not null unique,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_subscription_items (
  account_id uuid not null,
  metric_key text not null,
  stripe_subscription_item_id text not null unique,
  stripe_price_id text not null,
  created_at timestamptz not null default now(),
  constraint stripe_subscription_items_uniq unique (account_id, metric_key)
);

create index if not exists stripe_subscription_items_account_idx
  on public.stripe_subscription_items (account_id);

create index if not exists stripe_subscription_items_metric_idx
  on public.stripe_subscription_items (metric_key);

-- =========================
-- Watermarks & batches (ledger)
-- =========================

create table if not exists public.stripe_usage_watermarks (
  account_id uuid not null,
  metric_key text not null,
  stripe_subscription_item_id text not null,
  last_reported_day date,
  lock_version int not null default 0,
  updated_at timestamptz not null default now(),
  constraint stripe_usage_watermarks_pk primary key (account_id, metric_key)
);

create index if not exists stripe_usage_watermarks_item_idx
  on public.stripe_usage_watermarks (stripe_subscription_item_id);

-- One batch row == one "usage push" for one account+metric+day (or delta correction for that day).
create table if not exists public.stripe_usage_batches (
  batch_id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  metric_key text not null,
  stripe_subscription_item_id text not null,
  usage_day date not null,
  total_units bigint not null,
  rollup_id bigint,
  rollup_hash text not null,
  idempotency_key text not null unique,
  stripe_request_json jsonb not null,
  stripe_response_json jsonb,
  status text not null default 'pending', -- pending|sent|confirmed|failed
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists stripe_usage_batches_lookup_idx
  on public.stripe_usage_batches (account_id, metric_key, usage_day);

create index if not exists stripe_usage_batches_status_idx
  on public.stripe_usage_batches (status);

-- =========================
-- Webhook dedupe store
-- =========================

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  account_id uuid,
  payload jsonb not null,
  processing_status text not null default 'pending', -- pending|processed|failed
  processed_at timestamptz,
  error_message text
);

create index if not exists stripe_webhook_events_type_idx
  on public.stripe_webhook_events (event_type);

create index if not exists stripe_webhook_events_account_idx
  on public.stripe_webhook_events (account_id);

-- =========================
-- Utility: stable hash of rollup row identity
-- =========================

-- Hash a single day payload: (usage_day|units|rollup_id)
create or replace function public.compute_daily_rollup_hash(
  p_usage_day date,
  p_units bigint,
  p_rollup_id bigint
) returns text
language sql
stable
as $$
  select encode(digest(
    coalesce(p_usage_day::text,'') || '|' ||
    coalesce(p_units::text,'') || '|' ||
    coalesce(p_rollup_id::text,''),
    'sha256'
  ), 'hex');
$$;

-- =========================
-- Advisory locks (per-account)
-- =========================

create or replace function public.acquire_billing_lock(p_account_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  got_lock boolean;
begin
  -- hashtext returns int4; pg_try_advisory_lock takes bigint in some variants.
  select pg_try_advisory_lock(hashtext(p_account_id::text)::bigint) into got_lock;
  return got_lock;
end;
$$;

create or replace function public.release_billing_lock(p_account_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform pg_advisory_unlock(hashtext(p_account_id::text)::bigint);
end;
$$;

-- =========================
-- Safety: allow service role / internal callers
-- =========================
-- If you already have a strict RLS posture, keep these tables locked down.
-- Recommended: enable RLS and only allow service_role in API routes.

alter table public.stripe_customers enable row level security;
alter table public.stripe_subscriptions enable row level security;
alter table public.stripe_subscription_items enable row level security;
alter table public.stripe_usage_watermarks enable row level security;
alter table public.stripe_usage_batches enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Minimal policies (service role bypasses RLS in Supabase).
-- If you use non-service contexts, add proper per-tenant policies later.

commit;
