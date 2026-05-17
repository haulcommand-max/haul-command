import { describe, expect, it } from "vitest";
import { generatePageMetadata } from "@/lib/seo/metadataFactory";

describe("generatePageMetadata", () => {
  it("uses the supplied country code for OpenGraph locale", () => {
    const metadata = generatePageMetadata({
      title: "Canada Pilot Car Directory",
      description: "Source-backed Canadian heavy haul directory records.",
      canonicalPath: "/directory/ca",
      countryCode: "ca",
    });

    expect(metadata.openGraph).toMatchObject({
      locale: "en_CA",
    });
  });

  it("keeps noindex pages followable", () => {
    const metadata = generatePageMetadata({
      title: "Sparse Market",
      description: "Sparse market coverage.",
      canonicalPath: "/directory/br",
      countryCode: "br",
      noIndex: true,
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: true,
      googleBot: expect.objectContaining({
        index: false,
        follow: true,
      }),
    });
  });
});
