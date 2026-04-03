// lib/swarm/agents-search.ts — Search & Intent Capture (10 agents)
import type { SwarmAgentDef } from "./types";

export const SEARCH_AGENTS: SwarmAgentDef[] = [
  {
    id: "search_intent_mapper", name: "Search Intent Mapper Agent", domain: "search_intent_capture",
    purpose: "Map keyword clusters to pages, find gaps, generate new page specs",
    triggers: [
      { type: "schedule", name: "daily_intent_scan", condition: "Daily" },
      { type: "event", name: "new_keyword_cluster", condition: "New keyword cluster detected" },
    ],
    read_surfaces: ["search_queries", "pages_index", "keyword_vault"], write_surfaces: ["intent_gaps", "page_specs", "swarm_activity_log"],
    measurable_outputs: ["intent_gaps_found", "page_specs_generated"],
    loops_fed: ["seo_loop", "expansion_loop"], monetization_relation: "Intent capture → lead/sponsor revenue on new pages",
    enabled: true, implementation_ref: "lib/seo/keyword-domination-10x.ts",
  },
  {
    id: "surface_publisher", name: "Surface Publisher Agent", domain: "search_intent_capture",
    purpose: "Auto-publish role pages, corridor pages, city pages, tool pages for uncovered intent",
    triggers: [
      { type: "event", name: "page_spec_approved", condition: "Intent mapper outputs a spec" },
      { type: "event", name: "new_country_enabled", condition: "Country activated" },
    ],
    read_surfaces: ["page_specs", "countries_config", "glossary_terms"], write_surfaces: ["pages_index", "swarm_activity_log"],
    measurable_outputs: ["pages_published", "countries_covered"],
    loops_fed: ["seo_loop", "claim_loop", "expansion_loop"], monetization_relation: "Each page = new sponsor slot + claim path",
    enabled: true, implementation_ref: "lib/seo/global-content-engine.ts",
  },
  {
    id: "glossary_expansion", name: "Glossary Expansion Agent", domain: "search_intent_capture",
    purpose: "Expand glossary with new terms, aliases, country-specific variations",
    triggers: [
      { type: "event", name: "new_role_alias", condition: "New terminology discovered" },
      { type: "schedule", name: "weekly_glossary_review", condition: "Weekly" },
    ],
    read_surfaces: ["glossary_terms", "search_queries", "role_alias_map"], write_surfaces: ["glossary_terms", "swarm_activity_log"],
    measurable_outputs: ["terms_added", "aliases_mapped", "snippet_captures"],
    loops_fed: ["seo_loop", "expansion_loop"], monetization_relation: "Glossary pages capture definition intent → lead funnel",
    enabled: true,
  },
  {
    id: "snippet_capture", name: "Snippet Capture Agent", domain: "search_intent_capture",
    purpose: "Optimize page content for featured snippets and AI answer citations",
    triggers: [
      { type: "threshold", name: "high_impression_low_ctr", condition: "Page impressions > 100 but CTR < 2%" },
      { type: "schedule", name: "weekly_snippet_refresh", condition: "Weekly" },
    ],
    read_surfaces: ["search_console_data", "pages_index"], write_surfaces: ["snippet_optimizations", "swarm_activity_log"],
    measurable_outputs: ["pages_optimized", "snippet_wins", "ctr_improvements"],
    loops_fed: ["seo_loop"], monetization_relation: "Snippet wins → traffic → monetization",
    enabled: true,
  },
  {
    id: "ai_answer_format", name: "AI Answer Format Agent", domain: "search_intent_capture",
    purpose: "Ensure pages have citation-ready answer blocks, Schema.org markup, freshness labels",
    triggers: [
      { type: "event", name: "page_published", condition: "New page needs AI formatting" },
      { type: "threshold", name: "weak_ai_citation", condition: "High-value page missing answer block" },
      { type: "schedule", name: "monthly_ai_audit", condition: "Monthly" },
    ],
    read_surfaces: ["pages_index", "ai_citation_scores"], write_surfaces: ["pages_index", "swarm_activity_log"],
    measurable_outputs: ["answer_blocks_added", "schema_markup_added", "ai_citation_score_delta"],
    loops_fed: ["seo_loop", "data_loop"], monetization_relation: "AI citations → authority → more organic traffic",
    enabled: true,
  },
  {
    id: "internal_linking", name: "Internal Linking Agent", domain: "search_intent_capture",
    purpose: "Build and maintain internal link mesh between related pages",
    triggers: [
      { type: "event", name: "page_published", condition: "New page needs linking" },
      { type: "schedule", name: "weekly_link_audit", condition: "Weekly" },
    ],
    read_surfaces: ["pages_index", "link_graph", "glossary_terms"], write_surfaces: ["link_graph", "swarm_activity_log"],
    measurable_outputs: ["links_added", "orphans_fixed", "link_depth_improved"],
    loops_fed: ["seo_loop"], monetization_relation: "Better linking → better crawl → more indexed pages → more traffic",
    enabled: true, implementation_ref: "lib/seo/internalLinks.ts",
  },
  {
    id: "map_pack_support", name: "Map Pack Support Agent", domain: "search_intent_capture",
    purpose: "Optimize local entity pages for Google Maps/local pack inclusion",
    triggers: [
      { type: "event", name: "place_claimed", condition: "Place claimed and verified" },
      { type: "schedule", name: "weekly_map_audit", condition: "Weekly" },
    ],
    read_surfaces: ["hc_places", "listings", "local_seo_signals"], write_surfaces: ["local_seo_signals", "swarm_activity_log"],
    measurable_outputs: ["map_optimizations", "local_signal_improvements"],
    loops_fed: ["seo_loop", "claim_loop"], monetization_relation: "Map pack visibility → more leads → lead unlock revenue",
    enabled: true,
  },
  {
    id: "structured_data", name: "Structured Data Agent", domain: "search_intent_capture",
    purpose: "Ensure all pages have correct Schema.org, breadcrumbs, FAQ markup",
    triggers: [
      { type: "event", name: "page_published", condition: "New page needs structured data" },
      { type: "schedule", name: "weekly_schema_audit", condition: "Weekly" },
    ],
    read_surfaces: ["pages_index"], write_surfaces: ["schema_coverage", "swarm_activity_log"],
    measurable_outputs: ["schemas_added", "schema_errors_fixed", "rich_result_eligibility"],
    loops_fed: ["seo_loop"], monetization_relation: "Rich results → higher CTR → more traffic",
    enabled: true, implementation_ref: "lib/seo/structured-data-factory.tsx",
  },
  {
    id: "no_dead_end_navigation", name: "No Dead End Navigation Agent", domain: "search_intent_capture",
    purpose: "Ensure every indexable page has a next-action path — no dead ends",
    triggers: [
      { type: "schedule", name: "daily_dead_end_scan", condition: "Daily" },
      { type: "event", name: "page_published", condition: "New page to check" },
    ],
    read_surfaces: ["pages_index", "claim_paths", "monetization_surfaces"], write_surfaces: ["dead_end_fixes", "swarm_activity_log"],
    measurable_outputs: ["dead_ends_found", "dead_ends_fixed"],
    loops_fed: ["seo_loop", "monetization_loop"], monetization_relation: "Every dead end fixed = recovered conversion path",
    enabled: true,
  },
  {
    id: "hyperlocal_surface", name: "Hyperlocal Surface Agent", domain: "search_intent_capture",
    purpose: "Generate and enrich city/region/corridor pages with local data",
    triggers: [
      { type: "event", name: "new_country_enabled", condition: "Country activated" },
      { type: "threshold", name: "thin_local_page", condition: "Local page has < 3 entities" },
      { type: "schedule", name: "weekly_local_enrichment", condition: "Weekly" },
    ],
    read_surfaces: ["pages_index", "listings", "hc_places", "regulations"], write_surfaces: ["pages_index", "swarm_activity_log"],
    measurable_outputs: ["local_pages_enriched", "entities_added_to_pages"],
    loops_fed: ["seo_loop", "expansion_loop", "claim_loop"], monetization_relation: "Local depth → local traffic → local sponsors",
    enabled: true, implementation_ref: "lib/seo/city-data.ts",
  },
];
