create table if not exists public.supply_alerts (
  id uuid primary key default gen_random_uuid(),
  city text,
  state_code text,
  corridor_id text,
  alert_type text,
  available_count integer,
  demand_rate numeric,
  message text not null default 'Active supply pressure signal for this market.',
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.supply_alerts is
  'Optional market-pressure alerts consumed by available-now and sponsor pricing. Public reads are limited to active, unexpired alerts.';

create index if not exists idx_supply_alerts_active_recent
  on public.supply_alerts (active, created_at desc);

create index if not exists idx_supply_alerts_state_active
  on public.supply_alerts (state_code, active, created_at desc)
  where state_code is not null;

create index if not exists idx_supply_alerts_corridor_active
  on public.supply_alerts (corridor_id, active, created_at desc)
  where corridor_id is not null;

alter table public.supply_alerts enable row level security;

drop policy if exists "Public can read active unexpired supply alerts" on public.supply_alerts;
create policy "Public can read active unexpired supply alerts"
  on public.supply_alerts
  for select
  to anon, authenticated
  using (
    active = true
    and (expires_at is null or expires_at > now())
  );

grant select on public.supply_alerts to anon, authenticated;
grant all on public.supply_alerts to service_role;
