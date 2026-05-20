import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractTrainingCatalogRows,
  formatTrainingPrice,
  isPaidTraining,
  normalizeTrainingCatalogItem,
} from "@/lib/training/pricing";

describe("training pricing normalization", () => {
  it("formats DB cents without trusting client display strings", () => {
    expect(
      formatTrainingPrice({
        pricing_mode: "paid",
        price_cents: 29900,
        currency: "USD",
        price_display: "$1",
      }),
    ).toBe("$299");
  });

  it("keeps free catalog rows visibly free", () => {
    expect(formatTrainingPrice({ pricing_mode: "free", price_cents: 0 })).toBe("Free");
  });

  it("does not fabricate a price when paid cents are missing", () => {
    expect(formatTrainingPrice({ pricing_mode: "paid", price_cents: null })).toBe("PAID");
  });

  it("normalizes current flat RPC rows", () => {
    const rows = extractTrainingCatalogRows([
      {
        slug: "pilot-car-operator-certification",
        title: "Pilot Car Operator Certification",
        pricing_mode: "paid",
        price_cents: 29900,
        currency: "usd",
        module_count: "12",
        hours_total: "40",
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      slug: "pilot-car-operator-certification",
      price_cents: 29900,
      price_display: "$299",
      currency: "usd",
      module_count: 12,
      hours_total: 40,
    });
    expect(isPaidTraining(rows[0])).toBe(true);
  });

  it("normalizes legacy object RPC payloads during rollout", () => {
    const rows = extractTrainingCatalogRows({
      catalog: [
        {
          slug: "road-ready-basics",
          title: "Road Ready Basics",
          pricing_mode: "free",
          price_cents: 0,
        },
      ],
      levels: [],
    });

    expect(rows[0].price_display).toBe("Free");
    expect(isPaidTraining(rows[0])).toBe(false);
  });

  it("drops malformed catalog rows", () => {
    expect(normalizeTrainingCatalogItem({ title: "No slug" })).toBeNull();
    expect(normalizeTrainingCatalogItem({ slug: "no-title" })).toBeNull();
  });

  it("keeps training checkout price server-owned", () => {
    const route = readFileSync(
      join(process.cwd(), "app/api/stripe/training-checkout/route.ts"),
      "utf8",
    );

    expect(route).toContain("from('training_catalog')");
    expect(route).toContain("unit_amount: course.price_cents");
    expect(route).not.toContain("priceInCents");
    expect(route).not.toContain("courseName");
  });
});
