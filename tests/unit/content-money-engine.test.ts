import { describe, expect, it } from "vitest";
import { buildContentMoneyPlan } from "@/lib/content-os/content-money-engine";

describe("content money engine", () => {
  it("publishes a strong content-to-money asset with reusable surfaces", () => {
    const plan = buildContentMoneyPlan({
      franchise: "would_you_take_this_load",
      role: "high-pole escort",
      audience: "broker",
      hook: "Would this load need a high-pole escort before it leaves Houston?",
      problem: "The broker can find a carrier but may miss the height support role.",
      story: "The route crosses Houston and I-10 with height and route support details that change who needs to be called.",
      payoff: "Haul Command turns the lesson into a role-aware support request and provider search path.",
      cta: "Build route support packet",
      targetUrl: "/tools/route-iq",
      countryCode: "us",
      region: "Texas",
      city: "Houston",
      corridor: "I-10",
      proofSignal: "route or dimension detail",
      revenueTags: ["post_load", "route_packet"],
    });

    expect(plan.publishable).toBe(true);
    expect(plan.blockers).toEqual([]);
    expect(plan.revenueTags).toEqual(expect.arrayContaining(["post_load", "route_packet"]));
    expect(plan.websiteSurfaces.map((surface) => surface.target)).toEqual(expect.arrayContaining(["short_form_video", "remotion_script", "directory_page_module"]));
  });

  it("blocks product-first hooks and missing revenue paths", () => {
    const plan = buildContentMoneyPlan({
      franchise: "broker_mistake_breakdown",
      role: "pilot car operator",
      audience: "broker",
      hook: "Haul Command is a heavy haul directory",
      problem: "Generic product pitch.",
      story: "No industry story.",
      payoff: "No payoff.",
      cta: "",
      targetUrl: "",
      proofSignal: null,
      revenueTags: [],
    });

    expect(plan.publishable).toBe(false);
    expect(plan.blockers).toEqual(expect.arrayContaining(["product_first_hook", "missing_revenue_tag", "missing_cta_or_target", "missing_proof_or_credential"]));
  });

  it("requires country scope, source confidence, and verify warning for safety or regulation claims", () => {
    const input = {
      franchise: "country_rule_in_30_seconds",
      role: "pilot car operator",
      audience: "carrier",
      hook: "Florida oversize loads: check this before moving.",
      problem: "Rules can be missed.",
      story: "The move crosses a state line.",
      payoff: "The page explains what to verify.",
      cta: "Check requirements",
      targetUrl: "/escort-requirements/florida",
      countryCode: "us",
      region: "Florida",
      proofSignal: "source confidence",
      revenueTags: ["training"],
      claimType: "regulatory",
    } as const;

    const unsafe = buildContentMoneyPlan(input);

    expect(unsafe.publishable).toBe(false);
    expect(unsafe.blockers).toContain("missing_regulatory_or_safety_disclaimer");

    const safe = buildContentMoneyPlan({
      ...input,
      sourceConfidence: "verified",
      verifyBeforeDispatchDisclaimer: true,
    });

    expect(safe.blockers).not.toContain("missing_regulatory_or_safety_disclaimer");
  });

  it("turns weak-supply search failures into market opportunity plans", () => {
    const plan = buildContentMoneyPlan({
      franchise: "search_failure_market_opportunity",
      role: "route survey provider",
      audience: "provider",
      hook: "People are searching for route survey providers in Odessa, but supply is thin.",
      problem: "Search demand exists before claimed provider coverage.",
      story: "A missed result can become a provider claim campaign and local sponsor slot.",
      payoff: "Haul Command captures the market gap instead of dead-ending the user.",
      cta: "Claim this market",
      targetUrl: "/directory/us?role=route-survey-provider&region=texas",
      countryCode: "us",
      region: "Texas",
      city: "Odessa",
      proofSignal: "search demand",
      revenueTags: ["claim", "sponsor", "adgrid"],
      weakSupplySignal: true,
      searchVolumeSignal: 42,
    });

    expect(plan.marketOpportunity).toMatchObject({
      slug: "us-texas-odessa-route-survey-provider-demand",
    });
    expect(plan.marketOpportunity?.nextActions).toEqual(expect.arrayContaining(["Queue provider claim outreach for this role and location."]));
  });
});
