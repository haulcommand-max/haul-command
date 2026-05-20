import { describe, expect, it } from "vitest";
import {
  buildCompetitorIntelSummary,
  daysSinceChecked,
  normalizeCompetitorStatus,
} from "@/lib/competitor/competitor-intel-engine";

describe("competitor intel engine", () => {
  it("normalizes known and unknown competitor states", () => {
    expect(normalizeCompetitorStatus("winning")).toBe("WINNING");
    expect(normalizeCompetitorStatus("TIED")).toBe("TIED");
    expect(normalizeCompetitorStatus("behind")).toBe("BEHIND");
    expect(normalizeCompetitorStatus("")).toBe("UNKNOWN");
  });

  it("computes stale intel age from a supplied clock", () => {
    expect(daysSinceChecked("2026-05-01T00:00:00.000Z", new Date("2026-05-20T00:00:00.000Z"))).toBe(19);
    expect(daysSinceChecked(null)).toBeNull();
  });

  it("prioritizes exposed markets and high-value unclaimed targets", () => {
    const summary = buildCompetitorIntelSummary(
      [
        { competitor_name: "OSOW Haven", coverage_delta: -8, our_status: "BEHIND", last_checked: "2026-05-01T00:00:00.000Z" },
        { competitor_name: "OSOW Haven", coverage_delta: 2, our_status: "WINNING", last_checked: "2026-05-19T00:00:00.000Z" },
        { competitor_name: "Truck Stops and Services", coverage_delta: 0, our_status: "TIED", last_checked: null },
      ],
      [
        { claim_value_score: 92, is_claimed: false },
        { claim_value_score: 80, is_claimed: true },
        { claim_value_score: 71, is_claimed: false },
      ],
      new Date("2026-05-20T00:00:00.000Z"),
    );

    expect(summary.statusCounts).toMatchObject({ WINNING: 1, TIED: 1, BEHIND: 1, UNKNOWN: 0 });
    expect(summary.trackedCompetitors).toBe(2);
    expect(summary.netCoverageDelta).toBe(-6);
    expect(summary.staleIntel).toBe(2);
    expect(summary.highValueClaims).toBe(3);
    expect(summary.unclaimedCompetitorTargets).toBe(2);
    expect(summary.mostExposedMarkets[0].coverage_delta).toBe(-8);
    expect(summary.topClaimTargets.map((target) => target.claim_value_score)).toEqual([92, 71]);
    expect(summary.priorityMoves[0]).toMatchObject({
      priority: "P0",
      title: "Displacement markets",
      count: 1,
    });
  });
});
