-- ============================================================
-- Media Command Center governance
-- Adds source-backed media cost/ROI ledger, media opportunities,
-- journalist relationship history, and podcast placement tracking.
-- Reuses existing pr_* and hc_generated_assets tables instead of
-- replacing them.
-- ============================================================

begin;

alter table if exists public.video_jobs
  add column if not exists media_money_path text not null default 'none',
  add column if not exists human_needed_score integer not null default 0 check (human_needed_score between 0 and 100),
  add column if not exists expected_value_cents integer not null default 0 check (expected_value_cents >= 0),
  add column if not exists estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  add column if not exists actual_cost_cents integer not null default 0 check (actual_cost_cents >= 0),
  add column if not exists translation_approved boolean not null default false,
  add column if not exists winner_signal boolean not null default false,
  add column if not exists translation_winner_signal boolean not null default false,
  add column if not exists cost_governor_decision jsonb not null default '{}'::jsonb;

create index if not exists idx_video_jobs_media_money_path on public.video_jobs(media_money_path);
create index if not exists idx_video_jobs_translation_approved on public.video_jobs(translation_approved) where translation_approved = true;

create table if not exists public.media_asset_ledger (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  asset_id uuid null references public.hc_generated_assets(id) on delete set null,
  video_job_id uuid null references public.video_jobs(id) on delete set null,

  engine_used text not null,
  source_page text null,
  source_table text null,
  source_ids jsonb not null default '[]'::jsonb,
  country_iso2 text null,
  region text null,
  role_key text null,
  corridor_slug text null,

  money_path text not null default 'none',
  render_cost_cents integer not null default 0 check (render_cost_cents >= 0),
  expected_value_cents integer not null default 0 check (expected_value_cents >= 0),
  human_needed_score integer not null default 0 check (human_needed_score between 0 and 100),
  cost_governor_decision jsonb not null default '{}'::jsonb,

  video_url text null,
  thumbnail_url text null,
  transcript text null,
  schema_status text not null default 'missing',
  sitemap_status text not null default 'missing',
  youtube_url text null,
  cta text null,

  views integer not null default 0,
  clicks integer not null default 0,
  claims integer not null default 0,
  training_starts integer not null default 0,
  sponsor_leads integer not null default 0,
  broker_posts integer not null default 0,
  revenue_attributed_cents integer not null default 0 check (revenue_attributed_cents >= 0),
  roi_multiple numeric generated always as (
    case
      when render_cost_cents > 0 then round((revenue_attributed_cents::numeric / render_cost_cents::numeric), 2)
      else null
    end
  ) stored,

  linkability_score integer not null default 0 check (linkability_score between 0 and 100),
  shareability_score integer not null default 0 check (shareability_score between 0 and 100),
  journalist_pitch_angle text null,
  embed_available boolean not null default false,
  podcast_talking_point text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_media_asset_ledger_engine on public.media_asset_ledger(engine_used);
create index if not exists idx_media_asset_ledger_money_path on public.media_asset_ledger(money_path);
create index if not exists idx_media_asset_ledger_geo on public.media_asset_ledger(country_iso2, region);
create index if not exists idx_media_asset_ledger_role on public.media_asset_ledger(role_key);
create index if not exists idx_media_asset_ledger_corridor on public.media_asset_ledger(corridor_slug);
create index if not exists idx_media_asset_ledger_linkability on public.media_asset_ledger(linkability_score desc);

create table if not exists public.media_opportunities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  opportunity_type text not null,
  source_type text not null,
  source_ref text null,
  country_iso2 text null,
  region text null,
  role_key text null,
  corridor_slug text null,
  title text not null,
  audience text not null default 'mixed',
  money_path text not null default 'none',

  search_demand integer not null default 0 check (search_demand between 0 and 100),
  money_value integer not null default 0 check (money_value between 0 and 100),
  country_tier integer not null default 0 check (country_tier between 0 and 100),
  local_supply_gap integer not null default 0 check (local_supply_gap between 0 and 100),
  training_value integer not null default 0 check (training_value between 0 and 100),
  adgrid_value integer not null default 0 check (adgrid_value between 0 and 100),
  claim_likelihood integer not null default 0 check (claim_likelihood between 0 and 100),
  faq_frequency integer not null default 0 check (faq_frequency between 0 and 100),
  livekit_question_frequency integer not null default 0 check (livekit_question_frequency between 0 and 100),
  youtube_potential integer not null default 0 check (youtube_potential between 0 and 100),
  linkability_score integer not null default 0 check (linkability_score between 0 and 100),
  shareability_score integer not null default 0 check (shareability_score between 0 and 100),
  total_score integer not null default 0 check (total_score between 0 and 100),
  status text not null default 'queued',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_media_opportunities_score on public.media_opportunities(total_score desc);
create index if not exists idx_media_opportunities_status on public.media_opportunities(status);
create index if not exists idx_media_opportunities_money_path on public.media_opportunities(money_path);

create table if not exists public.pr_journalist_relationships (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid null references public.pr_outlets(id) on delete set null,
  contact_name text not null,
  publication text null,
  country_iso2 text null,
  beat_tags text[] not null default '{}',
  topics text[] not null default '{}',
  prior_coverage jsonb not null default '[]'::jsonb,
  relationship_stage text not null default 'identified',
  last_contacted_at timestamptz null,
  source_given text null,
  asset_sent uuid null references public.media_asset_ledger(id) on delete set null,
  follow_up_due timestamptz null,
  links_earned integer not null default 0,
  mentions_earned integer not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pr_relationships_outlet on public.pr_journalist_relationships(outlet_id);
create index if not exists idx_pr_relationships_country on public.pr_journalist_relationships(country_iso2);
create index if not exists idx_pr_relationships_follow_up on public.pr_journalist_relationships(follow_up_due);

create table if not exists public.podcast_placements (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid null references public.pr_outlets(id) on delete set null,
  show_name text not null,
  host_name text null,
  country_iso2 text null,
  topic_angle text not null,
  status text not null default 'identified',
  pitch_sent_at timestamptz null,
  recording_at timestamptz null,
  published_at timestamptz null,
  episode_url text null,
  backlink_url text null,
  transcript_url text null,
  clips_asset_id uuid null references public.media_asset_ledger(id) on delete set null,
  referral_traffic integer not null default 0,
  claims integer not null default 0,
  sponsor_leads integer not null default 0,
  broker_posts integer not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_podcast_placements_status on public.podcast_placements(status);
create index if not exists idx_podcast_placements_country on public.podcast_placements(country_iso2);
create index if not exists idx_podcast_placements_published on public.podcast_placements(published_at desc);

alter table public.media_asset_ledger enable row level security;
alter table public.media_opportunities enable row level security;
alter table public.pr_journalist_relationships enable row level security;
alter table public.podcast_placements enable row level security;

drop policy if exists service_media_asset_ledger_all on public.media_asset_ledger;
create policy service_media_asset_ledger_all on public.media_asset_ledger
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists admin_media_asset_ledger_all on public.media_asset_ledger;
create policy admin_media_asset_ledger_all on public.media_asset_ledger
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists service_media_opportunities_all on public.media_opportunities;
create policy service_media_opportunities_all on public.media_opportunities
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists admin_media_opportunities_all on public.media_opportunities;
create policy admin_media_opportunities_all on public.media_opportunities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_pr_journalist_relationships_all on public.pr_journalist_relationships;
create policy admin_pr_journalist_relationships_all on public.pr_journalist_relationships
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists service_pr_journalist_relationships_all on public.pr_journalist_relationships;
create policy service_pr_journalist_relationships_all on public.pr_journalist_relationships
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists admin_podcast_placements_all on public.podcast_placements;
create policy admin_podcast_placements_all on public.podcast_placements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists service_podcast_placements_all on public.podcast_placements;
create policy service_podcast_placements_all on public.podcast_placements
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

commit;
