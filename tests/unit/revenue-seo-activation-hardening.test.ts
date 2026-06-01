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
    const checkoutButton = read("app/(public)/advertise/buy/CheckoutButton.tsx");

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

    expect(checkoutButton).toContain("shouldFallbackToContact");
    expect(checkoutButton).toContain("reason === 'payments_disabled'");
    expect(checkoutButton).toContain("reason === 'production_test_keys_blocked'");
  });

  it("routes AdGrid booked-slot checkout success to an existing sponsor receipt page", () => {
    const route = read("app/api/adgrid/book-slot/route.ts");

    expect(route).toContain("/sponsor/success?type=adgrid&slot=");
    expect(route).not.toContain("/advertise/success");
  });

  it("accepts the newer data product purchase metadata key in the canonical entitlement engine", () => {
    const entitlements = read("lib/monetization/entitlements.ts");

    expect(entitlements).toContain("data_product_purchase");
    expect(entitlements).toContain("activateDataProduct(session)");
  });

  it("records data product checkout intent even when Stripe is blocked", () => {
    const route = read("app/api/data/buy/route.ts");
    const stripeDataCheckout = read("app/api/stripe/data-checkout/route.ts");

    expect(route).toContain("recordCheckoutIntent");
    expect(route).toContain("getStripeCheckoutBlockReason");
    expect(route).toContain("recordDataProductCheckoutIntent");
    expect(route).toContain("checkoutUnavailableReason: stripeBlockReason");
    expect(route).toContain("productKind: 'data_product'");
    expect(route).toContain("buyerRole: 'data_buyer'");
    expect(route).toContain("checkout_intent_id: checkoutTracking.checkoutIntentId");
    expect(route).toContain("crm_opportunity_id: checkoutTracking.crmOpportunityId");
    expect(route).toContain("checkout_tracking_recorded: checkoutTracking.ok");
    expect(route).toContain("No data access was unlocked.");

    expect(stripeDataCheckout).toContain("recordCheckoutIntent");
    expect(stripeDataCheckout.indexOf("await req.json()")).toBeLessThan(
      stripeDataCheckout.indexOf("getStripeCheckoutBlockReason()"),
    );
    expect(stripeDataCheckout).toContain("sourcePath: '/api/stripe/data-checkout'");
    expect(stripeDataCheckout).toContain("checkout_unavailable_reason: blockReason");
    expect(stripeDataCheckout).toContain("checkout_intent_id: checkoutTracking.checkoutIntentId");
    expect(stripeDataCheckout).toContain("crm_opportunity_id: checkoutTracking.crmOpportunityId");
  });

  it("guards service-role SEO and AI image webhook write surfaces", () => {
    const internalLinks = read("app/api/v1/seo/internal-links/rebuild/route.ts");
    const altWebhook = read("app/api/webhooks/generate-alt/route.ts");

    for (const route of [internalLinks, altWebhook]) {
      expect(route).toContain("requireInternalRequest");
      expect(route).toContain("if (authFailure) return authFailure");
    }
  });

  it("writes payment intents to the generated hc_payment_intents schema", () => {
    const route = read("app/api/payments/intent/route.ts");

    expect(route).toContain("isEmailConfirmed(user)");
    expect(route).toContain("getStripeCheckoutBlockReason");
    expect(route).toContain("amount_cents must be an integer of at least 50");
    expect(route).toContain(".from('hc_payment_intents')");
    expect(route).toContain("amount_cents: amountCents");
    expect(route).toContain("from_entity_id: user.id");
    expect(route).toContain("to_entity_id: operatorId ?? null");
    expect(route).toContain("booking_id: bookingId ?? null");
    expect(route).toContain("stripe.paymentIntents.cancel(paymentIntent.id)");
    expect(route).not.toContain("operator_id,");
    expect(route).not.toContain("load_id,");
  });

  it("keeps NOWPayments IPN updates fail-closed and schema-safe", () => {
    const route = read("app/api/crypto/ipn/route.ts");

    expect(route).toContain("if (!signature || !verifyIPNSignature(body, signature))");
    expect(route).toContain("return NextResponse.json({ error: 'IPN record failed' }");
    expect(route).toContain(".from('hc_payment_intents')");
    expect(route).toContain(".eq('booking_id', paymentIntentKey)");
    expect(route).toContain("isUuid(paymentIntentKey)");
    expect(route).toContain("updated_at: new Date().toISOString()");
    expect(route).toContain("mergeCryptoPaymentMetadata");
    expect(route).not.toContain("paid_at:");
  });

  it("guards crypto checkout and records pending payments", () => {
    const route = read("app/api/crypto/checkout/route.ts");
    const guards = read("lib/launch/production-guards.ts");

    expect(guards).toContain("getCryptoCheckoutBlockReason");
    expect(guards).toContain("NOWPAYMENTS_API_KEY");
    expect(guards).toContain("NOWPAYMENTS_IPN_SECRET");
    expect(route).toContain("getCryptoCheckoutBlockReason");
    expect(route).toContain("isEmailConfirmed(user)");
    expect(route).toContain("amount and order_id are required");
    expect(route).toContain(".from('hc_crypto_payment')");
    expect(route).toContain("booking_id: orderId");
    expect(route).toContain("entity_id: user.id");
    expect(route).toContain("ipn_verified: false");
    expect(route).toContain("payment_rail: 'nowpayments'");
  });
});
