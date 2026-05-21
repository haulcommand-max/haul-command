-- Haul Command Tool OS QA gate
-- Upgrade-only: adds route/content verification fields to the existing registry.
-- Public hubs must not treat page_url as proof that a tool exists.

do $$
begin
  if to_regclass('public.hc_tool_registry') is null then
    return;
  end if;

  alter table public.hc_tool_registry
    add column if not exists route_status integer,
    add column if not exists qa_status text not null default 'pending',
    add column if not exists content_status text not null default 'pending',
    add column if not exists indexing_status text not null default 'coming_soon',
    add column if not exists canonical_tool_slug text,
    add column if not exists source_confidence text not null default 'unverified',
    add column if not exists last_verified_at timestamptz,
    add column if not exists last_crawled_at timestamptz,
    add column if not exists coverage_verified boolean not null default false;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.hc_tool_registry'::regclass
      and conname = 'hc_tool_registry_qa_status_check'
  ) then
    alter table public.hc_tool_registry
      add constraint hc_tool_registry_qa_status_check
      check (qa_status in ('pending','pass','fail','manual_review','blocked'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.hc_tool_registry'::regclass
      and conname = 'hc_tool_registry_content_status_check'
  ) then
    alter table public.hc_tool_registry
      add constraint hc_tool_registry_content_status_check
      check (content_status in ('pending','valid','placeholder','wrong_intent','thin','broken','blocked'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.hc_tool_registry'::regclass
      and conname = 'hc_tool_registry_indexing_status_check'
  ) then
    alter table public.hc_tool_registry
      add constraint hc_tool_registry_indexing_status_check
      check (indexing_status in (
        'indexable_flagship',
        'canonical_child',
        'noindex_interactive',
        'coming_soon',
        'merged',
        'retired',
        'hidden'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.hc_tool_registry'::regclass
      and conname = 'hc_tool_registry_source_confidence_check'
  ) then
    alter table public.hc_tool_registry
      add constraint hc_tool_registry_source_confidence_check
      check (source_confidence in ('verified','source_backed','partially_verified','unverified'));
  end if;

  create index if not exists idx_hc_tool_registry_qa_open_gate
    on public.hc_tool_registry (route_status, qa_status, content_status, indexing_status)
    where page_url is not null;

  create index if not exists idx_hc_tool_registry_last_crawled
    on public.hc_tool_registry (last_crawled_at);

  comment on column public.hc_tool_registry.route_status is
    'Last crawled HTTP status for page_url. Open Tool requires 200.';
  comment on column public.hc_tool_registry.qa_status is
    'Crawler QA state. Open Tool requires pass.';
  comment on column public.hc_tool_registry.content_status is
    'Content quality state. Open Tool requires valid.';
  comment on column public.hc_tool_registry.indexing_status is
    'SEO publication state. Sitemap/schema inclusion requires an index-ready value.';
end $$;
