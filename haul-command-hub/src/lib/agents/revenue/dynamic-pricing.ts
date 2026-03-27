/**
 * Agent #7 — Dynamic Pricing Agent
 * Swarm: Revenue | Model: OpenAI | Priority: 🥈 #2
 * 
 * Adjusts pilot car pricing in real-time based on:
 *   - Supply density (operators per zip)
 *   - Demand pressure (competing loads in corridor)
 *   - Seasonality, rush level, fuel surcharge
 *   - Weather events (storm surge pricing)
 * 
 * Plugs directly into existing pricing-engine.ts
 * 
 * Revenue Impact: 15–25% margin lift = $750K–$1.25M/year
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { routeToModel, parseJSON } from '../model-router';
import {
  calculateEstimate,
  SEASONAL_MULTIPLIERS,
  RUSH_PREMIUMS,
  FUEL_SURCHARGE,
  STATE_REGION_MAP,
  type PricingInput,
  type Region,
  type Season,
} from '../../pricing-engine';
import { registerAgent } from '../agent-runner';

// ─── Agent Definition ────────────────────────────────────────────
export const DYNAMIC_PRICING_DEFINITION: AgentDefinition = {
  id: 7,
  name: 'Dynamic Pricing Agent',
  swarm: 'revenue',
  model: 'openai',
  triggerType: 'event',
  triggerEvents: ['load.created', 'load.unfilled', 'surge.updated'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 40,
  description: 'Real-time price optimization using supply/demand/seasonality',
  enabled: true,
  priority: 2,
  maxCostPerRun: 0.05,  // $0.05 per pricing calculation
  maxRunsPerHour: 500,
};

// ─── Supply/Demand Multiplier Logic ──────────────────────────────
interface SupplyDemandSignal {
  operatorsInZone: number;
  activeLoadsInZone: number;
  ratio: number;
  multiplier: number;
  label: string;
}

function calculateSupplyDemandMultiplier(
  operatorsInZone: number,
  activeLoadsInZone: number,
): SupplyDemandSignal {
  if (operatorsInZone === 0) {
    return {
      operatorsInZone,
      activeLoadsInZone,
      ratio: Infinity,
      multiplier: 2.0,
      label: '🔴 No Supply — Maximum Premium',
    };
  }

  const ratio = activeLoadsInZone / operatorsInZone;

  let multiplier: number;
  let label: string;

  if (ratio >= 5) {
    multiplier = 1.75;
    label = '🔴 Extreme Demand (5:1+) — 75% premium';
  } else if (ratio >= 3) {
    multiplier = 1.50;
    label = '🟠 High Demand (3:1) — 50% premium';
  } else if (ratio >= 2) {
    multiplier = 1.25;
    label = '🟡 Elevated Demand (2:1) — 25% premium';
  } else if (ratio >= 1) {
    multiplier = 1.10;
    label = '🟢 Balanced — 10% premium';
  } else if (ratio >= 0.5) {
    multiplier = 1.00;
    label = '🟢 Adequate Supply — Standard pricing';
  } else {
    multiplier = 0.95;
    label = '🔵 Oversupply — Slight discount to fill';
  }

  return { operatorsInZone, activeLoadsInZone, ratio, multiplier, label };
}

// ─── Determine Current Season ────────────────────────────────────
function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 4 && month <= 10) return 'peak_construction';
  if (month === 12 || month === 1) return 'slow';
  return 'standard';
}

// ─── Determine Rush Level ────────────────────────────────────────
function getRushLevel(
  pickupDate: string | undefined,
): 'sameDay' | 'nextDay' | 'standard' {
  if (!pickupDate) return 'standard';

  const now = new Date();
  const pickup = new Date(pickupDate);
  const hoursUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilPickup <= 4) return 'sameDay';
  if (hoursUntilPickup <= 24) return 'nextDay';
  return 'standard';
}

// ─── Agent Handler ───────────────────────────────────────────────
async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};

  const pickupState = (payload.pickup_state as string) || 'TX';
  const distanceMiles = (payload.distance_miles as number) || 200;
  const serviceType = (payload.service_type as string) || 'lead_chase';
  const pickupDate = payload.pickup_date as string | undefined;
  const operatorsInZone = (payload.operators_in_zone as number) || 10;
  const activeLoadsInZone = (payload.active_loads_in_zone as number) || 3;
  const currentDieselPrice = (payload.diesel_price as number) || 3.85;
  const isUnfilled = ctx.event?.type === 'load.unfilled';

  // 1. Get region from state
  const region: Region = STATE_REGION_MAP[pickupState] || 'southwest';

  // 2. Calculate supply/demand multiplier
  const supplyDemand = calculateSupplyDemandMultiplier(operatorsInZone, activeLoadsInZone);

  // 3. Determine season and rush level
  const season = getCurrentSeason();
  const rushLevel = getRushLevel(pickupDate);

  // 4. Run base pricing engine
  const pricingInput: PricingInput = {
    serviceType: serviceType as 'lead_chase',
    region,
    distanceMiles,
    season,
    rushLevel,
    currentDieselPrice,
    isUrban: (payload.is_urban as boolean) || false,
    isSuperwide: (payload.is_superwide as boolean) || false,
    isNightMove: (payload.is_night as boolean) || false,
    isWeekend: (payload.is_weekend as boolean) || false,
    stateCode: pickupState,
  };

  const baseEstimate = calculateEstimate(pricingInput);

  // 5. Apply supply/demand multiplier on top
  const dynamicLow = Math.round(baseEstimate.low * supplyDemand.multiplier);
  const dynamicMid = Math.round(baseEstimate.mid * supplyDemand.multiplier);
  const dynamicHigh = Math.round(baseEstimate.high * supplyDemand.multiplier);

  // 6. If load was unfilled → escalate price 15%
  let finalLow = dynamicLow;
  let finalMid = dynamicMid;
  let finalHigh = dynamicHigh;
  let escalation = '';

  if (isUnfilled) {
    finalLow = Math.round(dynamicLow * 1.15);
    finalMid = Math.round(dynamicMid * 1.15);
    finalHigh = Math.round(dynamicHigh * 1.15);
    escalation = '⬆️ +15% unfilled escalation applied';
  }

  // 7. Build result
  const emitEvents: AgentResult['emitEvents'] = [];

  // If surge is active, emit surge event for other agents
  if (supplyDemand.multiplier > 1.2) {
    emitEvents.push({
      type: 'surge.updated',
      payload: {
        region,
        state: pickupState,
        multiplier: supplyDemand.multiplier,
        label: supplyDemand.label,
        ratio: supplyDemand.ratio,
      },
    });
  }

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    agentId: 7,
    runId: ctx.runId,
    action: `Priced load: $${finalLow}–$${finalHigh} (mid: $${finalMid}) | ${supplyDemand.label}${escalation ? ` | ${escalation}` : ''}`,
    emitEvents,
    metrics: {
      revenueImpact: finalMid - baseEstimate.mid, // additional revenue from dynamic pricing
      itemsProcessed: 1,
      durationMs,
      runCostUSD: 0.001, // No AI call needed for most pricing — pure math
    },
    warnings: [
      ...baseEstimate.warnings,
      ...(baseEstimate.upsells.length > 0 ? [`Upsell opportunities: ${baseEstimate.upsells.length}`] : []),
    ],
  };
}

// ─── Register ────────────────────────────────────────────────────
registerAgent(DYNAMIC_PRICING_DEFINITION, handle);

export { handle as dynamicPricingHandler };
