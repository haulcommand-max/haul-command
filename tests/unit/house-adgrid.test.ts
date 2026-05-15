import { describe, expect, it } from "vitest";

import {
  HOUSE_ADS,
  buildHouseAdCreativeBrief,
  buildHouseAdTrackingTags,
  getHouseAds,
  getTopHouseAds,
  pickHouseAd,
  scoreHouseAdCreative,
} from "@/lib/ads/house-ads";

describe("Haul Command House AdGrid", () => {
  it("serves a contextual glossary house ad instead of an empty sponsor placeholder", () => {
    const ad = pickHouseAd({
      surface: "glossary.bottom.sponsor",
      placementId: "glossary-category-band",
      intent: "glossary",
    });

    expect(ad.campaign_id).toBe("house");
    expect(ad.creative_id).toBe("glossary-category-sponsor");
    expect(ad.headline).toContain("buyers learn the term");
    expect(ad.cta_text).toBe("Lock Category Sponsorship");
    expect(ad.image_url).toBe("/ads/glossary-hub-hero.png");
  });

  it("maps page intent to the right money path", () => {
    expect(pickHouseAd({ surface: "training.academy.inline" }).intent).toBe("training");
    expect(pickHouseAd({ surface: "regulations_country_us_top" }).intent).toBe("permits");
    expect(pickHouseAd({ surface: "corridor_i10_sponsor" }).intent).toBe("corridor");
    expect(pickHouseAd({ surface: "infrastructure.staging-yard" }).intent).toBe("infrastructure");
    expect(pickHouseAd({ surface: "directory_sponsor" }).intent).toBe("advertise");
  });

  it("always returns real creative with CTA, image, and house disclosure data", () => {
    const ads = getHouseAds({ surface: "tool_sponsor", limit: 4 });

    expect(ads).toHaveLength(4);
    for (const ad of ads) {
      expect(ad.campaign_id).toBe("house");
      expect(ad.headline.length).toBeGreaterThan(10);
      expect(ad.cta_url).toMatch(/^\//);
      expect(ad.image_url).toMatch(/^\/(ads|backgrounds|blog)\//);
      expect(ad.proof_label.length).toBeGreaterThan(2);
      expect(ad.visual_alt.length).toBeGreaterThan(8);
    }
  });

  it("keeps serveAds-compatible top house ads contextual", () => {
    const [ad] = getTopHouseAds(1, { surface: "loads.feed.inline", role: "broker" });

    expect(ad).toBeTruthy();
    expect(ad.campaign_id).toBe("house");
    expect(["loads", "permits", "corridor", "directory"]).toContain(ad.intent);
  });

  it("ships default house ads only when the creative score is strong enough", () => {
    for (const ad of HOUSE_ADS) {
      const score = scoreHouseAdCreative(ad, { intent: ad.intent });
      expect(score.total).toBeGreaterThanOrEqual(90);
      expect(score.context_match).toBe(20);
      expect(score.cta_strength).toBe(15);
      expect(score.compliance_accessibility).toBe(5);
    }
  });

  it("inherits global creative into country, role, page, and slot-specific copy", () => {
    const ad = pickHouseAd({
      surface: "glossary.abnormal_indivisible_load.bottom",
      placementId: "glossary-gb-ail-band",
      intent: "glossary",
      country: "GB",
      role: "pilot_car_operator",
      topic: "abnormal_indivisible_load",
      pageType: "glossary",
    });

    expect(ad.headline).toBe("Own Visibility Around AIL Search Paths");
    expect(ad.body).toContain("United Kingdom");
    expect(ad.body).toContain("AIL and movement-order support");
    expect(ad.cta_url).toContain("country=GB");
    expect(ad.cta_url).toContain("role=pilot_car_operator");
    expect(ad.cta_url).toContain("topic=abnormal_indivisible_load");
  });

  it("builds a creative factory brief with tracking and compliance metadata", () => {
    const brief = buildHouseAdCreativeBrief({
      pageType: "corridor",
      surface: "corridor.i-10.bottom",
      placementId: "corridor-i10-bottom",
      country: "US",
      corridor: "I-10",
      role: "broker",
      slotType: "bottom_band",
    });

    expect(brief.inheritance_path).toEqual([
      "global",
      "country:US",
      "role:broker",
      "page:corridor",
      "slot:corridor-i10-bottom",
    ]);
    expect(brief.image_prompt).toContain("Premium");
    expect(brief.tracking_tags.slotKey).toBe("corridor-i10-bottom");
    expect(brief.tracking_tags.corridor).toBe("I-10");
    expect(brief.desktop_variant).toContain("HTML headline overlay");
  });

  it("exposes revenue-path tracking tags for every house impression", () => {
    const ad = pickHouseAd({ surface: "training.pilot-car.inline", country: "NZ", role: "pilot_car_operator" });
    const tags = buildHouseAdTrackingTags(ad, {
      surface: "training.pilot-car.inline",
      placementId: "training-inline-1",
      country: "NZ",
      role: "pilot_car_operator",
      pageType: "training",
    });

    expect(tags.campaignId).toBe("house");
    expect(tags.creativeId).toBe(ad.creative_id);
    expect(tags.country).toBe("NZ");
    expect(tags.role).toBe("pilot_car_operator");
    expect(tags.goal).toBe(ad.goal);
    expect(tags.offerLadder).toMatch(/free_action|low_friction_paid|business_action/);
  });
});
