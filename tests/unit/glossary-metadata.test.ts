import { describe, expect, it } from "vitest";

import { glossaryTermMetadata } from "@/lib/glossary/seo";
import type { GlossaryTermPayload } from "@/lib/glossary/types";

describe("glossary metadata", () => {
  it("uses term-specific OpenGraph and Twitter metadata", () => {
    const payload = {
      term: {
        id: "term-high-pole",
        slug: "high-pole",
        canonical_term: "High Pole",
        short_definition:
          "A high pole is a non-conductive measuring pole mounted on an escort vehicle to test overhead clearance.",
        term_type: "equipment",
        commercial_intent_level: 4,
        near_me_relevance: true,
        sponsor_eligible: true,
        featured_snippet_candidate: true,
        confidence_state: "verified",
        freshness_state: "fresh",
        source_count: 2,
      },
      aliases: [],
      faqs: [],
      use_cases: [],
      sources: [],
      links: [],
      relationships: [],
      quality: {},
      metrics: {},
    } satisfies GlossaryTermPayload;

    const metadata = glossaryTermMetadata(payload);

    expect(metadata.title).toBe("High Pole Meaning | Haul Command Glossary");
    expect(metadata.openGraph).toMatchObject({
      title: "High Pole Meaning | Haul Command Glossary",
      description: payload.term.short_definition,
      url: "https://www.haulcommand.com/glossary/high-pole",
      siteName: "Haul Command",
      type: "article",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "High Pole Meaning | Haul Command Glossary",
      description: payload.term.short_definition,
    });
  });
});
