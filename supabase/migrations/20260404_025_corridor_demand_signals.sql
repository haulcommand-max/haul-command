-- Migration 025: Corridor Demand Signals
-- Supports coverage_gap_alert notifications and AdGrid pricing optimization.
begin;

drop table if exists public.hc_corridor_demand_signals cascade;

create table if not exists public.hc_corridor_demand_signals (
  id              uuid primary key default gen_random_uuid(),
  corridor_id     uuid not null references public.hc_corridors(id) on delete cascade,
  corridor_slug   text not null,
  signal_data     jsonb not null default '{}'::jsonb,
  composite_score numeric default 0.0,
  recorded_at     timestamptz default now(),
  created_at      timestamptz default now()
);

create index if not exists idx_corridor_signals_corridor on public.hc_corridor_demand_signals(corridor_id, recorded_at desc);

-- Enable RLS
alter table public.hc_corridor_demand_signals enable row level security;
create policy "Anyone can read demand signals" on public.hc_corridor_demand_signals for select using (true);
create policy "Service role manages demand signals" on public.hc_corridor_demand_signals for all using (auth.role() = 'service_role');

create or replace function public.hc_trigger_coverage_gap_notif()
returns trigger language plpgsql as $$
declare
  v_slug  text;
  v_name  text;
  v_cc    char(2);
begin
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

-- Wire coverage_gap_alert trigger
drop trigger if exists trg_coverage_gap_notif on public.hc_corridor_demand_signals;
create trigger trg_coverage_gap_notif
  after insert or update on public.hc_corridor_demand_signals
  for each row execute function public.hc_trigger_coverage_gap_notif();

commit;
