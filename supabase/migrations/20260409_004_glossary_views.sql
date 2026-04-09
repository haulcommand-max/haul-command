begin;

create or replace view public.glo_public_terms_v as
select
  t.id,
  t.slug,
  t.canonical_term,
  t.short_definition,
  t.expanded_definition,
  t.plain_english,
  t.why_it_matters,
  t.term_type,
  t.commercial_intent_level,
  t.near_me_relevance,
  t.sponsor_eligible,
  t.featured_snippet_candidate,
  t.ai_answer_variant,
  t.voice_answer_variant,
  t.confidence_state,
  t.freshness_state,
  t.reviewed_at,
  t.next_review_due,
  t.source_count,
  t.created_at,
  t.updated_at,
  tp.slug as topic_primary_slug,
  tp.name as topic_primary_name
from public.glo_terms t
left join public.glo_topics tp on tp.id = t.topic_primary_id
where t.is_active = true
  and t.is_indexable = true;

create or replace view public.glo_public_topics_v as
select
  gt.id,
  gt.slug,
  gt.name,
  gt.description,
  gt.parent_topic_id,
  gt.sort_order,
  count(distinct gttm.term_id) filter (where t.is_active = true and t.is_indexable = true) as active_term_count
from public.glo_topics gt
left join public.glo_term_topic_map gttm on gttm.topic_id = gt.id
left join public.glo_terms t on t.id = gttm.term_id
where gt.is_active = true
group by gt.id;

create or replace view public.glo_public_term_page_v as
select
  t.id,
  t.slug,
  t.canonical_term,
  t.short_definition,
  t.expanded_definition,
  t.plain_english,
  t.why_it_matters,
  t.term_type,
  t.commercial_intent_level,
  t.near_me_relevance,
  t.sponsor_eligible,
  t.featured_snippet_candidate,
  t.ai_answer_variant,
  t.voice_answer_variant,
  t.confidence_state,
  t.freshness_state,
  t.reviewed_at,
  t.next_review_due,
  t.source_count,
  tp.slug as topic_primary_slug,
  tp.name as topic_primary_name,
  coalesce(qs.overall_score, 0) as overall_quality_score,
  coalesce(tm.pageviews_30d, 0) as pageviews_30d,
  coalesce(tm.claim_clicks_30d, 0) as claim_clicks_30d,
  coalesce(tm.tool_clicks_30d, 0) as tool_clicks_30d
from public.glo_terms t
left join public.glo_topics tp on tp.id = t.topic_primary_id
left join public.glo_quality_scores qs on qs.term_id = t.id
left join public.glo_term_metrics tm on tm.term_id = t.id
where t.is_active = true
  and t.is_indexable = true;

create or replace view public.glo_public_country_hub_v as
select
  go.country_code,
  count(distinct go.term_id) filter (where t.is_active = true) as overlay_term_count,
  count(distinct go.country_code) as country_count,
  max(go.updated_at) as last_overlay_update
from public.glo_geo_overlays go
join public.glo_terms t on t.id = go.term_id
where t.is_active = true
group by go.country_code;

create or replace view public.glo_public_topic_hub_v as
select
  gt.slug as topic_slug,
  gt.name as topic_name,
  gt.description,
  t.id as term_id,
  t.slug as term_slug,
  t.canonical_term,
  t.short_definition,
  t.commercial_intent_level,
  t.sponsor_eligible,
  coalesce(qs.overall_score, 0) as overall_quality_score
from public.glo_topics gt
join public.glo_term_topic_map tm on tm.topic_id = gt.id
join public.glo_terms t on t.id = tm.term_id
left join public.glo_quality_scores qs on qs.term_id = t.id
where gt.is_active = true
  and t.is_active = true
  and t.is_indexable = true;

grant select on public.glo_public_terms_v to anon, authenticated;
grant select on public.glo_public_topics_v to anon, authenticated;
grant select on public.glo_public_term_page_v to anon, authenticated;
grant select on public.glo_public_country_hub_v to anon, authenticated;
grant select on public.glo_public_topic_hub_v to anon, authenticated;

commit;
