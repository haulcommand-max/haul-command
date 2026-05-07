import { describe, expect, it } from "vitest";
import {
  decideFirecrawlAction,
  scoreSourceCandidate,
  validateFirecrawlJob,
} from "@/lib/intelligence/source-scoring";
import {
  DEFAULT_EXPANSION_THRESHOLDS,
  getInitialExpansionState,
  getNextExpansionStage,
  selectNextCountry,
} from "@/lib/intelligence/expansion-stage";
import { parseLoadCoveredText } from "@/lib/intelligence/loadcovered-parser";

describe("web intelligence source scoring", () => {
  it("scores official government permit sources high enough for Firecrawl proof capture", () => {
    const result = scoreSourceCandidate({
      url: "https://www.fdot.gov/maintenance/oversize-permits",
      title: "Florida oversize permit requirements",
      sourceType: "official_government",
      topic: "regulation",
      countryCode: "US",
      admin1Code: "FL",
    });

    expect(result.score).toBe(100);
    expect(decideFirecrawlAction(result)).toMatchObject({
      action: "firecrawl_scrape",
      requiresMoneyPath: false,
    });
  });

  it("stores weak generic sources without queueing Firecrawl", () => {
    const result = scoreSourceCandidate({
      url: "https://example-blog.test/random-ai-heavy-haul-post",
      title: "Best heavy haul tips",
      sourceType: "generic_blog",
      topic: "blog",
      countryCode: "US",
    });

    expect(result.score).toBe(20);
    expect(decideFirecrawlAction(result).action).toBe("reject_or_low_confidence");
  });

  it("requires explicit crawl limits and money path for premium Firecrawl jobs", () => {
    expect(() =>
      validateFirecrawlJob({
        endpoint: "crawl",
        url: "https://example.gov",
        sourceScore: 95,
        outputRoutes: ["regulation_fact"],
      }),
    ).toThrow(/explicit limit/i);

    expect(() =>
      validateFirecrawlJob({
        endpoint: "scrape",
        url: "https://competitor.test",
        sourceScore: 75,
        premiumModes: ["screenshot", "branding"],
        outputRoutes: ["competitor_gap"],
      }),
    ).toThrow(/money-path reason/i);

    expect(
      validateFirecrawlJob({
        endpoint: "crawl",
        url: "https://www.fdot.gov",
        sourceScore: 100,
        limit: 25,
        maxDiscoveryDepth: 2,
        allowExternalLinks: false,
        allowSubdomains: false,
        outputRoutes: ["regulation_fact", "authority_source"],
      }).ok,
    ).toBe(true);
  });
});

describe("market expansion stage gates", () => {
  it("starts in Florida completion", () => {
    expect(getInitialExpansionState()).toEqual({
      activeStage: "florida_completion",
      activeCountryCode: "US",
      activeAdmin1Code: "FL",
      activeMarketSlug: "us-fl",
    });
  });

  it("does not advance a market with critical blockers", () => {
    const next = getNextExpansionStage(
      {
        activeStage: "florida_completion",
        activeCountryCode: "US",
        activeAdmin1Code: "FL",
        activeMarketSlug: "us-fl",
      },
      {
        marketSlug: "us-fl",
        totalCompletionScore: 92,
        blockers: ["no official regulation source"],
      },
      DEFAULT_EXPANSION_THRESHOLDS,
    );

    expect(next.activeStage).toBe("florida_completion");
  });

  it("advances Florida to U.S., then U.S. to country selection", () => {
    const usStage = getNextExpansionStage(
      getInitialExpansionState(),
      { marketSlug: "us-fl", totalCompletionScore: 82, blockers: [] },
      DEFAULT_EXPANSION_THRESHOLDS,
    );

    expect(usStage).toMatchObject({
      activeStage: "us_completion",
      activeCountryCode: "US",
      activeAdmin1Code: null,
    });

    const selectionStage = getNextExpansionStage(
      usStage,
      { marketSlug: "us", totalCompletionScore: 76, blockers: [] },
      DEFAULT_EXPANSION_THRESHOLDS,
    );

    expect(selectionStage.activeStage).toBe("next_country_selection");
  });

  it("selects the next country from Supabase-style scoring, not a hardcoded country", () => {
    const selected = selectNextCountry([
      { countryCode: "CA", expansionPriorityScore: 68, legalRiskScore: 5, selectedNext: false },
      { countryCode: "AU", expansionPriorityScore: 82, legalRiskScore: 12, selectedNext: false },
      { countryCode: "GB", expansionPriorityScore: 79, legalRiskScore: 6, selectedNext: false },
    ]);

    expect(selected?.countryCode).toBe("AU");
  });
});

describe("LoadCovered-style historical demand parsing", () => {
  it("keeps raw demand rows, raw P role codes, private risk terms, and cautious entity buckets", () => {
    const parsed = parseLoadCoveredText(`
04/15/2026 Midwest Pilot Cars 605-670-9654 Need chase from Houston TX to Dallas TX QP
04/16/2026 Atlas Logistics Group 253-777-0272 Need P from Tampa FL to Jacksonville FL tomorrow sunrise
04/17/2026 Reliable Permit Solutions 909-436-4220 Route survey needed in PA, beware nonpay warning
`);

    expect(parsed.signals).toHaveLength(3);
    expect(parsed.signals[1].requestedRoleRaw).toBe("P");
    expect(parsed.signals[1].requestedRoleNormalized).toBe("unknown_raw_p");
    expect(parsed.entities.map(entity => entity.entityTypeGuess)).toEqual([
      "pilot_car_provider",
      "broker_dispatch_carrier",
      "permit_service",
    ]);
    expect(parsed.riskObservations).toHaveLength(1);
    expect(parsed.riskObservations[0]).toMatchObject({
      publicSafe: false,
      riskTerms: ["beware", "nonpay"],
    });
  });
});
