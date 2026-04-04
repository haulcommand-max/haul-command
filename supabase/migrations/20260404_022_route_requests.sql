-- Migration 022: hc_route_requests — broker load request submissions
begin;

drop table if exists public.hc_route_requests cascade;
create table if not exists public.hc_route_requests (
  id                  uuid primary key default gen_random_uuid(),
  requested_by        uuid references auth.users(id) on delete set null,
  operator_hc_id      text,
  service_type        text not null check(service_type in('pilot_car','escort_vehicle','high_pole','steerman','route_surveyor','heavy_towing','air_cushion','other')),
  contact_name        text,
  contact_email       text not null,
  contact_phone       text,
  pickup_location     text not null,
  delivery_location   text not null,
  pickup_date         date,
  load_description    text,
  width_ft            numeric(8,2),
  height_ft           numeric(8,2),
  length_ft           numeric(8,2),
  weight_lbs          int,
  notes               text,
  status              text not null default 'pending' check(status in('pending','viewed','quoted','accepted','declined','expired')),
  operator_response   text,
  quoted_rate_cents   int,
  responded_at        timestamptz,
  expires_at          timestamptz default (now() + interval '7 days'),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_route_requests_operator on public.hc_route_requests(operator_hc_id, status);
create index if not exists idx_route_requests_user     on public.hc_route_requests(requested_by, created_at desc);
create index if not exists idx_route_requests_status   on public.hc_route_requests(status, created_at desc);

alter table public.hc_route_requests enable row level security;

create policy "Requestor can read own requests"
  on public.hc_route_requests for select
  using (auth.uid() = requested_by);

create policy "Anyone can insert a request"
  on public.hc_route_requests for insert
  with check (true);

create policy "Service role full access"
  on public.hc_route_requests for all
  using (auth.role() = 'service_role');

-- Trigger to enqueue push notification to operator on new request
create or replace function public.hc_enqueue_request_push()
returns trigger language plpgsql security definer as $$
begin
  if NEW.operator_hc_id is not null then
    insert into public.hc_notif_jobs(event_type, payload, status)
    values (
      'load_request',
      jsonb_build_object(
        'operator_hc_id', NEW.operator_hc_id,
        'service_type',   NEW.service_type,
        'pickup',         NEW.pickup_location,
        'delivery',       NEW.delivery_location,
        'request_id',     NEW.id
      ),
      'pending'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists tg_route_request_push on public.hc_route_requests;
create trigger tg_route_request_push
  after insert on public.hc_route_requests
  for each row execute function public.hc_enqueue_request_push();

commit;
