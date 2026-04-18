-- =====================================================================
-- Haul Command — Operator Live Ping Push Notification Trigger
-- Generated: 2026-04-09
-- Purpose: When an operator pings "available" via operator_live_status,
--          automatically fire a push notification to all brokers within
--          200 miles who have active loads matching the operator's role.
-- =====================================================================
begin;

-- =====================================================================
-- 1) Push notification queue for live pings
-- =====================================================================
create table if not exists public.hc_live_ping_notifications (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null,
  operator_name text,
  operator_lat  double precision,
  operator_lng  double precision,
  target_type   text not null default 'broker' check (target_type in ('broker', 'shipper', 'dispatcher', 'all')),
  radius_miles  double precision not null default 200,
  status        text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  recipients    int not null default 0,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

alter table public.hc_live_ping_notifications enable row level security;


-- =====================================================================
-- 2) Trigger function: fires when operator_live_status.status → 'available'
-- =====================================================================
create or replace function fn_notify_operator_went_live()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_operator_name text;
begin
  -- Only fire on status change TO 'available'
  if NEW.status = 'available' and (OLD.status is distinct from 'available') then
    
    -- Look up operator name
    select coalesce(name, 'Operator')
      into v_operator_name
      from public.hc_global_operators
      where id = NEW.operator_id
      limit 1;
    
    -- Queue a push notification record
    insert into public.hc_live_ping_notifications (
      operator_id, operator_name, operator_lat, operator_lng,
      target_type, radius_miles, status
    ) values (
      NEW.operator_id, v_operator_name, NEW.current_lat, NEW.current_lng,
      'broker', 200, 'pending'
    );
    
    -- Fire a pg_notify event for real-time listeners (Edge Function / worker)
    perform pg_notify('operator_went_live', json_build_object(
      'operator_id', NEW.operator_id,
      'operator_name', v_operator_name,
      'lat', NEW.current_lat,
      'lng', NEW.current_lng,
      'pinged_at', NEW.last_pinged_at
    )::text);
    
  end if;
  
  return NEW;
end;
$$;

-- Attach trigger to operator_live_status
drop trigger if exists trg_operator_went_live on public.operator_live_status;
create trigger trg_operator_went_live
  after insert or update on public.operator_live_status
  for each row
  execute function fn_notify_operator_went_live();


-- =====================================================================
-- 3) Edge Function: process pending live ping notifications
--    (This SQL creates the queue; the actual Firebase push is handled
--     by a Supabase Edge Function or the workers/live-ping-push.mjs script)
-- =====================================================================

-- Index for worker polling
create index if not exists idx_live_ping_notifications_pending
  on public.hc_live_ping_notifications (created_at asc)
  where status = 'pending';

commit;
