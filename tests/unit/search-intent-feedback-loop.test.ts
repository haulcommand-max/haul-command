import { describe, expect, it } from "vitest";
import { buildSearchIntentFeedbackPlan } from "@/lib/growth/search-intent-feedback-loop";

describe("search intent feedback loop", () => {
  it("turns paid no-result demand into noindex market gap and acquisition actions", () => {
    const plan = buildSearchIntentFeedbackPlan({
      query: "pilot car operator Texas",
      source: "google_ads",
      role: "pilot car operator",
      countryCode: "us",
      region: "Texas",
      clicks: 14,
      noResultsCount: 2,
      resultsCount: 0,
    });

    expect(plan.indexablePageAllowed).toBe(false);
    expect(plan.indexabilityReason).toBe("noindex_until_supply_or_unique_data_exists");
    expect(plan.actions.map((action) => action.type)).toEqual(expect.arrayContaining(["create_noindex_market_opportunity", "queue_provider_acquisition", "fix_directory_search"]));
  });

  it("promotes converting role-place queries to SEO candidates with survival review", () => {
    const plan = buildSearchIntentFeedbackPlan({
      query: "high pole escort Houston",
      source: "directory_search",
      role: "high pole escort",
      countryCode: "us",
      region: "Texas",
      city: "Houston",
      clicks: 6,
      providerClicks: 5,
      resultsCount: 8,
    });

    expect(plan.indexablePageAllowed).toBe(true);
    expect(plan.actions.map((action) => action.type)).toContain("create_seo_page_candidate");
    expect(plan.actions.find((action) => action.type === "create_seo_page_candidate")?.reason).toContain("survival-score review");
  });

  it("routes requirement searches into FAQ/AEO and training/tool work", () => {
    const plan = buildSearchIntentFeedbackPlan({
      query: "do I need a pilot car in Florida",
      source: "organic_search",
      role: "pilot car operator",
      countryCode: "us",
      region: "Florida",
      clicks: 4,
      resultsCount: 3,
    });

    expect(plan.inferredIntent).toBe("learn_requirement");
    expect(plan.actions.map((action) => action.type)).toEqual(expect.arrayContaining(["add_faq_or_aeo_block", "create_training_or_tool_snippet"]));
  });
});
