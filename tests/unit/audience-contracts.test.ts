import { describe, expect, it } from "vitest";
import {
  AUDIENCE_CONTRACTS,
  getAudienceContract,
  scoreAudienceContract,
} from "@/lib/audience/audience-contracts";

describe("audience contracts", () => {
  it("keeps baseline contract ids registered", () => {
    expect(AUDIENCE_CONTRACTS.map((contract) => contract.id)).toEqual(
      expect.arrayContaining([
        "directory-root",
        "directory-country",
        "provider-profile",
        "role-hub",
        "corridor-page",
        "regulation-page",
        "tool-page",
        "near-me",
      ]),
    );
  });

  it("scores complete evidence as passing", () => {
    const contract = getAudienceContract("directory-root");
    expect(contract).toBeDefined();

    const score = scoreAudienceContract(contract!, {
      ctas: contract!.requiredCtas,
      trustModules: contract!.requiredTrustModules,
      discoveryModules: contract!.requiredDiscoveryModules,
      internalLinkFamilies: contract!.requiredInternalLinkFamilies,
      schema: contract!.requiredSchema,
      hasNoDeadEndActions: true,
    });

    expect(score).toMatchObject({
      contractId: "directory-root",
      score: 100,
      pass: true,
      missing: [],
    });
  });

  it("surfaces missing buyer/provider/search obligations", () => {
    const contract = getAudienceContract("provider-profile");
    expect(contract).toBeDefined();

    const score = scoreAudienceContract(contract!, {
      ctas: ["find_providers"],
      trustModules: ["claimed_status"],
      discoveryModules: ["schema"],
      internalLinkFamilies: ["directory"],
      schema: ["BreadcrumbList"],
      hasNoDeadEndActions: false,
    });

    expect(score.pass).toBe(false);
    expect(score.missing).toEqual(
      expect.arrayContaining([
        "cta:post_load",
        "cta:claim_listing",
        "trust:source_confidence",
        "discovery:internal_links",
        "no_dead_end_actions",
      ]),
    );
  });
});

