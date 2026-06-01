import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("revenue and SEO activation hardening", () => {
  it("server-prices sponsor checkout and creates a pending order before Stripe redirect", () => {
    const route = read("app/api/monetization/sponsor-checkout/route.ts");
    const webhook = read("app/api/webhooks/stripe-sponsor/route.ts");
    const territoryCheckout = read("app/(public)/advertise/territory/checkout/CheckoutContent.tsx");

    expect(route).toContain("resolveSponsorCheckoutOffer");
    expect(route).toContain("offer.priceMonthly");
    expect(route).toContain(".from('sponsorship_orders'");
    expect(route).toContain("status: 'pending'");
    expect(route).toContain("sponsor_order_id");
    expect(route).toContain("ignored_client_price");
    expect(route).not.toContain("unit_amount: Math.round(priceMonthly * 100)");

    expect(webhook).toContain("pendingOrderId");
    expect(webhook).toContain("sponsor_product_key");
    expect(webhook).toContain(".update(orderPayload).eq('id', pendingOrderId)");

    expect(territoryCheckout).toContain('/api/monetization/sponsor-checkout');
    expect(territoryCheckout).toContain('zone: "territory"');
    expect(territoryCheckout).toContain("data.sessionUrl");
    expect(territoryCheckout).not.toContain('/api/adgrid/bid');
  });

  it("routes generic AdGrid checkout clicks through sponsorship orders before Stripe redirect", () => {
    const route = read("app/api/stripe/checkout/route.ts");

    expect(route).toContain("SPONSOR_PRICE_KEYS");
    expect(route).toContain("'corridor_sponsor_monthly'");
    expect(route).toContain("'territory_sponsor_monthly'");
    expect(route).toContain("'cpc_deposit'");
    expect(route).toContain("'founding_sponsor_bronze'");
    expect(route).toContain("'founding_sponsor_silver'");
    expect(route).toContain("'founding_sponsor_gold'");
    expect(route).toContain(".from('sponsorship_orders' as never)");
    expect(route).toContain("status: 'pending'");
    expect(route).toContain("sponsor_order_id: sponsorOrderId");
    expect(route).toContain("sponsor_product_key: priceKey");
    expect(route).toContain("sponsor_geo: sponsorGeo");
    expect(route).toContain("order_id: sponsorOrderId");
    expect(route).toContain("product_key: priceKey");
    expect(route).toContain("geo_key: sponsorGeo");
    expect(route).toContain("subscription_data");
    expect(route).toContain("metadata: stripeMetadata");
    expect(route).toContain("stripe_checkout_session_id: session.id");
  });

  it("accepts the newer data product purchase metadata key in the canonical entitlement engine", () => {
    const entitlements = read("lib/monetization/entitlements.ts");

    expect(entitlements).toContain("data_product_purchase");
    expect(entitlements).toContain("activateDataProduct(session)");
  });

  it("guards service-role SEO and AI image webhook write surfaces", () => {
    const internalLinks = read("app/api/v1/seo/internal-links/rebuild/route.ts");
    const altWebhook = read("app/api/webhooks/generate-alt/route.ts");

    for (const route of [internalLinks, altWebhook]) {
      expect(route).toContain("requireInternalRequest");
      expect(route).toContain("if (authFailure) return authFailure");
    }
  });
});
