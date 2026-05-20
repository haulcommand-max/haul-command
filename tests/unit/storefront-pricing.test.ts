import { describe, expect, it } from "vitest";

import {
  findStorefrontCategory,
  formatStorefrontPrice,
  groupStorefrontProducts,
  labelFromStorefrontCategorySlug,
  slugifyStorefrontCategory,
  type StorefrontProduct,
} from "@/lib/storefront/pricing";

const PRODUCTS: StorefrontProduct[] = [
  {
    product_code: "search_demand_intel_us",
    name: "Search Demand Intelligence",
    description: "Directory search demand by market.",
    product_type: "subscription",
    category: "Search Demand",
    price_cents: 9900,
    price_annual_cents: 99000,
    currency_code: "USD",
    country_codes: ["US"],
    trial_days: 14,
    stripe_payment_link_monthly_url: null,
    stripe_payment_link_annual_url: null,
    stripe_payment_link_one_time_url: null,
    preview_sample: null,
    methodology_note: "Aggregated search logs.",
    data_as_of: "2026-05-20",
    refresh_cadence: "daily",
  },
  {
    product_code: "adgrid_intent_stream",
    name: "AdGrid Intent Stream",
    description: "Ad intent events.",
    product_type: "subscription",
    category: "AdGrid",
    price_cents: 19900,
    price_annual_cents: 199000,
    currency_code: "USD",
    country_codes: ["US", "CA"],
    trial_days: null,
    stripe_payment_link_monthly_url: "https://buy.stripe.com/monthly",
    stripe_payment_link_annual_url: null,
    stripe_payment_link_one_time_url: null,
    preview_sample: null,
    methodology_note: null,
    data_as_of: null,
    refresh_cadence: "hourly",
  },
];

describe("storefront pricing contract", () => {
  it("groups products by stable category slugs", () => {
    expect(slugifyStorefrontCategory("Search Demand")).toBe("search-demand");
    expect(labelFromStorefrontCategorySlug("search-demand")).toBe("Search Demand");
    expect(groupStorefrontProducts(PRODUCTS)).toEqual([
      expect.objectContaining({ slug: "adgrid", label: "AdGrid", products: [PRODUCTS[1]] }),
      expect.objectContaining({ slug: "search-demand", label: "Search Demand", products: [PRODUCTS[0]] }),
    ]);
  });

  it("finds category pages from the same product catalog", () => {
    expect(findStorefrontCategory(PRODUCTS, "search-demand")).toMatchObject({
      label: "Search Demand",
      products: [expect.objectContaining({ product_code: "search_demand_intel_us" })],
    });
    expect(findStorefrontCategory(PRODUCTS, "missing")).toBeNull();
  });

  it("formats prices without trusting client-side checkout amounts", () => {
    expect(formatStorefrontPrice(9900, "USD")).toBe("$99");
    expect(formatStorefrontPrice(null, "USD")).toBe("Contact sales");
  });
});
