import { describe, expect, it } from "vitest";
import {
  buildDirectoryFallbackFilterPlan,
  buildDirectoryMarketFilterPlan,
  normalizeDirectoryCountry,
  resolveDirectoryCategoryFilter,
  resolveDirectorySurfaceViews,
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
    expect(normalizeDirectoryCountry(undefined)).toBeNull();
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

  it("treats role searches as category intent instead of no-result location text", () => {
    const plan = buildDirectoryFallbackFilterPlan({
      q: "Pilot car operators",
    });

    expect(plan.category?.entityFamily).toBe("operator");
    expect(plan.category?.entitySubtypes).toContain("pilot_car_operator");
    expect(plan.surfaceViews).toEqual(["v_directory_operators"]);
    expect(plan.locationSearch).toBe("");
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

  it("normalizes route-support assets into the infrastructure family", () => {
    expect(resolveDirectoryCategoryFilter("truck-stop")).toMatchObject({
      entityFamily: "infrastructure",
      entitySubtypes: ["truck_stop", "fuel_station", "cat_scale_location"],
    });
    expect(resolveDirectoryCategoryFilter("scale-weigh-station-public")).toMatchObject({
      entityFamily: "infrastructure",
      entitySubtypes: ["weigh_station"],
    });
    expect(resolveDirectoryCategoryFilter("rest-stop")).toMatchObject({
      entityFamily: "infrastructure",
      entitySubtypes: ["rest_area"],
    });
    expect(resolveDirectoryCategoryFilter("intermodal-terminal")).toMatchObject({
      entityFamily: "infrastructure",
      entitySubtypes: ["rail_intermodal", "freight_terminal"],
    });
    expect(resolveDirectoryCategoryFilter("tunnel-authority")).toMatchObject({
      entityFamily: "infrastructure",
      entitySubtypes: ["tunnel", "tunnel_authority"],
    });
  });

  it("keeps the default directory broad enough to include carrier and authority surfaces", () => {
    const surfaces = resolveDirectorySurfaceViews();

    expect(surfaces).toEqual([
      "v_directory_operators",
      "v_directory_support_locations",
      "v_directory_services",
      "v_directory_brokers",
      "v_directory_carriers",
      "v_directory_infrastructure",
      "v_directory_authorities",
    ]);
  });

  it("plans non-US country metro routes across the full directory", () => {
    const plan = buildDirectoryMarketFilterPlan({ country: "de", slug: "hamburg" });

    expect(plan.countryCode).toBe("DE");
    expect(plan.marketName).toBe("Hamburg");
    expect(plan.scope).toEqual({ type: "metro", name: "Hamburg" });
    expect(plan.noIndexWhenEmpty).toBe(true);
    expect(plan.surfaceViews).toEqual(resolveDirectorySurfaceViews());
    expect(plan.locationOrFilter).toContain("city_inferred.ilike.%Hamburg%");
    expect(plan.locationOrFilter).toContain("state_inferred.ilike.%Hamburg%");
  });
});
