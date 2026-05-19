import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDirectoryCountryPageContract,
  buildDirectoryCountrySeoContract,
  buildDirectoryCountryStaticParams,
  buildDirectoryIntentLanes,
  buildDirectoryMarketSeoContract,
  getDirectoryEntityLabel,
  getDirectoryProofState,
} from "@/lib/directory/presentation";
import { COUNTRY_REGISTRY } from "@/lib/config/country-registry";
import {
  contractToCollectionJsonLd,
  contractToMetadata,
  type PageSeoContract,
} from "@/lib/seo/page-seo-contract";

const DIRECTORY_COUNTRY_CONTRACT: PageSeoContract = {
  path: "/directory/de",
  pageType: "directory_country",
  title: "DE Pilot Car Directory",
  metaDescription: "Source review directory page for Germany heavy haul support.",
  h1: "Germany Heavy Haul Network",
  visibleIntro: "Directory page under source review.",
  quickAnswer: "Use this page once source-backed supply is attached.",
  h2Outline: ["Support records", "Regulation paths"],
  schemaTypes: ["CollectionPage", "ItemList"],
  primaryKeyword: "Germany pilot car directory",
  secondaryKeywords: ["Germany heavy haul support"],
  entityTerms: ["pilot cars", "escort network"],
  country: "DE",
  internalLinkSlots: [],
  conversionCtas: [],
  sourceBasis: "Repo placeholder country route; source review pending.",
  updateFrequency: "weekly",
  qualityStatus: "source_review_needed",
};

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("directory presentation helpers", () => {
  it("labels non-operator support records without calling them providers", () => {
    expect(getDirectoryEntityLabel({ entity_family: "infrastructure", entity_subtype: "truck_parking" })).toBe(
      "Infrastructure",
    );
    expect(getDirectoryEntityLabel({ entity_family: "authority", entity_subtype: "pilot_car_permits" })).toBe(
      "Permit / Compliance",
    );
    expect(getDirectoryEntityLabel({ entity_family: "operator", entity_subtype: "pilot_car_operator" })).toBe(
      "Operator",
    );
  });

  it("builds a proof ladder from real claim, verification, and contact fields", () => {
    expect(
      getDirectoryProofState({
        verification_status: "performance_verified",
        claim_status: "claimed",
        phone: "555-1212",
      }),
    ).toMatchObject({ label: "Performance Verified", strength: 5 });

    expect(
      getDirectoryProofState({
        verification_status: "contact_confirmed",
        claim_status: "unclaimed",
        phone_number: "555-1212",
      }),
    ).toMatchObject({ label: "Contact Confirmed", strength: 2 });

    expect(getDirectoryProofState({ claim_status: "unclaimed" })).toMatchObject({
      label: "Claimable",
      strength: 1,
    });
  });

  it("keeps intent lane links country-aware", () => {
    const lanes = buildDirectoryIntentLanes("CA");

    expect(lanes.map((lane) => lane.label)).toEqual([
      "Need load support",
      "Claim profile",
      "Research market",
      "Provide support",
    ]);
    expect(lanes[0].href).toContain("country=CA");
    expect(lanes[2].href).toContain("country=CA");
  });

  it("marks country directory placeholders noindex until source-backed regions exist", () => {
    expect(buildDirectoryCountryPageContract("us")).toMatchObject({
      countryCode: "us",
      displayName: "United States",
      noIndex: false,
      subRegions: ["Texas", "Florida", "California", "Oklahoma", "Louisiana"],
    });

    expect(buildDirectoryCountryPageContract("de")).toMatchObject({
      countryCode: "de",
      displayName: "Germany",
      noIndex: true,
    });
    expect(buildDirectoryCountryPageContract("de").subRegions).toContain("Hamburg");
  });

  it("creates operational directory route params for every country in the 120-country registry", () => {
    const params = buildDirectoryCountryStaticParams();
    const uniqueCountries = new Set(params.map((param) => param.country));

    expect(params).toHaveLength(COUNTRY_REGISTRY.length);
    expect(uniqueCountries.size).toBe(COUNTRY_REGISTRY.length);
    expect(params).toEqual(
      expect.arrayContaining([
        { country: "us" },
        { country: "de" },
        { country: "za" },
        { country: "mw" },
      ]),
    );
  });

  it("keeps source-review directory contracts noindex while preserving follow", () => {
    const metadata = contractToMetadata(DIRECTORY_COUNTRY_CONTRACT);

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: true,
      googleBot: expect.objectContaining({
        index: false,
        follow: true,
      }),
    });
  });

  it("builds shared country SEO contracts with source-review noindex semantics", () => {
    const us = buildDirectoryCountrySeoContract("us");
    const de = buildDirectoryCountrySeoContract("de");

    expect(us).toMatchObject({
      pageType: "directory_country",
      robots: "index",
      qualityStatus: "indexable",
    });
    expect(us.conversionCtas.map((cta) => cta.intent)).toEqual(
      expect.arrayContaining(["find_provider", "claim_profile", "post_load"]),
    );

    expect(de).toMatchObject({
      path: "/directory/de",
      robots: "noindex",
      qualityStatus: "source_review_needed",
    });
    expect(contractToMetadata(de).robots).toMatchObject({ index: false, follow: true });
  });

  it("keeps empty local directory markets noindex until records exist", () => {
    const empty = buildDirectoryMarketSeoContract({
      countryCode: "DE",
      marketName: "Hamburg",
      slug: "hamburg",
      recordCount: 0,
      noIndexWhenEmpty: true,
      marketKind: "city",
    });
    const populated = buildDirectoryMarketSeoContract({
      countryCode: "US",
      marketName: "Houston",
      slug: "houston",
      recordCount: 12,
      noIndexWhenEmpty: true,
      marketKind: "city",
    });

    expect(empty.robots).toBe("noindex");
    expect(empty.qualityStatus).toBe("source_review_needed");
    expect(populated.robots).toBe("index");
    expect(populated.sourceBasis).toContain("12 source-backed records");
  });

  it("deduplicates directory collection schema items by canonical URL", () => {
    const schema = contractToCollectionJsonLd(DIRECTORY_COUNTRY_CONTRACT, [
      { name: "Alpha Escort", url: "/directory/de/alpha-escort" },
      { name: "Alpha Escort Duplicate", url: "https://www.haulcommand.com/directory/de/alpha-escort" },
      { name: "Beta Escort", url: "/directory/de/beta-escort" },
    ]);

    expect(schema.mainEntity.itemListElement).toHaveLength(2);
    expect(schema.mainEntity.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(schema.mainEntity.itemListElement.map((item) => item.name)).toEqual(["Alpha Escort", "Beta Escort"]);
  });

  it("keeps the directory root written for buyers and providers instead of internal architecture", () => {
    const page = read("app/directory/page.tsx");
    const emptyState = read("components/directory/EmptyMarketState.tsx");

    expect(page).toContain("Search heavy-haul support without guessing who is real, local, or claimable");
    expect(page).toContain("Trust rule:");
    expect(page).toContain("Request help, claim or correct a listing");
    expect(page).not.toContain("How this page is built:");
    expect(page).not.toContain("role definitions, not hand-built static pages");
    expect(page).not.toContain("reusable role families");
    expect(page).not.toContain("operating system for finding");
    expect(emptyState).toContain("Thin markets are labeled honestly");
    expect(emptyState).toContain("Directory records are temporarily unavailable");
    expect(emptyState).toContain("This is not a market-coverage signal");
  });

  it("keeps directory cards honest about contact paths and public ratings", () => {
    const grid = read("components/directory/DirectoryGrid.tsx");

    expect(grid).toContain("Contact path available");
    expect(grid).toContain("Request or claim contact");
    expect(grid).toContain("Source confidence:");
    expect(grid).toContain("Number(p.review_count ?? p.reviews_count ?? 0) > 0");
    expect(grid).toContain("Request Support");
  });

  it("keeps the directory ask strip on the dark command surface", () => {
    const askStrip = read("components/hc-ask/HCAskStrip.tsx");
    const styles = read("app/globals.css");

    expect(askStrip).toContain("hc-ask-strip--${context}");
    expect(styles).toContain(".hc-ask-strip--directory");
    expect(styles).toContain("rgba(198, 146, 58, 0.25)");
    expect(styles).toContain(".hc-ask-strip--directory .hc-ask-chip");
  });
});
