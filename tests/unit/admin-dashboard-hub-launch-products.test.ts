import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("admin dashboard hub launch product links", () => {
  it("exposes the directory, matching, RouteIntel, AdGrid, claims, and data-product control surfaces", () => {
    const hub = read("app/admin/dashboards/page.tsx");

    for (const route of [
      "/admin/directory/health",
      "/admin/dashboards/matching-load-board",
      "/admin/dashboards/routeintel",
      "/admin/dashboards/fill-yield",
      "/admin/dashboards/claims-ops",
      "/admin/dashboards/data-products",
    ]) {
      expect(hub).toContain(route);
    }

    for (const label of [
      "Directory Truth",
      "Matching Load Board",
      "RouteIntel and GPS",
      "AdGrid Fill & Yield",
      "Claims Ops",
      "Data Products",
    ]) {
      expect(hub).toContain(label);
    }
  });
});
