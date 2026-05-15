import Link from "next/link";
import type { Metadata } from "next";

import { getGlossaryTopicPayload } from "@/lib/glossary/queries";
import { glossaryTopicMetadata } from "@/lib/glossary/seo";

const SITE_URL = "https://www.haulcommand.com";

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const payload = await getGlossaryTopicPayload(categorySlug);

  if (!payload) {
    return {
      title: `${titleCaseSlug(categorySlug)} Glossary Category | Haul Command`,
      alternates: { canonical: `${SITE_URL}/glossary/category/${categorySlug}` },
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
  if (!payload) {
    const label = titleCaseSlug(categorySlug);

    return (
      <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-gray-100">
        <section className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Glossary Category</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{label}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-300">
            Haul Command is tracking this terminology cluster, but it does not have enough reviewed glossary entries
            to index as a full category yet. Use the glossary hub or request a directory listing while the category is
            being filled.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/glossary" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-black hover:bg-amber-400">
              Browse glossary
            </Link>
            <Link href="/directory" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-amber-400/50">
              Browse directory
            </Link>
            <Link href="/claim" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-amber-400/50">
              Claim or suggest listing
            </Link>
          </div>
        </section>
      </main>
    );
  }

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
