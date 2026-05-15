import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getGlossaryTopicPayload } from "@/lib/glossary/queries";
import { glossaryTopicMetadata } from "@/lib/glossary/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const payload = await getGlossaryTopicPayload(categorySlug);

  if (!payload) {
    return {
      title: `${categorySlug.replace(/-/g, " ")} Glossary Category | Haul Command`,
      robots: { index: false, follow: true },
    };
  }

  return {
    ...glossaryTopicMetadata(payload),
    alternates: { canonical: `https://www.haulcommand.com/glossary/category/${payload.topic.slug}` },
  };
}

export default async function GlossaryCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const payload = await getGlossaryTopicPayload(categorySlug);
  if (!payload) notFound();

  return (
    <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-gray-100">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Glossary Category</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{payload.topic.name}</h1>
        {payload.topic.description && <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-300">{payload.topic.description}</p>}

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payload.terms.map((term) => (
            <Link
              key={term.slug}
              href={`/glossary/${term.slug}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-amber-400/40"
            >
              <h2 className="text-lg font-black text-white">{term.canonical_term}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{term.short_definition}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
