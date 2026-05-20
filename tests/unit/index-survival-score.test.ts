import { describe, expect, it } from "vitest";
import {
  contractToIndexSurvivalInput,
  scoreIndexSurvival,
  type IndexSurvivalInput,
} from "@/lib/seo/index-survival-score";
import { definePageSeoContract } from "@/lib/seo/page-seo-contract";

const baseInput: IndexSurvivalInput = {
  path: "/us/texas/houston/pilot-car-operators",
  pageClass: "role_place",
  pageFamily: "directory_city",
  countryCode: "us",
  role: "pilot car operator",
  city: "Houston",
  region: "Texas",
  hasSearchIntent: true,
  hasClearNextAction: true,
  hasCanonical: true,
  hasShortAnswer: true,
  hasNoDeadEndFallback: true,
  usesLocalTerminology: true,
  avoidsUsOnlyAssumption: true,
  uniqueResearchSignals: 6,
  originalDataModules: ["provider_density", "coverage_gap", "permit_complexity"],
  roleSpecificitySignals: ["pilot car", "high pole adjacency", "escort vehicle"],
  localSpecificitySignals: ["Houston", "Texas", "I-10"],
  internalLinkFamilies: ["role_hub", "directory", "corridor", "regulations", "tools"],
  authoritySourceCount: 3,
  mobileUxModules: ["short_answer", "provider_cards", "map", "cta", "faq"],
  schemaTypes: ["BreadcrumbList", "Service", "FAQPage"],
  trustProofModules: ["claim_state", "contact_confidence", "source_freshness"],
  redundancyRiskScore: 18,
};

describe("index survival score", () => {
  it("allows a useful role-place page to index when it has unique local proof", () => {
    const result = scoreIndexSurvival(baseInput);

    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(result.publishable).toBe(true);
    expect(result.decision).toBe("index");
    expect(result.blockers).toEqual([]);
  });

  it("blocks generic programmatic pages that only swap role and city text", () => {
    const result = scoreIndexSurvival({
      ...baseInput,
      uniqueResearchSignals: 1,
      originalDataModules: [],
      internalLinkFamilies: ["directory"],
      authoritySourceCount: 0,
      trustProofModules: [],
      redundancyRiskScore: 82,
    });

    expect(result.decision).toBe("noindex");
    expect(result.blockers).toEqual(expect.arrayContaining(["high_redundancy_risk", "missing_unique_haul_command_angle"]));
    expect(result.repairActions.join(" ")).toContain("original Haul Command data module");
  });

  it("blocks non-US pages that inherit US-only assumptions", () => {
    const result = scoreIndexSurvival({
      ...baseInput,
      path: "/de/bavaria/munich/begleitfahrzeug",
      countryCode: "de",
      city: "Munich",
      region: "Bavaria",
      usesLocalTerminology: true,
      avoidsUsOnlyAssumption: false,
    });

    expect(result.decision).toBe("noindex");
    expect(result.blockers).toContain("us_only_assumption_on_global_page");
  });

  it("maps PageSeoContract evidence into the survival scorer", () => {
    const contract = definePageSeoContract({
      path: "/directory/us/texas/houston/pilot-car-operators",
      pageType: "directory_city",
      title: "Pilot Car Operators in Houston, Texas",
      metaDescription: "Find pilot car operators, escort support, and route help in Houston.",
      h1: "Pilot Car Operators in Houston, Texas",
      visibleIntro: "Use this page to find support and understand adjacent heavy-haul roles.",
      quickAnswer: "Houston oversize loads often need pilot car, high-pole, route survey, and permit support before dispatch.",
      h2Outline: ["Find providers", "Check local requirements", "Related roles", "Coverage gaps"],
      faqQuestions: ["Do I need a pilot car in Houston?", "Do I need a high-pole escort?"],
      schemaTypes: ["BreadcrumbList", "Service", "FAQPage"],
      primaryKeyword: "pilot car operators Houston",
      secondaryKeywords: ["escort vehicle Houston", "oversize load support Houston"],
      entityTerms: ["pilot car", "high pole escort", "route survey"],
      country: "us",
      region: "Texas",
      city: "Houston",
      role: "pilot car operator",
      internalLinkSlots: [
        { label: "Texas directory", href: "/directory/us", reason: "country hub", pageFamily: "directory_country" },
        { label: "Escort requirements", href: "/escort-requirements", reason: "requirement context", pageFamily: "regulation" },
        { label: "High pole", href: "/roles/high-pole-escort", reason: "adjacent role", pageFamily: "role" },
      ],
      conversionCtas: [
        { label: "Find providers", href: "/directory?q=pilot+car+Houston", intent: "find_provider", primary: true },
        { label: "Post a load", href: "/load-board/post", intent: "post_load" },
      ],
      sourceBasis: "Haul Command directory and source-backed market research.",
      updateFrequency: "weekly",
      qualityStatus: "indexable",
    });

    const result = scoreIndexSurvival(
      contractToIndexSurvivalInput(contract, {
        originalDataModules: ["provider_density", "coverage_gap", "demand_signal"],
        authoritySourceCount: 3,
        internalLinkFamilies: ["directory", "regulation", "role", "tools", "corridor"],
        trustProofModules: ["source_basis", "claim_state", "source_freshness"],
        avoidsUsOnlyAssumption: true,
        redundancyRiskScore: 22,
      }),
    );

    expect(result.decision).toBe("index");
    expect(result.totalScore).toBeGreaterThanOrEqual(80);
  });
});
