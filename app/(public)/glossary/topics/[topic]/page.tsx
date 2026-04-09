import { notFound } from "next/navigation";
import { getGlossaryTopicPayload } from "@/lib/glossary/queries";
import { glossaryTopicMetadata } from "@/lib/glossary/seo";
import { GlossaryTopicPage } from "@/components/glossary/glossary-topic-page";
import { createClient } from "@/utils/supabase/server";
import { buildEEATCollectionSchema } from "@/lib/glossary/eeat";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("glo_topics")
    .select("slug")
    .eq("is_active", true);

  return (data || []).map((topic) => ({
    topic: topic.slug,
  }));
}

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

  const collectionSchema = buildEEATCollectionSchema({
    name: `${payload.topic.name} Glossary`,
    description: payload.topic.description,
    url: `${SITE_URL}/glossary/topics/${payload.topic.slug}`,
    terms: payload.terms,
  });

  return (
    <main className="p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      <GlossaryTopicPage payload={payload} />
    </main>
  );
}
