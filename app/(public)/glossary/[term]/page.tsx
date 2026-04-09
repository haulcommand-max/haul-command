import { notFound } from "next/navigation";
import { getGlossaryTermPayload } from "@/lib/glossary/queries";
import { glossaryTermMetadata } from "@/lib/glossary/seo";
import { GlossaryTermPage } from "@/components/glossary/glossary-term-page";
import { createClient } from "@/utils/supabase/server";
import { buildEEATTermSchema, buildEEATFaqSchema } from "@/lib/glossary/eeat";

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("glo_terms")
    .select("slug")
    .eq("is_active", true)
    .eq("is_indexable", true)
    .order("commercial_intent_level", { ascending: false })
    .limit(500);

  return (data || []).map((term) => ({
    term: term.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  const payload = await getGlossaryTermPayload(term);

  if (!payload) {
    return {
      title: "Glossary term not found | Haul Command",
    };
  }

  return glossaryTermMetadata(payload);
}

export default async function GlossaryTermRoute({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  const payload = await getGlossaryTermPayload(term);

  if (!payload) notFound();

  const termSchema = buildEEATTermSchema({
    slug: payload.term.slug,
    canonical_term: payload.term.canonical_term,
    short_definition: payload.term.short_definition,
    expanded_definition: payload.term.expanded_definition,
    aliases: payload.aliases,
  });

  const faqSchema = buildEEATFaqSchema(payload.faqs);

  return (
    <main className="p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(termSchema),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}
      <GlossaryTermPage payload={payload} />
    </main>
  );
}
