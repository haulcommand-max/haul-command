import { describe, expect, it } from "vitest";
import {
  buildDefinedTermJsonLd,
  buildFAQPageJsonLd,
  buildGlossaryTermJsonLd,
  buildQAPageJsonLd,
  normalizeVisibleQaItems,
} from "@/lib/seo/jsonld";

describe("visible JSON-LD schema helpers", () => {
  it("builds DefinedTerm schema without inventing fallback text", () => {
    const schema = buildDefinedTermJsonLd({
      url: "https://www.haulcommand.com/glossary/high-pole",
      term: "High pole",
      definition: "A pilot car height survey vehicle used ahead of tall oversize loads.",
      slug: "high-pole",
      aliases: ["height pole", ""],
    });

    expect(schema).toMatchObject({
      "@type": "DefinedTerm",
      name: "High pole",
      description: "A pilot car height survey vehicle used ahead of tall oversize loads.",
      termCode: "high-pole",
      alternateName: ["height pole"],
    });
  });

  it("only emits FAQPage and QAPage from visible complete Q&A items", () => {
    const faqs = [
      { question: "What is a high pole?", answer: "It checks route clearance.", visible: true },
      { question: "Hidden question?", answer: "Hidden answer.", visible: false },
      { question: "Missing answer?", answer: "" },
    ];

    expect(normalizeVisibleQaItems(faqs)).toEqual([
      { question: "What is a high pole?", answer: "It checks route clearance." },
    ]);

    const faqSchema = buildFAQPageJsonLd({
      url: "https://www.haulcommand.com/glossary/high-pole",
      faqs,
    });

    expect(faqSchema?.["@type"]).toBe("FAQPage");
    expect(faqSchema?.mainEntity).toHaveLength(1);
    expect(JSON.stringify(faqSchema)).not.toContain("Hidden question?");

    expect(buildQAPageJsonLd({
      url: "https://www.haulcommand.com/glossary/high-pole",
      question: "What is a high pole?",
      answer: "It checks route clearance.",
      visible: true,
    })?.["@type"]).toBe("QAPage");

    expect(buildQAPageJsonLd({
      url: "https://www.haulcommand.com/glossary/high-pole",
      question: "What is a high pole?",
      answer: "It checks route clearance.",
      visible: false,
    })).toBeNull();
  });

  it("composes glossary DefinedTerm plus FAQPage only when FAQs are visible", () => {
    const schema = buildGlossaryTermJsonLd({
      url: "https://www.haulcommand.com/glossary/high-pole",
      term: "High pole",
      definition: "A pilot car height survey vehicle used ahead of tall oversize loads.",
      faq: [{ q: "What is a high pole?", a: "It checks route clearance.", visible: true }],
    }) as { definedTerm: Record<string, unknown>; faqPage: Record<string, unknown> };

    expect(schema.definedTerm["@type"]).toBe("DefinedTerm");
    expect(schema.faqPage["@type"]).toBe("FAQPage");
  });
});
