import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function runModuleExpression(relativeModulePath: string, expression: string) {
  const moduleUrl = pathToFileURL(join(root, relativeModulePath)).href;
  const code = [
    `const module = await import(${JSON.stringify(moduleUrl)});`,
    `const result = ${expression};`,
    "console.log(JSON.stringify(result));",
  ].join("\n");

  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: root,
      encoding: "utf8",
    }),
  );
}

describe("platform readiness addendum tooling", () => {
  it("tracks the live Supabase readiness addendum as explicit P0/P2 work", () => {
    const readiness = runModuleExpression(
      "scripts/audit-platform-readiness.mjs",
      `({
        keys: module.SUPABASE_READINESS_FINDINGS.map((finding) => finding.key),
        p0Count: module.SUPABASE_READINESS_FINDINGS.filter((finding) => finding.priority === "P0").length,
        duplicatePairs: module.DUPLICATE_TABLE_PAIRS,
        canonicalFindings: module.CANONICAL_SPLIT_FINDINGS,
      })`,
    );

    expect(readiness.keys).toEqual([
      "operator_geocode_gap",
      "operator_enrichment_gap",
      "glossary_schema_gap",
      "duplicate_table_pairs",
    ]);
    expect(readiness.p0Count).toBe(3);
    expect(readiness.duplicatePairs).toContainEqual(["hc_adgrid_impression", "hc_adgrid_impressions"]);
    expect(readiness.duplicatePairs).toContainEqual(["hc_claim_request", "hc_claim_requests"]);
    expect(readiness.canonicalFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "operator_universe_layering", canonicalRead: "read_av_operator_universe" }),
        expect.objectContaining({ key: "corridor_readiness_layering", canonicalRead: "v_av_corridor_readiness_unified" }),
        expect.objectContaining({ key: "seo_pages_split", canonicalRead: "hc_seo_pages" }),
        expect.objectContaining({ key: "adgrid_inventory_layering", canonicalRead: "pending_triage" }),
      ]),
    );
  });

  it("builds deterministic glossary DefinedTerm schema and why-it-matters fallback", () => {
    const output = runModuleExpression(
      "scripts/backfill-glossary-schema-json.mjs",
      `({
        schema: module.buildDefinedTermSchema({
          slug: "high-pole",
          canonical_term: "High Pole",
          short_definition: "A measuring pole used by an escort vehicle to check overhead clearance.",
          aliases: ["height pole"],
        }),
        why: module.buildWhyItMatters({ canonical_term: "High Pole" }),
      })`,
    );

    expect(output.schema["@graph"][0]).toMatchObject({
      "@type": "DefinedTerm",
      name: "High Pole",
      termCode: "high-pole",
      alternateName: ["height pole"],
    });
    expect(output.schema["@graph"][1]).toMatchObject({ "@type": "BreadcrumbList" });
    expect(output.why).toContain("permits");
  });

  it("builds Google geocode addresses from the operator queue shape without requiring US-only fields", () => {
    const output = runModuleExpression(
      "scripts/geocode-operator-queue.mjs",
      `({
        address: module.buildOperatorGeocodeAddress({
          address: "1 Port Road",
          city: "Hamburg",
          admin1_code: "HH",
          country_code: "DE",
        }),
        parsed: module.parseGoogleGeocodeResult({
          results: [{
            formatted_address: "1 Port Road, Hamburg, Germany",
            place_id: "abc",
            geometry: { location: { lat: 53.55, lng: 10 }, location_type: "ROOFTOP" },
          }],
        }),
      })`,
    );

    expect(output.address).toBe("1 Port Road, Hamburg, HH, DE");
    expect(output.parsed).toMatchObject({ lat: 53.55, lng: 10, confidence: "rooftop" });
  });

  it("ships package scripts for readiness audit, glossary backfill, and operator geocoding", () => {
    const pkg = read("package.json");

    expect(pkg).toContain('"audit:platform-readiness"');
    expect(pkg).toContain('"backfill:glossary-schema"');
    expect(pkg).toContain('"geocode:operator-queue"');
  });

  it("can scan duplicate table pair usage without live database access", () => {
    const output = runModuleExpression(
      "scripts/audit-platform-readiness.mjs",
      `({
        report: module.buildDuplicateTableUsageReport(${JSON.stringify(root)}, { scanDirs: ["supabase/migrations"] }),
        pairCount: module.DUPLICATE_TABLE_PAIRS.length,
      })`,
    );

    expect(output.report).toHaveLength(output.pairCount);
    expect(output.report.find((pair) => pair.plural === "hc_adgrid_impressions")?.totals.plural).toBeGreaterThan(0);
  }, 20000);

  it("reports canonical read-path splits for SEO, operators, corridors, and AdGrid", () => {
    const report = runModuleExpression(
      "scripts/audit-platform-readiness.mjs",
      `module.buildCanonicalReadPathReport(${JSON.stringify(root)}, { scanDirs: ["app/api", "lib", "scripts"] })`,
    );

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
  }, 20000);
});
