-- Haul Command — Notification Triggers
-- Migration: 20260404_017_notification_triggers.sql
-- Purpose: Supabase DB triggers that fire push events on real marketplace behavior.
-- Pattern: trigger fires edge function URL via pg_net (or records to a job queue).
-- All triggers are additive. No existing tables modified destructively.
begin;

-- ─────────────────────────────────────────
-- 1. Notification job queue
-- Triggers enqueue here; a worker (cron/edge function) drains it.
-- This decouples DB writes from HTTP calls, prevents locks.
-- ─────────────────────────────────────────
create table if not exists public.hc_notif_jobs (
  id              bigserial primary key,
  event_type      text not null,
  mode            text not null default 'single' check(mode in('single','broadcast')),
  payload         jsonb not null,
  status          text not null default 'pending' check(status in('pending','processing','done','failed')),
  attempts        int default 0,
  last_error      text,
  scheduled_at    timestamptz default now(),
  processed_at    timestamptz,
  created_at      timestamptz default now()
);

create index if not exists idx_notif_jobs_pending
  on public.hc_notif_jobs(status, scheduled_at)
  where status = 'pending';

alter table public.hc_notif_jobs enable row level security;
create policy "Service role full access notif jobs"
  on public.hc_notif_jobs for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- 2. TRIGGER: new route request → load match push
-- Fires when a row is inserted into hc_route_requests.
-- Enqueues a 'new_load_match' broadcast to operators in the relevant corridor.
-- ─────────────────────────────────────────
create or replace function public.hc_trigger_route_request_notif()
returns trigger language plpgsql as $$
declare
  v_corridor_name text;
  v_country_code  char(2);
begin
  -- Look up corridor context for richer copy
  select name, origin_country_code
    into v_corridor_name, v_country_code
  from public.hc_corridors
  where slug = new.corridor_slug
  limit 1;

  insert into public.hc_notif_jobs(event_type, mode, payload) values (
    'new_load_match',
    'broadcast',
    jsonb_build_object(
      'eventType',     'new_load_match',
      'roleKey',       'pilot_car_operator',
      'countryCode',   coalesce(v_country_code, new.country_code),
      'corridorSlug',  new.corridor_slug,
      'title',         '📍 New load on ' || coalesce(v_corridor_name, new.corridor_slug),
      'body',          'A carrier needs escort coverage. Tap to view the route.',
      'deepLink',      '/corridors/' || coalesce(new.corridor_slug, ''),
      'dedupKey',      'load_match:' || coalesce(new.corridor_slug,'') || ':' || date_trunc('hour', now())::text,
      'dedupWindowHrs', 2
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_route_request_notif on public.hc_route_requests;
create trigger trg_route_request_notif
  after insert on public.hc_route_requests
  for each row execute function public.hc_trigger_route_request_notif();

-- ─────────────────────────────────────────
-- 3. TRIGGER: low corridor score → coverage gap alert
-- Fires when corridor composite_score drops below threshold (re-score event).
-- We hook into hc_corridor_demand_signals inserts.
-- If fill_rate_7d < 0.4 we treat it as a coverage gap.
-- ─────────────────────────────────────────
create or replace function public.hc_trigger_coverage_gap_notif()
returns trigger language plpgsql as $$
declare
  v_slug  text;
  v_name  text;
  v_cc    char(2);
begin
  -- Only fire if fill_rate signals potential gap (column may not exist yet — safe guard)
  if (new.signal_data->'fill_rate_7d') is not null
     and (new.signal_data->>'fill_rate_7d')::numeric < 0.4
  then
    select slug, name, origin_country_code
      into v_slug, v_name, v_cc
    from public.hc_corridors
    where id = new.corridor_id
    limit 1;

    insert into public.hc_notif_jobs(event_type, mode, payload) values (
      'coverage_gap_alert',
      'broadcast',
      jsonb_build_object(
        'eventType',    'coverage_gap_alert',
        'roleKey',      'freight_broker',
        'countryCode',  v_cc,
        'corridorSlug', v_slug,
        'title',        '⚠️ Coverage gap — ' || coalesce(v_name, v_slug),
        'body',         'Escort coverage is low on this corridor. Find operators now.',
        'deepLink',     '/corridors/' || coalesce(v_slug, ''),
        'dedupKey',     'coverage_gap:' || coalesce(v_slug,'') || ':' || date_trunc('day', now())::text,
        'dedupWindowHrs', 12
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_coverage_gap_notif on public.hc_corridor_demand_signals;
create trigger trg_coverage_gap_notif
  after insert or update on public.hc_corridor_demand_signals
  for each row execute function public.hc_trigger_coverage_gap_notif();

-- ─────────────────────────────────────────
-- 4. Weekly claim reminder enqueue function
-- Called by Supabase cron (pg_cron) every Monday 09:00 UTC.
-- Finds users who have unclaimed listing shells and queues reminders.
-- ─────────────────────────────────────────
create or replace function public.hc_enqueue_claim_reminders()
returns int language plpgsql as $$
declare
  v_count int := 0;
  v_user  record;
begin
  -- Find users who have a device token but no claimed listing
  -- (join pattern: users with push tokens, without a claimed hc_places row)
  for v_user in
    select distinct dt.user_id
    from public.hc_device_tokens dt
    where dt.is_active = true
      and not exists (
        select 1 from public.hc_places p
        where p.claimed_by = dt.user_id
          and p.claim_status = 'claimed'
      )
      -- Not reminded in last 72 hours
      and not exists (
        select 1 from public.hc_notif_jobs j
        where j.event_type = 'claim_reminder'
          and j.payload->>'userId' = dt.user_id::text
          and j.created_at > now() - interval '72 hours'
      )
    limit 500
  loop
    insert into public.hc_notif_jobs(event_type, mode, payload) values (
      'claim_reminder',
      'single',
      jsonb_build_object(
        'eventType',     'claim_reminder',
        'userId',        v_user.user_id,
        'title',        '🏷️ Your listing may already exist',
        'body',         'Claim your Haul Command listing to unlock leads, trust badges, and visibility.',
        'deepLink',     '/claim',
        'dedupKey',     'claim_reminder:' || v_user.user_id::text,
        'dedupWindowHrs', 72
      )
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Schedule via pg_cron (requires pg_cron extension enabled in Supabase)
-- Run in SQL editor after applying migration:
-- SELECT cron.schedule('weekly-claim-reminders', '0 9 * * 1', 'SELECT public.hc_enqueue_claim_reminders()');

commit;
