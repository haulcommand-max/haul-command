-- Migration: 20260429_124_ai_search_visibility_os.sql
-- Turns AI-search guidance into data infrastructure: prompt clusters, fanout coverage, readiness scoring, and visibility tests.

begin;

create table if not exists public.hc_ai_prompt_clusters (
  id uuid primary key default gen_random_uuid(),
  parent_prompt text not null unique,
  cluster_slug text not null unique,
  page_family text not null,
  country_code text,
  region_code text,
  role_context text[] default '{}',
  primary_url text,
  commercial_goal text,
  status text default 'draft' check (status in ('draft','active','retired')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hc_ai_fanout_subqueries (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.hc_ai_prompt_clusters(id) on delete cascade,
  subquery text not null,
  subtopic_slug text not null,
  intent_type text default 'informational' check (intent_type in ('informational','commercial','regulatory','training','local','transactional','safety','data_product')),
  priority int default 50 check (priority between 1 and 100),
  expected_url text,
  source_requirement text default 'none' check (source_requirement in ('none','official_source','state_overlay','country_overlay','internal_data','human_review')),
  created_at timestamptz default now(),
  unique(cluster_id, subtopic_slug)
);

create table if not exists public.hc_ai_page_coverage (
  id uuid primary key default gen_random_uuid(),
  page_url text not null,
  page_type text not null,
  cluster_id uuid references public.hc_ai_prompt_clusters(id) on delete set null,
  covered_subtopics text[] default '{}',
  missing_subtopics text[] default '{}',
  fanout_coverage_score int default 0 check (fanout_coverage_score between 0 and 100),
  has_short_answer_block boolean default false,
  has_source_trail boolean default false,
  has_last_reviewed_date boolean default false,
  has_related_terms boolean default false,
  has_related_training boolean default false,
  has_schema_json_ld boolean default false,
  has_scope_warning boolean default false,
  has_commercial_cta boolean default false,
  has_canonical_url boolean default false,
  has_internal_links boolean default false,
  ai_search_readiness_score int default 0 check (ai_search_readiness_score between 0 and 100),
  readiness_status text default 'incomplete' check (readiness_status in ('elite','pass','needs_work','incomplete')),
  last_audited_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(page_url, cluster_id)
);

create table if not exists public.hc_ai_visibility_tests (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references public.hc_ai_prompt_clusters(id) on delete set null,
  prompt text not null,
  platform text not null check (platform in ('chatgpt','perplexity','gemini','google_ai_overview','google_ai_mode','copilot','claude','other')),
  test_run_label text,
  run_count int default 1 check (run_count > 0),
  created_at timestamptz default now()
);

create table if not exists public.hc_ai_citation_results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.hc_ai_visibility_tests(id) on delete cascade,
  run_number int default 1,
  haul_command_mentioned boolean default false,
  haul_command_cited boolean default false,
  cited_urls text[] default '{}',
  competitor_urls text[] default '{}',
  missing_topics text[] default '{}',
  answer_accuracy_score int check (answer_accuracy_score between 0 and 100),
  notes text,
  observed_at timestamptz default now()
);

create index if not exists idx_hc_ai_prompt_clusters_status on public.hc_ai_prompt_clusters(status);
create index if not exists idx_hc_ai_prompt_clusters_page_family on public.hc_ai_prompt_clusters(page_family);
create index if not exists idx_hc_ai_fanout_cluster on public.hc_ai_fanout_subqueries(cluster_id);
create index if not exists idx_hc_ai_page_coverage_url on public.hc_ai_page_coverage(page_url);
create index if not exists idx_hc_ai_page_coverage_status on public.hc_ai_page_coverage(readiness_status);
create index if not exists idx_hc_ai_visibility_tests_platform on public.hc_ai_visibility_tests(platform);
create index if not exists idx_hc_ai_citation_results_test on public.hc_ai_citation_results(test_id);

alter table public.hc_ai_prompt_clusters enable row level security;
alter table public.hc_ai_fanout_subqueries enable row level security;
alter table public.hc_ai_page_coverage enable row level security;
alter table public.hc_ai_visibility_tests enable row level security;
alter table public.hc_ai_citation_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hc_ai_prompt_clusters' and policyname='Public read active AI prompt clusters') then
    create policy "Public read active AI prompt clusters" on public.hc_ai_prompt_clusters for select using (status = 'active');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hc_ai_fanout_subqueries' and policyname='Public read fanout subqueries for active clusters') then
    create policy "Public read fanout subqueries for active clusters" on public.hc_ai_fanout_subqueries for select using (exists (select 1 from public.hc_ai_prompt_clusters c where c.id = cluster_id and c.status = 'active'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hc_ai_page_coverage' and policyname='Public read passing AI page coverage') then
    create policy "Public read passing AI page coverage" on public.hc_ai_page_coverage for select using (readiness_status in ('pass','elite'));
  end if;

  foreach _tbl in array array['hc_ai_prompt_clusters','hc_ai_fanout_subqueries','hc_ai_page_coverage','hc_ai_visibility_tests','hc_ai_citation_results'] loop
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'Service role full access ' || _tbl, _tbl);
  end loop;
exception when duplicate_object then
  null;
end $$;

with cluster as (
  insert into public.hc_ai_prompt_clusters (parent_prompt, cluster_slug, page_family, country_code, region_code, role_context, primary_url, commercial_goal, status)
  values
    ('What is a pilot car?', 'what-is-a-pilot-car', 'beginner_education', null, null, ARRAY['pilot_car_operator','broker','carrier','public'], '/what-is-a-pilot-car', 'Move users into training, directory search, claim listing, and post-load actions.', 'active'),
    ('Do I need a pilot car in Florida?', 'florida-pilot-car-requirements', 'state_regulation', 'US', 'FL', ARRAY['pilot_car_operator','broker','carrier','permit_filer'], '/regulations/us/florida-pilot-car-requirements', 'Move users into Florida training, Florida directory, rates, and corridor pages.', 'active'),
    ('How do oversize loads move safely through work zones?', 'work-zone-oversize-load-safety', 'public_safety', 'US', null, ARRAY['pilot_car_operator','carrier','route_surveyor','public'], '/safety/how-to-drive-near-an-oversize-load', 'Move users into safety training, route survey tools, and corridor risk intelligence.', 'active'),
    ('Are warning beacons replacing triangles for driverless trucks?', 'autonomous-truck-warning-device-exemption', 'regulatory_watch', 'US', null, ARRAY['carrier','safety_director','equipment_supplier','pilot_car_operator'], '/regulations/us/fmcsa/aurora-warning-device-exemption-fmcsa-2026-0958', 'Move users into Regulatory Radar, equipment marketplace, and autonomous freight intelligence.', 'active')
  on conflict (parent_prompt) do update set
    primary_url = excluded.primary_url,
    commercial_goal = excluded.commercial_goal,
    status = excluded.status,
    updated_at = now()
  returning id, cluster_slug
)
insert into public.hc_ai_fanout_subqueries (cluster_id, subquery, subtopic_slug, intent_type, priority, expected_url, source_requirement)
select c.id, v.subquery, v.subtopic_slug, v.intent_type, v.priority, v.expected_url, v.source_requirement
from public.hc_ai_prompt_clusters c
join (values
  ('what-is-a-pilot-car','pilot car definition','pilot-car-definition','informational',100,'/what-is-a-pilot-car','none'),
  ('what-is-a-pilot-car','PEVO definition','pevo-definition','training',95,'/glossary/pilot-escort-vehicle-operator','official_source'),
  ('what-is-a-pilot-car','lead car vs chase car','lead-vs-chase','informational',90,'/glossary/lead-car','none'),
  ('what-is-a-pilot-car','high pole car','high-pole-car','training',88,'/glossary/high-pole-car','official_source'),
  ('what-is-a-pilot-car','steerman','steerman','informational',70,'/glossary/steerman','none'),
  ('what-is-a-pilot-car','how to become a pilot car operator','become-operator','commercial',85,'/training/what-is-a-pilot-car','none'),
  ('what-is-a-pilot-car','find pilot car operators near me','find-operators','local',85,'/directory','internal_data'),
  ('florida-pilot-car-requirements','Florida PEVO flagging','florida-pevo-flagging','training',100,'/training/florida-pevo-flagging-workbook-2025','official_source'),
  ('florida-pilot-car-requirements','Florida Administrative Code 14-26','fac-14-26','regulatory',100,'/glossary/florida-administrative-code-14-26','official_source'),
  ('florida-pilot-car-requirements','Florida escort checklist','florida-escort-checklist','training',92,'/glossary/florida-escort-checklist','official_source'),
  ('florida-pilot-car-requirements','Florida height pole six inch clearance','florida-height-pole-six-inch','regulatory',88,'/glossary/height-pole-six-inch-clearance-florida','official_source'),
  ('florida-pilot-car-requirements','Florida pilot car directory','florida-directory','local',80,'/directory/us/fl','internal_data'),
  ('work-zone-oversize-load-safety','MUTCD','mutcd','regulatory',95,'/glossary/mutcd','official_source'),
  ('work-zone-oversize-load-safety','temporary traffic control','temporary-traffic-control','safety',92,'/glossary/temporary-traffic-control','official_source'),
  ('work-zone-oversize-load-safety','transportation management plan','transportation-management-plan','safety',85,'/glossary/transportation-management-plan','official_source'),
  ('work-zone-oversize-load-safety','route survey work zone risk','route-survey-work-zone-risk','training',88,'/training/route-survey-work-zone-risk','official_source'),
  ('autonomous-truck-warning-device-exemption','FMCSA docket FMCSA-2026-0958','fmcsa-2026-0958','regulatory',100,'/regulations/us/fmcsa/aurora-warning-device-exemption-fmcsa-2026-0958','official_source'),
  ('autonomous-truck-warning-device-exemption','49 CFR 392.22 warning triangles','49-cfr-392-22','regulatory',95,'/glossary/49-cfr-392-22','official_source'),
  ('autonomous-truck-warning-device-exemption','cab-mounted warning beacons','cab-mounted-warning-beacons','equipment',90,'/safety/warning-triangles-vs-beacons','official_source'),
  ('autonomous-truck-warning-device-exemption','Level 4 ADS','level-4-ads','informational',88,'/glossary/level-4-ads','official_source'),
  ('autonomous-truck-warning-device-exemption','Regulatory Radar','regulatory-radar','commercial',85,'/regulatory-radar','internal_data')
) as v(cluster_slug, subquery, subtopic_slug, intent_type, priority, expected_url, source_requirement)
on c.cluster_slug = v.cluster_slug
on conflict (cluster_id, subtopic_slug) do update set
  subquery = excluded.subquery,
  intent_type = excluded.intent_type,
  priority = excluded.priority,
  expected_url = excluded.expected_url,
  source_requirement = excluded.source_requirement;

commit;
