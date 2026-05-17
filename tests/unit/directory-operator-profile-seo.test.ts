import { describe, expect, it } from "vitest";
import {
  buildDirectoryOperatorJsonLd,
  buildDirectoryOperatorMetadata,
  shouldIndexDirectoryOperator,
} from "@/lib/directory/operator-profile-seo";

describe("directory operator profile SEO", () => {
  it("uses a precomputed operator JSON-LD payload when the record exposes one", () => {
    const precomputed = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Atlas Pilot Cars",
    };

    expect(
      buildDirectoryOperatorJsonLd(
        {
          slug: "atlas-pilot-cars",
          name: "Atlas Pilot Cars",
          country_code: "US",
          json_ld: precomputed,
        },
        "https://www.haulcommand.com/directory/dossier/atlas-pilot-cars",
      ),
    ).toBe(precomputed);
  });

  it("builds fallback profile graph schema from real dossier fields only", () => {
    const jsonLd = buildDirectoryOperatorJsonLd(
      {
        slug: "delta-steerman-service",
        company: "Delta Steerman Service",
        city: "Tulsa",
        admin1_code: "OK",
        country_code: "US",
        rating_avg: 4.8,
        rating_count: 12,
        metadata: {
          services: ["height_pole", "route_survey"],
          phone: "555-1212",
          email: "ops@example.com",
        },
      },
      "https://www.haulcommand.com/directory/dossier/delta-steerman-service",
    );

    expect(jsonLd).toMatchObject({ "@context": "https://schema.org" });
    const graph = (jsonLd as { "@graph": Record<string, unknown>[] })["@graph"];
    expect(graph.find((item) => item["@type"] === "WebPage")).toMatchObject({
      "@id": "https://www.haulcommand.com/directory/dossier/delta-steerman-service#profile",
    });
    expect(graph.find((item) => Array.isArray(item["@type"]))).toMatchObject({
      "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
      "@id": "https://www.haulcommand.com/directory/dossier/delta-steerman-service#business",
      name: "Delta Steerman Service",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tulsa",
        addressRegion: "OK",
        addressCountry: "US",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.8,
        reviewCount: 12,
      },
    });
    expect(graph.find((item) => item["@type"] === "BreadcrumbList")).toBeTruthy();
    expect(JSON.stringify(jsonLd)).toContain("height_pole");
    expect(JSON.stringify(jsonLd)).not.toContain("555-1212");
    expect(JSON.stringify(jsonLd)).not.toContain("ops@example.com");
  });

  it("adds FAQPage JSON-LD only when requested for visible profile FAQs", () => {
    const jsonLd = buildDirectoryOperatorJsonLd(
      {
        slug: "delta-steerman-service",
        company: "Delta Steerman Service",
        city: "Tulsa",
        admin1_code: "OK",
        country_code: "US",
        metadata: { services: ["height_pole"] },
      },
      "https://www.haulcommand.com/directory/dossier/delta-steerman-service",
      { includeFaq: true },
    );

    const graph = (jsonLd as { "@graph": Record<string, unknown>[] })["@graph"];
    expect(graph.find((item) => item["@type"] === "FAQPage")).toMatchObject({
      "@id": "https://www.haulcommand.com/directory/dossier/delta-steerman-service#faq",
    });
  });

  it("noindexes thin directory operator records while preserving canonical and follow", () => {
    const thinRecord = { slug: "unknown-operator", name: "Unknown Operator" };

    expect(shouldIndexDirectoryOperator(thinRecord)).toMatchObject({
      index: false,
      reason: "missing_country",
    });
    expect(buildDirectoryOperatorMetadata(thinRecord, "unknown-operator")).toMatchObject({
      alternates: {
        canonical: "https://www.haulcommand.com/directory/dossier/unknown-operator",
      },
      robots: {
        index: false,
        follow: true,
      },
    });
  });
});
