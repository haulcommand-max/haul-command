import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAdgridClickInsert,
  buildAdgridEventInsert,
  buildAdgridImpressionInsert,
  buildAdgridOutcomeInsert,
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

  it("builds canonical AdGrid outcome rows for conversion attribution", () => {
    expect(
      buildAdgridOutcomeInsert({
        outcomeEvent: "claim",
        campaignId: "00000000-0000-4000-8000-000000000001",
        creativeId: "not-a-uuid",
        advertiserId: "00000000-0000-4000-8000-000000000002",
        sessionId: "session-123",
        outcomeValueCents: 12900,
        billedAmountCents: 12900,
        metadata: { slot_id: "slot-123", page_type: "directory" },
      }),
    ).toEqual({
      table: "hc_adgrid_outcome_events",
      payload: {
        campaign_id: "00000000-0000-4000-8000-000000000001",
        creative_id: null,
        advertiser_id: "00000000-0000-4000-8000-000000000002",
        outcome_event: "claim",
        user_session_id: "session-123",
        user_id: null,
        attribution_window_hours: 720,
        attributed_impression_id: null,
        attributed_click_id: null,
        outcome_value_cents: 12900,
        billed_amount_cents: 12900,
        billing_status: "pending",
        metadata: { slot_id: "slot-123", page_type: "directory" },
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

  it("keeps attribution and admin reporting on canonical AdGrid tables", () => {
    const attribution = read("app/api/adgrid/attribution/route.ts");
    const adminStats = read("app/api/adgrid/admin-stats/route.ts");
    const adminCampaigns = read("app/api/adgrid/admin-campaigns/route.ts");
    const rollup = read("app/api/cron/ad-revenue-rollup/route.ts");
    const helper = read("lib/monetization/adgrid-serving.ts");

    expect(attribution).toContain("buildAdgridOutcomeInsert");
    expect(attribution).toContain("buildAdgridEventInsert");
    expect(helper).toContain('"hc_adgrid_outcome_events"');
    expect(helper).toContain('"hc_adgrid_events"');
    expect(attribution).not.toContain("adgrid_attribution");
    expect(attribution).not.toContain('from("adgrid_events")');

    for (const route of [adminStats, adminCampaigns, rollup]) {
      expect(route).toContain("hc_adgrid_events");
      expect(route).not.toContain("hc_ad_events");
      expect(route).not.toContain("fn_rollup_ad_revenue_daily");
    }
    expect(rollup).toContain("hc_revenue_daily_rollup");
  });

  it("passes slot ids through the serve route for joinable impression events", () => {
    const route = read("app/api/adgrid/serve/route.ts");

    expect(route).toContain("slotId: req.nextUrl.searchParams.get('slot_id')");
  });

  it("keeps campaign creation and Stripe fulfillment on canonical AdGrid tables", () => {
    const campaignRoute = read("app/api/adgrid/campaigns/route.ts");
    const campaignCreateRoute = read("app/api/adgrid/campaign-create/route.ts");
    const entitlementEngine = read("lib/monetization/entitlements.ts");
    const helper = read("lib/monetization/adgrid-campaigns.ts");

    for (const source of [campaignRoute, campaignCreateRoute]) {
      expect(source).toContain("ensureCanonicalAdgridAdvertiser");
      expect(source).toContain("createCanonicalAdgridCampaign");
      expect(source).toContain("createCanonicalAdgridCreative");
      expect(source).not.toContain('from("ad_campaigns")');
      expect(source).not.toContain("from('ad_campaigns')");
      expect(source).not.toContain('from("ad_creatives")');
      expect(source).not.toContain("from('ad_creatives')");
      expect(source).not.toContain('from("hc_adgrid_campaign")');
      expect(source).not.toContain("from('hc_adgrid_campaign')");
    }

    expect(helper).toContain("hc_adgrid_advertiser");
    expect(helper).toContain("hc_ad_campaigns");
    expect(helper).toContain("hc_ad_creatives");
    expect(helper).not.toContain('from("ad_campaigns")');
    expect(helper).not.toContain("from('ad_campaigns')");
    expect(helper).not.toContain('from("ad_creatives")');
    expect(helper).not.toContain("from('ad_creatives')");
    expect(helper).not.toContain('from("hc_adgrid_campaign")');
    expect(helper).not.toContain("from('hc_adgrid_campaign')");

    expect(entitlementEngine).toContain("hc_ad_campaigns");
    expect(entitlementEngine).toContain("hc_ad_creatives");
    expect(entitlementEngine).not.toContain("from('ad_campaigns')");
    expect(entitlementEngine).not.toContain("from('ad_creatives')");
  });

  it("keeps legacy ads click compatibility on canonical AdGrid tables", () => {
    const route = read("app/api/ads/click/route.ts");

    expect(route).toContain("hc_adgrid_events");
    expect(route).toContain("buildAdgridClickInsert");
    expect(route).not.toContain("ad_clicks");
    expect(route).not.toContain("ad_traffic_events");
  });

  it("keeps legacy ads serve compatibility on canonical AdGrid tables", () => {
    const route = read("app/api/ads/serve/route.ts");
    const adrank = read("lib/ads/adrank.ts");
    const slot = read("components/monetization/AdSlot.tsx");

    expect(adrank).toContain("hc_ad_creatives");
    expect(adrank).toContain("buildAdgridImpressionInsert");
    expect(adrank).toContain("buildAdgridEventInsert");
    expect(adrank).toContain("admin.from(impression.table).insert(impression.payload)");
    expect(adrank).not.toContain("from('ad_campaigns')");
    expect(adrank).not.toContain("from('ad_impressions')");
    expect(adrank).not.toContain("@/lib/enterprise/supabase/admin");

    expect(route).toContain("buildAdgridClickInsert");
    expect(route).toContain("buildAdgridEventInsert");
    expect(route).toContain("valid_campaign_id_required");
    expect(route).not.toContain("ad_click_log");
    expect(route).not.toContain("@/lib/enterprise/supabase/admin");

    expect(slot).toContain("Array.isArray(data) ? data[0] : data?.ad ?? data");
    expect(slot).toContain("campaign_id: ad.campaign_id");
    expect(slot).not.toContain("fetch(`/api/ads/click?id=");
  });
});
