-- =====================================================================
-- Haul Command — Blog Visuals & SEO Upgrade
-- Generated: 2026-04-09
-- Purpose: Add hero_image_url, og_image_url, excerpt, schema_markup,
--          and visual_assets columns to hc_blog_articles.
--          Create hc_content_generation_queue for autonomous content OS.
-- Mode: ADDITIVE ONLY — no existing columns or data are modified.
-- =====================================================================
begin;

-- =====================================================================
-- 1) Upgrade hc_blog_articles with visual + SEO columns
-- =====================================================================
do $$
begin
  -- hero_image_url: Full-width hero image for article pages
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_blog_articles' and column_name = 'hero_image_url'
  ) then
    alter table public.hc_blog_articles add column hero_image_url text;
  end if;

  -- og_image_url: OpenGraph/Twitter card image (1200x630)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_blog_articles' and column_name = 'og_image_url'
  ) then
    alter table public.hc_blog_articles add column og_image_url text;
  end if;

  -- excerpt: AI-generated 160-char SEO excerpt for meta description
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_blog_articles' and column_name = 'excerpt'
  ) then
    alter table public.hc_blog_articles add column excerpt text;
  end if;

  -- schema_markup: JSON-LD structured data for article pages
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_blog_articles' and column_name = 'schema_markup'
  ) then
    alter table public.hc_blog_articles add column schema_markup jsonb;
  end if;

  -- visual_assets: Array of {url, type, caption} for in-article visuals
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_blog_articles' and column_name = 'visual_assets'
  ) then
    alter table public.hc_blog_articles add column visual_assets jsonb default '[]'::jsonb;
  end if;
end $$;

-- Index: Fast lookup for articles missing hero images (Visual Retrofit Worker target)
create index if not exists idx_blog_articles_hero_image
  on public.hc_blog_articles (id)
  where hero_image_url is null;


-- =====================================================================
-- 2) Content Generation Queue — autonomous Content OS backbone
-- =====================================================================
create table if not exists public.hc_content_generation_queue (
  id            uuid primary key default gen_random_uuid(),
  task_type     text not null check (task_type in ('text', 'visual', 'seo_meta', 'schema_markup', 'interlink')),
  target_table  text not null,
  target_id     uuid not null,
  priority      int not null default 5 check (priority between 1 and 10),
  status        text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'skipped')),
  payload       jsonb default '{}'::jsonb,
  result        jsonb,
  attempts      int not null default 0,
  max_attempts  int not null default 3,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- Indexes for worker polling
create index if not exists idx_content_queue_pending
  on public.hc_content_generation_queue (priority desc, created_at asc)
  where status = 'pending';

create index if not exists idx_content_queue_target
  on public.hc_content_generation_queue (target_table, target_id);

-- Enable RLS immediately
alter table public.hc_content_generation_queue enable row level security;

-- Service-role only — no public access to generation queue
-- (RLS enabled with zero policies = deny-by-default for anon+authenticated)

commit;
