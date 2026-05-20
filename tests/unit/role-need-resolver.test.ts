import { describe, expect, it } from "vitest";
import { resolveSupportRoles } from "@/lib/support/role-need-resolver";

describe("resolveSupportRoles", () => {
  it("recommends high-pole, route survey, permit, and traffic-control support for hard moves", () => {
    const plan = resolveSupportRoles({
      countryCode: "US",
      widthFt: 17,
      heightFt: 15.5,
      weightLbs: 160000,
      routeConfidence: "needs_review",
      permitReadiness: "not_started",
      urgency: "today",
    });

    expect(plan.riskLevel).toBe("critical");
    expect(plan.recommendedRoles.map((role) => role.id)).toEqual(
      expect.arrayContaining([
        "pilot_car_operator",
        "high_pole_escort",
        "route_surveyor",
        "permit_service",
        "traffic_control",
        "staging_yard",
      ]),
    );
    expect(plan.nextActions.map((action) => action.intent)).toEqual([
      "find_provider",
      "post_load",
      "check_requirements",
      "claim_listing",
    ]);
  });

  it("does not pretend non-US recommendations are legal determinations", () => {
    const plan = resolveSupportRoles({
      countryCode: "DE",
      heightFt: 14.2,
      routeConfidence: "unknown",
      permitReadiness: "in_progress",
    });

    expect(plan.countryCode).toBe("DE");
    expect(plan.recommendedRoles.map((role) => role.id)).toContain("high_pole_escort");
    expect(plan.warnings.join(" ")).toContain("Country-specific role names");
    expect(plan.disclaimer).toContain("Verify live rules");
  });

  it("returns no-dead-end actions even when dimensions are missing", () => {
    const plan = resolveSupportRoles({ countryCode: "US" });

    expect(plan.recommendedRoles[0]?.id).toBe("pilot_car_operator");
    expect(plan.warnings.join(" ")).toContain("Add load dimensions");
    expect(plan.nextActions).toHaveLength(4);
  });
});
