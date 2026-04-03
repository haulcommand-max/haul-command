// lib/swarm/agents-monetization.ts — Monetization Control (5) + Data Intelligence (4)
import type { SwarmAgentDef } from "./types";

export const MONETIZATION_AGENTS: SwarmAgentDef[] = [
  {
    id: "monetization_architect", name: "Monetization Architect Agent", domain: "monetization_control",
    purpose: "Map revenue surfaces to user type, intent, urgency, market maturity",
    triggers: [
      { type: "event", name: "high_intent_page_visit", condition: "User on high-intent page" },
      { type: "schedule", name: "weekly_surface_rebalance", condition: "Weekly" },
    ],
    read_surfaces: ["monetization_surfaces", "market_states", "user_segments"], write_surfaces: ["offer_selections", "swarm_activity_log"],
    measurable_outputs: ["surfaces_mapped", "offer_decisions", "revenue_per_surface"],
    loops_fed: ["monetization_loop", "data_loop"], monetization_relation: "Core monetization decision engine",
    enabled: true, implementation_ref: "lib/monetization/monetization-engine.ts",
  },
  {
    id: "adgrid_yield", name: "AdGrid Yield Agent", domain: "monetization_control",
    purpose: "Optimize AdGrid fill rate, pricing, and placement across all surfaces",
    triggers: [
      { type: "threshold", name: "unsold_inventory", condition: "Inventory fill < 60%" },
      { type: "schedule", name: "daily_yield_review", condition: "Daily" },
    ],
    read_surfaces: ["ad_inventory", "ad_impressions", "market_states"], write_surfaces: ["ad_pricing", "ad_placements", "swarm_activity_log"],
    measurable_outputs: ["fill_rate", "avg_cpm", "revenue_per_page"],
    loops_fed: ["monetization_loop"], monetization_relation: "Core ad revenue optimization",
    enabled: true, implementation_ref: "lib/monetization/adgrid-generator.ts",
  },
  {
    id: "sponsor_inventory", name: "Sponsor Inventory Agent", domain: "monetization_control",
    purpose: "Manage sponsor slots across country/region/city/corridor/tool surfaces",
    triggers: [
      { type: "event", name: "claim_completed", condition: "New claimable sponsor surface" },
      { type: "threshold", name: "low_sponsor_fill", condition: "Surface sponsor fill < 30%" },
    ],
    read_surfaces: ["sponsor_slots", "market_states", "pages_index"], write_surfaces: ["sponsor_slots", "outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["slots_available", "slots_filled", "sponsor_revenue"],
    loops_fed: ["monetization_loop", "seo_loop"], monetization_relation: "Direct sponsor revenue",
    enabled: true, implementation_ref: "lib/engines/sponsor-relevance.ts",
  },
  {
    id: "lead_unlock_optimizer", name: "Lead Unlock Optimizer Agent", domain: "monetization_control",
    purpose: "Optimize lead unlock pricing, timing, and conversion",
    triggers: [
      { type: "event", name: "lead_attempt", condition: "Lead unlock attempted" },
      { type: "threshold", name: "low_unlock_rate", condition: "Unlock conversion < 20%" },
    ],
    read_surfaces: ["lead_events", "monetization_flags", "user_segments"], write_surfaces: ["lead_pricing", "swarm_activity_log"],
    measurable_outputs: ["unlock_rate", "revenue_per_lead", "pricing_experiments"],
    loops_fed: ["monetization_loop"], monetization_relation: "Direct lead revenue optimization",
    enabled: true, implementation_ref: "lib/monetization/paywall-gate.ts",
  },
  {
    id: "leakage_detection", name: "Revenue Leakage Detection Agent", domain: "monetization_control",
    purpose: "Scan for high-traffic pages without monetization, abandoned upgrades, failed payments",
    triggers: [
      { type: "schedule", name: "daily_leak_scan", condition: "Daily" },
      { type: "threshold", name: "high_traffic_no_revenue", condition: "Page > 100 visits/day, $0 revenue" },
    ],
    read_surfaces: ["analytics", "monetization_surfaces", "payment_status"], write_surfaces: ["revenue_leak_alerts", "swarm_activity_log"],
    measurable_outputs: ["leaks_found", "estimated_leaked_revenue", "leaks_fixed"],
    loops_fed: ["monetization_loop", "data_loop"], monetization_relation: "Every leak fixed = recovered revenue",
    enabled: true, implementation_ref: "lib/engines/recovery-revenue.ts",
  },
];

export const DATA_AGENTS: SwarmAgentDef[] = [
  {
    id: "observation_preserver", name: "Observation Preserver Agent", domain: "data_intelligence_control",
    purpose: "Capture and preserve every demand/supply signal as a reusable observation",
    triggers: [
      { type: "event", name: "load_seen", condition: "Load observed in system" },
      { type: "event", name: "route_seen", condition: "Route queried" },
      { type: "event", name: "quote_attempted", condition: "Quote requested" },
    ],
    read_surfaces: ["loads", "routes", "quotes", "search_queries"], write_surfaces: ["observations", "swarm_activity_log"],
    measurable_outputs: ["observations_captured", "signal_types"],
    loops_fed: ["data_loop", "matching_loop"], monetization_relation: "Observations → data products",
    enabled: true, implementation_ref: "supabase/functions/retention-event-ingest",
  },
  {
    id: "corridor_intelligence", name: "Corridor Intelligence Agent", domain: "data_intelligence_control",
    purpose: "Aggregate corridor demand, rates, restrictions into intelligence products",
    triggers: [
      { type: "schedule", name: "nightly_aggregation", condition: "Nightly" },
      { type: "threshold", name: "enough_data", condition: "Corridor has > 50 observations" },
    ],
    read_surfaces: ["observations", "corridors", "rate_observations"], write_surfaces: ["corridor_intelligence", "swarm_activity_log"],
    measurable_outputs: ["corridors_analyzed", "intelligence_products_updated"],
    loops_fed: ["data_loop", "monetization_loop"], monetization_relation: "Corridor intel → enterprise data sales",
    enabled: true, implementation_ref: "lib/intelligence/authority-engine.ts",
  },
  {
    id: "country_readiness", name: "Country Readiness Agent", domain: "data_intelligence_control",
    purpose: "Score each country's readiness for market activation",
    triggers: [
      { type: "schedule", name: "weekly_scoring", condition: "Weekly" },
      { type: "event", name: "country_data_change", condition: "Significant data change for country" },
    ],
    read_surfaces: ["market_states", "listings", "regulations", "glossary_terms"], write_surfaces: ["country_readiness_scores", "swarm_activity_log"],
    measurable_outputs: ["countries_scored", "activation_recommendations"],
    loops_fed: ["expansion_loop", "data_loop"], monetization_relation: "Country activation → full monetization stack",
    enabled: true, implementation_ref: "lib/seo/country-density-score.ts",
  },
  {
    id: "data_quality_guard", name: "Data Quality Guard Agent", domain: "data_intelligence_control",
    purpose: "Detect stale, duplicate, or low-quality data across all surfaces",
    triggers: [
      { type: "schedule", name: "daily_quality_scan", condition: "Daily" },
      { type: "threshold", name: "quality_drop", condition: "Data quality score drops > 5%" },
    ],
    read_surfaces: ["listings", "hc_places", "glossary_terms", "regulations"], write_surfaces: ["data_quality_flags", "merge_actions", "swarm_activity_log"],
    measurable_outputs: ["issues_found", "duplicates_flagged", "quality_score"],
    loops_fed: ["data_loop", "trust_loop"], monetization_relation: "Clean data → better products → higher prices",
    enabled: true, implementation_ref: "supabase/functions/hc_quality_scoring_worker",
  },
];
