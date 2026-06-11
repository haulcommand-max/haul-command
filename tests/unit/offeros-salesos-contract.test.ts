import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDecisionPackSkeleton,
  buildOfferKey,
  classifyObjection,
  containsUnsafeGuaranteeClaim,
  deriveFringeRescuePlan,
  normalizeCountryCodes,
  offerSupportsCountry,
  scorePartnerProfitFilter,
  validateSafeGuaranteeCopy,
} from "@/lib/offeros/offer-sales-contracts";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260520185113_offeros_salesos_command_layer.sql"),
  "utf8",
);

describe("OfferOS and SalesOS contract", () => {
  it("adds the bridge tables without destructive migration statements", () => {
    const expectedTables = [
      "hc_offeros_offers",
      "hc_offeros_proof_assets",
      "hc_salesos_opportunities",
      "hc_salesos_fringe_rescue_events",
      "hc_partner_profit_filters",
      "hc_adgrid_offer_targeting_rules",
      "hc_decision_pack_templates",
      "hc_salesos_call_qc_scores",
    ];

    for (const table of expectedTables) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }

    expect(migration.toLowerCase()).not.toContain("drop table");
    expect(migration.toLowerCase()).not.toContain("security definer");
    expect(migration).toContain("Service role manages OfferOS offers");
    expect(migration).toContain("Service role manages SalesOS opportunities");
  });

  it("keeps offers filterable by audience, product, role, country, and corridor", () => {
    const key = buildOfferKey({
      productKey: "adgrid-insurance-intent",
      audience: "insurance_partner",
      roleKeys: ["pilot_car_operator", "high-pole"],
      countryCodes: ["ca", "US", "us", "bad-code"],
      regionKeys: ["Florida"],
      corridorKeys: ["I-10"],
    });

    expect(key).toBe("adgrid-insurance-intent__insurance-partner__high-pole+pilot-car-operator__ca+us__florida__i-10");
    expect(normalizeCountryCodes(["us", "CA", "USA", ""])).toEqual(["CA", "US"]);
    expect(offerSupportsCountry([], "AU")).toBe(true);
    expect(offerSupportsCountry(["US", "CA"], "CA")).toBe(true);
    expect(offerSupportsCountry(["US", "CA"], "AU")).toBe(false);
  });

  it("blocks premium partner routing unless the partner is monetizable and trackable", () => {
    expect(
      scorePartnerProfitFilter({
        monetizable: false,
        referralTermsAvailable: true,
        callTrackingPossible: true,
        leadTrackingPossible: false,
        paidStatus: "paid",
        payoutModel: "pay_per_lead",
        complianceStatus: "approved",
        heavyHaulRelevance: 90,
      }),
    ).toMatchObject({
      premiumRoutingEligible: false,
      blockers: ["partner_not_monetizable"],
    });

    const approved = scorePartnerProfitFilter({
      monetizable: true,
      referralTermsAvailable: true,
      callTrackingPossible: true,
      leadTrackingPossible: true,
      paidStatus: "sponsor",
      payoutModel: "pay_per_call",
      complianceStatus: "approved",
      heavyHaulRelevance: 90,
      reputationScore: 80,
      responseSpeedScore: 70,
    });

    expect(approved.premiumRoutingEligible).toBe(true);
    expect(approved.partnerScore).toBeGreaterThanOrEqual(80);
  });

  it("classifies near-buyer objections into rescue categories", () => {
    expect(classifyObjection("We tried directories before and need proof this traffic is real")).toBe("uncertainty");
    expect(classifyObjection("I need to ask the owner and my office manager")).toBe("support");
    expect(classifyObjection("Can we do month-to-month because budget is tight?")).toBe("financial_logistic");
    expect(classifyObjection("Call back next month after launch")).toBe("timing_logistic");
  });

  it("flags unsafe guarantee copy before it reaches pages, calls, or ads", () => {
    expect(containsUnsafeGuaranteeClaim("We guarantee jobs for pilot car operators.")).toBe(true);
    expect(containsUnsafeGuaranteeClaim("Guaranteed insurance approval for every operator.")).toBe(true);
    expect(validateSafeGuaranteeCopy("We route your request and show matching attempt status.")).toEqual({ ok: true });
    expect(validateSafeGuaranteeCopy("We guarantee you a driver.")).toMatchObject({ ok: false });
  });

  it("creates decision packs with proof, pricing, objections, and a next step", () => {
    const pack = buildDecisionPackSkeleton({
      audience: "advertiser",
      productKey: "adgrid-corridor-sponsor",
      problem: "Generic ads miss the exact heavy-haul buyer moment.",
      mechanism: "AdGrid connects role, corridor, page family, buyer intent, and proof assets.",
      proofAssetKeys: ["sample-corridor-click-report"],
      pricingOptions: [{ label: "Corridor sponsor", value: "$199/mo" }],
      objectionAnswers: { uncertainty: "Start with a market snapshot and call tracking." },
      nextStepLabel: "Review campaign surfaces",
      nextStepUrl: "/advertise",
    });

    expect(pack.sections.map((section) => section.key)).toEqual([
      "problem",
      "mechanism",
      "proof",
      "pricing",
      "objections",
      "next_step",
    ]);
    expect(pack.proofAssetKeys).toEqual(["sample-corridor-click-report"]);
    expect(pack.nextStep).toEqual({ label: "Review campaign surfaces", url: "/advertise" });
  });

  it("scores fringe deal rescue moments by event, objection, and value", () => {
    const rescue = deriveFringeRescuePlan({
      sourceEventType: "insurance_click_no_submit",
      objectionType: "support",
      estimatedValueCents: 200_000,
    });

    expect(rescue.rescueScore).toBeGreaterThanOrEqual(90);
    expect(rescue.recommendedLivekitAction).toBe("schedule_value_follow_up");
    expect(rescue.nextBestCta).toBe("send_decision_pack");
  });
});
