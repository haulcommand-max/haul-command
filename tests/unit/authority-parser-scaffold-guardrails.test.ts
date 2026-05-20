import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("authority import parser scaffold guardrails", () => {
  it("creates a legal-review-gated authority import dispatcher without duplicating canonical directory tables", () => {
    const migration = read("supabase/migrations/20260520170000_authority_import_parser_scaffold.sql");

    expect(migration).toContain("hc_authority_source_imports");
    expect(migration).toContain("fn_dispatch_authority_imports");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("legal_review_status <> 'approved'");
    expect(migration).toContain("staging_policy', 'raw_only_no_public_promotion'");
    expect(migration).toContain("source_key || '_' || lower(country_code)");
    expect(migration).toContain("template_source_key");
    expect(migration).toContain("with (security_invoker = true)");
    expect(migration).not.toContain("insert into public.directory_entities");
    expect(migration).not.toContain("update public.directory_entities");
  });

  it("registers parser functions for every approved authority source format", () => {
    const migration = read("supabase/migrations/20260520170000_authority_import_parser_scaffold.sql");
    const parserFunctions = [
      "authority-csv-parser",
      "authority-api-parser",
      "authority-html-scrape-parser",
      "authority-xml-parser",
      "authority-xlsx-parser",
      "authority-pdf-scrape-parser",
    ];

    for (const parserFunction of parserFunctions) {
      expect(migration).toContain(parserFunction);
      expect(existsSync(join(process.cwd(), "supabase/functions", parserFunction, "index.ts"))).toBe(true);
    }
  });

  it("connects authority work queue jobs to parser edge functions by explicit payload", () => {
    const runner = read("scripts/discovery/run-work-queue.mjs");

    expect(runner).toContain('"authority_registry_scan"');
    expect(runner).toContain('"association_member_scan"');
    expect(runner).toContain("AUTHORITY_IMPORT_SECRET");
    expect(runner).toContain("payload?.parser_function");
    expect(runner).toContain("payload?.authority_source_import_id");
    expect(runner).toContain("Authority or association import is not legally approved");
    expect(runner).toContain("functions/v1/${parserFunction}");
  });
});
