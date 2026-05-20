import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("discovery work queue guardrails", () => {
  it("keeps the queue runner out of banned providers and public directory promotion", () => {
    const source = read("scripts/discovery/run-work-queue.mjs");

    expect(source).not.toMatch(/google-places|GOOGLE_PLACES_API_KEY|Make\.com|MAKE_/);
    expect(source).not.toContain("directory_entities");
    expect(source).toContain("hc_entities_raw");
    expect(source).toContain("STAGED_ONLY_MESSAGE");
  });

  it("supports the safe worker set and explicitly skips unfinished consumers", () => {
    const source = read("scripts/discovery/run-work-queue.mjs");

    expect(source).toContain('"tavily_search"');
    expect(source).toContain('"reverse_company_search"');
    expect(source).toContain('"firecrawl_scrape"');
    expect(source).toContain('"clay_enrichment"');
    expect(source).toContain('"authority_registry_scan"');
    expect(source).toContain('"association_member_scan"');
    expect(source).toContain("runAuthorityJob");
    expect(source).toContain("AUTHORITY_IMPORT_SECRET");
    expect(source).toContain("payload?.legal_review_status");
    expect(source).toContain("payload.parser_function");
    expect(source).toContain("payload.authority_source_import_id");
    expect(source).toContain("No non-Google, non-Make consumer is implemented");
    expect(source).toContain('status: "skipped"');
  });
});
