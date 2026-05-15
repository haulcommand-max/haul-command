import Link from "next/link";
import type { Metadata } from "next";

import { getGlossaryCountryPayload } from "@/lib/glossary/queries";
import { glossaryCountryMetadata } from "@/lib/glossary/seo";

const SITE_URL = "https://www.haulcommand.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string }>;
}): Promise<Metadata> {
  const { countryCode } = await params;
  const payload = await getGlossaryCountryPayload(countryCode);

  if (!payload) {
    const country = countryCode.toUpperCase();
    return {
      title: `${country} Heavy Haul Glossary | Haul Command`,
      alternates: { canonical: `${SITE_URL}/glossary/country/${country.toLowerCase()}` },
      robots: { index: false, follow: true },
    };
  }

  return glossaryCountryMetadata(payload);
}

export default async function GlossaryCountryPage({
  params,
}: {
  params: Promise<{ countryCode: string }>;
}) {
  const { countryCode } = await params;
  const payload = await getGlossaryCountryPayload(countryCode);
  if (!payload) {
    const country = countryCode.toUpperCase();

    return (
      <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-gray-100">
        <section className="mx-auto max-w-4xl">
          <nav className="mb-8 text-sm font-semibold text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/glossary" className="hover:text-white">Glossary</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">{country}</span>
          </nav>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Country Terminology</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{country} Heavy Haul Glossary</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-300">
            Haul Command is tracking this country glossary, but the local terminology overlay is not deep enough to
            index yet. The page stays useful through request, correction, and claim paths while the local source work is completed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/glossary" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-black hover:bg-amber-400">
              Browse glossary
            </Link>
            <Link href={`/directory?country=${country.toLowerCase()}`} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-amber-400/50">
              Browse country directory
            </Link>
            <Link href="/claim" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-amber-400/50">
              Submit correction
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const country = payload.country_code.toUpperCase();

  return (
    <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-gray-100">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-8 text-sm font-semibold text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/glossary" className="hover:text-white">Glossary</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{country}</span>
        </nav>

        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Country Terminology</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            {country} Heavy Haul Glossary
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            Country-specific terminology, aliases, source notes, and heavy-haul language overlays for {country}. Pages
            stay indexable only when the country overlay has useful local differences and crawlable links.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payload.terms.map((term) => (
            <Link
              key={term.slug}
              href={`/glossary/country/${country.toLowerCase()}/${term.slug}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-amber-400/40"
            >
              <h2 className="text-lg font-black text-white">{term.canonical_term}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{term.short_definition}</p>
              {term.local_regulatory_note && (
                <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                  {term.local_regulatory_note}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
