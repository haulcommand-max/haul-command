import { describe, expect, it } from "vitest";
import {
  buildDirectoryFallbackFilterPlan,
  normalizeDirectoryCountry,
  resolveDirectoryCategoryFilter,
} from "@/lib/directory/server-query";

describe("directory fallback query planning", () => {
  it("keeps pilot-car searches in the operator family and pilot/escort subtypes", () => {
    const filter = resolveDirectoryCategoryFilter("pilot-car");

    expect(filter).toEqual({
      entityFamily: "operator",
      entitySubtypes: [
        "pilot_car_operator",
        "escort_operator",
        "pilot_driver",
        "pilot_car",
      ],
      searchTerms: ["pilot car", "escort vehicle", "lead", "chase"],
    });
  });

  it("normalizes supported country codes without turning invalid countries into US", () => {
    expect(normalizeDirectoryCountry(undefined)).toBe("US");
    expect(normalizeDirectoryCountry("ca")).toBe("CA");
    expect(normalizeDirectoryCountry("AU")).toBe("AU");
    expect(normalizeDirectoryCountry("washington")).toBeNull();
    expect(normalizeDirectoryCountry("USA")).toBeNull();
  });

  it("plans country, category, and location filters before confidence ranking", () => {
    const plan = buildDirectoryFallbackFilterPlan({
      country: "CA",
      category: "pilot-car",
      q: "Ontario",
    });

    expect(plan.countryCode).toBe("CA");
    expect(plan.category?.entityFamily).toBe("operator");
    expect(plan.category?.entitySubtypes).toContain("pilot_car_operator");
    expect(plan.locationSearch).toBe("Ontario");
    expect(plan.order).toEqual([
      { column: "rank_score", ascending: false },
      { column: "confidence_score", ascending: false },
      { column: "updated_at", ascending: false },
    ]);
    expect(plan.limit).toBe(50);
  });

  it("maps non-operator categories away from the pilot-car family", () => {
    expect(resolveDirectoryCategoryFilter("mobile-mechanic")).toMatchObject({
      entityFamily: "infrastructure",
      entitySubtypes: ["mobile_truck_repair", "repair_shop"],
    });
    expect(resolveDirectoryCategoryFilter("freight-broker")).toMatchObject({
      entityFamily: "broker",
      entitySubtypes: ["freight_broker"],
    });
  });
});
