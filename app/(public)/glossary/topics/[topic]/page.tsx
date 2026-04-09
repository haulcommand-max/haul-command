import { notFound } from "next/navigation";
import { getGlossaryTopicPayload } from "@/lib/glossary/queries";
import { glossaryTopicMetadata } from "@/lib/glossary/seo";
import { GlossaryTopicPage } from "@/components/glossary/glossary-topic-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const payload = await getGlossaryTopicPayload(topic);

  if (!payload) {
    return {
      title: "Glossary topic not found | Haul Command",
    };
  }

  return glossaryTopicMetadata(payload);
}

export default async function GlossaryTopicRoute({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const payload = await getGlossaryTopicPayload(topic);

  if (!payload) notFound();

  return (
    <main className="p-6">
      <GlossaryTopicPage payload={payload} />
    </main>
  );
}
