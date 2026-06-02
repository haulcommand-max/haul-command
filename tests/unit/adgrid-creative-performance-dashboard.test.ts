import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("AdGrid creative performance dashboard contract", () => {
  it("uses canonical AdGrid creative telemetry instead of the missing admin creatives API", () => {
    const page = read("app/admin/dashboards/creative-performance/page.tsx");
    const readModel = read("lib/admin/adgrid/creative-performance-read-model.ts");

    expect(page).toContain("getAdgridCreativePerformanceReadModel");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("Canonical creative telemetry");
    expect(page).toContain("activationGaps");
    expect(page).toContain("Event Backed");
    expect(page).not.toContain("'use client'");
    expect(page).not.toContain("useEffect");
    expect(page).not.toContain("useState");
    expect(page).not.toContain("/api/admin/creatives");
    expect(page).not.toContain("setCreatives");

    expect(readModel).toContain('.from("hc_ad_creatives")');
    expect(readModel).toContain('.from("hc_ad_campaigns")');
    expect(readModel).toContain('.from("hc_adgrid_impressions")');
    expect(readModel).toContain('.from("hc_adgrid_clicks")');
    expect(readModel).toContain('.from("hc_adgrid_events")');
    expect(readModel).toContain('.from("hc_adgrid_outcome_events")');
    expect(readModel).toContain("creative_or_campaign_variant_or_campaign_fallback");
    expect(readModel).toContain("No canonical AdGrid creatives exist yet");
    expect(readModel).toContain("no impression, click, conversion, or billed telemetry");
    expect(readModel).not.toContain('.from("ad_creatives")');
    expect(readModel).not.toContain(".from('ad_creatives')");
    expect(readModel).not.toContain("Math.random");
  });
});
