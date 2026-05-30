-- Haul Command SEO/AEO recovery imports for Ahrefs/GSC CSVs.
-- Non-destructive: keeps existing page, backlink, GSC, and quality-score rails canonical.

begin;

create table if not exists public.seo_import_batches (
  id uuid primary key default gen_random_uuid(),
  import_source text not null check (import_source in ('ahrefs','gsc','manual','search_console','other')),
  import_kind text not null,
  source_filename text,
  uploaded_by uuid references auth.users(id) on delete set null,
  status text not null default 'uploaded' check (status in ('uploaded','processing','processed','failed','ignored')),
  raw_row_count integer not null default 0,
  processed_row_count integer not null default 0,
  rejected_row_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.seo_ahrefs_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.seo_import_batches(id) on delete cascade,
  row_number integer not null,
  export_type text not null check (export_type in ('backlinks','referring_domains','anchors','best_by_links','organic_keywords','top_pages','broken_backlinks','site_audit','crawled_pages')),
  source_domain text,
  source_url text,
  target_url text,
  anchor_text text,
  first_seen date,
  last_seen date,
  link_status text,
  nofollow boolean,
  domain_rating numeric(6,2),
  domain_traffic bigint,
  linked_domains integer,
  ahrefs_rank numeric,
  url_rating numeric(6,2),
  organic_keywords integer,
  organic_traffic bigint,
  issue_type text,
  severity text,
  raw jsonb not null default '{}'::jsonb,
  spam_flag boolean not null default false,
  relevance_category text not null default 'unknown' check (relevance_category in ('real_industry','local_business','supplier_vendor','association','government','education','media','directory','social','spam','unknown')),
  quality_class text not null default 'unknown' check (quality_class in ('real_industry','local_business','supplier_vendor','association','government','education','media','directory','social','spam','unknown')),
  quality_score integer not null default 0,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

create table if not exists public.seo_gsc_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.seo_import_batches(id) on delete cascade,
  row_number integer not null,
  day date,
  page_path text,
  query text,
  country_code char(2) not null default '--',
  device text not null default '--',
  search_type text not null default '--',
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  ctr numeric(8,6),
  avg_position numeric(8,3),
  raw jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index if not exists seo_import_batches_source_kind_idx
  on public.seo_import_batches(import_source, import_kind, created_at desc);
create index if not exists seo_ahrefs_import_domain_idx
  on public.seo_ahrefs_import_rows(source_domain);
create index if not exists seo_ahrefs_import_target_idx
  on public.seo_ahrefs_import_rows(target_url);
create index if not exists seo_ahrefs_import_quality_idx
  on public.seo_ahrefs_import_rows(quality_class, quality_score desc);
create index if not exists seo_gsc_import_page_day_idx
  on public.seo_gsc_import_rows(page_path, day desc);
create index if not exists seo_gsc_import_query_day_idx
  on public.seo_gsc_import_rows(query, day desc);

create or replace function public.score_ahrefs_backlink_row(
  p_source_domain text,
  p_source_url text,
  p_anchor_text text,
  p_domain_rating numeric default null,
  p_domain_traffic bigint default null
) returns integer
language sql
stable
as $$
  select greatest(
    -100,
    least(
      100,
      0
      + case
          when coalesce(p_source_domain,'') ~* '(trucking|haul|pilot|escort|oversize|overweight|logistics|transport|freight|permit|route|carrier)' then 30
          else 0
        end
      + case
          when coalesce(p_source_domain,'') ~* '(chamber|association|dot|gov|edu|college|university|news|media)' then 25
          else 0
        end
      + case
          when coalesce(p_source_domain,'') ~* '(repair|truck|towing|yard|parking|equipment|supplier|vendor|upfit|sign|print)' then 20
          else 0
        end
      + case
          when coalesce(p_source_domain,'') ~* '(directory|listing|yellow|local)' then 10
          else 0
        end
      + case
          when coalesce(p_source_domain,'') ~* '(buybacklink|rankyourwebsite|fiverr|seoexpress|linkbuilding|backlink|guestpost|pbn)' then -50
          else 0
        end
      + case
          when coalesce(p_anchor_text,'') ~* '(buy backlinks|seo package|rank your website|guest post|casino|loan|crypto)' then -40
          else 0
        end
      + case when coalesce(p_domain_rating,0) >= 50 then 10 when coalesce(p_domain_rating,0) >= 20 then 5 else 0 end
      + case when coalesce(p_domain_traffic,0) >= 10000 then 10 when coalesce(p_domain_traffic,0) >= 1000 then 5 else 0 end
    )
  )::integer;
$$;

create or replace view public.v_seo_backlink_quality_rollup as
select
  count(*)::bigint as imported_backlink_rows,
  count(distinct nullif(source_domain,''))::bigint as imported_referring_domains,
  count(distinct nullif(source_domain,'')) filter (where spam_flag is false and quality_class <> 'spam')::bigint as real_referring_domains,
  count(distinct nullif(source_domain,'')) filter (where spam_flag is true or quality_class = 'spam')::bigint as spam_referring_domains,
  round(avg(quality_score)::numeric, 2) as avg_imported_quality_score,
  max(created_at) as last_imported_at
from public.seo_ahrefs_import_rows;

create or replace view public.v_seo_recovery_command_center as
select
  'import_batches'::text as section,
  count(*)::bigint as total_count,
  count(*) filter (where status in ('uploaded','processing'))::bigint as open_count,
  count(*) filter (where status = 'failed')::bigint as blocked_count,
  max(created_at) as last_seen_at
from public.seo_import_batches
union all
select
  'ahrefs_backlink_identity',
  imported_referring_domains,
  real_referring_domains,
  spam_referring_domains,
  last_imported_at
from public.v_seo_backlink_quality_rollup
union all
select
  'gsc_query_rows',
  count(*)::bigint,
  count(*) filter (where processed_at is null)::bigint,
  0::bigint,
  max(created_at)
from public.seo_gsc_import_rows
union all
select
  'page_quality_snapshots',
  count(*)::bigint,
  count(*) filter (where recommended_indexing <> 'index')::bigint,
  count(*) filter (where overall_score < 40)::bigint,
  max(evaluated_at)
from public.page_quality_scores;

alter table public.seo_import_batches enable row level security;
alter table public.seo_ahrefs_import_rows enable row level security;
alter table public.seo_gsc_import_rows enable row level security;

drop policy if exists seo_import_batches_service_role_all on public.seo_import_batches;
create policy seo_import_batches_service_role_all
  on public.seo_import_batches for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists seo_ahrefs_import_rows_service_role_all on public.seo_ahrefs_import_rows;
create policy seo_ahrefs_import_rows_service_role_all
  on public.seo_ahrefs_import_rows for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists seo_gsc_import_rows_service_role_all on public.seo_gsc_import_rows;
create policy seo_gsc_import_rows_service_role_all
  on public.seo_gsc_import_rows for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
