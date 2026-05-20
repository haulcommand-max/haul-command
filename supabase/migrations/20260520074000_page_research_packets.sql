create extension if not exists pgcrypto;

create table if not exists public.hc_page_research_packets (
  id uuid primary key default gen_random_uuid(),
  target_url text not null,
  page_family text,
  role_id text,
  country text,
  region text,
  city text,
  corridor text,
  search_intent text,
  buyer_intent text,
  provider_intent text,
  advertiser_intent text,
  top_serp_urls jsonb not null default '[]'::jsonb,
  bing_result_urls jsonb not null default '[]'::jsonb,
  paa_questions jsonb not null default '[]'::jsonb,
  competitor_urls jsonb not null default '[]'::jsonb,
  authority_sources jsonb not null default '[]'::jsonb,
  forum_pain_points jsonb not null default '[]'::jsonb,
  review_pain_points jsonb not null default '[]'::jsonb,
  competitor_gaps jsonb not null default '[]'::jsonb,
  internal_link_targets jsonb not null default '[]'::jsonb,
  unique_data_modules jsonb not null default '[]'::jsonb,
  recommended_schema jsonb not null default '[]'::jsonb,
  recommended_media jsonb not null default '[]'::jsonb,
  unique_haul_command_angle text,
  provider_record_count integer not null default 0,
  redundancy_score numeric(4,3) not null default 0,
  source_confidence text not null default 'low' check (source_confidence in ('low','medium','high')),
  publish_score integer not null default 0,
  indexability_decision text not null default 'noindex' check (indexability_decision in ('indexable','draft','noindex')),
  score_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_page_research_packets_target_unique unique (target_url)
);

create index if not exists idx_hc_page_research_packets_decision
  on public.hc_page_research_packets(indexability_decision, publish_score desc);

create index if not exists idx_hc_page_research_packets_geo
  on public.hc_page_research_packets(country, region, city);

create index if not exists idx_hc_page_research_packets_role
  on public.hc_page_research_packets(role_id);

create trigger trg_hc_page_research_packets_updated_at
  before update on public.hc_page_research_packets
  for each row execute function public.hc_set_updated_at();

alter table public.hc_page_research_packets enable row level security;

drop policy if exists hc_page_research_packets_deny_anon_auth on public.hc_page_research_packets;
create policy hc_page_research_packets_deny_anon_auth
  on public.hc_page_research_packets
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on table public.hc_page_research_packets is
  'Core 30 research packets used to decide whether programmatic role/place/intent pages deserve indexable publication.';
