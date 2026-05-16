import { describe, expect, it } from "vitest";
import {
  buildLoadPreviewState,
  getProofStripItems,
  resolveAuthenticatedActor,
  resolveSponsorCheckoutOffer,
  validateDataProductFulfillment,
} from "@/lib/monetization/funnel-guards";

describe("monetization funnel guards", () => {
  it("rejects caller-supplied user ids that do not match the authenticated user", () => {
    expect(resolveAuthenticatedActor({ authUserId: null, submittedUserId: "user-2" })).toMatchObject({
      ok: false,
      status: 401,
    });

    expect(resolveAuthenticatedActor({ authUserId: "user-1", submittedUserId: "user-2" })).toMatchObject({
      ok: false,
      status: 403,
    });

    expect(resolveAuthenticatedActor({ authUserId: "user-1", submittedUserId: "user-1" })).toMatchObject({
      ok: true,
      userId: "user-1",
    });
  });

  it("requires Stripe checkout session evidence before a paid data product becomes active", () => {
    expect(validateDataProductFulfillment({ stripeSessionId: undefined, priceUsd: 49 })).toMatchObject({
      ok: false,
      status: 402,
    });

    expect(validateDataProductFulfillment({ stripeSessionId: "pi_fake", priceUsd: 49 })).toMatchObject({
      ok: false,
      status: 402,
    });

    expect(validateDataProductFulfillment({ stripeSessionId: "cs_test_123", priceUsd: 49 })).toMatchObject({
      ok: true,
    });
  });

  it("uses a server-side sponsor price catalog instead of trusting client prices", () => {
    const offer = resolveSponsorCheckoutOffer({
      zone: "corridor",
      geo: "US-TX",
      label: "Texas Corridor",
      requestedPriceMonthly: 49,
    });

    expect(offer).toMatchObject({
      ok: true,
      priceMonthly: 199,
      productKey: "corridor_sponsor_monthly",
    });
  });

  it("marks fallback load previews as sample content instead of live supply", () => {
    expect(buildLoadPreviewState({ liveCount: 0, usingFallbackRows: true })).toMatchObject({
      badge: "Sample Load Board",
      headline: "Sample Loads - Real Board Opens After Verified Posts",
      isSample: true,
    });

    expect(buildLoadPreviewState({ liveCount: 12, usingFallbackRows: false })).toMatchObject({
      badge: "Live Load Board",
      headline: "12 Loads Available Now",
      isSample: false,
    });
  });

  it("does not claim verified operators, active countries, or escrow unless evidence is supplied", () => {
    const labels = getProofStripItems({}).map((item) => item.label);
    expect(labels).toEqual(["countries indexed", "checkout-secured purchases"]);
    expect(labels).not.toContain("verified operators");
    expect(labels).not.toContain("countries active");
    expect(labels).not.toContain("protected payments");
  });
});
