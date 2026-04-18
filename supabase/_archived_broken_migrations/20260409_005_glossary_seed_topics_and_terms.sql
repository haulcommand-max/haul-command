begin;

insert into public.glo_topics (slug, name, description, sort_order)
values
  ('escort-equipment', 'Escort Equipment', 'Equipment, gear, and vehicle support terms used in pilot car and heavy haul escort work.', 10),
  ('permits-and-regulations', 'Permits & Regulations', 'Terminology tied to requirements, permits, rules, and compliance.', 20),
  ('route-planning', 'Route Planning', 'Terms related to surveys, clearances, routing, restrictions, and trip planning.', 30),
  ('load-types', 'Load Types', 'Load-classification terms used across oversize and heavy haul transport.', 40),
  ('safety-and-compliance', 'Safety & Compliance', 'Safety, warning, visibility, and compliance-related terms.', 50),
  ('rates-and-finance', 'Rates & Finance', 'Commercial, billing, and payment terms relevant to heavy haul work.', 60),
  ('vehicles', 'Vehicles', 'Vehicle classes and escort vehicle terminology.', 70),
  ('documentation', 'Documentation', 'Paperwork, forms, and operational document terminology.', 80)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

with inserted_terms as (
  insert into public.glo_terms (
    slug,
    canonical_term,
    short_definition,
    expanded_definition,
    plain_english,
    why_it_matters,
    term_type,
    topic_primary_id,
    commercial_intent_level,
    near_me_relevance,
    sponsor_eligible,
    featured_snippet_candidate,
    ai_answer_variant,
    voice_answer_variant,
    confidence_state,
    freshness_state,
    source_count,
    metadata
  )
  values
    (
      'pilot-car',
      'Pilot Car',
      'A support vehicle used to help move oversize or heavy haul loads safely and legally.',
      'A pilot car, often called an escort vehicle in some regions, helps warn traffic, support route movement, and meet escort-related requirements for oversize or heavy haul transport.',
      'It is the vehicle that helps guide and support certain oversize loads on the road.',
      'This term sits at the center of provider discovery, regulations, local search, and claim intent across Haul Command.',
      'core_role_term',
      (select id from public.glo_topics where slug = 'vehicles'),
      95,
      true,
      true,
      true,
      'A pilot car is a support vehicle used in oversize transport to improve safety, communication, and legal compliance.',
      'A pilot car is a vehicle that helps oversize loads move safely and legally.',
      'partially_verified',
      'partially_verified',
      2,
      '{"preferred_monetization_type":"claim","preferred_claim_cta":"claim_profile","preferred_tool_cta":"browse_directory"}'::jsonb
    ),
    (
      'height-pole',
      'Height Pole',
      'A pole used to detect overhead clearance issues before a tall load reaches them.',
      'A height pole is mounted to help identify low wires, signs, bridges, or other overhead obstacles during route surveys or movement support for tall loads.',
      'It helps detect low obstacles before the load gets there.',
      'This term links naturally into route planning, equipment, compliance, tools, and local service discovery.',
      'equipment_term',
      (select id from public.glo_topics where slug = 'route-planning'),
      88,
      true,
      true,
      true,
      'A height pole helps identify low overhead obstacles before a tall oversize load reaches them.',
      'A height pole helps spot low wires or bridges before the truck arrives.',
      'partially_verified',
      'partially_verified',
      2,
      '{"preferred_monetization_type":"tool","preferred_tool_cta":"route_clearance_tools","preferred_sponsor_slot_type":"equipment"}'::jsonb
    ),
    (
      'route-survey',
      'Route Survey',
      'A review of a planned route to identify restrictions, obstacles, and operational risks before movement.',
      'A route survey checks roads, clearances, turns, obstacles, weight concerns, and other route conditions before a heavy haul move is executed.',
      'It is a route check done before the move to catch problems early.',
      'This term is high-value because it bridges corridor intelligence, route tools, regulations, and premium operational support.',
      'process_term',
      (select id from public.glo_topics where slug = 'route-planning'),
      92,
      true,
      true,
      true,
      'A route survey is a pre-move review used to identify clearance, routing, and operational problems before transport begins.',
      'A route survey is checking the route ahead of time for problems.',
      'partially_verified',
      'partially_verified',
      2,
      '{"preferred_monetization_type":"hybrid","preferred_tool_cta":"route_planning_tools","preferred_claim_cta":"find_route_support"}'::jsonb
    ),
    (
      'oversize-load',
      'Oversize Load',
      'A load that exceeds one or more legal size limits for road transport.',
      'An oversize load is a shipment that exceeds legal width, height, length, or similar road limits and may require permits, route planning, escort support, or special handling.',
      'It means the load is too big for normal legal road dimensions.',
      'This is one of the highest-intent foundational terms in the entire heavy haul ecosystem.',
      'load_term',
      (select id from public.glo_topics where slug = 'load-types'),
      98,
      true,
      true,
      true,
      'An oversize load exceeds normal legal road dimensions and often requires permits or route support.',
      'An oversize load is cargo that is too large for standard road size limits.',
      'partially_verified',
      'partially_verified',
      2,
      '{"preferred_monetization_type":"directory","preferred_tool_cta":"requirements_lookup","preferred_claim_cta":"find_escort"}'::jsonb
    )
  on conflict (slug) do update
  set
    canonical_term = excluded.canonical_term,
    short_definition = excluded.short_definition,
    expanded_definition = excluded.expanded_definition,
    plain_english = excluded.plain_english,
    why_it_matters = excluded.why_it_matters,
    topic_primary_id = excluded.topic_primary_id,
    commercial_intent_level = excluded.commercial_intent_level,
    near_me_relevance = excluded.near_me_relevance,
    sponsor_eligible = excluded.sponsor_eligible,
    featured_snippet_candidate = excluded.featured_snippet_candidate,
    ai_answer_variant = excluded.ai_answer_variant,
    voice_answer_variant = excluded.voice_answer_variant,
    confidence_state = excluded.confidence_state,
    freshness_state = excluded.freshness_state,
    source_count = excluded.source_count,
    metadata = excluded.metadata,
    updated_at = now()
  returning id, slug
)
select count(*) from inserted_terms;

insert into public.glo_term_topic_map (term_id, topic_id, is_primary)
select t.id, tp.id, true
from public.glo_terms t
join public.glo_topics tp on tp.id = t.topic_primary_id
where t.slug in ('pilot-car', 'height-pole', 'route-survey', 'oversize-load')
on conflict (term_id, topic_id) do update
set is_primary = excluded.is_primary;

insert into public.glo_term_aliases (term_id, alias, alias_type, is_preferred)
values
  ((select id from public.glo_terms where slug = 'pilot-car'), 'escort vehicle', 'synonym', true),
  ((select id from public.glo_terms where slug = 'pilot-car'), 'pilot vehicle', 'synonym', false),
  ((select id from public.glo_terms where slug = 'height-pole'), 'high pole', 'local_alias', false),
  ((select id from public.glo_terms where slug = 'route-survey'), 'route inspection', 'synonym', false),
  ((select id from public.glo_terms where slug = 'oversize-load'), 'wide load', 'synonym', false)
on conflict do nothing;

insert into public.glo_term_use_cases (term_id, use_case, sort_order)
values
  ((select id from public.glo_terms where slug = 'pilot-car'), 'Used when escort support is required or recommended during oversize movement.', 10),
  ((select id from public.glo_terms where slug = 'height-pole'), 'Used during route checks for tall loads where overhead clearance risk exists.', 10),
  ((select id from public.glo_terms where slug = 'route-survey'), 'Used before dispatch to identify tight turns, low clearances, and route restrictions.', 10),
  ((select id from public.glo_terms where slug = 'oversize-load'), 'Used when a shipment exceeds normal legal road dimensions and triggers permit or escort needs.', 10)
on conflict do nothing;

insert into public.glo_term_faqs (term_id, question, answer, sort_order, is_voice_friendly)
values
  ((select id from public.glo_terms where slug = 'pilot-car'), 'What does a pilot car do?', 'A pilot car helps support oversize movements by improving safety, visibility, and road coordination.', 10, true),
  ((select id from public.glo_terms where slug = 'height-pole'), 'When do you need a height pole?', 'You typically need a height pole when a load height creates overhead clearance risk that should be checked in advance.', 10, true),
  ((select id from public.glo_terms where slug = 'route-survey'), 'Why is a route survey important?', 'It helps catch route problems before the move begins, reducing delays, risk, and compliance problems.', 10, true),
  ((select id from public.glo_terms where slug = 'oversize-load'), 'What makes a load oversize?', 'A load is oversize when it exceeds legal size limits such as width, height, or length for the route or jurisdiction.', 10, true)
on conflict do nothing;

insert into public.glo_term_sources (term_id, source_type, source_label, source_note, source_authority_score, is_primary)
values
  ((select id from public.glo_terms where slug = 'pilot-car'), 'internal_editorial', 'Haul Command Editorial Seed', 'Seed editorial definition for initial build.', 60, true),
  ((select id from public.glo_terms where slug = 'height-pole'), 'internal_editorial', 'Haul Command Editorial Seed', 'Seed editorial definition for initial build.', 60, true),
  ((select id from public.glo_terms where slug = 'route-survey'), 'internal_editorial', 'Haul Command Editorial Seed', 'Seed editorial definition for initial build.', 60, true),
  ((select id from public.glo_terms where slug = 'oversize-load'), 'internal_editorial', 'Haul Command Editorial Seed', 'Seed editorial definition for initial build.', 60, true)
on conflict do nothing;

insert into public.glo_term_relationships (from_term_id, to_term_id, relationship_type, weight)
values
  ((select id from public.glo_terms where slug = 'pilot-car'), (select id from public.glo_terms where slug = 'oversize-load'), 'required_by', 90),
  ((select id from public.glo_terms where slug = 'height-pole'), (select id from public.glo_terms where slug = 'route-survey'), 'often_used_with', 85),
  ((select id from public.glo_terms where slug = 'route-survey'), (select id from public.glo_terms where slug = 'oversize-load'), 'prerequisite_for', 80)
on conflict do nothing;

insert into public.glo_geo_overlays (
  term_id,
  country_code,
  region_code,
  local_regulatory_note,
  confidence_state,
  freshness_state,
  is_indexable,
  metadata
)
values
  (
    (select id from public.glo_terms where slug = 'pilot-car'),
    'US',
    null,
    'The term pilot car is widely used in the United States, though local escort terminology can vary by state and agency.',
    'partially_verified',
    'partially_verified',
    true,
    '{"overlay_type":"country","notes":"Seed US overlay"}'::jsonb
  ),
  (
    (select id from public.glo_terms where slug = 'pilot-car'),
    'CA',
    null,
    'Canadian terminology may use escort vehicle more often in some contexts depending on province and operator practice.',
    'seeded_needs_review',
    'seeded_needs_review',
    false,
    '{"overlay_type":"country","notes":"Seed Canada overlay"}'::jsonb
  ),
  (
    (select id from public.glo_terms where slug = 'oversize-load'),
    'US',
    null,
    'Legal thresholds vary by state and route context, so users should check the relevant requirement page next.',
    'partially_verified',
    'partially_verified',
    true,
    '{"overlay_type":"country","notes":"Seed US overlay"}'::jsonb
  )
on conflict (term_id, country_code, region_code) do update
set
  local_regulatory_note = excluded.local_regulatory_note,
  confidence_state = excluded.confidence_state,
  freshness_state = excluded.freshness_state,
  is_indexable = excluded.is_indexable,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.glo_term_links (term_id, link_type, target_type, target_id, anchor_text, priority, is_auto_generated, metadata)
values
  (
    (select id from public.glo_terms where slug = 'pilot-car'),
    'claim_path',
    'route',
    '/claim',
    'Claim your profile',
    95,
    false,
    '{"cta":"claim"}'::jsonb
  ),
  (
    (select id from public.glo_terms where slug = 'pilot-car'),
    'next_action',
    'route',
    '/directory',
    'Find pilot car providers',
    90,
    false,
    '{"cta":"directory"}'::jsonb
  ),
  (
    (select id from public.glo_terms where slug = 'height-pole'),
    'related_tool',
    'route',
    '/tools',
    'Use route planning tools',
    88,
    false,
    '{"cta":"tool"}'::jsonb
  ),
  (
    (select id from public.glo_terms where slug = 'route-survey'),
    'related_tool',
    'route',
    '/tools',
    'Explore route survey tools',
    88,
    false,
    '{"cta":"tool"}'::jsonb
  ),
  (
    (select id from public.glo_terms where slug = 'oversize-load'),
    'next_action',
    'route',
    '/requirements',
    'Check requirements',
    92,
    false,
    '{"cta":"requirements"}'::jsonb
  )
on conflict (term_id, link_type, target_type, target_id) do update
set
  anchor_text = excluded.anchor_text,
  priority = excluded.priority,
  is_auto_generated = excluded.is_auto_generated,
  metadata = excluded.metadata;

insert into public.glo_quality_scores (
  term_id,
  definition_score,
  link_score,
  geo_score,
  trust_score,
  commercial_score,
  voice_score,
  notes
)
values
  (
    (select id from public.glo_terms where slug = 'pilot-car'),
    85, 80, 70, 65, 90, 80,
    'Starter seed score.'
  ),
  (
    (select id from public.glo_terms where slug = 'height-pole'),
    85, 75, 65, 65, 88, 78,
    'Starter seed score.'
  ),
  (
    (select id from public.glo_terms where slug = 'route-survey'),
    90, 80, 70, 65, 90, 82,
    'Starter seed score.'
  ),
  (
    (select id from public.glo_terms where slug = 'oversize-load'),
    90, 78, 72, 65, 92, 80,
    'Starter seed score.'
  )
on conflict (term_id) do update
set
  definition_score = excluded.definition_score,
  link_score = excluded.link_score,
  geo_score = excluded.geo_score,
  trust_score = excluded.trust_score,
  commercial_score = excluded.commercial_score,
  voice_score = excluded.voice_score,
  notes = excluded.notes,
  updated_at = now();

insert into public.glo_term_metrics (term_id)
select id from public.glo_terms
where slug in ('pilot-car', 'height-pole', 'route-survey', 'oversize-load')
on conflict do nothing;

commit;
