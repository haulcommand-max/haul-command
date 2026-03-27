/**
 * Agent #9 — Urgent Rescue Agent
 * Swarm: Revenue | Model: OpenAI | Priority: 5
 * 
 * Intervenes on failing/unfilled loads (>2 hours old, or exhausted standard dispatch).
 * Dynamically increases the active rate by 25% (urgency premium).
 * Blasts the entire network within a 100-200 mile radius to secure a pilot car.
 * Charges the premium directly back to the broker to preserve margin.
 * 
 * Revenue Impact: Salvages high-margin loads globally that would otherwise cancel.
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { routeToModel, parseJSON } from '../model-router';
import { registerAgent } from '../agent-runner';

export const URGENT_RESCUE_DEFINITION: AgentDefinition = {
  id: 9,
  name: 'Urgent Rescue Agent',
  swarm: 'revenue',
  model: 'openai',
  triggerType: 'event',
  triggerEvents: ['load.unfilled', 'dispatch.escalation'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 20,
  description: 'Detects failing loads, raises price by 25%, blasts network',
  enabled: true,
  priority: 5,
  maxCostPerRun: 0.10,
  maxRunsPerHour: 100,
};

async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};
  const loadId = (payload.load_id as string) || 'unknown';

  // Only act if the escalation reason actually warrants a rescue.
  // E.g. maximum follow-up waves have been exhausted.
  const reason = (payload.reason || payload.escalation_level) as string;
  if (!reason || (!reason.includes('max_waves_exhausted') && !reason.includes('urgent_rescue') && !reason.includes('time_limit_exceeded'))) {
    return {
      success: true,
      agentId: 9,
      runId: ctx.runId,
      action: `Ignored load ${loadId} (reason '${reason}' does not require urgent rescue yet)`,
      emitEvents: [],
      metrics: { itemsProcessed: 1, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: [],
    };
  }

  // Current rate parameters
  const currentRate = (payload.rate_per_mile as number) || 1.85;
  const currentDistance = (payload.distance_miles as number) || 200;
  const currentTotal = currentRate * currentDistance;

  // Let OpenAI decide the exact premium based on some contextual data
  // But we fallback to a hardcoded +25% if OpenAI takes too long or fails.
  const systemPrompt = `You are the Urgent Rescue Agent for a heavy haul pilot car network.
A load has gone unfilled and normal dispatch waves have failed. 
We must increase the rate to attract an operator from a wider radius (up to 200 miles deadhead).
The current rate is $${currentRate.toFixed(2)}/mi. The total distance is ${currentDistance} miles.
Respond with JSON only:
{
  "newRatePerMile": number,
  "premiumReason": "string explanation of the increase",
  "searchRadiusMiles": number (typically 150-250)
}`;

  const prompt = `Calculate the urgent rescue premium for load ${loadId}.`;

  const aiResp = await routeToModel({
    agentId: 9,
    runId: ctx.runId,
    task: 'pricing',
    forceModel: 'openai', // structured logic, must be OpenAI
    systemPrompt,
    prompt,
    maxTokens: 150,
  });

  const parsed = parseJSON<{ newRatePerMile: number; premiumReason: string; searchRadiusMiles: number }>(aiResp.text);

  // Apply fallback 25% if AI failed to parse
  const newRatePerMile = parsed?.newRatePerMile || (currentRate * 1.25);
  const searchRadius = parsed?.searchRadiusMiles || 200;
  const premiumReason = parsed?.premiumReason || 'Applied standard 25% urgent rescue premium.';

  // The new total estimate
  const newTotal = newRatePerMile * currentDistance;
  const revenueLift = newTotal - currentTotal;

  // Fire an event back to the top of the matching chain, but marked 'urgent' and expanded.
  return {
    success: true,
    agentId: 9,
    runId: ctx.runId,
    action: `Applied rescue premium to load ${loadId}: $${currentRate.toFixed(2)} → $${newRatePerMile.toFixed(2)} (${premiumReason})`,
    emitEvents: [
      {
        type: 'load.created', // Sends it back into the funnels, but updated
        payload: {
          ...payload,
          rate_per_mile: newRatePerMile,
          urgency_level: 'urgent_rescue',
          search_radius: searchRadius,
          is_rescue: true,
        }
      }
    ],
    metrics: { itemsProcessed: 1, durationMs: Date.now() - startTime, runCostUSD: aiResp.costUSD, revenueImpact: revenueLift },
    warnings: [],
  };
}

registerAgent(URGENT_RESCUE_DEFINITION, handle);
export { handle as urgentRescueHandler };
