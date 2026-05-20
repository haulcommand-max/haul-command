import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function authorityParserSources() {
  const functionsRoot = join(process.cwd(), "supabase/functions");
  const parserFiles = readdirSync(functionsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("authority-") && entry.name.endsWith("-parser"))
    .map((entry) => join("supabase/functions", entry.name, "index.ts"));

  return [
    "supabase/functions/_shared/authority-parser.ts",
    ...parserFiles,
  ].map((path) => ({ path, source: read(path) }));
}

describe("authority parser promotion safety", () => {
  it("keeps parser output staged and out of public directory/trust surfaces", () => {
    for (const { path, source } of authorityParserSources()) {
      expect(source, path).not.toContain("directory_entities");
      expect(source, path).not.toContain("is_verified");
      expect(source, path).not.toContain("AggregateRating");
      expect(source, path).not.toMatch(/scarcity|limited spots|only \d+/i);
      expect(source, path).not.toMatch(/google-places|GOOGLE_PLACES_API_KEY|Make\.com|MAKE_/);
    }

    const shared = read("supabase/functions/_shared/authority-parser.ts");
    expect(shared).toContain("hc_entities_raw");
    expect(shared).toContain("raw_only_no_public_promotion");
    expect(shared).toContain("legal_review_status");
    expect(shared).toContain("AUTHORITY_IMPORT_SECRET");
  });

  it("quarantines high-risk document formats until approved extraction is wired", () => {
    const pdfParser = read("supabase/functions/authority-pdf-scrape-parser/index.ts");
    const xlsxParser = read("supabase/functions/authority-xlsx-parser/index.ts");
    const zipParser = read("supabase/functions/authority-zip-parser/index.ts");

    expect(xlsxParser).toContain('status: "quarantined"');
    expect(xlsxParser).toContain("audited spreadsheet parser");
    expect(pdfParser).toContain('status: "quarantined"');
    expect(pdfParser).toContain("approved Fly/Hugging Face utility layer");
    expect(zipParser).toContain('status: "quarantined"');
    expect(zipParser).toContain("audited archive extractor");
  });
});
