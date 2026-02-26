-- ============================================================================
-- International SEO Core: Multilingual Page Factory + Keywords + Views
-- ============================================================================

-- ── SEO Page Concepts ──────────────────────────────────────────────────────
create table if not exists public.seo_page_concepts (
  id uuid primary key default gen_random_uuid(),
  concept_key text not null unique,   -- "corridor:i-75", "port:port-of-houston", "city:gainesville-fl"
  entity_type geo_entity_type not null,
  entity_id uuid not null,
  template_key text not null,         -- "city_home", "corridor", "port", "category_city"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spc_entity_idx on public.seo_page_concepts(entity_type, entity_id);
create index if not exists spc_template_idx on public.seo_page_concepts(template_key);


-- ── SEO Locales ────────────────────────────────────────────────────────────
create table if not exists public.seo_locales (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  language_code text not null,        -- en, es, fr, pt-br, de, sv, no, ar
  hreflang text not null,             -- en-us, fr-ca, es-mx, de-de
  is_default boolean not null default false,
  is_active boolean not null default true,
  unique(country_code, language_code),
  unique(hreflang)
);

-- Seed active locales for all 11 markets
insert into public.seo_locales (country_code, language_code, hreflang, is_default) values
  ('US', 'en', 'en-us', true),
  ('US', 'es', 'es-us', false),
  ('CA', 'en', 'en-ca', false),
  ('CA', 'fr', 'fr-ca', false),
  ('AU', 'en', 'en-au', false),
  ('GB', 'en', 'en-gb', false),
  ('NZ', 'en', 'en-nz', false),
  ('SE', 'sv', 'sv-se', false),
  ('SE', 'en', 'en-se', false),
  ('NO', 'no', 'no-no', false),
  ('NO', 'en', 'en-no', false),
  ('AE', 'en', 'en-ae', false),
  ('AE', 'ar', 'ar-ae', false),
  ('SA', 'ar', 'ar-sa', false),
  ('SA', 'en', 'en-sa', false),
  ('DE', 'de', 'de-de', false),
  ('DE', 'en', 'en-de', false),
  ('ZA', 'en', 'en-za', false)
on conflict do nothing;


-- ── SEO Page Variants (localized versions of concepts) ─────────────────────
create table if not exists public.seo_page_variants (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.seo_page_concepts(id) on delete cascade,
  locale_id uuid not null references public.seo_locales(id) on delete restrict,

  path text not null unique,            -- "/us/en/corridor/i-75"
  canonical_path text not null,         -- self-canonical per variant

  title text,
  meta_description text,
  body_md text,
  blocks jsonb not null default '[]'::jsonb,

  indexing_mode text not null default 'preview',  -- preview | index | noindex
  quality_score numeric(6,2) not null default 0,

  -- Duplicate/staleness tracking
  content_hash text,
  last_material_change_at timestamptz,

  last_built_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(concept_id, locale_id)
);

create index if not exists spv_locale_idx on public.seo_page_variants(locale_id);
create index if not exists spv_concept_idx on public.seo_page_variants(concept_id);
create index if not exists spv_indexing_idx on public.seo_page_variants(indexing_mode);
create index if not exists spv_hash_idx on public.seo_page_variants(content_hash);
create index if not exists spv_quality_idx on public.seo_page_variants(quality_score desc);


-- ── Keyword Clusters ───────────────────────────────────────────────────────
create table if not exists public.keyword_clusters (
  id uuid primary key default gen_random_uuid(),
  locale_id uuid not null references public.seo_locales(id),
  cluster_key text not null,           -- "oversize_escort_near_me"
  intent text not null,                -- commercial | informational | navigational | transactional
  topic text not null,                 -- "pilot car", "oversize escort", "permits"
  priority_score numeric(8,3) not null default 0,
  created_at timestamptz not null default now(),
  unique(locale_id, cluster_key)
);

create index if not exists kc_locale_idx on public.keyword_clusters(locale_id);
create index if not exists kc_topic_idx on public.keyword_clusters(topic);
create index if not exists kc_priority_idx on public.keyword_clusters(priority_score desc);


-- ── Keywords (native per locale, NOT translations) ─────────────────────────
create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  locale_id uuid not null references public.seo_locales(id),
  keyword text not null,
  normalized_keyword text not null,
  cluster_id uuid references public.keyword_clusters(id) on delete set null,

  source text not null,                -- gsc | autocomplete | internal_search | manual | serp
  avg_monthly_searches bigint,
  difficulty numeric(6,2),
  cpc numeric(12,4),

  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique(locale_id, normalized_keyword)
);

create index if not exists kw_locale_idx on public.keywords(locale_id);
create index if not exists kw_cluster_idx on public.keywords(cluster_id);
create index if not exists kw_source_idx on public.keywords(source);


-- ── Keyword → Entity Targets ──────────────────────────────────────────────
create table if not exists public.keyword_entity_targets (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references public.keywords(id) on delete cascade,
  entity_type geo_entity_type not null,
  entity_id uuid not null,
  concept_id uuid references public.seo_page_concepts(id) on delete set null,
  target_path text,
  confidence numeric(6,3) not null default 0.5,
  created_at timestamptz not null default now(),
  unique(keyword_id, entity_type, entity_id)
);

create index if not exists ket_concept_idx on public.keyword_entity_targets(concept_id);
create index if not exists ket_entity_idx on public.keyword_entity_targets(entity_type, entity_id);


-- ── Concept × Locale Eligibility ──────────────────────────────────────────
create table if not exists public.concept_locale_eligibility (
  concept_id uuid not null references public.seo_page_concepts(id) on delete cascade,
  locale_id uuid not null references public.seo_locales(id) on delete cascade,
  eligible boolean not null default true,
  reason text,
  primary key (concept_id, locale_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Hreflang sets: all variants per concept (for mesh generation)
create or replace view public.v_hreflang_sets as
select
  c.id as concept_id,
  c.concept_key,
  v.id as variant_id,
  v.path,
  v.indexing_mode,
  l.hreflang,
  l.is_default
from public.seo_page_concepts c
join public.seo_page_variants v on v.concept_id = c.id
join public.seo_locales l on l.id = v.locale_id
where l.is_active = true;

-- Sitemap URL feed: indexable only
create or replace view public.v_sitemap_urls as
select
  v.path,
  v.updated_at as lastmod,
  l.hreflang,
  l.country_code,
  l.language_code,
  c.template_key,
  v.concept_id
from public.seo_page_variants v
join public.seo_locales l on l.id = v.locale_id
join public.seo_page_concepts c on c.id = v.concept_id
where v.indexing_mode = 'index';

-- 28-day market signals rollup per entity
create or replace view public.v_market_signals_28d as
select
  entity_type,
  entity_id,
  sum(loads_posted) as loads_posted_28d,
  sum(escorts_available) as escorts_available_28d,
  sum(matches_accepted) as matches_accepted_28d,
  sum(jobs_completed) as jobs_completed_28d,
  sum(review_count) as review_count_28d,
  case when sum(review_count) > 0 then
    round((sum(avg_review_rating * review_count) / nullif(sum(review_count),0))::numeric, 2)
  else null end as avg_review_rating_28d
from public.market_signals_daily
where day >= (current_date - interval '28 days')
group by 1, 2;

-- 28-day GSC rollup per page
create or replace view public.v_gsc_page_28d as
select
  page_path,
  sum(impressions) as impressions_28d,
  sum(clicks) as clicks_28d,
  case when sum(impressions) > 0
    then (sum(clicks)::numeric / sum(impressions)::numeric)
    else null end as ctr_28d,
  avg(avg_position) as avg_position_28d
from public.gsc_query_metrics
where day >= (current_date - interval '28 days')
group by 1;

-- Duplicate variants (same hash across >1 variant in same locale+template)
create or replace view public.v_duplicate_variants as
select
  v.locale_id,
  c.template_key,
  v.content_hash,
  count(*) as variant_count,
  array_agg(v.path order by v.path) as paths
from public.seo_page_variants v
join public.seo_page_concepts c on c.id = v.concept_id
where v.content_hash is not null
group by 1, 2, 3
having count(*) > 1;

-- Query cannibalization: 3+ pages competing for same query (28d)
create or replace view public.v_query_cannibalization_28d as
select
  query,
  count(distinct page_path) as pages_competing,
  sum(impressions) as impressions_28d,
  sum(clicks) as clicks_28d
from public.gsc_query_metrics
where day >= (current_date - interval '28 days')
group by 1
having count(distinct page_path) >= 3
   and sum(impressions) >= 100;


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.seo_page_concepts enable row level security;
alter table public.seo_locales enable row level security;
alter table public.seo_page_variants enable row level security;
alter table public.keyword_clusters enable row level security;
alter table public.keywords enable row level security;
alter table public.keyword_entity_targets enable row level security;
alter table public.concept_locale_eligibility enable row level security;

-- Public read for SEO content
create policy spc_read on public.seo_page_concepts for select using (true);
create policy spc_write on public.seo_page_concepts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy sl_read on public.seo_locales for select using (true);
create policy sl_write on public.seo_locales for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy spv_read on public.seo_page_variants for select using (true);
create policy spv_write on public.seo_page_variants for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy kc_read on public.keyword_clusters for select using (auth.role() = 'service_role');
create policy kc_write on public.keyword_clusters for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy kw_read on public.keywords for select using (auth.role() = 'service_role');
create policy kw_write on public.keywords for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy ket_read on public.keyword_entity_targets for select using (auth.role() = 'service_role');
create policy ket_write on public.keyword_entity_targets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy cle_read on public.concept_locale_eligibility for select using (true);
create policy cle_write on public.concept_locale_eligibility for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════════════════════
-- Updated-at triggers
-- ═══════════════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'seo_page_concepts_updated') then
    create trigger seo_page_concepts_updated before update on public.seo_page_concepts
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'seo_page_variants_updated') then
    create trigger seo_page_variants_updated before update on public.seo_page_variants
    for each row execute function set_updated_at();
  end if;
end$$;
