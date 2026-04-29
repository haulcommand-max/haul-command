-- Migration: 20260429_120_regulatory_watch_items_v1.sql
-- Regulatory Watch System: FMCSA Aurora warning-device exemption seed.

begin;

create table if not exists public.regulatory_watch_items (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'US',
  agency_name text not null,
  docket_id text unique,
  title text not null,
  summary text,
  plain_english text,
  affected_rules jsonb default '[]'::jsonb,
  affected_roles jsonb default '[]'::jsonb,
  affected_vehicle_types jsonb default '[]'::jsonb,
  affected_corridors jsonb default '[]'::jsonb,
  status text default 'monitoring' check (status in ('monitoring','comment_open','comment_closed','decided','implemented','withdrawn','appeal')),
  company_requesting text,
  requested_change text,
  comment_deadline date,
  decision_date date,
  source_urls jsonb default '[]'::jsonb,
  risk_score int default 5 check (risk_score between 1 and 10),
  opportunity_score int default 5 check (opportunity_score between 1 and 10),
  monetization_tags jsonb default '[]'::jsonb,
  haul_command_relevance jsonb default '[]'::jsonb,
  page_slug text,
  is_published boolean default false,
  requires_human_review boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_rwi_country on public.regulatory_watch_items(country_code);
create index if not exists idx_rwi_status on public.regulatory_watch_items(status);
create index if not exists idx_rwi_deadline on public.regulatory_watch_items(comment_deadline);
create index if not exists idx_rwi_docket on public.regulatory_watch_items(docket_id);
create index if not exists idx_rwi_page_slug on public.regulatory_watch_items(page_slug);

alter table public.regulatory_watch_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'regulatory_watch_items' and policyname = 'Public read published regulatory watch items') then
    create policy "Public read published regulatory watch items"
      on public.regulatory_watch_items
      for select
      using (is_published = true and requires_human_review = false);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'regulatory_watch_items' and policyname = 'Service role full access regulatory watch items') then
    create policy "Service role full access regulatory watch items"
      on public.regulatory_watch_items
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

insert into public.regulatory_watch_items (
  country_code, agency_name, docket_id, title, summary, plain_english,
  affected_rules, affected_roles, affected_vehicle_types, affected_corridors,
  status, company_requesting, requested_change, comment_deadline,
  source_urls, risk_score, opportunity_score,
  monetization_tags, haul_command_relevance, page_slug, is_published,
  requires_human_review
) values (
  'US',
  'FMCSA',
  'FMCSA-2026-0958',
  'Aurora Level 4 ADS Warning Device Exemption',
  'Aurora Operations Inc. requested a five-year exemption allowing Level 4 automated commercial vehicles to use cab-mounted warning beacons instead of reflective triangles or fusees when stopped on the road. FMCSA also granted a limited waiver effective April 10 through July 9, 2026, available to qualifying Level 4 ADS carriers.',
  'Driverless truck companies want to replace the physical warning triangles placed behind stopped trucks with electronic beacons mounted on top of the cab. FMCSA is deciding whether to allow this for five years. Regular truckers still have to use triangles unless covered by a qualifying waiver or exemption. The comment deadline is May 15, 2026.',
  '["49 CFR 392.22(b)","49 CFR 393.25(e)","49 CFR 393.95(f)"]'::jsonb,
  '["carrier","pilot_car_operator","broker","safety_director","equipment_supplier","insurer","law_enforcement","route_surveyor"]'::jsonb,
  '["Level 4 ADS CMV","autonomous truck","driverless truck"]'::jsonb,
  '["all_us_interstates","i-10","i-35","i-40","i-70","i-80","i-90"]'::jsonb,
  'comment_open',
  'Aurora Operations Inc.',
  'Replace required reflective triangles and fusees with cab-mounted LED warning beacons for Level 4 ADS-equipped CMVs',
  '2026-05-15',
  '["https://www.regulations.gov/docket/FMCSA-2026-0958","https://www.fmcsa.dot.gov/"]'::jsonb,
  7,
  9,
  '["regulatory_alert","equipment_marketplace","training","corridor_risk","data_product","sponsored_compliance"]'::jsonb,
  '["Autonomous truck compliance","Roadside safety","Pilot car emergency procedures","Oversize route risk","Corridor safety scoring","Regulatory intelligence products","Equipment marketplace"]'::jsonb,
  'regulations/us/fmcsa/aurora-warning-device-exemption-fmcsa-2026-0958',
  false,
  true
)
on conflict (docket_id) do update set
  title = excluded.title,
  summary = excluded.summary,
  plain_english = excluded.plain_english,
  affected_rules = excluded.affected_rules,
  affected_roles = excluded.affected_roles,
  affected_vehicle_types = excluded.affected_vehicle_types,
  affected_corridors = excluded.affected_corridors,
  status = excluded.status,
  company_requesting = excluded.company_requesting,
  requested_change = excluded.requested_change,
  comment_deadline = excluded.comment_deadline,
  source_urls = excluded.source_urls,
  risk_score = excluded.risk_score,
  opportunity_score = excluded.opportunity_score,
  monetization_tags = excluded.monetization_tags,
  haul_command_relevance = excluded.haul_command_relevance,
  page_slug = excluded.page_slug,
  updated_at = now();

commit;
