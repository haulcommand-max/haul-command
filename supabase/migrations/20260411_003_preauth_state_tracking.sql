-- =====================================================================
-- SONNET-01 Migration 3/3: Pre-Auth State Tracking on Jobs
-- Mode: ADDITIVE ONLY
-- Opus signoff: 2026-04-10
-- =====================================================================
begin;

do $$
begin
  -- stripe_payment_intent_id: the Stripe PI for this job's pre-auth
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_jobs' and column_name = 'stripe_payment_intent_id'
  ) then
    alter table public.hc_jobs add column stripe_payment_intent_id text;
  end if;

  -- preauth_status: none | pending | authorized | captured | failed | cancelled
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_jobs' and column_name = 'preauth_status'
  ) then
    alter table public.hc_jobs add column preauth_status text not null default 'none'
      check (preauth_status in ('none', 'pending', 'authorized', 'captured', 'failed', 'cancelled'));
  end if;

  -- preauth_amount_cents: the amount held
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_jobs' and column_name = 'preauth_amount_cents'
  ) then
    alter table public.hc_jobs add column preauth_amount_cents int;
  end if;

  -- preauth_idempotency_key: prevents duplicate pre-auth creation
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_jobs' and column_name = 'preauth_idempotency_key'
  ) then
    alter table public.hc_jobs add column preauth_idempotency_key text;
  end if;
end $$;

-- Index for finding jobs with pending pre-auths (stale cleanup)
create index if not exists idx_hc_jobs_preauth_pending
  on public.hc_jobs (preauth_status, created_at)
  where preauth_status = 'pending';

commit;
