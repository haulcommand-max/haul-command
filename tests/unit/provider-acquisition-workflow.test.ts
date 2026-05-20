import { describe, expect, it } from "vitest";
import { buildProviderAcquisitionWorkflow } from "@/lib/acquisition/provider-acquisition-workflow";

describe("provider acquisition workflow", () => {
  it("builds a no-credit-spend workflow for a role and market", () => {
    const workflow = buildProviderAcquisitionWorkflow({
      role: "pilot car operator",
      countryCode: "us",
      region: "Texas",
      city: "Houston",
      targetBatchSize: 75,
    });

    expect(workflow.workflowKey).toBe("provider-acquisition:US:texas-houston-pilot-car-operator");
    expect(workflow.queryPack).toEqual(
      expect.arrayContaining([
        "pilot car operator Houston Texas US",
        "pilot car operator near Houston Texas US",
      ]),
    );
    expect(workflow.budget.maxProspects).toBe(75);
    expect(workflow.stages.map((stage) => stage.tool)).toEqual([
      "tavily_search",
      "tavily_extract",
      "firecrawl_scrape",
      "clay_import",
      "clay_enrich",
      "discovery_ingest",
      "dedupe_review",
      "claim_outreach",
    ]);
  });

  it("clamps batch size to protect free-tier Clay and Firecrawl spend", () => {
    const workflow = buildProviderAcquisitionWorkflow({
      role: "high pole escort",
      countryCode: "CA",
      targetBatchSize: 500,
    });

    expect(workflow.budget.maxProspects).toBe(100);
    expect(workflow.budget.firecrawlCredits).toBeLessThanOrEqual(50);
    expect(workflow.budget.clayDataCredits).toBeLessThanOrEqual(100);
  });

  it("keeps every Firecrawl policy routed to durable outputs", () => {
    const workflow = buildProviderAcquisitionWorkflow({
      role: "route survey provider",
      countryCode: "AU",
    });

    expect(workflow.firecrawlPolicies.length).toBeGreaterThan(0);
    for (const policy of workflow.firecrawlPolicies) {
      expect(policy.outputRoutes.length).toBeGreaterThan(0);
      expect(policy.allowExternalLinks).toBe(false);
      expect(policy.allowSubdomains).toBe(false);
    }
  });
});
