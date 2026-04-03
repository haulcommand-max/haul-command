// lib/swarm/types.ts — Core types for the 72-agent swarm system

export type SwarmDomain =
  | "command_governance"
  | "supply_control"
  | "demand_capture"
  | "matching_execution"
  | "claim_identity_control"
  | "trust_reputation_control"
  | "search_intent_capture"
  | "monetization_control"
  | "data_intelligence_control";

export type SwarmLoop =
  | "supply_loop"
  | "demand_loop"
  | "matching_loop"
  | "claim_loop"
  | "trust_loop"
  | "seo_loop"
  | "monetization_loop"
  | "data_loop"
  | "expansion_loop";

export type TriggerType = "event" | "threshold" | "schedule";

export interface AgentTrigger {
  type: TriggerType;
  name: string;
  condition: string;
}

export interface SwarmAgentDef {
  id: string;
  name: string;
  domain: SwarmDomain;
  purpose: string;
  triggers: AgentTrigger[];
  read_surfaces: string[];
  write_surfaces: string[];
  measurable_outputs: string[];
  loops_fed: SwarmLoop[];
  monetization_relation: string;
  enabled: boolean;
  /** Existing lib/engine/edge-function that powers this agent */
  implementation_ref?: string;
}

export interface SwarmActivityEntry {
  id?: string;
  agent_name: string;
  trigger_reason: string;
  action_taken: string;
  surfaces_touched: string[];
  revenue_impact: number | null;
  trust_impact: number | null;
  country: string;
  market_key?: string;
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  created_at?: string;
}

export interface SwarmScoreboardEntry {
  domain: SwarmDomain;
  executions_today: number;
  claims_driven: number;
  listings_created: number;
  loads_captured: number;
  matches_created: number;
  revenue_influenced: number;
  sponsor_inventory_filled: number;
  ai_citation_pages: number;
  no_dead_end_fixes: number;
  market_activations: number;
}
