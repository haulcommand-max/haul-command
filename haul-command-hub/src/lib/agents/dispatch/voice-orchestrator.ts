/**
 * Agent #15 — Voice Dispatch Orchestrator
 * Swarm: Dispatch | Model: OpenAI | Priority: High
 * 
 * Receives a matched load + ranked operator list from Agent #18 (Load Matching)
 * when push dispatch has failed (no response after escalation).
 * 
 * Determines call strategy (accent, talking points, rate floor/ceiling)
 * and queues calls to the Voice Call Agent (#16).
 * 
 * Steroid: Accent Matching — assigns Southern accent for TX, Midwest for ND, etc.
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { routeToModel, parseJSON } from '../model-router';
import { registerAgent } from '../agent-runner';

export const VOICE_ORCHESTRATOR_DEFINITION: AgentDefinition = {
  id: 15,
  name: 'Voice Dispatch Orchestrator',
  swarm: 'dispatch',
  model: 'openai',
  triggerType: 'event',
  triggerEvents: ['dispatch.escalation'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 30,
  description: 'Determines voice call strategy and queues operator calls via LiveKit',
  enabled: true,
  priority: 15,
  maxCostPerRun: 0.10,
  maxRunsPerHour: 100,
};

// Accent/voice mapping per region
const VOICE_MAP: Record<string, { accent: string; voiceId: string }> = {
  TX:  { accent: 'Southern',    voiceId: 'alloy' },
  OK:  { accent: 'Southern',    voiceId: 'alloy' },
  LA:  { accent: 'Southern',    voiceId: 'alloy' },
  AR:  { accent: 'Southern',    voiceId: 'alloy' },
  MS:  { accent: 'Southern',    voiceId: 'alloy' },
  AL:  { accent: 'Southern',    voiceId: 'alloy' },
  GA:  { accent: 'Southern',    voiceId: 'alloy' },
  SC:  { accent: 'Southern',    voiceId: 'alloy' },
  NC:  { accent: 'Southern',    voiceId: 'alloy' },
  TN:  { accent: 'Southern',    voiceId: 'alloy' },
  ND:  { accent: 'Midwest',     voiceId: 'echo' },
  SD:  { accent: 'Midwest',     voiceId: 'echo' },
  MN:  { accent: 'Midwest',     voiceId: 'echo' },
  WI:  { accent: 'Midwest',     voiceId: 'echo' },
  IA:  { accent: 'Midwest',     voiceId: 'echo' },
  NE:  { accent: 'Midwest',     voiceId: 'echo' },
  MT:  { accent: 'Midwest',     voiceId: 'echo' },
  WY:  { accent: 'Midwest',     voiceId: 'echo' },
  CA:  { accent: 'West Coast',  voiceId: 'shimmer' },
  OR:  { accent: 'West Coast',  voiceId: 'shimmer' },
  WA:  { accent: 'West Coast',  voiceId: 'shimmer' },
  NY:  { accent: 'Northeast',   voiceId: 'nova' },
  NJ:  { accent: 'Northeast',   voiceId: 'nova' },
  PA:  { accent: 'Northeast',   voiceId: 'nova' },
  MA:  { accent: 'Northeast',   voiceId: 'nova' },
  CT:  { accent: 'Northeast',   voiceId: 'nova' },
};

const DEFAULT_VOICE = { accent: 'Neutral American', voiceId: 'alloy' };

async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};
  const loadId = (payload.load_id as string) || 'unknown';
  const operatorIds = (payload.operator_ids as string[]) || [];
  const escalationLevel = (payload.escalation_level as string) || '';
  const pickupState = (payload.pickup_state as string) || '';
  const ratePerMile = (payload.rate_per_mile as number) || 2.00;
  const distanceMiles = (payload.distance_miles as number) || 200;

  // Only intervene if escalation level is voice-ready
  if (escalationLevel !== 'voice_dispatch' && escalationLevel !== 'urgent_rescue') {
    return {
      success: true,
      agentId: 15,
      runId: ctx.runId,
      action: `Skipped voice dispatch for load ${loadId} (escalation level: ${escalationLevel})`,
      emitEvents: [],
      metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: [],
    };
  }

  if (operatorIds.length === 0) {
    return {
      success: false,
      agentId: 15,
      runId: ctx.runId,
      action: `No operators to call for load ${loadId}`,
      emitEvents: [],
      metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: ['Empty operator list provided'],
    };
  }

  // Determine voice/accent for the region
  const voiceConfig = VOICE_MAP[pickupState] || DEFAULT_VOICE;

  // Use OpenAI to generate the talking points for the voice agent
  const totalRate = ratePerMile * distanceMiles;
  const rateFloor = ratePerMile * 0.90; // 10% below posted
  const rateCeiling = ratePerMile * 1.15; // 15% above for negotiation room

  const aiResp = await routeToModel({
    agentId: 15,
    runId: ctx.runId,
    task: 'copywriting',
    forceModel: 'openai',
    systemPrompt: `You are a dispatch coordinator preparing talking points for an automated voice call to a pilot car operator. Be concise, professional, and friendly. Use a ${voiceConfig.accent} conversational tone.`,
    prompt: `Create a brief phone script for Load ${loadId}. Route: ${pickupState}. Distance: ${distanceMiles} miles. Rate: $${ratePerMile.toFixed(2)}/mi ($${totalRate.toFixed(0)} total). The operator should feel urgency but not pressure. Output JSON: { "openingLine": "string", "loadSummary": "string", "closingLine": "string" }`,
    maxTokens: 200,
  });

  const script = parseJSON<{ openingLine: string; loadSummary: string; closingLine: string }>(aiResp.text);

  // Queue calls to LiveKit Voice Agent (#16)
  const callsQueued = Math.min(operatorIds.length, 5); // Max 5 simultaneous calls

  return {
    success: true,
    agentId: 15,
    runId: ctx.runId,
    action: `Queued ${callsQueued} voice calls for load ${loadId} using ${voiceConfig.accent} accent (voice: ${voiceConfig.voiceId})`,
    emitEvents: operatorIds.slice(0, callsQueued).map(opId => ({
      type: 'dispatch.call.queued' as const,
      payload: {
        load_id: loadId,
        operator_id: opId,
        voice_id: voiceConfig.voiceId,
        accent: voiceConfig.accent,
        rate_per_mile: ratePerMile,
        rate_floor: rateFloor,
        rate_ceiling: rateCeiling,
        distance_miles: distanceMiles,
        script: script || { openingLine: 'Hi, this is Haul Command dispatch.', loadSummary: `We have a ${distanceMiles}-mile load available.`, closingLine: 'Can I book you for this load?' },
      }
    })),
    metrics: { itemsProcessed: callsQueued, durationMs: Date.now() - startTime, runCostUSD: aiResp.costUSD },
    warnings: [],
  };
}

registerAgent(VOICE_ORCHESTRATOR_DEFINITION, handle);
export { handle as voiceOrchestratorHandler };
