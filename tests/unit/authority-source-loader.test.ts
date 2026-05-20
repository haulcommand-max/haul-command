import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("authority source loader guardrails", () => {
  it("loads source lists into the authority registry without touching public directory tables", () => {
    const source = read("scripts/discovery/load-authority-sources.mjs");

    expect(source).toContain("hc_authority_source_imports");
    expect(source).toContain("legal_review_status");
    expect(source).toContain("authority-zip-parser");
    expect(source).toContain("raw.source_format");
    expect(source).toContain("BANNED_PROVIDER_PATTERN");
    expect(source).not.toContain("directory_entities");
    expect(source).not.toMatch(/GOOGLE_PLACES_API_KEY|MAKE_/);
  });

  it("keeps association sources out of approved state unless explicitly allowed", () => {
    const source = read("scripts/discovery/load-authority-sources.mjs");

    expect(source).toContain("allowApprovedAssociations");
    expect(source).toContain("cannot be pre-approved");
    expect(source).toContain("--allow-approved-associations");
  });
});
