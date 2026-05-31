import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAdgridClickInsert,
  buildAdgridEventInsert,
  buildAdgridImpressionInsert,
  buildAdgridPlacementKey,
  creativeMatchesAdgridContext,
  normalizeAdgridCreative,
} from "@/lib/monetization/adgrid-serving";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("AdGrid serving contract", () => {
  it("logs served ads into the live hc_adgrid_impressions schema", () => {
    expect(
      buildAdgridImpressionInsert(
        {
          campaign_id: "00000000-0000-4000-8000-000000000001",
          creative_id: "00000000-0000-4000-8000-000000000002",
        },
        {
          placementKey: "directory:i-75",
          country: "US",
        },
      ),
    ).toEqual({
      table: "hc_adgrid_impressions",
      payload: {
        campaign_id: "00000000-0000-4000-8000-000000000001",
        slot_id: null,
        page_path: "directory:i-75",
        country_code: "US",
        state_code: null,
        corridor_slug: null,
        audience_role: null,
        variant: null,
      },
    });
  });

  it("builds canonical AdGrid event and click rows", () => {
    expect(
      buildAdgridEventInsert({
        eventType: "impression",
        campaignId: "not-a-uuid",
        slotId: "00000000-0000-4000-8000-000000000003",
        surface: "directory",
        countryCode: "us",
      }),
    ).toMatchObject({
      table: "hc_adgrid_events",
      payload: {
        event_type: "impression",
        campaign_id: null,
        slot_id: "00000000-0000-4000-8000-000000000003",
        surface: "directory",
        country_code: "US",
      },
    });

    expect(
      buildAdgridClickInsert(
        { campaign_id: "00000000-0000-4000-8000-000000000001", ab_variant: "A" },
        { placementKey: "directory:i-75", country: "US", referrer: "/directory" },
      ),
    ).toMatchObject({
      table: "hc_adgrid_clicks",
      payload: {
        campaign_id: "00000000-0000-4000-8000-000000000001",
        page_path: "directory:i-75",
        country_code: "US",
        variant: "A",
        referrer: "/directory",
      },
    });
  });

  it("does not try to log an impression without a campaign id", () => {
    expect(
      buildAdgridImpressionInsert(
        { creative_id: "00000000-0000-4000-8000-000000000002" },
        { placementKey: "directory:i-75", country: "US" },
      ),
    ).toBeNull();
  });

  it("normalizes creative rows without using inventory-only columns", () => {
    expect(
      normalizeAdgridCreative({
        campaign_id: "00000000-0000-4000-8000-000000000001",
        creative_id: "00000000-0000-4000-8000-000000000002",
        headline: "Claim your CommandCard",
        body: "Add proof and become routing eligible.",
        cta_label: "Claim profile",
        cta_url: "/claim",
        advertiser_name: "Haul Command",
      }),
    ).toMatchObject({
      campaign_id: "00000000-0000-4000-8000-000000000001",
      creative_id: "00000000-0000-4000-8000-000000000002",
      headline: "Claim your CommandCard",
      body: "Add proof and become routing eligible.",
      cta_label: "Claim profile",
      cta_url: "/claim",
      advertiser_name: "Haul Command",
    });
  });

  it("matches active creatives against page, country, corridor, and role context", () => {
    const creative = normalizeAdgridCreative({
      campaign_id: "00000000-0000-4000-8000-000000000001",
      creative_id: "00000000-0000-4000-8000-000000000002",
      page_types: ["directory"],
      country_slugs: ["us"],
      corridor_slugs: ["i-75"],
      service_slugs: ["pilot-car"],
    });

    expect(
      creativeMatchesAdgridContext(creative, {
        placement: "directory",
        country: "US",
        corridor: "i-75",
        role: "pilot-car",
      }),
    ).toBe(true);
    expect(creativeMatchesAdgridContext(creative, { placement: "tools", country: "US" })).toBe(false);
  });

  it("builds stable placement keys for impression logging", () => {
    expect(buildAdgridPlacementKey({ surface: "directory", corridor: "i-75" })).toBe("directory:i-75");
    expect(buildAdgridPlacementKey({ zone: "homepage_hero" })).toBe("homepage_hero");
  });

  it("preserves campaign attribution when client slots log clicks", () => {
    const slot = read("components/home/AdGridSlot.tsx");

    expect(slot).toContain("campaign_id: renderedAd.campaign_id");
    expect(slot).toContain("creative_id: renderedAd.creative_id ?? renderedAd.ad_id ?? renderedAd.id");
  });

  it("uses canonical hc_adgrid_events instead of the old adgrid_events table", () => {
    const route = read("app/api/adgrid/events/route.ts");
    const helper = read("lib/monetization/adgrid-serving.ts");

    expect(route).toContain('from(event.table)');
    expect(helper).toContain('"hc_adgrid_events"');
    expect(route).not.toContain('from("adgrid_events")');
  });

  it("keeps legacy ads click compatibility on canonical AdGrid tables", () => {
    const route = read("app/api/ads/click/route.ts");

    expect(route).toContain("hc_adgrid_events");
    expect(route).toContain("buildAdgridClickInsert");
    expect(route).not.toContain("ad_clicks");
    expect(route).not.toContain("ad_traffic_events");
  });
});
