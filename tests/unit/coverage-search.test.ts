import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCoverageSearchFilters,
  mapCoverageRows,
} from "@/lib/coverage/search";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("mobile coverage search", () => {
  it("does not return hardcoded verified operators", () => {
    const route = read("app/api/v1/coverage/search/route.ts");

    expect(route).not.toContain("dummyResults");
    expect(route).not.toContain("Texas Pilot Pro");
    expect(route).not.toContain("Gulf Coast Escorts");
    expect(route).toContain("searchCoverageOperators");
  });

  it("normalizes request filters without defaulting every search to Texas", () => {
    expect(buildCoverageSearchFilters({ state: "tx", role: "pilot car", limit: 500 })).toEqual({
      country: null,
      state: "TX",
      role: "pilot car",
      limit: 50,
      offset: 0,
    });

    expect(buildCoverageSearchFilters({ country: "de", offset: -10 })).toMatchObject({
      country: "DE",
      state: null,
      offset: 0,
    });
  });

  it("maps only source-backed operator rows and does not invent credentials", () => {
    const rows = mapCoverageRows([
      {
        id: "op_1",
        name: "Verified Source LLC",
        city: "Houston",
        admin1_code: "TX",
        country_code: "US",
        confidence_score: 84,
        is_claimed: true,
        role_primary: "pilot_car_operator",
      },
    ]);

    expect(rows).toEqual([
      {
        hc_operator_id: "op_1",
        display_name: "Verified Source LLC",
        trust_score: 84,
        distance_miles: null,
        urgent_eligible: false,
        verified_credentials: [],
        location: "Houston, TX",
        country_code: "US",
        role: "pilot_car_operator",
        is_claimed: true,
      },
    ]);
  });
});
