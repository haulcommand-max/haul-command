import type { Metadata } from "next";
import { notFound } from "next/navigation";

import GlossaryPage from "@/components/surfaces/GlossaryPage";
import { getGlossaryTermPayload } from "@/lib/glossary/queries";
import { glossaryTermMetadata } from "@/lib/glossary/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>;
}): Promise<Metadata> {
  const { countryCode, slug } = await params;
  const payload = await getGlossaryTermPayload(slug, countryCode);

  if (!payload) {
    return {
      title: `${slug.replace(/-/g, " ")} | ${countryCode.toUpperCase()} Heavy Haul Glossary`,
      robots: { index: false, follow: true },
    };
  }

  const isIndexable = Boolean(payload.term.overlay?.is_indexable);
  return {
    ...glossaryTermMetadata(payload, [countryCode.toUpperCase()]),
    alternates: {
      canonical: `https://www.haulcommand.com/glossary/country/${countryCode.toLowerCase()}/${payload.term.slug}`,
    },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function GlossaryCountryTermPage({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>;
}) {
  const { countryCode, slug } = await params;
  const payload = await getGlossaryTermPayload(slug, countryCode);
  if (!payload) notFound();

  const links = payload.links ?? [];
  const labelFor = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <GlossaryPage
      term={{
        canonical_term: payload.term.overlay?.local_title_override || payload.term.canonical_term,
        definition_short: payload.term.short_definition,
        definition_long: payload.term.expanded_definition || payload.term.plain_english,
        ai_snippet_answer: payload.term.ai_answer_variant || payload.term.voice_answer_variant,
        aliases_json: payload.aliases.map((alias) => alias.alias),
        ambiguity_notes_json: payload.use_cases.map((useCase) => useCase.use_case),
        country_variants_json: payload.term.overlay?.local_regulatory_note
          ? { [countryCode.toUpperCase()]: payload.term.overlay.local_regulatory_note }
          : undefined,
      }}
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
      renderContext={{ countryCode: countryCode.toUpperCase() }}
    />
  );
}
