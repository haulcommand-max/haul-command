import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDefinedTermSchema,
  buildWhyItMatters,
} from "../../scripts/backfill-glossary-schema-json.mjs";
import {
  buildOperatorGeocodeAddress,
  parseGoogleGeocodeResult,
} from "../../scripts/geocode-operator-queue.mjs";
import {
  buildDuplicateTableUsageReport,
  buildCanonicalReadPathReport,
  CANONICAL_SPLIT_FINDINGS,
  DUPLICATE_TABLE_PAIRS,
  SUPABASE_READINESS_FINDINGS,
} from "../../scripts/audit-platform-readiness.mjs";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("platform readiness addendum tooling", () => {
  it("tracks the live Supabase readiness addendum as explicit P0/P2 work", () => {
    expect(SUPABASE_READINESS_FINDINGS.map((finding) => finding.key)).toEqual([
      "operator_geocode_gap",
      "operator_enrichment_gap",
      "glossary_schema_gap",
      "duplicate_table_pairs",
    ]);
    expect(SUPABASE_READINESS_FINDINGS.filter((finding) => finding.priority === "P0")).toHaveLength(3);
    expect(DUPLICATE_TABLE_PAIRS).toContainEqual(["hc_adgrid_impression", "hc_adgrid_impressions"]);
    expect(DUPLICATE_TABLE_PAIRS).toContainEqual(["hc_claim_request", "hc_claim_requests"]);
    expect(CANONICAL_SPLIT_FINDINGS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "operator_universe_layering", canonicalRead: "read_av_operator_universe" }),
        expect.objectContaining({ key: "corridor_readiness_layering", canonicalRead: "v_av_corridor_readiness_unified" }),
        expect.objectContaining({ key: "seo_pages_split", canonicalRead: "hc_seo_pages" }),
        expect.objectContaining({ key: "adgrid_inventory_layering", canonicalRead: "pending_triage" }),
      ]),
    );
  });

  it("builds deterministic glossary DefinedTerm schema and why-it-matters fallback", () => {
    const schema = buildDefinedTermSchema({
      slug: "high-pole",
      canonical_term: "High Pole",
      short_definition: "A measuring pole used by an escort vehicle to check overhead clearance.",
      aliases: ["height pole"],
    });

    expect(schema["@graph"][0]).toMatchObject({
      "@type": "DefinedTerm",
      name: "High Pole",
      termCode: "high-pole",
      alternateName: ["height pole"],
    });
    expect(schema["@graph"][1]).toMatchObject({ "@type": "BreadcrumbList" });
    expect(buildWhyItMatters({ canonical_term: "High Pole" })).toContain("permits");
  });

  it("builds Google geocode addresses from the operator queue shape without requiring US-only fields", () => {
    expect(
      buildOperatorGeocodeAddress({
        address: "1 Port Road",
        city: "Hamburg",
        admin1_code: "HH",
        country_code: "DE",
      }),
    ).toBe("1 Port Road, Hamburg, HH, DE");

    expect(
      parseGoogleGeocodeResult({
        results: [
          {
            formatted_address: "1 Port Road, Hamburg, Germany",
            place_id: "abc",
            geometry: { location: { lat: 53.55, lng: 10 }, location_type: "ROOFTOP" },
          },
        ],
      }),
    ).toMatchObject({ lat: 53.55, lng: 10, confidence: "rooftop" });
  });

  it("ships package scripts for readiness audit, glossary backfill, and operator geocoding", () => {
    const pkg = read("package.json");

    expect(pkg).toContain('"audit:platform-readiness"');
    expect(pkg).toContain('"backfill:glossary-schema"');
    expect(pkg).toContain('"geocode:operator-queue"');
  });

  it("can scan duplicate table pair usage without live database access", () => {
    const report = buildDuplicateTableUsageReport(root, { scanDirs: ["supabase/migrations"] });

    expect(report).toHaveLength(DUPLICATE_TABLE_PAIRS.length);
    expect(report.find((pair) => pair.plural === "hc_adgrid_impressions")?.totals.plural).toBeGreaterThan(0);
  });

  it("reports canonical read-path splits for SEO, operators, corridors, and AdGrid", () => {
    const report = buildCanonicalReadPathReport(root, { scanDirs: ["app/api", "lib", "scripts"] });

    expect(report).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "operator_layers", preferredRead: "read_av_operator_universe" }),
        expect.objectContaining({ key: "corridor_layers", preferredRead: "v_av_corridor_readiness_unified" }),
        expect.objectContaining({ key: "seo_layers", preferredRead: "hc_seo_pages" }),
        expect.objectContaining({ key: "adgrid_inventory_layers", preferredRead: "pending_triage" }),
      ]),
    );
    const adgrid = report.find((item) => item.key === "adgrid_inventory_layers");

    expect(report.find((item) => item.key === "seo_layers")?.directRefs.seo_pages.total).toBeGreaterThan(0);
    expect(report.find((item) => item.key === "operator_layers")?.directRefs.hc_global_operators.total).toBeGreaterThan(0);
    expect(adgrid?.preferredRead).toBe("pending_triage");
    expect(adgrid?.action).toContain("live pg_stat write heat");
  });
});
