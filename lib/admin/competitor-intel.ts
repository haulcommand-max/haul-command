export type CompetitorStatus = "WINNING" | "TIED" | "BEHIND" | "UNKNOWN";
export type DisplacementPriority = "P0" | "P1" | "P2" | "WATCH";

export interface CompetitorIntelLike {
  id: string;
  competitor_name: string;
  country_code: unknown | null;
  state: unknown | null;
  competitor_operator_count: number | null;
  our_operator_count: number | null;
  coverage_delta: number | null;
  our_status: string | null;
  competitor_url?: string | null;
  last_checked: string | null;
  notes?: string | null;
}

export interface ClaimTargetLike {
  id: string;
  company_name: string;
  country_code: unknown | null;
  state?: unknown | null;
  region?: string | null;
  source?: string | null;
  competitor_source?: string | null;
  claim_priority?: string | null;
  claim_value_score: number | null;
  is_claimed: boolean | null;
}

export function normalizeCompetitorStatus(status: string | null | undefined): CompetitorStatus {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "WINNING" || normalized === "TIED" || normalized === "BEHIND") {
    return normalized;
  }
  return "UNKNOWN";
}

export function numberValue(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function daysSince(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((now - parsed.getTime()) / 86_400_000);
}

export function getDisplacementPriority(row: CompetitorIntelLike, now = Date.now()): DisplacementPriority {
  const status = normalizeCompetitorStatus(row.our_status);
  const delta = numberValue(row.coverage_delta);
  const age = daysSince(row.last_checked, now);

  if (status === "BEHIND" || delta <= -10) return "P0";
  if (delta < 0 || status === "TIED") return "P1";
  if (age == null || age > 14) return "P2";
  return "WATCH";
}

export function getDisplacementAction(row: CompetitorIntelLike, now = Date.now()): string {
  const priority = getDisplacementPriority(row, now);
  if (priority === "P0") return "Claim operators, refresh local page proof, and run direct outreach before sponsor sales.";
  if (priority === "P1") return "Build the claim queue, add local proof, and monitor the next coverage refresh.";
  if (priority === "P2") return "Refresh the competitor scan before using this market for acquisition decisions.";
  return "Keep monitoring; current coverage does not require a displacement sprint.";
}

export function summarizeCompetitorIntel(
  intel: CompetitorIntelLike[],
  claimQueue: ClaimTargetLike[],
  now = Date.now(),
) {
  const statusCounts = intel.reduce<Record<CompetitorStatus, number>>(
    (acc, row) => {
      acc[normalizeCompetitorStatus(row.our_status)] += 1;
      return acc;
    },
    { WINNING: 0, TIED: 0, BEHIND: 0, UNKNOWN: 0 },
  );

  const prioritizedMarkets = [...intel].sort((a, b) => {
    const priorityOrder: Record<DisplacementPriority, number> = { P0: 0, P1: 1, P2: 2, WATCH: 3 };
    const priorityDelta = priorityOrder[getDisplacementPriority(a, now)] - priorityOrder[getDisplacementPriority(b, now)];
    if (priorityDelta !== 0) return priorityDelta;
    return numberValue(a.coverage_delta) - numberValue(b.coverage_delta);
  });

  const topClaimTargets = [...claimQueue]
    .filter((operator) => !operator.is_claimed)
    .sort((a, b) => numberValue(b.claim_value_score) - numberValue(a.claim_value_score));

  return {
    statusCounts,
    trackedCompetitors: new Set(intel.map((row) => row.competitor_name)).size,
    trackedMarkets: intel.length,
    netCoverageDelta: intel.reduce((sum, row) => sum + numberValue(row.coverage_delta), 0),
    highValueClaims: claimQueue.filter((operator) => numberValue(operator.claim_value_score) >= 70).length,
    unclaimedCompetitorTargets: topClaimTargets.length,
    staleIntel: intel.filter((row) => {
      const age = daysSince(row.last_checked, now);
      return age == null || age > 14;
    }).length,
    topClaimValue: claimQueue.reduce((max, operator) => Math.max(max, numberValue(operator.claim_value_score)), 0),
    mostExposedMarkets: prioritizedMarkets
      .filter((row) => getDisplacementPriority(row, now) !== "WATCH")
      .slice(0, 12),
    topClaimTargets: topClaimTargets.slice(0, 5),
  };
}
