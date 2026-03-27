/**
 * Agent #18 — Load Matching Engine
 * Swarm: Dispatch | Model: Gemini (complex) / SQL (simple) | Priority: #6
 * 
 * Multi-factor scoring engine that picks the BEST operator for a load.
 * No round-robin. No randomness. Data-driven matching.
 * 
 * Scoring Factors:
 *   - GPS proximity to pickup (40% weight)
 *   - Reliability score (25%)
 *   - Equipment match (20%)
 *   - Rate compatibility (10%)
 *   - Availability (5%)
 * 
 * Output: Ranked operator list → Push Dispatch + Voice Dispatch
 * 
 * Revenue Impact: 15–20% cancellation rate → 3–5% = $60K–$85K/year saved
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { registerAgent } from '../agent-runner';

// ─── Agent Definition ────────────────────────────────────────────
export const LOAD_MATCHING_DEFINITION: AgentDefinition = {
  id: 18,
  name: 'Load Matching Engine',
  swarm: 'dispatch',
  model: 'gemini',
  triggerType: 'event',
  triggerEvents: ['load.created'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 20,
  description: 'Multi-factor operator matching — picks the best, not the nearest',
  enabled: true,
  priority: 6,
  maxCostPerRun: 0.02,
  maxRunsPerHour: 300,
};

// ─── Scoring Weights ─────────────────────────────────────────────
const WEIGHTS = {
  proximity:    0.40,
  reliability:  0.25,
  equipment:    0.20,
  rate:         0.10,
  availability: 0.05,
} as const;

// ─── Operator Candidate ──────────────────────────────────────────
export interface OperatorCandidate {
  id: string;
  name: string;
  phone: string | null;
  lat: number;
  lng: number;
  locality: string;
  admin1_code: string;
  /** Composite reliability score (0–100) */
  reliability_score: number;
  /** Service categories offered */
  service_categories: string[];
  /** Equipment verified flag */
  equipment_verified: boolean;
  /** Typical accepted rate per mile */
  typical_rate: number;
  /** Last active timestamp */
  last_active: string | null;
  /** Availability status */
  is_available: boolean;
}

// ─── Scored Candidate ────────────────────────────────────────────
export interface ScoredOperator extends OperatorCandidate {
  scores: {
    proximity: number;
    reliability: number;
    equipment: number;
    rate: number;
    availability: number;
    composite: number;
  };
  distanceMiles: number;
  rank: number;
}

// ─── Haversine Distance (miles) ──────────────────────────────────
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Scoring Functions ───────────────────────────────────────────

/** Proximity score: closer = higher. 0 miles = 100, 200+ miles = 0 */
function scoreProximity(distanceMiles: number): number {
  if (distanceMiles <= 0) return 100;
  if (distanceMiles >= 200) return 0;
  return Math.round(100 * (1 - distanceMiles / 200));
}

/** Reliability score: direct pass-through (already 0–100) */
function scoreReliability(reliabilityScore: number): number {
  return Math.min(100, Math.max(0, reliabilityScore));
}

/** Equipment match score */
function scoreEquipment(
  operatorServices: string[],
  requiredService: string,
  equipmentVerified: boolean,
): number {
  let score = 0;
  // Has the required service type
  if (operatorServices.includes(requiredService)) score += 60;
  // Equipment verified
  if (equipmentVerified) score += 40;
  return Math.min(100, score);
}

/** Rate compatibility: how close is operator's typical rate to the load rate */
function scoreRateCompatibility(
  operatorTypicalRate: number,
  loadRatePerMile: number,
): number {
  if (operatorTypicalRate <= 0 || loadRatePerMile <= 0) return 50; // Unknown
  const ratio = operatorTypicalRate / loadRatePerMile;
  // Perfect match = 1.0, operator wants more = <1.0, operator wants less = >1.0
  if (ratio <= 1.0) return 100; // Operator's rate is at or below load rate — perfect
  if (ratio >= 2.0) return 0;   // Operator wants 2x the load rate — no match
  return Math.round(100 * (2.0 - ratio));
}

/** Availability score */
function scoreAvailability(isAvailable: boolean, lastActive: string | null): number {
  if (!isAvailable) return 0;
  if (!lastActive) return 50;

  const hoursSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60);

  if (hoursSinceActive <= 1) return 100;   // Active in last hour
  if (hoursSinceActive <= 24) return 80;   // Active today
  if (hoursSinceActive <= 72) return 50;   // Active in 3 days
  if (hoursSinceActive <= 168) return 25;  // Active this week
  return 10; // Stale but technically available
}

// ─── Main Matching Function ──────────────────────────────────────
export function matchOperators(
  operators: OperatorCandidate[],
  pickupLat: number,
  pickupLng: number,
  requiredService: string,
  loadRatePerMile: number,
  maxResults: number = 25,
): ScoredOperator[] {
  const scored: ScoredOperator[] = operators.map(op => {
    const distanceMiles = haversineDistance(pickupLat, pickupLng, op.lat, op.lng);

    const scores = {
      proximity:    scoreProximity(distanceMiles),
      reliability:  scoreReliability(op.reliability_score),
      equipment:    scoreEquipment(op.service_categories, requiredService, op.equipment_verified),
      rate:         scoreRateCompatibility(op.typical_rate, loadRatePerMile),
      availability: scoreAvailability(op.is_available, op.last_active),
      composite: 0,
    };

    // Weighted composite
    scores.composite = Math.round(
      scores.proximity    * WEIGHTS.proximity +
      scores.reliability  * WEIGHTS.reliability +
      scores.equipment    * WEIGHTS.equipment +
      scores.rate         * WEIGHTS.rate +
      scores.availability * WEIGHTS.availability
    );

    return { ...op, scores, distanceMiles, rank: 0 };
  });

  // Sort by composite score (highest first)
  scored.sort((a, b) => b.scores.composite - a.scores.composite);

  // Assign ranks
  scored.forEach((op, i) => { op.rank = i + 1; });

  return scored.slice(0, maxResults);
}

// ─── Agent Handler ───────────────────────────────────────────────
async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};

  const pickupLat = (payload.pickup_lat as number) || 0;
  const pickupLng = (payload.pickup_lng as number) || 0;
  const requiredService = (payload.service_type as string) || 'pilot_car';
  const loadRatePerMile = (payload.rate_per_mile as number) || 1.85;
  const loadId = (payload.load_id as string) || 'unknown';

  // In production: query Supabase provider_directory with geo filter
  // For now, the payload should include candidate operators from the API route
  const candidates = (payload.candidates as OperatorCandidate[]) || [];

  if (candidates.length === 0) {
    return {
      success: true,
      agentId: 18,
      runId: ctx.runId,
      action: `No operator candidates found for load ${loadId}`,
      emitEvents: [{
        type: 'load.unfilled',
        payload: { load_id: loadId, reason: 'no_candidates', pickup_lat: pickupLat, pickup_lng: pickupLng },
      }],
      metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: ['No operator candidates in zone — escalating to unfilled'],
    };
  }

  const ranked = matchOperators(
    candidates,
    pickupLat,
    pickupLng,
    requiredService,
    loadRatePerMile,
  );

  const top = ranked[0];
  const durationMs = Date.now() - startTime;

  return {
    success: true,
    agentId: 18,
    runId: ctx.runId,
    action: `Matched ${ranked.length} operators for load ${loadId}. Top: ${top?.name} (score: ${top?.scores.composite}, ${Math.round(top?.distanceMiles || 0)}mi)`,
    emitEvents: [{
      type: 'load.matched',
      payload: {
        load_id: loadId,
        ranked_operators: ranked.slice(0, 10).map(op => ({
          id: op.id,
          name: op.name,
          phone: op.phone,
          score: op.scores.composite,
          distance_miles: Math.round(op.distanceMiles),
          rank: op.rank,
        })),
        total_candidates: candidates.length,
        total_scored: ranked.length,
      },
    }],
    metrics: {
      itemsProcessed: candidates.length,
      durationMs,
      runCostUSD: 0, // Pure math — zero AI cost
    },
    warnings: [],
  };
}

// ─── Register ────────────────────────────────────────────────────
registerAgent(LOAD_MATCHING_DEFINITION, handle);

export { handle as loadMatchingHandler };
