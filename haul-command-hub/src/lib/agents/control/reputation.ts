/**
 * Agent #35 — Reputation Engine Agent
 * Swarm: Control | Model: None (SQL/math) | Priority: 11
 * 
 * Filters bad actors + scales trust to the 1.5M operator directory globally.
 * Updates an operator's composite score after every completed job / cancellation.
 * 
 * Score Factors:
 *   - On-time delivery rate (30%)
 *   - Acceptance rate (25%)
 *   - Cancellation rate (20%)
 *   - Broker satisfaction (15%)
 *   - Response time (10%)
 * 
 * Value: Necessary for Tier A-D expansion. Bad actors get auto-demoted.
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { registerAgent } from '../agent-runner';

export const REPUTATION_DEFINITION: AgentDefinition = {
  id: 35,
  name: 'Reputation Engine',
  swarm: 'control',
  model: 'none',
  triggerType: 'event',
  triggerEvents: ['job.completed', 'load.cancelled'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 5,
  description: 'Calculates dynamic composite reliability score per operator',
  enabled: true,
  priority: 11,
  maxCostPerRun: 0,
  maxRunsPerHour: 500, // Scales with job volume
};

async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};
  const operatorId = (payload.operator_id as string) || 'unknown';
  const eventType = ctx.event?.type;

  // In production: fetch the operator's rolling 30-day metrics from Supabase
  // Mocked for the pure logic handler now:
  let onTimePercent = 0.95;
  let acceptanceRate = 0.88;
  let cancelRate = 0.05;
  let brokerRating = 4.8; // out of 5
  let avgResponseMins = 12;

  // Adjust metrics locally based on the actual event that just happened
  if (eventType === 'job.completed') {
    const isLate = (payload.is_late as boolean) || false;
    onTimePercent = isLate ? onTimePercent - 0.05 : Math.min(1.0, onTimePercent + 0.01);
  } else if (eventType === 'load.cancelled') {
    // They cancelled an accepted load
    cancelRate = cancelRate + 0.05;
    acceptanceRate = Math.max(0, acceptanceRate - 0.02);
  }

  // Normalization logic:
  // On-time: directly percentage (95% -> 95)
  const onTimeScore = onTimePercent * 100;
  
  // Acceptance: directly percentage (88% -> 88)
  const acceptanceScore = acceptanceRate * 100;
  
  // Cancel: inverted (0% cancel -> 100, 20% cancel -> 0)
  const cancelScore = Math.max(0, 100 - (cancelRate * 500)); 
  
  // Rating: scaled to 100 (4.8/5.0 -> 96)
  const ratingScore = (brokerRating / 5.0) * 100;
  
  // Response time: inverted (2m -> 100, 30m+ -> 0)
  const responseScore = Math.max(0, 100 - (avgResponseMins * 3.33));

  // Weights
  const composite = Math.round(
    onTimeScore * 0.30 +
    acceptanceScore * 0.25 +
    cancelScore * 0.20 +
    ratingScore * 0.15 +
    responseScore * 0.10
  );

  // Assign a Tier Label
  let tierLabel = 'Bronze';
  if (composite >= 90) tierLabel = 'Diamond';
  else if (composite >= 75) tierLabel = 'Gold';
  else if (composite >= 50) tierLabel = 'Silver';

  // Issue warning/action if dropping below safety threshold
  const warnings = [];
  const eventsToEmit = [];

  if (composite < 40) {
    warnings.push(`Operator ${operatorId} fell below minimum safety score (40)`);
    eventsToEmit.push({
      type: 'compliance.expired', // re-using a control event to auto-suspend / review
      payload: {
        operator_id: operatorId,
        reason: 'reputation_critical',
        current_score: composite,
      }
    } as const);
  }

  return {
    success: true,
    agentId: 35,
    runId: ctx.runId,
    action: `Updated reputation for ${operatorId}: Score = ${composite} (${tierLabel})`,
    emitEvents: eventsToEmit,
    metrics: { itemsProcessed: 1, durationMs: Date.now() - startTime, runCostUSD: 0 },
    warnings,
  };
}

registerAgent(REPUTATION_DEFINITION, handle);
export { handle as reputationHandler };
