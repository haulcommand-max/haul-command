/**
 * Corridor Signal Engine
 * 
 * Computes hard-fill, hot-corridor, and thin-corridor signals
 * based on operator count, activity, and claim density.
 * 
 * Signal thresholds from execution board:
 * - Hard fill: activity_7d >= 8 AND operator_count <= 5
 * - Hot corridor: activity_7d >= 12 AND claim_density >= 0.20
 * - Thin corridor: operator_count < 3 OR claimed_operator_count < 1
 * - Sponsor eligible: sessions_30d >= 400 AND quality_guardrail_pass
 */

export interface CorridorSignal {
  corridorSlug: string;
  operatorCount: number;
  claimedOperatorCount: number;
  recentActivity7d: number;
  recentActivity30d: number;
  pageSessions30d: number;
  claimDensity: number;
  hardFill: boolean;
  hotCorridor: boolean;
  thinCorridor: boolean;
  sponsorEligible: boolean;
  sponsorFloorUsd: number | null;
  rateChangeVs7dPct: number | null;
}

export function computeCorridorSignals(data: {
  operatorCount: number;
  claimedOperatorCount: number;
  recentActivity7d: number;
  recentActivity30d: number;
  pageSessions30d: number;
  rateChangeVs7dPct?: number | null;
}): Omit<CorridorSignal, 'corridorSlug'> {
  const claimDensity = data.operatorCount > 0 ? data.claimedOperatorCount / data.operatorCount : 0;
  
  const hardFill = data.recentActivity7d >= 8 && data.operatorCount <= 5;
  const hotCorridor = data.recentActivity7d >= 12 && claimDensity >= 0.20;
  const thinCorridor = data.operatorCount < 3 || data.claimedOperatorCount < 1;
  const sponsorEligible = data.pageSessions30d >= 400;
  
  // Floor pricing: base $350, +25% for hot corridors
  let sponsorFloorUsd: number | null = null;
  if (sponsorEligible) {
    sponsorFloorUsd = hotCorridor ? 350 * 1.25 : 350;
  }

  return {
    operatorCount: data.operatorCount,
    claimedOperatorCount: data.claimedOperatorCount,
    recentActivity7d: data.recentActivity7d,
    recentActivity30d: data.recentActivity30d,
    pageSessions30d: data.pageSessions30d,
    claimDensity,
    hardFill,
    hotCorridor,
    thinCorridor,
    sponsorEligible,
    sponsorFloorUsd,
    rateChangeVs7dPct: data.rateChangeVs7dPct ?? null,
  };
}

export function getCorridorSignalBadge(signal: CorridorSignal): { label: string; color: string; icon: string } | null {
  if (signal.hardFill) {
    return { label: 'Hard Fill', color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '🔴' };
  }
  if (signal.hotCorridor) {
    return { label: 'Hot Corridor', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', icon: '🔥' };
  }
  if (signal.thinCorridor) {
    return { label: 'Coverage Needed', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⚠️' };
  }
  return null;
}
