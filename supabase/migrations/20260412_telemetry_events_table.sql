-- =====================================================================
-- Haul Command — Telemetry Events Table
-- Generated: 2026-04-12
-- Purpose: Stores real-time events from Traccar webhooks (ignition,
--          SOS, speed violations, driving behavior) and Motive dashcam
--          AI detections. Feeds Trust Score and dispatch alert pipeline.
-- Mode: ADDITIVE ONLY — no existing tables/data modified
-- =====================================================================
begin;

create table if not exists public.hc_telemetry_events (
    id              uuid primary key default gen_random_uuid(),
    device_id       text not null,
    device_name     text,
    event_type      text not null,
    severity        text not null default 'info' check (severity in ('info', 'warning', 'critical')),
    latitude        double precision,
    longitude       double precision,
    speed_knots     double precision,
    speed_mph       integer,
    address         text,
    raw_payload     jsonb,
    trust_score_impact integer default 0,
    dispatch_alert  boolean default false,
    processed       boolean default false,
    created_at      timestamptz not null default now()
);

-- Index: Fast lookup for unprocessed events (worker polling)
create index if not exists idx_telemetry_events_unprocessed
    on public.hc_telemetry_events (created_at desc)
    where processed = false;

-- Index: Device-level event history
create index if not exists idx_telemetry_events_device
    on public.hc_telemetry_events (device_id, created_at desc);

-- Index: Severity-based alerting
create index if not exists idx_telemetry_events_critical
    on public.hc_telemetry_events (severity, created_at desc)
    where severity = 'critical';

-- Index: Dispatch alert queue
create index if not exists idx_telemetry_events_dispatch
    on public.hc_telemetry_events (dispatch_alert, created_at desc)
    where dispatch_alert = true;

-- Enable RLS immediately
alter table public.hc_telemetry_events enable row level security;

-- Service-role only (telemetry is internal infrastructure, not user-facing)
-- RLS enabled with zero policies = deny-by-default for anon+authenticated

-- Notifications table for SOS alerts and dispatch notifications (if not exists)
create table if not exists public.hc_notifications (
    id          uuid primary key default gen_random_uuid(),
    type        text not null,
    title       text not null,
    body        text,
    severity    text default 'info' check (severity in ('info', 'warning', 'critical')),
    metadata    jsonb default '{}'::jsonb,
    read        boolean default false,
    user_id     uuid,
    created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_unread
    on public.hc_notifications (user_id, created_at desc)
    where read = false;

alter table public.hc_notifications enable row level security;

commit;
