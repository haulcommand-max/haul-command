/**
 * DEPRECATED — Use core/intelligence/PermitIntelligenceEngine.ts instead.
 * This file provides backward-compatible wrappers around the new engine.
 *
 * The old permit_checker only supported 3 US states (TX, OK, LA).
 * The new PermitIntelligenceEngine supports 57 countries with:
 * - Full dimension threshold checking
 * - Fine schedules
 * - Time restrictions
 * - Multi-jurisdiction route analysis
 * - AI compliance Q&A
 */

import { permitEngine, type PermitRequirement } from '../intelligence/PermitIntelligenceEngine';

// ── Preserved interfaces for backward compatibility ──

export interface LoadDimensions {
  width: number;
  height: number;
  length: number;
  weight: number;
}

export interface PermitCheckResult {
  requires_permit: boolean;
  estimated_cost: number;
  flags: string[];
  escorts_required: boolean;
  escort_count_est: number;
  critical_warning?: string;
  // NEW: link to full requirements from the engine
  fullRequirements?: PermitRequirement;
}

/**
 * @deprecated Use permitEngine.getRequirements() instead
 * Backward-compatible wrapper that delegates to PermitIntelligenceEngine
 */
export async function checkStatePermit(stateCode: string, dims: LoadDimensions): Promise<PermitCheckResult> {
  const jurisdictionCode = `US-${stateCode}`;
  const req = await permitEngine.getRequirements(jurisdictionCode);

  if (!req) {
    return {
      requires_permit: true,
      estimated_cost: 0,
      flags: [`State data not available for ${stateCode} — use PermitIntelligenceEngine for full coverage`],
      escorts_required: true,
      escort_count_est: 0,
      critical_warning: `Regulation data missing for ${stateCode}`,
    };
  }

  const flags: string[] = [];
  let requires_permit = false;
  let escorts_required = false;
  let escort_count_est = 0;
  let estimated_cost = 0;

  const t = req.dimensionThresholds;

  if (dims.width > t.maxLegalWidth) { requires_permit = true; flags.push(`Overwidth: ${dims.width}' > ${t.maxLegalWidth}'`); }
  if (dims.height > t.escortRequiredHeight) { requires_permit = true; flags.push(`Overheight: ${dims.height}' > ${t.escortRequiredHeight}'`); }
  if (dims.length > t.escortRequiredLength) { requires_permit = true; flags.push(`Overlength: ${dims.length}' > ${t.escortRequiredLength}'`); }
  if (dims.weight > t.permitRequiredWeight) { requires_permit = true; flags.push(`Overweight: ${dims.weight}lbs > ${t.permitRequiredWeight}lbs`); }

  if (dims.width >= t.escortRequiredWidth || dims.height >= t.escortRequiredHeight || dims.length >= t.escortRequiredLength) {
    escorts_required = true;
    escort_count_est = req.escortCount;
    if (t.dualEscortWidth && dims.width > t.dualEscortWidth) {
      escort_count_est = 2;
      flags.push('DUAL ESCORT — SUPERLOAD CLASSIFICATION');
    }
    flags.push(`Escorts Required (Est. ${escort_count_est})`);
  }

  if (req.permitTypes.length > 0) {
    estimated_cost = req.permitTypes[0].singleTripCost;
  }

  return {
    requires_permit,
    estimated_cost,
    flags,
    escorts_required,
    escort_count_est,
    fullRequirements: req,
  };
}

/**
 * @deprecated Use permitEngine.analyzeRoute() instead
 * Backward-compatible wrapper for route analysis
 */
export async function checkRoutePermits(states: string[], dims: LoadDimensions) {
  const results: Record<string, PermitCheckResult> = {};
  let total_cost_est = 0;
  let max_escorts = 0;

  for (const state of states) {
    const res = await checkStatePermit(state, dims);
    results[state] = res;
    total_cost_est += res.estimated_cost;
    max_escorts = Math.max(max_escorts, res.escort_count_est);
  }

  return {
    breakdown: results,
    total_permit_cost_est: total_cost_est,
    max_escorts_needed: max_escorts,
    summary: `Route through ${states.join(', ')} requires approx $${total_cost_est} in permits.`,
  };
}
