// lib/swarm/agent-registry.ts
// Maps all 72 swarm agents to their domains, triggers, surfaces, and existing implementations.
// Rule: no_agent_without_trigger, every agent serves one of 8 exact functions.

import type { SwarmAgentDef } from "./types";

// ═══════════════════════════════════════════════════════════════
// COMMAND & GOVERNANCE (8 agents)
// ═══════════════════════════════════════════════════════════════

const COMMAND_AGENTS: SwarmAgentDef[] = [
  {
    id: "chief_orchestrator",
    name: "Chief Orchestrator Agent",
    domain: "command_governance",
    purpose: "Route tasks to right specialists, dedupe overlap, rank by revenue and leverage",
    triggers: [
      { type: "event", name: "any_agent_output", condition: "New output from any domain agent" },
      { type: "schedule", name: "orchestration_tick", condition: "Every 15 minutes" },
    ],
    read_surfaces: ["swarm_activity_log", "market_states", "agent_performance"],
    write_surfaces: ["swarm_activity_log", "agent_queue"],
    measurable_outputs: ["tasks_routed", "dedupes_caught", "priority_overrides"],
    loops_fed: ["supply_loop", "demand_loop", "matching_loop", "monetization_loop"],
    monetization_relation: "Ensures highest-ROI tasks execute first",
    enabled: true,
    implementation_ref: "lib/swarm/orchestrator.ts",
  },
  {
    id: "profit_governor",
    name: "Profit Governor Agent",
    domain: "command_governance",
    purpose: "Block low-ROI or unsafe actions, enforce upgrade-never-downgrade",
    triggers: [
      { type: "event", name: "agent_action_proposed", condition: "Any agent proposes a write action" },
      { type: "threshold", name: "cost_spike", condition: "Agent cost exceeds daily budget" },
    ],
    read_surfaces: ["swarm_activity_log", "billing_usage", "revenue_surfaces"],
    write_surfaces: ["swarm_activity_log", "blocked_actions"],
    measurable_outputs: ["actions_blocked", "cost_saved", "revenue_protected"],
    loops_fed: ["monetization_loop"],
    monetization_relation: "Prevents revenue-negative actions",
    enabled: true,
    implementation_ref: "lib/governance/upgradeOnlyGate.ts",
  },
  {
    id: "retrofit_audit",
    name: "Retrofit Audit Agent",
    domain: "command_governance",
    purpose: "Ensure every page has next-action, every entity has claim path, no dead ends",
    triggers: [
      { type: "schedule", name: "daily_audit", condition: "Daily at 02:00 UTC" },
      { type: "event", name: "new_page_published", condition: "New indexable page created" },
    ],
    read_surfaces: ["pages_index", "claim_paths", "monetization_surfaces"],
    write_surfaces: ["swarm_activity_log", "dead_end_fixes", "audit_results"],
    measurable_outputs: ["dead_ends_found", "dead_ends_fixed", "missing_claim_paths"],
    loops_fed: ["seo_loop", "monetization_loop"],
    monetization_relation: "Fixes revenue leaks from dead-end pages",
    enabled: true,
  },
  {
    id: "policy_guard",
    name: "Policy Guard Agent",
    domain: "command_governance",
    purpose: "Enforce no-duplicate entities, no stale legal content presented as verified",
    triggers: [
      { type: "event", name: "entity_created", condition: "Any new entity inserted" },
      { type: "schedule", name: "policy_sweep", condition: "Daily" },
    ],
    read_surfaces: ["listings", "glossary_terms", "regulations"],
    write_surfaces: ["swarm_activity_log", "policy_violations"],
    measurable_outputs: ["violations_caught", "duplicates_flagged"],
    loops_fed: ["trust_loop", "data_loop"],
    monetization_relation: "Protects platform trust = long-term revenue",
    enabled: true,
  },
  {
    id: "country_scope_guard",
    name: "Country Scope Guard Agent",
    domain: "command_governance",
    purpose: "Ensure 120-country scope is maintained, no US-only assumptions leak",
    triggers: [
      { type: "event", name: "country_enabled", condition: "New country activated" },
      { type: "schedule", name: "country_audit", condition: "Weekly" },
    ],
    read_surfaces: ["countries_config", "market_states", "content_coverage"],
    write_surfaces: ["swarm_activity_log", "country_gaps"],
    measurable_outputs: ["countries_audited", "gaps_found", "us_assumption_violations"],
    loops_fed: ["expansion_loop", "seo_loop"],
    monetization_relation: "Unlocks 120-country revenue surface",
    enabled: true,
    implementation_ref: "lib/engines/country-gate.ts",
  },
  {
    id: "cost_efficiency_router",
    name: "Cost Efficiency Router Agent",
    domain: "command_governance",
    purpose: "Route AI/compute tasks to cheapest capable model tier",
    triggers: [
      { type: "event", name: "ai_task_requested", condition: "Any AI model call requested" },
    ],
    read_surfaces: ["model_usage_stats", "cost_budgets"],
    write_surfaces: ["swarm_activity_log", "model_routing_decisions"],
    measurable_outputs: ["cost_per_task", "model_downgrades", "budget_saved"],
    loops_fed: ["monetization_loop"],
    monetization_relation: "Reduces operational cost per agent action",
    enabled: true,
    implementation_ref: "lib/engines/model-router.ts",
  },
  {
    id: "action_queue_manager",
    name: "Action Queue Manager Agent",
    domain: "command_governance",
    purpose: "Manage priority queue of pending swarm actions, prevent starvation",
    triggers: [
      { type: "schedule", name: "queue_tick", condition: "Every 5 minutes" },
      { type: "threshold", name: "queue_depth", condition: "Queue > 100 pending actions" },
    ],
    read_surfaces: ["agent_queue"],
    write_surfaces: ["agent_queue", "swarm_activity_log"],
    measurable_outputs: ["actions_dispatched", "queue_depth", "avg_wait_time"],
    loops_fed: ["supply_loop", "demand_loop", "matching_loop"],
    monetization_relation: "Ensures revenue-critical actions execute fast",
    enabled: true,
  },
  {
    id: "swarm_scoreboard",
    name: "Swarm Scoreboard Agent",
    domain: "command_governance",
    purpose: "Aggregate and publish daily swarm performance metrics",
    triggers: [
      { type: "schedule", name: "daily_rollup", condition: "Daily at 06:00 UTC" },
    ],
    read_surfaces: ["swarm_activity_log", "market_states", "revenue_surfaces"],
    write_surfaces: ["swarm_scoreboard", "swarm_activity_log"],
    measurable_outputs: ["scoreboard_published", "metrics_computed"],
    loops_fed: ["data_loop"],
    monetization_relation: "Visibility into revenue-driving agent performance",
    enabled: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// SUPPLY CONTROL (10 agents)
// ═══════════════════════════════════════════════════════════════

const SUPPLY_AGENTS: SwarmAgentDef[] = [
  {
    id: "pilot_car_discovery", name: "Pilot Car Discovery Agent", domain: "supply_control",
    purpose: "Discover new pilot car / escort operators from web, social, referrals",
    triggers: [
      { type: "event", name: "new_phone_detected", condition: "New phone number seen in intake" },
      { type: "schedule", name: "daily_supply_scan", condition: "Daily" },
    ],
    read_surfaces: ["intake_events", "web_scrape_queue"], write_surfaces: ["listings", "swarm_activity_log"],
    measurable_outputs: ["new_shells_created", "operators_found"], loops_fed: ["supply_loop", "claim_loop"],
    monetization_relation: "More supply → more matchable inventory → more revenue", enabled: true,
    implementation_ref: "supabase/functions/auto-recruit",
  },
  {
    id: "hard_to_find_roles_hunter", name: "Hard-to-Find Roles Hunter Agent", domain: "supply_control",
    purpose: "Find specialists: highpole operators, oversize escorts, route surveyors, heavy riggers",
    triggers: [
      { type: "event", name: "load_requires_missing_role", condition: "Load posted needing unfillable role" },
      { type: "threshold", name: "role_density_low", condition: "Role density < target in corridor" },
    ],
    read_surfaces: ["loads", "role_density_scores", "corridor_supply_maps"], write_surfaces: ["listings", "outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["specialists_found", "role_gaps_filled"], loops_fed: ["supply_loop", "expansion_loop"],
    monetization_relation: "Rare roles command premium matching fees", enabled: true,
  },
  {
    id: "country_alias_role_mapper", name: "Country Alias Role Mapper Agent", domain: "supply_control",
    purpose: "Map local role names to canonical HC roles across 120 countries",
    triggers: [
      { type: "event", name: "new_country_enabled", condition: "Country activated" },
      { type: "event", name: "new_role_alias_added", condition: "New terminology discovered" },
    ],
    read_surfaces: ["glossary_terms", "countries_config", "seo_terminology"], write_surfaces: ["role_alias_map", "swarm_activity_log"],
    measurable_outputs: ["aliases_mapped", "countries_covered"], loops_fed: ["supply_loop", "seo_loop"],
    monetization_relation: "Correct role mapping = better search capture", enabled: true,
    implementation_ref: "lib/seo/escort-terminology.ts",
  },
  {
    id: "profile_shell_publisher", name: "Profile Shell Publisher Agent", domain: "supply_control",
    purpose: "Create or enrich listing shells for every viable operator/entity",
    triggers: [
      { type: "event", name: "new_company_detected", condition: "New company data ingested" },
      { type: "schedule", name: "daily_shell_batch", condition: "Daily" },
    ],
    read_surfaces: ["intake_events", "hc_places", "web_scrape_results"], write_surfaces: ["listings", "swarm_activity_log"],
    measurable_outputs: ["shells_created", "shells_enriched", "coverage_score_delta"], loops_fed: ["supply_loop", "claim_loop", "seo_loop"],
    monetization_relation: "Each shell is a claimable asset → claim upgrade revenue", enabled: true,
    implementation_ref: "scripts/seed_claimable_profiles_v3.js",
  },
  {
    id: "installer_upfitter_source", name: "Installer/Upfitter Source Agent", domain: "supply_control",
    purpose: "Source truck upfitters, lighting installers, sign shops for the ecosystem",
    triggers: [
      { type: "threshold", name: "installer_density_low", condition: "< 2 installers per metro" },
      { type: "schedule", name: "weekly_installer_scan", condition: "Weekly" },
    ],
    read_surfaces: ["hc_places", "directory_categories"], write_surfaces: ["hc_places", "swarm_activity_log"],
    measurable_outputs: ["installers_found", "upfitters_found"], loops_fed: ["supply_loop", "expansion_loop"],
    monetization_relation: "Infrastructure partners → AdGrid sponsor revenue", enabled: true,
  },
  {
    id: "infrastructure_partner_hunter", name: "Infrastructure Partner Hunter Agent", domain: "supply_control",
    purpose: "Find yards, truck stops, repair shops, fuel stations along corridors",
    triggers: [
      { type: "threshold", name: "corridor_infra_gaps", condition: "Corridor has < 3 support places" },
      { type: "schedule", name: "weekly_infra_scan", condition: "Weekly" },
    ],
    read_surfaces: ["hc_places", "corridors", "corridor_supply_maps"], write_surfaces: ["hc_places", "swarm_activity_log"],
    measurable_outputs: ["partners_found", "corridors_enriched"], loops_fed: ["supply_loop", "expansion_loop"],
    monetization_relation: "Infrastructure claims + sponsor slots", enabled: true,
    implementation_ref: "supabase/functions/ingest-chambers",
  },
  {
    id: "supply_density_scorer", name: "Supply Density Scorer Agent", domain: "supply_control",
    purpose: "Score supply density by geography, corridor, role to guide recruiting",
    triggers: [
      { type: "schedule", name: "daily_density_recompute", condition: "Daily" },
      { type: "event", name: "listing_created", condition: "New listing added" },
    ],
    read_surfaces: ["listings", "market_states", "corridors"], write_surfaces: ["role_density_scores", "corridor_supply_maps", "swarm_activity_log"],
    measurable_outputs: ["scores_computed", "gap_alerts_generated"], loops_fed: ["supply_loop", "data_loop"],
    monetization_relation: "Density data → enterprise data product", enabled: true,
    implementation_ref: "lib/seo/country-density-score.ts",
  },
  {
    id: "stale_supply_reactivation", name: "Stale Supply Reactivation Agent", domain: "supply_control",
    purpose: "Re-engage dormant operators who haven't logged in or updated profiles",
    triggers: [
      { type: "threshold", name: "operator_stale", condition: "No login > 30 days, claimed profile" },
      { type: "schedule", name: "weekly_reactivation", condition: "Weekly" },
    ],
    read_surfaces: ["listings", "user_activity", "freshness_scores"], write_surfaces: ["outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["reactivation_emails_sent", "operators_reactivated"], loops_fed: ["supply_loop", "claim_loop"],
    monetization_relation: "Reactivated operators → renewed subscriptions", enabled: true,
    implementation_ref: "lib/engines/recovery-revenue.ts",
  },
  {
    id: "market_readiness_supply", name: "Market Readiness Supply Agent", domain: "supply_control",
    purpose: "Assess if a market has enough supply diversity to activate live mode",
    triggers: [
      { type: "schedule", name: "weekly_readiness_check", condition: "Weekly" },
      { type: "event", name: "market_mode_change_proposed", condition: "Mode transition evaluated" },
    ],
    read_surfaces: ["market_states", "role_density_scores", "listings"], write_surfaces: ["market_states", "swarm_activity_log"],
    measurable_outputs: ["markets_assessed", "activation_recommendations"], loops_fed: ["supply_loop", "expansion_loop"],
    monetization_relation: "Market activation → full monetization stack unlock", enabled: true,
    implementation_ref: "lib/engines/dispatcher-readiness.ts",
  },
  {
    id: "supply_gap_alerter", name: "Supply Gap Alert Agent", domain: "supply_control",
    purpose: "Alert ops when critical supply gaps open in active markets",
    triggers: [
      { type: "threshold", name: "critical_gap", condition: "Zero coverage for active corridor + role" },
      { type: "schedule", name: "daily_gap_scan", condition: "Daily" },
    ],
    read_surfaces: ["role_density_scores", "market_states", "corridors"], write_surfaces: ["coverage_gap_alerts", "swarm_activity_log"],
    measurable_outputs: ["alerts_generated", "gaps_identified"], loops_fed: ["supply_loop", "expansion_loop"],
    monetization_relation: "Gap alerts → urgent fill fees + shortage sponsorships", enabled: true,
    implementation_ref: "supabase/functions/monitor-dead-zones",
  },
];

// ═══════════════════════════════════════════════════════════════
// BARREL EXPORT
// ═══════════════════════════════════════════════════════════════

export const AGENT_REGISTRY: SwarmAgentDef[] = [
  ...COMMAND_AGENTS,
  ...SUPPLY_AGENTS,
  // Remaining domains loaded from separate files to stay under bundle size
];

export function getAgentById(id: string): SwarmAgentDef | undefined {
  return AGENT_REGISTRY.find(a => a.id === id);
}

export function getAgentsByDomain(domain: SwarmAgentDef["domain"]): SwarmAgentDef[] {
  return AGENT_REGISTRY.filter(a => a.domain === domain);
}

export function getEnabledAgents(): SwarmAgentDef[] {
  return AGENT_REGISTRY.filter(a => a.enabled);
}

export { COMMAND_AGENTS, SUPPLY_AGENTS };
