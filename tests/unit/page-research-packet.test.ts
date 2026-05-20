import { describe, expect, it } from "vitest";
import { scorePageResearchPacket } from "@/lib/seo/page-research-packet";

describe("scorePageResearchPacket", () => {
  it("allows indexable publication only when research, uniqueness, links, and proof are strong", () => {
    const score = scorePageResearchPacket({
      target_url: "/us/texas/houston/pilot-car-operators",
      page_family: "role_place_finder",
      role_id: "pilot_car_operator",
      country: "US",
      region: "TX",
      city: "Houston",
      search_intent: "find_provider",
      buyer_intent: "find pilot car support",
      provider_intent: "claim listing",
      advertiser_intent: "sponsor Houston pilot car demand",
      top_serp_urls: Array.from({ length: 10 }, (_, i) => `https://example.com/serp-${i}`),
      bing_result_urls: Array.from({ length: 5 }, (_, i) => `https://example.com/bing-${i}`),
      paa_questions: ["Do I need a pilot car in Texas?", "How much does a pilot car cost?", "What is a high pole?"],
      competitor_urls: ["https://competitor.example/a", "https://competitor.example/b", "https://competitor.example/c"],
      authority_sources: ["https://txdmv.gov"],
      forum_pain_points: ["Brokers cannot find late coverage", "High pole confusion"],
      review_pain_points: ["Wrong phone numbers", "No service area listed"],
      competitor_gaps: ["No proof states", "No adjacent role explanation"],
      internal_link_targets: ["/directory", "/regulations/us/tx", "/tools/escort-calculator"],
      unique_data_modules: ["provider_density", "support_gap_score", "demand_signal"],
      recommended_schema: ["Service", "FAQPage", "BreadcrumbList"],
      recommended_media: ["route map", "role explainer"],
      unique_haul_command_angle: "Houston pilot car coverage with support gaps, adjacent roles, and proof-labeled provider density.",
      provider_record_count: 8,
      redundancy_score: 0.2,
      source_confidence: "high",
    });

    expect(score.decision).toBe("indexable");
    expect(score.score).toBeGreaterThanOrEqual(80);
    expect(score.blockers).toEqual([]);
  });

  it("forces noindex when a page lacks a unique Haul Command angle", () => {
    const score = scorePageResearchPacket({
      target_url: "/us/texas/pilot-car-operators",
      role_id: "pilot_car_operator",
      country: "US",
      region: "TX",
      top_serp_urls: ["https://example.com/a"],
      unique_data_modules: ["provider_density"],
      internal_link_targets: ["/directory"],
      redundancy_score: 0.1,
    });

    expect(score.decision).toBe("noindex");
    expect(score.blockers).toContain("Missing unique Haul Command angle.");
    expect(score.repair_actions).toContain("Attach provider density, support gap, demand, rate, permit, or freshness data.");
  });

  it("blocks redundant page copies even when other fields are present", () => {
    const score = scorePageResearchPacket({
      target_url: "/us/florida/pilot-car-operators",
      role_id: "pilot_car_operator",
      country: "US",
      region: "FL",
      unique_haul_command_angle: "Florida support page with local proof modules.",
      unique_data_modules: ["provider_density", "support_gap_score", "freshness"],
      internal_link_targets: ["/directory", "/regulations/us/fl", "/tools"],
      authority_sources: ["https://fdot.gov"],
      redundancy_score: 0.82,
      provider_record_count: 5,
    });

    expect(score.decision).toBe("noindex");
    expect(score.blockers).toContain("Redundancy score is too high for indexable publication.");
  });
});
