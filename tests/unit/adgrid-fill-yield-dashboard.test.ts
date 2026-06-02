import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("AdGrid fill/yield dashboard contract", () => {
  it("uses canonical AdGrid telemetry instead of placeholder zero metrics", () => {
    const page = read("app/admin/dashboards/fill-yield/page.tsx");
    const readModel = read("lib/admin/adgrid/fill-yield-read-model.ts");

    expect(page).toContain("getAdgridFillYieldReadModel");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("Real telemetry");
    expect(page).toContain("Unmeasured");
    expect(page).toContain("measurementGaps");
    expect(page).not.toContain("'use client'");
    expect(page).not.toContain("useEffect");
    expect(page).not.toContain("setFillData");
    expect(page).not.toContain("Placeholder data");
    expect(page).not.toContain("total_requests: 0");

    expect(readModel).toContain('.from("hc_adgrid_events")');
    expect(readModel).toContain('.from("hc_adgrid_outcome_events")');
    expect(readModel).toContain('.from("hc_ad_campaigns")');
    expect(readModel).toContain("event_billing_plus_outcomes_or_campaign_spend_fallback");
    expect(readModel).toContain("AdGrid request events are not being recorded yet");
    expect(readModel).not.toContain("Math.random");
  });
});
