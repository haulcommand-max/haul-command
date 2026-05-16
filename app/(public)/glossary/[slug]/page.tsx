import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EscPublicPage } from "@/components/esc/EscPublicPage";
import { JsonLd } from "@/components/seo/JsonLd";
import GlossaryPage from "@/components/surfaces/GlossaryPage";
import { ESC_GLOSSARY_PAGES, getEscGlossaryPage } from "@/lib/esc/esc-public-content";
import { getGlossaryTermPayload } from "@/lib/glossary/queries";
import { glossaryTermMetadata } from "@/lib/glossary/seo";
import { buildDefinedTermJsonLd, buildFAQPageJsonLd, buildQAPageJsonLd } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  return Object.keys(ESC_GLOSSARY_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getGlossaryTermPayload(slug);
  if (payload) {
    const isUsefulIndexableTerm =
      payload.term.featured_snippet_candidate ||
      payload.term.source_count > 0 ||
      payload.term.confidence_state === "verified";
    return {
      ...glossaryTermMetadata(payload),
      robots: isUsefulIndexableTerm ? { index: true, follow: true } : { index: false, follow: true },
    };
  }

  const page = getEscGlossaryPage(slug);
  if (!page) return {};

  return {
    title: `${page.title} | Heavy Haul Glossary | Haul Command`,
    description: page.description,
    alternates: { canonical: `https://www.haulcommand.com/glossary/${slug}` },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getGlossaryTermPayload(slug);
  if (payload) {
    const canonicalUrl = `https://www.haulcommand.com/glossary/${payload.term.slug}`;
    const directAnswer =
      payload.term.ai_answer_variant ||
      payload.term.voice_answer_variant ||
      payload.term.short_definition ||
      payload.term.plain_english ||
      "";
    const directAnswerQuestion = `What is ${payload.term.canonical_term}?`;
    const visibleFaqs = payload.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      visible: true,
    }));
    const definedTermJsonLd = buildDefinedTermJsonLd({
      url: canonicalUrl,
      term: payload.term.canonical_term,
      definition: payload.term.short_definition || payload.term.plain_english || directAnswer,
      slug: payload.term.slug,
      aliases: payload.aliases.map((alias) => alias.alias),
      definedTermSetName: "Haul Command Heavy Haul Glossary",
      definedTermSetUrl: "https://www.haulcommand.com/glossary",
    });
    const qaJsonLd = buildQAPageJsonLd({
      url: canonicalUrl,
      question: directAnswerQuestion,
      answer: directAnswer,
      visible: Boolean(directAnswer),
    });
    const faqJsonLd = buildFAQPageJsonLd({
      url: canonicalUrl,
      faqs: visibleFaqs,
    });
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.haulcommand.com" },
        { "@type": "ListItem", position: 2, name: "Glossary", item: "https://www.haulcommand.com/glossary" },
        { "@type": "ListItem", position: 3, name: payload.term.canonical_term, item: canonicalUrl },
      ],
    };
    const term = {
      canonical_term: payload.term.canonical_term,
      definition_short: payload.term.short_definition,
      definition_long: payload.term.expanded_definition || payload.term.plain_english,
      ai_snippet_answer: payload.term.ai_answer_variant || payload.term.voice_answer_variant,
      aliases_json: payload.aliases.map((alias) => alias.alias),
      ambiguity_notes_json: payload.use_cases.map((useCase) => useCase.use_case),
      country_variants_json: payload.term.overlay?.local_regulatory_note
        ? { [payload.term.overlay.country_code]: payload.term.overlay.local_regulatory_note }
        : undefined,
    };
    const links = payload.links ?? [];
    const labelFor = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <>
        <JsonLd data={[definedTermJsonLd, ...(qaJsonLd ? [qaJsonLd] : []), ...(faqJsonLd ? [faqJsonLd] : []), breadcrumbJsonLd]} />
        {directAnswer && (
          <section className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 lg:px-8" aria-labelledby="glossary-direct-answer">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <h2 id="glossary-direct-answer" className="text-base font-black text-emerald-950">
                {directAnswerQuestion}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">{directAnswer}</p>
            </div>
          </section>
        )}
        <GlossaryPage
          term={term}
          relatedEntities={[]}
          relatedServices={links
            .filter((link) => link.target_type === "service")
            .map((link) => ({ slug: link.target_id, label: link.anchor_text || labelFor(link.target_id) }))}
          relatedTools={links
            .filter((link) => link.target_type === "tool")
            .map((link) => ({ slug: link.target_id, tool_name: link.anchor_text || labelFor(link.target_id) }))}
          relatedTraining={links
            .filter((link) => link.target_type === "training")
            .map((link) => ({ slug: link.target_id, module_title: link.anchor_text || labelFor(link.target_id) }))}
          relatedRegulations={links
            .filter((link) => link.target_type === "regulation")
            .map((link) => ({ slug: link.target_id, title: link.anchor_text || labelFor(link.target_id) }))}
          renderContext={{ countryCode: payload.term.overlay?.country_code || "US" }}
        />
        {visibleFaqs.length > 0 && (
          <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8" aria-labelledby="glossary-faq">
            <h2 id="glossary-faq" className="text-lg font-bold text-neutral-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-3 space-y-3">
              {visibleFaqs.map((faq) => (
                <article key={faq.question} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-sm font-black text-neutral-900">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  const page = getEscGlossaryPage(slug);
  if (!page) notFound();

  return <EscPublicPage page={page} />;
}
