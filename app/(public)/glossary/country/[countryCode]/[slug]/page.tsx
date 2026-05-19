import type { Metadata } from "next";
import Link from "next/link";

import GlossaryPage from "@/components/surfaces/GlossaryPage";
import { getGlossaryTermPayload } from "@/lib/glossary/queries";
import { glossaryCountryTermAlternates, glossaryTermMetadata } from "@/lib/glossary/seo";

const SITE_URL = "https://www.haulcommand.com";

function labelFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>;
}): Promise<Metadata> {
  const { countryCode, slug } = await params;
  const payload = await getGlossaryTermPayload(slug, countryCode);

  if (!payload) {
    const country = countryCode.toUpperCase();
    return {
      title: `${labelFromSlug(slug)} | ${country} Heavy Haul Glossary`,
      alternates: { canonical: `${SITE_URL}/glossary/country/${country.toLowerCase()}/${slug}` },
      robots: { index: false, follow: true },
    };
  }

  const isIndexable = Boolean(payload.term.overlay?.is_indexable);
  return {
    ...glossaryTermMetadata(payload, [countryCode.toUpperCase()]),
    alternates: glossaryCountryTermAlternates(payload.term.slug, countryCode),
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
  if (!payload) {
    const country = countryCode.toUpperCase();
    const label = labelFromSlug(slug);

    return (
      <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-gray-100">
        <section className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Country Glossary Term</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{label} in {country}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-300">
            This country-specific term page is tracked, but the local overlay is not verified enough to index. Haul
            Command keeps the path live so operators, authorities, and providers can submit corrections and build the
            local terminology record.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/glossary/${slug}`} className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-black hover:bg-amber-400">
              View base term
            </Link>
            <Link href={`/glossary/country/${country.toLowerCase()}`} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-amber-400/50">
              Browse {country} glossary
            </Link>
            <Link href="/claim" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-amber-400/50">
              Submit correction
            </Link>
          </div>
        </section>
      </main>
    );
  }

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
