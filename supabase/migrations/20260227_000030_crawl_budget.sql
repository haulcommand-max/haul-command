begin;

create table if not exists public.crawl_budget_policy (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  page_type text not null,
  max_indexable int not null default 5000,
  promote_threshold numeric not null default 1.10, -- demand_score gate
  demote_threshold numeric not null default 0.85,  -- demand_score gate
  enabled boolean not null default true,
  unique (country_code, page_type)
);

create table if not exists public.crawl_budget_state (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  page_type text not null,
  currently_indexable int not null default 0,
  last_run_at timestamptz null,
  unique (country_code, page_type)
);

commit;
