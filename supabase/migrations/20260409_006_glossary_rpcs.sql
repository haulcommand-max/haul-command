begin;

-- Helper to get the hub payload
create or replace function public.glo_glossary_hub_payload()
returns jsonb
language sql security definer
as $$
select jsonb_build_object(
  'counters', (
    select jsonb_build_object(
      'total_terms', (select count(*) from public.glo_terms where is_active = true and is_indexable = true),
      'total_topics', (select count(*) from public.glo_topics where is_active = true),
      'total_countries', (select count(distinct country_code) from public.glo_geo_overlays o join public.glo_terms t on t.id = o.term_id where t.is_active = true)
    )
  ),
  'recently_updated', (
    select jsonb_agg(
      jsonb_build_object(
        'slug', t.slug,
        'term', t.canonical_term,
        'short_definition', t.short_definition,
        'updated_at', t.updated_at
      )
    )
    from (
      select slug, canonical_term, short_definition, updated_at
      from public.glo_terms
      where is_active = true and is_indexable = true
      order by updated_at desc
      limit 6
    ) t
  ),
  'topics', (
    select jsonb_agg(
      jsonb_build_object(
        'slug', slug,
        'name', name,
        'description', description,
        'active_term_count', active_term_count
      ) order by sort_order
    )
    from public.glo_public_topics_v
  ),
  'countries', (
    select jsonb_agg(
      jsonb_build_object(
        'code', country_code,
        'term_count', overlay_term_count
      ) order by overlay_term_count desc
    )
    from public.glo_public_country_hub_v
  )
);
$$;

-- Helper to get topic page payload
create or replace function public.glo_topic_page_payload(topic_slug text)
returns jsonb
language sql security definer
as $$
select jsonb_build_object(
  'topic', (
    select to_jsonb(t) from (
      select slug, name, description
      from public.glo_topics
      where slug = topic_slug and is_active = true
    ) t
  ),
  'terms', (
    select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb)
    from public.glo_public_topic_hub_v v
    where v.topic_slug = topic_slug
  )
);
$$;

-- Helper to get country hub payload
create or replace function public.glo_country_hub_payload(c_code text)
returns jsonb
language sql security definer
as $$
select jsonb_build_object(
  'country_code', c_code,
  'terms', (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'term_slug', t.slug,
        'canonical_term', t.canonical_term,
        'local_title', coalesce(go.local_title_override, t.canonical_term),
        'short_definition', coalesce(go.local_short_definition, t.short_definition),
        'regulatory_note', go.local_regulatory_note
      )
    ), '[]'::jsonb)
    from public.glo_geo_overlays go
    join public.glo_terms t on t.id = go.term_id
    where go.country_code = upper(c_code)
      and t.is_active = true
      and t.is_indexable = true
  )
);
$$;

-- Helper to get exact term page payload
create or replace function public.glo_term_page_payload(p_term_slug text, p_country_code text default null, p_region_code text default null)
returns jsonb
language sql security definer
as $$
  with term as (
    select * from public.glo_public_term_page_v
    where slug = p_term_slug
    limit 1
  ),
  overlay as (
    select * from public.glo_geo_overlays
    where term_id = (select id from term)
      and country_code = upper(p_country_code)
      and (region_code = upper(p_region_code) or p_region_code is null)
    limit 1
  ),
  aliases as (
    select jsonb_agg(alias) as alias_list
    from public.glo_term_aliases
    where term_id = (select id from term)
      and (country_code = upper(p_country_code) or country_code is null)
  ),
  faqs as (
    select jsonb_agg(jsonb_build_object('question', question, 'answer', answer) order by sort_order) as faq_list
    from public.glo_term_faqs
    where term_id = (select id from term)
  ),
  links as (
    select jsonb_agg(jsonb_build_object('link_type', link_type, 'target_type', target_type, 'target_id', target_id, 'anchor_text', anchor_text) order by priority desc) as link_list
    from public.glo_term_links
    where term_id = (select id from term)
  ),
  related as (
    select jsonb_agg(jsonb_build_object('slug', r_term.slug, 'term', r_term.canonical_term, 'relationship', r.relationship_type)) as related_terms
    from public.glo_term_relationships r
    join public.glo_terms r_term on r_term.id = r.to_term_id
    where r.from_term_id = (select id from term) and r_term.is_active = true
  )
  select jsonb_build_object(
    'id', t.id,
    'slug', t.slug,
    'term', coalesce(o.local_title_override, t.canonical_term),
    'canonical_term', t.canonical_term,
    'short_definition', coalesce(o.local_short_definition, t.short_definition),
    'long_definition', coalesce(o.local_expanded_definition, t.expanded_definition),
    'plain_english', coalesce(o.local_plain_english, t.plain_english),
    'why_it_matters', coalesce(o.local_why_it_matters, t.why_it_matters),
    'regulatory_note', o.local_regulatory_note,
    'topic_primary_slug', t.topic_primary_slug,
    'topic_primary_name', t.topic_primary_name,
    'confidence_state', coalesce(o.confidence_state, t.confidence_state),
    'freshness_state', coalesce(o.freshness_state, t.freshness_state),
    'aliases', coalesce(a.alias_list, '[]'::jsonb),
    'faqs', coalesce(f.faq_list, '[]'::jsonb),
    'links', coalesce(l.link_list, '[]'::jsonb),
    'related_terms', coalesce(r.related_terms, '[]'::jsonb),
    'is_overlay', case when o.id is not null then true else false end
  )
  from term t
  left join overlay o on true
  left join aliases a on true
  left join faqs f on true
  left join links l on true
  left join related r on true;
$$;

commit;
