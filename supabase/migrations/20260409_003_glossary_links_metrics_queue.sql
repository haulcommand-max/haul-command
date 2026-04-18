begin;

create table if not exists public.glo_term_links (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.glo_terms(id) on delete cascade,
  link_type text not null
    check (link_type in (
      'related_regulation',
      'related_tool',
      'related_corridor',
      'related_location',
      'related_service',
      'related_category',
      'next_action',
      'claim_path',
      'sponsor_path',
      'marketplace_path'
    )),
  target_type text not null,
  target_id text not null,
  anchor_text text,
  priority integer not null default 50 check (priority between 1 and 100),
  is_auto_generated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (term_id, link_type, target_type, target_id)
);

create table if not exists public.glo_term_metrics (
  term_id uuid primary key references public.glo_terms(id) on delete cascade,
  pageviews_30d integer not null default 0,
  entrances_30d integer not null default 0,
  ctr_search_30d numeric(6,2),
  claim_clicks_30d integer not null default 0,
  tool_clicks_30d integer not null default 0,
  regulation_clicks_30d integer not null default 0,
  sponsor_clicks_30d integer not null default 0,
  lead_clicks_30d integer not null default 0,
  exits_30d integer not null default 0,
  avg_time_seconds_30d integer,
  updated_at timestamptz not null default now()
);

create table if not exists public.glo_ingest_queue (
  id uuid primary key default gen_random_uuid(),
  queue_type text not null
    check (queue_type in (
      'seed_term',
      'seed_alias',
      'build_overlay',
      'infer_links',
      'dedupe_candidates',
      'review_due',
      'thin_page_repair',
      'source_refresh',
      'cluster_gap_scan'
    )),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  payload jsonb not null,
  source_label text,
  priority integer not null default 50 check (priority between 1 and 100),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glo_generation_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null default 'running'
    check (status in ('running', 'done', 'failed', 'cancelled')),
  input_count integer not null default 0,
  output_count integer not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.glo_quality_scores (
  term_id uuid primary key references public.glo_terms(id) on delete cascade,
  definition_score integer not null default 0 check (definition_score between 0 and 100),
  link_score integer not null default 0 check (link_score between 0 and 100),
  geo_score integer not null default 0 check (geo_score between 0 and 100),
  trust_score integer not null default 0 check (trust_score between 0 and 100),
  commercial_score integer not null default 0 check (commercial_score between 0 and 100),
  voice_score integer not null default 0 check (voice_score between 0 and 100),
  overall_score integer generated always as (
    ((definition_score + link_score + geo_score + trust_score + commercial_score + voice_score) / 6)
  ) stored,
  notes text,
  updated_at timestamptz not null default now()
);

create index if not exists glo_term_links_term_idx on public.glo_term_links(term_id, priority desc);
create index if not exists glo_ingest_queue_status_idx on public.glo_ingest_queue(status, priority desc, created_at asc);

drop trigger if exists trg_glo_ingest_queue_updated_at on public.glo_ingest_queue;
create trigger trg_glo_ingest_queue_updated_at
before update on public.glo_ingest_queue
for each row execute function public.set_updated_at();

alter table public.glo_term_links enable row level security;
alter table public.glo_term_metrics enable row level security;
alter table public.glo_ingest_queue enable row level security;
alter table public.glo_generation_runs enable row level security;
alter table public.glo_quality_scores enable row level security;

create policy if not exists glo_term_links_public_read
on public.glo_term_links for select
to anon, authenticated
using (true);

create policy if not exists glo_term_links_auth_write
on public.glo_term_links for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_term_metrics_public_read
on public.glo_term_metrics for select
to anon, authenticated
using (true);

create policy if not exists glo_term_metrics_auth_write
on public.glo_term_metrics for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_ingest_queue_auth_read
on public.glo_ingest_queue for select
to authenticated
using (true);

create policy if not exists glo_ingest_queue_auth_write
on public.glo_ingest_queue for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_generation_runs_auth_read
on public.glo_generation_runs for select
to authenticated
using (true);

create policy if not exists glo_generation_runs_auth_write
on public.glo_generation_runs for all
to authenticated
using (true)
with check (true);

create policy if not exists glo_quality_scores_public_read
on public.glo_quality_scores for select
to anon, authenticated
using (true);

create policy if not exists glo_quality_scores_auth_write
on public.glo_quality_scores for all
to authenticated
using (true)
with check (true);

commit;
