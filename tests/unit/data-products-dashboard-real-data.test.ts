import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("data products admin dashboard real-data contract", () => {
  it("uses data_purchases and catalog pricing instead of random dashboard metrics", () => {
    const page = read("app/admin/dashboards/data-products/page.tsx");
    const readModel = read("lib/admin/data-products/read-model.ts");

    expect(page).toContain("getDataProductsDashboardReadModel");
    expect(page).toContain("Real purchase telemetry");
    expect(page).toContain("catalog-derived");
    expect(page).not.toContain("Math.random");
    expect(page).not.toContain("generateMock");
    expect(page).not.toContain("Recharts");

    expect(readModel).toContain('.from("data_purchases")');
    expect(readModel).toContain("DATA_PRODUCT_CATALOG");
    expect(readModel).toContain("catalog_price_for_active_purchases");
    expect(readModel).toContain('status === "active"');
    expect(readModel).not.toContain("Math.random");
    expect(readModel).not.toContain("generateMock");
  });
});
