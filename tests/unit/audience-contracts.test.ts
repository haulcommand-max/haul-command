import { describe, expect, it } from "vitest";
import {
  AUDIENCE_CTA_BUNDLES,
  DIRECTORY_AUDIENCE_CONTRACT,
  scoreAudienceContract,
  type AudienceContract,
} from "@/lib/audience/audience-contracts";

describe("three audience contract", () => {
  it("keeps the directory useful for demand, supply, discovery, and monetization", () => {
    const score = scoreAudienceContract(DIRECTORY_AUDIENCE_CONTRACT);

    expect(DIRECTORY_AUDIENCE_CONTRACT.primaryAudience).toBe("demand");
    expect(DIRECTORY_AUDIENCE_CONTRACT.secondaryAudiences).toEqual(["supply", "discovery", "monetization"]);
    expect(score.failures).toEqual([]);
    expect(score.indexableRecommended).toBe(true);
    expect(score.overall).toBeGreaterThanOrEqual(8);
  });

  it("keeps sponsor CTAs separate from primary support and claim paths", () => {
    expect(AUDIENCE_CTA_BUNDLES.demand.map((cta) => cta.intent)).toContain("post_load");
    expect(AUDIENCE_CTA_BUNDLES.supply.map((cta) => cta.intent)).toContain("claim_listing");
    expect(AUDIENCE_CTA_BUNDLES.monetization.map((cta) => cta.intent)).toContain("sponsor_market");
    expect(DIRECTORY_AUDIENCE_CONTRACT.monetizationRules.join(" ")).toContain("fake availability");
  });

  it("flags a page that is SEO-only and dead-ended", () => {
    const weak: AudienceContract = {
      ...DIRECTORY_AUDIENCE_CONTRACT,
      requiredCtas: {
        demand: [],
        supply: [],
        discovery: [{ label: "FAQ", href: "#faq", intent: "faq" }],
        monetization: [],
      },
      requiredTrustModules: [],
      requiredDiscoveryModules: ["FAQ"],
      requiredInternalLinkFamilies: [],
      noDeadEndActions: [],
      monetizationRules: [],
      localizationRules: [],
    };

    const score = scoreAudienceContract(weak);
    expect(score.indexableRecommended).toBe(false);
    expect(score.failures).toEqual(
      expect.arrayContaining([
        "Demand-side next actions are too thin.",
        "Supply-side claim/profile path is missing.",
        "No-dead-end action set must include at least three useful moves.",
      ]),
    );
  });
});
