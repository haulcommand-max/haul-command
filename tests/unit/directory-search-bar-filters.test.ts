import { describe, expect, it } from "vitest";
import { applyDirectoryFilters } from "@/components/ui/DirectorySearchBar";

const records = [
  {
    company_name: "Alpha Pilot Cars",
    country_code: "US",
    state_inferred: "TX",
    city_inferred: "Houston",
    entity_family: "operator",
    entity_subtype: "pilot_car_operator",
    services: ["high pole", "route survey"],
    verification_status: "verified",
    claim_status: "claimed",
    rank_score: 91,
    updated_at: "2026-05-10T12:00:00Z",
  },
  {
    company_name: "Beta Truck Parking",
    country_code: "CA",
    state_inferred: "ON",
    city_inferred: "Toronto",
    entity_family: "infrastructure",
    entity_subtype: "truck_parking",
    services: ["staging yard"],
    verification_status: "indexed",
    claim_status: "unclaimed",
    rank_score: 55,
    updated_at: "2026-05-14T12:00:00Z",
  },
  {
    company_name: "Gamma Permit Desk",
    country_code: "US",
    state_inferred: "LA",
    city_inferred: "Baton Rouge",
    entity_family: "service",
    entity_subtype: "permit_support",
    service_type: "permits",
    verification_status: "contact_confirmed",
    claim_status: "claimed",
    rank_score: 73,
    updated_at: "2026-05-12T12:00:00Z",
  },
];

describe("DirectorySearchBar deterministic filters", () => {
  it("filters by country, category/service, verified, claimed, and score sort", () => {
    const result = applyDirectoryFilters(records, {
      query: "route",
      country: "us",
      category: "pilot",
      state: "TX",
      proof: "verified",
      claim: "claimed",
      sort: "score",
    });

    expect(result.map((record) => record.company_name)).toEqual(["Alpha Pilot Cars"]);
  });

  it("sorts newest records without losing broad support categories", () => {
    const result = applyDirectoryFilters(records, {
      query: "",
      country: "",
      category: "support",
      state: "",
      proof: "all",
      claim: "all",
      sort: "newest",
    });

    expect(result.map((record) => record.company_name)).toEqual([
      "Beta Truck Parking",
      "Gamma Permit Desk",
      "Alpha Pilot Cars",
    ]);
  });

  it("keeps publishable fallback rows when category signals are stored in metadata", () => {
    const result = applyDirectoryFilters(
      [
        {
          company: "Fallback Pilot Car Record",
          country_code_inferred: "US",
          state_code: "FL",
          metadata: {
            entity_family: "operator",
            entity_subtype: "pilot_car_operator",
            service_categories: ["pilot car", "high pole"],
          },
          claim_status: "claimable",
          rank_score: 12,
        },
      ],
      {
        query: "",
        country: "US",
        category: "pilot-car",
        state: "FL",
        proof: "all",
        claim: "all",
        sort: "score",
      },
    );

    expect(result.map((record) => record.company)).toEqual(["Fallback Pilot Car Record"]);
  });
});
