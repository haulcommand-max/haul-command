begin;

create or replace function public.glo_glossary_hub_payload()
returns jsonb
language sql
stable
set search_path = public
as $$
with term_counts as (
  select
    count(*)::int as total_terms,
    count(distinct upper(left(canonical_term, 1)))::int as total_letters
  from public.glo_terms
  where is_active = true
    and is_indexable = true
),
topic_counts as (
  select count(*)::int as total_topics
  from public.glo_topics
  where is_active = true
),
country_counts as (
  select count(distinct country_code)::int as total_countries
  from public.glo_geo_overlays
),
featured_terms as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', t.slug,
      'canonical_term', t.canonical_term,
      'short_definition', t.short_definition,
      'topic_primary_slug', tp.slug,
      'commercial_intent_level', t.commercial_intent_level,
      'sponsor_eligible', t.sponsor_eligible
    )
    order by t.commercial_intent_level desc, t.canonical_term asc
  ) as items
  from (
    select *
    from public.glo_terms
    where is_active = true
      and is_indexable = true
    order by commercial_intent_level desc, canonical_term asc
    limit 12
  ) t
  left join public.glo_topics tp on tp.id = t.topic_primary_id
),
recently_updated_terms as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', t.slug,
      'canonical_term', t.canonical_term,
      'updated_at', t.updated_at,
      'freshness_state', t.freshness_state
    )
    order by t.updated_at desc
  ) as items
  from (
    select *
    from public.glo_terms
    where is_active = true
      and is_indexable = true
    order by updated_at desc
    limit 12
  ) t
),
topic_clusters as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', gt.slug,
      'name', gt.name,
      'description', gt.description,
      'active_term_count', gt.active_term_count
    )
    order by gt.sort_order asc, gt.name asc
  ) as items
  from public.glo_public_topics_v gt
),
country_clusters as (
  select jsonb_agg(
    jsonb_build_object(
      'country_code', ch.country_code,
      'overlay_term_count', ch.overlay_term_count,
      'last_overlay_update', ch.last_overlay_update
    )
    order by ch.overlay_term_count desc, ch.country_code asc
  ) as items
  from public.glo_public_country_hub_v ch
),
letter_index as (
  select jsonb_agg(letter order by letter) as items
  from (
    select distinct upper(left(canonical_term, 1)) as letter
    from public.glo_terms
    where is_active = true
      and is_indexable = true
      and canonical_term is not null
  ) x
)
select jsonb_build_object(
  'counts', jsonb_build_object(
    'total_terms', coalesce((select total_terms from term_counts), 0),
    'total_countries', coalesce((select total_countries from country_counts), 0),
    'total_topics', coalesce((select total_topics from topic_counts), 0),
    'total_letters', coalesce((select total_letters from term_counts), 0)
  ),
  'featured_terms', coalesce((select items from featured_terms), '[]'::jsonb),
  'recently_updated_terms', coalesce((select items from recently_updated_terms), '[]'::jsonb),
  'topic_clusters', coalesce((select items from topic_clusters), '[]'::jsonb),
  'country_clusters', coalesce((select items from country_clusters), '[]'::jsonb),
  'letter_index', coalesce((select items from letter_index), '[]'::jsonb)
);
$$;

create or replace function public.glo_term_page_payload(
  p_term_slug text,
  p_country_code text default null,
  p_region_code text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
with base_term as (
  select t.*, tp.slug as topic_primary_slug, tp.name as topic_primary_name
  from public.glo_terms t
  left join public.glo_topics tp on tp.id = t.topic_primary_id
  where t.slug = p_term_slug
    and t.is_active = true
    and t.is_indexable = true
  limit 1
),
best_overlay as (
  select go.*
  from public.glo_geo_overlays go
  join base_term bt on bt.id = go.term_id
  where
    (p_country_code is null or go.country_code = p_country_code)
    and (
      (p_region_code is not null and go.region_code = p_region_code)
      or (p_region_code is null and go.region_code is null)
      or (p_region_code is not null and go.region_code is null)
    )
  order by
    case when go.region_code = p_region_code and p_region_code is not null then 0 else 1 end,
    case when go.country_code = p_country_code and p_country_code is not null then 0 else 1 end
  limit 1
),
aliases as (
  select jsonb_agg(
    jsonb_build_object(
      'alias', a.alias,
      'alias_type', a.alias_type,
      'country_code', a.country_code,
      'region_code', a.region_code,
      'language_code', a.language_code,
      'is_preferred', a.is_preferred
    )
    order by a.is_preferred desc, a.alias asc
  ) as items
  from public.glo_term_aliases a
  join base_term bt on bt.id = a.term_id
),
faqs as (
  select jsonb_agg(
    jsonb_build_object(
      'question', f.question,
      'answer', f.answer,
      'sort_order', f.sort_order,
      'is_voice_friendly', f.is_voice_friendly
    )
    order by f.sort_order asc, f.created_at asc
  ) as items
  from public.glo_term_faqs f
  join base_term bt on bt.id = f.term_id
),
use_cases as (
  select jsonb_agg(
    jsonb_build_object(
      'use_case', u.use_case,
      'sort_order', u.sort_order
    )
    order by u.sort_order asc, u.created_at asc
  ) as items
  from public.glo_term_use_cases u
  join base_term bt on bt.id = u.term_id
),
sources as (
  select jsonb_agg(
    jsonb_build_object(
      'source_type', s.source_type,
      'source_label', s.source_label,
      'source_url', s.source_url,
      'source_note', s.source_note,
      'source_authority_score', s.source_authority_score,
      'is_primary', s.is_primary
    )
    order by s.is_primary desc, s.source_authority_score desc
  ) as items
  from public.glo_term_sources s
  join base_term bt on bt.id = s.term_id
),
links as (
  select jsonb_agg(
    jsonb_build_object(
      'link_type', l.link_type,
      'target_type', l.target_type,
      'target_id', l.target_id,
      'anchor_text', l.anchor_text,
      'priority', l.priority,
      'is_auto_generated', l.is_auto_generated,
      'metadata', l.metadata
    )
    order by l.priority desc, l.created_at asc
  ) as items
  from public.glo_term_links l
  join base_term bt on bt.id = l.term_id
),
relationships as (
  select jsonb_agg(
    jsonb_build_object(
      'relationship_type', r.relationship_type,
      'weight', r.weight,
      'to_term_slug', t2.slug,
      'to_term_name', t2.canonical_term
    )
    order by r.weight desc, t2.canonical_term asc
  ) as items
  from public.glo_term_relationships r
  join base_term bt on bt.id = r.from_term_id
  join public.glo_terms t2 on t2.id = r.to_term_id
),
quality as (
  select jsonb_build_object(
    'definition_score', qs.definition_score,
    'link_score', qs.link_score,
    'geo_score', qs.geo_score,
    'trust_score', qs.trust_score,
    'commercial_score', qs.commercial_score,
    'voice_score', qs.voice_score,
    'overall_score', qs.overall_score,
    'notes', qs.notes
  ) as item
  from public.glo_quality_scores qs
  join base_term bt on bt.id = qs.term_id
),
metrics as (
  select jsonb_build_object(
    'pageviews_30d', tm.pageviews_30d,
    'entrances_30d', tm.entrances_30d,
    'ctr_search_30d', tm.ctr_search_30d,
    'claim_clicks_30d', tm.claim_clicks_30d,
    'tool_clicks_30d', tm.tool_clicks_30d,
    'regulation_clicks_30d', tm.regulation_clicks_30d,
    'sponsor_clicks_30d', tm.sponsor_clicks_30d,
    'lead_clicks_30d', tm.lead_clicks_30d,
    'exits_30d', tm.exits_30d,
    'avg_time_seconds_30d', tm.avg_time_seconds_30d
  ) as item
  from public.glo_term_metrics tm
  join base_term bt on bt.id = tm.term_id
)
select jsonb_build_object(
  'term', (
    select jsonb_build_object(
      'id', bt.id,
      'slug', bt.slug,
      'canonical_term', bt.canonical_term,
      'short_definition', coalesce(bo.local_short_definition, bt.short_definition),
      'expanded_definition', coalesce(bo.local_expanded_definition, bt.expanded_definition),
      'plain_english', coalesce(bo.local_plain_english, bt.plain_english),
      'why_it_matters', coalesce(bo.local_why_it_matters, bt.why_it_matters),
      'term_type', bt.term_type,
      'topic_primary_slug', bt.topic_primary_slug,
      'topic_primary_name', bt.topic_primary_name,
      'commercial_intent_level', bt.commercial_intent_level,
      'near_me_relevance', bt.near_me_relevance,
      'sponsor_eligible', bt.sponsor_eligible,
      'featured_snippet_candidate', bt.featured_snippet_candidate,
      'ai_answer_variant', bt.ai_answer_variant,
      'voice_answer_variant', bt.voice_answer_variant,
      'confidence_state', coalesce(bo.confidence_state, bt.confidence_state),
      'freshness_state', coalesce(bo.freshness_state, bt.freshness_state),
      'reviewed_at', coalesce(bo.reviewed_at, bt.reviewed_at),
      'next_review_due', coalesce(bo.next_review_due, bt.next_review_due),
      'source_count', bt.source_count,
      'overlay', case
        when bo.id is null then null
        else jsonb_build_object(
          'country_code', bo.country_code,
          'region_code', bo.region_code,
          'local_title_override', bo.local_title_override,
          'local_regulatory_note', bo.local_regulatory_note,
          'is_indexable', bo.is_indexable
        )
      end
    )
    from base_term bt
    left join best_overlay bo on true
  ),
  'aliases', coalesce((select items from aliases), '[]'::jsonb),
  'faqs', coalesce((select items from faqs), '[]'::jsonb),
  'use_cases', coalesce((select items from use_cases), '[]'::jsonb),
  'sources', coalesce((select items from sources), '[]'::jsonb),
  'links', coalesce((select items from links), '[]'::jsonb),
  'relationships', coalesce((select items from relationships), '[]'::jsonb),
  'quality', coalesce((select item from quality), '{}'::jsonb),
  'metrics', coalesce((select item from metrics), '{}'::jsonb)
)
from base_term
limit 1;
$$;

create or replace function public.glo_topic_page_payload(
  p_topic_slug text
)
returns jsonb
language sql
stable
set search_path = public
as $$
with topic_row as (
  select *
  from public.glo_topics
  where slug = p_topic_slug
    and is_active = true
  limit 1
),
terms as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', t.slug,
      'canonical_term', t.canonical_term,
      'short_definition', t.short_definition,
      'commercial_intent_level', t.commercial_intent_level,
      'sponsor_eligible', t.sponsor_eligible,
      'overall_quality_score', coalesce(qs.overall_score, 0)
    )
    order by
      tm.is_primary desc,
      t.commercial_intent_level desc,
      t.canonical_term asc
  ) as items
  from public.glo_term_topic_map tm
  join topic_row tr on tr.id = tm.topic_id
  join public.glo_terms t on t.id = tm.term_id
  left join public.glo_quality_scores qs on qs.term_id = t.id
  where t.is_active = true
    and t.is_indexable = true
),
related_links as (
  select jsonb_agg(
    jsonb_build_object(
      'link_type', l.link_type,
      'target_type', l.target_type,
      'target_id', l.target_id,
      'anchor_text', l.anchor_text,
      'priority', l.priority
    )
    order by l.priority desc
  ) as items
  from public.glo_term_links l
  where l.term_id in (
    select tm.term_id
    from public.glo_term_topic_map tm
    join topic_row tr on tr.id = tm.topic_id
  )
)
select jsonb_build_object(
  'topic', (
    select jsonb_build_object(
      'id', tr.id,
      'slug', tr.slug,
      'name', tr.name,
      'description', tr.description,
      'parent_topic_id', tr.parent_topic_id,
      'sort_order', tr.sort_order
    )
    from topic_row tr
  ),
  'terms', coalesce((select items from terms), '[]'::jsonb),
  'related_links', coalesce((select items from related_links), '[]'::jsonb)
)
from topic_row
limit 1;
$$;

create or replace function public.glo_country_hub_payload(
  p_country_code text
)
returns jsonb
language sql
stable
set search_path = public
as $$
with overlay_terms as (
  select
    t.id,
    t.slug,
    t.canonical_term,
    coalesce(go.local_short_definition, t.short_definition) as short_definition,
    t.commercial_intent_level,
    t.sponsor_eligible,
    go.local_regulatory_note,
    go.updated_at
  from public.glo_geo_overlays go
  join public.glo_terms t on t.id = go.term_id
  where go.country_code = p_country_code
    and t.is_active = true
),
country_terms as (
  select jsonb_agg(
    jsonb_build_object(
      'slug', ot.slug,
      'canonical_term', ot.canonical_term,
      'short_definition', ot.short_definition,
      'commercial_intent_level', ot.commercial_intent_level,
      'sponsor_eligible', ot.sponsor_eligible,
      'local_regulatory_note', ot.local_regulatory_note,
      'updated_at', ot.updated_at
    )
    order by ot.commercial_intent_level desc, ot.canonical_term asc
  ) as items
  from overlay_terms ot
),
country_aliases as (
  select jsonb_agg(
    jsonb_build_object(
      'alias', a.alias,
      'alias_type', a.alias_type,
      'term_slug', t.slug,
      'term_name', t.canonical_term
    )
    order by t.canonical_term asc, a.alias asc
  ) as items
  from public.glo_term_aliases a
  join public.glo_terms t on t.id = a.term_id
  where a.country_code = p_country_code
    and t.is_active = true
),
related_links as (
  select jsonb_agg(
    jsonb_build_object(
      'term_slug', t.slug,
      'link_type', l.link_type,
      'target_type', l.target_type,
      'target_id', l.target_id,
      'anchor_text', l.anchor_text,
      'priority', l.priority
    )
    order by l.priority desc
  ) as items
  from public.glo_term_links l
  join public.glo_terms t on t.id = l.term_id
  where t.id in (
    select go.term_id
    from public.glo_geo_overlays go
    where go.country_code = p_country_code
  )
)
select jsonb_build_object(
  'country_code', p_country_code,
  'terms', coalesce((select items from country_terms), '[]'::jsonb),
  'aliases', coalesce((select items from country_aliases), '[]'::jsonb),
  'related_links', coalesce((select items from related_links), '[]'::jsonb)
);
$$;

grant execute on function public.glo_glossary_hub_payload() to anon, authenticated;
grant execute on function public.glo_term_page_payload(text, text, text) to anon, authenticated;
grant execute on function public.glo_topic_page_payload(text) to anon, authenticated;
grant execute on function public.glo_country_hub_payload(text) to anon, authenticated;

commit;
