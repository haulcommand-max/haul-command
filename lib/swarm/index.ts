// lib/swarm/index.ts — Barrel export for the full 72-agent swarm operating model

export type {
  SwarmDomain, SwarmLoop, TriggerType, AgentTrigger,
  SwarmAgentDef, SwarmActivityEntry, SwarmScoreboardEntry,
} from "./types";

// Agent registries by domain
export { COMMAND_AGENTS, SUPPLY_AGENTS } from "./agent-registry";
export { DEMAND_AGENTS } from "./agents-demand";
export { MATCHING_AGENTS } from "./agents-matching";
export { CLAIM_AGENTS } from "./agents-claim";
export { TRUST_AGENTS } from "./agents-trust";
export { SEARCH_AGENTS } from "./agents-search";
export { MONETIZATION_AGENTS, DATA_AGENTS } from "./agents-monetization";

// Compound registry
import { COMMAND_AGENTS, SUPPLY_AGENTS } from "./agent-registry";
import { DEMAND_AGENTS } from "./agents-demand";
import { MATCHING_AGENTS } from "./agents-matching";
import { CLAIM_AGENTS } from "./agents-claim";
import { TRUST_AGENTS } from "./agents-trust";
import { SEARCH_AGENTS } from "./agents-search";
import { MONETIZATION_AGENTS, DATA_AGENTS } from "./agents-monetization";

export const FULL_AGENT_REGISTRY = [
  ...COMMAND_AGENTS,    // 8
  ...SUPPLY_AGENTS,     // 10
  ...DEMAND_AGENTS,     // 9
  ...MATCHING_AGENTS,   // 9
  ...CLAIM_AGENTS,      // 9
  ...TRUST_AGENTS,      // 8
  ...SEARCH_AGENTS,     // 10
  ...MONETIZATION_AGENTS, // 5
  ...DATA_AGENTS,       // 4
] as const; // Total: 72

export function getAgentById(id: string) {
  return FULL_AGENT_REGISTRY.find(a => a.id === id);
}
export function getAgentsByDomain(domain: string) {
  return FULL_AGENT_REGISTRY.filter(a => a.domain === domain);
}
export function getEnabledAgents() {
  return FULL_AGENT_REGISTRY.filter(a => a.enabled);
}

// Market mode governor
export type { MarketMode, MarketState, ModePolicy } from "./market-mode-governor";
export {
  MODE_POLICIES, evaluateMarketMode, getMarketState,
  getMarketPolicy, batchEvaluateMarketModes, buildMarketKey,
} from "./market-mode-governor";
