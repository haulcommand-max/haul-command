begin;

-- ================================================================
-- HAUL COMMAND CONTENT OS & TRAINING RECONCILIATION
-- This migration drops the V1 prototype training tables and 
-- resolving the tc_modules vs training_modules split by permanently
-- claiming the `training_x` namespace for the V2 Content OS schema.
-- ================================================================

-- 1. PURGE V1 PROTOTYPE TABLES & REDUNDANT tc_ NAMESPACE
drop table if exists public.tc_modules cascade;
drop table if exists public.tc_enrollments cascade;

drop table if exists public.training_regulation_sources cascade;
drop table if exists public.training_badges cascade;
drop table if exists public.training_exams cascade;
drop table if exists public.training_reciprocity_rules cascade;
drop table if exists public.training_claim_rules cascade;
drop table if exists public.training_modules cascade;
drop table if exists public.training_tracks cascade;
drop table if exists public.training_jurisdictions cascade;

-- 2. ENSURE CONTENT OS UNIFIED TABLES (Not dropping data if already exists)
create table if not exists public.blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    article_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB
);

create table if not exists public.reg_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL
);

create table if not exists public.tool_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
);

-- 3. APPLY FINAL V2 TRAINING SCHEMA
create table if not exists public.training_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  quick_answer text,
  training_type text,
  credential_level text,
  module_count int default 0,
  hours_total int default 0,
  jurisdiction_scope text,
  reciprocity_scope text,
  requirement_fit text,
  ranking_impact text,
  trust_badge_effect jsonb default '{}'::jsonb,
  pricing_mode text default 'paid',
  pricing_json jsonb default '{}'::jsonb,
  sponsor_eligible boolean default false,
  confidence_state text not null default 'seeded_needs_review',
  freshness_state text not null default 'seeded_needs_review',
  is_active boolean default true,
  is_indexable boolean default true,
  cta_primary text,
  cta_secondary text,
  reviewed_at timestamptz default now(),
  next_review_due timestamptz default now() + interval '90 days',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  hours int default 0,
  sort_order int default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.training_levels (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  level_slug text not null,
  level_name text not null,
  description text,
  badge_slug text,
  rank_weight int default 0,
  trust_weight int default 0,
  pricing_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.training_geo_fit (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  country_code text not null,
  region_code text,
  fit_type text not null default 'useful',
  note text,
  confidence_state text default 'seeded_needs_review',
  freshness_state text default 'seeded_needs_review',
  created_at timestamptz default now(),
  unique (training_id, country_code, region_code)
);

create table if not exists public.training_reciprocity_notes (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  from_geo text not null,
  to_geo text not null,
  note text,
  confidence_state text default 'seeded_needs_review',
  freshness_state text default 'seeded_needs_review',
  created_at timestamptz default now()
);

create table if not exists public.training_links (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  link_type text not null,
  target_type text not null,
  target_id text not null,
  anchor_text text,
  priority int default 50,
  created_at timestamptz default now()
);

create table if not exists public.training_badge_effects (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  badge_slug text not null,
  on_platform_effect_json jsonb default '{}'::jsonb,
  visible_copy text,
  created_at timestamptz default now()
);

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  training_id uuid references public.training_catalog(id) on delete cascade,
  status text not null default 'enrolled',
  purchased_at timestamptz default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  review_due_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.training_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_slug text not null,
  source_training_id uuid references public.training_catalog(id) on delete set null,
  status text not null default 'active',
  issued_at timestamptz default now(),
  expires_at timestamptz,
  review_due_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.training_team_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  plan_type text not null default 'team',
  seat_count int default 5,
  renewal_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.training_team_enrollments (
  id uuid primary key default gen_random_uuid(),
  team_account_id uuid references public.training_team_accounts(id) on delete cascade,
  user_id uuid not null,
  training_id uuid references public.training_catalog(id) on delete cascade,
  status text not null default 'enrolled',
  created_at timestamptz default now()
);

create table if not exists public.content_edges (
  id uuid primary key default gen_random_uuid(),
  from_type text not null,
  from_id text not null,
  to_type text not null,
  to_id text not null,
  link_type text not null,
  anchor_text text,
  priority int default 50,
  is_auto_generated boolean default false,
  created_at timestamptz default now(),
  unique (from_type, from_id, to_type, to_id, link_type)
);

create table if not exists public.content_quality_scores (
  id uuid primary key default gen_random_uuid(),
  page_family text not null,
  entity_id text not null,
  editorial_utility numeric(3,2) default 0,
  support_link_density numeric(3,2) default 0,
  geo_relevance numeric(3,2) default 0,
  trust_source_clarity numeric(3,2) default 0,
  commercial_routing numeric(3,2) default 0,
  freshness numeric(3,2) default 0,
  overall_score numeric(3,2) default 0,
  notes text,
  scored_at timestamptz default now(),
  unique (page_family, entity_id)
);


-- 4. RECONCILE RPCS (Now cleanly attaching to V2 training_modules)
drop function if exists public.training_hub_payload();
drop function if exists public.training_page_payload(text, text, text);
drop function if exists public.training_country_payload(text);

create or replace function public.training_hub_payload()
returns jsonb
language sql
stable
set search_path = public
as $$
with catalog as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', tc.slug,
      'title', tc.title,
      'summary', tc.summary,
      'training_type', tc.training_type,
      'credential_level', tc.credential_level,
      'module_count', tc.module_count,
      'hours_total', tc.hours_total,
      'pricing_mode', tc.pricing_mode,
      'requirement_fit', tc.requirement_fit,
      'ranking_impact', tc.ranking_impact,
      'sponsor_eligible', tc.sponsor_eligible
    )
    order by tc.credential_level asc, tc.title asc
  ) as items
  from public.training_catalog tc
  where tc.is_active = true
    and tc.is_indexable = true
),
geo_coverage as (
  select jsonb_agg(distinct tgf.country_code) as items
  from public.training_geo_fit tgf
),
level_overview as (
  select jsonb_agg(
    jsonb_build_object(
      'level_slug', tl.level_slug,
      'level_name', tl.level_name,
      'description', tl.description,
      'badge_slug', tl.badge_slug,
      'rank_weight', tl.rank_weight
    )
  ) as items
  from public.training_levels tl
)
select jsonb_build_object(
  'catalog', coalesce((select items from catalog), '[]'::jsonb),
  'geo_coverage', coalesce((select items from geo_coverage), '[]'::jsonb),
  'levels', coalesce((select items from level_overview), '[]'::jsonb)
);
$$;

create or replace function public.training_page_payload(
  p_slug text,
  p_country_code text default null,
  p_region_code text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
with base as (
  select * from public.training_catalog
  where slug = p_slug
    and is_active = true
  limit 1
),
modules as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', m.slug,
      'title', m.title,
      'summary', m.summary,
      'hours', m.hours,
      'sort_order', m.sort_order
    )
    order by m.sort_order asc
  ) as items
  from public.training_modules m
  join base b on b.id = m.training_id
),
levels as (
  select jsonb_agg(
    jsonb_build_object(
      'level_slug', l.level_slug,
      'level_name', l.level_name,
      'description', l.description,
      'badge_slug', l.badge_slug,
      'rank_weight', l.rank_weight,
      'trust_weight', l.trust_weight,
      'pricing_json', l.pricing_json
    )
  ) as items
  from public.training_levels l
  join base b on b.id = l.training_id
),
geo_fit as (
  select jsonb_agg(
    jsonb_build_object(
      'country_code', gf.country_code,
      'region_code', gf.region_code,
      'fit_type', gf.fit_type,
      'note', gf.note,
      'confidence_state', gf.confidence_state,
      'freshness_state', gf.freshness_state
    )
  ) as items
  from public.training_geo_fit gf
  join base b on b.id = gf.training_id
  where (p_country_code is null or gf.country_code = p_country_code)
),
reciprocity as (
  select jsonb_agg(
    jsonb_build_object(
      'from_geo', rn.from_geo,
      'to_geo', rn.to_geo,
      'note', rn.note,
      'confidence_state', rn.confidence_state,
      'freshness_state', rn.freshness_state
    )
  ) as items
  from public.training_reciprocity_notes rn
  join base b on b.id = rn.training_id
),
links as (
  select jsonb_agg(
    jsonb_build_object(
      'link_type', tl.link_type,
      'target_type', tl.target_type,
      'target_id', tl.target_id,
      'anchor_text', tl.anchor_text,
      'priority', tl.priority
    )
    order by tl.priority desc
  ) as items
  from public.training_links tl
  join base b on b.id = tl.training_id
),
badge_effects as (
  select jsonb_agg(
    jsonb_build_object(
      'badge_slug', be.badge_slug,
      'on_platform_effect_json', be.on_platform_effect_json,
      'visible_copy', be.visible_copy
    )
  ) as items
  from public.training_badge_effects be
  join base b on b.id = be.training_id
)
select jsonb_build_object(
  'training', (
    select jsonb_build_object(
      'id', b.id,
      'slug', b.slug,
      'title', b.title,
      'summary', b.summary,
      'quick_answer', b.quick_answer,
      'training_type', b.training_type,
      'credential_level', b.credential_level,
      'module_count', b.module_count,
      'hours_total', b.hours_total,
      'jurisdiction_scope', b.jurisdiction_scope,
      'reciprocity_scope', b.reciprocity_scope,
      'requirement_fit', b.requirement_fit,
      'ranking_impact', b.ranking_impact,
      'trust_badge_effect', b.trust_badge_effect,
      'pricing_mode', b.pricing_mode,
      'pricing_json', b.pricing_json,
      'confidence_state', b.confidence_state,
      'freshness_state', b.freshness_state,
      'cta_primary', b.cta_primary,
      'cta_secondary', b.cta_secondary,
      'reviewed_at', b.reviewed_at,
      'next_review_due', b.next_review_due
    )
    from base b
  ),
  'modules', coalesce((select items from modules), '[]'::jsonb),
  'levels', coalesce((select items from levels), '[]'::jsonb),
  'geo_fit', coalesce((select items from geo_fit), '[]'::jsonb),
  'reciprocity', coalesce((select items from reciprocity), '[]'::jsonb),
  'links', coalesce((select items from links), '[]'::jsonb),
  'badge_effects', coalesce((select items from badge_effects), '[]'::jsonb)
)
from base
limit 1;
$$;

create or replace function public.training_country_payload(p_country_code text)
returns jsonb
language sql
stable
set search_path = public
as $$
with geo_trainings as (
  select
    tc.slug,
    tc.title,
    tc.summary,
    tc.credential_level,
    tc.pricing_mode,
    gf.fit_type,
    gf.note,
    gf.confidence_state,
    gf.freshness_state
  from public.training_geo_fit gf
  join public.training_catalog tc on tc.id = gf.training_id
  where gf.country_code = p_country_code
    and tc.is_active = true
)
select jsonb_build_object(
  'country_code', p_country_code,
  'trainings', (
    select jsonb_agg(
      jsonb_build_object(
        'slug', gt.slug,
        'title', gt.title,
        'summary', gt.summary,
        'credential_level', gt.credential_level,
        'pricing_mode', gt.pricing_mode,
        'fit_type', gt.fit_type,
        'note', gt.note,
        'confidence_state', gt.confidence_state,
        'freshness_state', gt.freshness_state
      )
    )
    from geo_trainings gt
  )
);
$$;

commit;
