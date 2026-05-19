import { permanentRedirect } from "next/navigation";

export default async function DictionaryTermRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/glossary/${slug}`);
}
