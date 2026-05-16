import { describe, expect, it } from "vitest";
import {
  fallbackRowMatchesCategory,
  normalizeDirectoryFallbackRow,
} from "@/lib/directory/fallback-normalization";

describe("directory fallback normalization", () => {
  const pilotCategory = {
    entitySubtypes: ["pilot_car_operator", "escort_operator", "pilot_driver", "pilot_car"],
  };

  it("keeps publishable rows whose category signals only exist in metadata", () => {
    const row = normalizeDirectoryFallbackRow(
      {
        company: "Fallback Pilot Cars",
        country_code_inferred: "US",
        state_code: "TX",
        metadata: {
          entity_family: "operator",
          entity_subtype: "pilot_car_operator",
          service_categories: ["pilot car", "high pole"],
        },
      },
      "v_directory_publishable",
    );

    expect(row.entity_subtype).toBe("pilot_car_operator");
    expect(fallbackRowMatchesCategory(row, pilotCategory)).toBe(true);
  });

  it("rejects unrelated fallback rows before the browser filter sees them", () => {
    expect(
      fallbackRowMatchesCategory(
        {
          name: "Unrelated Truck Parking",
          entity_subtype: "truck_parking",
          metadata: { service_categories: ["parking", "staging"] },
        },
        pilotCategory,
      ),
    ).toBe(false);
  });
});
