// lib/swarm/agents-demand.ts — Demand Capture (9 agents)
import type { SwarmAgentDef } from "./types";

export const DEMAND_AGENTS: SwarmAgentDef[] = [
  {
    id: "broker_capture", name: "Broker Capture Agent", domain: "demand_capture",
    purpose: "Capture every broker identity from calls, emails, load posts, and referrals",
    triggers: [
      { type: "event", name: "broker_phone_seen", condition: "New broker phone detected" },
      { type: "event", name: "broker_email_seen", condition: "New broker email detected" },
      { type: "event", name: "demand_form_submitted", condition: "Inbound demand form" },
    ],
    read_surfaces: ["intake_events", "broker_profiles"], write_surfaces: ["broker_profiles", "outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["brokers_captured", "profiles_created", "outreach_sequences_started"],
    loops_fed: ["demand_loop", "claim_loop", "monetization_loop"], monetization_relation: "Each broker = recurring demand source → subscription revenue",
    enabled: true, implementation_ref: "lib/capture/capture-router.ts",
  },
  {
    id: "load_ingestion", name: "Load Ingestion Agent", domain: "demand_capture",
    purpose: "Ingest, normalize, and score loads from boards, emails, API, and scrapes",
    triggers: [
      { type: "event", name: "new_load_scraped", condition: "Load scraped from board" },
      { type: "schedule", name: "hourly_ingestion", condition: "Every hour" },
    ],
    read_surfaces: ["load_board_feeds", "intake_events"], write_surfaces: ["loads", "demand_signals", "swarm_activity_log"],
    measurable_outputs: ["loads_ingested", "loads_normalized", "loads_scored"],
    loops_fed: ["demand_loop", "matching_loop", "data_loop"], monetization_relation: "Each load → matching fee + fill fee",
    enabled: true, implementation_ref: "supabase/functions/eval-load-intelligence",
  },
  {
    id: "demand_normalization", name: "Demand Normalization Agent", domain: "demand_capture",
    purpose: "Standardize demand signals across formats, sources, and countries",
    triggers: [
      { type: "event", name: "raw_demand_received", condition: "New unstructured demand" },
    ],
    read_surfaces: ["intake_events", "role_alias_map"], write_surfaces: ["demand_signals", "swarm_activity_log"],
    measurable_outputs: ["signals_normalized", "roles_resolved", "corridors_tagged"],
    loops_fed: ["demand_loop", "data_loop"], monetization_relation: "Clean demand data → better matching → higher fill rates",
    enabled: true, implementation_ref: "lib/intelligence/load-board-intel.ts",
  },
  {
    id: "broker_profile_shell", name: "Broker Profile Shell Agent", domain: "demand_capture",
    purpose: "Create claimable broker profile shells from captured identities",
    triggers: [
      { type: "event", name: "broker_captured", condition: "New broker identity confirmed" },
      { type: "schedule", name: "daily_shell_batch", condition: "Daily" },
    ],
    read_surfaces: ["broker_profiles", "intake_events"], write_surfaces: ["broker_profiles", "claim_paths", "swarm_activity_log"],
    measurable_outputs: ["shells_created", "claim_invites_sent"],
    loops_fed: ["demand_loop", "claim_loop"], monetization_relation: "Broker claim → subscription upsell",
    enabled: true,
  },
  {
    id: "buyer_intent_scorer", name: "Buyer Intent Scorer Agent", domain: "demand_capture",
    purpose: "Score broker/shipper intent based on frequency, volume, urgency patterns",
    triggers: [
      { type: "event", name: "demand_signal_recorded", condition: "New demand signal" },
      { type: "threshold", name: "repeat_broker_high", condition: "Broker frequency > 3/week" },
    ],
    read_surfaces: ["demand_signals", "broker_profiles"], write_surfaces: ["buyer_intent_scores", "swarm_activity_log"],
    measurable_outputs: ["scores_computed", "high_intent_buyers_flagged"],
    loops_fed: ["demand_loop", "monetization_loop"], monetization_relation: "High-intent buyers → enterprise upsell targets",
    enabled: true, implementation_ref: "lib/intelligence/seasonal-demand-predictor.ts",
  },
  {
    id: "corridor_demand_signal", name: "Corridor Demand Signal Agent", domain: "demand_capture",
    purpose: "Aggregate demand signals by corridor to create heat maps",
    triggers: [
      { type: "schedule", name: "daily_aggregation", condition: "Daily" },
      { type: "threshold", name: "corridor_demand_spike", condition: "Corridor demand > 2x baseline" },
    ],
    read_surfaces: ["demand_signals", "corridors", "loads"], write_surfaces: ["corridor_demand_heat", "swarm_activity_log"],
    measurable_outputs: ["corridors_scored", "heat_maps_updated", "spikes_detected"],
    loops_fed: ["demand_loop", "data_loop", "monetization_loop"], monetization_relation: "Corridor heat → sponsor pricing + data product",
    enabled: true, implementation_ref: "lib/corridor-signals.ts",
  },
  {
    id: "repeat_broker_pattern", name: "Repeat Broker Pattern Agent", domain: "demand_capture",
    purpose: "Identify recurring brokers and push them toward subscription plans",
    triggers: [
      { type: "threshold", name: "repeat_frequency", condition: "Same broker > 3 interactions in 30d" },
      { type: "schedule", name: "daily_repeat_analysis", condition: "Daily" },
    ],
    read_surfaces: ["broker_profiles", "demand_signals", "intake_events"], write_surfaces: ["recurring_buyer_lists", "outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["repeat_brokers_identified", "subscription_nudges_sent"],
    loops_fed: ["demand_loop", "monetization_loop"], monetization_relation: "Repeat broker → Business subscription ($99/mo)",
    enabled: true,
  },
  {
    id: "urgent_demand_router", name: "Urgent Demand Router Agent", domain: "demand_capture",
    purpose: "Fast-track urgent demand to matching engine with priority flag",
    triggers: [
      { type: "event", name: "urgent_request", condition: "Demand marked urgent or < 24h deadline" },
    ],
    read_surfaces: ["loads", "demand_signals"], write_surfaces: ["agent_queue", "swarm_activity_log"],
    measurable_outputs: ["urgent_loads_routed", "avg_urgent_response_time"],
    loops_fed: ["demand_loop", "matching_loop"], monetization_relation: "Urgent fill fee + rush match premium",
    enabled: true, implementation_ref: "supabase/functions/panic-fill-escalation",
  },
  {
    id: "enterprise_buyer_packager", name: "Enterprise Buyer Packager Agent", domain: "demand_capture",
    purpose: "Package high-volume buyers into enterprise accounts with custom pricing",
    triggers: [
      { type: "threshold", name: "enterprise_volume", condition: "Buyer > 10 loads/month or > $50k volume" },
    ],
    read_surfaces: ["broker_profiles", "demand_signals", "buyer_intent_scores"], write_surfaces: ["enterprise_leads", "outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["enterprise_leads_created", "package_proposals_sent"],
    loops_fed: ["demand_loop", "monetization_loop"], monetization_relation: "Enterprise accounts → $499+/mo",
    enabled: true,
  },
];
