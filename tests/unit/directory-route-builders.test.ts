import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDirectoryCategoryHref,
  buildDirectoryCountryHref,
  buildDirectoryDossierHref,
  buildDirectoryMarketHref,
} from "@/lib/directory/routes";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function expectNoThreeSegmentDirectoryHref(hrefs: string[]) {
  for (const href of hrefs) {
    const pathname = href.split(/[?#]/)[0];
    expect(pathname).not.toMatch(/^\/directory\/[^/]+\/[^/]+\/[^/]+$/);
  }
}

describe("directory route builders", () => {
  it("centralizes links onto existing App Router directory shapes", () => {
    const hrefs = [
      buildDirectoryCountryHref("US"),
      buildDirectoryMarketHref({ country: "US", slug: "houston-tx" }),
      buildDirectoryCategoryHref("pilot-car-operators", { country: "US", region: "TX" }),
      buildDirectoryDossierHref("alpha operator"),
    ];

    expect(hrefs).toEqual([
      "/directory/us",
      "/directory/us/houston-tx",
      "/directory/category/pilot-car-operators?country=US&region=TX",
      "/directory/dossier/alpha%20operator",
    ]);
    expectNoThreeSegmentDirectoryHref(hrefs);
  });

  it("keeps legacy internal link builder output on directory route shapes", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    const { buildInternalLinks } = await import("@/lib/seo/internalLinks");

    const links = buildInternalLinks({
      country: "US",
      state: "FL",
      city: "Jacksonville",
      slug: "jacksonville-fl",
      nearbyCities: ["miami-fl", "tampa-fl"],
      corridors: ["I-75"],
    });

    const hrefs = [
      links.parentState.href,
      ...links.nearbyCities.map((link) => link.href),
      ...links.corridors.map((link) => link.href),
      links.ctaLink.href,
    ];

    expect(links.parentState.href).toBe("/directory/us/fl");
    expect(links.nearbyCities.map((link) => link.href)).toEqual(["/directory/us/miami-fl", "/directory/us/tampa-fl"]);
    expectNoThreeSegmentDirectoryHref(hrefs);
  });

  it("prevents scoped internal link components from hardcoding removed city/category route families", () => {
    const files = [
      read("lib/seo/internal-links.tsx"),
      read("components/directory/CategoryGrid.tsx"),
    ];

    for (const source of files) {
      expect(source).not.toMatch(/href=\{`\/directory\/\$\{[^}]+}\//);
      expect(source).toContain("@/lib/directory/routes");
    }
  });
});
