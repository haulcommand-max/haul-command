import { describe, expect, it } from "vitest";
import {
  getDisplacementAction,
  getDisplacementPriority,
  normalizeCompetitorStatus,
  summarizeCompetitorIntel,
  type ClaimTargetLike,
  type CompetitorIntelLike,
} from "@/lib/admin/competitor-intel";

const NOW = new Date("2026-05-20T12:00:00Z").getTime();

function market(overrides: Partial<CompetitorIntelLike>): CompetitorIntelLike {
  return {
    id: overrides.id ?? "market",
    competitor_name: overrides.competitor_name ?? "OSOW Haven",
    country_code: overrides.country_code ?? "US",
    state: overrides.state ?? "TX",
    competitor_operator_count: overrides.competitor_operator_count ?? 10,
    our_operator_count: overrides.our_operator_count ?? 5,
    coverage_delta: overrides.coverage_delta ?? -5,
    our_status: overrides.our_status ?? "BEHIND",
    last_checked: overrides.last_checked ?? "2026-05-18T12:00:00Z",
  };
}

function claim(overrides: Partial<ClaimTargetLike>): ClaimTargetLike {
  return {
    id: overrides.id ?? "operator",
    company_name: overrides.company_name ?? "Claim Target",
    country_code: overrides.country_code ?? "US",
    claim_value_score: overrides.claim_value_score ?? 80,
    is_claimed: overrides.is_claimed ?? false,
  };
}

describe("competitor intel admin prioritization", () => {
  it("normalizes known and unknown competitor statuses", () => {
    expect(normalizeCompetitorStatus("winning")).toBe("WINNING");
    expect(normalizeCompetitorStatus("BEHIND")).toBe("BEHIND");
    expect(normalizeCompetitorStatus("needs_scan")).toBe("UNKNOWN");
  });

  it("prioritizes losing and stale markets without fake certainty", () => {
    expect(getDisplacementPriority(market({ coverage_delta: -12, our_status: "TIED" }), NOW)).toBe("P0");
    expect(getDisplacementPriority(market({ coverage_delta: -1, our_status: "TIED" }), NOW)).toBe("P1");
    expect(getDisplacementPriority(market({ coverage_delta: 4, our_status: "WINNING", last_checked: "2026-04-20T12:00:00Z" }), NOW)).toBe("P2");
    expect(getDisplacementAction(market({ coverage_delta: -12 }), NOW)).toContain("Claim operators");
  });

  it("builds the admin dashboard summary and claim queue order", () => {
    const summary = summarizeCompetitorIntel(
      [
        market({ id: "p0", competitor_name: "OSOW Haven", coverage_delta: -12, our_status: "BEHIND" }),
        market({ id: "p1", competitor_name: "Truck Stops and Services", coverage_delta: -1, our_status: "TIED" }),
        market({ id: "watch", competitor_name: "OSOW Haven", coverage_delta: 6, our_status: "WINNING" }),
      ],
      [
        claim({ id: "low", claim_value_score: 45 }),
        claim({ id: "high", claim_value_score: 91 }),
        claim({ id: "claimed", claim_value_score: 99, is_claimed: true }),
      ],
      NOW,
    );

    expect(summary.trackedCompetitors).toBe(2);
    expect(summary.statusCounts).toMatchObject({ WINNING: 1, TIED: 1, BEHIND: 1 });
    expect(summary.mostExposedMarkets.map((row) => row.id)).toEqual(["p0", "p1"]);
    expect(summary.topClaimTargets.map((row) => row.id)).toEqual(["high", "low"]);
    expect(summary.unclaimedCompetitorTargets).toBe(2);
  });
});
