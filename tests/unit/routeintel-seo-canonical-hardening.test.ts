import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("RouteIntel and canonical SEO hardening", () => {
  it("does not link enterprise AV buyers to a dead autonomous corridor route", () => {
    const page = read("app/enterprise/autonomous/page.tsx");

    expect(page).toContain('href="/corridors"');
    expect(page).not.toContain("/autonomous-freight/corridors");
  });

  it("labels custom map routes as unverified preview geometry, never clearance guaranteed", () => {
    const route = read("app/api/map/custom-route/route.ts");

    expect(route).toContain("preview_geometry_only");
    expect(route).toContain("unverified_preview");
    expect(route).toContain("requires_routeintel_verification");
    expect(route).toContain("clearance_guaranteed: false");
    expect(route).not.toContain("clearance_guaranteed: height >");
  });

  it("requires authenticated operator ownership before route intel writes award trust", () => {
    const route = read("app/api/routes/intel/report/route.ts");

    expect(route).toContain("assertOperatorReportAccess");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("operator.user_id !== user.id");
    expect(route).toContain("Forbidden: operator_id is not owned by the authenticated user");
  });

  it("prefers hc_seo_pages for public SEO page inventory with legacy fallback labeled", () => {
    const route = read("app/api/seo/pages/route.ts");

    expect(route).toContain("from('hc_seo_pages'");
    expect(route).toContain("source_table: 'hc_seo_pages'");
    expect(route).toContain("from('seo_pages'");
    expect(route).toContain("source_table: 'seo_pages'");
  });
});
