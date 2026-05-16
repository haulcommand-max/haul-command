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
