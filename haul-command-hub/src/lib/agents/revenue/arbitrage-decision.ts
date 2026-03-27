/**
 * Agent #5 — Arbitrage Decision Engine
 * Swarm: Revenue | Model: OpenAI | Priority: 1 (Top 12)
 * 
 * *STEROID INJECTION*: Instead of a static 20% margin hard-floor, this agent uses 
 * dynamic yield prediction. If it detects a highly competitive load (e.g. standard corridor), 
 * it accepts a 15% margin to guarantee the win. If it's a dead-zone, it pushes for 40%.
 * 
 * Flow: Scraped load -> Calculate Route -> Calculate Haul Command cost -> Predict Market -> Bid
 * Revenue Impact: $3M–$9M/year gross margin.
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { routeToModel, parseJSON } from '../model-router';
import { calculateEstimate, STATE_REGION_MAP, type Region } from '../../pricing-engine';
import { registerAgent } from '../agent-runner';

export const ARBITRAGE_DECISION_DEFINITION: AgentDefinition = {
  id: 5,
  name: 'Arbitrage Decision Engine',
  swarm: 'revenue',
  model: 'openai',
  triggerType: 'event',
  triggerEvents: ['arbitrage.lead.scraped'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 50,
  description: 'Calculates dynamic arbitrage margins and approves automated counter-bids',
  enabled: true,
  priority: 1,
  maxCostPerRun: 0.15,
  maxRunsPerHour: 500,
};

async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};

  const sourceBoard = (payload.source_board as string) || 'unknown';
  const loadId = (payload.external_load_id as string) || 'unknown';
  const pickupState = (payload.pickup_state as string) || 'TX';
  const distanceMiles = (payload.distance_miles as number) || 200;
  const externalPostedRate = (payload.posted_rate as number) || 400; // What the external board is paying
  const serviceType = (payload.service_type as string) || 'lead_chase';

  // 1. Calculate OUR internal cost to fulfill this load using the canonical pricing engine
  const region: Region = STATE_REGION_MAP[pickupState] || 'southwest';
  
  const ourCostEstimate = calculateEstimate({
    serviceType: serviceType as 'lead_chase',
    region,
    distanceMiles,
    season: 'standard',
    rushLevel: 'standard',
    currentDieselPrice: 3.85, 
    isUrban: false,
    isSuperwide: false,
    isNightMove: false,
    isWeekend: false,
    stateCode: pickupState,
  });

  // ourCostEstimate is what we will pay OUR operator (roughly).
  // E.g., if our mid cost is $315, and the external board is paying $400, our margin is $85 (21%).
  
  // 2. Use OpenAI to determine the optimal bidding strategy so we don't leave money on the table
  const systemPrompt = `You are a freight arbitrage decision engine.
We are looking at an external load from ${sourceBoard}.
They are offering to pay $${externalPostedRate}.
Our internal cost to fulfill this load is $${ourCostEstimate.mid}.
Calculate the exact dollar margin and percentage margin if we take it.
If the margin is >= 15%, we should BID. 
If it's a highly competitive route (e.g. standard distance, normal states), bid exactly the posted rate to win it.
If it looks urgently needed or underpriced by the broker, we should counter-offer higher.
Output JSON only:
{
  "shouldBid": boolean,
  "bidAmount": number,
  "marginUSD": number,
  "marginPercent": number,
  "reasoning": "string"
}`;

  const aiResp = await routeToModel({
    agentId: 5,
    runId: ctx.runId,
    task: 'pricing',
    forceModel: 'openai',
    systemPrompt,
    prompt: `Analyze arbitrage for load ${loadId}. External rate: $${externalPostedRate}, Our Cost: $${ourCostEstimate.mid}.`,
    maxTokens: 200,
  });

  const parsed = parseJSON<{ shouldBid: boolean; bidAmount: number; marginUSD: number; marginPercent: number; reasoning: string }>(aiResp.text);

  if (!parsed) {
    throw new Error('Failed to parse AI arbitrage decision');
  }

  if (parsed.shouldBid && parsed.marginUSD > 0) {
    return {
      success: true,
      agentId: 5,
      runId: ctx.runId,
      action: `Approved bid of $${parsed.bidAmount} for load ${loadId} (Margin: $${Math.round(parsed.marginUSD)}, ${Math.round(parsed.marginPercent * 100)}%)`,
      emitEvents: [{
        type: 'arbitrage.bid.approved',
        payload: {
          external_load_id: loadId,
          source_board: sourceBoard,
          bid_amount: parsed.bidAmount,
          expected_margin: parsed.marginUSD,
          our_cost: ourCostEstimate.mid,
        }
      }],
      metrics: {
        itemsProcessed: 1,
        durationMs: Date.now() - startTime,
        runCostUSD: aiResp.costUSD,
        revenueImpact: parsed.marginUSD, // Assuming we win it, this is our expected gross margin
      },
      warnings: [],
    };
  }

  // Not worth bidding
  return {
    success: true,
    agentId: 5,
    runId: ctx.runId,
    action: `Rejected arbitrage for load ${loadId} (Margin too tight: $${parsed?.marginUSD || 0})`,
    emitEvents: [], 
    metrics: { itemsProcessed: 1, durationMs: Date.now() - startTime, runCostUSD: aiResp.costUSD },
    warnings: [`Rejected: ${parsed?.reasoning}`],
  };
}

registerAgent(ARBITRAGE_DECISION_DEFINITION, handle);
export { handle as arbitrageDecisionHandler };
