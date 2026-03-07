begin;

-- 1) Link weight signals (daily/rolling demand data per page)
create table if not exists public.link_weight_signals (
  id uuid primary key default gen_random_uuid(),
  seo_page_id uuid not null references public.seo_pages(id) on delete cascade,
  signal_date date not null,
  -- demand signals
  gsc_impressions bigint not null default 0,
  gsc_clicks bigint not null default 0,
  gsc_avg_position numeric null,
  analytics_pageviews bigint not null default 0,
  analytics_sessions bigint not null default 0,
  internal_searches bigint not null default 0,
  bookings bigint not null default 0,
  lead_submits bigint not null default 0,
  -- recency/freshness
  last_content_update_at timestamptz null,
  last_review_at timestamptz null,
  review_velocity_7d int not null default 0,
  -- computed outputs
  demand_score numeric not null default 0,
  link_weight numeric not null default 1,
  tier_hint text null, -- M1/M2/M3 or similar
  created_at timestamptz not null default now(),
  unique (seo_page_id, signal_date)
);

create index if not exists link_weight_signals_page_date_idx
  on public.link_weight_signals(seo_page_id, signal_date desc);

-- 2) Internal link policy (from → to page type budgets)
create table if not exists public.internal_link_policy (
  id uuid primary key default gen_random_uuid(),
  from_page_type text not null,
  to_page_type text not null,
  base_link_count int not null default 8,
  max_link_count int not null default 24,
  weight_multiplier numeric not null default 1,
  enabled boolean not null default true,
  unique (from_page_type, to_page_type)
);

commit;
