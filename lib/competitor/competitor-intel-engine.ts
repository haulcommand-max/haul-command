export type CompetitorStatusKey = "WINNING" | "TIED" | "BEHIND" | "UNKNOWN";

export interface CompetitorCoverageLike {
  competitor_name: string | null;
  coverage_delta: number | null;
  our_status: string | null;
  last_checked: string | null;
}

export interface CompetitorClaimTargetLike {
  claim_value_score: number | null;
  is_claimed: boolean | null;
}

export interface CompetitorIntelSummary<TCoverage extends CompetitorCoverageLike, TClaim extends CompetitorClaimTargetLike> {
  statusCounts: Record<CompetitorStatusKey, number>;
  trackedCompetitors: number;
  trackedMarkets: number;
  netCoverageDelta: number;
  highValueClaims: number;
  unclaimedCompetitorTargets: number;
  staleIntel: number;
  topClaimValue: number;
  mostExposedMarkets: TCoverage[];
  topClaimTargets: TClaim[];
  priorityMoves: Array<{
    priority: "P0" | "P1" | "P2";
    title: string;
    count: number;
    action: string;
  }>;
}

export function normalizeCompetitorStatus(status: string | null): CompetitorStatusKey {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "WINNING" || normalized === "TIED" || normalized === "BEHIND") {
    return normalized;
  }
  return "UNKNOWN";
}

export function competitorNumberValue(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function daysSinceChecked(value: string | null, now = new Date()): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((now.getTime() - parsed.getTime()) / 86_400_000);
}

export function buildCompetitorIntelSummary<TCoverage extends CompetitorCoverageLike, TClaim extends CompetitorClaimTargetLike>(
  intel: TCoverage[],
  claimQueue: TClaim[],
  now = new Date(),
): CompetitorIntelSummary<TCoverage, TClaim> {
  const statusCounts = intel.reduce<Record<CompetitorStatusKey, number>>(
    (acc, row) => {
      acc[normalizeCompetitorStatus(row.our_status)] += 1;
      return acc;
    },
    { WINNING: 0, TIED: 0, BEHIND: 0, UNKNOWN: 0 },
  );

  const mostExposedMarkets = intel
    .filter((row) => normalizeCompetitorStatus(row.our_status) === "BEHIND" || competitorNumberValue(row.coverage_delta) < 0)
    .sort((a, b) => competitorNumberValue(a.coverage_delta) - competitorNumberValue(b.coverage_delta))
    .slice(0, 12);

  const topClaimTargets = claimQueue
    .filter((operator) => !operator.is_claimed)
    .sort((a, b) => competitorNumberValue(b.claim_value_score) - competitorNumberValue(a.claim_value_score))
    .slice(0, 5);

  const staleIntel = intel.filter((row) => {
    const age = daysSinceChecked(row.last_checked, now);
    return age == null || age > 14;
  }).length;

  const highValueClaims = claimQueue.filter(
    (operator) => competitorNumberValue(operator.claim_value_score) >= 70,
  ).length;
  const unclaimedCompetitorTargets = claimQueue.filter((operator) => !operator.is_claimed).length;
  const topClaimValue = claimQueue.reduce(
    (max, operator) => Math.max(max, competitorNumberValue(operator.claim_value_score)),
    0,
  );

  return {
    statusCounts,
    trackedCompetitors: new Set(intel.map((row) => row.competitor_name).filter(Boolean)).size,
    trackedMarkets: intel.length,
    netCoverageDelta: intel.reduce((sum, row) => sum + competitorNumberValue(row.coverage_delta), 0),
    highValueClaims,
    unclaimedCompetitorTargets,
    staleIntel,
    topClaimValue,
    mostExposedMarkets,
    topClaimTargets,
    priorityMoves: [
      {
        priority: "P0",
        title: "Displacement markets",
        count: mostExposedMarkets.length,
        action: "Work the lowest coverage deltas first with claim outreach, provider acquisition, and local page repair.",
      },
      {
        priority: "P1",
        title: "Steal-back queue",
        count: unclaimedCompetitorTargets,
        action: "Route the highest claim_value_score operators into owner contact, proof request, and claim sequence.",
      },
      {
        priority: "P1",
        title: "Stale intel refresh",
        count: staleIntel,
        action: "Refresh records older than 14 days before using them for paid territory or market-coverage decisions.",
      },
      {
        priority: "P2",
        title: "Winning markets",
        count: statusCounts.WINNING,
        action: "Turn winning coverage into proof modules, sponsor decks, and local authority pages after P0 gaps are handled.",
      },
    ],
  };
}
