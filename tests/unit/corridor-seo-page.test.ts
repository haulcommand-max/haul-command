import { describe, expect, it } from "vitest";

import {
  buildCorridorSeoJsonLd,
  buildCorridorSeoPageModel,
  hasUsefulCorridorSeoContent,
  normalizeCorridorSeoSlug,
  parseCorridorServiceSlug,
  type CorridorSeoPageRow,
} from "@/lib/corridors/corridor-seo-page";

const baseRow: CorridorSeoPageRow = {
  id: "seo-1",
  slug: "us-tx-houston-to-tx-dallas-heavy-haul",
  title: "Houston to Dallas Heavy Haul | Haul Command",
  description: "Heavy haul route support from Houston to Dallas.",
  canonical_url: null,
  jsonld: {},
  content_blocks: {},
  lastmod: "2026-05-15",
  index_state: "noindex",
  published: false,
  country_code: "US",
  geo_key: "US:TX:houston-to-dallas",
  publish_status: "draft",
  updated_at: "2026-05-15T00:00:00.000Z",
};

describe("corridor SEO page adapter", () => {
  it("normalizes route slugs from canonical paths and URLs", () => {
    expect(normalizeCorridorSeoSlug("/corridors/us-tx-houston-to-tx-dallas-heavy-haul/")).toBe(
      "us-tx-houston-to-tx-dallas-heavy-haul",
    );
    expect(normalizeCorridorSeoSlug("https://www.haulcommand.com/corridors/us-tx-houston-to-tx-dallas-heavy-haul")).toBe(
      "us-tx-houston-to-tx-dallas-heavy-haul",
    );
  });

  it("parses seeded corridor pair slugs without inventing route facts", () => {
    expect(parseCorridorServiceSlug("us-tx-houston-to-tx-dallas-heavy-haul")).toEqual({
      countryCode: "US",
      originLabel: "Houston, TX",
      destinationLabel: "Dallas, TX",
      serviceLabel: "Heavy haul route support",
    });
  });

  it("keeps unpublished empty corridor service seeds useful but noindex", () => {
    const page = buildCorridorSeoPageModel(baseRow);

    expect(page.shouldIndex).toBe(false);
    expect(page.hasUsefulContent).toBe(false);
    expect(page.sourceConfidenceLabel).toBe("Seeded corridor page");
    expect(page.sourceConfidenceDetail).toContain("content blocks are still empty");
    expect(page.canonicalPath).toBe("/corridors/us-tx-houston-to-tx-dallas-heavy-haul");
  });

  it("uses fallback WebPage JSON-LD when seeded rows only have an empty object", () => {
    const page = buildCorridorSeoPageModel(baseRow);
    const jsonLd = buildCorridorSeoJsonLd(page);

    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Houston to Dallas Heavy Haul | Haul Command",
      url: "https://www.haulcommand.com/corridors/us-tx-houston-to-tx-dallas-heavy-haul",
      about: {
        "@type": "Service",
        name: "Heavy haul route support",
      },
    });
  });

  it("requires published index state and useful content before indexing", () => {
    const usefulContent =
      "This route support page includes source-backed corridor context, operator action guidance, permit research direction, " +
      "and concrete next steps for brokers, carriers, escorts, and advertisers without claiming unverified supply.";

    expect(hasUsefulCorridorSeoContent({ body: usefulContent })).toBe(true);

    const page = buildCorridorSeoPageModel({
      ...baseRow,
      published: true,
      index_state: "index",
      publish_status: "published",
      content_blocks: { h1: "Houston to Dallas Heavy Haul Route Support", body: usefulContent },
    });

    expect(page.shouldIndex).toBe(true);
    expect(page.h1).toBe("Houston to Dallas Heavy Haul Route Support");
    expect(page.sourceConfidenceLabel).toBe("Source-backed page");
  });
});
