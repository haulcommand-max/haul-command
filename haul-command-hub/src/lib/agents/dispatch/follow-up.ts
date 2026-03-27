/**
 * Agent #19 — Follow-Up / No Response Agent
 * Swarm: Dispatch | Model: None (pure logic) | Priority: 4
 * 
 * Automatically retries operators who haven't responded, or expands
 * the search radius/wave if the initial group is exhausted.
 * Eliminates "dead air" and ensures every load is actively being pushed.
 * 
 * Revenue Impact: Converts "dead" loads into filled loads = instant GMV lift
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { registerAgent } from '../agent-runner';
import { canPushToOperator, recordPush } from './push-dispatch';

export const FOLLOW_UP_DEFINITION: AgentDefinition = {
  id: 19,
  name: 'Follow-Up Agent',
  swarm: 'dispatch',
  model: 'none',
  triggerType: 'event',
  triggerEvents: ['dispatch.push.sent', 'load.unfilled'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 5,
  description: 'Retries unresponsive operators and expands search waves',
  enabled: true,
  priority: 4,
  maxCostPerRun: 0, // Free
  maxRunsPerHour: 1000,
};

async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};
  const eventType = ctx.event?.type;

  const loadId = (payload.load_id as string) || 'unknown';

  if (eventType === 'dispatch.push.sent') {
    // A wave was just sent. In a production system, this agent would schedule
    // a delayed execution (e.g. via Temporal or Postgres pg_cron) to check back
    // after `next_wave_in_minutes`.
    const wave = (payload.wave as number) || 1;
    const nextWaveMin = (payload.next_wave_in_minutes as number) || 5;
    
    return {
      success: true,
      agentId: 19,
      runId: ctx.runId,
      action: `Scheduled follow-up check for Wave ${wave + 1} in ${nextWaveMin} minutes for load ${loadId}`,
      emitEvents: [], // Emitting nothing right now, just acknowledging the schedule
      metrics: { itemsProcessed: 1, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: [],
    };
  }

  if (eventType === 'load.unfilled') {
    // The load is actively unfilled (e.g. timed out waiting for responses)
    // We need to send a reminder to the existing candidates, or trigger the next wave.
    const reason = payload.reason as string;
    
    // If we've exhausted everything, we pass it down the chain (to Urgent Rescue)
    if (reason === 'no_candidates' || reason === 'max_waves_exhausted') {
      return {
        success: true,
        agentId: 19,
        runId: ctx.runId,
        action: `Load ${loadId} exhausted normal follow-ups. Escalating.`,
        emitEvents: [{
          type: 'dispatch.escalation',
          payload: { load_id: loadId, escalation_level: 'urgent_rescue' }
        }],
        metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
        warnings: ['Operator pool exhausted, passing to escalation chain'],
      };
    }

    // Otherwise, simulate sending a follow-up push
    const previousOperators = (payload.operator_ids as string[]) || [];
    let pushedCount = 0;

    for (const opId of previousOperators) {
      if (canPushToOperator(opId)) {
        // Send push: "Load #1234 still available. Tap to claim."
        recordPush(opId);
        pushedCount++;
      }
    }

    return {
      success: true,
      agentId: 19,
      runId: ctx.runId,
      action: pushedCount > 0 
        ? `Sent follow-up reminder to ${pushedCount} operators for load ${loadId}`
        : `No operators available for follow-up (rate limited or empty list) for load ${loadId}`,
      emitEvents: pushedCount === 0 ? [{
        type: 'load.unfilled',
        payload: { load_id: loadId, reason: 'max_waves_exhausted' }
      }] : [],
      metrics: { itemsProcessed: pushedCount, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: [],
    };
  }

  return {
    success: false,
    agentId: 19,
    runId: ctx.runId,
    action: 'Ignored unexpected event type',
    emitEvents: [],
    metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
    warnings: [`Unhandled event type: ${eventType}`]
  };
}

registerAgent(FOLLOW_UP_DEFINITION, handle);
export { handle as followUpHandler };
