import { notFound } from "next/navigation";
import { getGlossaryTermPayload } from "@/lib/glossary/queries";
import { glossaryTermMetadata } from "@/lib/glossary/seo";
import { GlossaryTermPage } from "@/components/glossary/glossary-term-page";

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

  return (
    <main className="p-6">
      <GlossaryTermPage payload={payload} />
    </main>
  );
}
