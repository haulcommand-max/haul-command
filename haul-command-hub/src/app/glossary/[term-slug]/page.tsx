import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getGlossaryTermBySlug, getAllTermSlugs } from '@/lib/glossary-unified';
import { resolveTermSlug, isCanonicalSlug, COUNTRY_SLUG_MAP } from '@/lib/glossary-slugs';
import { COUNTRIES } from '@/lib/seo-countries';
import Navbar from '@/components/Navbar';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';

export const revalidate = 86400; // 1 day ISR

/**
 * BUILD SIZE GUARD: Only pre-render the 12 flagship terms at build time.
 * All other terms work perfectly via ISR on first visit.
 */
export async function generateStaticParams() {
  const flagshipSlugs = [
    'pilot-car', 'escort-vehicle', 'pevo', 'oversize-load', 'superload',
    'height-pole', 'route-survey', 'bridge-formula', 'wide-load',
    'overweight-load', 'deadhead', 'curfew',
  ];
  return flagshipSlugs.map(slug => ({ 'term-slug': slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'term-slug': string }>;
}): Promise<Metadata> {
  const { 'term-slug': rawSlug } = await params;
  const slug = resolveTermSlug(rawSlug);
  const term = await getGlossaryTermBySlug(slug);

  if (!term) return { title: 'Term Not Found | Haul Command' };

  const title = `${term.term} Terms, Definition, Meaning & Rules | Haul Command`;
  const description = `${(term.shortDefinition || '').substring(0, 155)}`;
  const url = `https://haulcommand.com/glossary/${slug}/`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: 'article' },
    alternates: { canonical: url },
  };
}

export default async function GlossaryTopicHubPage({
  params,
}: {
  params: Promise<{ 'term-slug': string }>;
}) {
  const { 'term-slug': rawSlug } = await params;
  const canonicalSlug = resolveTermSlug(rawSlug);

  // Redirect non-canonical slugs (underscore, jammed, etc.)
  if (rawSlug !== canonicalSlug) {
    redirect(`/glossary/${canonicalSlug}/`);
  }

  const term = await getGlossaryTermBySlug(canonicalSlug);
  if (!term) notFound();

  // Build country links for this term
  const tierACountries = COUNTRIES.filter(c => c.tier === 'A');
  const tierBCountries = COUNTRIES.filter(c => c.tier === 'B');

  const baseUrl = 'https://haulcommand.com';

  const faqs = [
    {
      question: `What does ${term.term} mean in heavy haul transport?`,
      answer: term.shortDefinition,
    },
    {
      question: `What is another name for ${term.term}?`,
      answer: term.synonyms.length > 0
        ? `${term.term} is also known as: ${term.synonyms.join(', ')}.`
        : `${term.term} is the standard industry term used across most markets.`,
    },
    {
      question: `Where is ${term.term} used?`,
      answer: term.applicableCountries.length > 0
        ? `${term.term} is used in ${term.applicableCountries.length} countries including ${term.applicableCountries.slice(0, 5).join(', ')}.`
        : `${term.term} is used globally across all heavy haul markets.`,
    },
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Haul Command', url: baseUrl },
          { name: 'Heavy Haul Glossary', url: `${baseUrl}/glossary` },
          { name: `${term.term} Terms`, url: `${baseUrl}/glossary/${canonicalSlug}/` },
        ]}
      />
      <Navbar />

      <main className="min-h-screen bg-[#0a0e17] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
            <span className="text-slate-600">/</span>
            <Link href="/glossary" className="hover:text-white transition-colors">Heavy Haul Glossary</Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">{term.term}</span>
          </nav>

          {/* Hero Article */}
          <article className="bg-[#111823] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-xl shadow-black/50">
            <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-semibold tracking-wide uppercase mb-6">
              {term.category.replace(/_/g, ' ')}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
              {term.term} <span className="text-accent">Terms and Meaning</span>
            </h1>

            {/* Quick Definition */}
            <div className="prose prose-invert prose-lg max-w-none mb-8 text-slate-300 leading-relaxed">
              <p className="text-lg">{term.shortDefinition}</p>
              {term.longDefinition && <p>{term.longDefinition}</p>}
            </div>

            {/* Why It Matters */}
            {term.whyItMatters && (
              <div className="mb-8 p-5 rounded-xl bg-accent/5 border border-accent/10">
                <h2 className="text-lg font-bold text-white mb-2">Why It Matters</h2>
                <p className="text-slate-300">{term.whyItMatters}</p>
              </div>
            )}

            {/* AKA / Variations */}
            {term.synonyms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Also Known As</h2>
                <div className="flex flex-wrap gap-2">
                  {term.synonyms.map(alias => (
                    <span key={alias} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Tools */}
            {term.relatedTools.length > 0 && (
              <div className="mb-8 border-t border-white/10 pt-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Related Tools</h2>
                <div className="flex flex-wrap gap-2">
                  {term.relatedTools.map(tool => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="px-4 py-2 bg-accent/5 hover:bg-accent/20 border border-accent/10 hover:border-accent/30 rounded-lg text-sm text-accent transition-colors"
                    >
                      {tool.name || tool.slug.replace(/-/g, ' ')} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Country Pages — Tier A */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {term.term} Rules by Country
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierACountries.map(country => {
                const countryFullSlug = COUNTRY_SLUG_MAP[country.slug];
                const localTerm = country.terms[term.category === 'vehicles' ? 'pilot_car' : 'oversize_load'] || term.term;
                return (
                  <Link
                    key={country.code}
                    href={`/glossary/${canonicalSlug}/${countryFullSlug}/`}
                    className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{country.flag}</span>
                      <span className="font-semibold text-white group-hover:text-accent transition-colors">{country.name}</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {term.term} requirements and rules in {country.name}
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* Tier B Collapsed */}
            {tierBCountries.length > 0 && (
              <details className="mt-6 bg-[#111823] border border-white/10 rounded-xl">
                <summary className="p-5 cursor-pointer text-slate-300 hover:text-white transition-colors font-semibold">
                  + {tierBCountries.length} More Countries
                </summary>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 pt-0">
                  {tierBCountries.map(country => {
                    const countryFullSlug = COUNTRY_SLUG_MAP[country.slug];
                    return (
                      <Link
                        key={country.code}
                        href={`/glossary/${canonicalSlug}/${countryFullSlug}/`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-sm text-slate-300 hover:text-white">{country.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </details>
            )}
          </section>

          {/* Related Regulations CTA */}
          <div className="mt-12 text-center bg-[#111823] border border-white/10 rounded-2xl p-8 shadow-xl shadow-black/50">
            <h2 className="text-2xl font-bold text-white mb-4">Need Regulatory Details?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/requirements" className="inline-block bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                Country Requirements →
              </Link>
              <Link href="/tools/escort-calculator" className="inline-block bg-accent text-black font-black px-6 py-3 rounded-xl hover:bg-yellow-500 transition-colors">
                Escort Calculator →
              </Link>
              <Link href="/directory" className="inline-block bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                Find Operators →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
