-- Haul Command — Notification Infrastructure
-- Migration: 20260404_016_notification_events.sql
-- Purpose: Canonical notification event log, device token registry, preference controls,
--          quiet-hours, dedup state, and push audit trail.
-- Firebase handles delivery. Supabase owns state.
begin;

-- ─────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────
drop type if exists public.hc_notif_channel cascade;
create type public.hc_notif_channel as enum(
  'push','email','sms','in_app','voice'
);

drop type if exists public.hc_notif_event_type cascade;
create type public.hc_notif_event_type as enum(
  -- Operator / supply events
  'new_load_match',
  'missed_opportunity',
  'load_cancelled',
  'route_alert',
  'rate_alert',
  'urgent_nearby_work',
  'repositioning_opportunity',
  -- Broker / demand events
  'operator_match_found',
  'quote_received',
  'coverage_gap_alert',
  'urgent_replacement_needed',
  'load_status_update',
  -- Claim / trust events
  'claim_reminder',
  'claim_verification_step',
  'claim_approved',
  'profile_incomplete',
  'profile_benefit_unlocked',
  'trust_score_changed',
  -- Directory / engagement events
  'nearby_market_active',
  'corridor_activity',
  'saved_corridor_update',
  'leaderboard_rank_change',
  -- Global / expansion events
  'market_activated',
  'waitlist_position_update',
  'rules_update',
  'tool_update',
  -- Monetization events
  'adgrid_slot_active',
  'data_product_expiring',
  'payment_confirmed',
  'payment_failed'
);

drop type if exists public.hc_notif_status cascade;
create type public.hc_notif_status as enum(
  'queued','sent','delivered','opened','clicked','failed','throttled','deduped','opted_out'
);

drop type if exists public.hc_user_role_key cascade;
create type public.hc_user_role_key as enum(
  'pilot_car_operator','escort_driver','heavy_haul_carrier',
  'freight_broker','dispatcher','permit_agent','route_surveyor',
  'yard_operator','shipper','project_planner','directory_user'
);

-- ─────────────────────────────────────────
-- Device token registry
-- ─────────────────────────────────────────
drop table if exists public.hc_device_tokens cascade;
create table if not exists public.hc_device_tokens (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  token             text not null,
  platform          text not null check(platform in ('ios','android','web')),
  app_version       text,
  country_code      char(2),
  region_code       text,
  role_key          public.hc_user_role_key,
  is_active         boolean default true,
  last_seen_at      timestamptz default now(),
  registered_at     timestamptz default now(),
  unique(user_id, token)
);

create index if not exists idx_device_tokens_user on public.hc_device_tokens(user_id, is_active);
create index if not exists idx_device_tokens_country on public.hc_device_tokens(country_code, role_key, is_active);

alter table public.hc_device_tokens enable row level security;
create policy "Users manage own tokens" on public.hc_device_tokens
  for all using (auth.uid() = user_id);
create policy "Service role full access tokens" on public.hc_device_tokens
  for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- Notification preferences
-- ─────────────────────────────────────────
drop table if exists public.hc_notif_preferences cascade;
create table if not exists public.hc_notif_preferences (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique not null references auth.users(id) on delete cascade,

  -- Channel opt-ins
  push_enabled      boolean default true,
  email_enabled     boolean default true,
  sms_enabled       boolean default false,  -- opt-in only
  in_app_enabled    boolean default true,

  -- Category opt-outs
  load_match_push   boolean default true,
  claim_push        boolean default true,
  market_push       boolean default true,
  rate_alert_push   boolean default true,
  monetization_push boolean default true,

  -- Quiet hours (UTC)
  quiet_hours_start time,   -- e.g. '22:00'
  quiet_hours_end   time,   -- e.g. '07:00'
  timezone          text default 'UTC',

  -- Throttle
  max_push_per_day  int default 12,
  max_sms_per_day   int default 3,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.hc_notif_preferences enable row level security;
create policy "Users manage own preferences" on public.hc_notif_preferences
  for all using (auth.uid() = user_id);
create policy "Service role full access preferences" on public.hc_notif_preferences
  for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- Notification event log (audit trail)
-- ─────────────────────────────────────────
drop table if exists public.hc_notif_events cascade;
create table if not exists public.hc_notif_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  device_token_id   uuid references public.hc_device_tokens(id) on delete set null,

  event_type        public.hc_notif_event_type not null,
  channel           public.hc_notif_channel not null,
  status            public.hc_notif_status not null default 'queued',

  -- Content
  title             text not null,
  body              text not null,
  data_payload      jsonb default '{}',
  deep_link         text,

  -- Targeting
  role_key          public.hc_user_role_key,
  country_code      char(2),
  corridor_slug     text,

  -- Dedup
  dedup_key         text,  -- prevents duplicate sends for same event+user
  dedup_window_hrs  int default 24,

  -- Conversion tracking
  opened_at         timestamptz,
  clicked_at        timestamptz,
  converted_at      timestamptz,
  conversion_action text,

  -- Scheduling
  scheduled_at      timestamptz default now(),
  sent_at           timestamptz,
  failed_reason     text,

  -- Firebase
  firebase_message_id text,

  created_at        timestamptz default now()
);

create index if not exists idx_notif_events_user_status on public.hc_notif_events(user_id, status, created_at desc);
create index if not exists idx_notif_events_dedup on public.hc_notif_events(dedup_key, user_id, created_at desc);
create index if not exists idx_notif_events_event_type on public.hc_notif_events(event_type, channel, created_at desc);

alter table public.hc_notif_events enable row level security;
create policy "Users read own notif events" on public.hc_notif_events
  for select using (auth.uid() = user_id);
create policy "Service role full access notif events" on public.hc_notif_events
  for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- Dedup helper function
-- ─────────────────────────────────────────
create or replace function public.hc_notif_is_duplicate(
  p_user_id uuid,
  p_dedup_key text,
  p_window_hrs int default 24
) returns boolean language sql stable as $$
  select exists (
    select 1 from public.hc_notif_events
    where user_id = p_user_id
      and dedup_key = p_dedup_key
      and status not in ('failed', 'opted_out')
      and created_at > now() - (p_window_hrs || ' hours')::interval
  );
$$;

-- ─────────────────────────────────────────
-- Daily send-count throttle helper
-- ─────────────────────────────────────────
create or replace function public.hc_notif_daily_count(
  p_user_id uuid,
  p_channel public.hc_notif_channel
) returns int language sql stable as $$
  select count(*)::int from public.hc_notif_events
  where user_id = p_user_id
    and channel = p_channel
    and status not in ('failed', 'opted_out', 'throttled', 'deduped')
    and created_at > now() - interval '24 hours';
$$;

commit;
