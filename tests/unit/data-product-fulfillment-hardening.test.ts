import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("data product fulfillment hardening", () => {
  it("does not activate paid data products without a real fulfilled asset", () => {
    const entitlements = read("lib/monetization/entitlements.ts");
    const dataCheckoutRoute = read("app/api/stripe/data-checkout/route.ts");

    expect(entitlements).toContain("data_product_fulfillment_required");
    expect(entitlements).toContain("storage_signed_url_failed");
    expect(entitlements).toContain("status: 'pending'");
    expect(entitlements).not.toContain("fulfillment_url: downloadAsset?.signedUrl || 'GENERATING'");
    expect(entitlements.indexOf("if (!downloadAsset?.signedUrl)")).toBeLessThan(entitlements.indexOf("status: 'active'"));

    expect(dataCheckoutRoute).toContain("getStripeCheckoutBlockReason");
    expect(dataCheckoutRoute).toContain("reason: blockReason");
  });
});
