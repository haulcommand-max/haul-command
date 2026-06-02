import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Revenue Command dashboard contract", () => {
  it("uses a server-side canonical money read model instead of browser admin fetch placeholders", () => {
    const page = read("app/admin/dashboards/revenue/page.tsx");
    const readModel = read("lib/admin/revenue/read-model.ts");

    expect(page).toContain("getRevenueCommandReadModel");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("Revenue Command");
    expect(page).toContain("Money Table Health");
    expect(page).not.toContain("'use client'");
    expect(page).not.toContain("useEffect");
    expect(page).not.toContain("fetch('/api/admin/revenue')");
    expect(page).not.toContain("Use placeholder data");

    for (const table of [
      "hc_adgrid_events",
      "hc_adgrid_outcome_events",
      "hc_ad_campaigns",
      "data_purchases",
      "hc_pay_revenue",
      "hc_checkout_intents",
      "hc_abandoned_checkouts",
      "hc_billing_prices",
      "payments",
    ]) {
      expect(readModel).toContain(table);
    }

    expect(readModel).toContain("getAdgridFillYieldReadModel");
    expect(readModel).toContain("getDataProductsDashboardReadModel");
    expect(readModel).toContain("amount_usd");
    expect(readModel).toContain("price_cents");
    expect(readModel).toContain("estimated_mrr_cents");
    expect(readModel).toContain("No checkout intents are visible yet");
    expect(readModel).not.toContain("Math.random");
    expect(readModel).not.toContain("generateMock");
  });
});
