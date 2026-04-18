-- ================================================================
-- Training RPC Pack — Reconciled (uses tc_modules, tc_enrollments)
-- ================================================================
begin;

-- Drop old versions if they exist
drop function if exists public.training_hub_payload();
drop function if exists public.training_page_payload(text, text, text);
drop function if exists public.training_country_payload(text);

-- TRAINING HUB PAYLOAD
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

-- TRAINING PAGE PAYLOAD (uses tc_modules instead of training_modules)
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
  from public.tc_modules m
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

-- TRAINING COUNTRY PAYLOAD
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

grant execute on function public.training_hub_payload() to anon, authenticated;
grant execute on function public.training_page_payload(text, text, text) to anon, authenticated;
grant execute on function public.training_country_payload(text) to anon, authenticated;

commit;
