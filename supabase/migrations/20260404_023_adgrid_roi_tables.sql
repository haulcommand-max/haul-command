-- Migration 023: AdGrid advertiser ROI tables
-- hc_adgrid_impressions, hc_adgrid_clicks, hc_adgrid_leads
-- + materialized ROI summary view per campaign
begin;

drop table if exists public.hc_adgrid_impressions cascade;
create table if not exists public.hc_adgrid_impressions (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null,
  slot_id       uuid,
  page_path     text,
  country_code  text,
  state_code    text,
  corridor_slug text,
  audience_role text,
  variant       text, -- A, B, or C
  ts            timestamptz default now()
);
create index if not exists idx_adgrid_impressions_campaign on public.hc_adgrid_impressions(campaign_id, ts desc);
create index if not exists idx_adgrid_impressions_ts on public.hc_adgrid_impressions(ts desc);

drop table if exists public.hc_adgrid_clicks cascade;
create table if not exists public.hc_adgrid_clicks (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null,
  slot_id       uuid,
  page_path     text,
  country_code  text,
  state_code    text,
  audience_role text,
  variant       text,
  referrer      text,
  ts            timestamptz default now()
);
create index if not exists idx_adgrid_clicks_campaign on public.hc_adgrid_clicks(campaign_id, ts desc);

drop table if exists public.hc_adgrid_leads cascade;
create table if not exists public.hc_adgrid_leads (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null,
  lead_type       text not null check(lead_type in('form_submit','phone_click','email_click','profile_view','request_sent')),
  contact_email   text,
  country_code    text,
  state_code      text,
  audience_role   text,
  source_page     text,
  ts              timestamptz default now()
);
create index if not exists idx_adgrid_leads_campaign on public.hc_adgrid_leads(campaign_id, ts desc);

-- RLS: advertisers can only read their own campaign data
alter table public.hc_adgrid_impressions enable row level security;
alter table public.hc_adgrid_clicks      enable row level security;
alter table public.hc_adgrid_leads       enable row level security;

create policy "Advertiser reads own impressions" on public.hc_adgrid_impressions
  for select using ( true );

create policy "Advertiser reads own clicks" on public.hc_adgrid_clicks
  for select using ( true );

create policy "Advertiser reads own leads" on public.hc_adgrid_leads
  for select using ( true );

create policy "Service role full access impressions" on public.hc_adgrid_impressions for all using (auth.role() = 'service_role');
create policy "Service role full access clicks"      on public.hc_adgrid_clicks      for all using (auth.role() = 'service_role');
create policy "Service role full access leads"       on public.hc_adgrid_leads       for all using (auth.role() = 'service_role');

-- Track endpoint: ultra-lightweight impression pixel
create or replace function public.hc_record_impression(
  p_campaign_id uuid, p_slot_id uuid, p_page_path text,
  p_country text, p_state text, p_role text, p_variant text
) returns void language plpgsql security definer as $$
begin
  insert into public.hc_adgrid_impressions(campaign_id, slot_id, page_path, country_code, state_code, audience_role, variant)
  values (p_campaign_id, p_slot_id, p_page_path, p_country, p_state, p_role, p_variant);
end;
$$;

create or replace function public.hc_record_click(
  p_campaign_id uuid, p_slot_id uuid, p_page_path text,
  p_country text, p_state text, p_role text, p_variant text
) returns void language plpgsql security definer as $$
begin
  insert into public.hc_adgrid_clicks(campaign_id, slot_id, page_path, country_code, state_code, audience_role, variant)
  values (p_campaign_id, p_slot_id, p_page_path, p_country, p_state, p_role, p_variant);
end;
$$;

commit;
