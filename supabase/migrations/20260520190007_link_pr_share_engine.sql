-- Haul Command Link + PR + Share Engine.
-- Additive bridge over existing PR, link graph, media, SEO, outreach, and
-- AdGrid systems. Internal by default; no public grants are created here.

begin;

create table if not exists public.hc_linkable_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  title text not null,
  slug text not null unique,
  asset_type text not null check (
    asset_type in (
      'data_page',
      'visual_library_item',
      'map',
      'calculator_result',
      'operator_report_card',
      'training_badge',
      'regulation_card',
      'corridor_snapshot',
      'public_safety_graphic',
      'glossary_definition',
      'media_watch_page',
      'other'
    )
  ),
  source_surface_type text not null check (
    source_surface_type in (
      'media',
      'directory',
      'training',
      'glossary',
      'regulation',
      'corridor',
      'tool',
      'data_product',
      'operator_profile',
      'adgrid',
      'manual'
    )
  ),
  source_surface_key text,
  canonical_url text,
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  role_keys text[] not null default '{}',
  corridor_keys text[] not null default '{}',
  topic_tags text[] not null default '{}',
  methodology_note text,
  source_urls text[] not null default '{}',
  source_confidence integer not null default 50 check (source_confidence between 0 and 100),
  data_as_of date,
  refresh_cadence text,
  has_downloadable_image boolean not null default false,
  has_short_video boolean not null default false,
  has_youtube_video boolean not null default false,
  has_embed_code boolean not null default false,
  has_share_button boolean not null default false,
  has_faq boolean not null default false,
  has_quote_sheet boolean not null default false,
  seo_value integer not null default 0 check (seo_value between 0 and 100),
  training_value integer not null default 0 check (training_value between 0 and 100),
  conversion_value integer not null default 0 check (conversion_value between 0 and 100),
  linkability_score integer not null default 0 check (linkability_score between 0 and 100),
  journalist_pitch_angle text,
  shareability_score integer not null default 0 check (shareability_score between 0 and 100),
  embed_available boolean not null default false,
  podcast_talking_points text[] not null default '{}',
  utm_campaign text,
  indexability_status text not null default 'needs_review' check (
    indexability_status in ('index','noindex','needs_review','internal_only')
  ),
  legal_review_status text not null default 'not_required' check (
    legal_review_status in ('not_required','pending','approved','rejected')
  ),
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_linkable_assets_publishable_requires_substance check (
    status <> 'active'
    or indexability_status <> 'index'
    or (
      source_confidence >= 60
      and array_length(source_urls, 1) is not null
      and methodology_note is not null
      and (has_downloadable_image or has_short_video or has_embed_code or has_share_button)
    )
  )
);

-- Live compatibility: an earlier linkable-asset table may already exist with a
-- smaller PR/asset schema. Keep it and add the Link + PR + Share columns needed
-- by this layer instead of replacing the existing table.
alter table public.hc_linkable_assets add column if not exists asset_key text;
alter table public.hc_linkable_assets add column if not exists asset_type text;
alter table public.hc_linkable_assets add column if not exists source_surface_type text;
alter table public.hc_linkable_assets add column if not exists source_surface_key text;
alter table public.hc_linkable_assets add column if not exists canonical_url text;
alter table public.hc_linkable_assets add column if not exists country_codes text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists region_keys text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists role_keys text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists corridor_keys text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists topic_tags text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists methodology_note text;
alter table public.hc_linkable_assets add column if not exists source_urls text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists source_confidence integer not null default 50;
alter table public.hc_linkable_assets add column if not exists data_as_of date;
alter table public.hc_linkable_assets add column if not exists refresh_cadence text;
alter table public.hc_linkable_assets add column if not exists has_downloadable_image boolean not null default false;
alter table public.hc_linkable_assets add column if not exists has_short_video boolean not null default false;
alter table public.hc_linkable_assets add column if not exists has_youtube_video boolean not null default false;
alter table public.hc_linkable_assets add column if not exists has_embed_code boolean not null default false;
alter table public.hc_linkable_assets add column if not exists has_share_button boolean not null default false;
alter table public.hc_linkable_assets add column if not exists has_faq boolean not null default false;
alter table public.hc_linkable_assets add column if not exists has_quote_sheet boolean not null default false;
alter table public.hc_linkable_assets add column if not exists seo_value integer not null default 0;
alter table public.hc_linkable_assets add column if not exists training_value integer not null default 0;
alter table public.hc_linkable_assets add column if not exists conversion_value integer not null default 0;
alter table public.hc_linkable_assets add column if not exists linkability_score integer not null default 0;
alter table public.hc_linkable_assets add column if not exists journalist_pitch_angle text;
alter table public.hc_linkable_assets add column if not exists shareability_score integer not null default 0;
alter table public.hc_linkable_assets add column if not exists embed_available boolean not null default false;
alter table public.hc_linkable_assets add column if not exists podcast_talking_points text[] not null default '{}';
alter table public.hc_linkable_assets add column if not exists utm_campaign text;
alter table public.hc_linkable_assets add column if not exists indexability_status text not null default 'needs_review';
alter table public.hc_linkable_assets add column if not exists legal_review_status text not null default 'not_required';
alter table public.hc_linkable_assets add column if not exists status text not null default 'draft';
alter table public.hc_linkable_assets add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hc_linkable_assets'
      and column_name = 'asset_kind'
  ) then
    update public.hc_linkable_assets
    set asset_key = coalesce(asset_key, slug, id::text),
        asset_type = coalesce(asset_type, asset_kind, 'other'),
        source_surface_type = coalesce(source_surface_type, 'manual'),
        canonical_url = coalesce(canonical_url, html_path),
        country_codes = case when country_codes <> '{}'::text[] then country_codes else coalesce(countries_covered, '{}'::text[]) end,
        topic_tags = case when topic_tags <> '{}'::text[] then topic_tags else coalesce(entities_referenced, '{}'::text[]) end,
        data_as_of = coalesce(data_as_of, data_period_end),
        refresh_cadence = coalesce(refresh_cadence, publish_cadence),
        has_downloadable_image = has_downloadable_image or cover_image is not null,
        has_embed_code = has_embed_code or html_path is not null,
        has_share_button = has_share_button or share_count > 0,
        status = case when published_at is not null or is_public then 'active' else status end,
        indexability_status = case when is_public and not is_gated then 'index' else indexability_status end
    where asset_key is null
      or asset_type is null
      or source_surface_type is null;
  else
    update public.hc_linkable_assets
    set asset_key = coalesce(asset_key, slug, id::text),
        asset_type = coalesce(asset_type, 'other'),
        source_surface_type = coalesce(source_surface_type, 'manual')
    where asset_key is null
      or asset_type is null
      or source_surface_type is null;
  end if;
end $$;

create unique index if not exists idx_hc_linkable_assets_asset_key_unique
  on public.hc_linkable_assets (asset_key);

create index if not exists idx_hc_linkable_assets_status
  on public.hc_linkable_assets (status, indexability_status, linkability_score desc);

create index if not exists idx_hc_linkable_assets_country
  on public.hc_linkable_assets using gin (country_codes);

create index if not exists idx_hc_linkable_assets_roles
  on public.hc_linkable_assets using gin (role_keys);

create index if not exists idx_hc_linkable_assets_topics
  on public.hc_linkable_assets using gin (topic_tags);

create table if not exists public.hc_linkable_asset_media_variants (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.hc_linkable_assets(id) on delete cascade,
  variant_type text not null check (
    variant_type in (
      'remotion_video',
      'hyperframes_clip',
      'youtube_short',
      'youtube_video',
      'downloadable_image',
      'og_image',
      'embed_widget',
      'quote_sheet',
      'newsletter_card',
      'social_card',
      'podcast_clip',
      'other'
    )
  ),
  media_url text,
  storage_path text,
  render_job_id uuid,
  width integer,
  height integer,
  duration_seconds integer,
  alt_text text,
  caption text,
  transcript_url text,
  status text not null default 'planned' check (status in ('planned','rendering','ready','failed','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_linkable_asset_media_asset
  on public.hc_linkable_asset_media_variants (asset_id, variant_type, status);

create table if not exists public.hc_share_embed_widgets (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.hc_linkable_assets(id) on delete cascade,
  widget_key text not null unique,
  widget_type text not null check (
    widget_type in (
      'share_button',
      'embed_map',
      'embed_table',
      'embed_badge',
      'embed_card',
      'download_button',
      'copy_citation',
      'social_post',
      'other'
    )
  ),
  surface_type text not null,
  surface_key text,
  attribution_text text not null default 'Source: Haul Command',
  attribution_url text not null,
  embed_template_key text,
  embed_allowed boolean not null default false,
  share_title text not null,
  share_description text,
  utm_source text not null default 'share_widget',
  utm_medium text not null default 'earned',
  utm_campaign text,
  nofollow_required boolean not null default false,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_share_embed_widgets_attribution_required check (
    attribution_text <> ''
    and attribution_url <> ''
  )
);

create index if not exists idx_hc_share_embed_widgets_asset
  on public.hc_share_embed_widgets (asset_id, widget_type, status);

create table if not exists public.hc_journalist_relationships (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  publication text,
  outlet_id uuid,
  country_codes text[] not null default '{}',
  beat_tags text[] not null default '{}',
  topic_tags text[] not null default '{}',
  prior_coverage_urls text[] not null default '{}',
  relationship_stage text not null default 'identified' check (
    relationship_stage in (
      'identified',
      'warmed',
      'source_given',
      'pitched',
      'quoted',
      'linked',
      'partner',
      'do_not_contact'
    )
  ),
  last_contacted_at timestamptz,
  source_given text,
  asset_sent_id uuid references public.hc_linkable_assets(id) on delete set null,
  follow_up_due date,
  links_earned integer not null default 0 check (links_earned >= 0),
  mentions_earned integer not null default 0 check (mentions_earned >= 0),
  consent_status text not null default 'legitimate_interest_review' check (
    consent_status in ('opted_in','legitimate_interest_review','do_not_contact','unknown')
  ),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_journalist_relationships_stage
  on public.hc_journalist_relationships (relationship_stage, follow_up_due);

create index if not exists idx_hc_journalist_relationships_country
  on public.hc_journalist_relationships using gin (country_codes);

create index if not exists idx_hc_journalist_relationships_beats
  on public.hc_journalist_relationships using gin (beat_tags);

create table if not exists public.hc_pr_request_tracker (
  id uuid primary key default gen_random_uuid(),
  source_platform text not null check (
    source_platform in (
      'haro_featured',
      'featured',
      'qwoted',
      'source_of_sources',
      'podcast',
      'newsletter',
      'direct',
      'social',
      'association',
      'manual',
      'other'
    )
  ),
  external_request_id text,
  relationship_id uuid references public.hc_journalist_relationships(id) on delete set null,
  outlet_id uuid,
  request_title text not null,
  request_text text,
  country_codes text[] not null default '{}',
  topic_tags text[] not null default '{}',
  matched_asset_id uuid references public.hc_linkable_assets(id) on delete set null,
  deadline_at timestamptz,
  response_status text not null default 'new' check (
    response_status in ('new','triaged','drafted','sent','published','declined','expired','skipped')
  ),
  response_url text,
  published_url text,
  no_spam_review_status text not null default 'pending' check (
    no_spam_review_status in ('pending','approved','rejected','not_required')
  ),
  status_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_pr_request_tracker_status
  on public.hc_pr_request_tracker (source_platform, response_status, deadline_at);

create index if not exists idx_hc_pr_request_tracker_topics
  on public.hc_pr_request_tracker using gin (topic_tags);

create table if not exists public.hc_podcast_placements (
  id uuid primary key default gen_random_uuid(),
  show_name text not null,
  host_name text,
  outlet_id uuid,
  country_codes text[] not null default '{}',
  topic_tags text[] not null default '{}',
  pitch_angle text not null,
  target_asset_id uuid references public.hc_linkable_assets(id) on delete set null,
  relationship_id uuid references public.hc_journalist_relationships(id) on delete set null,
  placement_status text not null default 'target' check (
    placement_status in ('target','pitched','booked','recorded','published','declined','retired')
  ),
  appearance_url text,
  transcript_url text,
  clip_urls text[] not null default '{}',
  backlink_url text,
  follow_up_due date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_podcast_placements_status
  on public.hc_podcast_placements (placement_status, follow_up_due);

create table if not exists public.hc_link_pr_outreach_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid references public.hc_journalist_relationships(id) on delete set null,
  request_id uuid references public.hc_pr_request_tracker(id) on delete set null,
  asset_id uuid references public.hc_linkable_assets(id) on delete set null,
  channel text not null check (
    channel in ('email','platform','linkedin','x_twitter','podcast_form','newsletter_form','direct','other')
  ),
  event_type text not null check (
    event_type in ('comment','warm_intro','source_offer','pitch','follow_up','thank_you','correction','other')
  ),
  personalized_context text,
  message_excerpt text,
  no_spam_guardrail_status text not null default 'pending' check (
    no_spam_guardrail_status in ('pending','approved','rejected','not_required')
  ),
  human_review_required boolean not null default true,
  status text not null default 'draft' check (status in ('draft','queued','sent','skipped','replied','bounced')),
  sent_at timestamptz,
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_link_pr_outreach_no_mass_generic check (
    status <> 'queued'
    or (
      no_spam_guardrail_status in ('approved','not_required')
      and personalized_context is not null
      and length(personalized_context) >= 40
    )
  )
);

create index if not exists idx_hc_link_pr_outreach_relationship
  on public.hc_link_pr_outreach_events (relationship_id, status, sent_at desc);

create table if not exists public.hc_link_pr_attribution_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.hc_linkable_assets(id) on delete set null,
  widget_id uuid references public.hc_share_embed_widgets(id) on delete set null,
  relationship_id uuid references public.hc_journalist_relationships(id) on delete set null,
  event_type text not null check (
    event_type in (
      'referring_domain',
      'mention',
      'referral_visit',
      'embed_view',
      'share_click',
      'claim_conversion',
      'training_start',
      'sponsor_lead',
      'broker_post',
      'data_product_lead',
      'other'
    )
  ),
  source_url text,
  target_url text,
  referrer_domain text,
  country_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  event_count integer not null default 1 check (event_count >= 0),
  revenue_cents bigint not null default 0 check (revenue_cents >= 0),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_hc_link_pr_attribution_asset
  on public.hc_link_pr_attribution_events (asset_id, event_type, occurred_at desc);

create index if not exists idx_hc_link_pr_attribution_domain
  on public.hc_link_pr_attribution_events (referrer_domain, event_type);

create or replace view public.v_hc_link_pr_asset_roi
with (security_invoker = true) as
select
  a.id as asset_id,
  a.asset_key,
  a.title,
  a.asset_type,
  a.country_codes,
  a.role_keys,
  a.linkability_score,
  a.shareability_score,
  count(e.id) filter (where e.event_type = 'referring_domain') as referring_domain_events,
  count(e.id) filter (where e.event_type = 'mention') as mention_events,
  count(e.id) filter (where e.event_type = 'referral_visit') as referral_visit_events,
  count(e.id) filter (where e.event_type = 'claim_conversion') as claim_conversion_events,
  count(e.id) filter (where e.event_type = 'training_start') as training_start_events,
  count(e.id) filter (where e.event_type = 'sponsor_lead') as sponsor_lead_events,
  count(e.id) filter (where e.event_type = 'broker_post') as broker_post_events,
  count(e.id) filter (where e.event_type = 'data_product_lead') as data_product_lead_events,
  coalesce(sum(e.revenue_cents), 0) as attributed_revenue_cents,
  max(e.occurred_at) as last_signal_at
from public.hc_linkable_assets a
left join public.hc_link_pr_attribution_events e on e.asset_id = a.id
group by a.id;

alter table public.hc_linkable_assets enable row level security;
alter table public.hc_linkable_asset_media_variants enable row level security;
alter table public.hc_share_embed_widgets enable row level security;
alter table public.hc_journalist_relationships enable row level security;
alter table public.hc_pr_request_tracker enable row level security;
alter table public.hc_podcast_placements enable row level security;
alter table public.hc_link_pr_outreach_events enable row level security;
alter table public.hc_link_pr_attribution_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_linkable_assets' and policyname = 'Service role manages linkable assets') then
    create policy "Service role manages linkable assets" on public.hc_linkable_assets for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_linkable_asset_media_variants' and policyname = 'Service role manages linkable asset media') then
    create policy "Service role manages linkable asset media" on public.hc_linkable_asset_media_variants for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_share_embed_widgets' and policyname = 'Service role manages share embed widgets') then
    create policy "Service role manages share embed widgets" on public.hc_share_embed_widgets for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_journalist_relationships' and policyname = 'Service role manages journalist relationships') then
    create policy "Service role manages journalist relationships" on public.hc_journalist_relationships for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_pr_request_tracker' and policyname = 'Service role manages PR requests') then
    create policy "Service role manages PR requests" on public.hc_pr_request_tracker for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_podcast_placements' and policyname = 'Service role manages podcast placements') then
    create policy "Service role manages podcast placements" on public.hc_podcast_placements for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_link_pr_outreach_events' and policyname = 'Service role manages Link PR outreach') then
    create policy "Service role manages Link PR outreach" on public.hc_link_pr_outreach_events for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_link_pr_attribution_events' and policyname = 'Service role manages Link PR attribution') then
    create policy "Service role manages Link PR attribution" on public.hc_link_pr_attribution_events for all to service_role using (true) with check (true);
  end if;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'hc_linkable_assets',
    'hc_linkable_asset_media_variants',
    'hc_share_embed_widgets',
    'hc_journalist_relationships',
    'hc_pr_request_tracker',
    'hc_podcast_placements',
    'hc_link_pr_outreach_events'
  ]
  loop
    begin
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        'set_' || target_table || '_updated_at',
        target_table
      );
    exception
      when duplicate_object then
        null;
    end;
  end loop;
end $$;

insert into public.hc_system_registry (
  system_key,
  system_family,
  canonical_table,
  canonical_view,
  canonical_route,
  canonical_component,
  status,
  public_surface,
  monetization_surface,
  seo_surface,
  data_product_surface,
  notes,
  last_verified_at
) values (
  'link_pr_share_engine',
  'media/link-pr/share/earned-authority',
  'hc_linkable_assets',
  'v_hc_link_pr_asset_roi',
  null,
  null,
  'PARTIALLY_WIRED',
  false,
  true,
  true,
  true,
  'Internal bridge layer that turns media, data, glossary, regulation, corridor, and report-card assets into source-backed share/embed/PR/link acquisition opportunities with no-spam guardrails.',
  now()
)
on conflict (system_key) do update set
  system_family = excluded.system_family,
  canonical_table = excluded.canonical_table,
  canonical_view = excluded.canonical_view,
  canonical_route = excluded.canonical_route,
  canonical_component = excluded.canonical_component,
  status = excluded.status,
  public_surface = excluded.public_surface,
  monetization_surface = excluded.monetization_surface,
  seo_surface = excluded.seo_surface,
  data_product_surface = excluded.data_product_surface,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  updated_at = now();

commit;
